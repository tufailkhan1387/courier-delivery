import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { TONE_DOT } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { STATUS_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { timeAgo } from '@/utils/format'

/** Latest tracking events across the whole network. */
export function ActivityFeed({ shipments, loading, limit = 8 }: { shipments: Shipment[] | undefined; loading: boolean; limit?: number }) {
  const activity = useMemo(
    () =>
      (shipments ?? [])
        .flatMap((s) => s.events.map((e) => ({ ...e, shipmentId: s.id, trackingNumber: s.trackingNumber })))
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, limit),
    [shipments, limit],
  )

  return (
    <Card>
      <CardHeader title="Operational activity" description="Latest scans and status updates network-wide" />
      <CardContent>
        {loading && !shipments ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-sm text-gray-500">Tracking updates will appear here as parcels move through the network.</p>
        ) : (
          <ul className="space-y-4">
            {activity.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className={`mt-1.5 size-2 shrink-0 rounded-full ${TONE_DOT[STATUS_META[event.status].tone]}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="truncate text-xs text-gray-500">
                    <Link to={`/admin/shipments/${event.shipmentId}`} className="font-mono hover:text-brand-700 hover:underline">
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
  )
}
