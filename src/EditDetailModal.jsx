import { useState } from 'react';
import { supabase } from './supabaseClient';
import { mapTaskToEvent, departmentColors, PRIORITY_LABELS } from './mapTaskToEvent';
import TaskForm from './TaskForm';
import ComplaintExpandModal, { ComplaintExpandButton } from './ComplaintExpandModal';
import { recordDiagnostic, serializeError } from './diagnostics';
import { formatAuthorizedEstimate, parseAuthorizedEstimate } from './formatAuthorizedEstimate';

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
  const [expandOpen, setExpandOpen] = useState(false);

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
      authorized_estimate: formatAuthorizedEstimate(props.authorized_estimate),
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

  async function persistTask(snapshot) {
    const startedAt = performance.now();
    const requestId = recordDiagnostic('task_update_started', {
      taskId: String(event.id),
      changedFields: Object.keys(snapshot),
      status: snapshot.status,
      serviceDate: snapshot.service_date,
      departments: snapshot.department,
    });
    const department = snapshot.department.length ? snapshot.department : ['unassigned'];
    const { authorized_estimate, ...rest } = snapshot;
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...rest, department, authorized_estimate: parseAuthorizedEstimate(authorized_estimate) })
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
      return false;
    }

    const updatedTask = data[0];
    if (!updatedTask) {
      recordDiagnostic('task_update_failed', {
        requestId,
        taskId: String(event.id),
        durationMs: Math.round(performance.now() - startedAt),
        error: { message: 'Update returned no task row.' },
      }, 'error');
      return false;
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
    return true;
  }

  async function handleSubmit(e, snapshot = formData) {
    e.preventDefault();
    await persistTask(snapshot);
  }

  async function handleDetailExpandSave(text) {
    await persistTask({
      customer: props.customer || '',
      unit: props.unit || '',
      phone: props.phone || '',
      service_date: event.startStr || '',
      status: props.status || '',
      priority: props.priority || 'scheduled',
      department: props.department || [],
      complaint: text,
      authorized_estimate: formatAuthorizedEstimate(props.authorized_estimate),
    });
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="editModal" onClick={(e) => e.stopPropagation()}>
        {isEditing && (
          <span className="modal-close" onClick={handleClose} aria-label="Close modal">×</span>
        )}

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
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={handleDelete}
                  aria-label="Delete task"
                  type="button"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close modal"
                >
                  ×
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
                <span className="task-detail-label">Authorized Estimate</span>
                <span className="task-detail-value">{formatAuthorizedEstimate(props.authorized_estimate)}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Status</span>
                <span className="task-detail-value">{props.status}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Priority</span>
                <span className="task-detail-value">{PRIORITY_LABELS[props.priority] || props.priority || 'scheduled'}</span>
              </div>
              <div className="task-detail-row">
                <span className="task-detail-label">Department</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {(Array.isArray(props.department) ? props.department : [props.department]).filter(Boolean).map(dept => (
                    <span
                      key={dept}
                      style={{
                        display: 'inline-block',
                        padding: '1px 7px',
                        borderRadius: 0,
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
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
                <div className="task-detail-complaint-box">
                  <span className="task-detail-value task-detail-value--complaint">{props.complaint}</span>
                  <ComplaintExpandButton onClick={() => setExpandOpen(true)} />
                </div>
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
      {expandOpen && !isEditing && (
        <ComplaintExpandModal
          value={props.complaint}
          onSave={handleDetailExpandSave}
          onCancel={() => setExpandOpen(false)}
        />
      )}
    </div>
  );
}
