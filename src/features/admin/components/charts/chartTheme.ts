// Shared Recharts styling so every chart in the console looks the same.
export const CHART_COLORS = {
  brand: '#1263eb',
  brandLight: '#90b5fb',
  success: '#10b981',
  warning: '#f97316',
  error: '#ef4444',
  purple: '#8b5cf6',
  gray: '#98a2b3',
}

export const GRID_STROKE = '#eaecf0'
export const AXIS_TICK = { fontSize: 12, fill: '#667085' }
export const AXIS_PROPS = { tick: AXIS_TICK, axisLine: false, tickLine: false } as const
export const CHART_MARGIN = { top: 8, right: 8, left: 0, bottom: 0 }

export interface ChartSeries<T> {
  key: keyof T & string
  label: string
  color: string
  /** Trend charts only: draw as a line instead of a filled area. */
  type?: 'area' | 'line'
}
