// Deterministic demo-data generator. Produces a full, internally consistent Database
// (shipments with tracking history, manifests, payments, COD ledger, tickets …) relative to "now".
import { calculateQuote } from '@/features/pricing/calc'
import { STATUS_FLOW, STATUS_META, FAILURE_REASONS } from '@/features/shipments/meta'
import type {
  AppNotification,
  City,
  CodTransaction,
  Database,
  Manifest,
  ParcelCategory,
  Party,
  Payment,
  SavedAddress,
  ScanLog,
  ServiceType,
  Shipment,
  ShipmentStatus,
  Ticket,
  TrackingEvent,
} from '@/types'
import { CITIES, CITY_INFO } from './cities'
import { mainBranchFor, SEED_BRANCHES, SEED_CUSTOMERS, SEED_DRIVERS, SEED_STAFF } from './directory'
import { SEED_FINANCE_CONFIG, SEED_RATES } from './rates'
import { CURRENT_BRANCH_ID, CURRENT_CUSTOMER_ID, CURRENT_DRIVER_ID } from './session'

const HOUR = 3_600_000

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RECEIVER_NAMES = [
  'Ahmed Sheikh', 'Bushra Naeem', 'Kamran Yousaf', 'Sidra Iqbal', 'Waleed Hassan', 'Anum Tariq', 'Faizan Mir', 'Laiba Shahid',
  'Moiz Rehman', 'Zoya Farhan', 'Haris Jamil', 'Mariam Zaidi', 'Shahbaz Latif', 'Areeba Saleem', 'Talha Nasir', 'Kiran Javed',
  'Rizwan Haider', 'Saba Qamar Ali', 'Junaid Safdar', 'Esha Rauf', 'Arsalan Pervez', 'Minahil Asif', 'Owais Karim', 'Tehmina Dar',
]

const PARCELS: Record<ParcelCategory, { items: string[]; weight: [number, number]; value: [number, number] }> = {
  documents: { items: ['Legal documents', 'University transcripts', 'Bank cheque book', 'Signed contracts'], weight: [0.2, 0.5], value: [500, 2000] },
  apparel: { items: ['Embroidered lawn suit (3 pc)', 'Men’s kurta shalwar', 'Winter jackets', 'Bridal dupatta'], weight: [0.5, 3], value: [3500, 28000] },
  electronics: { items: ['Wireless earbuds', 'Android smartphone', 'Laptop charger', 'Smart watch', 'Bluetooth speaker'], weight: [0.3, 4], value: [4500, 95000] },
  cosmetics: { items: ['Skincare gift set', 'Perfume bottles', 'Makeup palette'], weight: [0.3, 1.5], value: [2500, 16000] },
  books: { items: ['CSS exam guide books', 'Children’s story books', 'Medical textbooks'], weight: [0.8, 6], value: [1500, 12000] },
  home: { items: ['Ceramic dinner set', 'Bedsheet set (king)', 'Non-stick cookware', 'Handmade table lamp'], weight: [1.5, 9], value: [3000, 24000] },
  food: { items: ['Dry fruit gift box', 'Multani sohan halwa', 'Organic honey jars'], weight: [0.5, 5], value: [1800, 9500] },
  other: { items: ['Cricket bat', 'Handmade khussa pair', 'Auto spare parts'], weight: [0.5, 7], value: [2000, 18000] },
}

const CATEGORIES = Object.keys(PARCELS) as ParcelCategory[]

interface Scenario {
  status: ShipmentStatus
  hoursAgo: number
  customerId?: string
  origin?: City
  destination?: City
  driverId?: string
  cod?: boolean
}

