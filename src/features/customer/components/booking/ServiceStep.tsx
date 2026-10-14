import { Banknote, Building2, Clock, CreditCard, Info, Smartphone, Store, Truck, type LucideIcon } from 'lucide-react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FormField } from '@/components/shared/FormField'
import { RadioCard, RadioGroup } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import type { PaymentMethod, PickupPreference } from '@/types'
import { formatPKR } from '@/utils/format'
import { QuoteBreakdown } from './QuoteBreakdown'
import { SERVICES, type BookingValues, type ServiceQuotes } from './schema'
import { StepHeading } from './StepHeading'

const HANDOVER: { value: PickupPreference; label: string; description: string; icon: LucideIcon }[] = [
  { value: 'pickup', label: 'Rider pickup', description: 'A rider collects the parcel from the pickup address.', icon: Truck },
  { value: 'dropoff', label: 'Branch drop-off', description: 'You hand the parcel over at a CourierPro branch.', icon: Store },
]

const PAYMENT: { value: PaymentMethod; description: string; icon: LucideIcon }[] = [
  { value: 'cod', description: 'The receiver pays the rider in cash.', icon: Banknote },
  { value: 'card', description: 'Pay the shipping cost by card.', icon: CreditCard },
  { value: 'wallet', description: 'JazzCash, Easypaisa and similar wallets.', icon: Smartphone },
  { value: 'account', description: 'Added to your monthly account statement.', icon: Building2 },
]

interface ServiceStepProps {
  quotes: ServiceQuotes | undefined
  pricingLoading: boolean
}

export function ServiceStep({ quotes, pricingLoading }: ServiceStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<BookingValues>()
  const [service, paymentMethod] = useWatch({ control, name: ['service', 'paymentMethod'] })

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="min-w-0 space-y-7 lg:col-span-2">
        <section>
          <StepHeading title="Service & payment" description="Choose how fast the parcel should travel and how the booking is paid for." />
          <h3 id="service-label" className="mb-2 text-sm font-medium text-gray-700">
            Delivery service
          </h3>
          <Controller
            control={control}
            name="service"
            render={({ field }) => (
              <RadioGroup aria-labelledby="service-label" value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-3">
                {SERVICES.map((option) => {
                  const quote = quotes?.[option]
                  return (
                    <RadioCard key={option} value={option} disabled={quote === null}>
                      <p className="pr-7 text-sm font-semibold text-gray-900">{SERVICE_META[option].label}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{SERVICE_META[option].tagline}</p>
                      {pricingLoading ? (
                        <Skeleton className="mt-3 h-7 w-20" />
                      ) : quote ? (
                        <>
                          <p className="tabular mt-3 text-xl font-semibold text-gray-900">{formatPKR(quote.total)}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                            <Clock className="size-3.5 text-gray-400" aria-hidden />
                            {quote.eta}
                          </p>
                        </>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-gray-500">{quote === null ? 'Not available on this route' : 'Price unavailable'}</p>
                      )}
                    </RadioCard>
                  )
                })}
              </RadioGroup>
            )}
          />
        </section>

        <section>
          <h3 id="handover-label" className="mb-2 text-sm font-medium text-gray-700">
            Pickup preference
          </h3>
          <Controller
            control={control}
            name="pickupPreference"
            render={({ field }) => (
              <RadioGroup aria-labelledby="handover-label" value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
                {HANDOVER.map(({ value, label, description, icon: Icon }) => (
                  <RadioCard key={value} value={value}>
                    <OptionBody icon={Icon} label={label} description={description} />
                  </RadioCard>
                ))}
              </RadioGroup>
            )}
          />
        </section>

        <section>
          <h3 id="payment-label" className="mb-2 text-sm font-medium text-gray-700">
            Payment method
          </h3>
          <Controller
            control={control}
            name="paymentMethod"
            render={({ field }) => (
              <RadioGroup aria-labelledby="payment-label" value={field.value} onValueChange={field.onChange} className="grid gap-3 sm:grid-cols-2">
                {PAYMENT.map(({ value, description, icon: Icon }) => (
                  <RadioCard key={value} value={value}>
                    <OptionBody icon={Icon} label={PAYMENT_LABEL[value]} description={description} />
                  </RadioCard>
                ))}
              </RadioGroup>
            )}
          />

          {paymentMethod === 'cod' ? (
            <FormField
              label="COD amount to collect (PKR)"
              required
              hint="The amount the rider collects from the receiver. A COD fee is added to the shipping cost."
              error={errors.codAmount?.message}
              className="mt-4 sm:max-w-sm"
            >
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                className="tabular"
                {...register('codAmount', { setValueAs: (value: string | number) => (value === '' ? 0 : Number(value)) })}
              />
            </FormField>
          ) : (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
              <p>
                {paymentMethod === 'account'
                  ? 'Demo only: the booking is recorded against a simulated account statement. No real invoice is issued.'
                  : 'No real payment is taken in this demo. You will not be asked for card or wallet details, and the booking is simply recorded as paid.'}
              </p>
            </div>
          )}
        </section>
      </div>

      <div className="min-w-0">
        <QuoteBreakdown quote={quotes ? quotes[service] : undefined} service={service} loading={pricingLoading} className="lg:sticky lg:top-24" />
      </div>
    </div>
  )
}

function OptionBody({ icon: Icon, label, description }: { icon: LucideIcon; label: string; description: string }) {
  return (
    <span className="flex items-start gap-3 pr-7">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-data-[state=checked]:bg-brand-100 group-data-[state=checked]:text-brand-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        <span className="mt-0.5 block text-xs text-gray-500">{description}</span>
      </span>
    </span>
  )
}
