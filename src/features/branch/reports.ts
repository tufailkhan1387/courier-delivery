// Derived operational statistics for one facility, computed from shipment tracking events.
import { format, startOfDay, subDays } from 'date-fns'
import type { Driver, Shipment, TrackingEvent } from '@/types'

export type FlowKind = 'received' | 'dispatched' | 'delivered' | 'failed'

/** Classify a tracking event as work done at / for this facility. */
export function flowKind(s: Shipment, e: TrackingEvent, branchId: string): FlowKind | undefined {
  const origin = s.originBranchId === branchId
  const destination = s.destinationBranchId === branchId
  if ((e.status === 'at_origin_hub' && origin) || (e.status === 'at_destination_hub' && destination)) return 'received'
  if ((e.status === 'in_transit' && origin && !destination) || (e.status === 'out_for_delivery' && destination)) return 'dispatched'
  if (e.status === 'delivered' && destination) return 'delivered'
  if (e.status === 'failed' && destination) return 'failed'
  return undefined
}

export interface DayStat extends Record<FlowKind, number> {
  date: string
  label: string
}

/** One row per calendar day for the last `days` days (oldest first). */
export function dailyThroughput(shipments: Shipment[], branchId: string, days: number, now = new Date()): DayStat[] {
  const start = startOfDay(subDays(now, days - 1))
  const rows = new Map<string, DayStat>()
  for (let i = 0; i < days; i++) {
    const d = subDays(now, days - 1 - i)
    const date = format(d, 'yyyy-MM-dd')
    rows.set(date, { date, label: format(d, days > 10 ? 'd MMM' : 'EEE d'), received: 0, dispatched: 0, delivered: 0, failed: 0 })
  }
  for (const s of shipments) {
    for (const e of s.events) {
      const at = new Date(e.timestamp)
      if (at < start) continue
      const kind = flowKind(s, e, branchId)
      const row = rows.get(format(at, 'yyyy-MM-dd'))
      if (kind && row) row[kind] += 1
    }
  }
  return [...rows.values()]
}

export function sumFlow(rows: DayStat[]): Record<FlowKind, number> {
  return rows.reduce((t, r) => ({ received: t.received + r.received, dispatched: t.dispatched + r.dispatched, delivered: t.delivered + r.delivered, failed: t.failed + r.failed }), {
    received: 0,
    dispatched: 0,
    delivered: 0,
    failed: 0,
  })
}

export interface RiderStat {
  driver: Driver
  delivered: number
  failed: number
  onBoard: number
  codCollected: number
  /** Delivered / (delivered + failed) as 0–100, or null when there were no attempts. */
  successRate: number | null
}

/** Last-mile results per rider of this branch within the period. */
export function riderPerformance(shipments: Shipment[], drivers: Driver[], branchId: string, since: Date): RiderStat[] {
  return drivers
    .map((driver) => {
      const mine = shipments.filter((s) => s.driverId === driver.id && s.destinationBranchId === branchId)
      const inPeriod = (status: 'delivered' | 'failed') => mine.filter((s) => s.events.some((e) => e.status === status && new Date(e.timestamp) >= since))
      const delivered = inPeriod('delivered')
      const failed = inPeriod('failed').length
      const attempts = delivered.length + failed
      return {
        driver,
        delivered: delivered.length,
        failed,
        onBoard: mine.filter((s) => s.status === 'out_for_delivery').length,
        codCollected: delivered.reduce((t, s) => t + s.codAmount, 0),
        successRate: attempts ? (delivered.length / attempts) * 100 : null,
      }
    })
    .sort((a, b) => b.delivered - a.delivered)
}
