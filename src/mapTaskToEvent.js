const statusColors = {
  'completed': 'green',
  'queued': '#f59e0b',
  'waiting': 'red',
  'confirmed': 'blue'
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
      department: t.department
    }
  };
}

export { statusColors };
