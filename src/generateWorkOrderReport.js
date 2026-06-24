import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function formatDate(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}/${year}`
}

export function generateWorkOrderReport(tasks) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })

  const rows = tasks.map((task, i) => [
    i + 1,
    formatDate(task.service_date),
    '',
    task.customer || '',
    task.unit || '',
    '',
    '',
    '',
    '',
    task.complaint || '',
    '',
  ])

  autoTable(doc, {
    head: [['#', 'ServiceDate', 'TECH#', 'Customer', 'UNIT#', 'HERE', 'IN SHOP', 'DONE', 'CALLED', 'Complaint', 'L']],
    body: rows,
    startY: 8,
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      overflow: 'linebreak',
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 20 },
      2: { cellWidth: 15 },
      3: { cellWidth: 35 },
      4: { cellWidth: 22 },
      5: { cellWidth: 12 },
      6: { cellWidth: 15 },
      7: { cellWidth: 12 },
      8: { cellWidth: 15 },
      9: { cellWidth: 'auto' },
      10: { cellWidth: 12 },
    },
    margin: { top: 8, left: 5, right: 5 },
  })

  const today = new Date().toISOString().slice(0, 10)
  doc.save(`work-orders-${today}.pdf`)
}
