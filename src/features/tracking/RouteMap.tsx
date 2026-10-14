import { CITIES, CITY_INFO } from '@/data/cities'
import { STATUS_FLOW } from '@/features/shipments/meta'
import type { City, ShipmentStatus } from '@/types'
import { cn } from '@/utils/cn'

interface RouteMapProps {
  origin: City
  destination: City
  status: ShipmentStatus
  className?: string
}

/**
 * Stylised network map (illustrative only — not live GPS or real geography).
 * Draws the origin → destination lane and places the parcel along it based on status.
 */
export function RouteMap({ origin, destination, status, className }: RouteMapProps) {
  const a = CITY_INFO[origin].map
  const b = CITY_INFO[destination].map
  const sameCity = origin === destination
  const step = STATUS_FLOW.indexOf(status)
  // Fraction of the lane travelled for each happy-path step; exceptions sit at the destination.
  const progress = step === -1 ? (status === 'cancelled' ? 0 : 1) : [0, 0.05, 0.12, 0.55, 0.9, 0.96, 1][step]

  // Gentle curve between the two cities
  const mx = (a.x + b.x) / 2 - (b.y - a.y) * 0.18
  const my = (a.y + b.y) / 2 + (b.x - a.x) * 0.18
  const path = `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`
  const t = progress
  const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x
  const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y

  return (
    <figure className={cn('overflow-hidden rounded-xl border border-gray-200 bg-brand-25', className)}>
      <svg viewBox="0 0 100 100" className="block aspect-[4/3] w-full" role="img" aria-label={`Illustrative route from ${origin} to ${destination}`}>
        <defs>
          <pattern id="route-grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="var(--color-brand-100)" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#route-grid)" />

        {CITIES.filter((c) => c !== origin && c !== destination).map((c) => (
          <g key={c}>
            <circle cx={CITY_INFO[c].map.x} cy={CITY_INFO[c].map.y} r="1.1" fill="var(--color-gray-300)" />
            <text x={CITY_INFO[c].map.x + 2.2} y={CITY_INFO[c].map.y + 1} fontSize="2.6" fill="var(--color-gray-400)">
              {c}
            </text>
          </g>
        ))}

        {!sameCity && (
          <>
            <path d={path} fill="none" stroke="var(--color-brand-200)" strokeWidth="1" strokeDasharray="2 1.6" strokeLinecap="round" />
            <path d={path} fill="none" stroke="var(--color-brand-600)" strokeWidth="1" strokeLinecap="round" pathLength={1} strokeDasharray={`${progress} 1`} />
          </>
        )}

        {[
          { city: origin, point: a, label: 'Origin' },
          ...(sameCity ? [] : [{ city: destination, point: b, label: 'Destination' }]),
        ].map(({ city, point, label }) => (
          <g key={label}>
            <circle cx={point.x} cy={point.y} r="2.2" fill="#fff" stroke="var(--color-brand-600)" strokeWidth="0.9" />
            <text x={point.x} y={point.y - 4.4} fontSize="3.4" fontWeight="600" textAnchor="middle" fill="var(--color-gray-900)">
              {city}
            </text>
            <text x={point.x} y={point.y + 6} fontSize="2.3" textAnchor="middle" fill="var(--color-gray-500)">
              {sameCity ? 'Local delivery' : label}
            </text>
          </g>
        ))}

        {status !== 'cancelled' && !sameCity && (
          <g>
            <circle cx={px} cy={py} r="3.6" fill="var(--color-brand-600)" opacity="0.18" />
            <circle cx={px} cy={py} r="1.7" fill="var(--color-brand-600)" stroke="#fff" strokeWidth="0.6" />
          </g>
        )}
      </svg>
      <figcaption className="border-t border-brand-100 bg-white px-4 py-2 text-xs text-gray-500">
        Illustrative route preview — positions are approximate and not live GPS.
      </figcaption>
    </figure>
  )
}
