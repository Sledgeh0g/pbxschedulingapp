import { useRef, useState } from 'react';
import { PRIORITY_LABELS, departmentColors, departmentIcons } from './mapTaskToEvent';
import { formatAuthorizedEstimate } from './formatAuthorizedEstimate';
import ComplaintExpandModal, { ComplaintExpandButton } from './ComplaintExpandModal';

const DEPARTMENTS = [
  { value: 'warranty',  label: 'Warranty' },
  { value: 'wash bay',  label: 'Wash Bay' },
  { value: 'welding',   label: 'Welding' },
  { value: 'body shop', label: 'Body Shop' },
  { value: 'old shop',  label: 'Old Shop' },
  { value: 'new shop',  label: 'New Shop' },
  { value: 'triage',    label: 'Triage' },
  { value: 'mobile service', label: 'Mobile Serv.' },
  { value: 'external vendor', label: 'External Vendor' },
];

const ICON_DEPARTMENT_COLOR = '#4b5563';

export default function TaskForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  title = "Add Task",
  submitLabel = "Save",
  buttonsAlign = "center",
  customerOptions = []
}) {
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const formElRef = useRef(null);
  const pendingSnapshotRef = useRef(null);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const currentDepts = Array.isArray(form.department) ? form.department : [];

  const customerSuggestions = form.customer
    ? customerOptions.filter(name =>
        name.toLowerCase().includes(form.customer.toLowerCase()) &&
        name.toLowerCase() !== form.customer.toLowerCase()
      ).slice(0, 6)
    : [];

  function selectCustomer(name) {
    setForm({ ...form, customer: name });
    setShowCustomerSuggestions(false);
  }

  function handleFormSubmit(e) {
    const snapshot = pendingSnapshotRef.current ?? form;
    pendingSnapshotRef.current = null;
    onSubmit(e, snapshot);
  }

  function handleExpandSave(text) {
    const next = { ...form, complaint: text };
    pendingSnapshotRef.current = next;
    setForm(next);
    setExpandOpen(false);
    formElRef.current?.requestSubmit();
  }

  function toggleDept(value) {
    setForm({
      ...form,
      department: currentDepts.includes(value)
        ? currentDepts.filter(d => d !== value)
        : [...currentDepts.filter(d => d !== 'unassigned'), value],
    });
  }

  return (
    <form ref={formElRef} onSubmit={handleFormSubmit}>
      <h2>{title}</h2>

      <div className="customer-field">
        <input
          placeholder="Customer"
          value={form.customer}
          onChange={handleChange('customer')}
          onFocus={() => setShowCustomerSuggestions(true)}
          onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 150)}
          autoComplete="off"
          required
        />
        {showCustomerSuggestions && customerSuggestions.length > 0 && (
          <ul className="customer-suggestions">
            {customerSuggestions.map(name => (
              <li key={name} onMouseDown={() => selectCustomer(name)}>
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        placeholder="Unit"
        value={form.unit}
        onChange={handleChange('unit')}
        required
      />
      <div className="phone-date-row">
        <input
          className="phone-field"
          type="tel"
          placeholder="Phone (204-222-2233)"
          value={form.phone || ''}
          onChange={handleChange('phone')}
        />
        <input
          className="date-field"
          type="date"
          value={form.service_date}
          onChange={handleChange('service_date')}
          required
        />
      </div>
      <input
        type="text"
        inputMode="decimal"
        placeholder="Authorized Estimate"
        value={form.authorized_estimate || ''}
        onChange={handleChange('authorized_estimate')}
        onBlur={(e) => setForm({ ...form, authorized_estimate: formatAuthorizedEstimate(e.target.value) })}
      />
      <div className="complaint-field">
        <textarea
          className="complaint-textarea"
          placeholder="Complaint"
          rows={5}
          value={form.complaint || ''}
          onChange={handleChange('complaint')}
        />
        <ComplaintExpandButton onClick={() => setExpandOpen(true)} />
      </div>
      {expandOpen && (
        <ComplaintExpandModal
          value={form.complaint}
          onSave={handleExpandSave}
          onCancel={() => setExpandOpen(false)}
        />
      )}
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
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <div className="dept-form-chips">
        {DEPARTMENTS.map(({ value, label }) => {
          const selected = currentDepts.includes(value);
          const icon = departmentIcons[value];
          const color = icon ? ICON_DEPARTMENT_COLOR : departmentColors[value];
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
              {icon ? `${icon} ${label}` : label}
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
