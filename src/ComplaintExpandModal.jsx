import { useEffect, useState } from 'react';

export function ComplaintExpandButton({ onClick }) {
  return (
    <button
      type="button"
      className="complaint-expand"
      onClick={onClick}
      aria-label="Expand complaint"
      title="Expand complaint"
    >
      <span className="complaint-expand-icon" aria-hidden="true" />
    </button>
  );
}

export default function ComplaintExpandModal({ value, onSave, onCancel }) {
  const [draft, setDraft] = useState(value || '');

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop complaint-expand-backdrop"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        className="complaint-expand-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="task-detail-header">
          <h2>Complaint</h2>
          <div className="task-detail-actions">
            <button type="button" onClick={() => onSave(draft)}>Save</button>
            <button type="button" onClick={onCancel} aria-label="Close">×</button>
          </div>
        </div>
        <textarea
          className="complaint-expand-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
      </div>
    </div>
  );
}
