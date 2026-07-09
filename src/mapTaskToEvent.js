const priorityColors = {
  'urgent': '#dc2626',
  'end_of_day': '#f59e0b',
  'scheduled': '#16a34a',
};

const departmentColors = {
  'warranty':   '#dc2626',
  'wash bay':   '#06b6d4',
  'body shop':  '#ea580c',
  'welding':    '#92400e',
  'triage':     '#ec4899',
  'old shop':   '#1e3a5f',
  'new shop':   '#eab308',
  'mobile service': '#000000',
};

// keep old name as alias so existing imports don't break
const departmentDotColors = departmentColors;

const PRIORITY_ORDER = { urgent: 0, end_of_day: 1, scheduled: 2 };

function clampToToday(dateStr) {
  if (!dateStr) return dateStr
  const today = new Date().toISOString().slice(0, 10)
  return dateStr < today ? today : dateStr
}

export function mapTaskToEvent(t) {
  const displayDate = t.status === 'completed' ? t.service_date : clampToToday(t.service_date)
  const departments = Array.isArray(t.department)
    ? t.department
    : (t.department ? [t.department] : []);
  return {
    id: String(t.id),
    title: t.unit ? `${t.customer} - ${t.unit}` : t.customer,
    start: displayDate,
    backgroundColor: 'transparent',
    borderColor: priorityColors[t.priority] || '#999',
    textColor: priorityColors[t.priority] || '#999',
    extendedProps: {
      customer: t.customer,
      unit: t.unit || '',
      phone: t.phone || '',
      status: t.status,
      priority: t.priority || 'scheduled',
      department: departments,
      complaint: t.complaint,
      created_by: t.created_by || '',
      created_at: t.created_at || ''
    }
  };
}

export { priorityColors, departmentColors, departmentDotColors };

export function eventOrderComparator(a, b) {
  const aRank = PRIORITY_ORDER[a.extendedProps?.priority] ?? 99;
  const bRank = PRIORITY_ORDER[b.extendedProps?.priority] ?? 99;
  if (aRank !== bRank) return aRank - bRank;
  const aDate = a.extendedProps?.created_at || '';
  const bDate = b.extendedProps?.created_at || '';
  return aDate < bDate ? -1 : aDate > bDate ? 1 : 0;
}
