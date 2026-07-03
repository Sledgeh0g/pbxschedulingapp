import { departmentColors } from './mapTaskToEvent';

const DEPARTMENTS = [
  { value: 'warranty',  label: 'Warranty' },
  { value: 'wash bay',  label: 'Wash Bay' },
  { value: 'welding',   label: 'Welding' },
  { value: 'body shop', label: 'Body Shop' },
  { value: 'old shop',  label: 'Old Shop' },
  { value: 'new shop',  label: 'New Shop' },
  { value: 'triage',    label: 'Triage' },
];

export default function TaskForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  title = "Add Task",
  submitLabel = "Save",
  buttonsAlign = "center"
}) {
  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const currentDepts = Array.isArray(form.department) ? form.department : [];

  function toggleDept(value) {
    setForm({
      ...form,
      department: currentDepts.includes(value)
        ? currentDepts.filter(d => d !== value)
        : [...currentDepts, value],
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <h2>{title}</h2>

      <input
        placeholder="Customer"
        value={form.customer}
        onChange={handleChange('customer')}
        required
      />
      <input
        placeholder="Unit"
        value={form.unit}
        onChange={handleChange('unit')}
        required
      />
      <input
        type="date"
        value={form.service_date}
        onChange={handleChange('service_date')}
        required
      />
      <textarea
        className="complaint-textarea"
        placeholder="Complaint"
        value={form.complaint || ''}
        onChange={handleChange('complaint')}
        onInput={e => {
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />
      <select
        value={form.status}
        onChange={handleChange('status')}
      >
        <option value="">Select Status</option>
        <option value="queued">Queued</option>
        <option value="completed">Completed</option>
      </select>
      <select
        value={form.priority}
        onChange={handleChange('priority')}
        required
      >
        <option value="">Select Priority</option>
        <option value="scheduled">Scheduled</option>
        <option value="end_of_day">End of Day</option>
        <option value="urgent">Urgent</option>
      </select>

      <div className="dept-form-chips">
        {DEPARTMENTS.map(({ value, label }) => {
          const selected = currentDepts.includes(value);
          const color = departmentColors[value];
          return (
            <button
              key={value}
              type="button"
              className="dept-form-chip"
              style={{
                backgroundColor: selected ? color : 'transparent',
                borderColor: color,
                color: selected ? 'white' : color,
              }}
              onClick={() => toggleDept(value)}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        className="modal-buttons"
        style={buttonsAlign === 'right' ? { justifyContent: 'flex-end' } : {}}
      >
        <button type="submit">{submitLabel}</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
