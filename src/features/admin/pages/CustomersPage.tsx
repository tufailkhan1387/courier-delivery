import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Customer } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { PersonCell } from '../components/PersonCell'
import { useCustomers, useShipments } from '../hooks'

interface CustomerRow extends Customer {
  shipmentCount: number
  spend: number
}

const columns: ColumnDef<CustomerRow, unknown>[] = [
  {
    id: 'name',
    header: 'Customer',
    accessorFn: (c) => `${c.name} ${c.company ?? ''} ${c.email}`,
    cell: ({ row }) => <PersonCell name={row.original.name} sub={row.original.email} />,
  },
  {
    accessorKey: 'accountType',
    header: 'Account',
    cell: ({ row }) => <Badge tone={row.original.accountType === 'business' ? 'purple' : 'gray'}>{row.original.accountType === 'business' ? 'Business' : 'Individual'}</Badge>,
  },
  { accessorKey: 'city', header: 'City' },
  { accessorKey: 'phone', header: 'Phone', enableSorting: false, cell: ({ row }) => <span className="tabular">{row.original.phone}</span> },
  { accessorKey: 'shipmentCount', header: 'Shipments', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.shipmentCount}</span> },
  { accessorKey: 'spend', header: 'Total spend', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.spend)}</span> },
  { accessorKey: 'joinedAt', header: 'Joined', cell: ({ row }) => formatDate(row.original.joinedAt) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StateBadge value={row.original.status} /> },
]

export default function CustomersPage() {
  const navigate = useNavigate()
  const { data: customers, loading } = useCustomers()
  const { data: shipments } = useShipments()
  const [search, setSearch] = useState('')
  const [accountType, setAccountType] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo<CustomerRow[] | undefined>(() => {
    if (!customers) return undefined
    const totals = new Map<string, { count: number; spend: number }>()
    for (const s of shipments ?? []) {
      const t = totals.get(s.customerId) ?? { count: 0, spend: 0 }
      t.count++
      if (s.status !== 'cancelled') t.spend += s.shippingCost
      totals.set(s.customerId, t)
    }
    return customers
      .filter((c) => (!accountType || c.accountType === accountType) && (!status || c.status === status))
      .map((c) => ({ ...c, shipmentCount: totals.get(c.id)?.count ?? 0, spend: totals.get(c.id)?.spend ?? 0 }))
  }, [customers, shipments, accountType, status])

  return (
    <>
      <PageHeader title="Customers" description="Individual and business accounts that book shipments on the network." />
      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, company or email…" />
          <FilterSelect
            label="Account types"
            value={accountType}
            onChange={setAccountType}
            options={[
              { value: 'individual', label: 'Individual' },
              { value: 'business', label: 'Business' },
            ]}
          />
          <FilterSelect
            label="Statuses"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        </FilterBar>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          globalFilter={search}
          initialSorting={[{ id: 'shipmentCount', desc: true }]}
          onRowClick={(c) => navigate(`/admin/customers/${c.id}`)}
          emptyTitle="No customers match"
          emptyDescription="Try a different search term or clear the filters."
        />
      </Card>
    </>
  )
}
