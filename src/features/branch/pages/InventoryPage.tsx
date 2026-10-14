import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, Boxes, Clock, Gauge, ScanLine } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { STATUS_META } from '@/features/shipments/meta'
import type { Shipment, ShipmentStatus } from '@/types'
import { cn } from '@/utils/cn'
import { formatNumber, formatPKR, percent } from '@/utils/format'
import { ageColumn, codColumn, parcelColumn, routeColumn, trackingColumn } from '../components/columns'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { useBranch, useBranches, useHubShipments } from '../hooks'
import { AGEING_THRESHOLD_HOURS, ageHours, matchesSearch, nextDestination, totalsOf } from '../lib'

const INVENTORY_STATUSES: ShipmentStatus[] = ['at_origin_hub', 'at_destination_hub', 'failed']
const STATUS_OPTIONS = INVENTORY_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))
const COD_OPTIONS = [
  { value: 'cod', label: 'COD' },
  { value: 'prepaid', label: 'Prepaid' },
]
const FRAGILE_OPTIONS = [
  { value: 'yes', label: 'Fragile' },
  { value: 'no', label: 'Not fragile' },
]
const AGE_OPTIONS = [
  { value: 'old', label: `Over ${AGEING_THRESHOLD_HOURS}h` },
  { value: 'fresh', label: `Under ${AGEING_THRESHOLD_HOURS}h` },
]

export default function InventoryPage() {
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const hub = useHubShipments()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [destination, setDestination] = useState('')
  const [cod, setCod] = useState('')
  const [fragile, setFragile] = useState('')
  const [age, setAge] = useState('')
  const [openId, setOpenId] = useState<string>()
  const loading = hub.loading && !hub.all

  const destinationOptions = useMemo(() => [...new Set(hub.inventory.map((s) => s.receiver.city))].sort().map((c) => ({ value: c, label: c })), [hub.inventory])
  const rows = useMemo(
    () =>
      hub.inventory.filter((s) => {
        const old = ageHours(s) > AGEING_THRESHOLD_HOURS
        return (
          matchesSearch(s, search) &&
          (!status || s.status === status) &&
          (!destination || s.receiver.city === destination) &&
          (!cod || (cod === 'cod') === s.codAmount > 0) &&
          (!fragile || (fragile === 'yes') === s.parcel.fragile) &&
          (!age || (age === 'old') === old)
        )
      }),
    [hub.inventory, search, status, destination, cod, fragile, age],
  )

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      trackingColumn,
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      routeColumn,
      { id: 'next', header: 'Next destination', accessorFn: (s) => nextDestination(s, branch, branches) },
      parcelColumn,
      codColumn,
      ageColumn,
    ],
    [branch, branches],
  )

  const totals = totalsOf(hub.inventory)
  const ageing = hub.inventory.filter((s) => ageHours(s) > AGEING_THRESHOLD_HOURS).length
  const capacity = branch?.dailyCapacity ?? 0
  const usage = capacity ? Math.min(100, (hub.inventory.length / capacity) * 100) : 0
  const filtersActive = Boolean(search || status || destination || cod || fragile || age)
  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setDestination('')
    setCod('')
    setFragile('')
    setAge('')
  }

  return (
    <>
      <PageHeader
        title="Branch Inventory"
        description="Every parcel physically at this hub, with how long it has been waiting."
        actions={
          <Button asChild>
            <Link to="/branch/scan">
              <ScanLine /> Scan parcel
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Parcels at hub" value={hub.inventory.length} icon={Boxes} tone="indigo" hint={`${totals.fragile} fragile`} loading={loading} />
        <StatsCard label={`Ageing over ${AGEING_THRESHOLD_HOURS}h`} value={ageing} icon={Clock} tone={ageing > 0 ? 'red' : 'green'} hint={ageing > 0 ? 'Needs attention' : 'Nothing overdue'} loading={loading} />
        <StatsCard label="COD value held" value={formatPKR(totals.cod)} icon={Banknote} tone="orange" hint="To collect on delivery" loading={loading} />
        <StatsCard label="Capacity used" value={percent(hub.inventory.length, capacity)} icon={Gauge} tone="blue" hint={capacity ? `of ${formatNumber(capacity)} parcels / day` : undefined} loading={loading || !branch} />
      </div>

      <Card className="mt-6">
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="font-semibold text-gray-900">Capacity usage</p>
            {loading || !branch ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <p className="tabular text-gray-500">
                {formatNumber(hub.inventory.length)} of {formatNumber(capacity)} daily capacity
              </p>
            )}
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Capacity usage" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(usage)}>
            <div className={cn('h-full rounded-full transition-[width]', usage > 85 ? 'bg-red-500' : usage > 60 ? 'bg-orange-500' : 'bg-brand-600')} style={{ width: `${Math.max(usage, hub.inventory.length ? 1 : 0)}%` }} />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <FilterBar
          actions={
            filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver, city…" />
          <FilterSelect label="Statuses" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <FilterSelect label="Destinations" value={destination} onChange={setDestination} options={destinationOptions} />
          <FilterSelect label="Payment types" value={cod} onChange={setCod} options={COD_OPTIONS} className="sm:w-40" />
          <FilterSelect label="Handling" value={fragile} onChange={setFragile} options={FRAGILE_OPTIONS} allLabel="All handling" className="sm:w-40" />
          <FilterSelect label="Ages" value={age} onChange={setAge} options={AGE_OPTIONS} className="sm:w-36" />
        </FilterBar>
        <DataTable
          columns={columns}
          data={loading ? undefined : rows}
          loading={hub.loading}
          pageSize={15}
          initialSorting={[{ id: 'age', desc: true }]}
          onRowClick={(s) => setOpenId(s.id)}
          emptyTitle={hub.inventory.length === 0 ? 'The hub floor is empty' : 'No parcels match your filters'}
          emptyDescription={hub.inventory.length === 0 ? 'Received parcels will be listed here.' : 'Try clearing the search or filters.'}
          emptyAction={
            filtersActive ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      </Card>

      <ShipmentDrawer shipment={hub.all?.find((s) => s.id === openId)} onClose={() => setOpenId(undefined)} />
    </>
  )
}
