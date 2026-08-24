import { useState } from 'react';
import ColorLegend from './ColorLegend';
import DepartmentLegend from './DepartmentLegend';

const STORAGE_KEY = 'pbx-legend-open';

export default function LegendBar({ events }) {
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) !== '0');

  const active = events.filter(e => e.extendedProps?.status !== 'completed');
  const urgentCount = active.filter(e => e.extendedProps?.priority === 'urgent').length;

  function toggle() {
    setOpen(prev => {
      localStorage.setItem(STORAGE_KEY, prev ? '0' : '1');
      return !prev;
    });
  }

  return (
    <div className="legend-bar">
      <div className="legend-strip">
        <button
          type="button"
          className="legend-toggle"
          onClick={toggle}
          aria-expanded={open}
        >
          [ LEGEND {open ? '–' : '+'} ]
        </button>
        <div className="status-line">
          <strong>{active.length}</strong> ACTIVE
          {' · '}
          <span className="status-urgent"><strong>{urgentCount}</strong> URGENT</span>
        </div>
      </div>
      {open && (
        <div className="legend-panel">
          <div className="legend-group">
            <span className="legend-group-label">PRIORITY</span>
            <ColorLegend />
          </div>
          <div className="legend-group">
            <span className="legend-group-label">DEPARTMENT</span>
            <DepartmentLegend />
          </div>
        </div>
      )}
    </div>
  );
}
