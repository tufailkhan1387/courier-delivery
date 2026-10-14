import { zodResolver } from '@hookform/resolvers/zod'
import { ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const passwordSchema = z
  .object({
    current: z.string().min(1, 'Enter your current password'),
    next: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[A-Za-z]/, 'Include at least one letter')
      .regex(/\d/, 'Include at least one number'),
    confirm: z.string().min(1, 'Re-enter the new password'),
  })
  .superRefine((values, ctx) => {
    if (values.confirm && values.next !== values.confirm) ctx.addIssue({ code: 'custom', path: ['confirm'], message: 'The passwords do not match' })
    if (values.current && values.next === values.current) ctx.addIssue({ code: 'custom', path: ['next'], message: 'Choose a password different from the current one' })
  })

type PasswordValues = z.infer<typeof passwordSchema>

export function SecurityTab() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { current: '', next: '', confirm: '' } })

  // Nothing is stored or sent: the form only demonstrates validation.
  const submit = handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    reset()
    toast.info('Demo only — your password was not changed', { description: 'Authentication is not connected yet, so nothing was saved.' })
  })

  return (
    <Card className="max-w-3xl">
      <form onSubmit={submit} noValidate>
        <CardHeader title="Change password" description="Use at least 8 characters with a letter and a number." />
        <CardContent>
          <p className="mb-5 flex items-start gap-2.5 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-800">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Authentication is not connected yet. This form checks your input and shows a demo message — it does not store, send or change any password.
          </p>
          <div className="grid gap-4 sm:max-w-md">
            <FormField label="Current password" required error={errors.current?.message}>
              <Input type="password" autoComplete="off" {...register('current')} />
            </FormField>
            <FormField label="New password" required error={errors.next?.message}>
              <Input type="password" autoComplete="off" {...register('next')} />
            </FormField>
            <FormField label="Confirm new password" required error={errors.confirm?.message}>
              <Input type="password" autoComplete="off" {...register('confirm')} />
            </FormField>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="submit" loading={isSubmitting}>
            Update password
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
