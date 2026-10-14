// Pure, branch-scoped selectors and helpers shared by the hub workspace pages.
import type { Branch, Manifest, Shipment } from '@/types'

const HOUR = 3_600_000

/** Parcels older than this (hours since last event) are highlighted as ageing. */
export const AGEING_THRESHOLD_HOURS = 48

/** Shipment whose origin and destination facility are the same (no linehaul leg). */
export function isLocal(s: Shipment) {
  return s.originBranchId === s.destinationBranchId
}

/** Heading to this facility: on linehaul towards it, or a rider bringing in a pickup. */
export function isIncoming(s: Shipment, branchId: string) {
  return (s.status === 'in_transit' && s.destinationBranchId === branchId) || (s.status === 'picked_up' && s.originBranchId === branchId)
}

/** Physically on the hub floor. */
export function isInInventory(s: Shipment, branchId: string) {
  return s.currentBranchId === branchId && (s.status === 'at_origin_hub' || s.status === 'at_destination_hub' || s.status === 'failed')
}

/** Waiting for a linehaul manifest to another city. */
export function isLinehaulReady(s: Shipment, branchId: string) {
  return s.status === 'at_origin_hub' && s.currentBranchId === branchId && s.destinationBranchId !== branchId
}

/** Waiting for a rider for local (last-mile) delivery. */
export function isLastMileReady(s: Shipment, branchId: string) {
  return s.currentBranchId === branchId && s.destinationBranchId === branchId && (s.status === 'at_destination_hub' || s.status === 'at_origin_hub')
}

export function isOutForDelivery(s: Shipment, branchId: string) {
  return s.status === 'out_for_delivery' && s.destinationBranchId === branchId
}

/** Failed delivery attempts waiting for a reattempt / return decision. */
export function isReturnPending(s: Shipment, branchId: string) {
  return s.status === 'failed' && s.destinationBranchId === branchId
}

export function lastEventAt(s: Shipment) {
  return s.events[s.events.length - 1]?.timestamp ?? s.createdAt
}

export function ageHours(s: Shipment, now = Date.now()) {
  return Math.max(0, (now - new Date(lastEventAt(s)).getTime()) / HOUR)
}

