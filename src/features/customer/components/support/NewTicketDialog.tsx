import { zodResolver } from '@hookform/resolvers/zod'
import { Info } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { CURRENT_CUSTOMER_ID } from '@/data/session'
import { ticketService } from '@/services'
import type { Shipment, Ticket } from '@/types'
import { SIMULATED_SUPPORT_NOTE, TICKET_CATEGORIES, TICKET_CATEGORY_LABEL, TICKET_PRIORITIES, TICKET_PRIORITY_LABEL } from './meta'

const ticketSchema = z.object({
  subject: z.string().trim().min(5, 'Add a short subject (at least 5 characters)').max(100, 'Keep the subject under 100 characters'),
  category: z.enum(TICKET_CATEGORIES, { error: 'Select a category' }),
  priority: z.enum(TICKET_PRIORITIES),
  trackingNumber: z.string(),
  message: z.string().trim().min(10, 'Describe the issue in at least 10 characters').max(1000, 'Keep the message under 1,000 characters'),
})

type TicketValues = z.infer<typeof ticketSchema>

interface NewTicketDialogProps {
  authorName: string
  shipments: Shipment[]
  onClose: () => void
  onCreated: (ticket: Ticket) => void
}

/** "New ticket" form. Mount it only while open so it always starts empty. */
export function NewTicketDialog({ authorName, shipments, onClose, onCreated }: NewTicketDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TicketValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: '', priority: 'medium', trackingNumber: '', message: '' },
  })

  const submit = handleSubmit(async (values) => {
    try {
      const ticket = await ticketService.create({
        customerId: CURRENT_CUSTOMER_ID,
        subject: values.subject,
        category: values.category,
        priority: values.priority,
        trackingNumber: values.trackingNumber || undefined,
        message: values.message,
        author: authorName,
      })
      toast.success(`Ticket ${ticket.number} created`, { description: 'Saved in this demo — no agent is notified.' })
      onCreated(ticket)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The ticket could not be created.')
    }
  })

  return (
    <Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent title="New support ticket" description="Tell us what went wrong and which shipment it concerns.">
        <form onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Subject" required error={errors.subject?.message} className="sm:col-span-2">
              <Input placeholder="e.g. Parcel marked delivered but not received" {...register('subject')} />
            </FormField>
            <FormField label="Category" required error={errors.category?.message}>
              <NativeSelect {...register('category')}>
                <option value="">Select category</option>
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {TICKET_CATEGORY_LABEL[category]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Priority" required error={errors.priority?.message}>
              <NativeSelect {...register('priority')}>
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {TICKET_PRIORITY_LABEL[priority]}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Related shipment" hint="Optional" error={errors.trackingNumber?.message} className="sm:col-span-2">
              <NativeSelect className="font-mono" {...register('trackingNumber')}>
                <option value="">Not about a specific shipment</option>
                {shipments.map((s) => (
                  <option key={s.id} value={s.trackingNumber}>
                    {s.trackingNumber} — {s.receiver.name}, {s.receiver.city}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Message" required error={errors.message?.message} className="sm:col-span-2">
              <Textarea rows={5} placeholder="Share as much detail as you can." {...register('message')} />
            </FormField>
          </div>

          <p className="mt-4 flex items-start gap-2.5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            {SIMULATED_SUPPORT_NOTE}
          </p>

          <DialogFooter>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Create ticket
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
