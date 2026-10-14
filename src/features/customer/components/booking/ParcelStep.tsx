import { Scale } from 'lucide-react'
import { useId } from 'react'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FormField } from '@/components/shared/FormField'
import { Switch } from '@/components/ui/controls'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { chargeableWeight } from '@/features/pricing/calc'
import { CATEGORY_LABEL } from '@/features/shipments/meta'
import { CATEGORIES, type BookingValues } from './schema'
import { StepHeading } from './StepHeading'

const positive = (value: number) => (Number.isFinite(value) && value > 0 ? value : 0)

export function ParcelStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<BookingValues>()
  const e = errors.parcel
  const fragileId = useId()

  const [weightKg, length, width, height] = useWatch({ control, name: ['parcel.weightKg', 'parcel.length', 'parcel.width', 'parcel.height'] })
  const volumetric = (positive(length) * positive(width) * positive(height)) / 5000
  const chargeable = chargeableWeight(positive(weightKg), { length: positive(length), width: positive(width), height: positive(height) })

  return (
    <div>
      <StepHeading title="Parcel details" description="Tell us what you are sending so we can price and handle it correctly." />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Category" required error={e?.category?.message}>
          <NativeSelect {...register('parcel.category')}>
            <option value="">Select category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABEL[category]}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Quantity (pieces)" required error={e?.quantity?.message}>
          <Input type="number" inputMode="numeric" min={1} step={1} className="tabular" {...register('parcel.quantity', { valueAsNumber: true })} />
        </FormField>
        <FormField label="Contents description" required error={e?.description?.message} className="sm:col-span-2">
          <Input placeholder="e.g. Two cotton shirts" {...register('parcel.description')} />
        </FormField>
        <FormField label="Actual weight (kg)" required error={e?.weightKg?.message}>
          <Input type="number" inputMode="decimal" min={0} step="0.1" className="tabular" {...register('parcel.weightKg', { valueAsNumber: true })} />
        </FormField>
        <FormField label="Declared value (PKR)" required hint="Used for handling and claims reference only." error={e?.declaredValue?.message}>
          <Input type="number" inputMode="numeric" min={0} step={1} className="tabular" {...register('parcel.declaredValue', { valueAsNumber: true })} />
        </FormField>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-gray-700">
          Dimensions (cm)<span className="ml-0.5 text-red-500" aria-hidden>*</span>
        </legend>
        <div className="mt-1.5 grid grid-cols-3 gap-3">
          <FormField label="Length" error={e?.length?.message}>
            <Input type="number" inputMode="decimal" min={1} step="0.5" className="tabular" {...register('parcel.length', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Width" error={e?.width?.message}>
            <Input type="number" inputMode="decimal" min={1} step="0.5" className="tabular" {...register('parcel.width', { valueAsNumber: true })} />
          </FormField>
          <FormField label="Height" error={e?.height?.message}>
            <Input type="number" inputMode="decimal" min={1} step="0.5" className="tabular" {...register('parcel.height', { valueAsNumber: true })} />
          </FormField>
        </div>
      </fieldset>

      <div className="mt-4 flex items-start gap-3 rounded-lg bg-brand-25 px-4 py-3 text-sm text-gray-600 ring-1 ring-inset ring-brand-100">
        <Scale className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
        <p>
          Chargeable weight: <span className="tabular font-semibold text-gray-900">{chargeable.toFixed(2)} kg</span>
          <span className="text-gray-500">
            {' '}
            — the greater of actual weight and volumetric weight (L × W × H ÷ 5000 = <span className="tabular">{volumetric.toFixed(2)} kg</span>).
          </span>
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
        <div>
          <label htmlFor={fragileId} className="text-sm font-medium text-gray-900">
            Fragile item
          </label>
          <p className="text-sm text-gray-500">Adds a handling surcharge and a fragile mark on the label.</p>
        </div>
        <Controller
          control={control}
          name="parcel.fragile"
          render={({ field }) => <Switch id={fragileId} checked={field.value} onCheckedChange={field.onChange} onBlur={field.onBlur} ref={field.ref} />}
        />
      </div>

      <FormField label="Special instructions" hint="Optional — e.g. call before delivery, leave with the guard." error={e?.instructions?.message} className="mt-5">
        <Textarea rows={3} maxLength={200} {...register('parcel.instructions')} />
      </FormField>
    </div>
  )
}
