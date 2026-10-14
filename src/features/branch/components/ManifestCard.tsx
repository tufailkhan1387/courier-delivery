import { ArrowRight, Package, Truck, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { StateBadge } from '@/components/shared/StatusBadge'
import type { Driver, Manifest, Shipment } from '@/types'
import { formatFriendlyDateTime } from '@/utils/format'
import { branchLabel, formatKg, manifestShipments, totalsOf, type BranchMap } from '../lib'

interface ManifestCardProps {
  manifest: Manifest
  shipments: Shipment[]
  branches: BranchMap
  driver: Driver | undefined
  /** Buttons shown at the bottom of the card. */
  actions?: ReactNode
}

/** Board card summarising one manifest: route, vehicle, driver, load and timing. */
export function ManifestCard({ manifest, shipments, branches, driver, actions }: ManifestCardProps) {
  const totals = totalsOf(manifestShipments(manifest, shipments))
  const timing = manifest.receivedAt
    ? `Received ${formatFriendlyDateTime(manifest.receivedAt)}`
    : manifest.dispatchedAt && manifest.status !== 'draft'
      ? `Dispatched ${formatFriendlyDateTime(manifest.dispatchedAt)}`
      : `Created ${formatFriendlyDateTime(manifest.createdAt)}`
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/branch/manifests/${manifest.id}`} className="font-mono text-sm font-semibold text-gray-900 hover:text-brand-700 hover:underline">
            {manifest.number}
          </Link>
          <p className="mt-0.5 text-xs text-gray-500">{timing}</p>
        </div>
        <StateBadge value={manifest.status} />
      </div>
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-900">
        {branchLabel(branches, manifest.originBranchId)}
        <ArrowRight className="size-4 shrink-0 text-gray-400" aria-hidden />
        {branchLabel(branches, manifest.destinationBranchId)}
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
        <li className="flex items-center gap-2">
          <Package className="size-4 shrink-0 text-gray-400" aria-hidden />
          <span className="tabular">
            {totals.parcels} parcel{totals.parcels === 1 ? '' : 's'} · {formatKg(totals.weightKg)}
            {totals.fragile > 0 ? ` · ${totals.fragile} fragile` : ''}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Truck className="size-4 shrink-0 text-gray-400" aria-hidden />
          <span className="font-mono">{manifest.vehiclePlate || '—'}</span>
          <span className="text-gray-400">· seal {manifest.sealNumber}</span>
        </li>
        <li className="flex items-center gap-2">
          <UserRound className="size-4 shrink-0 text-gray-400" aria-hidden />
          {driver?.name ?? 'No driver assigned'}
        </li>
      </ul>
      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  )
}