/** "35m" / "7h" / "3d 4h" */
export function formatAge(hours: number) {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`
  if (hours < 24) return `${Math.floor(hours)}h`
  const days = Math.floor(hours / 24)
  const rest = Math.floor(hours % 24)
  return rest ? `${days}d ${rest}h` : `${days}d`
}

export type BranchMap = Map<string, Branch>

export function toBranchMap(branches: Branch[] | undefined): BranchMap {
  return new Map((branches ?? []).map((b) => [b.id, b]))
}

export function branchLabel(map: BranchMap, id: string) {
  return map.get(id)?.name ?? 'Unknown facility'
}

export function branchCity(map: BranchMap, id: string) {
  return map.get(id)?.city ?? '—'
}

/** Where the parcel goes next from this facility. */
export function nextDestination(s: Shipment, branch: Branch | undefined, map: BranchMap) {
  if (s.status === 'delivered' || s.status === 'returned' || s.status === 'cancelled') return 'None — shipment closed'
  if (branch && s.destinationBranchId === branch.id) return `Last-mile delivery in ${branch.city}`
  return branchLabel(map, s.destinationBranchId)
}

export interface Totals {
  parcels: number
  pieces: number
  weightKg: number
  cod: number
  fragile: number
}

export function totalsOf(shipments: Shipment[]): Totals {
  return shipments.reduce<Totals>(
    (t, s) => ({
      parcels: t.parcels + 1,
      pieces: t.pieces + s.parcel.quantity,
      weightKg: t.weightKg + s.parcel.weightKg,
      cod: t.cod + s.codAmount,
      fragile: t.fragile + (s.parcel.fragile ? 1 : 0),
    }),
    { parcels: 0, pieces: 0, weightKg: 0, cod: 0, fragile: 0 },
  )
}

export function formatKg(value: number) {
  return `${Math.round(value * 10) / 10} kg`
}

/** Shipments on a manifest, in manifest order. */
export function manifestShipments(manifest: Manifest, shipments: Shipment[]) {
  const byId = new Map(shipments.map((s) => [s.id, s]))
  return manifest.shipmentIds.map((id) => byId.get(id)).filter((s): s is Shipment => Boolean(s))
}

/** Rough linehaul ETA for a dispatched manifest (demo estimate, not live tracking). */
export function manifestEta(manifest: Manifest, shipments: Shipment[]) {
  const etas = manifestShipments(manifest, shipments).map((s) => s.estimatedDelivery)
  return etas.length ? etas.reduce((min, e) => (e < min ? e : min)) : undefined
}

export function matchesSearch(s: Shipment, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [s.trackingNumber, s.receiver.name, s.receiver.city, s.sender.name, s.sender.city, s.parcel.description].some((v) => v.toLowerCase().includes(q))
}

// ---- Scan assessment ----

export type ScanActionKey = 'receive' | 'out_for_delivery' | 'reattempt' | 'return' | 'manifest'

export interface ScanAction {
  key: ScanActionKey
  label: string
  /** Keyboard shortcut shown on the button. */
  shortcut: string
}

export interface ScanAssessment {
  tone: 'success' | 'warning'
  headline: string
  message: string
  actions: ScanAction[]
}

/** Decide what a hub operator can do with a scanned parcel at this facility. */
export function assessScan(s: Shipment, branchId: string): ScanAssessment {
  const here = s.currentBranchId === branchId
  if ((s.status === 'booked' || s.status === 'picked_up') && s.originBranchId === branchId) {
    return {
      tone: 'success',
      headline: 'Ready to receive',
      message: s.status === 'booked' ? 'Booked parcel handed over at this facility.' : 'Pickup brought in by a rider.',
      actions: [{ key: 'receive', label: 'Receive at hub', shortcut: 'Enter' }],
    }
  }
  if (s.status === 'in_transit' && s.destinationBranchId === branchId) {
    return {
      tone: 'success',
      headline: 'Expected inbound parcel',
      message: 'Arriving on linehaul for this facility.',
      actions: [{ key: 'receive', label: 'Receive from linehaul', shortcut: 'Enter' }],
    }
  }
  if (here && s.status === 'at_origin_hub' && s.destinationBranchId !== branchId) {
    return {
      tone: 'success',
      headline: s.manifestId ? 'Already on a manifest' : 'Awaiting linehaul',
      message: s.manifestId ? 'This parcel is loaded on a manifest from this hub.' : 'In inventory — add it to a manifest for its destination.',
      actions: [{ key: 'manifest', label: s.manifestId ? 'Open manifest' : 'Add to manifest', shortcut: 'Enter' }],
    }
  }
  if (here && isLastMileReady(s, branchId)) {
    return {
      tone: 'success',
      headline: 'Ready for last-mile',
      message: 'In inventory — assign a rider to send it out for delivery.',
      actions: [{ key: 'out_for_delivery', label: 'Send out for delivery', shortcut: 'Enter' }],
    }
  }
  if (isReturnPending(s, branchId)) {
    return {
      tone: 'warning',
      headline: 'Failed delivery — decision needed',
      message: s.failureReason ? `Last attempt failed: ${s.failureReason}.` : 'The last delivery attempt failed.',
      actions: [
        { key: 'reattempt', label: 'Reattempt delivery', shortcut: 'Enter' },
        { key: 'return', label: 'Return to sender', shortcut: 'R' },
      ],
    }
  }
  if (isOutForDelivery(s, branchId)) {
    return { tone: 'warning', headline: 'Already out for delivery', message: 'This parcel is with a rider. No hub action is available.', actions: [] }
  }
  if (s.status === 'delivered' || s.status === 'returned' || s.status === 'cancelled') {
    return { tone: 'warning', headline: 'Shipment is closed', message: 'This shipment has already been completed. No hub action is available.', actions: [] }
  }
  return {
    tone: 'warning',
    headline: 'Not expected at this facility',
    message: 'This parcel is not routed through this hub right now. Set it aside and inform the shift supervisor.',
    actions: [],
  }
}
