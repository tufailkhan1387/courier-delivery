import { CITY_INFO } from '@/data/cities'
import { mainBranchFor } from '@/data/directory'
import { calculateQuote } from '@/features/pricing/calc'
import { STATUS_META } from '@/features/shipments/meta'
import type { ParcelDetails, Party, PaymentMethod, PickupPreference, ProofOfDelivery, ServiceType, Shipment, ShipmentStatus, TrackingEvent } from '@/types'
import { generateTrackingNumber, uid } from '@/utils/id'
import { delay, getDb, setDb } from './db'

export interface CreateShipmentInput {
  customerId: string
  sender: Party
  receiver: Party
  parcel: ParcelDetails
  service: ServiceType
  pickupPreference: PickupPreference
  paymentMethod: PaymentMethod
  codAmount: number
}

export interface StatusUpdateOptions {
  location?: string
  note?: string
  actor?: string
  driverId?: string
  failureReason?: string
  pod?: ProofOfDelivery
}

const ETA_HOURS: Record<ServiceType, number> = { standard: 84, express: 36, same_day: 9 }

function patchShipment(id: string, updater: (s: Shipment) => Shipment): Shipment {
  const db = getDb()
  const current = db.shipments.find((s) => s.id === id)
  if (!current) throw new Error('Shipment not found')
  const next = updater(current)
  setDb({ shipments: db.shipments.map((s) => (s.id === id ? next : s)) })
  return next
}

function branchName(id: string) {
  return getDb().branches.find((b) => b.id === id)?.name ?? 'CourierPro facility'
}

function buildEvent(shipment: Shipment, status: ShipmentStatus, opts: StatusUpdateOptions): TrackingEvent {
  const meta = STATUS_META[status]
  const atDestination = ['at_destination_hub', 'out_for_delivery', 'delivered', 'failed'].includes(status)
  const fallbackLocation =
    status === 'delivered' || status === 'failed'
      ? shipment.receiver.city
      : branchName(atDestination ? shipment.destinationBranchId : shipment.originBranchId)
  return {
    id: uid('evt'),
    status,
    title: meta.eventTitle,
    description: opts.note || (status === 'failed' && opts.failureReason ? `${opts.failureReason}.` : meta.eventDescription),
    location: opts.location ?? fallbackLocation,
    timestamp: new Date().toISOString(),
    actor: opts.actor,
  }
}

