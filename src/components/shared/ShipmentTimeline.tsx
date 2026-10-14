import { Check, CircleDot, PackageX, RotateCcw, X } from 'lucide-react'
import { STATUS_FLOW, STATUS_META } from '@/features/shipments/meta'
import type { Shipment, TrackingEvent } from '@/types'
import { cn } from '@/utils/cn'
import { formatFriendlyDateTime } from '@/utils/format'

const DOT_TONE = {
  current: 'bg-brand-600 text-white ring-brand-100',
  success: 'bg-emerald-500 text-white ring-emerald-100',
  problem: 'bg-red-500 text-white ring-red-100',
  past: 'bg-gray-200 text-gray-600 ring-gray-50',
}

function eventLook(event: TrackingEvent, isLatest: boolean) {
  if (event.status === 'delivered') return { tone: DOT_TONE.success, Icon: Check }
  if (event.status === 'failed') return { tone: DOT_TONE.problem, Icon: PackageX }
  if (event.status === 'returned') return { tone: DOT_TONE.problem, Icon: RotateCcw }
  if (event.status === 'cancelled') return { tone: DOT_TONE.problem, Icon: X }
  return isLatest ? { tone: DOT_TONE.current, Icon: CircleDot } : { tone: DOT_TONE.past, Icon: Check }
}

/** Vertical tracking history, newest event first. */
export function ShipmentTimeline({ events, className }: { events: TrackingEvent[]; className?: string }) {
  const ordered = [...events].reverse()
  return (
    <ol className={cn('relative', className)}>
      {ordered.map((event, i) => {
        const { tone, Icon } = eventLook(event, i === 0)
        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < ordered.length - 1 && <span className="absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-px bg-gray-200" aria-hidden />}
            <span className={cn('relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ring-4', tone)}>
              <Icon className="size-3.5" strokeWidth={2.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className={cn('text-sm font-semibold', i === 0 ? 'text-gray-900' : 'text-gray-700')}>{event.title}</p>
                <time dateTime={event.timestamp} className="tabular text-xs text-gray-500">
                  {formatFriendlyDateTime(event.timestamp)}
                </time>
              </div>
              <p className="mt-0.5 text-sm text-gray-600">{event.description}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {event.location}
                {event.actor ? ` · ${event.actor}` : ''}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

const SHORT_LABEL = ['Booked', 'Picked up', 'Origin hub', 'In transit', 'Destination', 'Out for delivery', 'Delivered']

/** Horizontal journey progress across the standard status flow. */
export function ShipmentProgress({ shipment, className }: { shipment: Pick<Shipment, 'status' | 'events'>; className?: string }) {
  const exception = ['failed', 'returned', 'cancelled'].includes(shipment.status)
  // For exception states, progress is the furthest happy-path step the parcel reached.
  const reached = shipment.events.reduce((max, e) => Math.max(max, STATUS_FLOW.indexOf(e.status)), 0)
  return (
    <div className={className}>
      <ol className="flex items-start">
        {STATUS_FLOW.map((status, i) => {
          const done = i < reached || (i === reached && shipment.status === 'delivered')
          const active = i === reached && !done
          return (
            <li key={status} className="relative flex flex-1 flex-col items-center last:flex-none sm:last:flex-1">
              {i < STATUS_FLOW.length - 1 && (
                <span className={cn('absolute left-1/2 top-2.5 h-0.5 w-full -translate-y-1/2', i < reached ? 'bg-brand-600' : 'bg-gray-200')} aria-hidden />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-5 items-center justify-center rounded-full ring-4 ring-white',
                  done && 'bg-brand-600 text-white',
                  active && !exception && 'bg-brand-600 ring-brand-100',
                  active && exception && 'bg-red-500 ring-red-100',
                  !done && !active && 'border-2 border-gray-300 bg-white',
                )}
              >
                {done && <Check className="size-3" strokeWidth={3.5} />}
              </span>
              <span className={cn('mt-2 hidden px-1 text-center text-xs sm:block', done || active ? 'font-semibold text-gray-900' : 'text-gray-500')}>{SHORT_LABEL[i]}</span>
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-sm font-medium text-gray-700 sm:hidden">
        Current: <span className={exception ? 'text-red-600' : 'text-brand-700'}>{STATUS_META[shipment.status].label}</span>
      </p>
    </div>
  )
}
