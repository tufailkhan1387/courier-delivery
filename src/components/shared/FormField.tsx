import { AlertCircle } from 'lucide-react'
import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/input'
import { cn } from '@/utils/cn'

interface FormFieldProps {
  label: string
  /** Validation message — pass `errors.field?.message` from react-hook-form. */
  error?: string
  hint?: string
  required?: boolean
  className?: string
  /** A single input-like element. It receives `id`, `aria-invalid` and `aria-describedby` automatically. */
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }>
}

export function FormField({ label, error, hint, required, className, children }: FormFieldProps) {
  const id = useId()
  const messageId = `${id}-msg`
  const control = isValidElement(children)
    ? cloneElement(children, { id: children.props.id ?? id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error || hint ? messageId : undefined })
    : children
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={children.props.id ?? id}>
        {label}
        {required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </Label>
      {control}
      {error ? (
        <p id={messageId} role="alert" className="flex items-center gap-1 text-xs font-medium text-red-600">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  /** Grid columns on ≥sm screens for the fields inside. */
  columns?: 1 | 2 | 3
}

const COLS = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }

export function FormSection({ title, description, children, className, columns = 2 }: FormSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      <div className={cn('grid gap-4', COLS[columns])}>{children}</div>
    </section>
  )
}
