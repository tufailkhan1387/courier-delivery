import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '@/utils/cn'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-brand-600 text-white shadow-xs hover:bg-brand-700 active:bg-brand-800',
        secondary: 'border border-gray-300 bg-white text-gray-700 shadow-xs hover:bg-gray-50 active:bg-gray-100',
        soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
        destructive: 'bg-red-600 text-white shadow-xs hover:bg-red-700',
        'destructive-outline': 'border border-red-200 bg-white text-red-700 shadow-xs hover:bg-red-50',
        success: 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700',
        link: 'text-brand-700 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 px-5 text-base [&_svg]:size-5',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  ref?: Ref<HTMLButtonElement>
}

export function Button({ className, variant, size, asChild, loading, disabled, children, type, ...props }: ButtonProps) {
  if (asChild) {
    return (
      <Slot className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot>
    )
  }
  return (
    <button type={type ?? 'button'} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
