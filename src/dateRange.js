export function toDateStr(value) {
  if (!value) return ''
  if (typeof value === 'string') return value.slice(0, 10)
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(dateStr, days) {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return toDateStr(date)
}

export function padRange(start, end, padDays) {
  return {
    start: addDays(start, -padDays),
    end: addDays(end, padDays),
  }
}

export function rangeContains(outer, inner) {
  return outer.start <= inner.start && outer.end >= inner.end
}

export function mergeIntervals(intervals) {
  if (!intervals.length) return []
  const sorted = [...intervals].sort((a, b) => a.start < b.start ? -1 : a.start > b.start ? 1 : 0)
  const merged = [{ ...sorted[0] }]
  for (const interval of sorted.slice(1)) {
    const last = merged[merged.length - 1]
    if (interval.start <= last.end) {
      if (interval.end > last.end) last.end = interval.end
    } else {
      merged.push({ ...interval })
    }
  }
  return merged
}
