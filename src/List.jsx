import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import AddTaskModal from './AddTaskModal';
import EditDetailModal from './EditDetailModal';
import SearchInput from './SearchInput';
import DepartmentSelect from './DepartmentSelect';

export default function List({ events, setEvents, searchTerm, setSearchTerm, mapTaskToEvent,
    selectedDepartment, setSelectedDepartment,
    formData, setFormData,
    selectedEvent, setSelectedEvent,
    showDetailModal, setShowDetailModal }) {
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
            <AddTaskModal setEvents={setEvents} showModal={showModal} setShowModal={setShowModal} mapTaskToEvent={mapTaskToEvent} />
            <EditDetailModal 
                event={selectedEvent} 
                showModal={showDetailModal} 
                setShowModal={setShowDetailModal}
                formData={formData}
                setFormData={setFormData}
                setEvents={setEvents}
                mapTaskToEvent={mapTaskToEvent}
            />
            <FullCalendar
                plugins={[listPlugin, interactionPlugin]}
                initialView="listWeek"
                eventOrder="created_at"
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
            />
        </div>
    );
};
