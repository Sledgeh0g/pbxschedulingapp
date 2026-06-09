const statusColors = {
  'completed': 'green',
  'queued': '#f59e0b',
  'waiting': 'red',
  'confirmed': 'blue',
  'priority': 'violet'
};

function clampToToday(dateStr) {
  if (!dateStr) return dateStr
  const today = new Date().toISOString().slice(0, 10)
  return dateStr < today ? today : dateStr
}

export function mapTaskToEvent(t) {
  const displayDate = t.status === 'completed' ? t.service_date : clampToToday(t.service_date)
  return {
    id: String(t.id),
    title: `${t.customer} - ${t.unit}`,
    start: displayDate,
    color: statusColors[t.status] || '#999',
    extendedProps: {
      customer: t.customer,
      unit: t.unit,
      status: t.status,
      department: t.department,
      complaint: t.complaint,
      created_by: t.created_by || '',
      created_at: t.created_at || ''
    }
  };
}

export { statusColors };

export function eventOrderComparator(a, b) {
  const aPriority = a.extendedProps?.status === 'priority' ? 0 : 1;
  const bPriority = b.extendedProps?.status === 'priority' ? 0 : 1;
  if (aPriority !== bPriority) return aPriority - bPriority;
  const aDate = a.extendedProps?.created_at || '';
  const bDate = b.extendedProps?.created_at || '';
  return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
}
