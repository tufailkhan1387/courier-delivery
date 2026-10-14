// Pure aggregations over the shipment list, shared by the dashboard, reports and detail pages.
import { format, startOfDay, subDays } from 'date-fns'
import { MOVING_STATUSES } from '@/features/shipments/meta'
import type { Branch, Driver, Shipment } from '@/types'

export const DAY_MS = 86_400_000

/** Timestamp of the start of a window covering the last `days` calendar days, today included. */
export function sinceDays(days: number) {
  return startOfDay(subDays(new Date(), days - 1)).getTime()
}

export function inRange(iso: string | undefined, since: number) {
  return !!iso && new Date(iso).getTime() >= since
}

/** Time of the most recent failed delivery attempt, if any. */
export function failedAt(shipment: Shipment): string | undefined {
  for (let i = shipment.events.length - 1; i >= 0; i--) {
    if (shipment.events[i].status === 'failed') return shipment.events[i].timestamp
  }
  return undefined
}

export function sumBy<T>(items: T[], value: (item: T) => number) {
  return items.reduce((total, item) => total + value(item), 0)
}

/** Counts items per key, largest first. */
export function countBy<T>(items: T[], key: (item: T) => string | undefined) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Delivered share of completed attempts, as a percentage with one decimal (null when there were none). */
export function successRate(delivered: number, failed: number): number | null {
  const attempts = delivered + failed
  return attempts ? Math.round((delivered / attempts) * 1000) / 10 : null
}

export function formatRate(rate: number | null) {
  return rate === null ? '—' : `${rate}%`
}

export const isCodOutstanding = (s: Shipment) => s.codStatus === 'pending' || s.codStatus === 'collected'
export const isCodReceived = (s: Shipment) => s.codStatus === 'collected' || s.codStatus === 'settled'
/** Between pickup and the destination facility (excludes last-mile). */
export const isInTransit = (s: Shipment) => MOVING_STATUSES.includes(s.status) && s.status !== 'out_for_delivery'

export type SeriesPoint = {
  date: string
  label: string
  booked: number
  delivered: number
  failed: number
  successRate: number | null
  codAwaiting: number
  codSettled: number
}

/**
 * Time series for the last `days` days. `bucketDays` groups days together (7 = weekly)
 * so long ranges stay readable.
 */
export function buildSeries(shipments: Shipment[], days: number, bucketDays = 1): SeriesPoint[] {
  const start = sinceDays(days)
  const size = bucketDays * DAY_MS
  const points: SeriesPoint[] = Array.from({ length: Math.ceil(days / bucketDays) }, (_, i) => {
    const at = new Date(start + i * size)
    return { date: format(at, 'yyyy-MM-dd'), label: format(at, 'dd MMM'), booked: 0, delivered: 0, failed: 0, successRate: null, codAwaiting: 0, codSettled: 0 }
  })
  const bucket = (iso: string | undefined) => {
    if (!iso) return undefined
    return points[Math.floor((new Date(iso).getTime() - start) / size)]
  }
  for (const s of shipments) {
    const booked = bucket(s.createdAt)
    if (booked) booked.booked++
    const delivered = bucket(s.deliveredAt)
    if (delivered) {
      delivered.delivered++
      if (s.codStatus === 'collected') delivered.codAwaiting += s.codAmount
      if (s.codStatus === 'settled') delivered.codSettled += s.codAmount
    }
    const failed = bucket(failedAt(s))
    if (failed) failed.failed++
  }
  for (const p of points) p.successRate = successRate(p.delivered, p.failed)
  return points
}

export interface PerformanceRow {
  id: string
  name: string
  /** City for branches, home branch name for drivers. */
  group: string
  originated: number
  delivered: number
  failed: number
  successRate: number | null
  codCollected: number
}

function performance(delivered: Shipment[], failed: number) {
  return {
    delivered: delivered.length,
    failed,
    successRate: successRate(delivered.length, failed),
    codCollected: sumBy(delivered.filter(isCodReceived), (s) => s.codAmount),
  }
}

export function branchPerformance(shipments: Shipment[], branches: Branch[], since: number): PerformanceRow[] {
  return branches.map((b) => ({
    id: b.id,
    name: b.name,
    group: b.city,
    originated: shipments.filter((s) => s.originBranchId === b.id && inRange(s.createdAt, since)).length,
    ...performance(
      shipments.filter((s) => s.destinationBranchId === b.id && inRange(s.deliveredAt, since)),
      shipments.filter((s) => s.destinationBranchId === b.id && inRange(failedAt(s), since)).length,
    ),
  }))
}

export function driverPerformance(shipments: Shipment[], drivers: Driver[], branches: Map<string, Branch>, since: number): PerformanceRow[] {
  return drivers.map((d) => ({
    id: d.id,
    name: d.name,
    group: branches.get(d.branchId)?.name ?? '—',
    originated: 0,
    ...performance(
      shipments.filter((s) => s.driverId === d.id && inRange(s.deliveredAt, since)),
      shipments.filter((s) => s.driverId === d.id && inRange(failedAt(s), since)).length,
    ),
  }))
}

/** Operational counts for one facility. */
export function branchLoad(shipments: Shipment[], branchId: string) {
  return {
    atBranch: shipments.filter((s) => s.currentBranchId === branchId && ['at_origin_hub', 'at_destination_hub', 'failed'].includes(s.status)).length,
    inbound: shipments.filter((s) => s.destinationBranchId === branchId && s.status === 'in_transit').length,
    outbound: shipments.filter((s) => s.originBranchId === branchId && ['booked', 'picked_up', 'at_origin_hub'].includes(s.status)).length,
    delivered30: shipments.filter((s) => s.destinationBranchId === branchId && inRange(s.deliveredAt, sinceDays(30))).length,
  }
}
