import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import { eventOrderComparator, departmentDotColors, departmentIcons } from './mapTaskToEvent';
import AddTaskModal from './AddTaskModal';
import EditDetailModal from './EditDetailModal';
import OverflowChip from './OverflowChip';
import { applyDayEventCap, isOverflowEvent } from './applyEventCap';
import { DAY_CAP } from './constants';
import { toDateStr } from './dateRange';
import { recordDiagnostic, serializeError } from './diagnostics';

export default function Calendar({ events, setEvents, mapTaskToEvent,
    formData, setFormData,
    selectedEvent, setSelectedEvent,
    showDetailModal, setShowDetailModal,
    customerOptions,
    searchTerm,
    onVisibleRangeChange }) {
    const [showModal, setShowModal] = useState(false);
    const [expandedDates, setExpandedDates] = useState(() => new Set());
    const [viewId, setViewId] = useState('dayGridWeek');
    const overflowSignatureRef = useRef('');

    const cappedEvents = applyDayEventCap(events, {
        cap: DAY_CAP,
        expandedDates,
        searchActive: Boolean(searchTerm),
    });

    useEffect(() => {
        const overflows = cappedEvents.filter(event =>
            isOverflowEvent(event) && !event.extendedProps?.expanded
        );
        const signature = overflows
            .map(event => `${event.extendedProps.overflowDate}:${event.extendedProps.hiddenCount}`)
            .sort()
            .join(',');
        if (signature === overflowSignatureRef.current) return;
        overflowSignatureRef.current = signature;
        for (const event of overflows) {
            recordDiagnostic('day_cap_overflow_shown', {
                date: event.extendedProps.overflowDate,
                hiddenCount: event.extendedProps.hiddenCount,
                viewId,
            });
        }
    }, [cappedEvents, viewId]);

    function handleDatesSet(info) {
        const range = {
            start: toDateStr(info.startStr),
            end: toDateStr(info.endStr),
            viewId: info.view.type,
        };
        setViewId(range.viewId);
        setExpandedDates(new Set());
        overflowSignatureRef.current = '';
        onVisibleRangeChange?.(range);
    }

    function toggleDay(date, hiddenCount, expanding) {
        setExpandedDates(prev => {
            const next = new Set(prev);
            if (next.has(date)) next.delete(date);
            else next.add(date);
            return next;
        });
        recordDiagnostic(expanding ? 'day_cap_expanded' : 'day_cap_collapsed', {
            date,
            hiddenCount,
            viewId,
        });
    }

    async function handleEventDrop({ event, revert }) {
        if (isOverflowEvent(event)) {
            revert();
            return;
        }
        const startedAt = performance.now();
        const requestId = recordDiagnostic('task_reschedule_started', {
            taskId: String(event.id),
            serviceDate: event.startStr,
            view: 'calendar',
        });
        const { error } = await supabase
            .from('tasks')
            .update({ service_date: event.startStr })
            .eq('id', event.id);
        if (error) {
            console.error(error);
            revert();
            recordDiagnostic('task_reschedule_failed', {
                requestId,
                taskId: String(event.id),
                durationMs: Math.round(performance.now() - startedAt),
                error: serializeError(error),
            }, 'error');
            return;
        }
        setEvents(prev => prev.map(e =>
            e.id === event.id ? { ...e, start: event.startStr } : e
        ));
        recordDiagnostic('task_reschedule_succeeded', {
            requestId,
            taskId: String(event.id),
            durationMs: Math.round(performance.now() - startedAt),
            serviceDate: event.startStr,
            view: 'calendar',
        });
    }

    function handleEventClick({ event }) {
        if (isOverflowEvent(event)) {
            toggleDay(
                event.extendedProps.overflowDate,
                event.extendedProps.hiddenCount,
                !event.extendedProps.expanded
            );
            return;
        }
        setSelectedEvent(event);
        setShowDetailModal(true);
    }

    return (
        <div className="calendar">
            <AddTaskModal setEvents={setEvents} showModal={showModal} setShowModal={setShowModal} mapTaskToEvent={mapTaskToEvent} customerOptions={customerOptions} />
            <EditDetailModal
                event={selectedEvent}
                showModal={showDetailModal}
                setShowModal={setShowDetailModal}
                formData={formData}
                setFormData={setFormData}
                setEvents={setEvents}
                mapTaskToEvent={mapTaskToEvent}
                customerOptions={customerOptions}
            />
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridWeek"
                eventOrder={eventOrderComparator}
                headerToolbar={{
                    left: 'prev,next addTask',
                    center: 'title',
                    right: 'dayGridDay,dayGridWeek,dayGridMonth'
                }}
                customButtons={{
                    addTask: {
                        text: '+ Add ',
                        click: () => setShowModal(true)
                    }
                }}
                events={cappedEvents}
                editable={true}
                eventAllow={(_dropInfo, dragged) => !isOverflowEvent(dragged)}
                eventDrop={handleEventDrop}
                eventClick={handleEventClick}
                datesSet={handleDatesSet}
                eventContent={(info) => {
                    if (isOverflowEvent(info.event)) {
                        return <OverflowChip event={info.event} />;
                    }
                    const departments = Array.isArray(info.event.extendedProps.department)
                        ? info.event.extendedProps.department
                        : [];
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minWidth: 0, overflow: 'hidden', padding: '0 2px' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{info.event.title}</span>
                            <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginLeft: '4px' }}>
                                {departments.map(dept => {
                                    const icon = departmentIcons[dept];
                                    if (icon) {
                                        return (
                                            <span key={dept} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                border: '1.5px solid #4b5563',
                                                color: '#4b5563',
                                                fontSize: '9px',
                                                lineHeight: 1,
                                                fontWeight: 'bold',
                                                flexShrink: 0,
                                            }}>{icon}</span>
                                        );
                                    }
                                    const dotColor = departmentDotColors[dept];
                                    return dotColor ? (
                                        <span key={dept} style={{
                                            display: 'block',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            border: '2px solid white',
                                            backgroundColor: dotColor,
                                            flexShrink: 0,
                                        }} />
                                    ) : null;
                                })}
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    )
}
