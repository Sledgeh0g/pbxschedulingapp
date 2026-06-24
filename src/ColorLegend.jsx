import { priorityColors } from './mapTaskToEvent';

const labels = {
  scheduled: 'Scheduled',
  end_of_day: 'End of Day',
  urgent: 'Urgent',
};

export default function ColorLegend() {
  return (
    <div className="color-legend">
      {Object.entries(priorityColors).map(([key, color]) => (
        <div key={key} className="color-legend-item">
          <span className="color-legend-swatch" style={{ backgroundColor: color }} />
          <span className="color-legend-label">{labels[key]}</span>
        </div>
      ))}
    </div>
  );
}
