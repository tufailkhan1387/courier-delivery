import { CalendarClock, CheckCircle2, MapPin, Package, ShieldCheck } from 'lucide-react'
import { DetailList } from '@/components/shared/DetailDrawer'
import { ShipmentProgress, ShipmentTimeline } from '@/components/shared/ShipmentTimeline'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CATEGORY_LABEL, PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { formatDate, formatDateTime, formatPKR } from '@/utils/format'
import { RouteMap } from './RouteMap'

/** Proof-of-delivery summary; shows a neutral placeholder until the parcel is delivered. */
export function ProofOfDeliveryCard({ shipment }: { shipment: Shipment }) {
  const pod = shipment.pod
  return (
    <Card>
      <CardHeader title="Proof of delivery" />
      <CardContent>
        {pod ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-emerald-50 px-3.5 py-3 text-sm font-medium text-emerald-800">
              <CheckCircle2 className="size-5 shrink-0" />
              Received by {pod.recipientName} on {formatDateTime(pod.deliveredAt)}
            </div>
            <DetailList
              items={[
                { label: 'Recipient', value: pod.recipientName },
                { label: 'OTP check', value: pod.otpVerified ? 'Verified (demo)' : 'Not verified' },
                ...(pod.codCollected ? [{ label: 'COD collected', value: formatPKR(pod.codCollected) }] : []),
              ]}
            />
            {(pod.signatureDataUrl || pod.photoDataUrl) && (
              <div className="grid grid-cols-2 gap-3">
                {pod.signatureDataUrl && (
                  <figure className="rounded-lg border border-gray-200 p-2">
                    <img src={pod.signatureDataUrl} alt="Recipient signature" className="h-24 w-full object-contain" />
                    <figcaption className="mt-1 text-center text-xs text-gray-500">Signature</figcaption>
                  </figure>
                )}
                {pod.photoDataUrl && (
                  <figure className="rounded-lg border border-gray-200 p-2">
                    <img src={pod.photoDataUrl} alt="Delivery photo" className="h-24 w-full rounded object-cover" />
                    <figcaption className="mt-1 text-center text-xs text-gray-500">Delivery photo</figcaption>
                  </figure>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start gap-3 text-sm text-gray-500">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-gray-400" />
            <p>Recipient name, signature and delivery photo will appear here once the parcel is delivered.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Full tracking view for one shipment: status, journey, map, history, details and POD. */
export function TrackingDetails({ shipment }: { shipment: Shipment }) {
  const delivered = shipment.status === 'delivered'
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracking number</p>
              <p className="mt-1 font-mono text-xl font-semibold text-gray-900">{shipment.trackingNumber}</p>
              <div className="mt-2">
                <StatusBadge status={shipment.status} />
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
              <CalendarClock className="size-5 text-brand-600" />
              <div>
                <p className="text-xs text-gray-500">{delivered ? 'Delivered on' : 'Estimated delivery'}</p>
                <p className="text-sm font-semibold text-gray-900">{formatDate(shipment.deliveredAt ?? shipment.estimatedDelivery)}</p>
              </div>
            </div>
          </div>

          <ShipmentProgress shipment={shipment} />

          <div className="grid gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
            {[
              { label: 'Origin', party: shipment.sender },
              { label: 'Destination', party: shipment.receiver },
            ].map(({ label, party }) => (
              <div key={label} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <MapPin className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {party.city} · {party.name}
                  </p>
                  <p className="text-sm text-gray-500">{party.address}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Delivery history" description="Every scan and status update for this parcel" />
          <CardContent>
            <ShipmentTimeline events={shipment.events} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <RouteMap origin={shipment.sender.city} destination={shipment.receiver.city} status={shipment.status} />

          <Card>
            <CardHeader title="Shipment details" action={<Package className="size-5 text-gray-400" />} />
            <CardContent>
              <DetailList
                items={[
                  { label: 'Service', value: SERVICE_META[shipment.service].label },
                  { label: 'Category', value: CATEGORY_LABEL[shipment.parcel.category] },
                  { label: 'Contents', value: shipment.parcel.description },
                  { label: 'Weight', value: `${shipment.parcel.weightKg} kg × ${shipment.parcel.quantity}` },
                  { label: 'Payment', value: PAYMENT_LABEL[shipment.paymentMethod] },
                  { label: 'COD amount', value: shipment.codAmount ? formatPKR(shipment.codAmount) : '—' },
                  { label: 'Booked on', value: formatDate(shipment.createdAt) },
                  { label: 'Handling', value: shipment.parcel.fragile ? 'Fragile' : 'Standard' },
                ]}
              />
            </CardContent>
          </Card>

          <ProofOfDeliveryCard shipment={shipment} />
        </div>
      </div>
    </div>
  )
}
