import { format } from 'date-fns'
import { ArrowRight, Banknote, CheckCircle2, Clock, Info, Package, PackageCheck, PackageOpen } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ShipmentCard } from '@/components/shared/ShipmentCard'
import { StatsCard } from '@/components/shared/StatsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { CURRENT_DRIVER_ID } from '@/data/session'
import { driverService } from '@/services'
import type { DriverAvailability } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'
import { useCurrentDriver, useMyBranch, useMyTasks } from '../hooks'
import { summariseDay } from '../tasks'

const AVAILABILITY: { value: DriverAvailability; label: string; dot: string }[] = [
  { value: 'available', label: 'Available', dot: 'bg-emerald-500' },
  { value: 'on_route', label: 'On route', dot: 'bg-brand-500' },
  { value: 'off_duty', label: 'Off duty', dot: 'bg-gray-400' },
]

function greeting(now: Date) {
  const hour = now.getHours()
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

function AvailabilityToggle({ value }: { value: DriverAvailability | undefined }) {
  const [saving, setSaving] = useState<DriverAvailability | null>(null)
  const current = saving ?? value

  const change = async (next: DriverAvailability) => {
    if (next === current || saving) return
    setSaving(next)
    try {
      await driverService.update(CURRENT_DRIVER_ID, { availability: next })
      toast.success(`Status set to ${AVAILABILITY.find((a) => a.value === next)?.label.toLowerCase()}`)
    } catch {
      toast.error('Could not update your status. Please try again.')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <p id="availability-label" className="text-sm font-medium text-gray-700">
          Your status
        </p>
        <div role="radiogroup" aria-labelledby="availability-label" className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
          {AVAILABILITY.map((option) => {
            const active = current === option.value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={value === undefined}
                onClick={() => change(option.value)}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50',
                  active ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800',
                )}
              >
                <span className={cn('size-2 rounded-full', active ? option.dot : 'bg-gray-300')} aria-hidden />
                {option.label}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: driver } = useCurrentDriver()
  const { data: branch } = useMyBranch()
  const { data: tasks, loading } = useMyTasks()
  const [now] = useState(() => new Date())

  const day = useMemo(() => summariseDay(tasks ?? []), [tasks])
  const completed = day.deliveredToday.length
  const progress = day.assignedToday ? Math.round((completed / day.assignedToday) * 100) : 0
  const nextStops = day.pending.slice(0, 3)
  const firstName = driver?.name.split(' ')[0]

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-medium text-gray-500">{format(now, 'EEEE, d MMMM')}</p>
        <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-gray-900">
          {greeting(now)}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <div className="mt-1 text-sm text-gray-500">{branch ? `${branch.name} · ${branch.code}` : <Skeleton className="h-4 w-40" />}</div>
      </header>

      <AvailabilityToggle value={driver?.availability} />

      <section aria-label="Today's summary" className="grid grid-cols-2 gap-3">
        <StatsCard label="Assigned today" value={day.assignedToday} icon={Package} tone="blue" hint="Deliveries" loading={loading} to="/driver/deliveries" className="p-4" />
        <StatsCard label="Pickups" value={day.pickups.length} icon={PackageOpen} tone="indigo" hint="To collect" loading={loading} to="/driver/deliveries?tab=pickups" className="p-4" />
        <StatsCard label="Completed" value={completed} icon={CheckCircle2} tone="green" hint="Delivered today" loading={loading} to="/driver/deliveries?tab=completed" className="p-4" />
        <StatsCard label="Pending" value={day.pending.length} icon={Clock} tone="orange" hint="Still to deliver" loading={loading} to="/driver/deliveries?tab=pending" className="p-4" />
      </section>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Day progress</h2>
            {loading ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <p className="tabular text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{completed}</span> of {day.assignedToday} delivered
              </p>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Deliveries completed today"
            aria-valuemin={0}
            aria-valuemax={day.assignedToday}
            aria-valuenow={completed}
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-gray-100"
          >
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          {!loading && (
            <p className="mt-2 text-xs text-gray-500">
              {day.assignedToday === 0
                ? 'No deliveries assigned yet today.'
                : `${progress}% complete · ${day.pending.length} pending${day.failedToday.length ? ` · ${day.failedToday.length} failed` : ''}`}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Banknote className="size-5 text-orange-600" aria-hidden /> COD collection
            </span>
          }
          description="Cash on delivery for today's run"
          className="px-4 pt-4"
        />
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-16" />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-orange-50 p-3">
                  <dt className="text-xs font-medium text-orange-700">To collect</dt>
                  <dd className="tabular mt-1 text-xl font-semibold text-gray-900">{formatPKR(day.codToCollect)}</dd>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <dt className="text-xs font-medium text-emerald-700">Collected so far</dt>
                  <dd className="tabular mt-1 text-xl font-semibold text-gray-900">{formatPKR(day.codCollected)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{day.codParcels}</span> COD {day.codParcels === 1 ? 'parcel' : 'parcels'} today · total expected{' '}
                <span className="tabular font-semibold text-gray-900">{formatPKR(day.codToCollect + day.codCollected)}</span>
              </p>
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
                <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                Collected cash must be deposited at your branch at the end of the shift. Demo figures only — no real money is handled.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="next-stops">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="next-stops" className="text-base font-semibold text-gray-900">
            Today's deliveries
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/driver/deliveries">
              View all <ArrowRight />
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton lines={3} />
            <CardSkeleton lines={3} />
          </div>
        ) : nextStops.length === 0 ? (
          <Card>
            <EmptyState
              icon={PackageCheck}
              title="No pending deliveries"
              description={day.pickups.length ? 'All deliveries are done. You still have pickups to collect.' : 'You are all caught up for now.'}
              action={
                <Button asChild variant="secondary">
                  <Link to={day.pickups.length ? '/driver/deliveries?tab=pickups' : '/driver/deliveries?tab=completed'}>{day.pickups.length ? 'View pickups' : 'View completed'}</Link>
                </Button>
              }
              className="py-10"
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {nextStops.map((shipment) => (
              <ShipmentCard key={shipment.id} shipment={shipment} variant="recipient" to={`/driver/deliveries/${shipment.id}`} />
            ))}
            {day.pending.length > nextStops.length && (
              <Button variant="secondary" size="lg" className="w-full" asChild>
                <Link to="/driver/deliveries?tab=pending">
                  {day.pending.length - nextStops.length} more pending {day.pending.length - nextStops.length === 1 ? 'stop' : 'stops'}
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
