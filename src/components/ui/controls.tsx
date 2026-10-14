// Small form controls: Checkbox, Switch, RadioGroup.
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import * as RadioPrimitive from '@radix-ui/react-radio-group'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { Check } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-gray-300 bg-white shadow-xs transition-colors data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-600 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        <Check className="size-3.5 text-white" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        'inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-gray-200 p-0.5 transition-colors data-[state=checked]:bg-brand-600 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  )
}

export const RadioGroup = RadioPrimitive.Root

/**
 * Selectable card radio item. Children render inside the card; the selected state
 * is styled through `data-[state=checked]`.
 */
export function RadioCard({ className, children, ...props }: ComponentProps<typeof RadioPrimitive.Item>) {
  return (
    <RadioPrimitive.Item
      className={cn(
        'group relative w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-gray-300 data-[state=checked]:border-brand-600 data-[state=checked]:bg-brand-25 data-[state=checked]:ring-1 data-[state=checked]:ring-brand-600 disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <span className="absolute right-3.5 top-3.5 flex size-[18px] items-center justify-center rounded-full border border-gray-300 bg-white group-data-[state=checked]:border-brand-600 group-data-[state=checked]:bg-brand-600">
        <RadioPrimitive.Indicator className="size-1.5 rounded-full bg-white" />
      </span>
    </RadioPrimitive.Item>
  )
}
