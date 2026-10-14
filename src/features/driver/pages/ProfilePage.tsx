import { format, isSameDay, subDays } from 'date-fns'
import { Building2, CheckCircle2, History, Info, PackageX, Percent, Phone, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { DetailList } from '@/components/shared/DetailDrawer'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, Skeleton } from '@/components/ui/misc'
import type { Shipment } from '@/types'
import { formatDate, formatFriendlyDateTime, formatPKR, percent, titleCase } from '@/utils/format'
import { useCurrentDriver, useMyBranch, useMyTasks } from '../hooks'
import { closedAt, taskGroup } from '../tasks'

// Illustrative rates for the mock earnings card — not a real pay structure.
const RATE_PER_DELIVERY = 120
const RATE_PER_PICKUP = 60
const COD_INCENTIVE = 25
const HISTORY_PAGE = 5

function DeliveriesChart({ delivered }: { delivered: Shipment[] }) {
  const [today] = useState(() => new Date())
  const data = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(today, 6 - i)
      return {
        day: i === 6 ? 'Today' : format(day, 'EEE'),
        date: format(day, 'EEE, d MMM'),
        count: delivered.filter((s) => isSameDay(new Date(closedAt(s)), day)).length,
      }
    })
  }, [delivered, today])
  const total = data.reduce((t, d) => t + d.count, 0)

  return (
    <figure>
      <figcaption className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-gray-900">Deliveries per day</span>
        <span className="tabular text-xs text-gray-500">{total} in the last 7 days</span>
      </figcaption>
      <div className="h-40" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--color-gray-200)" />
            <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: 'var(--color-gray-300)' }} tick={{ fontSize: 12, fill: 'var(--color-gray-500)' }} />
            <YAxis allowDecimals={false} width={24} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--color-gray-500)' }} />
            <Tooltip
              cursor={{ fill: 'var(--color-gray-100)' }}
              formatter={(value) => [String(value), 'Delivered']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ''}
              contentStyle={{ borderRadius: 8, border: '1px solid var(--color-gray-200)', boxShadow: 'var(--shadow-pop)', fontSize: 12, padding: '6px 10px' }}
              labelStyle={{ color: 'var(--color-gray-900)', fontWeight: 600 }}
              itemStyle={{ color: 'var(--color-gray-600)' }}
            />
            <Bar dataKey="count" name="Delivered" fill="var(--color-brand-600)" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Deliveries completed per day over the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Delivered</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}

