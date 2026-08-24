import { eventOrderComparator } from './mapTaskToEvent'
import { OVERFLOW_ID_PREFIX } from './constants'

export function isOverflowEvent(event) {
  const id = event?.id
  return Boolean(event?.extendedProps?.overflow || (typeof id === 'string' && id.startsWith(OVERFLOW_ID_PREFIX)))
}

function makeOverflowEvent(date, hiddenCount, expanded, kind) {
  return {
    id: `${OVERFLOW_ID_PREFIX}${kind}-${date}`,
    title: expanded ? 'Show less' : `+${hiddenCount}`,
    start: date,
    editable: false,
    durationEditable: false,
    startEditable: false,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: '#4b5563',
    classNames: ['overflow-event'],
    extendedProps: {
      overflow: true,
      overflowDate: date,
      hiddenCount,
      expanded,
      kind,
    },
  }
}

export function applyDayEventCap(events, { cap, expandedDates, searchActive }) {
  if (searchActive || !events?.length) {
    return (events || []).filter(event => !isOverflowEvent(event))
  }

  const groups = new Map()
  for (const event of events) {
    if (isOverflowEvent(event)) continue
    const date = event.start
    if (!groups.has(date)) groups.set(date, [])
    groups.get(date).push(event)
  }

  const result = []
  for (const [date, dayEvents] of groups) {
    dayEvents.sort(eventOrderComparator)
    const expanded = expandedDates.has(date)
    if (dayEvents.length <= cap) {
      result.push(...dayEvents)
      continue
    }
    if (expanded) {
      result.push(...dayEvents)
      result.push(makeOverflowEvent(date, 0, true, 'day'))
    } else {
      result.push(...dayEvents.slice(0, cap))
      result.push(makeOverflowEvent(date, dayEvents.length - cap, false, 'day'))
    }
  }
  return result
}

export function applyListDayCap(events, { cap, expanded, searchActive, viewStart, viewEnd }) {
  const realEvents = (events || []).filter(event => !isOverflowEvent(event))
  if (searchActive || !viewStart || !viewEnd) return realEvents

  const inView = realEvents.filter(event => event.start >= viewStart && event.start < viewEnd)
  const outside = realEvents.filter(event => event.start < viewStart || event.start >= viewEnd)
  const dates = [...new Set(inView.map(event => event.start))].sort()

  if (dates.length <= cap) return realEvents

  if (expanded) {
    return [...inView, ...outside, makeOverflowEvent(dates[dates.length - 1], dates.length - cap, true, 'list')]
  }

  const shown = new Set(dates.slice(0, cap))
  const visible = inView.filter(event => shown.has(event.start))
  return [...visible, ...outside, makeOverflowEvent(dates[cap - 1], dates.length - cap, false, 'list')]
}

export function overflowLabel(event) {
  const { expanded, hiddenCount, kind } = event.extendedProps || {}
  if (expanded) return '⌃ Show less'
  if (kind === 'list') return `+${hiddenCount} more days ⌄`
  return `+${hiddenCount} ⌄`
}
