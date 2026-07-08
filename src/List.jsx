import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import { eventOrderComparator, departmentDotColors } from './mapTaskToEvent';
import AddTaskModal from './AddTaskModal';
import EditDetailModal from './EditDetailModal';
import SearchInput from './SearchInput';
import DepartmentSelect from './DepartmentSelect';

export default function List({ events, setEvents, searchTerm, setSearchTerm, mapTaskToEvent,
    selectedDepartment, setSelectedDepartment,
    formData, setFormData,
    selectedEvent, setSelectedEvent,
    showDetailModal, setShowDetailModal,
    customerOptions }) {
    const [showModal, setShowModal] = useState(false);

    async function handleEventDrop({ event }) {
        await supabase
            .from('tasks')
            .update({ service_date: event.startStr })
            .eq('id', event.id);
        setEvents(prev => prev.map(e =>
            e.id === event.id ? { ...e, start: event.startStr } : e
        ));
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
                plugins={[listPlugin, interactionPlugin]}
                initialView="listWeek"
                eventOrder={eventOrderComparator}
                headerToolbar={{
                    left: 'prev,next addTask',
                    center: 'title',
                    right: 'listDay,listWeek,listMonth'
                }}
                customButtons={{
                    addTask: {
                        text: '+ Add ',
                        click: () => setShowModal(true)
                    }
                }}
                buttonText={{
                    listDay: 'Day',
                    listWeek: 'Week',
                    listMonth: 'Month'
                }}
                allDayText=""
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
                            <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '8px' }}>
                                {departments.map(dept => {
                                    const dotColor = departmentDotColors[dept];
                                    return dotColor ? (
                                        <span key={dept} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                                            <span style={{
                                                display: 'block',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: dotColor,
                                                flexShrink: 0,
                                            }} />
                                            {dept}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    );
                }}
            />
        </div>
    );
};
