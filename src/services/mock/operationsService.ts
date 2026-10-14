// Hub operations: manifests, scan logs and the COD ledger.
import type { CodTransaction, Manifest, ScanLog, Shipment } from '@/types'
import { uid } from '@/utils/id'
import { delay, getDb, setDb } from './db'
import { shipmentService } from './shipmentService'

export interface CreateManifestInput {
  originBranchId: string
  destinationBranchId: string
  driverId?: string
  vehiclePlate: string
  shipmentIds: string[]
  notes?: string
}

export const manifestService = {
  list: (): Promise<Manifest[]> => delay(getDb().manifests),
  getById: (id: string): Promise<Manifest | undefined> => delay(getDb().manifests.find((m) => m.id === id)),

  create(input: CreateManifestInput): Promise<Manifest> {
    const db = getDb()
    const origin = db.branches.find((b) => b.id === input.originBranchId)
    const manifest: Manifest = {
      ...input,
      id: uid('mnf'),
      number: `MNF-${origin?.code.slice(0, 3) ?? 'CPX'}-${Math.floor(3000 + Math.random() * 6999)}`,
      sealNumber: `SL${Math.floor(100000 + Math.random() * 899999)}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
    }
    setDb({
      manifests: [manifest, ...db.manifests],
      shipments: db.shipments.map((s) => (input.shipmentIds.includes(s.id) ? { ...s, manifestId: manifest.id } : s)),
    })
    return delay(manifest, 600)
  },

  /** Mark a manifest dispatched and move every parcel on it to "in transit". */
  async dispatch(id: string, actor?: string): Promise<Manifest> {
    const manifest = getDb().manifests.find((m) => m.id === id)
    if (!manifest) throw new Error('Manifest not found')
    const destination = getDb().branches.find((b) => b.id === manifest.destinationBranchId)
    for (const shipmentId of manifest.shipmentIds) {
      await shipmentService.updateStatus(shipmentId, 'in_transit', {
        actor,
        note: `Dispatched on manifest ${manifest.number} to ${destination?.name ?? 'destination facility'}.`,
      })
    }
    const next: Manifest = { ...manifest, status: 'dispatched', dispatchedAt: new Date().toISOString() }
    setDb({ manifests: getDb().manifests.map((m) => (m.id === id ? next : m)) })
    return next
  },

  /** Receive a manifest at the destination: parcels become "at destination hub". */
  async receive(id: string, actor?: string): Promise<Manifest> {
    const manifest = getDb().manifests.find((m) => m.id === id)
    if (!manifest) throw new Error('Manifest not found')
    for (const shipmentId of manifest.shipmentIds) {
      const shipment = getDb().shipments.find((s) => s.id === shipmentId)
      if (shipment?.status === 'in_transit') {
        await shipmentService.updateStatus(shipmentId, 'at_destination_hub', { actor, note: `Received on manifest ${manifest.number}.` })
      }
    }
    const next: Manifest = { ...manifest, status: 'received', receivedAt: new Date().toISOString() }
    setDb({ manifests: getDb().manifests.map((m) => (m.id === id ? next : m)) })
    return next
  },

  remove(id: string): Promise<void> {
    const db = getDb()
    setDb({
      manifests: db.manifests.filter((m) => m.id !== id),
      shipments: db.shipments.map((s) => (s.manifestId === id ? { ...s, manifestId: undefined } : s)),
    })
    return delay(undefined)
  },
}

export const scanService = {
  list: (branchId: string): Promise<ScanLog[]> => delay(getDb().scanLogs.filter((l) => l.branchId === branchId), 150),
  log(entry: Omit<ScanLog, 'id' | 'at'>): Promise<ScanLog> {
    const log: ScanLog = { ...entry, id: uid('scn'), at: new Date().toISOString() }
    setDb({ scanLogs: [log, ...getDb().scanLogs] })
    return delay(log, 50)
  },
}

export const codService = {
  listTransactions: (): Promise<CodTransaction[]> => delay(getDb().codTransactions),

  /** Mock reconciliation: marks collected COD as settled and records a ledger entry. */
  settle(shipmentIds: string[], note: string, ref: Pick<CodTransaction, 'driverId' | 'branchId' | 'customerId'> = {}): Promise<CodTransaction> {
    const db = getDb()
    const affected: Shipment[] = db.shipments.filter((s) => shipmentIds.includes(s.id) && s.codStatus === 'collected')
    const txn: CodTransaction = {
      ...ref,
      id: uid('cod'),
      reference: `COD-${Math.floor(90000 + Math.random() * 9999)}`,
      type: 'settlement',
      amount: affected.reduce((t, s) => t + s.codAmount, 0),
      shipmentCount: affected.length,
      date: new Date().toISOString(),
      note,
    }
    const ids = new Set(affected.map((s) => s.id))
    setDb({
      shipments: db.shipments.map((s) => (ids.has(s.id) ? { ...s, codStatus: 'settled' as const } : s)),
      codTransactions: [txn, ...db.codTransactions],
    })
    return delay(txn, 700)
  },
}
