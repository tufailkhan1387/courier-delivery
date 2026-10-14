import type { ColumnDef } from '@tanstack/react-table'
import { subDays } from 'date-fns'
import { PackagePlus, PackageSearch } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { ShipmentCard } from '@/components/shared/ShipmentCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { ALL_STATUSES, MOVING_STATUSES, SERVICE_META, STATUS_META } from '@/features/shipments/meta'
import type { Shipment, ShipmentStatus } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { ShipmentDrawer } from '../components/shipments/ShipmentDrawer'
import { useMyShipments } from '../hooks'

const columns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: 'trackingNumber',
    header: 'Tracking no.',
    cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
  },
  {
    id: 'receiver',
    header: 'Receiver',
    accessorFn: (s) => s.receiver.name,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-900">{row.original.receiver.name}</p>
        <p className="text-xs text-gray-500">{row.original.receiver.phone}</p>
      </div>
    ),
  },
  { id: 'route', header: 'Route', accessorFn: (s) => `${s.sender.city} → ${s.receiver.city}` },
  { id: 'service', header: 'Service', accessorFn: (s) => SERVICE_META[s.service].label },
  { accessorKey: 'createdAt', header: 'Booked', cell: ({ row }) => formatDate(row.original.createdAt) },
  {
    accessorKey: 'shippingCost',
    header: 'Cost',
    meta: { align: 'right' },
    cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.shippingCost)}</span>,
  },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

const STATUS_OPTIONS = [{ value: 'moving', label: 'In transit (all stages)' }, ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]

const RANGE_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

const MOBILE_PAGE = 8

function matchesStatus(status: ShipmentStatus, filter: string) {
  if (!filter) return true
  if (filter === 'moving') return MOVING_STATUSES.includes(status)
  return status === filter
}

export default function MyShipmentsPage() {
  const { data: shipments, loading } = useMyShipments()
  const [params, setParams] = useSearchParams()
  const rawStatus = params.get('status') ?? ''
  const statusFilter = STATUS_OPTIONS.some((o) => o.value === rawStatus) ? rawStatus : ''

  const [search, setSearch] = useState('')
  const [range, setRange] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mobileCount, setMobileCount] = useState(MOBILE_PAGE)
  // Reference point for the "last N days" presets, fixed for the lifetime of the page.
  const [today] = useState(() => new Date())

  const setStatusFilter = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value)
    else next.delete('status')
    setParams(next, { replace: true })
  }

  const filtered = useMemo(() => {
    if (!shipments) return undefined
    const needle = search.trim().toLowerCase()
    let start: Date | undefined
    let end: Date | undefined
    if (range === 'custom') {
      if (from) start = new Date(`${from}T00:00:00`)
      if (to) end = new Date(`${to}T23:59:59.999`)
    } else if (range) {
      start = subDays(today, Number(range))
    }
    return shipments
      .filter((s) => {
        if (!matchesStatus(s.status, statusFilter)) return false
        const booked = new Date(s.createdAt)
        if (start && booked < start) return false
        if (end && booked > end) return false
        if (!needle) return true
        return [s.trackingNumber, s.receiver.name, s.receiver.city, s.sender.city].some((v) => v.toLowerCase().includes(needle))
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [shipments, search, statusFilter, range, from, to, today])

  const selected = shipments?.find((s) => s.id === selectedId)
  const hasFilters = !!(search || statusFilter || range)
  const clearFilters = () => {
    setSearch('')
    setRange('')
    setFrom('')
    setTo('')
    setStatusFilter('')
  }

  const emptyTitle = hasFilters ? 'No shipments match your filters' : 'No shipments yet'
  const emptyDescription = hasFilters ? 'Try a different search term, status or date range.' : 'Book your first shipment to see it here.'
  const emptyAction = hasFilters ? (
    <Button variant="secondary" onClick={clearFilters}>
      Clear filters
    </Button>
  ) : (
    <Button asChild>
      <Link to="/customer/book">Book Shipment</Link>
    </Button>
  )

  return (
    <>
      <PageHeader
        title="My Shipments"
        description="Search, filter and manage every parcel you have booked."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/customer/track">
                <PackageSearch /> Track
              </Link>
            </Button>
            <Button asChild>
              <Link to="/customer/book">
                <PackagePlus /> Book Shipment
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <FilterBar
          actions={
            hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver or city" />
          <FilterSelect label="Statuses" value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} />
          <FilterSelect label="Booking date" allLabel="Any date" value={range} onChange={setRange} options={RANGE_OPTIONS} />
          {range === 'custom' && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input type="date" aria-label="Booked from" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="sm:w-40" />
              <span className="text-sm text-gray-500">to</span>
              <Input type="date" aria-label="Booked to" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="sm:w-40" />
            </div>
          )}
        </FilterBar>

        {/* Desktop / tablet: sortable table */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filtered}
            loading={loading}
            onRowClick={(s) => setSelectedId(s.id)}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
            emptyAction={emptyAction}
          />
        </div>

        {/* Mobile: card list */}
        <div className="border-t border-gray-200 p-4 md:hidden">
          {!filtered ? (
            <div className="space-y-3" aria-busy="true" aria-label="Loading shipments">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} className="py-8" />
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">
                {filtered.length} shipment{filtered.length === 1 ? '' : 's'}
              </p>
              <ul className="space-y-3">
                {filtered.slice(0, mobileCount).map((s) => (
                  <li key={s.id}>
                    <ShipmentCard
                      shipment={s}
                      onClick={() => setSelectedId(s.id)}
                      footer={<span className="text-xs text-gray-500">Booked {formatDate(s.createdAt)}</span>}
                    />
                  </li>
                ))}
              </ul>
              {filtered.length > mobileCount && (
                <Button variant="secondary" className="mt-4 w-full" onClick={() => setMobileCount((c) => c + MOBILE_PAGE)}>
                  Show more ({filtered.length - mobileCount} remaining)
                </Button>
              )}
            </>
          )}
        </div>
      </Card>

      <ShipmentDrawer shipment={selected} onClose={() => setSelectedId(null)} />
    </>
  )
}
