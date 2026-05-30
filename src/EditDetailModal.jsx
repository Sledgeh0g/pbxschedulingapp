export default function EditDetailModal({ event, showModal, setShowModal }) {

    if (!showModal || !event) return null;

    return (
        <div 
            className="modal-backdrop"
            onClick={() => setShowModal(false)}
        >
            <div 
                className="editModal"
                onClick={(e) => e.stopPropagation()}
            >
                <span 
                    className="modal-close" 
                    onClick={() => setShowModal(false)}
                    aria-label="Close modal"
                >
                    ×
                </span>

                <h2>Task Details</h2>

                <p><strong>Customer:</strong> {event.extendedProps?.customer}</p>
                <p><strong>Unit:</strong> {event.extendedProps?.unit}</p>
                <p><strong>Service Date:</strong> {event.startStr}</p>
                <p><strong>Status:</strong> {event.extendedProps?.status}</p>
                <p><strong>Department:</strong> {event.extendedProps?.department}</p>

                <div className="modal-buttons">
                    <button 
                        type="button" 
                        onClick={() => setShowModal(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}