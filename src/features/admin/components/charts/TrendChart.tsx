import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '@/utils/format'
import { ChartTooltip } from './ChartTooltip'
import { AXIS_PROPS, CHART_MARGIN, GRID_STROKE, type ChartSeries } from './chartTheme'

interface TrendChartProps<T> {
  data: T[]
  xKey: keyof T & string
  series: ChartSeries<T>[]
  /** Formats values in the tooltip (axis ticks stay compact). */
  valueFormatter?: (value: number) => string
  /** Fixed Y domain, e.g. [0, 100] for percentages. */
  domain?: [number, number]
}

/** Area/line chart over time. Must be rendered inside a parent with an explicit height. */
export function TrendChart<T extends object>({ data, xKey, series, valueFormatter, domain }: TrendChartProps<T>) {
  // Recharts infers its own data-point generic; plain strings keep our `keyof T` typing at the boundary only.
  const x: string = xKey
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey={x} {...AXIS_PROPS} minTickGap={28} tickMargin={8} />
        <YAxis {...AXIS_PROPS} width={44} allowDecimals={false} tickFormatter={formatCompact} domain={domain} />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: '#d0d5dd' }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: '#475467' }}>{value}</span>} />
        {series.map((s) =>
          s.type === 'line' ? (
            <Line key={s.key} type="monotone" dataKey={s.key as string} name={s.label} stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls isAnimationActive={false} />
          ) : (
            <Area key={s.key} type="monotone" dataKey={s.key as string} name={s.label} stroke={s.color} strokeWidth={2} fill={s.color} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
          ),
        )}
      </ComposedChart>
    </ResponsiveContainer>
  )
}