export function generateSeed(now = Date.now()): Database {
  const rnd = mulberry32(20261013)
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]
  const between = (min: number, max: number) => min + rnd() * (max - min)
  const int = (min: number, max: number) => Math.floor(between(min, max + 1))
  const iso = (ms: number) => new Date(ms).toISOString()

  const branches = SEED_BRANCHES
  const customers = SEED_CUSTOMERS
  const drivers = SEED_DRIVERS
  const staff = SEED_STAFF
  const driversIn = (city: City) => drivers.filter((d) => branches.find((b) => b.id === d.branchId)?.city === city)

  // ---- Scenario list: guaranteed data for the demo identities, then a random spread ----
  const scenarios: Scenario[] = []
  const add = (count: number, s: Omit<Scenario, 'hoursAgo'> & { hours: [number, number] }) => {
    for (let i = 0; i < count; i++) scenarios.push({ ...s, hoursAgo: between(s.hours[0], s.hours[1]) })
  }
  const me = { customerId: CURRENT_CUSTOMER_ID, origin: 'Lahore' as City }
  add(2, { ...me, status: 'booked', hours: [1, 9] })
  add(1, { ...me, status: 'picked_up', hours: [1, 4] })
  add(1, { ...me, status: 'at_origin_hub', hours: [2, 8] })
  add(3, { ...me, status: 'in_transit', hours: [2, 18] })
  add(1, { ...me, status: 'at_destination_hub', hours: [1, 6] })
  add(2, { ...me, status: 'out_for_delivery', hours: [0.5, 3] })
  add(9, { ...me, status: 'delivered', hours: [20, 900] })
  add(1, { ...me, status: 'failed', hours: [3, 20] })
  add(1, { ...me, status: 'cancelled', hours: [100, 400] })

  const rider = { destination: 'Lahore' as City, driverId: CURRENT_DRIVER_ID }
  add(4, { ...rider, status: 'out_for_delivery', hours: [0.5, 2.5], cod: true })
  add(3, { ...rider, status: 'out_for_delivery', hours: [0.5, 2.5], cod: false })
  add(2, { ...rider, status: 'delivered', hours: [0.3, 2], cod: true })
  add(1, { ...rider, status: 'delivered', hours: [0.3, 2], cod: false })
  add(1, { ...rider, status: 'failed', hours: [0.3, 1.5], cod: true })
  add(2, { origin: 'Lahore', driverId: CURRENT_DRIVER_ID, status: 'booked', hours: [0.5, 3] })

  add(6, { destination: 'Lahore', status: 'in_transit', hours: [2, 14] })
  add(6, { destination: 'Lahore', status: 'at_destination_hub', hours: [1, 10] })
  add(5, { origin: 'Lahore', status: 'at_origin_hub', hours: [1, 8] })
  add(3, { origin: 'Lahore', status: 'picked_up', hours: [0.5, 3] })
  add(2, { destination: 'Lahore', status: 'failed', hours: [4, 40] })
  add(2, { origin: 'Lahore', status: 'returned', hours: [30, 200] })

  const spread: [ShipmentStatus, number, [number, number]][] = [
    ['booked', 9, [0.5, 20]],
    ['picked_up', 4, [0.5, 6]],
    ['at_origin_hub', 6, [1, 10]],
    ['in_transit', 12, [1, 20]],
    ['at_destination_hub', 7, [1, 12]],
    ['out_for_delivery', 9, [0.5, 6]],
    ['delivered', 62, [2, 1080]],
    ['failed', 6, [1, 72]],
    ['returned', 4, [24, 700]],
    ['cancelled', 4, [24, 700]],
  ]
  for (const [status, count, hours] of spread) add(count, { status, hours })

  // ---- Build shipments ----
  const shipments: Shipment[] = scenarios.map((sc, index) => {
    const customer = sc.customerId
      ? customers.find((c) => c.id === sc.customerId)!
      : sc.origin
        ? (pick(customers.filter((c) => c.city === sc.origin && c.id !== CURRENT_CUSTOMER_ID)) ?? pick(customers))
        : pick(customers.slice(1))
    const origin: City = sc.origin ?? customer.city
    const destination: City = sc.destination ?? (rnd() < 0.15 ? origin : pick(CITIES.filter((c) => c !== origin)))
    const originBranch = mainBranchFor(origin, branches)
    const destBranch = mainBranchFor(destination, branches)

    const category = pick(CATEGORIES)
    const spec = PARCELS[category]
    const weightKg = Math.round(between(spec.weight[0], spec.weight[1]) * 10) / 10
    const declaredValue = Math.round(between(spec.value[0], spec.value[1]) / 50) * 50
    const fragile = category === 'electronics' || category === 'home' ? rnd() < 0.6 : rnd() < 0.08
    const service: ServiceType = origin === destination && rnd() < 0.35 ? 'same_day' : rnd() < 0.3 ? 'express' : 'standard'
    const isCod = sc.cod ?? rnd() < 0.45
    const codAmount = isCod ? declaredValue : 0
    const dimensions = { length: int(15, 45), width: int(10, 35), height: int(4, 25) }
    const quantity = rnd() < 0.8 ? 1 : int(2, 4)

    const destAreas = CITY_INFO[destination].areas
    const receiverName = pick(RECEIVER_NAMES)
    const sender: Party = {
      name: customer.company ?? customer.name,
      phone: customer.phone,
      email: customer.email,
      address: origin === customer.city ? customer.address : `Office ${int(1, 40)}, ${pick(CITY_INFO[origin].areas)}`,
      city: origin,
      postalCode: `${CITY_INFO[origin].postalPrefix}${int(100, 999)}`,
    }
    const receiver: Party = {
      name: receiverName,
      phone: `+92 3${String(int(0, 49)).padStart(2, '0')} 555 ${int(1000, 9999)}`,
      email: rnd() < 0.5 ? `${receiverName.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com` : undefined,
      address: `House ${int(1, 240)}, Street ${int(1, 30)}, ${pick(destAreas)}`,
      city: destination,
      postalCode: `${CITY_INFO[destination].postalPrefix}${int(100, 999)}`,
    }

    const quote = calculateQuote(
      { origin, destination, service, weightKg, dimensions, quantity, fragile, codAmount },
      SEED_RATES,
      SEED_FINANCE_CONFIG,
    )

    // Status path for this shipment
    let path: ShipmentStatus[]
    if (sc.status === 'cancelled') path = ['booked', 'cancelled']
    else if (sc.status === 'failed') path = [...STATUS_FLOW.slice(0, 6), 'failed']
    else if (sc.status === 'returned') path = [...STATUS_FLOW.slice(0, 6), 'failed', 'returned']
    else path = STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(sc.status) + 1)

    const needsRider = path.includes('out_for_delivery')
    const driver = sc.driverId
      ? drivers.find((d) => d.id === sc.driverId)
      : needsRider
        ? pick(driversIn(destination).filter((d) => d.id !== CURRENT_DRIVER_ID))
        : sc.status === 'booked' && rnd() < 0.5
          ? pick(driversIn(origin).filter((d) => d.id !== CURRENT_DRIVER_ID))
          : undefined
    const failureReason = path.includes('failed') ? pick(FAILURE_REASONS) : undefined

    // Walk backwards from the latest event to assign timestamps
    const lastAt = now - sc.hoursAgo * HOUR
    const gapHours: Record<ServiceType, [number, number]> = { standard: [5, 16], express: [3, 8], same_day: [0.7, 2] }
    const times: number[] = [lastAt]
    for (let i = path.length - 1; i > 0; i--) times.unshift(times[0] - between(...gapHours[service]) * HOUR)

    const events: TrackingEvent[] = path.map((status, i) => {
      const meta = STATUS_META[status]
      const atOrigin = ['booked', 'picked_up', 'at_origin_hub', 'in_transit', 'cancelled'].includes(status)
      let description = meta.eventDescription
      if (status === 'in_transit') description = `Dispatched from ${originBranch.name} to ${destBranch.name}.`
      if (status === 'out_for_delivery' && driver) description = `With rider ${driver.name} for delivery.`
      if (status === 'delivered') description = `Delivered to ${receiver.name}.`
      if (status === 'failed' && failureReason) description = `${failureReason}.`
      return {
        id: `evt_${index}_${i}`,
        status,
        title: meta.eventTitle,
        description,
        location: status === 'delivered' || status === 'failed' ? `${destination}` : atOrigin ? originBranch.name : destBranch.name,
        timestamp: iso(times[i]),
        actor: ['out_for_delivery', 'delivered', 'failed'].includes(status) ? driver?.name : undefined,
      }
    })

    const createdAt = times[0]
    const etaHours: Record<ServiceType, number> = { standard: 84, express: 36, same_day: 9 }
    const deliveredAt = sc.status === 'delivered' ? iso(lastAt) : undefined
    const atDestination = ['at_destination_hub', 'out_for_delivery', 'delivered', 'failed'].includes(sc.status)

    return {
      id: `shp_${String(index + 1).padStart(4, '0')}`,
      trackingNumber: `CP${CITY_INFO[origin].code}${int(10_000_000, 99_999_999)}`,
      customerId: customer.id,
      sender,
      receiver,
      parcel: {
        category,
        description: pick(spec.items),
        quantity,
        weightKg,
        dimensions,
        declaredValue,
        fragile,
        instructions: rnd() < 0.3 ? pick(['Call before delivery', 'Deliver after 5 PM', 'Leave with security guard', 'Handle with care']) : undefined,
      },
      service,
      pickupPreference: rnd() < 0.75 ? 'pickup' : 'dropoff',
      paymentMethod: isCod ? 'cod' : customer.accountType === 'business' ? 'account' : rnd() < 0.5 ? 'card' : 'wallet',
      codAmount,
      codStatus: !isCod || sc.status === 'cancelled' || sc.status === 'returned' ? 'na' : sc.status === 'delivered' ? (sc.hoursAgo > 72 ? 'settled' : 'collected') : 'pending',
      shippingCost: quote?.total ?? 350,
      status: sc.status,
      originBranchId: originBranch.id,
      destinationBranchId: destBranch.id,
      currentBranchId: atDestination ? destBranch.id : originBranch.id,
      driverId: driver?.id,
      createdAt: iso(createdAt),
      estimatedDelivery: iso(Math.max(createdAt + etaHours[service] * HOUR, sc.status === 'delivered' ? lastAt : createdAt)),
      deliveredAt,
      attempts: path.includes('failed') ? 1 : sc.status === 'delivered' ? 1 : 0,
      failureReason,
      pod: deliveredAt ? { recipientName: receiver.name, deliveredAt, otpVerified: true, codCollected: codAmount || undefined } : undefined,
      events,
    } satisfies Shipment
  })

  // ---- Manifests ----
  const manifests: Manifest[] = []
  const makeManifests = (status: ShipmentStatus, manifestStatus: Manifest['status']) => {
    const groups = new Map<string, Shipment[]>()
    for (const s of shipments) {
      if (s.status !== status || s.originBranchId === s.destinationBranchId) continue
      const key = `${s.originBranchId}|${s.destinationBranchId}`
      groups.set(key, [...(groups.get(key) ?? []), s])
    }
    for (const [key, group] of groups) {
      const [originBranchId, destinationBranchId] = key.split('|')
      const origin = branches.find((b) => b.id === originBranchId)!
      const linehaul = driversIn(origin.city).find((d) => d.vehicleType !== 'bike') ?? driversIn(origin.city)[0]
      const dispatchedAt = group.reduce((min, s) => Math.min(min, new Date(s.events.find((e) => e.status === 'in_transit')!.timestamp).getTime()), now)
      const n = manifests.length + 1
      const manifest: Manifest = {
        id: `mnf_${String(n).padStart(3, '0')}`,
        number: `MNF-${origin.code.slice(0, 3)}-${String(2400 + n * 7)}`,
        originBranchId,
        destinationBranchId,
        driverId: linehaul?.id,
        vehiclePlate: linehaul?.vehiclePlate ?? 'LES-4410',
        sealNumber: `SL${int(100000, 999999)}`,
        shipmentIds: group.map((s) => s.id),
        status: manifestStatus,
        createdAt: iso(dispatchedAt - 2 * HOUR),
        dispatchedAt: iso(dispatchedAt),
        receivedAt: manifestStatus === 'received' ? group[0].events.find((e) => e.status === 'at_destination_hub')?.timestamp : undefined,
      }
      manifests.push(manifest)
      for (const s of group) s.manifestId = manifest.id
    }
  }
  makeManifests('in_transit', 'dispatched')
  makeManifests('at_destination_hub', 'received')

  // ---- Payments ----
  const payments: Payment[] = shipments.map((s, i) => ({
    id: `pay_${String(i + 1).padStart(4, '0')}`,
    reference: `INV-${String(60210 + i * 3)}`,
    customerId: s.customerId,
    shipmentId: s.id,
    trackingNumber: s.trackingNumber,
    amount: s.shippingCost,
    method: s.paymentMethod,
    status: s.status === 'cancelled' ? 'refunded' : s.paymentMethod === 'cod' && s.status !== 'delivered' ? 'pending' : 'paid',
    date: s.createdAt,
  }))

  // ---- COD ledger ----
  const codTransactions: CodTransaction[] = []
  const pushTxn = (t: Omit<CodTransaction, 'id' | 'reference'>) => {
    const n = codTransactions.length + 1
    codTransactions.push({ ...t, id: `cod_${String(n).padStart(3, '0')}`, reference: `COD-${String(88100 + n * 13)}` })
  }
  const groupBy = <K extends string>(items: Shipment[], key: (s: Shipment) => K | undefined) => {
    const map = new Map<K, Shipment[]>()
    for (const s of items) {
      const k = key(s)
      if (k) map.set(k, [...(map.get(k) ?? []), s])
    }
    return map
  }
  const sum = (items: Shipment[]) => items.reduce((t, s) => t + s.codAmount, 0)
  const latest = (items: Shipment[]) => items.reduce((max, s) => (s.deliveredAt && s.deliveredAt > max ? s.deliveredAt : max), items[0].deliveredAt ?? iso(now))
  for (const [driverId, items] of groupBy(shipments.filter((s) => s.codStatus === 'collected'), (s) => s.driverId)) {
    const driver = drivers.find((d) => d.id === driverId)!
    pushTxn({ type: 'collection', amount: sum(items), driverId, branchId: driver.branchId, shipmentCount: items.length, date: latest(items), note: `Cash collected by ${driver.name}` })
  }
  const settledByCustomer = groupBy(shipments.filter((s) => s.codStatus === 'settled'), (s) => s.customerId)
  for (const [customerId, items] of settledByCustomer) {
    const customer = customers.find((c) => c.id === customerId)!
    const date = iso(new Date(latest(items)).getTime() + 72 * HOUR)
    pushTxn({ type: 'deposit', amount: sum(items), branchId: items[0].destinationBranchId, shipmentCount: items.length, date: iso(new Date(date).getTime() - 40 * HOUR), note: 'Branch cash deposited to bank' })
    pushTxn({ type: 'settlement', amount: sum(items), customerId, shipmentCount: items.length, date, note: `Settlement to ${customer.company ?? customer.name}` })
  }
  codTransactions.sort((a, b) => b.date.localeCompare(a.date))

  // ---- Customer-side records for the demo customer ----
  const mine = shipments.filter((s) => s.customerId === CURRENT_CUSTOMER_ID)
  const meCustomer = customers.find((c) => c.id === CURRENT_CUSTOMER_ID)!
  const addresses: SavedAddress[] = [
    { id: 'adr_001', customerId: CURRENT_CUSTOMER_ID, label: 'Home', name: meCustomer.name, phone: meCustomer.phone, email: meCustomer.email, address: meCustomer.address, city: 'Lahore', postalCode: '54660', isDefault: true },
    { id: 'adr_002', customerId: CURRENT_CUSTOMER_ID, label: 'Office', name: meCustomer.name, phone: meCustomer.phone, email: meCustomer.email, address: 'Suite 304, Siddiq Trade Centre, Gulberg III', city: 'Lahore', postalCode: '54000', isDefault: false },
    { id: 'adr_003', customerId: CURRENT_CUSTOMER_ID, label: 'Parents', name: 'Tariq Khan', phone: '+92 321 555 4821', address: 'House 88, Street 12, F-10/4', city: 'Islamabad', postalCode: '44220', isDefault: false },
    { id: 'adr_004', customerId: CURRENT_CUSTOMER_ID, label: 'Sister (Karachi)', name: 'Hina Khan', phone: '+92 333 555 2290', address: 'Flat 5-B, Sea View Apartments, DHA Phase 6', city: 'Karachi', postalCode: '75500', isDefault: false },
  ]

  const failedMine = mine.find((s) => s.status === 'failed')
  const transitMine = mine.find((s) => s.status === 'in_transit')
  const deliveredMine = mine.filter((s) => s.status === 'delivered')
  const ticket = (n: number, t: Omit<Ticket, 'id' | 'number' | 'customerId'>): Ticket => ({ ...t, id: `tkt_${String(n).padStart(3, '0')}`, number: `TKT-${4810 + n * 7}`, customerId: CURRENT_CUSTOMER_ID })
  const msg = (id: string, from: 'customer' | 'support', text: string, at: number) => ({ id, from, author: from === 'customer' ? meCustomer.name : 'Iqra Naseem', text, at: iso(at) })
  const tickets: Ticket[] = [
    ticket(1, {
      subject: 'Delivery attempt failed but I was home', category: 'delivery', trackingNumber: failedMine?.trackingNumber, priority: 'high', status: 'open',
      createdAt: iso(now - 5 * HOUR), updatedAt: iso(now - 5 * HOUR),
      messages: [msg('m1', 'customer', 'The tracking shows a failed attempt, but the receiver was at home all day and received no call. Please arrange a re-delivery.', now - 5 * HOUR)],
    }),
    ticket(2, {
      subject: 'Shipment delayed in transit', category: 'delivery', trackingNumber: transitMine?.trackingNumber, priority: 'medium', status: 'in_progress',
      createdAt: iso(now - 30 * HOUR), updatedAt: iso(now - 22 * HOUR),
      messages: [
        msg('m1', 'customer', 'This parcel has been showing "In Transit" since yesterday. Can you confirm when it will arrive?', now - 30 * HOUR),
        msg('m2', 'support', 'Thank you for reaching out. The parcel is on a linehaul vehicle and is expected at the destination facility shortly. We will keep this ticket open until it is delivered.', now - 22 * HOUR),
      ],
    }),
    ticket(3, {
      subject: 'Invoice copy required for recent shipments', category: 'billing', priority: 'low', status: 'resolved',
      createdAt: iso(now - 12 * 24 * HOUR), updatedAt: iso(now - 11 * 24 * HOUR),
      messages: [
        msg('m1', 'customer', 'Please share a consolidated invoice for my recent shipments.', now - 12 * 24 * HOUR),
        msg('m2', 'support', 'Your invoices are available under Payment History. Each row can be opened for an itemised breakdown.', now - 11 * 24 * HOUR),
      ],
    }),
    ticket(4, {
      subject: 'Outer box arrived dented', category: 'damage', trackingNumber: deliveredMine[0]?.trackingNumber, priority: 'medium', status: 'resolved',
      createdAt: iso(now - 20 * 24 * HOUR), updatedAt: iso(now - 18 * 24 * HOUR),
      messages: [
        msg('m1', 'customer', 'The receiver reported the outer carton was dented, though the contents were fine.', now - 20 * 24 * HOUR),
        msg('m2', 'support', 'We are sorry about that. The handling feedback has been shared with the destination facility.', now - 18 * 24 * HOUR),
      ],
    }),
  ]

  const notify = (n: number, portal: AppNotification['portal'], title: string, body: string, hours: number, read = false): AppNotification => ({ id: `ntf_${portal}_${n}`, portal, title, body, at: iso(now - hours * HOUR), read })
  const ofd = mine.find((s) => s.status === 'out_for_delivery')
  const notifications: AppNotification[] = [
    notify(1, 'customer', 'Out for delivery', `${ofd?.trackingNumber ?? 'Your parcel'} is with the rider today.`, 1),
    notify(2, 'customer', 'Delivery attempt failed', `${failedMine?.trackingNumber ?? 'A parcel'} could not be delivered. You can reschedule it.`, 6),
    notify(3, 'customer', 'Shipment delivered', `${deliveredMine[0]?.trackingNumber ?? 'Your parcel'} was delivered successfully.`, 26, true),
    notify(4, 'customer', 'Support replied', 'There is a new reply on your ticket about a delayed shipment.', 22, true),
    notify(1, 'admin', 'Failed deliveries above threshold', 'Lahore recorded 4 failed attempts in the last 24 hours.', 2),
    notify(2, 'admin', 'COD settlement due', 'Pending settlements are ready for reconciliation.', 5),
    notify(3, 'admin', 'New business account', 'Mehran Pharma Supplies completed onboarding.', 28, true),
    notify(1, 'branch', 'Inbound manifest arriving', 'A linehaul manifest from Karachi Central Hub is due this shift.', 1),
    notify(2, 'branch', 'Parcels awaiting sorting', 'Several parcels at the hub have not been sorted for dispatch.', 3),
    notify(3, 'branch', 'Return pending', 'Failed-delivery parcels need a return or reattempt decision.', 20, true),
    notify(1, 'driver', 'New pickup assigned', 'A pickup in Lahore was added to your run sheet.', 1),
    notify(2, 'driver', 'COD reminder', 'Deposit collected cash at the branch before end of shift.', 4),
  ]

  const scanner = staff.find((s) => s.role === 'scanner' && s.branchId === CURRENT_BRANCH_ID)?.name ?? 'Adeel Nawaz'
  const scanLogs: ScanLog[] = shipments
    .filter((s) => s.currentBranchId === CURRENT_BRANCH_ID && (s.status === 'at_destination_hub' || s.status === 'at_origin_hub'))
    .slice(0, 8)
    .map((s, i) => ({
      id: `scn_${String(i + 1).padStart(3, '0')}`,
      trackingNumber: s.trackingNumber,
      branchId: CURRENT_BRANCH_ID,
      action: s.status === 'at_origin_hub' ? 'Received at origin hub' : 'Received from linehaul',
      resultStatus: s.status,
      staffName: scanner,
      at: s.events[s.events.length - 1].timestamp,
    }))
    .sort((a, b) => b.at.localeCompare(a.at))

  shipments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return {
    shipments,
    customers,
    branches,
    staff,
    drivers,
    rates: SEED_RATES,
    financeConfig: SEED_FINANCE_CONFIG,
    manifests,
    addresses,
    payments: payments.sort((a, b) => b.date.localeCompare(a.date)),
    tickets,
    notifications,
    scanLogs,
    codTransactions,
  }
}
