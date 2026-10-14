import type { Branch, City, Driver, Shipment, ShipmentStatus } from '@/types'

/** Statuses an administrator may move a shipment to from its current status. */
export const NEXT_STATUSES: Record<ShipmentStatus, ShipmentStatus[]> = {
  booked: ['picked_up', 'cancelled'],
  picked_up: ['at_origin_hub'],
  at_origin_hub: ['in_transit'],
  in_transit: ['at_destination_hub'],
  at_destination_hub: ['out_for_delivery', 'returned'],
  out_for_delivery: ['delivered', 'failed'],
  failed: ['out_for_delivery', 'returned'],
  delivered: [],
  returned: [],
  cancelled: [],
}

/** Whether the rider needed right now handles the pickup (origin) or the last mile (destination). */
export function driverLeg(shipment: Shipment): { leg: 'pickup' | 'delivery'; city: City } {
  return shipment.status === 'booked' || shipment.status === 'picked_up'
    ? { leg: 'pickup', city: shipment.sender.city }
    : { leg: 'delivery', city: shipment.receiver.city }
}

export function canAssignDriver(status: ShipmentStatus) {
  return !['delivered', 'returned', 'cancelled'].includes(status)
}

export function driversInCity(drivers: Driver[], branches: Map<string, Branch>, city: City) {
  return drivers.filter((d) => branches.get(d.branchId)?.city === city)
}
