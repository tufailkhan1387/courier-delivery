// Pure COD aggregations over the shipment list.
import type { Customer, Driver, Shipment } from '@/types'

const total = (items: Shipment[]) => items.reduce((t, s) => t + s.codAmount, 0)

export interface CodBucket {
  amount: number
  count: number
}

/** COD value by lifecycle stage. */
export function codTotals(shipments: Shipment[]): Record<'pending' | 'collected' | 'settled', CodBucket> {
  const bucket = (status: Shipment['codStatus']) => {
    const items = shipments.filter((s) => s.codAmount > 0 && s.codStatus === status)
    return { amount: total(items), count: items.length }
  }
  return { pending: bucket('pending'), collected: bucket('collected'), settled: bucket('settled') }
}

/** Delivered COD shipments (cash received from the recipient), newest delivery first. */
export function codCollections(shipments: Shipment[]) {
  return shipments
    .filter((s) => s.codAmount > 0 && (s.codStatus === 'collected' || s.codStatus === 'settled'))
    .sort((a, b) => (b.deliveredAt ?? '').localeCompare(a.deliveredAt ?? ''))
}

export interface SettlementRow {
  customerId: string
  name: string
  accountType: string
  amount: number
  shipments: Shipment[]
  /** Earliest delivery still waiting to be settled. */
  oldest: string
}

/** Collected-but-unsettled COD grouped by the customer it is owed to. */
export function pendingSettlements(shipments: Shipment[], customers: Map<string, Customer>): SettlementRow[] {
  const groups = new Map<string, Shipment[]>()
  for (const s of shipments) {
    if (s.codAmount > 0 && s.codStatus === 'collected') groups.set(s.customerId, [...(groups.get(s.customerId) ?? []), s])
  }
  return [...groups]
    .map(([customerId, items]) => {
      const customer = customers.get(customerId)
      return {
        customerId,
        name: customer?.company ?? customer?.name ?? 'Unknown customer',
        accountType: customer?.accountType ?? 'individual',
        amount: total(items),
        shipments: items,
        oldest: items.reduce((min, s) => (s.deliveredAt && s.deliveredAt < min ? s.deliveredAt : min), items[0].deliveredAt ?? items[0].createdAt),
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

export interface DriverCashRow {
  driver: Driver
  amount: number
  shipments: Shipment[]
}

/** COD cash each driver collected that has not been settled yet. */
export function driverCash(shipments: Shipment[], drivers: Driver[]): DriverCashRow[] {
  return drivers
    .map((driver) => {
      const items = shipments.filter((s) => s.driverId === driver.id && s.codAmount > 0 && s.codStatus === 'collected')
      return { driver, amount: total(items), shipments: items }
    })
    .filter((row) => row.shipments.length > 0)
    .sort((a, b) => b.amount - a.amount)
}
