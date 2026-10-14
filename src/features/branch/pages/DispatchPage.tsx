import { Bike, ClipboardList, Plus, Send, Truck } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import type { Manifest } from '@/types'
import { RidersOut } from '../components/dispatch/RidersOut'
import { ManifestCard } from '../components/ManifestCard'
import { DispatchManifestDialog } from '../components/ManifestDialogs'
import { useBranches, useDriverMap, useHubShipments, useManifests } from '../hooks'
import { branchLabel } from '../lib'

const byNewest = (a: Manifest, b: Manifest) => (b.dispatchedAt ?? b.createdAt).localeCompare(a.dispatchedAt ?? a.createdAt)

function BoardColumn({ title, count, loading, empty, children }: { title: string; count: number; loading: boolean; empty: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-gray-100/60 p-3" aria-label={title}>
      <div className="flex items-center justify-between px-1 pb-3 pt-1">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        <Badge>{count}</Badge>
      </div>
      <div className="space-y-3">
        {loading ? Array.from({ length: 2 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />) : count === 0 ? <div className="rounded-xl border border-dashed border-gray-300 bg-white">{empty}</div> : children}
      </div>
    </section>
  )
}

export default function DispatchPage() {
  const { map: branches } = useBranches()
  const drivers = useDriverMap()
  const hub = useHubShipments()
  const manifests = useManifests()
  const [dispatching, setDispatching] = useState<Manifest>()

  const drafts = useMemo(() => (manifests.outbound ?? []).filter((m) => m.status === 'draft').sort(byNewest), [manifests.outbound])
  const onRoad = useMemo(() => (manifests.outbound ?? []).filter((m) => m.status === 'dispatched').sort(byNewest), [manifests.outbound])
  const allDrivers = useMemo(() => [...drivers.values()], [drivers])
  const loading = (manifests.loading && !manifests.data) || (hub.loading && !hub.all)
  const ridersOut = new Set(hub.outForDelivery.map((s) => s.driverId).filter(Boolean)).size

  return (
    <>
      <PageHeader
        title="Dispatch Management"
        description="Linehaul manifests leaving this hub and riders currently out for delivery."
        actions={
          <Button asChild>
            <Link to="/branch/manifests/new">
              <Plus /> Create manifest
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Ready to dispatch" value={drafts.length} icon={ClipboardList} tone="gray" hint="Draft manifests" loading={loading} />
        <StatsCard label="Linehaul in transit" value={onRoad.length} icon={Truck} tone="blue" hint="Awaiting receipt at destination" loading={loading} />
        <StatsCard label="Riders out" value={ridersOut} icon={Bike} tone="orange" hint="On last-mile runs" loading={loading} />
        <StatsCard label="Parcels with riders" value={hub.outForDelivery.length} icon={Send} tone="indigo" hint="Out for delivery" loading={loading} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-2">
        <BoardColumn
          title="Ready to dispatch"
          count={drafts.length}
          loading={loading}
          empty={
            <EmptyState
              icon={ClipboardList}
              title="No draft manifests"
              description="Create a manifest to load parcels for linehaul."
              className="py-10"
              action={
                <Button size="sm" asChild>
                  <Link to="/branch/manifests/new">Create manifest</Link>
                </Button>
              }
            />
          }
        >
          {drafts.map((m) => (
            <ManifestCard
              key={m.id}
              manifest={m}
              shipments={hub.all ?? []}
              branches={branches}
              driver={m.driverId ? drivers.get(m.driverId) : undefined}
              actions={
                <>
                  <Button size="sm" disabled={m.shipmentIds.length === 0} onClick={() => setDispatching(m)}>
                    <Send /> Dispatch
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link to={`/branch/manifests/${m.id}`}>Open</Link>
                  </Button>
                </>
              }
            />
          ))}
        </BoardColumn>

        <BoardColumn
          title="In transit"
          count={onRoad.length}
          loading={loading}
          empty={<EmptyState icon={Truck} title="No vehicles on the road" description="Dispatched manifests stay here until the destination receives them." className="py-10" />}
        >
          {onRoad.map((m) => (
            <ManifestCard
              key={m.id}
              manifest={m}
              shipments={hub.all ?? []}
              branches={branches}
              driver={m.driverId ? drivers.get(m.driverId) : undefined}
              actions={
                <Button size="sm" variant="secondary" asChild>
                  <Link to={`/branch/manifests/${m.id}`}>View manifest</Link>
                </Button>
              }
            />
          ))}
        </BoardColumn>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Riders out for delivery</h2>
          <p className="text-sm text-gray-500">Current load per rider. Positions are not tracked in this demo.</p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link to="/branch/outgoing?tab=last-mile">
            <Bike /> Assign more parcels
          </Link>
        </Button>
      </div>
      <div className="mt-4">
        <RidersOut drivers={allDrivers} shipments={hub.outForDelivery} loading={loading || drivers.size === 0} />
      </div>

      <DispatchManifestDialog manifest={dispatching} facilityName={dispatching ? branchLabel(branches, dispatching.destinationBranchId) : ''} onClose={() => setDispatching(undefined)} />
    </>
  )
}
