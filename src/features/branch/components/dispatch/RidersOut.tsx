import { Bike, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DetailDrawer } from '@/components/shared/DetailDrawer'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/misc'
import type { Driver, Shipment } from '@/types'
import { formatPKR, timeAgo, titleCase } from '@/utils/format'
import { formatKg, lastEventAt, totalsOf } from '../../lib'

interface RidersOutProps {
  drivers: Driver[] | undefined
  /** Parcels currently out for delivery from this branch. */
  shipments: Shipment[]
  loading: boolean
}

/** Riders of this branch with the parcels they currently carry. */
export function RidersOut({ drivers, shipments, loading }: RidersOutProps) {
  const [openId, setOpenId] = useState<string>()
  const riders = useMemo(
    () =>
      (drivers ?? [])
        .map((driver) => {
          const load = shipments.filter((s) => s.driverId === driver.id)
          return { driver, load, totals: totalsOf(load) }
        })
        .filter((r) => r.load.length > 0)
        .sort((a, b) => b.load.length - a.load.length),
    [drivers, shipments],
  )
  const opened = riders.find((r) => r.driver.id === openId)

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <CardSkeleton key={i} lines={2} />
        ))}
      </div>
    )
  }
  if (riders.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-card">
        <EmptyState icon={Bike} title="No riders out right now" description="Riders appear here once parcels are sent out for delivery." className="py-10" />
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {riders.map(({ driver, load, totals }) => {
          const Icon = driver.vehicleType === 'bike' ? Bike : Truck
          return (
            <article key={driver.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                <Avatar name={driver.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{driver.name}</p>
                  <p className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Icon className="size-3.5" aria-hidden />
                    {titleCase(driver.vehicleType)} · <span className="font-mono">{driver.vehiclePlate}</span>
                  </p>
                </div>
                <StateBadge value={driver.availability} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  ['On board', String(load.length)],
                  ['Weight', formatKg(totals.weightKg)],
                  ['COD due', formatPKR(totals.cod)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-gray-50 px-1 py-2">
                    <dd className="tabular truncate text-sm font-semibold text-gray-900">{value}</dd>
                    <dt className="text-xs text-gray-500">{label}</dt>
                  </div>
                ))}
              </dl>
              <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setOpenId(driver.id)}>
                View {load.length} parcel{load.length === 1 ? '' : 's'}
              </Button>
            </article>
          )
        })}
      </div>

      <DetailDrawer
        open={Boolean(opened)}
        onOpenChange={(open) => !open && setOpenId(undefined)}
        title={opened ? `${opened.driver.name}'s load` : ''}
        description={opened ? `${opened.load.length} parcels out for delivery · ${opened.driver.phone}` : undefined}
        width="md"
      >
        <ul className="divide-y divide-gray-200">
          {opened?.load.map((s) => (
            <li key={s.id} className="py-3 first:pt-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-gray-900">{s.trackingNumber}</span>
                {s.codAmount > 0 ? <Badge tone="orange">COD {formatPKR(s.codAmount)}</Badge> : <Badge>Prepaid</Badge>}
              </div>
              <p className="mt-1 text-sm text-gray-700">{s.receiver.name}</p>
              <p className="text-xs text-gray-500">{s.receiver.address}</p>
              <p className="mt-1 text-xs text-gray-400">Sent out {timeAgo(lastEventAt(s))}</p>
            </li>
          ))}
        </ul>
      </DetailDrawer>
    </>
  )
}
