import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import TasksPage from './TasksPage';
import Calendar from './Calendar';
import List from './List';
import { supabase } from './supabaseClient';

function App () {

  const [searchTerm, setSearchTerm] = useState('');
  const [supabaseTasks, setSupabaseTasks] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id, customer, unit, service_date, status, department')
      .then(({ data, error }) => {
        if (error) { console.error(error); return; }
        setSupabaseTasks(data);
        const statusColors = {
          'completed': 'green',
          'queued': '#f59e0b',
          'waiting': 'red',
          'confirmed': 'blue'
        }
        console.log(data.map(t => ({ status: t.status, color: statusColors[t.status] })));
        setEvents(data.map(t => ({
          id: String(t.id),
          title: `${t.customer} - ${t.unit}`,
          start: t.service_date,
          color: statusColors[t.status] || '#999',
          extendedProps: {customer: t.customer, unit: t.unit, status: t.status, department: t.department }
        })));
      });
  }, [])

  const filteredTasks = supabaseTasks.filter(task =>
    task.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    
    <>
    <nav id="root">
      <Link to="/">Tasks</Link> | {" "}
      <Link to="/home">Home</Link> | {" "}
      <Link to="/calendar">Calendar</Link> | {" "}
      <Link to="/list">List</Link>
    </nav>
      <Routes>
      <Route path="/" element={<TasksPage tasks={filteredTasks} searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>} />
      <Route path="/home" element={<Home/>}/>
      <Route path="/calendar" element={<Calendar events={events} setEvents={setEvents}/>}/>
      <Route path="/list" element={<List events={events} setEvents={setEvents}/>}/>
    </Routes>
    <div className="App">
    </div>
    </>
  )
}

export default App