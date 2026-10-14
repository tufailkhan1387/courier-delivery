import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { useQuery } from '@/hooks/useQuery'
import { pricingService } from '@/services'
import type { FinanceConfig } from '@/types'

const number = (max: number, unit: string) => z.number({ error: 'Enter a number' }).min(0, 'Cannot be negative').max(max, `Maximum ${max}${unit}`)

const schema = z.object({
  codFeePercent: number(10, '%'),
  codFeeMin: number(1000, ''),
  fragileSurcharge: number(5000, ''),
  fuelSurchargePercent: number(50, '%'),
})

type Values = z.infer<typeof schema>

function ConfigFields({ config }: { config: FinanceConfig }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: config })

  const submit = handleSubmit(async (values) => {
    try {
      const saved = await pricingService.updateConfig(values)
      reset(saved)
      toast.success('Fees and surcharges updated')
    } catch {
      toast.error('Could not save the configuration. Please try again.')
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <FormField label="COD fee (%)" required error={errors.codFeePercent?.message} hint="Charged on the COD amount">
          <Input {...register('codFeePercent', { valueAsNumber: true })} type="number" step="0.1" min={0} inputMode="decimal" />
        </FormField>
        <FormField label="Minimum COD fee (Rs)" required error={errors.codFeeMin?.message} hint="Applied when the percentage is lower">
          <Input {...register('codFeeMin', { valueAsNumber: true })} type="number" min={0} inputMode="numeric" />
        </FormField>
        <FormField label="Fragile surcharge (Rs)" required error={errors.fragileSurcharge?.message} hint="Flat fee per fragile shipment">
          <Input {...register('fragileSurcharge', { valueAsNumber: true })} type="number" min={0} inputMode="numeric" />
        </FormField>
        <FormField label="Fuel surcharge (%)" required error={errors.fuelSurchargePercent?.message} hint="On base price plus weight charge">
          <Input {...register('fuelSurchargePercent', { valueAsNumber: true })} type="number" step="0.5" min={0} inputMode="decimal" />
        </FormField>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="secondary" onClick={() => reset(config)} disabled={!isDirty || isSubmitting}>
          Discard
        </Button>
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save configuration
        </Button>
      </CardFooter>
    </form>
  )
}

/** COD fee and surcharge settings used by every quote. */
export function FinanceConfigForm() {
  const { data: config } = useQuery(() => pricingService.getConfig(), [])
  return (
    <Card>
      <CardHeader title="COD fee & surcharges" description="Applied on top of the rate card when a quote is calculated." />
      {config ? (
        <ConfigFields config={config} />
      ) : (
        <CardContent className="grid gap-4 sm:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </CardContent>
      )}
    </Card>
  )
}
