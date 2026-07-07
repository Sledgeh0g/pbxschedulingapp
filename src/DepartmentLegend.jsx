import { departmentColors } from './mapTaskToEvent';

const DEPARTMENTS = [
  { value: 'warranty',  label: 'Warranty' },
  { value: 'wash bay',  label: 'Wash Bay' },
  { value: 'body shop', label: 'Body Shop' },
  { value: 'welding',   label: 'Welding' },
  { value: 'triage',    label: 'Triage' },
  { value: 'old shop',  label: 'Old Shop' },
  { value: 'new shop',  label: 'New Shop' },
  { value: 'mobile service',    label: 'Mobile Serv.' },
];

export default function DepartmentLegend() {
  return (
    <div className="dept-legend">
      {DEPARTMENTS.map(({ value, label }) => (
        <div key={value} className="dept-legend-item">
          <span className="dept-legend-dot" style={{ backgroundColor: departmentColors[value] }} />
          <span className="dept-legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
