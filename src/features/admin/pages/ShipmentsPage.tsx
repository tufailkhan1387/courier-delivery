import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, Download, RotateCcw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { CodStatusBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CITIES } from '@/data/cities'
import { ALL_STATUSES, PAYMENT_LABEL, SERVICE_META, STATUS_META } from '@/features/shipments/meta'
import type { PaymentMethod, ServiceType, Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { useBranches, useCustomers, useDrivers, useLookup, useShipments } from '../hooks'
import { isInTransit } from '../lib/analytics'
import { downloadCsv } from '../lib/csv'

const CITY_OPTIONS = CITIES.map((c) => ({ value: c, label: c }))
const STATUS_OPTIONS = [{ value: 'moving', label: 'In transit (all stages)' }, ...ALL_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }))]
const SERVICE_OPTIONS = (Object.keys(SERVICE_META) as ServiceType[]).map((s) => ({ value: s, label: SERVICE_META[s].label }))
const PAYMENT_OPTIONS = (Object.keys(PAYMENT_LABEL) as PaymentMethod[]).map((p) => ({ value: p, label: PAYMENT_LABEL[p] }))

export default function ShipmentsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const [search, setSearch] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [service, setService] = useState('')
  const [payment, setPayment] = useState('')

  const { data: shipments, loading } = useShipments()
  const customers = useLookup(useCustomers().data)
  const branches = useLookup(useBranches().data)
  const drivers = useLookup(useDrivers().data)

  const setStatus = (value: string) => setParams(value ? { status: value } : {}, { replace: true })
  const hasFilters = !!(status || search || origin || destination || service || payment)
  const reset = () => {
    setSearch('')
    setOrigin('')
    setDestination('')
    setService('')
    setPayment('')
    setStatus('')
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return shipments?.filter(
        (s) =>
          (!needle ||
            [s.trackingNumber, customers.get(s.customerId)?.name ?? '', s.sender.name, s.receiver.name, s.sender.city, s.receiver.city].some((v) => v.toLowerCase().includes(needle))) &&
          (!status || (status === 'moving' ? isInTransit(s) : s.status === status)) &&
          (!origin || s.sender.city === origin) &&
          (!destination || s.receiver.city === destination) &&
          (!service || s.service === service) &&
          (!payment || s.paymentMethod === payment),
      )
  }, [shipments, customers, search, status, origin, destination, service, payment])

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      {
        accessorKey: 'trackingNumber',
        header: 'Tracking no.',
        cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
      },
      {
        id: 'customer',
        header: 'Customer / sender',
        accessorFn: (s) => `${customers.get(s.customerId)?.name ?? ''} ${s.sender.name} ${s.receiver.name}`,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{customers.get(row.original.customerId)?.name ?? row.original.sender.name}</p>
            <p className="text-xs text-gray-500">Sender: {row.original.sender.name}</p>
          </div>
        ),
      },
      {
        id: 'route',
        header: 'Route',
        accessorFn: (s) => `${s.sender.city} ${s.receiver.city}`,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-gray-900">
            {row.original.sender.city}
            <ArrowRight className="size-3.5 text-gray-400" aria-label="to" />
            {row.original.receiver.city}
          </span>
        ),
      },
      { id: 'service', header: 'Service', accessorFn: (s) => SERVICE_META[s.service].label },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      { id: 'branch', header: 'Current branch', accessorFn: (s) => branches.get(s.currentBranchId)?.name ?? '—' },
      {
        id: 'driver',
        header: 'Driver',
        accessorFn: (s) => (s.driverId ? (drivers.get(s.driverId)?.name ?? '—') : 'Unassigned'),
        cell: ({ getValue, row }) => <span className={row.original.driverId ? undefined : 'text-gray-400'}>{String(getValue())}</span>,
      },
      {
        accessorKey: 'codAmount',
        header: 'COD',
        meta: { align: 'right' },
        cell: ({ row }) =>
          row.original.codAmount > 0 ? (
            <div className="flex flex-col items-end gap-1">
              <span className="tabular font-medium text-gray-900">{formatPKR(row.original.codAmount)}</span>
              <CodStatusBadge status={row.original.codStatus} />
            </div>
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      { accessorKey: 'createdAt', header: 'Booked', cell: ({ row }) => formatDate(row.original.createdAt) },
    ],
    [customers, branches, drivers],
  )

  const exportCsv = () => {
    const rows = filtered ?? []
    downloadCsv(
      'shipments.csv',
      ['Tracking no.', 'Customer', 'Sender', 'Receiver', 'Origin', 'Destination', 'Service', 'Status', 'Current branch', 'Driver', 'Payment', 'COD amount', 'COD status', 'Booked'],
      rows.map((s) => [
        s.trackingNumber,
        customers.get(s.customerId)?.name ?? '',
        s.sender.name,
        s.receiver.name,
        s.sender.city,
        s.receiver.city,
        SERVICE_META[s.service].label,
        STATUS_META[s.status].label,
        branches.get(s.currentBranchId)?.name ?? '',
        s.driverId ? (drivers.get(s.driverId)?.name ?? '') : '',
        PAYMENT_LABEL[s.paymentMethod],
        s.codAmount,
        s.codStatus,
        formatDate(s.createdAt),
      ]),
    )
    toast.success(`Exported ${rows.length} shipments to CSV`)
  }

  return (
    <>
      <PageHeader
        title="Shipments"
        description="Every shipment across the network. Open one to update its status or assign a driver."
        actions={
          <Button variant="secondary" onClick={exportCsv} disabled={!filtered?.length}>
            <Download /> Export CSV
          </Button>
        }
      />

      <Card>
        <FilterBar
          actions={
            hasFilters && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw /> Reset filters
              </Button>
            )
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., customer, city…" />
          <FilterSelect label="Statuses" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
          <FilterSelect label="Origin city" value={origin} onChange={setOrigin} options={CITY_OPTIONS} allLabel="Any origin" />
          <FilterSelect label="Destination city" value={destination} onChange={setDestination} options={CITY_OPTIONS} allLabel="Any destination" />
          <FilterSelect label="Services" value={service} onChange={setService} options={SERVICE_OPTIONS} />
          <FilterSelect label="Payment types" value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} />
        </FilterBar>
        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          pageSize={12}
          initialSorting={[{ id: 'createdAt', desc: true }]}
          onRowClick={(s) => navigate(`/admin/shipments/${s.id}`)}
          emptyTitle="No shipments match"
          emptyDescription="Try a different search term or clear the filters."
          emptyAction={
            hasFilters ? (
              <Button variant="secondary" onClick={reset}>
                Reset filters
              </Button>
            ) : undefined
          }
        />
      </Card>
    </>
  )
}
