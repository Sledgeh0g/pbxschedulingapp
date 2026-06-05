import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';
import TaskForm from './TaskForm';

export default function EditDetailModal({
  event,
  showModal,
  setShowModal,
  formData,
  setFormData,
  setEvents,
  onDelete,
  mapTaskToEvent: mapTaskToEventProp
}) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!showModal) setIsEditing(false);
  }, [showModal]);

  if (!showModal || !event) return null;

  const props = event.extendedProps || {};

  function handleClose() {
    setShowModal(false);
  }

  function handleCancelEdit() {
    setFormData({
      customer: props.customer || '',
      unit: props.unit || '',
      service_date: event.startStr || '',
      status: props.status || '',
      department: props.department || '',
      complaint: props.complaint || '',
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', event.id);
    if (error) { console.error(error); return; }
    if (onDelete) {
      onDelete(event.id);
    } else {
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }
    setShowModal(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { data, error } = await supabase
      .from('tasks')
      .update(formData)
      .eq('id', event.id)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    const updatedTask = data[0];
    const updatedEvent = (mapTaskToEventProp || mapTaskToEvent)(updatedTask);

    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    setShowModal(false);
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="editModal" onClick={(e) => e.stopPropagation()}>
        <span className="modal-close" onClick={handleClose} aria-label="Close modal">×</span>

        {isEditing ? (
          <TaskForm
            form={formData}
            setForm={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancelEdit}
            title="Edit Task"
            submitLabel="Save Changes"
            buttonsAlign="right"
          />
        ) : (
          <div className="task-detail-view">
            <div className="task-detail-header">
              <h2>Task Details</h2>
              <div className="task-detail-actions">
                <button
                  className="edit-pencil-btn"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit task"
                  type="button"
                >
                  ✎
                </button>
                <button
                  className="delete-btn"
                  onClick={handleDelete}
                  aria-label="Delete task"
                  type="button"
                >
                  🗑
                </button>
              </div>
            </div>
            <div className="task-detail-fields">
              <div className="task-detail-row">
                <span className="task-detail-label">Customer</span>
                <span className="task-detail-value">{props.customer}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Unit</span>
                <span className="task-detail-value">{props.unit}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Date</span>
                <span className="task-detail-value">{event.startStr}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Status</span>
                <span className="task-detail-value">{props.status}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Department</span>
                <span className="task-detail-value">{props.department}</span>
              </div>
              <div className="task-detail-row task-detail-row--complaint">
                <span className="task-detail-label">Complaint</span>
                <span className="task-detail-value task-detail-value--complaint">{props.complaint}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}