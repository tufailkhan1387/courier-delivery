import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-xl border border-gray-200 bg-white shadow-card', className)} {...props} />
}

interface CardHeaderProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function CardHeader({ title, description, action, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)} {...props}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('p-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex items-center gap-3 border-t border-gray-200 px-5 py-3.5', className)} {...props} />
}
