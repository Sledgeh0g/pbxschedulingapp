import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import { eventOrderComparator, departmentDotColors, departmentIcons } from './mapTaskToEvent';
import AddTaskModal from './AddTaskModal';
import EditDetailModal from './EditDetailModal';
import { recordDiagnostic, serializeError } from './diagnostics';

export default function Calendar({ events, setEvents, mapTaskToEvent,
    formData, setFormData,
    selectedEvent, setSelectedEvent,
    showDetailModal, setShowDetailModal,
    customerOptions }) {
    const [showModal, setShowModal] = useState(false);

    async function handleEventDrop({ event, revert }) {
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

    function handleEventClick({event}) {
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
                events={events}
                editable={true}
                eventDrop={handleEventDrop}
                eventClick={handleEventClick}
                eventContent={(info) => {
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
