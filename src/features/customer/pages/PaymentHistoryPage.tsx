import type { ColumnDef } from '@tanstack/react-table'
import { Clock, ReceiptText, RotateCcw, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PAYMENT_LABEL } from '@/features/shipments/meta'
import type { Payment, PaymentMethod } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { InvoiceDrawer } from '../components/payments/InvoiceDrawer'
import { PAYMENT_STATUS_LABEL } from '../components/payments/meta'
import { useCurrentCustomer, useMyPayments, useMyShipments, usePricingData } from '../hooks'

const columns: ColumnDef<Payment, unknown>[] = [
  {
    accessorKey: 'reference',
    header: 'Invoice',
    cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.reference}</span>,
  },
  {
    accessorKey: 'trackingNumber',
    header: 'Tracking no.',
    cell: ({ row }) => <span className="font-mono text-sm">{row.original.trackingNumber}</span>,
  },
  { accessorKey: 'date', header: 'Date', cell: ({ row }) => formatDate(row.original.date) },
  { id: 'method', header: 'Method', accessorFn: (p) => PAYMENT_LABEL[p.method] },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { align: 'right' },
    cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.amount)}</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StateBadge value={row.original.status} label={PAYMENT_STATUS_LABEL[row.original.status]} />,
  },
]

const STATUS_OPTIONS = (Object.keys(PAYMENT_STATUS_LABEL) as Payment['status'][]).map((value) => ({ value, label: PAYMENT_STATUS_LABEL[value] }))
const METHOD_OPTIONS = (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((value) => ({ value, label: PAYMENT_LABEL[value] }))

const sumOf = (list: Payment[], status: Payment['status']) => list.filter((p) => p.status === status).reduce((total, p) => total + p.amount, 0)

export default function PaymentHistoryPage() {
  const { data: payments, loading } = useMyPayments()
  const { data: shipments } = useMyShipments()
  const { data: customer } = useCurrentCustomer()
  const { data: pricing } = usePricingData()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stats = useMemo(() => {
    const list = payments ?? []
    return {
      paid: sumOf(list, 'paid'),
      pending: sumOf(list, 'pending'),
      pendingCount: list.filter((p) => p.status === 'pending').length,
      refunded: sumOf(list, 'refunded'),
      count: list.length,
    }
  }, [payments])

  const filtered = useMemo(() => {
    if (!payments) return undefined
    const needle = search.trim().toLowerCase()
    return payments
      .filter((p) => (!status || p.status === status) && (!method || p.method === method) && (!needle || p.reference.toLowerCase().includes(needle) || p.trackingNumber.toLowerCase().includes(needle)))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [payments, search, status, method])

  const selected = payments?.find((p) => p.id === selectedId)
  const selectedShipment = selected && shipments?.find((s) => s.id === selected.shipmentId)
  const hasFilters = !!(search || status || method)
  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setMethod('')
  }

  return (
    <>
      <PageHeader title="Payment History" description="Invoices for your shipping charges. All amounts are demo data — no real payments are processed." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard label="Total Spent" value={formatPKR(stats.paid)} icon={Wallet} tone="green" hint="Paid invoices" loading={loading} />
        <StatsCard
          label="Pending COD Charges"
          value={formatPKR(stats.pending)}
          icon={Clock}
          tone="orange"
          hint={`${stats.pendingCount} awaiting delivery`}
          loading={loading}
        />
        <StatsCard label="Refunded" value={formatPKR(stats.refunded)} icon={RotateCcw} tone="purple" hint="Returned to you" loading={loading} />
        <StatsCard label="Invoices" value={stats.count} icon={ReceiptText} tone="blue" hint="All time" loading={loading} />
      </div>

      <Card className="mt-6">
        <FilterBar
          actions={
            hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search invoice or tracking no." />
          <FilterSelect label="Statuses" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <FilterSelect label="Methods" value={method} onChange={setMethod} options={METHOD_OPTIONS} className="sm:w-52" />
        </FilterBar>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          onRowClick={(p) => setSelectedId(p.id)}
          emptyTitle={hasFilters ? 'No payments match your filters' : 'No payments yet'}
          emptyDescription={hasFilters ? 'Try a different search term, status or method.' : 'An invoice is created each time you book a shipment.'}
          emptyAction={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      </Card>

      <InvoiceDrawer payment={selected} shipment={selectedShipment || undefined} customer={customer} pricing={pricing} onClose={() => setSelectedId(null)} />
    </>
  )
}
