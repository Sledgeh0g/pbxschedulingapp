import { useState, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { supabase } from './supabaseClient'
import EditDetailModal from './EditDetailModal'
import { mapTaskToEvent } from './mapTaskToEvent'

const CONTRACT_CUSTOMERS = ['canada packers', 'trouw nutrition']
const STATUS_ORDER = { queued: 0, confirmed: 1, waiting: 2, completed: 3 }
const PRIORITY_ORDER = { urgent: 0, end_of_day: 1, scheduled: 2 }

const columns = [
  { accessorKey: 'customer', header: 'Customer' },
  { accessorKey: 'unit', header: 'Unit' },
  { accessorKey: 'service_date', header: 'Service Date' },
  { accessorKey: 'department', header: 'Department' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span className="contract-table-status">{row.getValue('status')}</span>
    ),
  },
]

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => {
    const priorityDiff = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
    if (priorityDiff !== 0) return priorityDiff
    const statusDiff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
    if (statusDiff !== 0) return statusDiff
    return new Date(a.created_at) - new Date(b.created_at)
  })
}

export default function ContractCustomers({ formData, setFormData, appSetEvents, searchTerm, selectedDepartment }) {
  const [tasks, setTasks] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === 'All Departments') {
      setColumnFilters([])
    } else {
      setColumnFilters([{ id: 'department', value: selectedDepartment }])
    }
  }, [selectedDepartment])

  useEffect(() => {
    supabase
      .from('tasks')
      .select('id, customer, unit, service_date, status, priority, department, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); return }
        const contractTasks = data.filter(task =>
          task.status !== 'completed' &&
          CONTRACT_CUSTOMERS.some(name =>
            task.customer?.toLowerCase().includes(name)
          )
        )
        setTasks(sortByPriority(contractTasks))
      })
  }, [])

  function handleRowClick(task) {
    setSelectedTask({ ...mapTaskToEvent(task), startStr: task.service_date })
    setFormData({
      customer: task.customer || '',
      unit: task.unit || '',
      service_date: task.service_date || '',
      status: task.status || '',
      priority: task.priority || 'scheduled',
      department: task.department || '',
    })
    setShowModal(true)
  }

  function handleSetEvents(updater) {
    appSetEvents(updater)
    setTasks(prev => sortByPriority(
      prev.map(task =>
        String(task.id) === String(selectedTask?.id)
          ? { ...task, ...formData }
          : task
      )
    ))
  }

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    state: { globalFilter: searchTerm, columnFilters },
    onColumnFiltersChange: setColumnFilters,
  })

  return (
    <div className="contract-table-page">
      <div className="contract-table">
        <table className="contract-table-element">
          <thead className="contract-table-head">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="contract-table-head-row">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="contract-table-th">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`contract-table-row contract-table-row--${row.original.priority || 'scheduled'}`}
                  onClick={() => handleRowClick(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="contract-table-td">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="contract-table-empty">
                  No results.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <EditDetailModal
        event={selectedTask}
        showModal={showModal}
        setShowModal={setShowModal}
        formData={formData}
        setFormData={setFormData}
        setEvents={handleSetEvents}
        onDelete={(id) => {
          appSetEvents(prev => prev.filter(e => e.id !== id))
          setTasks(prev => prev.filter(t => String(t.id) !== String(id)))
        }}
        mapTaskToEvent={mapTaskToEvent}
      />
    </div>
  )
}
