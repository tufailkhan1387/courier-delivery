import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardList, FileEdit, Plus, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Manifest } from '@/types'
import { formatFriendlyDateTime } from '@/utils/format'
import { useBranches, useDriverMap, useHubShipments, useManifests } from '../hooks'
import { branchLabel, formatKg, manifestShipments, totalsOf } from '../lib'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'received', label: 'Received' },
]

interface Row {
  manifest: Manifest
  destination: string
  driver: string
  parcels: number
  weightKg: number
}

const columns: ColumnDef<Row, unknown>[] = [
  {
    id: 'number',
    header: 'Manifest no.',
    accessorFn: (r) => r.manifest.number,
    cell: ({ row }) => (
      <div>
        <p className="font-mono text-sm font-semibold text-gray-900">{row.original.manifest.number}</p>
        <p className="text-xs text-gray-500">Seal {row.original.manifest.sealNumber}</p>
      </div>
    ),
  },
  { accessorKey: 'destination', header: 'Destination', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.destination}</span> },
  { id: 'status', header: 'Status', accessorFn: (r) => r.manifest.status, cell: ({ row }) => <StateBadge value={row.original.manifest.status} /> },
  { accessorKey: 'parcels', header: 'Parcels', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.parcels}</span> },
  { accessorKey: 'weightKg', header: 'Weight', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{formatKg(row.original.weightKg)}</span> },
  {
    id: 'vehicle',
    header: 'Vehicle / driver',
    accessorFn: (r) => `${r.manifest.vehiclePlate} ${r.driver}`,
    cell: ({ row }) => (
      <div>
        <p className="font-mono text-sm text-gray-900">{row.original.manifest.vehiclePlate || '—'}</p>
        <p className="text-xs text-gray-500">{row.original.driver}</p>
      </div>
    ),
  },
  { id: 'created', header: 'Created', accessorFn: (r) => r.manifest.createdAt, cell: ({ row }) => formatFriendlyDateTime(row.original.manifest.createdAt) },
  {
    id: 'dispatched',
    header: 'Dispatched',
    accessorFn: (r) => (r.manifest.status === 'draft' ? '' : (r.manifest.dispatchedAt ?? '')),
    cell: ({ row }) => {
      const m = row.original.manifest
      return m.status !== 'draft' && m.dispatchedAt ? formatFriendlyDateTime(m.dispatchedAt) : <span className="text-gray-400">—</span>
    },
  },
]

export default function ManifestsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const [search, setSearch] = useState('')
  const { map: branches } = useBranches()
  const drivers = useDriverMap()
  const hub = useHubShipments()
  const manifests = useManifests()

  const rows = useMemo<Row[] | undefined>(() => {
    if (!manifests.outbound || !hub.all) return undefined
    const shipments = hub.all
    return manifests.outbound
      .filter((m) => !status || m.status === status)
      .map((manifest) => {
        const totals = totalsOf(manifestShipments(manifest, shipments))
        return {
          manifest,
          destination: branchLabel(branches, manifest.destinationBranchId),
          driver: (manifest.driverId && drivers.get(manifest.driverId)?.name) || 'Unassigned',
          parcels: manifest.shipmentIds.length,
          weightKg: totals.weightKg,
        }
      })
      .sort((a, b) => b.manifest.createdAt.localeCompare(a.manifest.createdAt))
  }, [manifests.outbound, hub.all, status, branches, drivers])

  const count = (value: string) => manifests.outbound?.filter((m) => m.status === value).length ?? 0
  const loading = manifests.loading && !manifests.data
  const createButton = (
    <Button asChild>
      <Link to="/branch/manifests/new">
        <Plus /> Create manifest
      </Link>
    </Button>
  )

  return (
    <>
      <PageHeader title="Manifests" description="Linehaul manifests originating from this hub." actions={createButton} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard label="Drafts" value={count('draft')} icon={FileEdit} tone="gray" hint="Being loaded" loading={loading} />
        <StatsCard label="Dispatched" value={count('dispatched')} icon={Truck} tone="blue" hint="On the road" loading={loading} />
        <StatsCard label="Received" value={count('received')} icon={ClipboardList} tone="green" hint="Confirmed at destination" loading={loading} className="col-span-2 lg:col-span-1" />
      </div>

      <Card className="mt-6">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search manifest no., destination, vehicle…" />
          <FilterSelect label="Statuses" value={status} onChange={(value) => setParams(value ? { status: value } : {}, { replace: true })} options={STATUS_OPTIONS} />
        </FilterBar>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading || hub.loading}
          globalFilter={search}
          onRowClick={(r) => navigate(`/branch/manifests/${r.manifest.id}`)}
          emptyTitle={manifests.outbound?.length ? 'No manifests match your filters' : 'No manifests yet'}
          emptyDescription={manifests.outbound?.length ? 'Try a different status or search term.' : 'Create a manifest to load parcels for linehaul.'}
          emptyAction={manifests.outbound?.length ? undefined : createButton}
        />
      </Card>
    </>
  )
}
