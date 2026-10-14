import { Badge } from '@/components/ui/badge'
import { COD_STATUS_META, STATUS_META, type Tone } from '@/features/shipments/meta'
import type { CodStatus, ShipmentStatus } from '@/types'
import { titleCase } from '@/utils/format'

export function StatusBadge({ status, className }: { status: ShipmentStatus; className?: string }) {
  const meta = STATUS_META[status]
  return (
    <Badge tone={meta.tone} dot className={className}>
      {meta.label}
    </Badge>
  )
}

export function CodStatusBadge({ status }: { status: CodStatus }) {
  const meta = COD_STATUS_META[status]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

const GENERIC_TONES: Record<string, Tone> = {
  active: 'green',
  available: 'green',
  paid: 'green',
  resolved: 'green',
  received: 'green',
  settled: 'green',
  on_route: 'blue',
  dispatched: 'blue',
  in_progress: 'blue',
  collected: 'blue',
  pending: 'orange',
  open: 'orange',
  on_leave: 'orange',
  draft: 'gray',
  off_duty: 'gray',
  inactive: 'gray',
  suspended: 'red',
  refunded: 'purple',
  high: 'red',
  medium: 'orange',
  low: 'gray',
}

/** Badge for simple lifecycle values (active, pending, paid …) with a sensible tone. */
export function StateBadge({ value, label, dot = true }: { value: string; label?: string; dot?: boolean }) {
  return (
    <Badge tone={GENERIC_TONES[value] ?? 'gray'} dot={dot}>
      {label ?? titleCase(value)}
    </Badge>
  )
}
