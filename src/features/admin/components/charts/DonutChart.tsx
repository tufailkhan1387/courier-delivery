import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatNumber, percent } from '@/utils/format'
import { ChartTooltip } from './ChartTooltip'

export interface DonutSlice {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  /** Caption under the total in the centre of the ring. */
  totalLabel?: string
  valueFormatter?: (value: number) => string
}

/** Donut with a centred total and a legend list below. Manages its own height. */
export function DonutChart({ data, totalLabel = 'Total', valueFormatter = formatNumber }: DonutChartProps) {
  const total = data.reduce((t, d) => t + d.value, 0)
  const slices = data.filter((d) => d.value > 0).map((d) => ({ name: d.name, value: d.value, fill: d.color }))
  return (
    <div>
      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="92%" paddingAngle={2} stroke="none" isAnimationActive={false} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-semibold text-gray-900">{valueFormatter(total)}</span>
          <span className="text-xs text-gray-500">{totalLabel}</span>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 min-[420px]:grid-cols-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs text-gray-600">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
            <span className="truncate">{d.name}</span>
            <span className="tabular ml-auto font-semibold text-gray-900">{percent(d.value, total, 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
