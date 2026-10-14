// Rider-side view of a shipment: which "bucket" a task belongs to and who the rider meets.
import { isToday } from 'date-fns'
import type { Party, Shipment, ShipmentStatus } from '@/types'

export type TaskGroup = 'pending' | 'pickups' | 'completed' | 'failed'

export const TASK_GROUPS: TaskGroup[] = ['pending', 'pickups', 'completed', 'failed']

/** Statuses a pickup task passes through once the rider has collected the parcel. */
const COLLECTED_STATUSES: ShipmentStatus[] = ['picked_up', 'at_origin_hub', 'in_transit']

/** A `booked` shipment with a rider assigned is a pickup at the sender's address. */
export function isPickupTask(shipment: Shipment) {
  return shipment.status === 'booked' || COLLECTED_STATUSES.includes(shipment.status)
}

export function taskGroup(shipment: Shipment): TaskGroup | null {
  if (shipment.status === 'out_for_delivery') return 'pending'
  if (shipment.status === 'booked') return 'pickups'
  if (shipment.status === 'failed') return 'failed'
  if (shipment.status === 'delivered' || COLLECTED_STATUSES.includes(shipment.status)) return 'completed'
  return null
}

/** The person the rider meets: the sender for pickups, the receiver for deliveries. */
export function taskContact(shipment: Shipment): Party {
  return isPickupTask(shipment) ? shipment.sender : shipment.receiver
}

export function fullAddress(party: Party) {
  return `${party.address}, ${party.city} ${party.postalCode}`
}

/** Timestamp of the latest tracking event (falls back to the booking time). */
export function lastUpdateAt(shipment: Shipment) {
  return shipment.events.at(-1)?.timestamp ?? shipment.createdAt
}

/** When the rider closed the task: delivery time, or the latest event for failed / collected parcels. */
export function closedAt(shipment: Shipment) {
  return shipment.status === 'delivered' ? (shipment.deliveredAt ?? lastUpdateAt(shipment)) : lastUpdateAt(shipment)
}

export function closedToday(shipment: Shipment) {
  return isToday(new Date(closedAt(shipment)))
}

export function codCollectedFor(shipment: Shipment) {
  return shipment.pod?.codCollected ?? shipment.codAmount
}

const SERVICE_PRIORITY = { same_day: 0, express: 1, standard: 2 } as const

/** Pending deliveries in suggested stop order: fastest service first, then earliest due. */
export function pendingStops(tasks: Shipment[]) {
  return tasks
    .filter((s) => s.status === 'out_for_delivery')
    .sort((a, b) => SERVICE_PRIORITY[a.service] - SERVICE_PRIORITY[b.service] || a.estimatedDelivery.localeCompare(b.estimatedDelivery))
}

export interface DaySummary {
  pending: Shipment[]
  pickups: Shipment[]
  deliveredToday: Shipment[]
  failedToday: Shipment[]
  assignedToday: number
  codToCollect: number
  codCollected: number
  codParcels: number
}

export function summariseDay(tasks: Shipment[]): DaySummary {
  const pending = pendingStops(tasks)
  const pickups = tasks.filter((s) => s.status === 'booked')
  const deliveredToday = tasks.filter((s) => s.status === 'delivered' && closedToday(s))
  const failedToday = tasks.filter((s) => s.status === 'failed' && closedToday(s))
  const codPending = pending.filter((s) => s.codAmount > 0)
  const codDone = deliveredToday.filter((s) => s.codAmount > 0)
  return {
    pending,
    pickups,
    deliveredToday,
    failedToday,
    assignedToday: pending.length + deliveredToday.length + failedToday.length,
    codToCollect: codPending.reduce((t, s) => t + s.codAmount, 0),
    codCollected: codDone.reduce((t, s) => t + codCollectedFor(s), 0),
    codParcels: codPending.length + codDone.length,
  }
}
