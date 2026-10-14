import { Printer } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { CITY_INFO } from '@/data/cities'
import { PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'

/**
 * Renders children into a `.print-only` container on <body>. Global print CSS hides everything else,
 * so `window.print()` outputs just this content (labels, manifests).
 */
export function PrintPortal({ children }: { children: ReactNode }) {
  return createPortal(<div className="print-only">{children}</div>, document.body)
}

/** Mounts printable content, opens the browser print dialog, then unmounts it. */
export function usePrint() {
  const [content, setContent] = useState<ReactNode>(null)

  useEffect(() => {
    if (!content) return
    const done = () => setContent(null)
    window.addEventListener('afterprint', done)
    // Wait a frame so the portal is in the DOM before the print dialog opens.
    const t = window.setTimeout(() => window.print(), 80)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('afterprint', done)
    }
  }, [content])

  return { print: setContent, portal: content ? <PrintPortal>{content}</PrintPortal> : null }
}

/** Deterministic pseudo-barcode (visual only — not a scannable symbology). */
export function Barcode({ value, height = 56 }: { value: string; height?: number }) {
  const bars: number[] = []
  for (const ch of value) {
    const code = ch.charCodeAt(0)
    bars.push(1 + (code % 3), 1 + ((code >> 2) % 2), 1 + ((code >> 3) % 3), 1 + ((code >> 1) % 2))
  }
  let x = 0
  const rects = bars.map((w, i) => {
    const rect = i % 2 === 0 ? <rect key={i} x={x} y={0} width={w} height={height} fill="#000" /> : null
    x += w
    return rect
  })
  return (
    <svg viewBox={`0 0 ${x} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={`Barcode for ${value}`}>
      {rects}
    </svg>
  )
}

/** 4×6-style shipping label. Used on screen (preview) and inside PrintPortal. */
export function ShipmentLabel({ shipment }: { shipment: Shipment }) {
  const origin = CITY_INFO[shipment.sender.city]
  const destination = CITY_INFO[shipment.receiver.city]
  return (
    <div className="mx-auto w-full max-w-[400px] border-2 border-black bg-white font-sans text-black">
      <div className="flex items-center justify-between border-b-2 border-black px-4 py-3">
        <div>
          <p className="text-lg font-extrabold leading-none tracking-tight">CourierPro</p>
          <p className="mt-1 text-[10px] uppercase tracking-widest">{SERVICE_META[shipment.service].label} service</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black leading-none">{destination.code}</p>
          <p className="text-[10px] uppercase tracking-wider">from {origin.code}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b-2 border-black text-xs">
        <div className="border-r-2 border-black p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider">From</p>
          <p className="mt-1 font-semibold">{shipment.sender.name}</p>
          <p>{shipment.sender.address}</p>
          <p>
            {shipment.sender.city} {shipment.sender.postalCode}
          </p>
          <p>{shipment.sender.phone}</p>
        </div>
        <div className="p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider">Deliver to</p>
          <p className="mt-1 text-sm font-bold">{shipment.receiver.name}</p>
          <p>{shipment.receiver.address}</p>
          <p className="font-semibold">
            {shipment.receiver.city} {shipment.receiver.postalCode}
          </p>
          <p>{shipment.receiver.phone}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 border-b-2 border-black text-center text-xs">
        {[
          ['Weight', `${shipment.parcel.weightKg} kg`],
          ['Pieces', String(shipment.parcel.quantity)],
          ['Booked', formatDate(shipment.createdAt)],
          ['Fragile', shipment.parcel.fragile ? 'YES' : 'No'],
        ].map(([label, value], i) => (
          <div key={label} className={i < 3 ? 'border-r-2 border-black p-2' : 'p-2'}>
            <p className="text-[9px] font-bold uppercase tracking-wider">{label}</p>
            <p className="mt-0.5 font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-b-2 border-black px-4 py-2 text-xs">
        <span className="font-semibold">{PAYMENT_LABEL[shipment.paymentMethod]}</span>
        <span className="text-base font-black">{shipment.codAmount > 0 ? `COLLECT ${formatPKR(shipment.codAmount)}` : 'PREPAID — DO NOT COLLECT'}</span>
      </div>

      <div className="px-4 pb-3 pt-4 text-center">
        <Barcode value={shipment.trackingNumber} />
        <p className="mt-2 font-mono text-base font-bold tracking-[0.2em]">{shipment.trackingNumber}</p>
        <p className="mt-1 text-[10px]">{shipment.parcel.description}{shipment.parcel.instructions ? ` · ${shipment.parcel.instructions}` : ''}</p>
      </div>
    </div>
  )
}

/** Button that prints a shipment label via the browser's print dialog. */
export function PrintLabelButton({ shipment, children, ...props }: { shipment: Shipment } & Omit<ButtonProps, 'onClick'>) {
  const { print, portal } = usePrint()
  return (
    <>
      <Button variant="secondary" {...props} onClick={() => print(<ShipmentLabel shipment={shipment} />)}>
        <Printer /> {children ?? 'Print label'}
      </Button>
      {portal}
    </>
  )
}
