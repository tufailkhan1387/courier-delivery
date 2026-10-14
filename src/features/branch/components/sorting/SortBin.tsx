import { Bike, CheckCheck, ClipboardList, RotateCcw, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import type { Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { formatKg, totalsOf } from '../../lib'

export interface SortBinData {
  id: string
  /** Bin label, e.g. the destination city. */
  title: string
  subtitle: string
  local: boolean
  /** Where the bin's follow-up action goes (create manifest / assign riders). */
  actionTo: string
  shipments: Shipment[]
}

interface SortBinProps {
  bin: SortBinData
  /** Parcels to list (after the sorted/unsorted view filter). */
  visible: Shipment[]
  sorted: Set<string>
  onToggle: (ids: string[], value: boolean) => void
  onOpen: (shipment: Shipment) => void
}

/** One sort bin: load summary, sorting progress and its parcels with a "placed in bin" checkbox. */
export function SortBin({ bin, visible, sorted, onToggle, onOpen }: SortBinProps) {
  const totals = totalsOf(bin.shipments)
  const ids = bin.shipments.map((s) => s.id)
  const done = ids.filter((id) => sorted.has(id)).length
  const complete = done === ids.length
  const Icon = bin.local ? Bike : Truck

  return (
    <section className="flex flex-col rounded-xl border border-gray-200 bg-white shadow-card" aria-label={`${bin.title} bin`}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', bin.local ? 'bg-orange-50 text-orange-600' : 'bg-brand-50 text-brand-600')}>
            <Icon className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900">{bin.title}</h3>
            <p className="truncate text-xs text-gray-500">{bin.subtitle}</p>
          </div>
        </div>
        <Badge tone={complete ? 'green' : 'orange'}>{complete ? 'Sorted' : `${ids.length - done} to sort`}</Badge>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 px-5 text-center">
        {[
          ['Parcels', String(totals.parcels)],
          ['Weight', formatKg(totals.weightKg)],
          ['Fragile', String(totals.fragile)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-gray-50 px-2 py-2">
            <dd className="tabular text-base font-semibold text-gray-900">{value}</dd>
            <dt className="text-xs text-gray-500">{label}</dt>
          </div>
        ))}
      </dl>

      <div className="mt-4 px-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label={`${bin.title} sorting progress`} aria-valuemin={0} aria-valuemax={ids.length} aria-valuenow={done}>
          <div className={cn('h-full rounded-full transition-[width]', complete ? 'bg-emerald-500' : 'bg-brand-600')} style={{ width: `${ids.length ? (done / ids.length) * 100 : 0}%` }} />
        </div>
        <p className="tabular mt-1.5 text-xs text-gray-500">
          {done} of {ids.length} placed in bin
        </p>
      </div>

      <ul className="mt-3 max-h-64 flex-1 divide-y divide-gray-100 overflow-y-auto border-t border-gray-200">
        {visible.length === 0 ? (
          <li className="px-5 py-6 text-center text-sm text-gray-500">No parcels in this view.</li>
        ) : (
          visible.map((s) => {
            const isSorted = sorted.has(s.id)
            return (
              <li key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                <Checkbox aria-label={`Mark ${s.trackingNumber} as sorted`} checked={isSorted} onCheckedChange={(checked) => onToggle([s.id], checked === true)} />
                <button type="button" onClick={() => onOpen(s)} className="min-w-0 flex-1 rounded text-left">
                  <span className={cn('block font-mono text-sm font-semibold', isSorted ? 'text-gray-400 line-through' : 'text-gray-900')}>{s.trackingNumber}</span>
                  <span className="block truncate text-xs text-gray-500">
                    {s.receiver.name} · {formatKg(s.parcel.weightKg)}
                  </span>
                </button>
                {s.parcel.fragile && <Badge tone="orange">Fragile</Badge>}
              </li>
            )
          })
        )}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-gray-200 px-5 py-3.5">
        {complete ? (
          <Button variant="secondary" size="sm" onClick={() => onToggle(ids, false)}>
            <RotateCcw /> Reset bin
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => onToggle(ids, true)}>
            <CheckCheck /> Mark bin sorted
          </Button>
        )}
        <Button variant="soft" size="sm" asChild>
          <Link to={bin.actionTo}>
            {bin.local ? <Bike /> : <ClipboardList />}
            {bin.local ? 'Assign riders' : 'Create manifest'}
          </Link>
        </Button>
      </div>
    </section>
  )
}
