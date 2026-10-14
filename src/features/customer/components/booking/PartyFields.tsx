import { BookUser } from 'lucide-react'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { FormField } from '@/components/shared/FormField'
import { Input, Label, NativeSelect, Textarea } from '@/components/ui/input'
import { CITIES } from '@/data/cities'
import type { SavedAddress } from '@/types'
import { PHONE_HINT } from '../../validation'
import type { BookingValues } from './schema'

interface PartyFieldsProps {
  prefix: 'sender' | 'receiver'
  addresses: SavedAddress[]
  emailRequired?: boolean
  addressLabel: string
  cityLabel: string
}

/** Contact + address fields shared by the sender and receiver steps, with a saved-address shortcut. */
export function PartyFields({ prefix, addresses, emailRequired, addressLabel, cityLabel }: PartyFieldsProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<BookingValues>()
  const fieldErrors = errors[prefix]
  const pickerId = useId()
  const [picked, setPicked] = useState('')

  const applyAddress = (id: string) => {
    setPicked(id)
    const saved = addresses.find((a) => a.id === id)
    if (!saved) return
    const options = { shouldValidate: true, shouldDirty: true }
    setValue(`${prefix}.name`, saved.name, options)
    setValue(`${prefix}.phone`, saved.phone, options)
    setValue(`${prefix}.email`, saved.email ?? '', options)
    setValue(`${prefix}.address`, saved.address, options)
    setValue(`${prefix}.city`, saved.city, options)
    setValue(`${prefix}.postalCode`, saved.postalCode, options)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <BookUser className="size-4 text-gray-500" aria-hidden />
          <Label htmlFor={pickerId}>Use a saved address</Label>
        </div>
        {addresses.length > 0 ? (
          <div className="mt-2 sm:max-w-md">
            <NativeSelect id={pickerId} value={picked} onChange={(e) => applyAddress(e.target.value)}>
              <option value="">Choose from your address book…</option>
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.name}, {a.city}
                  {a.isDefault ? ' (default)' : ''}
                </option>
              ))}
            </NativeSelect>
            <p className="mt-1.5 text-xs text-gray-500">Selecting an address fills the fields below. You can still edit them.</p>
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-gray-500">
            You have no saved addresses yet.{' '}
            <Link to="/customer/addresses" className="font-medium text-brand-700 hover:underline">
              Open the address book
            </Link>
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={fieldErrors?.name?.message}>
          <Input autoComplete="off" placeholder="e.g. Ahmed Raza" {...register(`${prefix}.name`)} />
        </FormField>
        <FormField label="Phone number" required hint={PHONE_HINT} error={fieldErrors?.phone?.message}>
          <Input type="tel" inputMode="tel" autoComplete="off" placeholder="+92 300 1234567" {...register(`${prefix}.phone`)} />
        </FormField>
        <FormField
          label="Email"
          required={emailRequired}
          hint={emailRequired ? undefined : 'Optional'}
          error={fieldErrors?.email?.message}
          className="sm:col-span-2"
        >
          <Input type="email" autoComplete="off" placeholder="name@example.com" {...register(`${prefix}.email`)} />
        </FormField>
        <FormField label={addressLabel} required error={fieldErrors?.address?.message} className="sm:col-span-2">
          <Textarea rows={2} placeholder="House / office no., street, area" {...register(`${prefix}.address`)} />
        </FormField>
        <FormField label={cityLabel} required error={fieldErrors?.city?.message}>
          <NativeSelect {...register(`${prefix}.city`)}>
            <option value="">Select city</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Postal code" required error={fieldErrors?.postalCode?.message}>
          <Input inputMode="numeric" maxLength={5} placeholder="e.g. 54000" className="tabular" {...register(`${prefix}.postalCode`)} />
        </FormField>
      </div>
    </div>
  )
}
