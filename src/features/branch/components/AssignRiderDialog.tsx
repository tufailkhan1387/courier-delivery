import { Bike, Truck } from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { RadioCard, RadioGroup } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/misc'
import type { Shipment } from '@/types'
import { titleCase } from '@/utils/format'
import { sendOutForDelivery } from '../actions'
import { useBranchDrivers, useHubShipments } from '../hooks'

/** Remembered for the session so consecutive parcels default to the same rider. */
let lastRiderId: string | undefined

interface AssignRiderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shipments: Shipment[]
  /** Called with the updated shipments after they were sent out. */
  onDone?: (updated: Shipment[]) => void
}

/** Pick a rider of this branch and send the given parcels out for delivery. */
export function AssignRiderDialog({ open, onOpenChange, shipments, onDone }: AssignRiderDialogProps) {
  const { data: drivers, loading } = useBranchDrivers()
  const { outForDelivery } = useHubShipments()
  const [picked, setPicked] = useState<string>()
  const [busy, setBusy] = useState(false)
  const groupRef = useRef<HTMLDivElement>(null)

  // Bikes first (last-mile vehicles), off-duty riders last.
  const riders = useMemo(
    () =>
      [...(drivers ?? [])].sort(
        (a, b) => Number(a.availability === 'off_duty') - Number(b.availability === 'off_duty') || Number(a.vehicleType !== 'bike') - Number(b.vehicleType !== 'bike'),
      ),
    [drivers],
  )
  const loads = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of outForDelivery) if (s.driverId) map.set(s.driverId, (map.get(s.driverId) ?? 0) + 1)
    return map
  }, [outForDelivery])

  // Default to the rider used last (this session), otherwise the first one on duty.
  const usable = riders.filter((r) => r.availability !== 'off_duty')
  const riderId = (usable.find((r) => r.id === picked) ?? usable.find((r) => r.id === lastRiderId) ?? usable[0])?.id ?? ''

  const close = () => {
    setPicked(undefined)
    onOpenChange(false)
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const rider = riders.find((r) => r.id === riderId)
    if (!rider || busy) return
    setBusy(true)
    try {
      const updated: Shipment[] = []
      for (const shipment of shipments) updated.push(await sendOutForDelivery(shipment, rider))
      lastRiderId = rider.id
      toast.success(`${updated.length} parcel${updated.length === 1 ? '' : 's'} out for delivery`, { description: `Assigned to ${rider.name} (demo — no rider was notified).` })
      onDone?.(updated)
      close()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not assign the rider')
    } finally {
      setBusy(false)
    }
  }

  const count = shipments.length
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && (next ? onOpenChange(true) : close())}>
      <DialogContent
        title="Send out for delivery"
        description={count === 1 ? `Assign a rider for ${shipments[0].trackingNumber}.` : `Assign a rider for ${count} parcels.`}
        onOpenAutoFocus={(e) => {
          const target = groupRef.current?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"], [role="radio"]:not([disabled])')
          if (target) {
            e.preventDefault()
            target.focus()
          }
        }}
      >
        <form
          onSubmit={submit}
          onKeyDown={(e) => {
            // Radio items swallow Enter, so confirm the highlighted rider explicitly.
            if (e.key === 'Enter' && (e.target as HTMLElement).getAttribute('role') === 'radio') void submit(e)
          }}
        >
          {loading && !drivers ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : riders.length === 0 ? (
            <EmptyState icon={Bike} title="No riders at this branch" description="Riders are managed in the admin console." className="py-8" />
          ) : (
            <RadioGroup ref={groupRef} value={riderId} onValueChange={setPicked} aria-label="Rider" className="space-y-3">
              {riders.map((rider) => {
                const Icon = rider.vehicleType === 'bike' ? Bike : Truck
                return (
                  <RadioCard key={rider.id} value={rider.id} disabled={rider.availability === 'off_duty'} className="py-3">
                    <div className="flex items-center gap-3 pr-8">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900">{rider.name}</p>
                        <p className="text-xs text-gray-500">
                          {titleCase(rider.vehicleType)} · <span className="font-mono">{rider.vehiclePlate}</span> · {loads.get(rider.id) ?? 0} on board
                        </p>
                      </div>
                      <StateBadge value={rider.availability} />
                    </div>
                  </RadioCard>
                )
              })}
            </RadioGroup>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} disabled={!riderId}>
              Send {count === 1 ? 'parcel' : `${count} parcels`} out
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
