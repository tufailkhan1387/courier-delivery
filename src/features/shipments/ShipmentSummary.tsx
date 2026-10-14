import { ArrowRight } from 'lucide-react'
import { DetailList, DetailSection } from '@/components/shared/DetailDrawer'
import { ShipmentTimeline } from '@/components/shared/ShipmentTimeline'
import { CodStatusBadge, StatusBadge } from '@/components/shared/StatusBadge'
import type { Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { CATEGORY_LABEL, PAYMENT_LABEL, SERVICE_META } from './meta'

/**
 * Drawer-friendly shipment overview: route, parties, parcel, payment and tracking history.
 * Portals wrap this in a DetailDrawer and add their own actions in the footer.
 */
export function ShipmentSummary({ shipment }: { shipment: Shipment }) {
  const { sender, receiver, parcel } = shipment
  return (
    <div>
      <div className="rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={shipment.status} />
          <span className="text-xs text-gray-500">
            {shipment.deliveredAt ? `Delivered ${formatDate(shipment.deliveredAt)}` : `ETA ${formatDate(shipment.estimatedDelivery)}`}
          </span>
        </div>
        <div className="mt-3 flex items-center gap-3 text-base font-semibold text-gray-900">
          {sender.city}
          <ArrowRight className="size-4 text-gray-400" aria-hidden />
          {receiver.city}
        </div>
        {shipment.failureReason && shipment.status === 'failed' && <p className="mt-2 text-sm font-medium text-red-600">Reason: {shipment.failureReason}</p>}
      </div>

      <div className="mt-5">
        <DetailSection title="Sender & receiver">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: 'Sender', p: sender },
              { label: 'Receiver', p: receiver },
            ].map(({ label, p }) => (
              <div key={label} className="rounded-lg border border-gray-200 p-3 text-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className="mt-1 font-semibold text-gray-900">{p.name}</p>
                <p className="text-gray-600">{p.address}</p>
                <p className="text-gray-600">
                  {p.city} {p.postalCode}
                </p>
                <p className="mt-1 text-gray-500">{p.phone}</p>
              </div>
            ))}
          </div>
        </DetailSection>

        <DetailSection title="Parcel">
          <DetailList
            items={[
              { label: 'Contents', value: parcel.description },
              { label: 'Category', value: CATEGORY_LABEL[parcel.category] },
              { label: 'Weight', value: `${parcel.weightKg} kg` },
              { label: 'Quantity', value: parcel.quantity },
              { label: 'Dimensions', value: `${parcel.dimensions.length} × ${parcel.dimensions.width} × ${parcel.dimensions.height} cm` },
              { label: 'Declared value', value: formatPKR(parcel.declaredValue) },
              { label: 'Handling', value: parcel.fragile ? 'Fragile' : 'Standard' },
              { label: 'Instructions', value: parcel.instructions ?? '—' },
            ]}
          />
        </DetailSection>

        <DetailSection title="Service & payment">
          <DetailList
            items={[
              { label: 'Service', value: SERVICE_META[shipment.service].label },
              { label: 'Handover', value: shipment.pickupPreference === 'pickup' ? 'Rider pickup' : 'Drop-off at branch' },
              { label: 'Payment method', value: PAYMENT_LABEL[shipment.paymentMethod] },
              { label: 'Shipping cost', value: formatPKR(shipment.shippingCost) },
              ...(shipment.codAmount > 0
                ? [
                    { label: 'COD amount', value: formatPKR(shipment.codAmount) },
                    { label: 'COD status', value: <CodStatusBadge status={shipment.codStatus} /> },
                  ]
                : []),
            ]}
          />
        </DetailSection>

        <DetailSection title="Tracking history">
          <ShipmentTimeline events={shipment.events} />
        </DetailSection>
      </div>
    </div>
  )
}
