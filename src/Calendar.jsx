import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from './supabaseClient';
import AddTaskModal from './AddTaskModal';
import EditDetailModal from './EditDetailModal';

export default function Calendar({ events, setEvents }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

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
            <AddTaskModal setEvents={setEvents} showModal={showModal} setShowModal={setShowModal} />
            <EditDetailModal event={selectedEvent} setEvents={setEvents} showModal={showDetailModal} setShowModal={setShowDetailModal} />
            <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridWeek"
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
            />
        </div>
    )
}
