import { Barcode } from '@/components/shared/PrintLabel'
import type { Branch, Driver, Manifest, Shipment } from '@/types'
import { formatDateTime, formatPKR, titleCase } from '@/utils/format'
import { formatKg, totalsOf } from '../lib'

interface ManifestPrintProps {
  manifest: Manifest
  shipments: Shipment[]
  origin: Branch | undefined
  destination: Branch | undefined
  driver: Driver | undefined
  /** ISO time the print was requested. */
  printedAt: string
}

/** Printable linehaul manifest (rendered inside a PrintPortal via `usePrint`). */
export function ManifestPrint({ manifest, shipments, origin, destination, driver, printedAt }: ManifestPrintProps) {
  const totals = totalsOf(shipments)
  const facts: [string, string][] = [
    ['Origin', origin ? `${origin.name} (${origin.code})` : '—'],
    ['Destination', destination ? `${destination.name} (${destination.code})` : '—'],
    ['Vehicle', manifest.vehiclePlate || '—'],
    ['Driver', driver ? `${driver.name} · ${driver.phone}` : 'Unassigned'],
    ['Seal no.', manifest.sealNumber],
    ['Status', titleCase(manifest.status)],
    ['Created', formatDateTime(manifest.createdAt)],
    ['Dispatched', manifest.dispatchedAt ? formatDateTime(manifest.dispatchedAt) : '—'],
  ]
  return (
    <div className="bg-white font-sans text-[11px] leading-snug text-black">
      <div className="flex items-start justify-between gap-6 border-b-2 border-black pb-3">
        <div>
          <p className="text-xl font-extrabold leading-none tracking-tight">CourierPro</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest">Linehaul manifest</p>
          <p className="mt-3 font-mono text-lg font-bold">{manifest.number}</p>
        </div>
        <div className="w-56 text-center">
          <Barcode value={manifest.number} height={44} />
          <p className="mt-1 font-mono text-[10px] tracking-[0.2em]">{manifest.number}</p>
        </div>
      </div>

      <dl className="grid grid-cols-4 gap-x-4 gap-y-2 border-b border-black py-3">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[9px] font-bold uppercase tracking-wider">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <table className="mt-3 w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-black text-[9px] uppercase tracking-wider">
            <th className="py-1.5 pr-2 font-bold">#</th>
            <th className="py-1.5 pr-2 font-bold">Tracking no.</th>
            <th className="py-1.5 pr-2 font-bold">Receiver</th>
            <th className="py-1.5 pr-2 font-bold">City</th>
            <th className="py-1.5 pr-2 font-bold">Contents</th>
            <th className="py-1.5 pr-2 text-right font-bold">Pcs</th>
            <th className="py-1.5 pr-2 text-right font-bold">Weight</th>
            <th className="py-1.5 pr-2 text-right font-bold">COD</th>
            <th className="py-1.5 text-center font-bold">Recd</th>
          </tr>
        </thead>
        <tbody>
          {shipments.map((s, i) => (
            <tr key={s.id} className="border-b border-gray-400" style={{ breakInside: 'avoid' }}>
              <td className="py-1.5 pr-2">{i + 1}</td>
              <td className="py-1.5 pr-2 font-mono font-semibold">{s.trackingNumber}</td>
              <td className="py-1.5 pr-2">{s.receiver.name}</td>
              <td className="py-1.5 pr-2">{s.receiver.city}</td>
              <td className="py-1.5 pr-2">
                {s.parcel.description}
                {s.parcel.fragile ? ' (FRAGILE)' : ''}
              </td>
              <td className="py-1.5 pr-2 text-right">{s.parcel.quantity}</td>
              <td className="py-1.5 pr-2 text-right">{formatKg(s.parcel.weightKg)}</td>
              <td className="py-1.5 pr-2 text-right">{s.codAmount > 0 ? formatPKR(s.codAmount) : '—'}</td>
              <td className="py-1.5 text-center">
                <span className="inline-block size-3 border border-black" />
              </td>
            </tr>
          ))}
          {shipments.length === 0 && (
            <tr>
              <td colSpan={9} className="py-4 text-center">
                No parcels on this manifest.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={5} className="py-2 pr-2">
              Totals — {totals.parcels} parcel{totals.parcels === 1 ? '' : 's'}
              {totals.fragile > 0 ? `, ${totals.fragile} fragile` : ''}
            </td>
            <td className="py-2 pr-2 text-right">{totals.pieces}</td>
            <td className="py-2 pr-2 text-right">{formatKg(totals.weightKg)}</td>
            <td className="py-2 pr-2 text-right">{formatPKR(totals.cod)}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      {manifest.notes && (
        <p className="mt-3">
          <span className="font-bold">Notes: </span>
          {manifest.notes}
        </p>
      )}

      <div className="mt-12 grid grid-cols-3 gap-8" style={{ breakInside: 'avoid' }}>
        {['Dispatcher', 'Driver', 'Receiver'].map((role) => (
          <div key={role}>
            <div className="h-10 border-b border-black" />
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider">{role} — name, signature &amp; time</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-[9px] text-gray-600">Printed {formatDateTime(printedAt)} · Demo document generated from sample data.</p>
    </div>
  )
}
