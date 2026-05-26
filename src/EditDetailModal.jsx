import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function EditDetailModal({ event, setEvents, showModal, setShowModal}) {
    const [form, setForm] = useState({
        customer: "",
        unit: "",
        service_date: "",
        status: "",
        department: ""
    })
         
    if (!showModal) return null;
    return (
        <div className="modal">
            <h2>Task Details</h2>
            <p><strong>Customer</strong>{event.extendedProps.customer}</p>
            <p><strong>Unit</strong>{event.extendedProps.unit}</p>
            <p><strong>Service Date</strong>{event.startStr}</p>
            <p><strong>Status</strong>{event.extendedProps.status}</p>
            <p><strong>Department</strong>{event.extendedProps.department}</p>
            <button type="button" onClick={() => setShowModal(false)}>Close</button>
        </div>
    );
}