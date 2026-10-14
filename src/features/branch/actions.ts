// Hub mutations: each applies a shipment status through the service layer and records a scan log.
import { CURRENT_BRANCH_ID, CURRENT_STAFF_ID } from '@/data/session'
import { manifestService, scanService, shipmentService, staffService } from '@/services'
import type { Branch, Driver, Manifest, Shipment } from '@/types'

let cachedActor: string | undefined

/** Name of the signed-in demo staff member, used as the actor on events and scan logs. */
export async function currentActor() {
  if (!cachedActor) cachedActor = (await staffService.getById(CURRENT_STAFF_ID))?.name ?? 'Hub staff'
  return cachedActor
}

async function logScan(shipment: Shipment, action: string) {
  await scanService.log({
    trackingNumber: shipment.trackingNumber,
    branchId: CURRENT_BRANCH_ID,
    action,
    resultStatus: shipment.status,
    staffName: await currentActor(),
  })
}

/** Log a scan that did not change the parcel (lookups, exceptions). */
export async function logLookup(shipment: Shipment, action: string) {
  await logScan(shipment, action)
}

/** Receive a parcel: from linehaul if it is in transit, otherwise into the origin facility. */
export async function receiveParcel(shipment: Shipment, branch: Branch | undefined) {
  const actor = await currentActor()
  const fromLinehaul = shipment.status === 'in_transit'
  const next = await shipmentService.updateStatus(shipment.id, fromLinehaul ? 'at_destination_hub' : 'at_origin_hub', {
    actor,
    location: branch?.name,
  })
  await logScan(next, fromLinehaul ? 'Received from linehaul' : 'Received at origin hub')
  return next
}

export async function sendOutForDelivery(shipment: Shipment, driver: Driver) {
  const actor = await currentActor()
  const next = await shipmentService.updateStatus(shipment.id, 'out_for_delivery', {
    actor,
    driverId: driver.id,
    note: `With rider ${driver.name} for delivery.`,
  })
  await logScan(next, `Out for delivery — ${driver.name}`)
  return next
}

export async function scheduleReattempt(shipment: Shipment, note?: string) {
  const actor = await currentActor()
  const next = await shipmentService.updateStatus(shipment.id, 'at_destination_hub', {
    actor,
    note: `Reattempt scheduled by the hub.${note?.trim() ? ` ${note.trim()}` : ''}`,
  })
  await logScan(next, 'Reattempt scheduled')
  return next
}

export async function returnToSender(shipment: Shipment, branch: Branch | undefined) {
  const actor = await currentActor()
  const next = await shipmentService.updateStatus(shipment.id, 'returned', {
    actor,
    location: branch?.name,
    note: `Return to sender initiated${shipment.failureReason ? ` after failed delivery (${shipment.failureReason.toLowerCase()})` : ''}.`,
  })
  await logScan(next, 'Returned to sender')
  return next
}

export async function dispatchManifest(manifest: Manifest) {
  return manifestService.dispatch(manifest.id, await currentActor())
}

export async function receiveManifest(manifest: Manifest) {
  return manifestService.receive(manifest.id, await currentActor())
}
