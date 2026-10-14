import { Search, X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { fieldClass, NativeSelect } from '@/components/ui/input'
import { cn } from '@/utils/cn'

interface SearchInputProps extends Omit<ComponentProps<'input'>, 'onChange' | 'value'> {
  value: string
  onChange: (value: string) => void
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={props['aria-label'] ?? placeholder}
        className={cn(fieldClass, 'h-10 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

interface FilterSelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  /** Label of the "no filter" option; its value is ''. */
  allLabel?: string
  className?: string
}

export function FilterSelect({ label, value, onChange, options, allLabel, className }: FilterSelectProps) {
  return (
    <div className={cn('w-full sm:w-44', className)}>
      <NativeSelect aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{allLabel ?? `All ${label.toLowerCase()}`}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </div>
  )
}

/** Toolbar row above tables: search + filters on the left, actions on the right. */
export function FilterBar({ children, actions, className }: { children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between', className)}>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
