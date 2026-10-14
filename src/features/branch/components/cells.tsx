// Small cell components shared by the hub tables.
import { createContext, useContext, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/controls'
import { cn } from '@/utils/cn'

interface SelectionApi {
  selected: Set<string>
  allSelected: boolean
  someSelected: boolean
  toggle: (id: string) => void
  toggleAll: () => void
}

const SelectionContext = createContext<SelectionApi | null>(null)

/** Wrap a DataTable that uses `selectionColumn` so its checkboxes can read the selection state. */
export function SelectionProvider({ value, children }: { value: SelectionApi; children: ReactNode }) {
  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function HeaderCheckbox() {
  const selection = useContext(SelectionContext)
  if (!selection) return null
  return (
    <Checkbox
      aria-label="Select all rows"
      checked={selection.allSelected ? true : selection.someSelected ? 'indeterminate' : false}
      onCheckedChange={selection.toggleAll}
      className="data-[state=indeterminate]:border-brand-600 data-[state=indeterminate]:bg-brand-600"
    />
  )
}

export function RowCheckbox({ id, label }: { id: string; label: string }) {
  const selection = useContext(SelectionContext)
  if (!selection) return null
  return (
    <span className="flex" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <Checkbox aria-label={`Select ${label}`} checked={selection.selected.has(id)} onCheckedChange={() => selection.toggle(id)} />
    </span>
  )
}

export function Tracking({ value, className }: { value: string; className?: string }) {
  return <span className={cn('font-mono text-sm font-semibold text-gray-900', className)}>{value}</span>
}

export function FragileBadge() {
  return <Badge tone="orange">Fragile</Badge>
}
