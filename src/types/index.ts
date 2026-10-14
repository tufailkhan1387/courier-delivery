// Domain types shared by every portal. These mirror the DTOs the future NestJS API is expected to return.

export type City = 'Karachi' | 'Lahore' | 'Islamabad' | 'Rawalpindi' | 'Faisalabad' | 'Multan' | 'Peshawar'

export type ShipmentStatus =
  | 'booked'
  | 'picked_up'
  | 'at_origin_hub'
  | 'in_transit'
  | 'at_destination_hub'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'returned'
  | 'cancelled'

export type ServiceType = 'standard' | 'express' | 'same_day'
export type PaymentMethod = 'cod' | 'card' | 'wallet' | 'account'
export type PickupPreference = 'pickup' | 'dropoff'
export type CodStatus = 'na' | 'pending' | 'collected' | 'settled'
export type ParcelCategory = 'documents' | 'apparel' | 'electronics' | 'cosmetics' | 'books' | 'home' | 'food' | 'other'
export type PricingZone = 'within_city' | 'same_zone' | 'different_zone'

export interface Party {
  name: string
  phone: string
  email?: string
  address: string
  city: City
  postalCode: string
}

export interface ParcelDetails {
  category: ParcelCategory
  description: string
  quantity: number
  weightKg: number
  dimensions: { length: number; width: number; height: number }
  declaredValue: number
  fragile: boolean
  instructions?: string
}

export interface TrackingEvent {
  id: string
  status: ShipmentStatus
  title: string
  description: string
  location: string
  timestamp: string
  actor?: string
}

export interface ProofOfDelivery {
  recipientName: string
  deliveredAt: string
  otpVerified: boolean
  signatureDataUrl?: string
  photoDataUrl?: string
  codCollected?: number
}

export interface Shipment {
  id: string
  trackingNumber: string
  customerId: string
  sender: Party
  receiver: Party
  parcel: ParcelDetails
  service: ServiceType
  pickupPreference: PickupPreference
  paymentMethod: PaymentMethod
  codAmount: number
  codStatus: CodStatus
  shippingCost: number
  status: ShipmentStatus
  originBranchId: string
  destinationBranchId: string
  currentBranchId: string
  /** Rider assigned for pickup (while booked) or last-mile delivery. */
  driverId?: string
  manifestId?: string
  createdAt: string
  estimatedDelivery: string
  deliveredAt?: string
  attempts: number
  failureReason?: string
  pod?: ProofOfDelivery
  events: TrackingEvent[]
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: City
  address: string
  accountType: 'individual' | 'business'
  company?: string
  status: 'active' | 'suspended'
  joinedAt: string
}

export interface Branch {
  id: string
  code: string
  name: string
  type: 'hub' | 'branch'
  city: City
  address: string
  phone: string
  managerName: string
  status: 'active' | 'inactive'
  dailyCapacity: number
  openedAt: string
}

export type StaffRole = 'branch_manager' | 'operations' | 'scanner' | 'dispatcher' | 'finance' | 'support'

export interface Staff {
  id: string
  name: string
  email: string
  phone: string
  role: StaffRole
  branchId: string
  status: 'active' | 'on_leave' | 'inactive'
  joinedAt: string
  permissions: string[]
}

export type DriverAvailability = 'available' | 'on_route' | 'off_duty'

export interface Driver {
  id: string
  name: string
  phone: string
  email: string
  branchId: string
  vehicleType: 'bike' | 'van' | 'truck'
  vehiclePlate: string
  availability: DriverAvailability
  rating: number
  joinedAt: string
}

export interface RateCard {
  id: string
  name: string
  zone: PricingZone
  service: ServiceType
  baseWeightKg: number
  basePrice: number
  perKgPrice: number
  eta: string
  active: boolean
}

export interface FinanceConfig {
  codFeePercent: number
  codFeeMin: number
  fragileSurcharge: number
  fuelSurchargePercent: number
}

export interface PriceQuote {
  zone: PricingZone
  chargeableWeightKg: number
  base: number
  weightCharge: number
  fuelSurcharge: number
  fragileSurcharge: number
  codFee: number
  total: number
  eta: string
}

export type ManifestStatus = 'draft' | 'dispatched' | 'received'

export interface Manifest {
  id: string
  number: string
  originBranchId: string
  destinationBranchId: string
  driverId?: string
  vehiclePlate: string
  sealNumber: string
  shipmentIds: string[]
  status: ManifestStatus
  createdAt: string
  dispatchedAt?: string
  receivedAt?: string
  notes?: string
}

export interface SavedAddress extends Party {
  id: string
  customerId: string
  label: string
  isDefault: boolean
}

export interface Payment {
  id: string
  reference: string
  customerId: string
  shipmentId: string
  trackingNumber: string
  amount: number
  method: PaymentMethod
  status: 'paid' | 'pending' | 'refunded'
  date: string
}

export interface TicketMessage {
  id: string
  from: 'customer' | 'support'
  author: string
  text: string
  at: string
}

export interface Ticket {
  id: string
  number: string
  customerId: string
  subject: string
  category: 'delivery' | 'billing' | 'damage' | 'account' | 'other'
  trackingNumber?: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export type PortalKey = 'customer' | 'admin' | 'branch' | 'driver'

export interface AppNotification {
  id: string
  portal: PortalKey
  title: string
  body: string
  at: string
  read: boolean
}

export interface ScanLog {
  id: string
  trackingNumber: string
  branchId: string
  action: string
  resultStatus: ShipmentStatus
  staffName: string
  at: string
}

export interface CodTransaction {
  id: string
  reference: string
  type: 'collection' | 'deposit' | 'settlement'
  amount: number
  driverId?: string
  branchId?: string
  customerId?: string
  shipmentCount: number
  date: string
  note: string
}

export interface Database {
  shipments: Shipment[]
  customers: Customer[]
  branches: Branch[]
  staff: Staff[]
  drivers: Driver[]
  rates: RateCard[]
  financeConfig: FinanceConfig
  manifests: Manifest[]
  addresses: SavedAddress[]
  payments: Payment[]
  tickets: Ticket[]
  notifications: AppNotification[]
  scanLogs: ScanLog[]
  codTransactions: CodTransaction[]
}
