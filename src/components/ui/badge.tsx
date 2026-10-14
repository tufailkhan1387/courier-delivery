import type { ComponentProps } from 'react'
import type { Tone } from '@/features/shipments/meta'
import { cn } from '@/utils/cn'

export const TONE_CLASS: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  blue: 'bg-brand-50 text-brand-700 ring-brand-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
}

export const TONE_DOT: Record<Tone, string> = {
  gray: 'bg-gray-400',
  blue: 'bg-brand-500',
  indigo: 'bg-indigo-500',
  green: 'bg-emerald-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

interface BadgeProps extends ComponentProps<'span'> {
  tone?: Tone
  dot?: boolean
}

export function Badge({ tone = 'gray', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONE_CLASS[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 rounded-full', TONE_DOT[tone])} aria-hidden />}
      {children}
    </span>
  )
}
