import { cn } from '@/utils/cn'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cn('size-8 shrink-0', className)} aria-hidden>
      <rect width="32" height="32" rx="8" fill="var(--color-brand-600)" />
      <path d="M16 7.5 23.5 11.6v8.8L16 24.5l-7.5-4.1v-8.8L16 7.5Z" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8.8 11.8 16 15.8l7.2-4M16 15.8v8.4" stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-gray-900">
          Courier<span className="text-brand-600">Pro</span>
        </span>
      )}
    </span>
  )
}
