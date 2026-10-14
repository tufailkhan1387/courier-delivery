import type { ColumnDef } from '@tanstack/react-table'
import { subDays } from 'date-fns'
import { ArrowDownToLine, CheckCircle2, Percent, Send, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DataTable } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Card, CardHeader } from '@/components/ui/card'
import { Avatar } from '@/components/ui/misc'
import { STATUS_META } from '@/features/shipments/meta'
import type { ShipmentStatus } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR, titleCase } from '@/utils/format'
import { ChartCard } from '../components/ChartCard'
import { CHART } from '../components/chartTheme'
import { BRANCH_ID, useBranch, useBranches, useDriverMap, useHubShipments } from '../hooks'
import { branchCity } from '../lib'
import { dailyThroughput, riderPerformance, sumFlow, type RiderStat } from '../reports'

const RANGES = [7, 30] as const

const STATUS_COLOR: Partial<Record<ShipmentStatus, string>> = {
  booked: CHART.gray,
  picked_up: '#a5b4fc',
  at_origin_hub: '#6366f1',
  in_transit: CHART.brand,
  at_destination_hub: '#a855f7',
  out_for_delivery: CHART.warning,
  delivered: CHART.success,
  failed: CHART.error,
  returned: '#b42318',
  cancelled: '#d0d5dd',
}

const riderColumns: ColumnDef<RiderStat, unknown>[] = [
  {
    id: 'rider',
    header: 'Rider',
    accessorFn: (r) => r.driver.name,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.driver.name} size="sm" />
        <div>
          <p className="font-medium text-gray-900">{row.original.driver.name}</p>
          <p className="text-xs text-gray-500">
            {titleCase(row.original.driver.vehicleType)} · <span className="font-mono">{row.original.driver.vehiclePlate}</span>
          </p>
        </div>
      </div>
    ),
  },
  { id: 'availability', header: 'Status', accessorFn: (r) => r.driver.availability, cell: ({ row }) => <StateBadge value={row.original.driver.availability} /> },
  { accessorKey: 'delivered', header: 'Delivered', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{row.original.delivered}</span> },
  { accessorKey: 'failed', header: 'Failed', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.failed}</span> },
  { accessorKey: 'onBoard', header: 'On board now', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.onBoard}</span> },
  {
    id: 'successRate',
    header: 'Success rate',
    meta: { align: 'right' },
    accessorFn: (r) => r.successRate ?? -1,
    cell: ({ row }) => {
      const rate = row.original.successRate
      if (rate === null) return <span className="text-gray-400">No attempts</span>
      return <span className={cn('tabular font-semibold', rate >= 85 ? 'text-emerald-600' : rate >= 60 ? 'text-orange-600' : 'text-red-600')}>{rate.toFixed(0)}%</span>
    },
  },
  { accessorKey: 'codCollected', header: 'COD collected', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{formatPKR(row.original.codCollected)}</span> },
  { id: 'rating', header: 'Rating', meta: { align: 'right' }, accessorFn: (r) => r.driver.rating, cell: ({ row }) => <span className="tabular">{row.original.driver.rating.toFixed(1)}</span> },
]

