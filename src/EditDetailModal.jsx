import { useState } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent, departmentColors } from './mapTaskToEvent';
import TaskForm from './TaskForm';
import { recordDiagnostic, serializeError } from './diagnostics';

export default function EditDetailModal({
  event,
  showModal,
  setShowModal,
  formData,
  setFormData,
  setEvents,
  onDelete,
  mapTaskToEvent: mapTaskToEventProp,
  customerOptions
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!showModal || !event) return null;

  const props = event.extendedProps || {};

  function handleClose() {
    setIsEditing(false);
    setShowModal(false);
  }

  function closeAndReset() {
    setIsEditing(false);
    setShowModal(false);
  }

  function handleCancelEdit() {
    setFormData({
      customer: props.customer || '',
      unit: props.unit || '',
      phone: props.phone || '',
      service_date: event.startStr || '',
      status: props.status || '',
      priority: props.priority || 'scheduled',
      department: props.department || [],
      complaint: props.complaint || '',
    });
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    const startedAt = performance.now();
    const requestId = recordDiagnostic('task_delete_started', { taskId: String(event.id) }, 'warn');
    const { error } = await supabase.from('tasks').delete().eq('id', event.id);
    if (error) {
      console.error(error);
      recordDiagnostic('task_delete_failed', {
        requestId,
        taskId: String(event.id),
        durationMs: Math.round(performance.now() - startedAt),
        error: serializeError(error),
      }, 'error');
      return;
    }
    if (onDelete) {
      onDelete(event.id);
    } else {
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }
    recordDiagnostic('task_delete_succeeded', {
      requestId,
      taskId: String(event.id),
      durationMs: Math.round(performance.now() - startedAt),
    }, 'warn');
    closeAndReset();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const startedAt = performance.now();
    const requestId = recordDiagnostic('task_update_started', {
      taskId: String(event.id),
      changedFields: Object.keys(formData),
      status: formData.status,
      serviceDate: formData.service_date,
      departments: formData.department,
    });
    const department = formData.department.length ? formData.department : ['unassigned'];
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...formData, department })
      .eq('id', event.id)
      .select();

    if (error) {
      console.error(error);
      recordDiagnostic('task_update_failed', {
        requestId,
        taskId: String(event.id),
        durationMs: Math.round(performance.now() - startedAt),
        error: serializeError(error),
      }, 'error');
      return;
    }

    const updatedTask = data[0];
    if (!updatedTask) {
      recordDiagnostic('task_update_failed', {
        requestId,
        taskId: String(event.id),
        durationMs: Math.round(performance.now() - startedAt),
        error: { message: 'Update returned no task row.' },
      }, 'error');
      return;
    }
    const updatedEvent = (mapTaskToEventProp || mapTaskToEvent)(updatedTask);

    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    recordDiagnostic('task_update_succeeded', {
      requestId,
      taskId: String(updatedTask.id),
      durationMs: Math.round(performance.now() - startedAt),
      status: updatedTask.status,
      serviceDate: updatedTask.service_date,
      departments: updatedTask.department,
    });
    closeAndReset();
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
            customerOptions={customerOptions}
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
                <span className="task-detail-label">Phone</span>
                <span className="task-detail-value">{props.phone}</span>
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
                <span className="task-detail-label">Priority</span>
                <span className="task-detail-value">{(props.priority || 'scheduled').replace('_', ' ')}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Department</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(Array.isArray(props.department) ? props.department : [props.department]).filter(Boolean).map(dept => (
                    <span
                      key={dept}
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        backgroundColor: departmentColors[dept] || '#999',
                        color: 'white',
                      }}
                    >
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
              <div className="task-detail-row task-detail-row--complaint">
                <span className="task-detail-label">Complaint</span>
                <span className="task-detail-value task-detail-value--complaint">{props.complaint}</span>
              </div>
            </div>
            {props.created_by && (
              <div className="task-detail-created-by">
                Created by {props.created_by}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
