// Reusable DataTable column definitions for shipment tables in the hub workspace.
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight } from 'lucide-react'
import { SERVICE_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'
import { AGEING_THRESHOLD_HOURS, ageHours, formatAge, formatKg } from '../lib'
import { FragileBadge, HeaderCheckbox, RowCheckbox, Tracking } from './cells'

/**
 * Leading checkbox column. State comes from `SelectionProvider` (not props) so the column
 * definition stays stable and cells keep focus while rows are toggled.
 */
export function selectionColumn<T extends { id: string }>(labelOf: (row: T) => string): ColumnDef<T, unknown> {
  return {
    id: 'select',
    enableSorting: false,
    header: () => <HeaderCheckbox />,
    cell: ({ row }) => <RowCheckbox id={row.original.id} label={labelOf(row.original)} />,
  }
}

export const trackingColumn: ColumnDef<Shipment, unknown> = {
  accessorKey: 'trackingNumber',
  header: 'Tracking no.',
  cell: ({ row }) => (
    <div>
      <Tracking value={row.original.trackingNumber} />
      <p className="text-xs text-gray-500">{SERVICE_META[row.original.service].label}</p>
    </div>
  ),
}

export const routeColumn: ColumnDef<Shipment, unknown> = {
  id: 'route',
  header: 'Route',
  accessorFn: (s) => `${s.sender.city} ${s.receiver.city}`,
  cell: ({ row }) => (
    <span className="inline-flex items-center gap-1.5 font-medium text-gray-900">
      {row.original.sender.city}
      <ArrowRight className="size-3.5 text-gray-400" aria-hidden />
      {row.original.receiver.city}
    </span>
  ),
}

export const receiverColumn: ColumnDef<Shipment, unknown> = {
  id: 'receiver',
  header: 'Receiver',
  accessorFn: (s) => s.receiver.name,
  cell: ({ row }) => (
    <div>
      <p className="font-medium text-gray-900">{row.original.receiver.name}</p>
      <p className="max-w-56 truncate text-xs text-gray-500">{row.original.receiver.address}</p>
    </div>
  ),
}

export const parcelColumn: ColumnDef<Shipment, unknown> = {
  id: 'parcel',
  header: 'Parcel',
  accessorFn: (s) => s.parcel.weightKg,
  cell: ({ row }) => {
    const { parcel } = row.original
    return (
      <div className="flex items-center gap-2">
        <span className="tabular">
          {formatKg(parcel.weightKg)} · {parcel.quantity} pc
        </span>
        {parcel.fragile && <FragileBadge />}
      </div>
    )
  },
}

export const codColumn: ColumnDef<Shipment, unknown> = {
  accessorKey: 'codAmount',
  header: 'COD',
  meta: { align: 'right' },
  cell: ({ row }) =>
    row.original.codAmount > 0 ? <span className="tabular font-medium text-gray-900">{formatPKR(row.original.codAmount)}</span> : <span className="text-gray-400">Prepaid</span>,
}

export const ageColumn: ColumnDef<Shipment, unknown> = {
  id: 'age',
  header: 'Age',
  accessorFn: (s) => ageHours(s),
  cell: ({ row }) => {
    const hours = ageHours(row.original)
    const old = hours > AGEING_THRESHOLD_HOURS
    return <span className={cn('tabular', old ? 'font-semibold text-red-600' : 'text-gray-600')}>{formatAge(hours)}</span>
  },
}
