import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/misc'
import type { Tone } from '@/features/shipments/meta'
import { cn } from '@/utils/cn'

const ICON_TONE: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-brand-50 text-brand-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  orange: 'bg-orange-50 text-orange-600',
  red: 'bg-red-50 text-red-600',
  purple: 'bg-purple-50 text-purple-600',
}

interface StatsCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: Tone
  /** e.g. "+12.5%" — direction controls the arrow and colour. */
  trend?: { value: string; direction: 'up' | 'down'; positive?: boolean }
  hint?: string
  loading?: boolean
  /** Makes the whole card a link. */
  to?: string
  className?: string
}

export function StatsCard({ label, value, icon: Icon, tone = 'blue', trend, hint, loading, to, className }: StatsCardProps) {
  const positive = trend ? (trend.positive ?? trend.direction === 'up') : true
  const body = (
    <>
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <p className="text-[13px] font-medium leading-5 text-gray-500 sm:text-sm">{label}</p>
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg sm:size-10', ICON_TONE[tone])}>
          <Icon className="size-4 sm:size-5" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <p className="tabular mt-1 truncate text-2xl font-semibold leading-9 tracking-tight text-gray-900 sm:text-[28px]">{value}</p>
      )}
      {(trend || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {trend && (
            <span className={cn('inline-flex items-center gap-0.5 font-semibold', positive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.direction === 'up' ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {trend.value}
            </span>
          )}
          {hint && <span className="text-gray-500">{hint}</span>}
        </div>
      )}
    </>
  )
  const cardClass = cn('block rounded-xl border border-gray-200 bg-white p-4 shadow-card sm:p-5', to && 'transition-shadow hover:shadow-md', className)
  return to ? (
    <Link to={to} className={cardClass}>
      {body}
    </Link>
  ) : (
    <div className={cardClass}>{body}</div>
  )
}
