import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Calendar from './Calendar';
import List from './List';
import ContractCustomers from './ContractCustomers';
import DepartmentSelect from './DepartmentSelect';
import './app.css';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';
import SearchInput from './SearchInput';

function App () {

  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [formData, setFormData] = useState({
    customer: "",
    unit: "",
    service_date: "",
    status: "",
    department: ""
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
        department: selectedEvent.extendedProps?.department || '',
      });
    }
  }, [selectedEvent, setFormData]);

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id, customer, unit, service_date, status, department, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setEvents(data.map(mapTaskToEvent));
      });
  }, [])

  const deptFilteredEvents = events.filter(event => {
    if (selectedDepartment === 'All Departments') {
      return true;
    }
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
          </div>
    </nav>
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