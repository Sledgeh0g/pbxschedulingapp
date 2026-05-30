export default function DispatchToggle({ dispatchMode, setDispatchMode}) {
    return (
        <div className="toggle-container">
            <label className="toggle-label">
                Dispatch Tasks
                <input
                    type="checkbox"
                    checked={dispatchMode}
                    onChange={() => setDispatchMode(!dispatchMode)}
                />
            </label>
        </div>
    )
}