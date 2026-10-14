import { ArrowRight, Banknote, MapPin, Phone } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'
import { StatusBadge } from './StatusBadge'

interface ShipmentCardProps {
  shipment: Shipment
  /** Makes the card a link (e.g. to a detail page). */
  to?: string
  onClick?: () => void
  /** `route` shows origin → destination; `recipient` shows the delivery contact (rider view). */
  variant?: 'route' | 'recipient'
  footer?: ReactNode
  className?: string
}

/** Compact shipment summary for mobile lists and dashboards. */
export function ShipmentCard({ shipment, to, onClick, variant = 'route', footer, className }: ShipmentCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-gray-900">{shipment.trackingNumber}</p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{shipment.parcel.description}</p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {variant === 'route' ? (
        <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>{shipment.sender.city}</span>
          <ArrowRight className="size-4 text-gray-400" aria-hidden />
          <span>{shipment.receiver.city}</span>
          <span className="ml-auto text-xs font-normal text-gray-500">{shipment.receiver.name}</span>
        </div>
      ) : (
        <div className="mt-3 space-y-1.5 text-sm">
          <p className="font-semibold text-gray-900">{shipment.receiver.name}</p>
          <p className="flex items-start gap-2 text-gray-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            <span>
              {shipment.receiver.address}, {shipment.receiver.city}
            </span>
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
            {shipment.receiver.phone}
          </p>
        </div>
      )}

      {(shipment.codAmount > 0 || footer) && (
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          {shipment.codAmount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700">
              <Banknote className="size-4" aria-hidden /> COD {formatPKR(shipment.codAmount)}
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-500">Prepaid</span>
          )}
          {footer}
        </div>
      )}
    </>
  )

  const cardClass = cn(
    'block w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-card',
    (to || onClick) && 'transition-shadow hover:shadow-md',
    className,
  )
  if (to) {
    return (
      <Link to={to} className={cardClass}>
        {body}
      </Link>
    )
  }
  if (onClick) {
    return (
      <div role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()} className={cardClass}>
        {body}
      </div>
    )
  }
  return <div className={cardClass}>{body}</div>
}
