import type { ReactNode } from 'react'
import { Dialog, SheetContent } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg' | 'xl'
  children: ReactNode
}

/** Right-side detail panel for viewing a record without leaving the list. */
export function DetailDrawer({ open, onOpenChange, title, description, footer, width, children }: DetailDrawerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <SheetContent title={title} description={description} footer={footer} width={width}>
        {children}
      </SheetContent>
    </Dialog>
  )
}

/** Label/value grid used inside drawers, cards and detail pages. */
export function DetailList({ items, columns = 2, className }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2 | 3; className?: string }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', columns === 2 && 'grid-cols-2', columns === 3 && 'grid-cols-2 lg:grid-cols-3', className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-gray-900">{item.value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Titled block for grouping content inside drawers/detail pages. */
export function DetailSection({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-gray-200 py-5 first:border-t-0 first:pt-0', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  )
}
