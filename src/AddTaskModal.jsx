import { useState } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';
import TaskForm from './TaskForm';
import { recordDiagnostic, serializeError } from './diagnostics';
import { parseAuthorizedEstimate } from './formatAuthorizedEstimate';

export default function AddTaskModal({ setEvents, showModal, setShowModal, mapTaskToEvent: mapTaskToEventProp, customerOptions }) {
    const [form, setForm] = useState({
        customer: '',
        unit: '',
        phone: '',
        service_date: '',
        status: 'queued',
        priority: 'scheduled',
        department: ['unassigned'],
        complaint: '',
        authorized_estimate: '$0.00',
    });

    async function handleSubmit(e) {
        e.preventDefault();
        const startedAt = performance.now();
        const requestId = recordDiagnostic('task_create_started', {
            status: form.status,
            serviceDate: form.service_date,
            departments: form.department,
        });
        const { data: { user } } = await supabase.auth.getUser();
        const department = form.department.length ? form.department : ['unassigned'];
        const { authorized_estimate, ...rest } = form;
        const { data, error } = await supabase
            .from('tasks')
            .insert([{ ...rest, department, authorized_estimate: parseAuthorizedEstimate(authorized_estimate), created_by: user?.email || '' }])
            .select();
        if (error) {
            console.error(error);
            recordDiagnostic('task_create_failed', {
                requestId,
                durationMs: Math.round(performance.now() - startedAt),
                error: serializeError(error),
            }, 'error');
            return;
        }
        const t = data[0];
        const newEvent = (mapTaskToEventProp || mapTaskToEvent)(t);
        setEvents(prev => [...prev, newEvent]);
        recordDiagnostic('task_create_succeeded', {
            requestId,
            durationMs: Math.round(performance.now() - startedAt),
            taskId: String(t.id),
            status: t.status,
            serviceDate: t.service_date,
            departments: t.department,
        });
        setShowModal(false);
        setForm({ customer: '', unit: '', phone: '', service_date: '', status: 'queued', priority: 'scheduled', department: ['unassigned'], complaint: '', authorized_estimate: '$0.00' });
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
                            customerOptions={customerOptions}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
