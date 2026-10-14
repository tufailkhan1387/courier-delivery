import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, CheckCircle2, PackageX, Percent, Star } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { DetailList } from '@/components/shared/DetailDrawer'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RadioCard, RadioGroup } from '@/components/ui/controls'
import { Avatar } from '@/components/ui/misc'
import { useQuery } from '@/hooks/useQuery'
import { driverService, shipmentService } from '@/services'
import type { DriverAvailability, Shipment } from '@/types'
import { formatDate, formatPKR, titleCase } from '@/utils/format'
import { BarsChart } from '../components/charts/BarsChart'
import { ChartCard } from '../components/charts/ChartCard'
import { CHART_COLORS } from '../components/charts/chartTheme'
import { RecordNotFound } from '../components/RecordNotFound'
import { useBranches, useLookup } from '../hooks'
import { buildSeries, failedAt, formatRate, isCodReceived, successRate, sumBy } from '../lib/analytics'

const AVAILABILITY: { value: DriverAvailability; label: string; hint: string }[] = [
  { value: 'available', label: 'Available', hint: 'Ready for new assignments' },
  { value: 'on_route', label: 'On route', hint: 'Out on pickups or deliveries' },
  { value: 'off_duty', label: 'Off duty', hint: 'Not taking assignments' },
]

const columns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: 'trackingNumber',
    header: 'Tracking no.',
    cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
  },
  {
    id: 'task',
    header: 'Task',
    accessorFn: (s) => (s.status === 'booked' ? 'Pickup' : 'Delivery'),
    cell: ({ getValue }) => <Badge tone={getValue() === 'Pickup' ? 'indigo' : 'orange'}>{String(getValue())}</Badge>,
  },
  {
    id: 'contact',
    header: 'Contact',
    accessorFn: (s) => (s.status === 'booked' ? s.sender.name : s.receiver.name),
    cell: ({ row }) => {
      const party = row.original.status === 'booked' ? row.original.sender : row.original.receiver
      return (
        <div>
          <p className="font-medium text-gray-900">{party.name}</p>
          <p className="max-w-64 truncate text-xs text-gray-500">{party.address}</p>
        </div>
      )
    },
  },
  {
    accessorKey: 'codAmount',
    header: 'COD',
    meta: { align: 'right' },
    cell: ({ row }) => <span className="tabular">{row.original.codAmount > 0 ? formatPKR(row.original.codAmount) : '—'}</span>,
  },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export default function DriverDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: driver, loading } = useQuery(() => driverService.getById(id), [id])
  const { data: shipments, loading: shipmentsLoading } = useQuery(() => shipmentService.listByDriver(id), [id])
  const branches = useLookup(useBranches().data)

  const assigned = useMemo(() => shipments?.filter((s) => s.status === 'out_for_delivery' || s.status === 'booked'), [shipments])
  const stats = useMemo(() => {
    const list = shipments ?? []
    const delivered = list.filter((s) => s.status === 'delivered')
    const failed = list.filter((s) => failedAt(s)).length
    return { delivered: delivered.length, failed, rate: successRate(delivered.length, failed), cod: sumBy(delivered.filter(isCodReceived), (s) => s.codAmount) }
  }, [shipments])
  const series = useMemo(() => buildSeries(shipments ?? [], 14), [shipments])

  if (loading && !driver) return <PageSkeleton />
  if (!driver) return <RecordNotFound entity="Driver" backTo="/admin/drivers" backLabel="Back to drivers" />

  const branch = branches.get(driver.branchId)
  const setAvailability = async (value: string) => {
    const next = AVAILABILITY.find((a) => a.value === value)
    if (!next || next.value === driver.availability) return
    try {
      await driverService.update(driver.id, { availability: next.value })
      toast.success(`${driver.name} is now ${next.label.toLowerCase()}`)
    } catch {
      toast.error('Could not update availability. Please try again.')
    }
  }
  const recentDelivered = sumBy(series, (p) => p.delivered)
  const recentFailed = sumBy(series, (p) => p.failed)

  return (
    <>
      <PageHeader
        backTo="/admin/drivers"
        backLabel="Drivers"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {driver.name}
            <StateBadge value={driver.availability} />
          </span>
        }
        description={`${titleCase(driver.vehicleType)} driver · ${branch?.name ?? 'Unassigned branch'}`}
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="green" hint="All time" loading={shipmentsLoading} />
        <StatsCard label="Failed attempts" value={stats.failed} icon={PackageX} tone="red" hint="All time" loading={shipmentsLoading} />
        <StatsCard label="Success rate" value={formatRate(stats.rate)} icon={Percent} tone="blue" hint="Delivered vs failed" loading={shipmentsLoading} className="col-span-2 sm:col-span-1" />
        <StatsCard label="COD collected" value={formatPKR(stats.cod)} icon={Banknote} tone="purple" hint="On delivered parcels" loading={shipmentsLoading} className="col-span-2 sm:col-span-1" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar name={driver.name} size="xl" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-gray-900">{driver.name}</p>
                  <p className="tabular mt-0.5 inline-flex items-center gap-1 text-sm text-gray-600">
                    <Star className="size-4 fill-orange-400 text-orange-400" aria-hidden />
                    {driver.rating.toFixed(1)} rating
                  </p>
                </div>
              </div>
              <DetailList
                className="mt-6"
                items={[
                  { label: 'Phone', value: driver.phone },
                  { label: 'Joined', value: formatDate(driver.joinedAt) },
                  { label: 'Vehicle', value: titleCase(driver.vehicleType) },
                  { label: 'Plate', value: <span className="font-mono">{driver.vehiclePlate}</span> },
                  {
                    label: 'Branch',
                    value: branch ? (
                      <Link to={`/admin/branches/${branch.id}`} className="text-brand-700 hover:underline">
                        {branch.name}
                      </Link>
                    ) : (
                      '—'
                    ),
                  },
                  { label: 'Email', value: <span className="break-all">{driver.email}</span> },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Availability" description="Controls whether dispatchers see this driver as assignable" />
            <CardContent>
              <RadioGroup value={driver.availability} onValueChange={setAvailability} aria-label="Availability" className="space-y-2.5">
                {AVAILABILITY.map((a) => (
                  <RadioCard key={a.value} value={a.value} className="p-3 pr-10">
                    <span className="block text-sm font-semibold text-gray-900">{a.label}</span>
                    <span className="block text-xs text-gray-500">{a.hint}</span>
                  </RadioCard>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <ChartCard
            title="Delivery performance"
            description="Delivered vs failed attempts per day, last 14 days"
            height={260}
            loading={shipmentsLoading}
            empty={recentDelivered + recentFailed === 0}
            emptyText="No delivery attempts by this driver in the last 14 days."
            summary={`In the last 14 days this driver completed ${recentDelivered} deliveries and had ${recentFailed} failed attempts.`}
          >
            <BarsChart
              data={series}
              xKey="label"
              stacked
              series={[
                { key: 'delivered', label: 'Delivered', color: CHART_COLORS.success },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.error },
              ]}
            />
          </ChartCard>

          <Card>
            <CardHeader title="Assigned now" description="Current deliveries and pickups on this driver’s run sheet" className="pb-4" />
            <DataTable
              columns={columns}
              data={assigned}
              loading={shipmentsLoading}
              pageSize={6}
              onRowClick={(s) => navigate(`/admin/shipments/${s.id}`)}
              emptyTitle="Nothing assigned"
              emptyDescription="This driver has no open deliveries or pickups."
            />
          </Card>
        </div>
      </div>
    </>
  )
}
