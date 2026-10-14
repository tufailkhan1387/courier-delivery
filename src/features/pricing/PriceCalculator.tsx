import { Calculator } from 'lucide-react'
import { useId, useState } from 'react'
import { FormField } from '@/components/shared/FormField'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { Input, NativeSelect } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { CITIES } from '@/data/cities'
import { SERVICE_META, ZONE_LABEL } from '@/features/shipments/meta'
import { useQuery } from '@/hooks/useQuery'
import { pricingService } from '@/services'
import type { City, ServiceType } from '@/types'
import { formatPKR } from '@/utils/format'
import { calculateQuote } from './calc'

const SERVICES = Object.keys(SERVICE_META) as ServiceType[]

/** Live quote preview using the current rate cards and fee configuration. */
export function PriceCalculator() {
  const fragileId = useId()
  const { data: pricing } = useQuery(() => pricingService.getPricingData(), [])
  const [origin, setOrigin] = useState<City>('Lahore')
  const [destination, setDestination] = useState<City>('Karachi')
  const [service, setService] = useState<ServiceType>('standard')
  const [weight, setWeight] = useState('1')
  const [cod, setCod] = useState('')
  const [fragile, setFragile] = useState(false)

  const weightKg = Number(weight)
  const codAmount = Number(cod) || 0
  const validWeight = Number.isFinite(weightKg) && weightKg > 0 && weightKg <= 500
  const validCod = codAmount >= 0
  const quote = pricing && validWeight && validCod ? calculateQuote({ origin, destination, service, weightKg, fragile, codAmount }, pricing.rates, pricing.config) : null

  const lines = quote
    ? [
        { label: 'Base price', value: quote.base },
        { label: `Extra weight (${quote.chargeableWeightKg} kg chargeable)`, value: quote.weightCharge },
        { label: 'Fuel surcharge', value: quote.fuelSurcharge },
        { label: 'Fragile surcharge', value: quote.fragileSurcharge },
        { label: 'COD fee', value: quote.codFee },
      ]
    : []

  return (
    <Card>
      <CardHeader title="Price calculator" description="Preview a quote with the current rates. Nothing is booked." action={<Calculator className="size-5 text-gray-400" aria-hidden />} />
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Origin">
            <NativeSelect value={origin} onChange={(e) => setOrigin(e.target.value as City)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Destination">
            <NativeSelect value={destination} onChange={(e) => setDestination(e.target.value as City)}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Service">
            <NativeSelect value={service} onChange={(e) => setService(e.target.value as ServiceType)}>
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {SERVICE_META[s].label}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Weight (kg)" error={validWeight ? undefined : 'Enter a weight between 0.1 and 500 kg'}>
            <Input type="number" min={0.1} step="0.1" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </FormField>
          <FormField label="COD amount (Rs)" hint="Leave empty for prepaid shipments" error={validCod ? undefined : 'Cannot be negative'}>
            <Input type="number" min={0} inputMode="numeric" value={cod} onChange={(e) => setCod(e.target.value)} placeholder="0" />
          </FormField>
          <div className="flex items-center gap-2.5 sm:pt-7">
            <Checkbox id={fragileId} checked={fragile} onCheckedChange={(checked) => setFragile(checked === true)} />
            <label htmlFor={fragileId} className="cursor-pointer text-sm font-medium text-gray-700">
              Fragile handling
            </label>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-gray-50 p-4" aria-live="polite">
          {!pricing ? (
            <Skeleton className="h-32" />
          ) : quote ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="blue">{ZONE_LABEL[quote.zone]}</Badge>
                <span className="text-xs text-gray-500">ETA: {quote.eta}</span>
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                {lines.map((line) => (
                  <div key={line.label} className="flex justify-between gap-4">
                    <dt className="text-gray-600">{line.label}</dt>
                    <dd className="tabular text-gray-900">{formatPKR(line.value)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-gray-200 pt-2.5 text-base font-semibold text-gray-900">
                  <dt>Total</dt>
                  <dd className="tabular">{formatPKR(quote.total)}</dd>
                </div>
              </dl>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              {validWeight && validCod ? 'No active rate card covers this zone and service. Activate or add one under Rate cards.' : 'Fix the highlighted fields to see a quote.'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
