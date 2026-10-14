import { PackageSearch, PackageX, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PrintLabelButton } from '@/components/shared/PrintLabel'
import { ShipmentCard } from '@/components/shared/ShipmentCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { CURRENT_CUSTOMER_ID } from '@/data/session'
import { isActive } from '@/features/shipments/meta'
import { TrackingDetails } from '@/features/tracking/TrackingDetails'
import { useQuery } from '@/hooks/useQuery'
import { shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { useMyShipments } from '../hooks'

function TrackingSearch({ initial }: { initial: string }) {
  const navigate = useNavigate()
  const [value, setValue] = useState(initial)
  const [error, setError] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const tracking = value.trim().toUpperCase()
    if (!tracking) return setError(true)
    setError(false)
    navigate(`/customer/track/${encodeURIComponent(tracking)}`)
  }

  return (
    <Card>
      <CardContent className="sm:p-6">
        <form onSubmit={submit} noValidate>
          <label htmlFor="tracking-number" className="text-sm font-medium text-gray-700">
            Tracking number
          </label>
          <div className="mt-1.5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-gray-400" aria-hidden />
              <Input
                id="tracking-number"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  setError(false)
                }}
                placeholder="e.g. CPLHE48201937"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={error || undefined}
                aria-describedby="tracking-help"
                className="h-12 pl-11 font-mono text-base uppercase placeholder:font-sans placeholder:normal-case"
              />
            </div>
            <Button type="submit" size="lg">
              <PackageSearch /> Track shipment
            </Button>
          </div>
          <p id="tracking-help" className={error ? 'mt-2 text-xs font-medium text-red-600' : 'mt-2 text-xs text-gray-500'} role={error ? 'alert' : undefined}>
            {error ? 'Enter a tracking number to continue.' : 'You’ll find it on your booking confirmation and on the parcel label. It starts with “CP”.'}
          </p>
        </form>
      </CardContent>
    </Card>
  )
}

function QuickPicks({ shipments, loading }: { shipments: Shipment[] | undefined; loading: boolean }) {
  if (loading && !shipments) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading recent shipments">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }
  if (!shipments?.length) {
    return (
      <Card>
        <EmptyState
          icon={PackageSearch}
          title="No shipments to track yet"
          description="Once you book a shipment it will appear here for one-tap tracking."
          action={
            <Button asChild>
              <Link to="/customer/book">Book Shipment</Link>
            </Button>
          }
        />
      </Card>
    )
  }
  // Parcels still on the move first, then the most recent bookings.
  const picks = [...shipments].sort((a, b) => Number(isActive(b.status)) - Number(isActive(a.status)) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  return (
    <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {picks.map((s) => (
        <li key={s.id}>
          <ShipmentCard shipment={s} to={`/customer/track/${s.trackingNumber}`} className="h-full" />
        </li>
      ))}
    </ul>
  )
}

function TrackingResult({ trackingNumber, mine }: { trackingNumber: string; mine: Shipment[] | undefined }) {
  const { data: shipment, loading } = useQuery(() => shipmentService.getByTrackingNumber(trackingNumber), [trackingNumber])

  if (loading && !shipment) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Looking up shipment">
        <CardSkeleton lines={5} />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-80 rounded-xl lg:col-span-3" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (!shipment) {
    const suggestions = (mine ?? []).slice(0, 4)
    return (
      <Card>
        <EmptyState
          icon={PackageX}
          title="We couldn’t find that shipment"
          description={`No parcel matches “${trackingNumber}”. Check the number for typos and try again.`}
          className="pb-6"
        />
        {suggestions.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-5 text-center">
            <p className="text-sm text-gray-500">Or pick one of your recent shipments:</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <Link
                  key={s.id}
                  to={`/customer/track/${s.trackingNumber}`}
                  className="rounded-full border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-gray-700 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-25 hover:text-brand-700"
                >
                  {s.trackingNumber}
                </Link>
              ))}
            </div>
          </div>
        )}
      </Card>
    )
  }

  const own = shipment.customerId === CURRENT_CUSTOMER_ID
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Status and location updates are simulated demo data — there is no live GPS feed.</p>
        {own && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link to="/customer/shipments">All my shipments</Link>
            </Button>
            <PrintLabelButton shipment={shipment} size="sm" />
          </div>
        )}
      </div>
      <TrackingDetails shipment={shipment} />
    </div>
  )
}

export default function TrackShipmentPage() {
  const params = useParams()
  const trackingNumber = (params.trackingNumber ?? '').trim().toUpperCase()
  const { data: shipments, loading } = useMyShipments()

  return (
    <>
      <PageHeader title="Track Shipment" description="Follow a parcel from booking to delivery." />

      <div className="space-y-6">
        {/* Keyed so the box follows the URL (quick picks, back/forward). */}
        <TrackingSearch key={`search-${trackingNumber}`} initial={trackingNumber} />

        {trackingNumber ? (
          // Keyed so each lookup starts from a clean loading state.
          <TrackingResult key={`result-${trackingNumber}`} trackingNumber={trackingNumber} mine={shipments} />
        ) : (
          <section aria-labelledby="quick-picks">
            <h2 id="quick-picks" className="mb-3 text-base font-semibold text-gray-900">
              Your recent shipments
            </h2>
            <QuickPicks shipments={shipments} loading={loading} />
          </section>
        )}
      </div>
    </>
  )
}
