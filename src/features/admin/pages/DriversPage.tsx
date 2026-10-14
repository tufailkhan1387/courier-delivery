import type { ColumnDef } from '@tanstack/react-table'
import { Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Card } from '@/components/ui/card'
import type { Driver, DriverAvailability } from '@/types'
import { titleCase } from '@/utils/format'
import { PersonCell } from '../components/PersonCell'
import { useBranches, useDrivers, useLookup, useShipments } from '../hooks'

interface DriverRow extends Driver {
  branchName: string
  deliveries: number
  pickups: number
}

const AVAILABILITY: DriverAvailability[] = ['available', 'on_route', 'off_duty']

const columns: ColumnDef<DriverRow, unknown>[] = [
  {
    id: 'name',
    header: 'Driver',
    accessorFn: (d) => `${d.name} ${d.phone}`,
    cell: ({ row }) => <PersonCell name={row.original.name} sub={row.original.phone} />,
  },
  { accessorKey: 'availability', header: 'Availability', cell: ({ row }) => <StateBadge value={row.original.availability} /> },
  {
    id: 'vehicle',
    header: 'Vehicle',
    accessorFn: (d) => `${d.vehicleType} ${d.vehiclePlate}`,
    cell: ({ row }) => (
      <div>
        <p className="text-gray-900">{titleCase(row.original.vehicleType)}</p>
        <p className="font-mono text-xs text-gray-500">{row.original.vehiclePlate}</p>
      </div>
    ),
  },
  { accessorKey: 'branchName', header: 'Branch' },
  {
    accessorKey: 'rating',
    header: 'Rating',
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="tabular inline-flex items-center gap-1 font-medium text-gray-900">
        <Star className="size-3.5 fill-orange-400 text-orange-400" aria-hidden />
        {row.original.rating.toFixed(1)}
      </span>
    ),
  },
  { accessorKey: 'deliveries', header: 'Deliveries assigned', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{row.original.deliveries}</span> },
  { accessorKey: 'pickups', header: 'Pickups assigned', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.pickups}</span> },
]

export default function DriversPage() {
  const navigate = useNavigate()
  const { data: drivers, loading } = useDrivers()
  const { data: branches } = useBranches()
  const { data: shipments } = useShipments()
  const branchById = useLookup(branches)
  const [search, setSearch] = useState('')
  const [branchId, setBranchId] = useState('')
  const [availability, setAvailability] = useState('')

  const rows = useMemo<DriverRow[] | undefined>(
    () =>
      drivers
        ?.filter((d) => (!branchId || d.branchId === branchId) && (!availability || d.availability === availability))
        .map((d) => {
          const mine = (shipments ?? []).filter((s) => s.driverId === d.id)
          return {
            ...d,
            branchName: branchById.get(d.branchId)?.name ?? '—',
            deliveries: mine.filter((s) => s.status === 'out_for_delivery').length,
            pickups: mine.filter((s) => s.status === 'booked').length,
          }
        }),
    [drivers, shipments, branchById, branchId, availability],
  )

  return (
    <>
      <PageHeader title="Drivers" description="Riders and linehaul drivers, their availability and current workload." />
      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone or plate…" />
          <FilterSelect label="Branches" value={branchId} onChange={setBranchId} options={(branches ?? []).map((b) => ({ value: b.id, label: b.name }))} className="sm:w-60" />
          <FilterSelect label="Availability" value={availability} onChange={setAvailability} options={AVAILABILITY.map((a) => ({ value: a, label: titleCase(a) }))} allLabel="Any availability" />
        </FilterBar>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          globalFilter={search}
          onRowClick={(d) => navigate(`/admin/drivers/${d.id}`)}
          emptyTitle="No drivers match"
          emptyDescription="Try a different search term or clear the filters."
        />
      </Card>
    </>
  )
}
