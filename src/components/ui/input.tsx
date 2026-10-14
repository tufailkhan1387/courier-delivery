import * as LabelPrimitive from '@radix-ui/react-label'
import { ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-xs transition-colors placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 aria-invalid:border-red-400 aria-invalid:focus:ring-red-100'

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return <input type={type} className={cn(fieldClass, 'h-10', className)} {...props} />
}

export function Textarea({ className, rows = 3, ...props }: ComponentProps<'textarea'>) {
  return <textarea rows={rows} className={cn(fieldClass, 'py-2.5 leading-relaxed', className)} {...props} />
}

/** Styled native select — works directly with react-hook-form's `register`. */
export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(fieldClass, 'h-10 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
    </div>
  )
}

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return <LabelPrimitive.Root className={cn('text-sm font-medium text-gray-700', className)} {...props} />
}
