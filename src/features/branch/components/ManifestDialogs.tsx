import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import type { Manifest } from '@/types'
import { dispatchManifest, receiveManifest } from '../actions'

interface ManifestDialogProps {
  manifest: Manifest | undefined
  /** Name of the other facility (destination when dispatching, origin when receiving). */
  facilityName: string
  onClose: () => void
}

/** Mock dispatch confirmation: marks the manifest dispatched and its parcels in transit. */
export function DispatchManifestDialog({ manifest, facilityName, onClose }: ManifestDialogProps) {
  const count = manifest?.shipmentIds.length ?? 0
  return (
    <ConfirmationDialog
      open={Boolean(manifest)}
      onOpenChange={(open) => !open && onClose()}
      title={`Dispatch ${manifest?.number ?? 'manifest'}?`}
      confirmLabel="Confirm mock dispatch"
      description={
        <>
          <p>
            {count} parcel{count === 1 ? '' : 's'} will be marked <span className="font-semibold text-gray-900">In Transit</span> to {facilityName} on vehicle{' '}
            <span className="font-mono font-semibold text-gray-900">{manifest?.vehiclePlate || '—'}</span>, seal <span className="font-mono">{manifest?.sealNumber}</span>.
          </p>
          <p className="mt-2 text-gray-500">This is a demo: no vehicle, driver or customer is actually notified.</p>
        </>
      }
      onConfirm={async () => {
        if (!manifest) return
        try {
          await dispatchManifest(manifest)
          toast.success(`${manifest.number} dispatched (mock)`, { description: `${count} parcel${count === 1 ? '' : 's'} now in transit to ${facilityName}.` })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not dispatch the manifest')
        }
      }}
    />
  )
}

/** Receive an inbound manifest: its in-transit parcels become "at destination hub". */
export function ReceiveManifestDialog({ manifest, facilityName, onClose }: ManifestDialogProps) {
  const count = manifest?.shipmentIds.length ?? 0
  return (
    <ConfirmationDialog
      open={Boolean(manifest)}
      onOpenChange={(open) => !open && onClose()}
      title={`Receive ${manifest?.number ?? 'manifest'}?`}
      confirmLabel={`Receive ${count} parcel${count === 1 ? '' : 's'}`}
      description={
        <>
          <p>
            Confirm that the vehicle from {facilityName} has arrived with seal <span className="font-mono font-semibold text-gray-900">{manifest?.sealNumber}</span> intact. All{' '}
            {count} parcel{count === 1 ? '' : 's'} still in transit will be received into this hub&rsquo;s inventory.
          </p>
          <p className="mt-2 text-gray-500">Parcels already scanned in individually are left unchanged.</p>
        </>
      }
      onConfirm={async () => {
        if (!manifest) return
        try {
          await receiveManifest(manifest)
          toast.success(`${manifest.number} received`, { description: `${count} parcel${count === 1 ? '' : 's'} checked into inventory.` })
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Could not receive the manifest')
        }
      }}
    />
  )
}
