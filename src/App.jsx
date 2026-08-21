import { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Calendar from './Calendar';
import List from './List';
import ContractCustomers from './ContractCustomers';
import Reports from './Reports';
import DepartmentSelect from './DepartmentSelect';
import './app.css';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';
import SearchInput from './SearchInput';
import LoginPage from './LoginPage';
import ColorLegend from './ColorLegend';
import DepartmentLegend from './DepartmentLegend';
import Diagnostics from './Diagnostics';
import {
  createTaskSnapshot,
  recordDiagnostic,
  serializeError,
  setDiagnosticIdentity,
  startDiagnosticListeners,
} from './diagnostics';

function App () {

  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [formData, setFormData] = useState({
    customer: "",
    unit: "",
    service_date: "",
    status: "",
    priority: "",
    department: [],
    complaint: ""
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [populatedForEvent, setPopulatedForEvent] = useState(null);
  const previousVisibilityCounts = useRef(null);

  // Populate the central edit form whenever a new event is selected for editing
  if (selectedEvent !== populatedForEvent) {
    setPopulatedForEvent(selectedEvent);
    if (selectedEvent) {
      setFormData({
        customer: selectedEvent.extendedProps?.customer || '',
        unit: selectedEvent.extendedProps?.unit || '',
        service_date: selectedEvent.startStr || '',
        status: selectedEvent.extendedProps?.status || '',
        priority: selectedEvent.extendedProps?.priority || 'scheduled',
        department: selectedEvent.extendedProps?.department || [],
        complaint: selectedEvent.extendedProps?.complaint || '',
      });
    }
  }

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;
    const startedAt = performance.now();
    const requestId = recordDiagnostic('task_fetch_started', {
      source: 'app_schedule',
      userId,
    });

    supabase
      .from('tasks')
      .select('id, customer, unit, phone, service_date, status, priority, department, created_at, complaint, created_by', { count: 'exact' })
      .order('created_at', { ascending: true })
      .then(async ({ data, error, count }) => {
        const durationMs = Math.round(performance.now() - startedAt);
        if (error) {
          console.error(error);
          recordDiagnostic('task_fetch_failed', {
            source: 'app_schedule',
            requestId,
            durationMs,
            error: serializeError(error),
          }, 'error');
          return;
        }

        const snapshot = await createTaskSnapshot(data, 'app_schedule');
        const responseTruncated = count !== null && count !== data.length;
        const substantialDrop = snapshot.previousRowCount !== null &&
          snapshot.removedCount >= 10 &&
          snapshot.removedCount / Math.max(snapshot.previousRowCount, 1) >= 0.2;

        recordDiagnostic('task_fetch_succeeded', {
          source: 'app_schedule',
          requestId,
          durationMs,
          serverRowCount: count,
          responseTruncated,
          ...snapshot,
        }, substantialDrop || responseTruncated ? 'warn' : 'info');

        if (cancelled) {
          recordDiagnostic('task_fetch_discarded', {
            source: 'app_schedule',
            requestId,
            reason: 'effect_cleanup',
          }, 'warn');
          return;
        }
        setEvents(data.map(mapTaskToEvent));
      });

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id])

  useEffect(() => {
    const stopDiagnosticListeners = startDiagnosticListeners();

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setDiagnosticIdentity(session);
      recordDiagnostic('initial_session_resolved', {
        authenticated: Boolean(session),
        userId: session?.user?.id || null,
        error: serializeError(error),
      }, error ? 'error' : 'info');
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setDiagnosticIdentity(session);
      recordDiagnostic('auth_state_changed', {
        authEvent: event,
        authenticated: Boolean(session),
        userId: session?.user?.id || null,
        expiresAt: session?.expires_at || null,
      });
      setSession(session);
      if (!session) setProfile(null);
    });

    return () => {
      subscription.unsubscribe();
      stopDiagnosticListeners();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let cancelled = false;

    async function loadProfile() {
      const startedAt = performance.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      recordDiagnostic(error ? 'profile_fetch_failed' : 'profile_fetch_succeeded', {
        userId,
        durationMs: Math.round(performance.now() - startedAt),
        role: data?.role || null,
        error: serializeError(error),
      }, error ? 'error' : 'info');
      if (!cancelled) setProfile(data);
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const deptFilteredEvents = events.filter(event => {
    if (event.extendedProps?.status === 'completed') return false;
    if (selectedDepartment === 'All Departments') return true;
    const depts = event.extendedProps?.department;
    return Array.isArray(depts) && depts.includes(selectedDepartment);
  });

  const customerOptions = [...new Set(
    events.map(event => event.extendedProps?.customer).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));

  const filteredEvents = deptFilteredEvents.filter(event => {
    const { customer, unit, status, department, created_at } = event.extendedProps || {};
    const term = searchTerm.toLowerCase();
    return (
      customer?.toLowerCase().includes(term) ||
      unit?.toLowerCase().includes(term) ||
      status?.toLowerCase().includes(term) ||
      (Array.isArray(department) ? department.join(' ') : '').toLowerCase().includes(term) ||
      created_at?.toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => {
      const counts = {
        totalLoaded: events.length,
        activeLoaded: events.filter(event => event.extendedProps?.status !== 'completed').length,
        completedHidden: events.filter(event => event.extendedProps?.status === 'completed').length,
        departmentMatched: deptFilteredEvents.length,
        visible: filteredEvents.length,
      };
      const previous = previousVisibilityCounts.current;
      if (JSON.stringify(previous) === JSON.stringify(counts)) return;

      const unexpectedDrop = previous &&
        selectedDepartment === 'All Departments' &&
        !searchTerm &&
        previous.visible >= 10 &&
        counts.visible / previous.visible < 0.8;

      recordDiagnostic('schedule_visibility_changed', {
        ...counts,
        previous,
        selectedDepartment,
        searchActive: Boolean(searchTerm),
        searchLength: searchTerm.length,
      }, unexpectedDrop ? 'warn' : 'info');
      previousVisibilityCounts.current = counts;
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [session, events, deptFilteredEvents, filteredEvents, selectedDepartment, searchTerm]);

  if (authLoading) return <div>Loading...</div>;
  if (!session) return <LoginPage />;
  if (!profile) return <div>Your account is pending approval. Contact your manager.</div>;

  return (
    
    <>
    <nav id="root">
      <div className="nav-left">
        <DepartmentSelect selectedDepartment={selectedDepartment} setSelectedDepartment={setSelectedDepartment} />
        </div>
        <div className="nav-center">
          <SearchInput
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            placeholder="Search all tasks..."
          />
        </div>
        <div className="nav-right">
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/list">List</NavLink>
          <NavLink to="/contractcustomers">Contract Customers</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/diagnostics">Diagnostics</NavLink>
          </div>
    </nav>
      <div className="legend-row">
        <div className="legend-left"></div>
        <div className="legend-center"><DepartmentLegend /></div>
        <div className="legend-right"><ColorLegend /></div>
      </div>
      <Routes>
      <Route path="/" element={<Calendar
          events={filteredEvents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setEvents={setEvents}
          mapTaskToEvent={mapTaskToEvent}
          formData={formData}
          setFormData={setFormData}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          customerOptions={customerOptions}
           />} />
      <Route path="/calendar" element={<Calendar
          events={filteredEvents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setEvents={setEvents}
          mapTaskToEvent={mapTaskToEvent}
          formData={formData}
          setFormData={setFormData}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          customerOptions={customerOptions}
           />} />
      <Route path="/list" element={<List
          events={filteredEvents}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          setEvents={setEvents}
          mapTaskToEvent={mapTaskToEvent}
          formData={formData}
          setFormData={setFormData}
          selectedEvent={selectedEvent}
          setSelectedEvent={setSelectedEvent}
          showDetailModal={showDetailModal}
          setShowDetailModal={setShowDetailModal}
          customerOptions={customerOptions}
           />} />
          <Route path="/reports" element={<Reports
            searchTerm={searchTerm}
            selectedDepartment={selectedDepartment}
            formData={formData}
            setFormData={setFormData}
            appSetEvents={setEvents}
            customerOptions={customerOptions}
          />} />
          <Route path="/contractcustomers" element={<ContractCustomers
            formData={formData}
            setFormData={setFormData}
            appSetEvents={setEvents}
            searchTerm={searchTerm}
            selectedDepartment={selectedDepartment}
            customerOptions={customerOptions}
          />}/>
          <Route path="/diagnostics" element={<Diagnostics />} />
    </Routes>
    <div className="App">
    </div>
    </>
  )
}

export default App
