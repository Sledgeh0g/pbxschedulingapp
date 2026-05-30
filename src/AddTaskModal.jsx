import { useState } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';

export default function AddTaskModal({ setEvents, showModal, setShowModal, mapTaskToEvent: mapTaskToEventProp }) {
    const [form, setForm] = useState({
        customer: '',
        unit: '',
        service_date: '',
        status: '',
        department: '',
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const { data, error } = await supabase
            .from('tasks')
            .insert([form])
            .select();
        if (error) { console.error(error); return; }
        const t = data[0];
        const newEvent = (mapTaskToEventProp || mapTaskToEvent)(t);
        setEvents(prev => [...prev, newEvent]);
        setShowModal(false);
        setForm({ customer: '', unit: '', service_date: '', status: '', department: '' });
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

                        <form onSubmit={handleSubmit}>
                            <h2>Add Task</h2>

                            <input 
                                placeholder="Customer" 
                                value={form.customer}
                                onChange={e => setForm({...form, customer: e.target.value})} 
                                required 
                            />
                            <input 
                                placeholder="Unit" 
                                value={form.unit}
                                onChange={e => setForm({...form, unit: e.target.value})} 
                                required 
                            />
                            <input 
                                type="date" 
                                value={form.service_date}
                                onChange={e => setForm({...form, service_date: e.target.value})} 
                                required 
                            />
                            <select 
                                value={form.status}
                                onChange={e => setForm({...form, status: e.target.value})} 
                                required
                            >
                                <option value="">Select Status</option>
                                <option value="queued">Queued</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                                <option value="waiting">Waiting</option>
                            </select>
                            <select 
                                value={form.department}
                                onChange={e => setForm({...form, department: e.target.value})} 
                                required
                            >
                                <option value="">Select Department</option>
                                <option value="warranty">Warranty</option>
                                <option value="wash bay">Wash Bay</option>
                                <option value="welding">Welding</option>
                                <option value="body shop">Body Shop</option>
                                <option value="old shop">Old Shop</option>
                                <option value="new shop">New Shop</option>
                            </select>

                            <div className="modal-buttons">
                                <button type="submit">Save</button>
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
