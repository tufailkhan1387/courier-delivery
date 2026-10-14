import { ArrowRight, Banknote, CircleCheck, ClipboardList, MapPin, RotateCcw, Truck, Undo2, Warehouse, type LucideIcon } from 'lucide-react'
import { DetailList } from '@/components/shared/DetailDrawer'
import { PrintLabelButton } from '@/components/shared/PrintLabel'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SERVICE_META } from '@/features/shipments/meta'
import type { Branch, Shipment } from '@/types'
import { formatPKR } from '@/utils/format'
import { formatKg, nextDestination, type BranchMap, type ScanAction, type ScanActionKey, type ScanAssessment } from '../../lib'

const ACTION_STYLE: Record<ScanActionKey, { icon: LucideIcon; variant: ButtonProps['variant'] }> = {
  receive: { icon: Warehouse, variant: 'success' },
  out_for_delivery: { icon: Truck, variant: 'primary' },
  reattempt: { icon: RotateCcw, variant: 'primary' },
  return: { icon: Undo2, variant: 'destructive-outline' },
  manifest: { icon: ClipboardList, variant: 'primary' },
}

export function Kbd({ children }: { children: string }) {
  return <kbd className="rounded border border-current/30 px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none opacity-80">{children}</kbd>
}

interface ParcelPanelProps {
  shipment: Shipment
  assessment: ScanAssessment
  /** Label of the action already applied to this scan, if any. */
  applied?: string
  branch: Branch | undefined
  branches: BranchMap
  busy: boolean
  onAction: (action: ScanAction) => void
}

/** Summary of the scanned parcel with the status actions available at this facility. */
export function ParcelPanel({ shipment, assessment, applied, branch, branches, busy, onAction }: ParcelPanelProps) {
  const { parcel, receiver } = shipment
  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tracking number</p>
            <p className="break-all font-mono text-2xl font-semibold tracking-wide text-gray-900">{shipment.trackingNumber}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {parcel.fragile && <Badge tone="orange">Fragile — handle with care</Badge>}
            <StatusBadge status={shipment.status} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Route</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-base font-semibold text-gray-900">
              {shipment.sender.city}
              <ArrowRight className="size-4 text-gray-400" aria-hidden />
              {receiver.city}
            </p>
          </div>
          <div className="rounded-lg bg-brand-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Next destination</p>
            <p className="mt-1 flex items-center gap-2 text-base font-semibold text-brand-900">
              <MapPin className="size-4 shrink-0" aria-hidden />
              {nextDestination(shipment, branch, branches)}
            </p>
          </div>
        </div>

        <DetailList
          columns={3}
          items={[
            { label: 'Receiver', value: receiver.name },
            { label: 'Deliver to', value: `${receiver.address}, ${receiver.city}` },
            { label: 'Contents', value: parcel.description },
            { label: 'Weight / pieces', value: `${formatKg(parcel.weightKg)} · ${parcel.quantity} pc` },
            { label: 'Service', value: SERVICE_META[shipment.service].label },
            {
              label: 'COD amount',
              value:
                shipment.codAmount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 text-orange-700">
                    <Banknote className="size-4" aria-hidden />
                    {formatPKR(shipment.codAmount)}
                  </span>
                ) : (
                  'Prepaid — nothing to collect'
                ),
            },
          ]}
        />

        <div className="border-t border-gray-200 pt-4">
          {applied && (
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CircleCheck className="size-4" aria-hidden />
              {applied}
            </p>
          )}
          {assessment.actions.length === 0 ? (
            <p className="text-sm text-gray-600">{applied ? 'No further hub action for this parcel. Scan the next one.' : assessment.message}</p>
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-600">{applied ? 'Next step for this parcel:' : assessment.message}</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {assessment.actions.map((action) => {
                  const style = ACTION_STYLE[action.key]
                  const Icon = style.icon
                  return (
                    <Button key={action.key} size="lg" variant={style.variant} disabled={busy} onClick={() => onAction(action)} className="justify-center sm:min-w-56">
                      <Icon />
                      {action.label}
                      {!applied && <Kbd>{action.shortcut}</Kbd>}
                    </Button>
                  )
                })}
              </div>
            </>
          )}
          <div className="mt-4">
            <PrintLabelButton shipment={shipment} size="sm">
              Reprint label
            </PrintLabelButton>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
