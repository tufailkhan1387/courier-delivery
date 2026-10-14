import { Boxes, CheckCheck, PackageOpen, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { SortBin, type SortBinData } from '../components/sorting/SortBin'
import { BRANCH_ID, useBranch, useBranches, useHubShipments } from '../hooks'
import { branchCity, branchLabel } from '../lib'
import { useSortedParcels } from '../sortedStore'

type View = 'all' | 'unsorted' | 'sorted'

const VIEWS: { value: View; label: string }[] = [
  { value: 'all', label: 'All parcels' },
  { value: 'unsorted', label: 'Unsorted' },
  { value: 'sorted', label: 'Sorted' },
]

export default function SortingPage() {
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const hub = useHubShipments()
  const { sorted, setMany } = useSortedParcels(BRANCH_ID)
  const [view, setView] = useState<View>('all')
  const [openId, setOpenId] = useState<string>()
  const loading = hub.loading && !hub.all

  const bins = useMemo<SortBinData[]>(() => {
    const byDestination = new Map<string, SortBinData>()
    for (const s of hub.linehaul) {
      const bin = byDestination.get(s.destinationBranchId) ?? {
        id: s.destinationBranchId,
        title: branchCity(branches, s.destinationBranchId),
        subtitle: `Linehaul to ${branchLabel(branches, s.destinationBranchId)}`,
        local: false,
        actionTo: `/branch/manifests/new?destination=${s.destinationBranchId}`,
        shipments: [],
      }
      bin.shipments.push(s)
      byDestination.set(s.destinationBranchId, bin)
    }
    const list = [...byDestination.values()].sort((a, b) => b.shipments.length - a.shipments.length)
    if (hub.lastMile.length > 0) {
      list.unshift({
        id: 'local',
        title: 'Local delivery',
        subtitle: `Last-mile in ${branch?.city ?? 'this city'}`,
        local: true,
        actionTo: '/branch/outgoing?tab=last-mile',
        shipments: hub.lastMile,
      })
    }
    return list
  }, [hub.linehaul, hub.lastMile, branches, branch])

  const allIds = useMemo(() => bins.flatMap((b) => b.shipments.map((s) => s.id)), [bins])
  const sortedCount = allIds.filter((id) => sorted.has(id)).length
  const unsortedCount = allIds.length - sortedCount

  const visibleBins = bins
    .map((bin) => ({ bin, visible: bin.shipments.filter((s) => view === 'all' || (view === 'sorted') === sorted.has(s.id)) }))
    .filter(({ visible }) => view === 'all' || visible.length > 0)

  return (
    <>
      <PageHeader
        title="Parcel Sorting"
        description="Inventory grouped into sort bins by destination. Tick parcels as they are placed in their bin."
        actions={
          <>
            <Button
              variant="secondary"
              disabled={sortedCount === 0}
              onClick={() => {
                setMany(allIds, false)
                toast.success('Sorting progress reset')
              }}
            >
              Reset all
            </Button>
            <Button
              disabled={unsortedCount === 0}
              onClick={() => {
                setMany(allIds, true)
                toast.success(`${unsortedCount} parcel${unsortedCount === 1 ? '' : 's'} marked as sorted`)
              }}
            >
              <CheckCheck /> Mark all sorted
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="To sort" value={unsortedCount} icon={PackageOpen} tone="orange" hint="Not yet in a bin" loading={loading} />
        <StatsCard label="Sorted" value={sortedCount} icon={CheckCheck} tone="green" hint="Placed in their bin" loading={loading} />
        <StatsCard label="Sort bins" value={bins.length} icon={Shuffle} tone="blue" hint="Destinations with parcels" loading={loading} />
        <StatsCard label="At hub" value={hub.inventory.length} icon={Boxes} tone="indigo" hint="Includes failed deliveries" loading={loading} to="/branch/inventory" />
      </div>

      <div className="mt-6 inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-xs" role="group" aria-label="Filter parcels by sorting state">
        {VIEWS.map((v) => (
          <button
            key={v.value}
            type="button"
            aria-pressed={view === v.value}
            onClick={() => setView(v.value)}
            className={cn('rounded-md px-3 py-1.5 text-sm font-semibold transition-colors', view === v.value ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
          >
            {v.label}
            <span className="tabular ml-1.5 font-normal opacity-80">{v.value === 'all' ? allIds.length : v.value === 'sorted' ? sortedCount : unsortedCount}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <CardSkeleton key={i} lines={5} />
            ))}
          </div>
        ) : bins.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-card">
            <EmptyState
              icon={Shuffle}
              title="Nothing to sort"
              description="Parcels received at this hub will appear in sort bins by destination."
              action={
                <Button asChild>
                  <Link to="/branch/incoming">View incoming shipments</Link>
                </Button>
              }
            />
          </div>
        ) : visibleBins.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-card">
            <EmptyState
              icon={CheckCheck}
              title={view === 'unsorted' ? 'Everything is sorted' : 'No parcels sorted yet'}
              description={view === 'unsorted' ? 'All parcels at the hub have been placed in their bins.' : 'Tick parcels as you place them in their bin.'}
              action={
                <Button variant="secondary" onClick={() => setView('all')}>
                  Show all parcels
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleBins.map(({ bin, visible }) => (
              <SortBin key={bin.id} bin={bin} visible={visible} sorted={sorted} onToggle={setMany} onOpen={(s) => setOpenId(s.id)} />
            ))}
          </div>
        )}
      </div>

      <ShipmentDrawer shipment={hub.all?.find((s) => s.id === openId)} onClose={() => setOpenId(undefined)} />
    </>
  )
}
