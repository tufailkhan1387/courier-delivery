import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, CheckCircle2, Package, ShieldCheck, ShieldOff, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DetailList } from '@/components/shared/DetailDrawer'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/misc'
import { SERVICE_META } from '@/features/shipments/meta'
import { useQuery } from '@/hooks/useQuery'
import { customerService, shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { RecordNotFound } from '../components/RecordNotFound'
import { sumBy } from '../lib/analytics'

const columns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: 'trackingNumber',
    header: 'Tracking no.',
    cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
  },
  { id: 'route', header: 'Route', accessorFn: (s) => `${s.sender.city} to ${s.receiver.city}` },
  { id: 'receiver', header: 'Receiver', accessorFn: (s) => s.receiver.name },
  { id: 'service', header: 'Service', accessorFn: (s) => SERVICE_META[s.service].label },
  { accessorKey: 'shippingCost', header: 'Shipping', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{formatPKR(row.original.shippingCost)}</span> },
  {
    accessorKey: 'codAmount',
    header: 'COD',
    meta: { align: 'right' },
    cell: ({ row }) => <span className="tabular">{row.original.codAmount > 0 ? formatPKR(row.original.codAmount) : '—'}</span>,
  },
  { accessorKey: 'createdAt', header: 'Booked', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export default function CustomerDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: customer, loading } = useQuery(() => customerService.getById(id), [id])
  const { data: shipments, loading: shipmentsLoading } = useQuery(() => shipmentService.listByCustomer(id), [id])
  const [confirmOpen, setConfirmOpen] = useState(false)

  const stats = useMemo(() => {
    const list = shipments ?? []
    return {
      total: list.length,
      delivered: list.filter((s) => s.status === 'delivered').length,
      codVolume: sumBy(list, (s) => s.codAmount),
      spend: sumBy(list.filter((s) => s.status !== 'cancelled'), (s) => s.shippingCost),
    }
  }, [shipments])

  if (loading && !customer) return <PageSkeleton />
  if (!customer) return <RecordNotFound entity="Customer" backTo="/admin/customers" backLabel="Back to customers" />

  const suspended = customer.status === 'suspended'
  const toggleStatus = async () => {
    await customerService.update(customer.id, { status: suspended ? 'active' : 'suspended' })
    toast.success(suspended ? `${customer.name} reactivated` : `${customer.name} suspended`)
  }

  return (
    <>
      <PageHeader
        backTo="/admin/customers"
        backLabel="Customers"
        title={customer.name}
        description={customer.company ?? 'Personal account'}
        actions={
          <Button variant={suspended ? 'secondary' : 'destructive-outline'} onClick={() => setConfirmOpen(true)}>
            {suspended ? <ShieldCheck /> : <ShieldOff />}
            {suspended ? 'Activate account' : 'Suspend account'}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar name={customer.name} size="xl" />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-gray-900">{customer.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StateBadge value={customer.status} />
                  <span className="text-sm text-gray-500">{customer.accountType === 'business' ? 'Business account' : 'Individual account'}</span>
                </div>
              </div>
            </div>
            <DetailList
              className="mt-6"
              columns={1}
              items={[
                { label: 'Email', value: customer.email },
                { label: 'Phone', value: customer.phone },
                { label: 'Address', value: `${customer.address}, ${customer.city}` },
                { label: 'Customer since', value: formatDate(customer.joinedAt) },
              ]}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 content-start gap-4 xl:col-span-2">
          <StatsCard label="Shipments" value={stats.total} icon={Package} tone="blue" hint="All time" loading={shipmentsLoading} />
          <StatsCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="green" hint="Completed deliveries" loading={shipmentsLoading} />
          <StatsCard label="COD volume" value={formatPKR(stats.codVolume)} icon={Banknote} tone="purple" hint="Declared on bookings" loading={shipmentsLoading} className="col-span-2 sm:col-span-1" />
          <StatsCard label="Total spend" value={formatPKR(stats.spend)} icon={Wallet} tone="orange" hint="Shipping charges" loading={shipmentsLoading} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Shipment history" description="All shipments booked by this customer" className="pb-4" />
        <DataTable
          columns={columns}
          data={shipments}
          loading={shipmentsLoading}
          pageSize={8}
          initialSorting={[{ id: 'createdAt', desc: true }]}
          onRowClick={(s) => navigate(`/admin/shipments/${s.id}`)}
          emptyTitle="No shipments yet"
          emptyDescription="This customer has not booked a shipment."
        />
      </Card>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={suspended ? 'Activate this account?' : 'Suspend this account?'}
        description={
          suspended
            ? `${customer.name} will be marked active again.`
            : `${customer.name} will be marked suspended. In this demo the flag is stored only — existing shipments are not affected and no notification is sent.`
        }
        confirmLabel={suspended ? 'Activate' : 'Suspend'}
        destructive={!suspended}
        onConfirm={toggleStatus}
      />
    </>
  )
}
