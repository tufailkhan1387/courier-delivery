import { Info, Pencil } from 'lucide-react'
import type { ReactNode } from 'react'
import { useFormContext } from 'react-hook-form'
import { DetailList } from '@/components/shared/DetailDrawer'
import { Button } from '@/components/ui/button'
import { CATEGORY_LABEL, PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import { formatPKR } from '@/utils/format'
import { QuoteBreakdown } from './QuoteBreakdown'
import type { BookingValues, ServiceQuotes } from './schema'
import { StepHeading } from './StepHeading'

interface ReviewStepProps {
  quotes: ServiceQuotes | undefined
  pricingLoading: boolean
  onEdit: (step: number) => void
}

export function ReviewStep({ quotes, pricingLoading, onEdit }: ReviewStepProps) {
  const values = useFormContext<BookingValues>().getValues()
  const { sender, receiver, parcel } = values
  const prepaid = values.paymentMethod === 'card' || values.paymentMethod === 'wallet'

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 lg:col-span-2">
        <StepHeading title="Review your booking" description="Check everything before confirming. You can still edit any section." />

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewBlock title="Sender" onEdit={() => onEdit(0)}>
              <PartySummary party={sender} />
            </ReviewBlock>
            <ReviewBlock title="Receiver" onEdit={() => onEdit(1)}>
              <PartySummary party={receiver} />
            </ReviewBlock>
          </div>

          <ReviewBlock title="Parcel" onEdit={() => onEdit(2)}>
            <DetailList
              items={[
                { label: 'Contents', value: parcel.description },
                { label: 'Category', value: CATEGORY_LABEL[parcel.category] },
                { label: 'Quantity', value: parcel.quantity },
                { label: 'Actual weight', value: `${parcel.weightKg} kg` },
                { label: 'Dimensions', value: `${parcel.length} × ${parcel.width} × ${parcel.height} cm` },
                { label: 'Declared value', value: formatPKR(parcel.declaredValue) },
                { label: 'Handling', value: parcel.fragile ? 'Fragile' : 'Standard' },
                { label: 'Instructions', value: parcel.instructions || '—' },
              ]}
            />
          </ReviewBlock>

          <ReviewBlock title="Service & payment" onEdit={() => onEdit(3)}>
            <DetailList
              items={[
                { label: 'Service', value: SERVICE_META[values.service].label },
                { label: 'Handover', value: values.pickupPreference === 'pickup' ? 'Rider pickup' : 'Branch drop-off' },
                { label: 'Payment method', value: PAYMENT_LABEL[values.paymentMethod] },
                ...(values.paymentMethod === 'cod' ? [{ label: 'COD amount', value: formatPKR(values.codAmount) }] : []),
              ]}
            />
          </ReviewBlock>

          <div className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            <p>
              {prepaid
                ? 'No real payment is taken in this demo. Confirming creates a sample booking and marks its invoice as paid.'
                : 'This is a demo booking: it is saved in your browser only, and no rider or branch is actually notified.'}
            </p>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <QuoteBreakdown quote={quotes ? quotes[values.service] : undefined} service={values.service} loading={pricingLoading} className="lg:sticky lg:top-24" />
      </div>
    </div>
  )
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={`Edit ${title.toLowerCase()}`} className="-mr-2 text-brand-700 hover:text-brand-800">
          <Pencil /> Edit
        </Button>
      </div>
      {children}
    </section>
  )
}

function PartySummary({ party }: { party: BookingValues['sender'] | BookingValues['receiver'] }) {
  return (
    <div className="text-sm">
      <p className="font-semibold text-gray-900">{party.name}</p>
      <p className="mt-0.5 break-words text-gray-600">{party.address}</p>
      <p className="text-gray-600">
        {party.city} {party.postalCode}
      </p>
      <p className="mt-1.5 text-gray-500">{party.phone}</p>
      {party.email && <p className="break-all text-gray-500">{party.email}</p>}
    </div>
  )
}
