import { useState, useEffect } from 'react';
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
    department: "",
    complaint: ""
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Populate the central edit form whenever a new event is selected for editing
  useEffect(() => {
    if (selectedEvent) {
      setFormData({
        customer: selectedEvent.extendedProps?.customer || '',
        unit: selectedEvent.extendedProps?.unit || '',
        service_date: selectedEvent.startStr || '',
        status: selectedEvent.extendedProps?.status || '',
        priority: selectedEvent.extendedProps?.priority || 'scheduled',
        department: selectedEvent.extendedProps?.department || '',
        complaint: selectedEvent.extendedProps?.complaint || '',
      });
    }
  }, [selectedEvent, setFormData]);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('tasks')
      .select('id, customer, unit, service_date, status, priority, department, created_at, complaint, created_by')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setEvents(data.map(mapTaskToEvent));
      });
  }, [session])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    setProfile(data);
  }

  const deptFilteredEvents = events.filter(event => {
    if (event.extendedProps?.status === 'completed') return false;
    if (selectedDepartment === 'All Departments') return true;
    const dept = event.extendedProps?.department;
    if (!dept) return false;
    return dept.toLowerCase() === selectedDepartment.toLowerCase();
  });

  const filteredEvents = deptFilteredEvents.filter(event => {
    const { customer, unit, status, department, created_at } = event.extendedProps || {};
    const term = searchTerm.toLowerCase();
    return (
      customer?.toLowerCase().includes(term) ||
      unit?.toLowerCase().includes(term) ||
      status?.toLowerCase().includes(term) ||
      department?.toLowerCase().includes(term) ||
      created_at?.toLowerCase().includes(term)
    );
  });

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
          </div>
    </nav>
      <ColorLegend />
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
           />} />
          <Route path="/reports" element={<Reports
            searchTerm={searchTerm}
            selectedDepartment={selectedDepartment}
            formData={formData}
            setFormData={setFormData}
            appSetEvents={setEvents}
          />} />
          <Route path="/contractcustomers" element={<ContractCustomers
            formData={formData}
            setFormData={setFormData}
            appSetEvents={setEvents}
            searchTerm={searchTerm}
            selectedDepartment={selectedDepartment}
          />}/>
    </Routes>
    <div className="App">
    </div>
    </>
  )
}

export default App