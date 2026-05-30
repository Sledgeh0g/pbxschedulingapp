import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Calendar from './Calendar';
import List from './List';
import { supabase } from './supabaseClient';
import { mapTaskToEvent } from './mapTaskToEvent';

function App () {

  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState([]);
  const [dispatchMode, setDispatchMode] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

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

  const statusFilteredEvents = events.filter(event => {
    const status = event.extendedProps?.status;
    if (dispatchMode) {return 'queued' === event.extendedProps?.status;}
    else {return 'queued' !== event.extendedProps?.status;}
  })
  
  const filteredEvents = statusFilteredEvents.filter(event => {
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
      <Link to="/home">Home</Link> | {" "}
      <Link to="/calendar">Calendar</Link> | {" "}
      <Link to="/list">List</Link>
    </nav>
      <Routes>
      <Route path="/" element={<Calendar 
          events={filteredEvents} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          setEvents={setEvents} 
          mapTaskToEvent={mapTaskToEvent}
          dispatchMode={dispatchMode}
          setDispatchMode={setDispatchMode}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
           />} />
      <Route path="/home" element={<Home/>}/>
      <Route path="/calendar" element={<Calendar 
          events={filteredEvents} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          setEvents={setEvents} 
          mapTaskToEvent={mapTaskToEvent} 
          dispatchMode={dispatchMode}
          setDispatchMode={setDispatchMode}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
           />} />
      <Route path="/list" element={<List 
          events={filteredEvents} 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          setEvents={setEvents} 
          mapTaskToEvent={mapTaskToEvent} 
          dispatchMode={dispatchMode}
          setDispatchMode={setDispatchMode}
          selectedDepartment={selectedDepartment}
          setSelectedDepartment={setSelectedDepartment}
           />} />
    </Routes>
    <div className="App">
    </div>
    </>
  )
}

export default App