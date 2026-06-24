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
import { generateWorkOrderReport } from './generateWorkOrderReport'

const DEPARTMENTS = ['warranty', 'wash bay', 'welding', 'body shop', 'old shop', 'new shop']

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

function getDefaultMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export default function Reports({ searchTerm, selectedDepartment, formData, setFormData, appSetEvents }) {
  const [selectedMonth, setSelectedMonth] = useState(getDefaultMonth)
  const [tasks, setTasks] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportTasks, setExportTasks] = useState([])
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === 'All Departments') {
      setColumnFilters([])
    } else {
      setColumnFilters([{ id: 'department', value: selectedDepartment }])
    }
  }, [selectedDepartment])

  useEffect(() => {
    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`

    supabase
      .from('tasks')
      .select('id, customer, unit, service_date, status, priority, department, created_at')
      .eq('status', 'completed')
      .gte('service_date', startDate)
      .lte('service_date', endDate)
      .order('service_date', { ascending: true })
      .then(({ data, error }) => {
        if (error) { console.error(error); return }
        setTasks(data || [])
      })
  }, [selectedMonth])

  async function handleOpenExport() {
    setExportLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('id, customer, unit, service_date, complaint')
      .neq('status', 'completed')
      .order('service_date', { ascending: true })
    if (error) { console.error(error); setExportLoading(false); return }
    setExportTasks(data || [])
    setExportLoading(false)
    setShowExportDialog(true)
  }

  function handleDownloadReport() {
    generateWorkOrderReport(exportTasks)
    setShowExportDialog(false)
  }

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
    const [year, month] = selectedMonth.split('-')
    const startDate = `${year}-${month}-01`
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    setTasks(prev =>
      prev
        .map(task =>
          String(task.id) === String(selectedTask?.id)
            ? { ...task, ...formData }
            : task
        )
        .filter(task =>
          task.status === 'completed' &&
          task.service_date >= startDate &&
          task.service_date <= endDate
        )
    )
  }

  const metrics = DEPARTMENTS.map(dept => ({
    department: dept,
    count: tasks.filter(t => t.department?.toLowerCase() === dept).length,
  }))

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
      <div className="reports-controls">
        <h1>Completed Tasks</h1>
        <button className="export-button" onClick={handleOpenExport} disabled={exportLoading}>
          {exportLoading ? 'Loading...' : 'Export Data'}
        </button>
      </div>

      <div className="reports-metrics">
        {metrics.map(({ department, count }) => (
          <div key={department} className="reports-metric-card">
            <div className="reports-metric-count">{count}</div>
            <div className="reports-metric-label">{department}</div>
          </div>
        ))}
         <div className="reports-metric-card reports-metric-card--total">
          <div className="reports-metric-count">{tasks.length}</div>
          <div className="reports-metric-label">Total</div>
        </div>
         <input
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="reports-month-picker"
        />
      </div>

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
                  className="contract-table-row contract-table-row--completed"
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
                  No completed tasks for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showExportDialog && (
        <div className="modal-backdrop" onClick={() => setShowExportDialog(false)}>
          <div className="editModal" onClick={e => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowExportDialog(false)} aria-label="Close">×</span>
            <div className="task-detail-view">
              <div className="task-detail-header">
                <h2>Export Work Order Report</h2>
              </div>
              <div className="task-detail-fields">
                <div className="task-detail-row">
                  <span className="task-detail-label">Tasks</span>
                  <span className="task-detail-value">{exportTasks.length} active work orders</span>
                </div>
                <div className="task-detail-row">
                  <span className="task-detail-label">Departments</span>
                  <span className="task-detail-value">All</span>
                </div>
                <div className="task-detail-row">
                  <span className="task-detail-label">Format</span>
                  <span className="task-detail-value">PDF — Landscape</span>
                </div>
              </div>
              <div className="modal-buttons" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={handleDownloadReport}>Download PDF</button>
                <button type="button" onClick={() => setShowExportDialog(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
