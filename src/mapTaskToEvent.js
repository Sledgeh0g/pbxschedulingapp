const statusColors = {
  'completed': 'green',
  'queued': '#f59e0b',
  'waiting': 'red',
  'confirmed': 'blue',
  'priority': 'violet'
};

export function mapTaskToEvent(t) {
  return {
    id: String(t.id),
    title: `${t.customer} - ${t.unit}`,
    start: t.service_date,
    color: statusColors[t.status] || '#999',
    created_at: t.created_at,
    extendedProps: {
      customer: t.customer,
      unit: t.unit,
      status: t.status,
      department: t.department,
      complaint: t.complaint
    }
  };
}

export { statusColors };

export function eventOrderComparator(a, b) {
  const aPriority = a.extendedProps?.status === 'priority' ? 0 : 1;
  const bPriority = b.extendedProps?.status === 'priority' ? 0 : 1;
  if (aPriority !== bPriority) return aPriority - bPriority;
  return new Date(a.extendedProps?.created_at || 0) - new Date(b.extendedProps?.created_at || 0);
}
