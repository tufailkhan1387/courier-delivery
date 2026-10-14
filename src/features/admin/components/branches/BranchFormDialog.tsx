import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input, NativeSelect } from '@/components/ui/input'
import { CITIES } from '@/data/cities'
import { branchService } from '@/services'
import type { Branch, City } from '@/types'

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(10, 'Keep the code under 10 characters')
    .regex(/^[A-Za-z0-9-]+$/, 'Letters, numbers and dashes only'),
  name: z.string().trim().min(3, 'Enter the branch name'),
  type: z.enum(['hub', 'branch']),
  city: z.enum(CITIES as [City, ...City[]]),
  address: z.string().trim().min(8, 'Enter the full street address'),
  phone: z.string().trim().min(7, 'Enter a contact number'),
  managerName: z.string().trim().min(3, 'Enter the manager’s name'),
  status: z.enum(['active', 'inactive']),
  dailyCapacity: z.number({ error: 'Enter a number' }).int('Use a whole number').min(50, 'Minimum 50 parcels per day').max(20000, 'Maximum 20,000 parcels per day'),
})

type Values = z.infer<typeof schema>

const EMPTY: Values = { code: '', name: '', type: 'branch', city: 'Karachi', address: '', phone: '', managerName: '', status: 'active', dailyCapacity: 500 }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Branch to edit; omit to create a new one. */
  branch?: Branch
  existingCodes: string[]
  onSaved?: (branch: Branch) => void
}

function BranchForm({ branch, existingCodes, onSaved, onDone }: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: branch ?? EMPTY })

  const submit = handleSubmit(async (values) => {
    const input = { ...values, code: values.code.toUpperCase() }
    if (existingCodes.some((c) => c === input.code && c !== branch?.code)) {
      setError('code', { message: 'Another branch already uses this code' })
      return
    }
    try {
      const saved = branch ? await branchService.update(branch.id, input) : await branchService.create(input)
      toast.success(branch ? `${saved.name} updated` : `${saved.name} added to the network`)
      onSaved?.(saved)
      onDone()
    } catch {
      toast.error('Could not save the branch. Please try again.')
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Branch name" required error={errors.name?.message} className="sm:col-span-2">
          <Input {...register('name')} placeholder="e.g. Lahore Johar Town Branch" />
        </FormField>
        <FormField label="Branch code" required error={errors.code?.message} hint="Short unique code, e.g. LHE-03">
          <Input {...register('code')} className="uppercase" />
        </FormField>
        <FormField label="Type" required error={errors.type?.message}>
          <NativeSelect {...register('type')}>
            <option value="branch">Branch</option>
            <option value="hub">Hub</option>
          </NativeSelect>
        </FormField>
        <FormField label="City" required error={errors.city?.message}>
          <NativeSelect {...register('city')}>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Status" required error={errors.status?.message}>
          <NativeSelect {...register('status')}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </NativeSelect>
        </FormField>
        <FormField label="Address" required error={errors.address?.message} className="sm:col-span-2">
          <Input {...register('address')} />
        </FormField>
        <FormField label="Manager" required error={errors.managerName?.message}>
          <Input {...register('managerName')} />
        </FormField>
        <FormField label="Phone" required error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" />
        </FormField>
        <FormField label="Daily capacity" required error={errors.dailyCapacity?.message} hint="Parcels the facility can process per day">
          <Input {...register('dailyCapacity', { valueAsNumber: true })} type="number" min={0} inputMode="numeric" />
        </FormField>
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {branch ? 'Save changes' : 'Add branch'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BranchFormDialog({ open, onOpenChange, branch, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={branch ? 'Edit branch' : 'Add branch'} description={branch ? branch.code : 'Register a new hub or branch in the demo network.'} size="lg">
        <BranchForm branch={branch} {...rest} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
