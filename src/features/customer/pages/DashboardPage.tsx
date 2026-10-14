import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, CheckCircle2, Clock, Package, PackagePlus, PackageSearch, Truck } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { TONE_DOT } from '@/components/ui/badge'
import { MOVING_STATUSES, SERVICE_META, STATUS_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { formatDate, timeAgo } from '@/utils/format'
import { useCurrentCustomer, useMyShipments } from '../hooks'

const columns: ColumnDef<Shipment, unknown>[] = [
  {
    accessorKey: 'trackingNumber',
    header: 'Tracking no.',
    cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.trackingNumber}</span>,
  },
  {
    id: 'receiver',
    header: 'Receiver',
    accessorFn: (s) => s.receiver.name,
    cell: ({ row }) => (
      <div>
        <p className="font-medium text-gray-900">{row.original.receiver.name}</p>
        <p className="text-xs text-gray-500">{row.original.receiver.city}</p>
      </div>
    ),
  },
  { id: 'service', header: 'Service', accessorFn: (s) => SERVICE_META[s.service].label },
  { accessorKey: 'createdAt', header: 'Booked', cell: ({ row }) => formatDate(row.original.createdAt) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

function TrackShortcut() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const tracking = value.trim().toUpperCase()
    navigate(tracking ? `/customer/track/${tracking}` : '/customer/track')
  }
  return (
    <Card className="overflow-hidden">
      <div className="bg-brand-600 px-5 py-5 text-white">
        <div className="flex items-center gap-2.5">
          <PackageSearch className="size-5" aria-hidden />
          <h3 className="text-base font-semibold text-white">Track a shipment</h3>
        </div>
        <p className="mt-1 text-sm text-brand-100">Enter a tracking number to see where your parcel is.</p>
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. CPLHE48201937"
            aria-label="Tracking number"
            className="border-transparent font-mono uppercase placeholder:normal-case placeholder:font-sans focus:ring-white/30"
          />
          <Button type="submit" variant="secondary" className="border-transparent">
            Track
          </Button>
        </form>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data: customer } = useCurrentCustomer()
  const { data: shipments, loading } = useMyShipments()

  const stats = useMemo(() => {
    const list = shipments ?? []
    return {
      total: list.length,
      inTransit: list.filter((s) => MOVING_STATUSES.includes(s.status)).length,
      delivered: list.filter((s) => s.status === 'delivered').length,
      pending: list.filter((s) => s.status === 'booked').length,
    }
  }, [shipments])

  const recent = useMemo(() => shipments?.slice(0, 6), [shipments])

  // Latest tracking events across all of the customer's shipments
  const activity = useMemo(
    () =>
      (shipments ?? [])
        .flatMap((s) => s.events.map((e) => ({ ...e, trackingNumber: s.trackingNumber })))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 6),
    [shipments],
  )

  const firstName = customer?.name.split(' ')[0]

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Welcome back'}
        description="Here’s what’s happening with your shipments today."
        actions={
          <Button asChild>
            <Link to="/customer/book">
              <PackagePlus /> Book Shipment
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Total Shipments" value={stats.total} icon={Package} tone="blue" hint="All time" loading={loading} to="/customer/shipments" />
        <StatsCard label="In Transit" value={stats.inTransit} icon={Truck} tone="indigo" hint="On the way" loading={loading} to="/customer/shipments?status=moving" />
        <StatsCard label="Delivered" value={stats.delivered} icon={CheckCircle2} tone="green" hint="Completed" loading={loading} to="/customer/shipments?status=delivered" />
        <StatsCard label="Pending" value={stats.pending} icon={Clock} tone="orange" hint="Awaiting pickup" loading={loading} to="/customer/shipments?status=booked" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Recent Shipments"
            description="Your latest bookings and their current status"
            className="pb-4"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/customer/shipments">
                  View all <ArrowRight />
                </Link>
              </Button>
            }
          />
          <DataTable
            columns={columns}
            data={recent}
            loading={loading}
            hidePagination
            onRowClick={(s) => navigate(`/customer/track/${s.trackingNumber}`)}
            emptyTitle="No shipments yet"
            emptyDescription="Book your first shipment to see it here."
            emptyAction={
              <Button asChild>
                <Link to="/customer/book">Book Shipment</Link>
              </Button>
            }
          />
        </Card>

        <div className="space-y-6">
          <TrackShortcut />

          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent>
              {loading && !shipments ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <p className="text-sm text-gray-500">Tracking updates will appear here once you book a shipment.</p>
              ) : (
                <ul className="space-y-4">
                  {activity.map((event) => (
                    <li key={event.id} className="flex gap-3">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE_DOT[STATUS_META[event.status].tone]}`} aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="truncate text-xs text-gray-500">
                          <Link to={`/customer/track/${event.trackingNumber}`} className="font-mono hover:text-brand-700 hover:underline">
                            {event.trackingNumber}
                          </Link>{' '}
                          · {event.location}
                        </p>
                      </div>
                      <time dateTime={event.timestamp} className="shrink-0 text-xs text-gray-400">
                        {timeAgo(event.timestamp)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
