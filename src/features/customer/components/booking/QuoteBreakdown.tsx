import { Info } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { SERVICE_META, ZONE_LABEL } from '@/features/shipments/meta'
import type { PriceQuote, ServiceType } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'

interface QuoteBreakdownProps {
  quote: PriceQuote | null | undefined
  service: ServiceType
  loading?: boolean
  className?: string
}

/** Live "Estimated shipping cost" panel for the booking wizard. */
export function QuoteBreakdown({ quote, service, loading, className }: QuoteBreakdownProps) {
  return (
    <Card className={className}>
      <CardHeader title="Estimated shipping cost" description={`${SERVICE_META[service].label} service`} />
      <CardContent>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading rates">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        ) : !quote ? (
          <div className="flex items-start gap-2.5 text-sm text-gray-500">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            <p>{quote === null ? 'This service is not available on the selected route. Choose another service.' : 'Select the pickup and destination cities to see a price.'}</p>
          </div>
        ) : (
          <>
            <dl className="space-y-2.5 text-sm">
              <Row label="Base rate" value={formatPKR(quote.base)} />
              <Row label="Weight charge" value={formatPKR(quote.weightCharge)} />
              <Row label="Fuel surcharge" value={formatPKR(quote.fuelSurcharge)} />
              <Row label="Fragile handling" value={formatPKR(quote.fragileSurcharge)} muted={quote.fragileSurcharge === 0} />
              <Row label="COD fee" value={formatPKR(quote.codFee)} muted={quote.codFee === 0} />
              <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-3">
                <dt className="text-sm font-semibold text-gray-900">Total</dt>
                <dd className="tabular text-xl font-semibold text-gray-900">{formatPKR(quote.total)}</dd>
              </div>
            </dl>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-gray-50 p-3 text-xs">
              <Meta label="Chargeable weight" value={`${quote.chargeableWeightKg} kg`} />
              <Meta label="Zone" value={ZONE_LABEL[quote.zone]} />
              <Meta label="Estimated transit" value={quote.eta} className="col-span-2" />
            </dl>
            <p className="mt-3 text-xs text-gray-500">Estimate based on the current demo rate card. The final charge is confirmed when you book.</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gray-600">{label}</dt>
      <dd className={cn('tabular font-medium', muted ? 'text-gray-400' : 'text-gray-900')}>{value}</dd>
    </div>
  )
}

function Meta({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="tabular mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}
