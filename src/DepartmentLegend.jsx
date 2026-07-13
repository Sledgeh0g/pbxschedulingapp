import { departmentColors, departmentIcons } from './mapTaskToEvent';

const DEPARTMENTS = [
  { value: 'warranty',  label: 'Warranty' },
  { value: 'wash bay',  label: 'Wash Bay' },
  { value: 'body shop', label: 'Body Shop' },
  { value: 'welding',   label: 'Welding' },
  { value: 'triage',    label: 'Triage' },
  { value: 'old shop',  label: 'Old Shop' },
  { value: 'new shop',  label: 'New Shop' },
  { value: 'mobile service',    label: 'Mobile Serv.' },
  { value: 'external vendor',   label: 'External Vendor' },
];

export default function DepartmentLegend() {
  return (
    <div className="dept-legend">
      {DEPARTMENTS.map(({ value, label }) => {
        const icon = departmentIcons[value];
        return (
          <div key={value} className="dept-legend-item">
            {icon ? (
              <span className="dept-legend-dot" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #4b5563',
                color: '#4b5563',
                fontSize: '9px',
                fontWeight: 'bold',
                backgroundColor: 'transparent',
              }}>{icon}</span>
            ) : (
              <span className="dept-legend-dot" style={{ backgroundColor: departmentColors[value] }} />
            )}
            <span className="dept-legend-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
