export default function DepartmentSelect({selectedDepartment, setSelectedDepartment}) {
    return (
        <select className='dropdown' value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="Warranty">Warranty</option>
            <option value="New Shop">New Shop</option>
            <option value="Old Shop">Old Shop</option>
            <option value="Wash Bay">Wash Bay</option>
            <option value="Welding">Welding</option>
            <option value="Body Shop">Body Shop</option>
            <option value="All Departments">All Departments</option>
        </select>
    )
}