import { CheckCircle2, PackageX, SearchX, ShieldAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/utils/cn'

export function TaskSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading delivery">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-56" />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={4} />
    </div>
  )
}

const backToList = (
  <Button asChild size="lg">
    <Link to="/driver/deliveries">Back to deliveries</Link>
  </Button>
)

/** Shown when a task id does not exist or belongs to another rider. */
export function TaskUnavailable({ reason }: { reason: 'not_found' | 'not_assigned' }) {
  return reason === 'not_found' ? (
    <EmptyState icon={SearchX} title="Delivery not found" description="This task does not exist or has been removed from the demo data." action={backToList} className="min-h-[60vh]" />
  ) : (
    <EmptyState
      icon={ShieldAlert}
      title="Not on your run sheet"
      description="This shipment is assigned to another rider or has not been assigned yet, so you cannot update it."
      action={backToList}
      className="min-h-[60vh]"
    />
  )
}

/** Shown when a flow (POD / failed attempt) is opened for a task that is no longer out for delivery. */
export function TaskNotActionable({ id, message }: { id: string; message: string }) {
  return (
    <EmptyState
      icon={PackageX}
      title="Nothing to update"
      description={message}
      action={
        <Button asChild size="lg">
          <Link to={`/driver/deliveries/${id}`}>View delivery</Link>
        </Button>
      }
      className="min-h-[60vh]"
    />
  )
}

interface ResultScreenProps {
  tone: 'success' | 'warning'
  icon?: LucideIcon
  title: string
  description: string
  /** Summary rows shown in a card. */
  summary: { label: string; value: ReactNode }[]
  actions: ReactNode
}

/** End-of-flow confirmation: icon, summary and next actions. */
export function ResultScreen({ tone, icon: Icon = CheckCircle2, title, description, summary, actions }: ResultScreenProps) {
  return (
    <div className="flex flex-col items-center pt-6 text-center" role="status">
      <span className={cn('flex size-16 items-center justify-center rounded-full ring-8', tone === 'success' ? 'bg-emerald-100 text-emerald-600 ring-emerald-50' : 'bg-orange-100 text-orange-600 ring-orange-50')}>
        <Icon className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>

      <dl className="mt-6 w-full divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white px-4 text-left shadow-card">
        {summary.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-4 py-3">
            <dt className="shrink-0 text-sm text-gray-500">{row.label}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-medium text-gray-900">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex w-full flex-col gap-3">{actions}</div>
    </div>
  )
}
