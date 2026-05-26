import Tasks from './Tasks';

function TasksPage(props) {
    return (
        <div>
        <h1>Tasks</h1>
        <input className="input"
        type="text"
        placeholder="Search..."
        value={props.searchTerm}
        onChange={(e) => {
          props.setSearchTerm(e.target.value);
        }}/>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Unit</th>
            <th>Service Date</th>
            <th>Status</th>
            <th>Department</th>
          </tr>
        </thead>
          <tbody>
      {props.tasks.map((task) => (
        <Tasks key={task.id} task={task} />
      ))}
          </tbody>
      </table>
        </div>
    )
}

export default TasksPage;