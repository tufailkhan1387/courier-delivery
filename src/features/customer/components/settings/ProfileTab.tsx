import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { DetailList } from '@/components/shared/DetailDrawer'
import { FormField } from '@/components/shared/FormField'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/misc'
import { CITIES } from '@/data/cities'
import { customerService } from '@/services'
import type { Customer } from '@/types'
import { formatDate } from '@/utils/format'
import { citySchema, emailSchema, nameSchema, PHONE_HINT, phoneSchema, streetAddressSchema } from '../../validation'

const profileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema,
  address: streetAddressSchema,
  city: citySchema,
})

type ProfileValues = z.infer<typeof profileSchema>

const toValues = (c: Customer): ProfileValues => ({ name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city })

export function ProfileTab({ customer }: { customer: Customer }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: toValues(customer) })

  const submit = handleSubmit(async (values) => {
    try {
      const updated = await customerService.update(customer.id, values)
      reset(toValues(updated))
      toast.success('Profile updated', { description: 'Saved to the demo data in this browser.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Your profile could not be saved.')
    }
  })

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <form onSubmit={submit} noValidate>
          <CardHeader title="Personal details" description="Used to pre-fill the sender step when you book a shipment." />
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name" required error={errors.name?.message}>
                <Input autoComplete="name" {...register('name')} />
              </FormField>
              <FormField label="Phone number" required hint={PHONE_HINT} error={errors.phone?.message}>
                <Input type="tel" inputMode="tel" autoComplete="tel" {...register('phone')} />
              </FormField>
              <FormField label="Email" required error={errors.email?.message} className="sm:col-span-2">
                <Input type="email" autoComplete="email" {...register('email')} />
              </FormField>
              <FormField label="Address" required error={errors.address?.message} className="sm:col-span-2">
                <Textarea rows={2} autoComplete="street-address" {...register('address')} />
              </FormField>
              <FormField label="City" required error={errors.city?.message}>
                <NativeSelect {...register('city')}>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button variant="secondary" onClick={() => reset(toValues(customer))} disabled={!isDirty || isSubmitting}>
              Discard changes
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="self-start">
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar name={customer.name} size="xl" />
            <div className="min-w-0">
              <p className="break-words text-base font-semibold text-gray-900">{customer.name}</p>
              <p className="truncate text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>
          <DetailList
            className="mt-5 border-t border-gray-200 pt-5"
            items={[
              { label: 'Account type', value: customer.accountType === 'business' ? 'Business' : 'Personal' },
              { label: 'Status', value: <StateBadge value={customer.status} /> },
              { label: 'Member since', value: formatDate(customer.joinedAt) },
              { label: 'Customer ID', value: <span className="font-mono text-xs">{customer.id}</span> },
              ...(customer.company ? [{ label: 'Company', value: customer.company }] : []),
            ]}
          />
        </CardContent>
      </Card>
    </div>
  )
}
