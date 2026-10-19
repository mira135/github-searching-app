// Created once and reused; building Intl formatters is relatively expensive.
const countFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

// 457477 → "457.5K"
export function formatCount(count: number): string {
  return countFormatter.format(count)
}

// "2026-10-19T11:55:11Z" → "Oct 19, 2026"
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate))
}
