import { PRIORITY_LABELS, priorityColors } from './mapTaskToEvent';

export default function ColorLegend() {
  return (
    <div className="color-legend">
      {Object.entries(priorityColors).map(([key, color]) => (
        <div key={key} className="color-legend-item">
          <span className="color-legend-swatch" style={{ backgroundColor: color }} />
          <span className="color-legend-label">{PRIORITY_LABELS[key]}</span>
        </div>
      ))}
    </div>
  );
}