export const shipmentService = {
  list(): Promise<Shipment[]> {
    return delay(getDb().shipments)
  },

  listByCustomer(customerId: string): Promise<Shipment[]> {
    return delay(getDb().shipments.filter((s) => s.customerId === customerId))
  },

  listByDriver(driverId: string): Promise<Shipment[]> {
    return delay(getDb().shipments.filter((s) => s.driverId === driverId))
  },

  getById(id: string): Promise<Shipment | undefined> {
    return delay(getDb().shipments.find((s) => s.id === id))
  },

  getByTrackingNumber(trackingNumber: string): Promise<Shipment | undefined> {
    const needle = trackingNumber.trim().toUpperCase()
    return delay(
      getDb().shipments.find((s) => s.trackingNumber === needle),
      450,
    )
  },

  create(input: CreateShipmentInput): Promise<Shipment> {
    const db = getDb()
    const origin = mainBranchFor(input.sender.city, db.branches)
    const destination = mainBranchFor(input.receiver.city, db.branches)
    const codAmount = input.paymentMethod === 'cod' ? input.codAmount : 0
    const quote = calculateQuote(
      {
        origin: input.sender.city,
        destination: input.receiver.city,
        service: input.service,
        weightKg: input.parcel.weightKg,
        dimensions: input.parcel.dimensions,
        quantity: input.parcel.quantity,
        fragile: input.parcel.fragile,
        codAmount,
      },
      db.rates,
      db.financeConfig,
    )
    const now = new Date()
    const base: Shipment = {
      id: uid('shp'),
      trackingNumber: generateTrackingNumber(CITY_INFO[input.sender.city].code),
      customerId: input.customerId,
      sender: input.sender,
      receiver: input.receiver,
      parcel: input.parcel,
      service: input.service,
      pickupPreference: input.pickupPreference,
      paymentMethod: input.paymentMethod,
      codAmount,
      codStatus: codAmount > 0 ? 'pending' : 'na',
      shippingCost: quote?.total ?? 0,
      status: 'booked',
      originBranchId: origin.id,
      destinationBranchId: destination.id,
      currentBranchId: origin.id,
      createdAt: now.toISOString(),
      estimatedDelivery: new Date(now.getTime() + ETA_HOURS[input.service] * 3_600_000).toISOString(),
      attempts: 0,
      events: [],
    }
    const shipment: Shipment = { ...base, events: [buildEvent(base, 'booked', {})] }
    setDb({
      shipments: [shipment, ...db.shipments],
      payments: [
        {
          id: uid('pay'),
          reference: `INV-${Math.floor(70000 + Math.random() * 9999)}`,
          customerId: input.customerId,
          shipmentId: shipment.id,
          trackingNumber: shipment.trackingNumber,
          amount: shipment.shippingCost,
          method: input.paymentMethod,
          status: input.paymentMethod === 'cod' ? 'pending' : 'paid',
          date: shipment.createdAt,
        },
        ...db.payments,
      ],
    })
    return delay(shipment, 900)
  },

  /** Apply a new status and append the matching tracking event. */
  updateStatus(id: string, status: ShipmentStatus, opts: StatusUpdateOptions = {}): Promise<Shipment> {
    const next = patchShipment(id, (s) => {
      const atDestination = ['at_destination_hub', 'out_for_delivery', 'delivered', 'failed'].includes(status)
      const now = new Date().toISOString()
      return {
        ...s,
        status,
        currentBranchId: status === 'returned' ? s.originBranchId : atDestination ? s.destinationBranchId : s.currentBranchId,
        driverId: opts.driverId ?? s.driverId,
        attempts: status === 'delivered' || status === 'failed' ? s.attempts + 1 : s.attempts,
        failureReason: status === 'failed' ? opts.failureReason : status === 'returned' ? s.failureReason : undefined,
        deliveredAt: status === 'delivered' ? now : s.deliveredAt,
        pod: status === 'delivered' ? (opts.pod ?? s.pod) : s.pod,
        codStatus:
          s.codAmount > 0
            ? status === 'delivered'
              ? 'collected'
              : status === 'returned' || status === 'cancelled'
                ? 'na'
                : s.codStatus
            : s.codStatus,
        events: [...s.events, buildEvent(s, status, opts)],
      }
    })
    if ((status === 'delivered' && next.paymentMethod === 'cod') || status === 'cancelled') {
      // COD invoices are paid on delivery; a cancelled booking's invoice is marked refunded (mock).
      const paymentStatus = status === 'cancelled' ? ('refunded' as const) : ('paid' as const)
      setDb({ payments: getDb().payments.map((p) => (p.shipmentId === id ? { ...p, status: paymentStatus } : p)) })
    }
    return delay(next)
  },

  assignDriver(id: string, driverId: string): Promise<Shipment> {
    const driver = getDb().drivers.find((d) => d.id === driverId)
    return delay(
      patchShipment(id, (s) => ({
        ...s,
        driverId,
        events: [
          ...s.events,
          {
            id: uid('evt'),
            status: s.status,
            title: 'Rider assigned',
            description: `${driver?.name ?? 'A rider'} assigned for ${s.status === 'booked' ? 'pickup' : 'delivery'}.`,
            location: branchName(s.currentBranchId),
            timestamp: new Date().toISOString(),
          },
        ],
      })),
    )
  },

  cancel(id: string): Promise<Shipment> {
    return shipmentService.updateStatus(id, 'cancelled', { note: 'Cancelled at the customer’s request.' })
  },

  /** Mock reschedule: moves the estimated delivery date and logs a note on the timeline. */
  reschedule(id: string, dateIso: string): Promise<Shipment> {
    return delay(
      patchShipment(id, (s) => ({
        ...s,
        estimatedDelivery: dateIso,
        status: s.status === 'failed' ? 'at_destination_hub' : s.status,
        events: [
          ...s.events,
          {
            id: uid('evt'),
            status: s.status === 'failed' ? 'at_destination_hub' : s.status,
            title: s.status === 'failed' ? 'Reattempt scheduled' : s.pickupPreference === 'pickup' ? 'Pickup rescheduled' : 'Drop-off rescheduled',
            description: `Rescheduled for ${new Date(dateIso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`,
            location: branchName(s.currentBranchId),
            timestamp: new Date().toISOString(),
          },
        ],
      })),
    )
  },
}