export default function ProfilePage() {
  const { data: driver, loading: driverLoading } = useCurrentDriver()
  const { data: branch, loading: branchLoading } = useMyBranch()
  const { data: tasks, loading } = useMyTasks()
  const [historyCount, setHistoryCount] = useState(HISTORY_PAGE)

  const stats = useMemo(() => {
    const list = tasks ?? []
    const delivered = list.filter((s) => s.status === 'delivered')
    const failed = list.filter((s) => s.status === 'failed')
    const pickupsDone = list.filter((s) => taskGroup(s) === 'completed' && s.status !== 'delivered')
    const codDelivered = delivered.filter((s) => s.codAmount > 0)
    const history = [...delivered, ...failed].sort((a, b) => closedAt(b).localeCompare(closedAt(a)))
    return { delivered, failed, pickupsDone, codDelivered, history }
  }, [tasks])

  const earnings = [
    { label: 'Deliveries completed', detail: `${stats.delivered.length} × ${formatPKR(RATE_PER_DELIVERY)}`, amount: stats.delivered.length * RATE_PER_DELIVERY },
    { label: 'Pickups collected', detail: `${stats.pickupsDone.length} × ${formatPKR(RATE_PER_PICKUP)}`, amount: stats.pickupsDone.length * RATE_PER_PICKUP },
    { label: 'COD handling incentive', detail: `${stats.codDelivered.length} × ${formatPKR(COD_INCENTIVE)}`, amount: stats.codDelivered.length * COD_INCENTIVE },
  ]
  const earningsTotal = earnings.reduce((t, e) => t + e.amount, 0)
  const attempted = stats.delivered.length + stats.failed.length

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Profile</h1>

      {driverLoading && !driver ? (
        <CardSkeleton lines={5} />
      ) : driver ? (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar name={driver.name} size="xl" />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-900">{driver.name}</h2>
                <p className="text-sm text-gray-500">Delivery rider</p>
                <div className="mt-1.5">
                  <StateBadge value={driver.availability} />
                </div>
              </div>
            </div>
            <DetailList
              className="mt-5 border-t border-gray-100 pt-4"
              items={[
                { label: 'Phone', value: <span className="tabular">{driver.phone}</span> },
                { label: 'Rider ID', value: <span className="font-mono">{driver.id}</span> },
                { label: 'Vehicle', value: titleCase(driver.vehicleType) },
                { label: 'Plate no.', value: <span className="font-mono">{driver.vehiclePlate}</span> },
                { label: 'Joined', value: formatDate(driver.joinedAt) },
                { label: 'Rating', value: `${driver.rating.toFixed(1)} / 5` },
              ]}
            />
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
              <p className="mt-1 break-all text-sm font-medium text-gray-900">{driver.email}</p>
            </div>
            <p className="mt-4 text-xs text-gray-500">Change your availability from the Home tab. Other details are managed by your branch.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <EmptyState title="Profile unavailable" description="The demo rider record could not be found." className="py-10" />
        </Card>
      )}

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Building2 className="size-5 text-brand-600" aria-hidden /> Assigned branch
            </span>
          }
          className="px-4 pt-4"
        />
        <CardContent className="p-4">
          {branchLoading && !branch ? (
            <Skeleton className="h-20" />
          ) : branch ? (
            <>
              <p className="text-base font-semibold text-gray-900">
                {branch.name} <span className="ml-1 font-mono text-xs font-medium text-gray-500">{branch.code}</span>
              </p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                {branch.address}, {branch.city}
              </p>
              <p className="mt-1 text-sm text-gray-600">Manager: {branch.managerName}</p>
              <Button variant="secondary" size="lg" className="mt-4 w-full" asChild>
                <a href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`}>
                  <Phone /> <span className="tabular">{branch.phone}</span>
                </a>
              </Button>
              <p className="mt-2 text-xs text-gray-500">Fictional demo number — opens your device dialler only.</p>
            </>
          ) : (
            <p className="text-sm text-gray-500">No branch is assigned to this rider.</p>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="performance-heading" className="space-y-3">
        <h2 id="performance-heading" className="text-base font-semibold text-gray-900">
          Performance summary
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatsCard label="Delivered" value={stats.delivered.length} icon={CheckCircle2} tone="green" hint="Completed" loading={loading} className="p-4" />
          <StatsCard label="Success rate" value={percent(stats.delivered.length, attempted, 0)} icon={Percent} tone="blue" hint={`${attempted} closed`} loading={loading} className="p-4" />
          <StatsCard label="Rating" value={driver ? driver.rating.toFixed(1) : '–'} icon={Star} tone="orange" hint="Out of 5" loading={driverLoading && !driver} className="p-4" />
          <StatsCard label="Failed" value={stats.failed.length} icon={PackageX} tone="red" hint="Open attempts" loading={loading} className="p-4" />
        </div>
        <Card>
          <CardContent className="p-4">{loading ? <Skeleton className="h-48" /> : <DeliveriesChart delivered={stats.delivered} />}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader title="Earnings estimate" description="Based on tasks in the demo data" className="px-4 pt-4" />
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-32" />
          ) : (
            <>
              <dl className="divide-y divide-gray-100">
                {earnings.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                    <dt className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">{row.label}</span>
                      <span className="tabular block text-xs text-gray-500">{row.detail}</span>
                    </dt>
                    <dd className="tabular shrink-0 text-sm font-semibold text-gray-900">{formatPKR(row.amount)}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3 pt-3">
                  <dt className="text-sm font-semibold text-gray-900">Estimated total</dt>
                  <dd className="tabular text-xl font-semibold text-gray-900">{formatPKR(earningsTotal)}</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
                <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                Illustrative demo figures using made-up rates. This is not real payroll and no payout is made.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="history-heading" className="space-y-3">
        <h2 id="history-heading" className="text-base font-semibold text-gray-900">
          Delivery history
        </h2>
        <Card>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : stats.history.length === 0 ? (
            <EmptyState icon={History} title="No history yet" description="Delivered and failed attempts will be listed here." className="py-10" />
          ) : (
            <>
              <ul className="divide-y divide-gray-100">
                {stats.history.slice(0, historyCount).map((shipment) => (
                  <li key={shipment.id}>
                    <Link to={`/driver/deliveries/${shipment.id}`} className="flex min-h-16 items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-gray-25">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{shipment.receiver.name}</p>
                        <p className="truncate text-xs text-gray-500">
                          <span className="font-mono">{shipment.trackingNumber}</span> · {formatFriendlyDateTime(closedAt(shipment))}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={shipment.status} />
                        {shipment.codAmount > 0 && <span className="tabular text-xs text-gray-500">COD {formatPKR(shipment.codAmount)}</span>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 p-3">
                {historyCount < stats.history.length ? (
                  <Button variant="secondary" size="lg" className="w-full" onClick={() => setHistoryCount((c) => c + HISTORY_PAGE)}>
                    Show more ({stats.history.length - historyCount} remaining)
                  </Button>
                ) : (
                  <p className="text-center text-xs text-gray-500">
                    Showing all {stats.history.length} {stats.history.length === 1 ? 'entry' : 'entries'}
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      </section>
    </div>
  )
}
