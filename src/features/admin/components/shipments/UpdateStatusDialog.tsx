import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { FormField } from '@/components/shared/FormField'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { NativeSelect, Textarea } from '@/components/ui/input'
import { CURRENT_ADMIN } from '@/data/session'
import { FAILURE_REASONS, STATUS_META } from '@/features/shipments/meta'
import { shipmentService } from '@/services'
import type { Shipment, ShipmentStatus } from '@/types'
import { NEXT_STATUSES } from '../../lib/statusRules'

interface Props {
  shipment: Shipment
  open: boolean
  onOpenChange: (open: boolean) => void
}

function StatusForm({ shipment, onDone }: { shipment: Shipment; onDone: () => void }) {
  const options = NEXT_STATUSES[shipment.status]
  const [status, setStatus] = useState<ShipmentStatus>(options[0])
  const [reason, setReason] = useState(FAILURE_REASONS[0])
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await shipmentService.updateStatus(shipment.id, status, {
        actor: `${CURRENT_ADMIN.name} (Admin)`,
        note: note.trim() || undefined,
        failureReason: status === 'failed' ? reason : undefined,
        pod:
          status === 'delivered'
            ? { recipientName: shipment.receiver.name, deliveredAt: new Date().toISOString(), otpVerified: false, codCollected: shipment.codAmount || undefined }
            : undefined,
      })
      toast.success(`Status updated to ${STATUS_META[status].label}`)
      onDone()
    } catch {
      toast.error('Could not update the status. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3.5 py-3 text-sm">
        <span className="text-gray-500">Current status</span>
        <StatusBadge status={shipment.status} />
      </div>
      <FormField label="New status" required>
        <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as ShipmentStatus)}>
          {options.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      {status === 'failed' && (
        <FormField label="Failure reason" required>
          <NativeSelect value={reason} onChange={(e) => setReason(e.target.value)}>
            {FAILURE_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </NativeSelect>
        </FormField>
      )}
      <FormField label="Note" hint="Optional. Shown on the tracking timeline in place of the default description.">
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. Released after address confirmation" />
      </FormField>
      {status === 'delivered' && (
        <p className="text-xs text-gray-500">
          Marking as delivered from the console records a proof of delivery without OTP, signature or photo
          {shipment.codAmount > 0 ? ' and marks the COD as collected in the demo ledger' : ''}.
        </p>
      )}
      <DialogFooter>
        <Button variant="secondary" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Update status
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Moves a shipment to one of the statuses allowed from its current one. */
export function UpdateStatusDialog({ shipment, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Update status" description={<span className="font-mono">{shipment.trackingNumber}</span>} size="sm">
        <StatusForm shipment={shipment} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
