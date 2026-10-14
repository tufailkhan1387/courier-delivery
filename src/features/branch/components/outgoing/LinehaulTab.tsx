import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardList, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import type { Manifest, Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { branchLabel, formatKg, matchesSearch, totalsOf, type BranchMap } from '../../lib'
import { ageColumn, codColumn, parcelColumn, receiverColumn, trackingColumn } from '../columns'

const MANIFEST_OPTIONS = [
  { value: 'open', label: 'Not on a manifest' },
  { value: 'loaded', label: 'On a draft manifest' },
]

interface LinehaulTabProps {
  shipments: Shipment[]
  manifests: Manifest[] | undefined
  branches: BranchMap
  loading: boolean
  onOpen: (shipment: Shipment) => void
}

/** Parcels waiting for linehaul to other cities, grouped by destination facility. */
export function LinehaulTab({ shipments, manifests, branches, loading, onOpen }: LinehaulTabProps) {
  const [search, setSearch] = useState('')
  const [destination, setDestination] = useState('')
  const [manifestState, setManifestState] = useState('')

  const manifestById = useMemo(() => new Map((manifests ?? []).map((m) => [m.id, m])), [manifests])
  const groups = useMemo(() => {
    const map = new Map<string, Shipment[]>()
    for (const s of shipments) map.set(s.destinationBranchId, [...(map.get(s.destinationBranchId) ?? []), s])
    return [...map.entries()]
      .map(([branchId, items]) => ({ branchId, items, totals: totalsOf(items), unassigned: items.filter((s) => !s.manifestId).length }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [shipments])

  const rows = useMemo(
    () =>
      shipments.filter(
        (s) => matchesSearch(s, search) && (!destination || s.destinationBranchId === destination) && (!manifestState || (manifestState === 'open' ? !s.manifestId : Boolean(s.manifestId))),
      ),
    [shipments, search, destination, manifestState],
  )

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      trackingColumn,
      {
        id: 'destination',
        header: 'Destination',
        accessorFn: (s) => branchLabel(branches, s.destinationBranchId),
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.receiver.city}</p>
            <p className="text-xs text-gray-500">{branchLabel(branches, row.original.destinationBranchId)}</p>
          </div>
        ),
      },
      receiverColumn,
      parcelColumn,
      codColumn,
      ageColumn,
      {
        id: 'manifest',
        header: 'Manifest',
        accessorFn: (s) => (s.manifestId ? (manifestById.get(s.manifestId)?.number ?? '') : ''),
        cell: ({ row }) => {
          const manifest = row.original.manifestId ? manifestById.get(row.original.manifestId) : undefined
          return manifest ? (
            <Link to={`/branch/manifests/${manifest.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-sm font-medium text-brand-700 hover:underline">
              {manifest.number}
            </Link>
          ) : (
            <Badge tone="orange">Not manifested</Badge>
          )
        },
      },
    ],
    [branches, manifestById],
  )

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? null : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {groups.map((group) => {
            const active = destination === group.branchId
            return (
              <div key={group.branchId} className={cn('rounded-xl border bg-white p-4 shadow-card', active ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200')}>
                <button type="button" onClick={() => setDestination(active ? '' : group.branchId)} aria-pressed={active} className="block w-full rounded-md text-left">
                  <p className="truncate text-sm font-semibold text-gray-900">{branchLabel(branches, group.branchId)}</p>
                  <p className="tabular mt-1 text-2xl font-semibold text-gray-900">{group.items.length}</p>
                  <p className="tabular text-xs text-gray-500">
                    {formatKg(group.totals.weightKg)} · {group.unassigned} not manifested
                  </p>
                </button>
                <Button variant="soft" size="sm" className="mt-3 w-full" asChild>
                  <Link to={`/branch/manifests/new?destination=${group.branchId}`}>
                    <Plus /> Create manifest
                  </Link>
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Card>
        <FilterBar
          actions={
            <Button asChild>
              <Link to={destination ? `/branch/manifests/new?destination=${destination}` : '/branch/manifests/new'}>
                <ClipboardList /> Create manifest
              </Link>
            </Button>
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver, city…" />
          <FilterSelect label="Destinations" value={destination} onChange={setDestination} options={groups.map((g) => ({ value: g.branchId, label: branchLabel(branches, g.branchId) }))} />
          <FilterSelect label="Manifest states" value={manifestState} onChange={setManifestState} options={MANIFEST_OPTIONS} />
        </FilterBar>
        {!loading && shipments.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No parcels awaiting linehaul" description="Parcels received at this hub for other cities will queue up here." />
        ) : (
          <DataTable columns={columns} data={loading ? undefined : rows} loading={loading} onRowClick={onOpen} emptyTitle="No parcels match your filters" />
        )}
      </Card>
    </div>
  )
}
