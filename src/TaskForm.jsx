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
      <select
        value={form.status}
        onChange={handleChange('status')}
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
        onChange={handleChange('department')}
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
