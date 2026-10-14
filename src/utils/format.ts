import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'

const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })

export function formatPKR(amount: number) {
  return `Rs ${pkr.format(Math.round(amount))}`
}

export function formatNumber(value: number) {
  return pkr.format(value)
}

/** 1,250,000 -> "1.25M" for chart axes and compact KPIs. */
export function formatCompact(value: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

export function formatDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy')
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, h:mm a')
}

export function formatTime(iso: string) {
  return format(new Date(iso), 'h:mm a')
}

/** "Today, 3:10 PM" / "Yesterday, 9:00 AM" / "12 Oct, 9:00 AM" */
export function formatFriendlyDateTime(iso: string) {
  const d = new Date(iso)
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`
  return format(d, 'dd MMM, h:mm a')
}

export function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export function titleCase(value: string) {
  return value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function percent(part: number, total: number, digits = 1) {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(digits)}%`
}
