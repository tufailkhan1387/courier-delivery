import { addDays, format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { formatDate } from '@/utils/format'

interface RescheduleDialogProps {
  shipment: Shipment
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DATE_FORMAT = 'yyyy-MM-dd'

/** Pick a new pickup / re-delivery date for a booked or failed shipment (mock). */
export function RescheduleDialog({ shipment, open, onOpenChange }: RescheduleDialogProps) {
  // Allowed window: tomorrow up to two weeks out, fixed when the dialog opens.
  const [{ min, max }] = useState(() => ({ min: format(addDays(new Date(), 1), DATE_FORMAT), max: format(addDays(new Date(), 14), DATE_FORMAT) }))
  const [date, setDate] = useState(min)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const reattempt = shipment.status === 'failed'

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!date) return setError('Choose a date')
    if (date < min || date > max) return setError('Choose a date within the next 14 days')
    setError(undefined)
    setBusy(true)
    try {
      // Midday local time keeps the calendar date stable across time zones.
      const iso = new Date(`${date}T12:00:00`).toISOString()
      await shipmentService.reschedule(shipment.id, iso)
      toast.success(`${reattempt ? 'Re-delivery' : 'Pickup'} rescheduled for ${formatDate(iso)}`, { description: 'Demo update — no rider is actually notified.' })
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not reschedule this shipment.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent
        size="sm"
        title={reattempt ? 'Schedule a re-delivery' : 'Reschedule pickup'}
        description={
          <>
            Shipment <span className="font-mono">{shipment.trackingNumber}</span>
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <FormField label={reattempt ? 'New delivery date' : 'New date'} required error={error} hint="Any day within the next two weeks.">
            <Input type="date" value={date} min={min} max={max} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <p className="mt-3 text-sm text-gray-500">
            {reattempt
              ? 'The parcel returns to the destination facility queue and the estimated delivery date is updated.'
              : 'The estimated delivery date is updated and a note is added to the tracking history.'}
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
              Keep current date
            </Button>
            <Button type="submit" loading={busy}>
              Reschedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
