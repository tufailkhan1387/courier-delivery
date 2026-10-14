import { Banknote, BarChart3, Building2, CalendarPlus, CheckCircle2, Clock, Package, PackageX, Tags, Truck, Waypoints, type LucideIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { isToday } from 'date-fns'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CITIES } from '@/data/cities'
import { ALL_STATUSES, STATUS_META } from '@/features/shipments/meta'
import type { ShipmentStatus } from '@/types'
import { formatCompact, formatNumber, formatPKR } from '@/utils/format'
import { ActivityFeed } from '../components/ActivityFeed'
import { BarsChart } from '../components/charts/BarsChart'
import { ChartCard } from '../components/charts/ChartCard'
import { CHART_COLORS } from '../components/charts/chartTheme'
import { DonutChart } from '../components/charts/DonutChart'
import { TrendChart } from '../components/charts/TrendChart'
import { useShipments } from '../hooks'
import { buildSeries, isCodOutstanding, isInTransit, sumBy } from '../lib/analytics'

const STATUS_COLOR: Record<ShipmentStatus, string> = {
  booked: CHART_COLORS.gray,
  picked_up: '#6366f1',
  at_origin_hub: '#a5b4fc',
  in_transit: CHART_COLORS.brand,
  at_destination_hub: CHART_COLORS.purple,
  out_for_delivery: CHART_COLORS.warning,
  delivered: CHART_COLORS.success,
  failed: CHART_COLORS.error,
  returned: '#fda29b',
  cancelled: '#d0d5dd',
}

const QUICK_ACTIONS: { label: string; to: string; icon: LucideIcon }[] = [
  { label: 'Manage shipments', to: '/admin/shipments', icon: Package },
  { label: 'Add branch', to: '/admin/branches?new=1', icon: Building2 },
  { label: 'Rate cards', to: '/admin/pricing', icon: Tags },
  { label: 'COD reconciliation', to: '/admin/finance?tab=settlements', icon: Banknote },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
]

export default function DashboardPage() {
  const { data: shipments, loading } = useShipments()

  const stats = useMemo(() => {
    const list = shipments ?? []
    const count = (status: ShipmentStatus) => list.filter((s) => s.status === status).length
    return {
      total: list.length,
      today: list.filter((s) => isToday(new Date(s.createdAt))).length,
      pickups: count('booked'),
      inTransit: list.filter(isInTransit).length,
      outForDelivery: count('out_for_delivery'),
      delivered: count('delivered'),
      failed: count('failed'),
      codPending: sumBy(list.filter(isCodOutstanding), (s) => s.codAmount),
    }
  }, [shipments])

  const series = useMemo(() => buildSeries(shipments ?? [], 14), [shipments])
  const byCity = useMemo(
    () => CITIES.map((city) => ({ city, shipments: (shipments ?? []).filter((s) => s.receiver.city === city).length })).sort((a, b) => b.shipments - a.shipments),
    [shipments],
  )
  const distribution = useMemo(
    () => ALL_STATUSES.map((status) => ({ name: STATUS_META[status].label, value: (shipments ?? []).filter((s) => s.status === status).length, color: STATUS_COLOR[status] })),
    [shipments],
  )

  const booked14 = sumBy(series, (p) => p.booked)
  const delivered14 = sumBy(series, (p) => p.delivered)
  const isEmpty = !loading && stats.total === 0

  return (
    <>
      <PageHeader
        title="Network overview"
        description="Live picture of bookings, parcel movement and cash on delivery across all branches."
        actions={
          <Button asChild>
            <Link to="/admin/shipments">
              <Package /> Manage shipments
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Total shipments" value={formatNumber(stats.total)} icon={Package} tone="blue" hint="All time" loading={loading} to="/admin/shipments" />
        <StatsCard label="Today’s bookings" value={stats.today} icon={CalendarPlus} tone="indigo" hint="Booked since midnight" loading={loading} to="/admin/shipments" />
        <StatsCard label="Pickups pending" value={stats.pickups} icon={Clock} tone="gray" hint="Booked, awaiting pickup" loading={loading} to="/admin/shipments?status=booked" />
        <StatsCard label="In transit" value={stats.inTransit} icon={Waypoints} tone="blue" hint="Picked up to destination hub" loading={loading} to="/admin/shipments?status=moving" />
        <StatsCard label="Out for delivery" value={stats.outForDelivery} icon={Truck} tone="orange" hint="With riders now" loading={loading} to="/admin/shipments?status=out_for_delivery" />
        <StatsCard label="Delivered" value={formatNumber(stats.delivered)} icon={CheckCircle2} tone="green" hint="Completed" loading={loading} to="/admin/shipments?status=delivered" />
        <StatsCard label="Failed deliveries" value={stats.failed} icon={PackageX} tone="red" hint="Need a reattempt or return" loading={loading} to="/admin/shipments?status=failed" />
        <StatsCard label="COD pending" value={`Rs ${formatCompact(stats.codPending)}`} icon={Banknote} tone="purple" hint="To collect or settle" loading={loading} to="/admin/finance" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Quick actions" className="pb-0" />
        <CardContent className="flex flex-wrap gap-3">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
            <Button key={to} variant="secondary" asChild className="flex-1 basis-40 sm:flex-none sm:basis-auto">
              <Link to={to}>
                <Icon /> {label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Shipment performance"
          description="Bookings vs deliveries per day, last 14 days"
          height={300}
          loading={loading}
          empty={isEmpty}
          summary={`Over the last 14 days ${booked14} shipments were booked and ${delivered14} were delivered.`}
        >
          <TrendChart
            data={series}
            xKey="label"
            series={[
              { key: 'booked', label: 'Booked', color: CHART_COLORS.brand },
              { key: 'delivered', label: 'Delivered', color: CHART_COLORS.success, type: 'line' },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Status distribution"
          description="All shipments by current status"
          loading={loading}
          empty={isEmpty}
          summary={`Shipments by status: ${distribution.map((d) => `${d.name} ${d.value}`).join(', ')}.`}
        >
          <DonutChart data={distribution} totalLabel="Shipments" />
        </ChartCard>

        <ChartCard
          className="xl:col-span-2"
          title="Shipments by city"
          description="Volume by destination city, all time"
          height={300}
          loading={loading}
          empty={isEmpty}
          summary={`Shipments by destination city: ${byCity.map((c) => `${c.city} ${c.shipments}`).join(', ')}.`}
        >
          <BarsChart data={byCity} xKey="city" series={[{ key: 'shipments', label: 'Shipments', color: CHART_COLORS.brand }]} />
        </ChartCard>

        <ActivityFeed shipments={shipments} loading={loading} />
      </div>

      <p className="mt-6 text-xs text-gray-500">
        Demo data only. COD pending totals {formatPKR(stats.codPending)} across shipments awaiting collection or settlement.
      </p>
    </>
  )
}
