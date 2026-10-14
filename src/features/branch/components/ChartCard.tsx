import type { ReactNode } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/misc'
import { cn } from '@/utils/cn'

interface ChartCardProps {
  title: string
  description?: string
  action?: ReactNode
  loading?: boolean
  /** Show the empty state instead of the chart. */
  empty?: boolean
  emptyText?: string
  height?: number
  className?: string
  /** A Recharts `ResponsiveContainer`. */
  children: ReactNode
}

/** Card wrapper giving charts a fixed-height parent plus loading and empty states. */
export function ChartCard({ title, description, action, loading, empty, emptyText = 'No data for this period yet.', height = 260, className, children }: ChartCardProps) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader title={title} description={description} action={action} />
      <CardContent>
        {loading ? (
          <Skeleton style={{ height }} className="rounded-lg" />
        ) : empty ? (
          <EmptyState title="Nothing to chart" description={emptyText} className="py-10" />
        ) : (
          <div style={{ height }} className="w-full min-w-0">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
