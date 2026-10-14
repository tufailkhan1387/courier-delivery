import type { ColumnDef } from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { Tone } from '@/features/shipments/meta'
import { useQuery } from '@/hooks/useQuery'
import { codService } from '@/services'
import type { Branch, CodTransaction, Customer, Driver } from '@/types'
import { formatDateTime, formatPKR, titleCase } from '@/utils/format'

const TYPE_TONE: Record<CodTransaction['type'], Tone> = { collection: 'blue', deposit: 'purple', settlement: 'green' }
const TYPES = Object.keys(TYPE_TONE) as CodTransaction['type'][]

interface Props {
  customers: Map<string, Customer>
  drivers: Map<string, Driver>
  branches: Map<string, Branch>
}

/** COD ledger: collections, branch deposits and customer settlements. */
export function TransactionsTable({ customers, drivers, branches }: Props) {
  const { data: transactions, loading } = useQuery(() => codService.listTransactions(), [])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const rows = useMemo(() => transactions?.filter((t) => !type || t.type === type), [transactions, type])

  const columns = useMemo<ColumnDef<CodTransaction, unknown>[]>(
    () => [
      { accessorKey: 'reference', header: 'Reference', cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.reference}</span> },
      { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge tone={TYPE_TONE[row.original.type]}>{titleCase(row.original.type)}</Badge> },
      {
        id: 'party',
        header: 'Party',
        accessorFn: (t) =>
          (t.customerId && (customers.get(t.customerId)?.company ?? customers.get(t.customerId)?.name)) ||
          (t.driverId && drivers.get(t.driverId)?.name) ||
          (t.branchId && branches.get(t.branchId)?.name) ||
          '—',
      },
      { accessorKey: 'note', header: 'Note', enableSorting: false, cell: ({ row }) => <span className="block max-w-72 truncate">{row.original.note}</span> },
      { accessorKey: 'shipmentCount', header: 'Shipments', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.shipmentCount}</span> },
      { accessorKey: 'amount', header: 'Amount', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.amount)}</span> },
      { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDateTime(row.original.date) },
    ],
    [customers, drivers, branches],
  )

  return (
    <Card>
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search reference, party or note…" />
        <FilterSelect label="Types" value={type} onChange={setType} options={TYPES.map((t) => ({ value: t, label: titleCase(t) }))} />
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        globalFilter={search}
        initialSorting={[{ id: 'date', desc: true }]}
        emptyTitle="No transactions"
        emptyDescription="Ledger entries appear here as COD is collected, deposited and settled."
      />
    </Card>
  )
}
