import type { ReactNode } from 'react'
import { DetailDrawer } from '@/components/shared/DetailDrawer'
import { PrintLabelButton } from '@/components/shared/PrintLabel'
import { ShipmentSummary } from '@/features/shipments/ShipmentSummary'
import type { Shipment } from '@/types'

interface ShipmentDrawerProps {
  shipment: Shipment | undefined
  onClose: () => void
  /** Extra footer actions shown before "Print label". */
  actions?: ReactNode
}

/** Side panel with the full shipment overview; opened from any hub table row. */
export function ShipmentDrawer({ shipment, onClose, actions }: ShipmentDrawerProps) {
  return (
    <DetailDrawer
      open={Boolean(shipment)}
      onOpenChange={(open) => !open && onClose()}
      title={<span className="font-mono">{shipment?.trackingNumber}</span>}
      description={shipment?.parcel.description}
      footer={
        shipment && (
          <>
            {actions}
            <PrintLabelButton shipment={shipment} />
          </>
        )
      }
    >
      {shipment && <ShipmentSummary shipment={shipment} />}
    </DetailDrawer>
  )
}
