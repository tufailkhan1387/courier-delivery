import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input, NativeSelect } from '@/components/ui/input'
import { SERVICE_META, ZONE_LABEL } from '@/features/shipments/meta'
import { pricingService } from '@/services'
import type { PricingZone, RateCard, ServiceType } from '@/types'

const ZONES = Object.keys(ZONE_LABEL) as [PricingZone, ...PricingZone[]]
const SERVICES = Object.keys(SERVICE_META) as [ServiceType, ...ServiceType[]]
const amount = (max: number) => z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative').max(max, `Maximum ${max.toLocaleString()}`)

const schema = z.object({
  name: z.string().trim().min(3, 'Enter a name for this rate'),
  zone: z.enum(ZONES),
  service: z.enum(SERVICES),
  baseWeightKg: z.number({ error: 'Enter a number' }).min(0.5, 'Minimum 0.5 kg').max(50, 'Maximum 50 kg'),
  basePrice: amount(100000).min(1, 'Enter a base price'),
  perKgPrice: amount(10000),
  eta: z.string().trim().min(2, 'Describe the delivery time, e.g. 2–3 days'),
  active: z.boolean(),
})

type Values = z.infer<typeof schema>

const EMPTY: Values = { name: '', zone: 'within_city', service: 'standard', baseWeightKg: 1, basePrice: 250, perKgPrice: 80, eta: '', active: true }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rate to edit; omit to create a new one. */
  rate?: RateCard
}

function RateForm({ rate, onDone }: { rate?: RateCard; onDone: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: rate ?? EMPTY })

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await pricingService.saveRate({ ...values, id: rate?.id })
      toast.success(rate ? `${saved.name} updated` : `${saved.name} added`)
      onDone()
    } catch {
      toast.error('Could not save the rate. Please try again.')
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Rate name" required error={errors.name?.message} className="sm:col-span-2">
          <Input {...register('name')} placeholder="e.g. Same Zone · Express" />
        </FormField>
        <FormField label="Zone" required error={errors.zone?.message}>
          <NativeSelect {...register('zone')}>
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {ZONE_LABEL[z]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Service" required error={errors.service?.message}>
          <NativeSelect {...register('service')}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {SERVICE_META[s].label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Base weight (kg)" required error={errors.baseWeightKg?.message} hint="Weight covered by the base price">
          <Input {...register('baseWeightKg', { valueAsNumber: true })} type="number" step="0.5" min={0} inputMode="decimal" />
        </FormField>
        <FormField label="Base price (Rs)" required error={errors.basePrice?.message}>
          <Input {...register('basePrice', { valueAsNumber: true })} type="number" min={0} inputMode="numeric" />
        </FormField>
        <FormField label="Per extra kg (Rs)" required error={errors.perKgPrice?.message}>
          <Input {...register('perKgPrice', { valueAsNumber: true })} type="number" min={0} inputMode="numeric" />
        </FormField>
        <FormField label="Delivery time" required error={errors.eta?.message}>
          <Input {...register('eta')} placeholder="e.g. 1–2 days" />
        </FormField>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-3.5 py-3">
        <div>
          <p id="rate-active-label" className="text-sm font-medium text-gray-900">
            Active
          </p>
          <p className="text-xs text-gray-500">Only active rates are used when quoting. The first active match for a zone and service wins.</p>
        </div>
        <Controller control={control} name="active" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} aria-labelledby="rate-active-label" />} />
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {rate ? 'Save changes' : 'Add rate'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RateFormDialog({ open, onOpenChange, rate }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={rate ? 'Edit rate card' : 'Add rate card'} description="Prices apply to new quotes in this demo immediately." size="lg">
        <RateForm rate={rate} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
