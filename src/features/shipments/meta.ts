import type { CodStatus, ParcelCategory, PaymentMethod, PricingZone, ServiceType, ShipmentStatus } from '@/types'

export type Tone = 'gray' | 'blue' | 'indigo' | 'green' | 'orange' | 'red' | 'purple'

interface StatusMeta {
  label: string
  tone: Tone
  /** Timeline entry title + description template used when a status is applied. */
  eventTitle: string
  eventDescription: string
}

export const STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  booked: { label: 'Booked', tone: 'gray', eventTitle: 'Shipment booked', eventDescription: 'Booking confirmed and awaiting pickup.' },
  picked_up: { label: 'Picked Up', tone: 'indigo', eventTitle: 'Picked up', eventDescription: 'Parcel collected from the sender.' },
  at_origin_hub: { label: 'At Origin Hub', tone: 'indigo', eventTitle: 'Arrived at origin facility', eventDescription: 'Parcel received and sorted at the origin facility.' },
  in_transit: { label: 'In Transit', tone: 'blue', eventTitle: 'In transit', eventDescription: 'Parcel dispatched to the destination facility.' },
  at_destination_hub: { label: 'At Destination Hub', tone: 'purple', eventTitle: 'Arrived at destination facility', eventDescription: 'Parcel received at the destination facility.' },
  out_for_delivery: { label: 'Out for Delivery', tone: 'orange', eventTitle: 'Out for delivery', eventDescription: 'Parcel is with the rider for delivery.' },
  delivered: { label: 'Delivered', tone: 'green', eventTitle: 'Delivered', eventDescription: 'Parcel delivered to the recipient.' },
  failed: { label: 'Delivery Failed', tone: 'red', eventTitle: 'Delivery attempt failed', eventDescription: 'The delivery attempt was unsuccessful.' },
  returned: { label: 'Returned', tone: 'red', eventTitle: 'Returned to sender', eventDescription: 'Parcel is being returned to the sender.' },
  cancelled: { label: 'Cancelled', tone: 'gray', eventTitle: 'Shipment cancelled', eventDescription: 'The booking was cancelled.' },
}

/** The happy-path journey, used by progress indicators and timelines. */
export const STATUS_FLOW: ShipmentStatus[] = [
  'booked',
  'picked_up',
  'at_origin_hub',
  'in_transit',
  'at_destination_hub',
  'out_for_delivery',
  'delivered',
]

export const ALL_STATUSES = Object.keys(STATUS_META) as ShipmentStatus[]

/** Statuses a customer sees grouped as "in transit" on dashboards. */
export const MOVING_STATUSES: ShipmentStatus[] = ['picked_up', 'at_origin_hub', 'in_transit', 'at_destination_hub', 'out_for_delivery']

export const SERVICE_META: Record<ServiceType, { label: string; tagline: string }> = {
  standard: { label: 'Standard', tagline: 'Economical road delivery' },
  express: { label: 'Express', tagline: 'Priority overnight network' },
  same_day: { label: 'Same-Day', tagline: 'Fastest available option' },
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  card: 'Debit / Credit Card',
  wallet: 'Mobile Wallet',
  account: 'Business Account',
}

export const CATEGORY_LABEL: Record<ParcelCategory, string> = {
  documents: 'Documents',
  apparel: 'Apparel & Fashion',
  electronics: 'Electronics',
  cosmetics: 'Cosmetics & Beauty',
  books: 'Books & Stationery',
  home: 'Home & Kitchen',
  food: 'Packaged Food',
  other: 'Other',
}

export const ZONE_LABEL: Record<PricingZone, string> = {
  within_city: 'Within City',
  same_zone: 'Same Zone',
  different_zone: 'Cross Zone',
}

export const COD_STATUS_META: Record<CodStatus, { label: string; tone: Tone }> = {
  na: { label: 'Not applicable', tone: 'gray' },
  pending: { label: 'Pending collection', tone: 'orange' },
  collected: { label: 'Collected', tone: 'blue' },
  settled: { label: 'Settled', tone: 'green' },
}

export const FAILURE_REASONS = [
  'Recipient not available',
  'Incorrect or incomplete address',
  'Recipient refused parcel',
  'Recipient requested reschedule',
  'COD amount not ready',
  'Unable to contact recipient',
]

export function canCancel(status: ShipmentStatus) {
  return status === 'booked'
}

export function canReschedule(status: ShipmentStatus) {
  return status === 'booked' || status === 'failed'
}

export function isActive(status: ShipmentStatus) {
  return !['delivered', 'returned', 'cancelled'].includes(status)
}
