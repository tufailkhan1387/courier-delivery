import { CheckCircle2, Copy, PackagePlus, PackageSearch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DetailList } from '@/components/shared/DetailDrawer'
import { PrintLabelButton, ShipmentLabel } from '@/components/shared/PrintLabel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'

interface BookingSuccessProps {
  shipment: Shipment
  onBookAnother: () => void
}

export function BookingSuccess({ shipment, onBookAnother }: BookingSuccessProps) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber)
      toast.success('Tracking number copied')
    } catch {
      toast.error('Could not copy — select the number and copy it manually.')
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="lg:col-span-3">
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-900">Shipment booked</h2>
              <p className="mt-1 text-sm text-gray-500">
                Your demo booking has been saved. {shipment.pickupPreference === 'pickup' ? 'In a live system a rider would now be scheduled for pickup.' : 'Print the label and attach it before dropping the parcel at a branch.'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracking number</p>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <p className="break-all font-mono text-2xl font-semibold text-gray-900">{shipment.trackingNumber}</p>
              <Button variant="secondary" size="sm" onClick={copy}>
                <Copy /> Copy
              </Button>
            </div>
          </div>

          <DetailList
            items={[
              { label: 'Route', value: `${shipment.sender.city} → ${shipment.receiver.city}` },
              { label: 'Receiver', value: shipment.receiver.name },
              { label: 'Service', value: SERVICE_META[shipment.service].label },
              { label: 'Estimated delivery', value: formatDate(shipment.estimatedDelivery) },
              { label: 'Shipping cost', value: formatPKR(shipment.shippingCost) },
              { label: 'Payment', value: PAYMENT_LABEL[shipment.paymentMethod] },
              ...(shipment.codAmount > 0 ? [{ label: 'COD to collect', value: formatPKR(shipment.codAmount) }] : []),
            ]}
          />

          {shipment.paymentMethod !== 'cod' && (
            <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">No real payment was taken — this is a demo. The invoice is only marked as paid in the sample data.</p>
          )}

          <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:flex-wrap">
            <Button asChild>
              <Link to={`/customer/track/${shipment.trackingNumber}`}>
                <PackageSearch /> Track this shipment
              </Link>
            </Button>
            <PrintLabelButton shipment={shipment} />
            <Button variant="ghost" onClick={onBookAnother}>
              <PackagePlus /> Book another
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Label preview" description="Attach this label to the parcel" />
        <CardContent>
          <div className="overflow-x-auto rounded-lg bg-gray-50 p-3 sm:p-4">
            <ShipmentLabel shipment={shipment} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
