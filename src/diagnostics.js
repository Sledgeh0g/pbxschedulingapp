import { supabase } from './supabaseClient';

const QUEUE_KEY = 'pbx-diagnostics-queue-v1';
const INSTALLATION_KEY = 'pbx-diagnostics-installation-v1';
const TAB_KEY = 'pbx-diagnostics-tab-v1';
const SNAPSHOT_PREFIX = 'pbx-diagnostics-snapshot-v1:';
const MAX_QUEUE_SIZE = 250;
const FLUSH_BATCH_SIZE = 25;

let currentIdentity = { userId: null, userEmail: null };
let flushPromise = null;

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, character => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function readStorage(storage, key, fallback) {
  try {
    const value = storage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function getPersistentId(storage, key) {
  let id = readStorage(storage, key, null);
  if (!id) {
    id = createId();
    writeStorage(storage, key, id);
  }
  return id;
}

function getQueue() {
  return readStorage(localStorage, QUEUE_KEY, []);
}

function setQueue(queue) {
  writeStorage(localStorage, QUEUE_KEY, queue.slice(-MAX_QUEUE_SIZE));
  window.dispatchEvent(new CustomEvent('pbx-diagnostics-queue-change'));
}

function cleanMetadata(value, depth = 0) {
  if (depth > 5) return '[truncated]';
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === 'string') return value.slice(0, 1000);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.slice(0, 100).map(item => cleanMetadata(item, depth + 1));
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 100)
        .filter(([key]) => !/token|password|phone|complaint|customer/i.test(key))
        .map(([key, item]) => [key, cleanMetadata(item, depth + 1)])
    );
  }
  return String(value).slice(0, 1000);
}

function getClientContext() {
  return {
    online: navigator.onLine,
    visibility: document.visibilityState,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
  };
}

export function serializeError(error) {
  if (!error) return null;
  return cleanMetadata({
    name: error.name,
    message: error.message || String(error),
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status,
    stack: error.stack,
  });
}

export function setDiagnosticIdentity(session) {
  currentIdentity = {
    userId: session?.user?.id || null,
    userEmail: session?.user?.email || null,
  };
}

export function getPendingDiagnosticCount() {
  return getQueue().length;
}

export function getPendingDiagnostics() {
  return getQueue();
}

export function recordDiagnostic(eventType, metadata = {}, level = 'info') {
  const diagnostic = {
    id: createId(),
    occurred_at: new Date().toISOString(),
    level,
    event_type: eventType,
    user_id: currentIdentity.userId,
    user_email: currentIdentity.userEmail,
    installation_id: getPersistentId(localStorage, INSTALLATION_KEY),
    tab_id: getPersistentId(sessionStorage, TAB_KEY),
    route: window.location.pathname,
    client_version: import.meta.env.VITE_APP_VERSION || 'unknown',
    build_time: import.meta.env.VITE_BUILD_TIME || null,
    user_agent: navigator.userAgent.slice(0, 500),
    metadata: cleanMetadata({ ...getClientContext(), ...metadata }),
  };

  setQueue([...getQueue(), diagnostic]);
  void flushDiagnostics();
  return diagnostic.id;
}

export async function flushDiagnostics() {
  if (flushPromise) return flushPromise;
  if (!navigator.onLine) return { flushed: 0, pending: getQueue().length };

  flushPromise = (async () => {
    let flushed = 0;
    let queue = getQueue();

    while (queue.length) {
      const batch = queue.slice(0, FLUSH_BATCH_SIZE);
      const { error } = await supabase
        .from('app_diagnostics')
        .upsert(batch, { onConflict: 'id', ignoreDuplicates: true });

      if (error) {
        return { flushed, pending: queue.length, error };
      }

      const flushedIds = new Set(batch.map(item => item.id));
      queue = getQueue().filter(item => !flushedIds.has(item.id));
      setQueue(queue);
      flushed += batch.length;
    }

    return { flushed, pending: 0 };
  })().finally(() => {
    flushPromise = null;
  });

  return flushPromise;
}

async function fingerprintIds(ids) {
  const source = ids.join(',');
  if (globalThis.crypto?.subtle) {
    const digest = await globalThis.crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(source)
    );
    return Array.from(new Uint8Array(digest))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export async function createTaskSnapshot(tasks, snapshotKey) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const ids = safeTasks.map(task => String(task.id)).sort();
  const uniqueIds = [...new Set(ids)];
  const statuses = {};
  const serviceDates = [];

  for (const task of safeTasks) {
    const status = task.status || 'missing';
    statuses[status] = (statuses[status] || 0) + 1;
    if (task.service_date) serviceDates.push(task.service_date);
  }

  serviceDates.sort();
  const storageKey = `${SNAPSHOT_PREFIX}${currentIdentity.userId || 'anonymous'}:${snapshotKey}`;
  const previousIds = readStorage(localStorage, storageKey, null);
  const previousSet = new Set(previousIds || []);
  const currentSet = new Set(uniqueIds);
  const addedIds = previousIds ? uniqueIds.filter(id => !previousSet.has(id)) : [];
  const removedIds = previousIds ? previousIds.filter(id => !currentSet.has(id)) : [];

  writeStorage(localStorage, storageKey, uniqueIds);

  return {
    snapshotKey,
    rowCount: safeTasks.length,
    uniqueIdCount: uniqueIds.length,
    duplicateIdCount: safeTasks.length - uniqueIds.length,
    activeCount: safeTasks.filter(task => task.status !== 'completed').length,
    completedCount: safeTasks.filter(task => task.status === 'completed').length,
    missingServiceDateCount: safeTasks.filter(task => !task.service_date).length,
    statuses,
    firstServiceDate: serviceDates[0] || null,
    lastServiceDate: serviceDates.at(-1) || null,
    idFingerprint: await fingerprintIds(uniqueIds),
    previousRowCount: previousIds?.length ?? null,
    addedCount: addedIds.length,
    removedCount: removedIds.length,
    addedIdSample: addedIds.slice(0, 50),
    removedIdSample: removedIds.slice(0, 50),
  };
}

export function startDiagnosticListeners() {
  const handleOnline = () => {
    recordDiagnostic('network_online');
    void flushDiagnostics();
  };
  const handleOffline = () => recordDiagnostic('network_offline', {}, 'warn');
  const handleVisibility = () => {
    recordDiagnostic('visibility_changed', { state: document.visibilityState });
    if (document.visibilityState === 'visible') void flushDiagnostics();
  };
  const handleError = event => {
    recordDiagnostic('window_error', {
      message: event.message,
      source: event.filename,
      line: event.lineno,
      column: event.colno,
      error: serializeError(event.error),
    }, 'error');
  };
  const handleRejection = event => {
    recordDiagnostic('unhandled_rejection', {
      error: serializeError(event.reason),
    }, 'error');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibility);
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
  recordDiagnostic('app_started', { referrer: document.referrer || null });

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibility);
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  };
}
