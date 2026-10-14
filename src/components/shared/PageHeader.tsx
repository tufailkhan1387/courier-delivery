import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Right-aligned actions (buttons). Wraps below the title on mobile. */
  actions?: ReactNode
  /** Optional "back" link shown above the title on detail pages. */
  backTo?: string
  backLabel?: string
  className?: string
}

export function PageHeader({ title, description, actions, backTo, backLabel = 'Back', className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {backTo && (
        <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
    </div>
  )
}
