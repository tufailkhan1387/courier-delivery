import { UserX } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { RadioCard, RadioGroup } from '@/components/ui/controls'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/misc'
import { shipmentService } from '@/services'
import type { Branch, Driver, Shipment } from '@/types'
import { titleCase } from '@/utils/format'
import { driverLeg, driversInCity } from '../../lib/statusRules'

interface Props {
  shipment: Shipment
  drivers: Driver[]
  branches: Map<string, Branch>
  open: boolean
  onOpenChange: (open: boolean) => void
}

function DriverPicker({ shipment, drivers, branches, onDone }: Omit<Props, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const { leg, city } = driverLeg(shipment)
  const candidates = driversInCity(drivers, branches, city)
  const [driverId, setDriverId] = useState(shipment.driverId && candidates.some((d) => d.id === shipment.driverId) ? shipment.driverId : '')
  const [saving, setSaving] = useState(false)

  if (candidates.length === 0) {
    return <EmptyState icon={UserX} title={`No drivers in ${city}`} description="Add a driver to a branch in this city before assigning this shipment." className="py-8" />
  }

  const assign = async () => {
    setSaving(true)
    try {
      await shipmentService.assignDriver(shipment.id, driverId)
      toast.success(`${candidates.find((d) => d.id === driverId)?.name} assigned for ${leg}`)
      onDone()
    } catch {
      toast.error('Could not assign the driver. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <p className="mb-3 text-sm text-gray-600">
        Drivers based in <span className="font-medium text-gray-900">{city}</span> for the {leg} leg.
      </p>
      <RadioGroup value={driverId} onValueChange={setDriverId} aria-label="Driver" className="space-y-2.5">
        {candidates.map((d) => (
          <RadioCard key={d.id} value={d.id} className="p-3 pr-10">
            <span className="flex items-center gap-3">
              <Avatar name={d.name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-gray-900">{d.name}</span>
                <span className="block truncate text-xs text-gray-500">
                  {branches.get(d.branchId)?.name} · {titleCase(d.vehicleType)} {d.vehiclePlate}
                </span>
              </span>
              <StateBadge value={d.availability} />
            </span>
          </RadioCard>
        ))}
      </RadioGroup>
      <DialogFooter>
        <Button variant="secondary" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={assign} loading={saving} disabled={!driverId || driverId === shipment.driverId}>
          Assign driver
        </Button>
      </DialogFooter>
    </>
  )
}

/** Assigns a rider from the city that currently needs one (origin for pickup, destination for delivery). */
export function AssignDriverDialog({ open, onOpenChange, ...rest }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Assign driver" description={<span className="font-mono">{rest.shipment.trackingNumber}</span>}>
        <DriverPicker {...rest} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
