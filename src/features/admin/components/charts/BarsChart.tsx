import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCompact } from '@/utils/format'
import { ChartTooltip } from './ChartTooltip'
import { AXIS_PROPS, CHART_MARGIN, GRID_STROKE, type ChartSeries } from './chartTheme'

interface BarsChartProps<T> {
  data: T[]
  xKey: keyof T & string
  series: ChartSeries<T>[]
  stacked?: boolean
  /** Draw bars left-to-right with categories on the Y axis (better for long labels). */
  horizontal?: boolean
  valueFormatter?: (value: number) => string
}

/** Bar chart (grouped or stacked). Must be rendered inside a parent with an explicit height. */
export function BarsChart<T extends object>({ data, xKey, series, stacked, horizontal, valueFormatter }: BarsChartProps<T>) {
  // Recharts infers its own data-point generic; plain strings keep our `keyof T` typing at the boundary only.
  const x: string = xKey
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={CHART_MARGIN} layout={horizontal ? 'vertical' : 'horizontal'} barCategoryGap="28%">
        <CartesianGrid stroke={GRID_STROKE} vertical={!!horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" {...AXIS_PROPS} allowDecimals={false} tickFormatter={formatCompact} />
            <YAxis type="category" dataKey={x} {...AXIS_PROPS} width={132} />
          </>
        ) : (
          <>
            <XAxis dataKey={x} {...AXIS_PROPS} minTickGap={12} tickMargin={8} />
            <YAxis {...AXIS_PROPS} width={44} allowDecimals={false} tickFormatter={formatCompact} />
          </>
        )}
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: '#f2f4f7' }} />
        {series.length > 1 && (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} formatter={(value) => <span style={{ color: '#475467' }}>{value}</span>} />
        )}
        {series.map((s, i) => {
          const last = !stacked || i === series.length - 1
          const radius: [number, number, number, number] = !last ? [0, 0, 0, 0] : horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]
          return <Bar key={s.key} dataKey={s.key as string} name={s.label} fill={s.color} stackId={stacked ? 'stack' : undefined} radius={radius} maxBarSize={36} isAnimationActive={false} />
        })}
      </BarChart>
    </ResponsiveContainer>
  )
}
