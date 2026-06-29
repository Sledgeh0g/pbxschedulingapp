import { useState } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';
import TaskForm from './TaskForm';

export default function AddTaskModal({ setEvents, showModal, setShowModal, mapTaskToEvent: mapTaskToEventProp }) {
    const [form, setForm] = useState({
        customer: '',
        unit: '',
        service_date: '',
        status: 'Queued',
        priority: 'scheduled',
        department: '',
        complaint: '',
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('tasks')
            .insert([{ ...form, created_by: user?.email || '' }])
            .select();
        if (error) { console.error(error); return; }
        const t = data[0];
        const newEvent = (mapTaskToEventProp || mapTaskToEvent)(t);
        setEvents(prev => [...prev, newEvent]);
        setShowModal(false);
        setForm({ customer: '', unit: '', service_date: '', status: '', priority: 'scheduled', department: '', complaint: '' });
    }

    return (
        <>
            {showModal && (
                <div 
                    className="modal-backdrop"
                    onClick={() => setShowModal(false)}
                >
                    <div 
                        className="addModal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span 
                            className="modal-close" 
                            onClick={() => setShowModal(false)}
                            aria-label="Close modal"
                        >
                            ×
                        </span>

                        <TaskForm
                            form={form}
                            setForm={setForm}
                            onSubmit={handleSubmit}
                            onCancel={() => setShowModal(false)}
                            title="Add Task"
                            submitLabel="Save"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
