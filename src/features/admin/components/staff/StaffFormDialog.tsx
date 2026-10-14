import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input, NativeSelect } from '@/components/ui/input'
import { ROLE_META } from '@/data/directory'
import { staffService } from '@/services'
import type { Branch, StaffRole } from '@/types'

const ROLES = Object.keys(ROLE_META) as [StaffRole, ...StaffRole[]]

const schema = z.object({
  name: z.string().trim().min(3, 'Enter the full name'),
  email: z.email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a contact number'),
  role: z.enum(ROLES),
  branchId: z.string().min(1, 'Choose a branch'),
})

type Values = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  branches: Branch[]
  defaultBranchId?: string
}

function StaffForm({ branches, defaultBranchId, onDone }: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', role: 'operations', branchId: defaultBranchId ?? '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const member = await staffService.create({ ...values, status: 'active', permissions: ROLE_META[values.role].permissions })
      toast.success(`${member.name} added as ${ROLE_META[member.role].label}`)
      onDone()
    } catch {
      toast.error('Could not add the staff member. Please try again.')
    }
  })

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" required error={errors.name?.message} className="sm:col-span-2">
          <Input {...register('name')} autoComplete="off" />
        </FormField>
        <FormField label="Work email" required error={errors.email?.message}>
          <Input {...register('email')} type="email" autoComplete="off" />
        </FormField>
        <FormField label="Phone" required error={errors.phone?.message}>
          <Input {...register('phone')} type="tel" autoComplete="off" />
        </FormField>
        <FormField label="Role" required error={errors.role?.message} hint="Sets the starting permissions">
          <NativeSelect {...register('role')}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </NativeSelect>
        </FormField>
        <FormField label="Branch" required error={errors.branchId?.message}>
          <NativeSelect {...register('branchId')}>
            <option value="">Select a branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      </div>
      <p className="mt-4 text-xs text-gray-500">Demo only: no account is created and no invitation email is sent.</p>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Add staff
        </Button>
      </DialogFooter>
    </form>
  )
}

export function StaffFormDialog({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Add staff" description="Add a team member to the employee directory." size="lg">
        <StaffForm {...rest} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
