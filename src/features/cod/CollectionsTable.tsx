import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { CodStatusBadge } from '@/components/shared/StatusBadge'
import { Card } from '@/components/ui/card'
import { CITIES } from '@/data/cities'
import type { Customer, Driver, Shipment } from '@/types'
import { formatDateTime, formatPKR } from '@/utils/format'
import { codCollections } from './codCalc'

interface Props {
  shipments: Shipment[] | undefined
  customers: Map<string, Customer>
  drivers: Map<string, Driver>
  loading: boolean
}

/** Delivered COD shipments with settlement state, filterable by status and city. */
export function CollectionsTable({ shipments, customers, drivers, loading }: Props) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')

  const rows = useMemo(
    () => (shipments ? codCollections(shipments).filter((s) => (!status || s.codStatus === status) && (!city || s.receiver.city === city)) : undefined),
    [shipments, status, city],
  )

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      {
        accessorKey: 'trackingNumber',
        header: 'Tracking no.',
        cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
      },
      { id: 'customer', header: 'Customer', accessorFn: (s) => customers.get(s.customerId)?.name ?? '—' },
      { id: 'city', header: 'Delivered in', accessorFn: (s) => s.receiver.city },
      { id: 'driver', header: 'Collected by', accessorFn: (s) => (s.driverId ? (drivers.get(s.driverId)?.name ?? '—') : '—') },
      { accessorKey: 'deliveredAt', header: 'Delivered', cell: ({ row }) => (row.original.deliveredAt ? formatDateTime(row.original.deliveredAt) : '—') },
      { accessorKey: 'codAmount', header: 'COD amount', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.codAmount)}</span> },
      { accessorKey: 'codStatus', header: 'COD status', cell: ({ row }) => <CodStatusBadge status={row.original.codStatus} /> },
    ],
    [customers, drivers],
  )

  return (
    <Card>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., customer, driver…" />
        <FilterSelect
          label="COD statuses"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'collected', label: 'Collected, not settled' },
            { value: 'settled', label: 'Settled' },
          ]}
        />
        <FilterSelect label="Cities" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        globalFilter={search}
        onRowClick={(s) => navigate(`/admin/shipments/${s.id}`)}
        emptyTitle="No COD collections"
        emptyDescription="Delivered cash-on-delivery shipments will be listed here."
      />
    </Card>
  )
}
