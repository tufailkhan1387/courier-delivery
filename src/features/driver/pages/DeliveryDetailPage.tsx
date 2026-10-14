import { AlertTriangle, ArrowLeft, Banknote, CheckCircle2, Info, MessageSquareText, Navigation, PackageCheck, Phone, RotateCcw, ShieldCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DetailList } from '@/components/shared/DetailDrawer'
import { ShipmentTimeline } from '@/components/shared/ShipmentTimeline'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PORTALS } from '@/app/portals'
import { CURRENT_DRIVER_ID } from '@/data/session'
import { CATEGORY_LABEL, PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import { shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { formatDateTime, formatFriendlyDateTime, formatPKR } from '@/utils/format'
import { NavigateDialog } from '../components/NavigateDialog'
import { StickyActions } from '../components/StickyActions'
import { TaskSkeleton, TaskUnavailable } from '../components/TaskState'
import { useCurrentDriver, useTask } from '../hooks'
import { closedAt, codCollectedFor, fullAddress, isPickupTask, taskContact } from '../tasks'

function CodBanner({ shipment }: { shipment: Shipment }) {
  if (shipment.codAmount <= 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-card">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">Prepaid — nothing to collect</p>
          <p className="text-xs text-gray-500">Paid via {PAYMENT_LABEL[shipment.paymentMethod]}</p>
        </div>
      </div>
    )
  }
  const collected = shipment.status === 'delivered'
  return (
    <div className={`rounded-xl border p-4 ${collected ? 'border-emerald-200 bg-emerald-50' : 'border-orange-200 bg-orange-50'}`}>
      <p className={`flex items-center gap-2 text-sm font-semibold ${collected ? 'text-emerald-700' : 'text-orange-700'}`}>
        <Banknote className="size-4" aria-hidden />
        {collected ? 'Cash collected' : isPickupTask(shipment) ? 'Cash on delivery (collected at destination)' : 'Collect cash on delivery'}
      </p>
      <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-gray-900">{formatPKR(collected ? codCollectedFor(shipment) : shipment.codAmount)}</p>
      {!collected && !isPickupTask(shipment) && <p className="mt-1 text-xs text-gray-600">Collect the exact amount in cash before handing over the parcel.</p>}
    </div>
  )
}

function ProofSection({ shipment }: { shipment: Shipment }) {
  const pod = shipment.pod
  if (!pod) {
    return (
      <Card>
        <CardHeader title="Proof of delivery" className="px-4 pt-4" />
        <CardContent className="p-4 text-sm text-gray-500">No proof of delivery was recorded for this shipment.</CardContent>
      </Card>
    )
  }
  return (
    <Card>
      <CardHeader title="Proof of delivery" className="px-4 pt-4" action={<CheckCircle2 className="size-5 text-emerald-600" aria-hidden />} />
      <CardContent className="space-y-4 p-4">
        <DetailList
          items={[
            { label: 'Received by', value: pod.recipientName },
            { label: 'Delivered at', value: formatDateTime(pod.deliveredAt) },
            { label: 'Delivery code', value: pod.otpVerified ? <Badge tone="green">Verified (demo)</Badge> : <Badge tone="gray">Not verified</Badge> },
            { label: 'COD collected', value: shipment.codAmount > 0 ? formatPKR(codCollectedFor(shipment)) : 'Not applicable' },
          ]}
        />
        <div className="grid grid-cols-2 gap-3">
          <figure>
            <figcaption className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Signature</figcaption>
            {pod.signatureDataUrl ? (
              <img src={pod.signatureDataUrl} alt={`Signature of ${pod.recipientName}`} className="h-24 w-full rounded-lg border border-gray-200 bg-white object-contain" />
            ) : (
              <p className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 px-2 text-center text-xs text-gray-500">Not captured</p>
            )}
          </figure>
          <figure>
            <figcaption className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Photo</figcaption>
            {pod.photoDataUrl ? (
              <img src={pod.photoDataUrl} alt="Delivery photo" className="h-24 w-full rounded-lg border border-gray-200 bg-gray-50 object-cover" />
            ) : (
              <p className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gray-300 px-2 text-center text-xs text-gray-500">No photo</p>
            )}
          </figure>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DeliveryDetailPage() {
  const { id } = useParams()
  const { shipment, loading, mine } = useTask(id)
  const { data: driver } = useCurrentDriver()
  const [navOpen, setNavOpen] = useState(false)
  const [confirm, setConfirm] = useState<'pickup' | 'reattempt' | null>(null)

  if (loading && !shipment) return <TaskSkeleton />
  if (!shipment) return <TaskUnavailable reason="not_found" />
  if (!mine) return <TaskUnavailable reason="not_assigned" />

  const actor = driver?.name ?? PORTALS.driver.user.name
  const pickup = isPickupTask(shipment)
  const contact = taskContact(shipment)
  const { parcel } = shipment
  const base = `/driver/deliveries/${shipment.id}`

  const confirmPickup = async () => {
    try {
      await shipmentService.updateStatus(shipment.id, 'picked_up', { actor, driverId: CURRENT_DRIVER_ID, location: shipment.sender.city })
      toast.success('Pickup confirmed', { description: `${shipment.trackingNumber} is now marked as picked up.` })
    } catch {
      toast.error('Could not confirm the pickup. Please try again.')
    }
  }

  const reattempt = async () => {
    try {
      await shipmentService.updateStatus(shipment.id, 'out_for_delivery', {
        actor,
        driverId: CURRENT_DRIVER_ID,
        note: `Reattempt started by rider (attempt ${shipment.attempts + 1}).`,
      })
      toast.success('Back on your run sheet', { description: 'The parcel is out for delivery again.' })
    } catch {
      toast.error('Could not start the reattempt. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Link to="/driver/deliveries" className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft className="size-4" /> Deliveries
        </Link>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{pickup ? 'Pickup task' : 'Delivery'}</p>
            <h1 className="mt-0.5 break-all font-mono text-xl font-semibold text-gray-900">{shipment.trackingNumber}</h1>
          </div>
          <StatusBadge status={shipment.status} className="mt-1" />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {shipment.status === 'out_for_delivery' || shipment.status === 'booked' ? `Due ${formatFriendlyDateTime(shipment.estimatedDelivery)}` : `Updated ${formatFriendlyDateTime(closedAt(shipment))}`}
          {shipment.attempts > 0 && ` · ${shipment.attempts} ${shipment.attempts === 1 ? 'attempt' : 'attempts'}`}
        </p>
      </div>

      {shipment.status === 'failed' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="status">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
            <AlertTriangle className="size-4" aria-hidden /> Delivery attempt failed
          </p>
          <p className="mt-1 text-sm text-gray-900">{shipment.failureReason ?? 'No reason recorded.'}</p>
          <p className="mt-1 text-xs text-gray-600">{shipment.events.at(-1)?.description}</p>
        </div>
      )}

      <CodBanner shipment={shipment} />

      {parcel.instructions && (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4">
          <MessageSquareText className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-gray-900">{pickup ? 'Handling instructions' : 'Delivery instructions'}</p>
            <p className="mt-0.5 text-sm text-gray-700">{parcel.instructions}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader title={pickup ? 'Pickup contact (sender)' : 'Recipient'} className="px-4 pt-4" />
        <CardContent className="p-4">
          <p className="text-base font-semibold text-gray-900">{contact.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{fullAddress(contact)}</p>
          <p className="tabular mt-1 text-sm text-gray-600">{contact.phone}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" asChild>
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} aria-label={`Call ${contact.name}`}>
                <Phone /> Call
              </a>
            </Button>
            <Button variant="soft" size="lg" onClick={() => setNavOpen(true)}>
              <Navigation /> Navigate
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Phone numbers are fictional demo data. “Call” only opens your device dialler; the app places no call itself.
          </p>
          {pickup && (
            <p className="mt-3 border-t border-gray-100 pt-3 text-sm text-gray-600">
              Ships to <span className="font-medium text-gray-900">{shipment.receiver.name}</span>, {shipment.receiver.city}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Shipment information" className="px-4 pt-4" action={parcel.fragile ? <Badge tone="orange">Fragile</Badge> : undefined} />
        <CardContent className="p-4">
          <DetailList
            items={[
              { label: 'Tracking no.', value: <span className="break-all font-mono">{shipment.trackingNumber}</span> },
              { label: 'Service', value: SERVICE_META[shipment.service].label },
              { label: 'Contents', value: parcel.description },
              { label: 'Category', value: CATEGORY_LABEL[parcel.category] },
              { label: 'Weight', value: `${parcel.weightKg} kg` },
              { label: 'Pieces', value: parcel.quantity },
              { label: 'Handling', value: parcel.fragile ? 'Fragile — handle with care' : 'Standard' },
              { label: 'Payment', value: PAYMENT_LABEL[shipment.paymentMethod] },
              { label: pickup ? 'Receiver' : 'Sender', value: pickup ? `${shipment.receiver.name}, ${shipment.receiver.city}` : `${shipment.sender.name}, ${shipment.sender.city}` },
              { label: 'COD amount', value: shipment.codAmount > 0 ? formatPKR(shipment.codAmount) : 'None' },
            ]}
          />
        </CardContent>
      </Card>

      {shipment.status === 'delivered' && <ProofSection shipment={shipment} />}

      <Card>
        <CardHeader title="Delivery timeline" className="px-4 pt-4" />
        <CardContent className="p-4">
          <ShipmentTimeline events={shipment.events} />
        </CardContent>
      </Card>

      {shipment.status === 'out_for_delivery' && (
        <StickyActions>
          <Button variant="destructive-outline" size="lg" className="flex-1 px-3 text-sm" asChild>
            <Link to={`${base}/failed`}>
              <XCircle /> Report failed
            </Link>
          </Button>
          <Button variant="success" size="lg" className="flex-1 px-3 text-sm" asChild>
            <Link to={`${base}/pod`}>
              <PackageCheck /> Mark delivered
            </Link>
          </Button>
        </StickyActions>
      )}

      {shipment.status === 'booked' && (
        <StickyActions>
          <Button size="lg" className="w-full" onClick={() => setConfirm('pickup')}>
            <PackageCheck /> Confirm pickup
          </Button>
        </StickyActions>
      )}

      {shipment.status === 'failed' && (
        <StickyActions>
          <Button size="lg" className="w-full" onClick={() => setConfirm('reattempt')}>
            <RotateCcw /> Reattempt delivery
          </Button>
        </StickyActions>
      )}

      {pickup && shipment.status !== 'booked' && (
        <p className="flex items-start gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
          <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
          Pickup collected. Hand the parcel over at your branch for scanning — no further rider action is needed here.
        </p>
      )}

      <NavigateDialog party={navOpen ? contact : null} kind={pickup ? 'Pickup' : 'Delivery'} onClose={() => setNavOpen(false)} />

      <ConfirmationDialog
        open={confirm === 'pickup'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Confirm pickup"
        description={
          <>
            Confirm you have collected <span className="font-semibold text-gray-900">{parcel.quantity}</span> {parcel.quantity === 1 ? 'piece' : 'pieces'} ({parcel.weightKg} kg) from{' '}
            <span className="font-semibold text-gray-900">{shipment.sender.name}</span>. The shipment will be marked as picked up.
          </>
        }
        confirmLabel="Confirm pickup"
        onConfirm={confirmPickup}
      />
      <ConfirmationDialog
        open={confirm === 'reattempt'}
        onOpenChange={(open) => !open && setConfirm(null)}
        title="Reattempt delivery"
        description="This puts the parcel back on your run sheet as out for delivery and adds a note to the tracking timeline."
        confirmLabel="Start reattempt"
        onConfirm={reattempt}
      />
    </div>
  )
}
