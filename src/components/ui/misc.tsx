// Skeleton, Avatar, Separator, Tooltip and table primitives.
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { initials } from '@/utils/format'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-gray-200/70', className)} {...props} />
}

const AVATAR_TINTS = ['bg-brand-100 text-brand-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700']

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const AVATAR_SIZE = { sm: 'size-8 text-xs', md: 'size-9 text-sm', lg: 'size-11 text-sm', xl: 'size-16 text-xl' }

/** Initials avatar with a stable tint derived from the name. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const tint = AVATAR_TINTS[[...name].reduce((t, c) => t + c.charCodeAt(0), 0) % AVATAR_TINTS.length]
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', AVATAR_SIZE[size], tint, className)} aria-hidden>
      {initials(name)}
    </span>
  )
}

export function Separator({ className, ...props }: ComponentProps<'div'>) {
  return <div role="separator" className={cn('h-px w-full bg-gray-200', className)} {...props} />
}

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ label, children, side = 'top' }: { label: ReactNode; children: ReactNode; side?: 'top' | 'right' | 'bottom' | 'left' }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-pop animate-in fade-in-0 zoom-in-95"
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}

// ---- Table primitives (used by DataTable and for simple static tables) ----

export function Table({ className, ...props }: ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function THead({ className, ...props }: ComponentProps<'thead'>) {
  return <thead className={cn('border-b border-gray-200 bg-gray-50', className)} {...props} />
}

export function TBody({ className, ...props }: ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y divide-gray-200', className)} {...props} />
}

export function TR({ className, ...props }: ComponentProps<'tr'>) {
  return <tr className={cn('transition-colors hover:bg-gray-50/70', className)} {...props} />
}

export function TH({ className, ...props }: ComponentProps<'th'>) {
  return <th className={cn('whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', className)} {...props} />
}

export function TD({ className, ...props }: ComponentProps<'td'>) {
  return <td className={cn('whitespace-nowrap px-5 py-3.5 text-gray-600', className)} {...props} />
}
