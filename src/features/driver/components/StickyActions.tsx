import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Action bar pinned above the rider tab bar. Renders a spacer so page content
 * is never hidden behind it.
 */
export function StickyActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <div className="h-16" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 mx-auto w-full max-w-xl border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className={cn('flex gap-3', className)}>{children}</div>
      </div>
    </>
  )
}
