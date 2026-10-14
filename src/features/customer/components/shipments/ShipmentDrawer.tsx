import { CalendarClock, PackageSearch, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DetailDrawer } from '@/components/shared/DetailDrawer'
import { PrintLabelButton } from '@/components/shared/PrintLabel'
import { Button } from '@/components/ui/button'
import { canCancel, canReschedule } from '@/features/shipments/meta'
import { ShipmentSummary } from '@/features/shipments/ShipmentSummary'
import { shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { RescheduleDialog } from './RescheduleDialog'

interface ShipmentDrawerProps {
  shipment: Shipment | undefined
  onClose: () => void
}

/** Shipment detail panel with the customer's actions: track, print label, reschedule, cancel. */
export function ShipmentDrawer({ shipment, onClose }: ShipmentDrawerProps) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)

  const cancel = async () => {
    if (!shipment) return
    try {
      await shipmentService.cancel(shipment.id)
      toast.success(`Shipment ${shipment.trackingNumber} cancelled`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not cancel this shipment.')
    }
  }

  return (
    <>
      <DetailDrawer
        open={!!shipment}
        onOpenChange={(open) => !open && onClose()}
        title={shipment ? <span className="font-mono">{shipment.trackingNumber}</span> : 'Shipment'}
        description={shipment ? `To ${shipment.receiver.name}, ${shipment.receiver.city}` : undefined}
        footer={
          shipment && (
            <div className="flex w-full flex-wrap justify-end gap-2">
              {canCancel(shipment.status) && (
                <Button variant="destructive-outline" size="sm" onClick={() => setConfirmCancel(true)} className="mr-auto">
                  <XCircle /> Cancel
                </Button>
              )}
              {canReschedule(shipment.status) && (
                <Button variant="secondary" size="sm" onClick={() => setRescheduling(true)}>
                  <CalendarClock /> Reschedule
                </Button>
              )}
              <PrintLabelButton shipment={shipment} size="sm" />
              <Button size="sm" asChild>
                <Link to={`/customer/track/${shipment.trackingNumber}`}>
                  <PackageSearch /> Track
                </Link>
              </Button>
            </div>
          )
        }
      >
        {shipment && <ShipmentSummary shipment={shipment} />}
      </DetailDrawer>

      {shipment && (
        <>
          <ConfirmationDialog
            open={confirmCancel}
            onOpenChange={setConfirmCancel}
            title="Cancel this shipment?"
            description={
              <>
                Booking <span className="font-mono font-medium text-gray-900">{shipment.trackingNumber}</span> to {shipment.receiver.name} will be cancelled. This cannot be undone — you would need to
                book it again.
              </>
            }
            confirmLabel="Cancel shipment"
            cancelLabel="Keep shipment"
            destructive
            onConfirm={cancel}
          />
          {rescheduling && <RescheduleDialog shipment={shipment} open onOpenChange={setRescheduling} />}
        </>
      )}
    </>
  )
}
