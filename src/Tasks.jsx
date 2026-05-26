function Tasks({ task }) {
    return (
        <tr>
            <td>{task.id}</td>
            <td>{task.customer}</td>
            <td>{task.unit}</td>
            <td>{task.service_date}</td>
            <td>{task.status}</td>
            <td>{task.department}</td>
        </tr>
    )
}

export default Tasks;