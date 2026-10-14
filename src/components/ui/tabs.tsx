import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export const Tabs = TabsPrimitive.Root

/** Underlined tab bar. Scrolls horizontally on narrow screens. */
export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('flex gap-6 overflow-x-auto border-b border-gray-200', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        '-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-0.5 pb-3 pt-1 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700 data-[state=active]:border-brand-600 data-[state=active]:text-brand-700',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('mt-5 focus-visible:outline-none', className)} {...props} />
}
