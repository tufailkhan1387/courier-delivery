import { useState } from 'react'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { Skeleton } from '@/components/ui/misc'
import type { Shipment } from '@/types'
import { BookingSuccess } from '../components/booking/BookingSuccess'
import { BookingWizard } from '../components/booking/BookingWizard'
import { useCurrentCustomer, useMyAddresses } from '../hooks'

export default function BookShipmentPage() {
  const customer = useCurrentCustomer()
  const addresses = useMyAddresses()
  const [created, setCreated] = useState<Shipment | null>(null)
  // Bumping the key remounts the wizard with fresh defaults for "Book another".
  const [wizardKey, setWizardKey] = useState(0)

  const ready = !customer.loading && !addresses.loading

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={created ? 'Booking confirmed' : 'Book Shipment'}
        description={created ? 'Keep the tracking number handy to follow your parcel.' : 'Enter the shipment details step by step. Your price updates as you go.'}
        backTo={created ? '/customer/shipments' : undefined}
        backLabel="My Shipments"
      />

      {created ? (
        <BookingSuccess
          shipment={created}
          onBookAnother={() => {
            setCreated(null)
            setWizardKey((k) => k + 1)
          }}
        />
      ) : !ready ? (
        <div className="space-y-6" aria-busy="true" aria-label="Loading booking form">
          <Skeleton className="h-24 rounded-xl" />
          <CardSkeleton lines={6} />
        </div>
      ) : (
        <BookingWizard key={wizardKey} customer={customer.data} addresses={addresses.data ?? []} onCreated={setCreated} />
      )}
    </div>
  )
}
