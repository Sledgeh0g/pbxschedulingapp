export default function DepartmentSelect({selectedDepartment, setSelectedDepartment}) {
    return (
        <select className='dropdown' value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
            <option value="All Departments">All Departments</option>
            <option value="warranty">Warranty</option>
            <option value="new shop">New Shop</option>
            <option value="old shop">Old Shop</option>
            <option value="wash bay">Wash Bay</option>
            <option value="welding">Welding</option>
            <option value="body shop">Body Shop</option>
            <option value="unassigned">Unassigned</option>
        </select>
    )
}