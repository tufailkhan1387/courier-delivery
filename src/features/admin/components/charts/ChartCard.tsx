import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  /** Text alternative announced to screen readers in place of the chart. */
  summary: string
  /** Fixed plot height in px. Omit when the chart manages its own height (e.g. DonutChart). */
  height?: number
  loading?: boolean
  empty?: boolean
  emptyText?: string
  className?: string
  children: ReactNode
}

/** Card frame for a chart: title, loading skeleton, empty message and an accessible label. */
export function ChartCard({ title, description, action, summary, height, loading, empty, emptyText = 'No data for this period yet.', className, children }: ChartCardProps) {
  const placeholderHeight = height ?? 260
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={action} />
      <CardContent>
        {loading ? (
          <Skeleton className="w-full" style={{ height: placeholderHeight }} />
        ) : empty ? (
          <div className="flex items-center justify-center text-center text-sm text-gray-500" style={{ height: placeholderHeight }}>
            {emptyText}
          </div>
        ) : (
          <div role="img" aria-label={summary} style={height ? { height } : undefined}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
