import type { ReactNode } from 'react'
import { Avatar } from '@/components/ui/misc'

/** Avatar + name + secondary line, for people and organisations in tables and lists. */
export function PersonCell({ name, sub }: { name: string; sub?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{name}</p>
        {sub && <p className="truncate text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}
