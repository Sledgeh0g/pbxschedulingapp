import { overflowLabel } from './applyEventCap'

export default function OverflowChip({ event }) {
  return (
    <span className="overflow-chip">{overflowLabel(event)}</span>
  )
}
