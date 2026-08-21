import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  flushDiagnostics,
  getPendingDiagnosticCount,
  getPendingDiagnostics,
  recordDiagnostic,
  serializeError,
} from './diagnostics';

const PERIODS = {
  '1 hour': 60 * 60 * 1000,
  '24 hours': 24 * 60 * 60 * 1000,
  '7 days': 7 * 24 * 60 * 60 * 1000,
  '30 days': 30 * 24 * 60 * 60 * 1000,
};

function formatTime(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function summarizeMetadata(metadata) {
  if (!metadata) return 'No details';
  if (metadata.source && metadata.rowCount !== undefined) {
    return `${metadata.source}: ${metadata.rowCount} rows in ${metadata.durationMs ?? '?'} ms`;
  }
  if (metadata.error?.message) return metadata.error.message;
  if (metadata.authEvent) return `${metadata.authEvent}: ${metadata.authenticated ? 'authenticated' : 'signed out'}`;
  if (metadata.visible !== undefined) return `${metadata.visible} visible of ${metadata.totalLoaded} loaded`;
  if (metadata.state) return metadata.state;
  return 'Recorded client context';
}

export default function Diagnostics() {
  const [period, setPeriod] = useState('24 hours');
  const [level, setLevel] = useState('all');
  const [eventFilter, setEventFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [pending, setPending] = useState(getPendingDiagnosticCount);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  async function loadEvents(selectedPeriod = period) {
    setLoading(true);
    setError(null);
    await flushDiagnostics();
    setPending(getPendingDiagnosticCount());

    const since = new Date(Date.now() - PERIODS[selectedPeriod]).toISOString();
    const { data, error: queryError } = await supabase
      .from('app_diagnostics')
      .select('id, occurred_at, received_at, level, event_type, user_id, user_email, installation_id, tab_id, route, client_version, build_time, metadata')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (queryError) {
      setError(queryError);
      setEvents([]);
    } else {
      setEvents(data || []);
      setLastLoadedAt(new Date());
    }
    setLoading(false);
  }

  useEffect(() => {
    // Defer the initial load so no state is set synchronously within the effect.
    const timer = window.setTimeout(() => { void loadEvents(); }, 0);
    const updatePending = () => setPending(getPendingDiagnosticCount());
    window.addEventListener('pbx-diagnostics-queue-change', updatePending);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pbx-diagnostics-queue-change', updatePending);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleEvents = events.filter(event => {
    if (level !== 'all' && event.level !== level) return false;
    if (eventFilter && !event.event_type.toLowerCase().includes(eventFilter.toLowerCase())) return false;
    return true;
  });

  const errorCount = events.filter(event => event.level === 'error').length;
  const warningCount = events.filter(event => event.level === 'warn').length;
  const snapshotChanges = events.filter(event =>
    event.event_type === 'task_fetch_succeeded' && event.metadata?.removedCount > 0
  ).length;
  const reportingClients = new Set(events.map(event => event.installation_id).filter(Boolean)).size;

  function handlePeriodChange(event) {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);
    void loadEvents(nextPeriod);
  }

  function handleExport() {
    const payload = {
      exportedAt: new Date().toISOString(),
      period,
      remoteEvents: visibleEvents,
      pendingLocalEvents: getPendingDiagnostics(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `pbx-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    recordDiagnostic('diagnostics_exported', {
      period,
      exportedEventCount: visibleEvents.length,
      pendingEventCount: pending,
    });
  }

  const schemaMissing = error?.code === 'PGRST205' || error?.code === '42P01';

  return (
    <main className="diagnostics-page">
      <header className="diagnostics-header">
        <div>
          <h1>System Diagnostics</h1>
          <p>Task counts, sync changes, authentication events, and client failures across the shop.</p>
        </div>
        <div className="diagnostics-actions">
          <button type="button" className="diagnostics-secondary-button" onClick={() => loadEvents()} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button type="button" className="diagnostics-primary-button" onClick={handleExport} disabled={!events.length && !pending}>
            Export JSON
          </button>
        </div>
      </header>

      <section className="diagnostics-status" aria-label="Diagnostic summary">
        <div><strong>{events.length}</strong><span>events recorded</span></div>
        <div><strong>{reportingClients}</strong><span>reporting clients</span></div>
        <div><strong>{warningCount}</strong><span>warnings</span></div>
        <div><strong>{errorCount}</strong><span>errors</span></div>
        <div><strong>{snapshotChanges}</strong><span>task-set changes</span></div>
      </section>

      {pending > 0 && (
        <div className="diagnostics-notice diagnostics-notice--warning" role="status">
          <strong>{pending} diagnostic {pending === 1 ? 'event is' : 'events are'} queued on this computer.</strong>
          <span>They will upload automatically when Supabase is reachable and the diagnostics table is available.</span>
        </div>
      )}

      {error && (
        <div className="diagnostics-notice diagnostics-notice--error" role="alert">
          <strong>{schemaMissing ? 'Diagnostics database setup is required.' : 'Diagnostics could not be loaded.'}</strong>
          <span>{schemaMissing ? 'Run scripts/diagnostics-schema.sql in the Supabase SQL Editor.' : serializeError(error)?.message}</span>
        </div>
      )}

      <section className="diagnostics-controls" aria-label="Diagnostic filters">
        <label>
          Time range
          <select value={period} onChange={handlePeriodChange}>
            {Object.keys(PERIODS).map(value => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Severity
          <select value={level} onChange={event => setLevel(event.target.value)}>
            <option value="all">All levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Information</option>
          </select>
        </label>
        <label className="diagnostics-event-filter">
          Event type
          <input
            value={eventFilter}
            onChange={event => setEventFilter(event.target.value)}
            placeholder="Filter task_fetch, auth, network..."
          />
        </label>
        <div className="diagnostics-last-sync">
          Last loaded
          <strong>{lastLoadedAt ? formatTime(lastLoadedAt) : 'Not yet loaded'}</strong>
        </div>
      </section>

      <section className="diagnostics-log" aria-live="polite">
        <div className="diagnostics-log-heading">
          <h2>Event Log</h2>
          <span>{visibleEvents.length} shown</span>
        </div>
        {loading && !events.length ? (
          <div className="diagnostics-empty">Loading diagnostic history...</div>
        ) : visibleEvents.length ? (
          <div className="diagnostics-table-wrap">
            <table className="diagnostics-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Level</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>Route</th>
                  <th>Summary</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map(event => (
                  <tr key={event.id}>
                    <td className="diagnostics-time">{formatTime(event.occurred_at)}</td>
                    <td><span className={`diagnostics-level diagnostics-level--${event.level}`}>{event.level}</span></td>
                    <td className="diagnostics-event-name">{event.event_type}</td>
                    <td>{event.user_email || event.user_id?.slice(0, 8) || 'Pre-auth'}</td>
                    <td>{event.route || '/'}</td>
                    <td>{summarizeMetadata(event.metadata)}</td>
                    <td>
                      <details>
                        <summary>Inspect</summary>
                        <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="diagnostics-empty">No diagnostic events match these filters.</div>
        )}
      </section>
    </main>
  );
}
