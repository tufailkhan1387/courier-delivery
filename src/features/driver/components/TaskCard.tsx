import { Banknote, ChevronRight, MapPin, Navigation, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Shipment } from '@/types'
import { formatFriendlyDateTime, formatPKR } from '@/utils/format'
import { closedAt, isPickupTask, taskContact } from '../tasks'

interface TaskCardProps {
  shipment: Shipment
  onNavigate: (shipment: Shipment) => void
}

const actionClass = 'flex h-12 items-center justify-center gap-2 text-sm font-semibold transition-colors'

/**
 * Run-sheet card for one stop. The body links to the detail screen; "Navigate" is a separate
 * action so it is not nested inside the link (the shared ShipmentCard is a single link).
 */
export function TaskCard({ shipment, onNavigate }: TaskCardProps) {
  const pickup = isPickupTask(shipment)
  const contact = taskContact(shipment)
  const open = shipment.status === 'out_for_delivery' || shipment.status === 'booked'
  const detailPath = `/driver/deliveries/${shipment.id}`

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-card">
      <Link to={detailPath} className="block p-4 transition-colors hover:bg-gray-25">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-gray-900">{shipment.trackingNumber}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{shipment.parcel.description}</p>
          </div>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="mt-3 space-y-1.5 text-sm">
          <p className="font-semibold text-gray-900">
            {pickup && <span className="mr-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Pickup from</span>}
            {contact.name}
          </p>
          <p className="flex items-start gap-2 text-gray-600">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
            <span>
              {contact.address}, {contact.city}
            </span>
          </p>
          <p className="flex items-center gap-2 text-gray-600">
            <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
            <span className="tabular">{contact.phone}</span>
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          {pickup ? (
            <span className="text-xs font-medium text-gray-500">
              {shipment.parcel.quantity} {shipment.parcel.quantity === 1 ? 'piece' : 'pieces'} · {shipment.parcel.weightKg} kg
            </span>
          ) : shipment.codAmount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700">
              <Banknote className="size-4" aria-hidden /> COD {formatPKR(shipment.codAmount)}
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-500">Prepaid · nothing to collect</span>
          )}
          {!open && <span className="text-xs text-gray-500">{formatFriendlyDateTime(closedAt(shipment))}</span>}
        </div>

        {shipment.status === 'failed' && shipment.failureReason && <p className="mt-2 text-xs font-medium text-red-700">{shipment.failureReason}</p>}
      </Link>

      <div className="grid grid-cols-2 divide-x divide-gray-200 border-t border-gray-200">
        <button type="button" onClick={() => onNavigate(shipment)} className={`${actionClass} text-brand-700 hover:bg-brand-25`}>
          <Navigation className="size-4" aria-hidden /> Navigate
        </button>
        <Link to={detailPath} className={`${actionClass} text-gray-700 hover:bg-gray-50`} aria-label={`View details for ${shipment.trackingNumber}`}>
          Details <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </article>
  )
}