export default function ReportsPage() {
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const drivers = useDriverMap()
  const hub = useHubShipments()
  const [days, setDays] = useState<(typeof RANGES)[number]>(7)
  // Captured once so the report period stays stable across re-renders.
  const [now] = useState(() => new Date())
  const loading = hub.loading && !hub.all

  const report = useMemo(() => {
    const all = hub.all ?? []
    const since = subDays(now, days)
    const daily = dailyThroughput(all, BRANCH_ID, days, now)
    const flow = sumFlow(daily)
    const attempts = flow.delivered + flow.failed

    // Status mix of shipments touching this hub that had activity in the period.
    const active = hub.related.filter((s) => s.events.some((e) => new Date(e.timestamp) >= since))
    const mix = new Map<ShipmentStatus, number>()
    for (const s of active) mix.set(s.status, (mix.get(s.status) ?? 0) + 1)
    const statusMix = [...mix.entries()].map(([status, value]) => ({ status, name: STATUS_META[status].label, value })).sort((a, b) => b.value - a.value)

    // Outbound lanes: parcels this hub sent on linehaul in the period, by destination city.
    const lanes = new Map<string, number>()
    for (const s of all) {
      if (s.originBranchId !== BRANCH_ID || s.destinationBranchId === BRANCH_ID) continue
      if (!s.events.some((e) => e.status === 'in_transit' && new Date(e.timestamp) >= since)) continue
      const city = branchCity(branches, s.destinationBranchId)
      lanes.set(city, (lanes.get(city) ?? 0) + 1)
    }
    const topLanes = [...lanes.entries()].map(([city, parcels]) => ({ city, parcels })).sort((a, b) => b.parcels - a.parcels).slice(0, 6)

    // Riders based here, plus any other rider who attempted deliveries for this hub in the period.
    const riders = riderPerformance(all, [...drivers.values()], BRANCH_ID, since).filter((r) => r.driver.branchId === BRANCH_ID || r.delivered + r.failed + r.onBoard > 0)

    return { daily, flow, successRate: attempts ? (flow.delivered / attempts) * 100 : null, statusMix, topLanes, riders }
  }, [hub.all, hub.related, days, branches, drivers, now])

  return (
    <>
      <PageHeader
        title="Branch Reports"
        description={`Throughput and delivery performance for ${branch?.name ?? 'this hub'}, derived from tracking events in the demo data.`}
        actions={
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1 shadow-xs" role="group" aria-label="Report period">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                aria-pressed={days === range}
                onClick={() => setDays(range)}
                className={cn('rounded-md px-3 py-1.5 text-sm font-semibold transition-colors', days === range ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
              >
                Last {range} days
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard label="Received" value={report.flow.received} icon={ArrowDownToLine} tone="blue" hint="Checked into the hub" loading={loading} />
        <StatsCard label="Dispatched" value={report.flow.dispatched} icon={Send} tone="indigo" hint="Linehaul + last-mile" loading={loading} />
        <StatsCard label="Delivered" value={report.flow.delivered} icon={CheckCircle2} tone="green" hint="By this hub's riders" loading={loading} />
        <StatsCard label="Failed attempts" value={report.flow.failed} icon={XCircle} tone="red" hint="Came back to the hub" loading={loading} />
        <StatsCard
          label="Delivery success"
          value={report.successRate === null ? '—' : `${report.successRate.toFixed(1)}%`}
          icon={Percent}
          tone="purple"
          hint="Delivered ÷ attempts"
          loading={loading}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Daily throughput"
          description={`Parcels handled per day, last ${days} days`}
          className="xl:col-span-2"
          loading={loading}
          empty={report.daily.every((d) => d.received + d.dispatched + d.delivered + d.failed === 0)}
          height={300}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={report.daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" tick={CHART.tick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tick={CHART.tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={CHART.tooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#667085' }} />
              <Line type="monotone" dataKey="received" name="Received" stroke={CHART.brand} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="dispatched" name="Dispatched" stroke={CHART.brandLight} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="delivered" name="Delivered" stroke={CHART.success} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="failed" name="Failed" stroke={CHART.error} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Status mix" description="Current status of parcels active in the period" loading={loading} empty={report.statusMix.length === 0} height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={report.statusMix} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="80%" paddingAngle={2} stroke="none">
                {report.statusMix.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? CHART.gray} />
                ))}
              </Pie>
              <Tooltip contentStyle={CHART.tooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#667085' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Top destination lanes"
          description="Parcels sent on linehaul from this hub"
          loading={loading}
          empty={report.topLanes.length === 0}
          emptyText="No linehaul dispatches from this hub in this period."
          height={280}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.topLanes} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" tick={CHART.tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="city" tick={CHART.tick} tickLine={false} axisLine={false} width={84} />
              <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={CHART.tooltip} />
              <Bar dataKey="parcels" name="Parcels" fill={CHART.brand} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card className="min-w-0 xl:col-span-2">
          <CardHeader title="Rider performance" description={`Last-mile results for this hub, last ${days} days`} className="pb-4" />
          <DataTable
            columns={riderColumns}
            data={loading || drivers.size === 0 ? undefined : report.riders}
            loading={loading || drivers.size === 0}
            pageSize={8}
            emptyTitle="No riders to report on"
            emptyDescription="Riders appear here once they are based at this hub or deliver for it."
          />
        </Card>
      </div>
    </>
  )
}
