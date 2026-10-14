import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { CITIES } from '@/data/cities'
import { CURRENT_CUSTOMER_ID } from '@/data/session'
import { addressService } from '@/services'
import type { SavedAddress } from '@/types'
import { citySchema, nameSchema, optionalEmailSchema, PHONE_HINT, phoneSchema, postalCodeSchema, streetAddressSchema } from '../../validation'

const addressSchema = z.object({
  label: z.string().trim().min(1, 'Give this address a label, e.g. Home').max(30, 'Keep the label under 30 characters'),
  name: nameSchema,
  phone: phoneSchema,
  email: optionalEmailSchema,
  address: streetAddressSchema,
  city: citySchema,
  postalCode: postalCodeSchema,
  isDefault: z.boolean(),
})

type AddressValues = z.infer<typeof addressSchema>

interface AddressFormDialogProps {
  /** The address being edited, or `undefined` to add a new one. */
  address: SavedAddress | undefined
  /** True when the address book is empty, so the first entry becomes the default. */
  firstAddress: boolean
  onClose: () => void
}

/** Add / edit dialog. Mount it only while open so the form starts from fresh defaults. */
export function AddressFormDialog({ address, firstAddress, onClose }: AddressFormDialogProps) {
  const defaultId = useId()
  const lockedDefault = address?.isDefault || firstAddress
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? { label: address.label, name: address.name, phone: address.phone, email: address.email ?? '', address: address.address, city: address.city, postalCode: address.postalCode, isDefault: address.isDefault }
      : { label: '', name: '', phone: '', email: '', address: '', postalCode: '', isDefault: firstAddress },
  })

  const submit = handleSubmit(async (values) => {
    try {
      await addressService.save({
        id: address?.id,
        customerId: CURRENT_CUSTOMER_ID,
        label: values.label,
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        address: values.address,
        city: values.city,
        postalCode: values.postalCode,
        isDefault: lockedDefault ? true : values.isDefault,
      })
      toast.success(address ? 'Address updated' : 'Address saved')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The address could not be saved.')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent title={address ? 'Edit address' : 'Add address'} description="Saved addresses can be picked when you book a shipment.">
        <form onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Label" required error={errors.label?.message}>
              <Input placeholder="e.g. Home, Office" {...register('label')} />
            </FormField>
            <FormField label="Contact name" required error={errors.name?.message}>
              <Input placeholder="e.g. Ahmed Raza" {...register('name')} />
            </FormField>
            <FormField label="Phone number" required hint={PHONE_HINT} error={errors.phone?.message}>
              <Input type="tel" inputMode="tel" placeholder="+92 300 1234567" {...register('phone')} />
            </FormField>
            <FormField label="Email" hint="Optional" error={errors.email?.message}>
              <Input type="email" placeholder="name@example.com" {...register('email')} />
            </FormField>
            <FormField label="Street address" required error={errors.address?.message} className="sm:col-span-2">
              <Textarea rows={2} placeholder="House / office no., street, area" {...register('address')} />
            </FormField>
            <FormField label="City" required error={errors.city?.message}>
              <NativeSelect {...register('city')}>
                <option value="">Select city</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Postal code" required error={errors.postalCode?.message}>
              <Input inputMode="numeric" maxLength={5} placeholder="e.g. 54000" className="tabular" {...register('postalCode')} />
            </FormField>
          </div>

          <div className="mt-4 flex items-start gap-3">
            <Controller
              control={control}
              name="isDefault"
              render={({ field }) => (
                <Checkbox
                  id={defaultId}
                  checked={lockedDefault ? true : field.value}
                  disabled={lockedDefault}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  className="mt-0.5"
                />
              )}
            />
            <div>
              <label htmlFor={defaultId} className="text-sm font-medium text-gray-900">
                Use as my default address
              </label>
              <p className="text-sm text-gray-500">
                {address?.isDefault
                  ? 'This is your default. To change it, set another address as default.'
                  : firstAddress
                    ? 'Your first address is saved as the default.'
                    : 'The default address pre-fills the sender step when you book.'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {address ? 'Save changes' : 'Save address'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
