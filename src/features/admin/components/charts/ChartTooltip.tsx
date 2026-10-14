import { formatNumber } from '@/utils/format'

interface TooltipEntry {
  name?: string | number
  value?: unknown
  color?: string
  payload?: { fill?: string }
}

interface ChartTooltipProps {
  /** Injected by Recharts. */
  active?: boolean
  payload?: ReadonlyArray<TooltipEntry>
  label?: string | number
  valueFormatter?: (value: number) => string
}

/** Small white card tooltip used by every chart. Pass as `<Tooltip content={<ChartTooltip />} />`. */
export function ChartTooltip({ active, payload, label, valueFormatter = formatNumber }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-pop">
      {label !== undefined && label !== '' && <p className="mb-1 text-xs font-semibold text-gray-900">{label}</p>}
      <ul className="space-y-1">
        {payload.map((entry, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color ?? entry.payload?.fill }} aria-hidden />
            <span>{entry.name}</span>
            <span className="tabular ml-auto pl-3 font-semibold text-gray-900">{typeof entry.value === 'number' ? valueFormatter(entry.value) : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
