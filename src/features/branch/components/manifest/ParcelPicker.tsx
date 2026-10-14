import { Plus, ScanLine, Trash2 } from 'lucide-react'
import { useMemo, useState, type KeyboardEvent } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/FilterBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import type { Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'
import { formatKg, matchesSearch } from '../../lib'

interface ParcelPickerProps {
  /** Whether a destination has been chosen yet. */
  ready: boolean
  /** Parcels that may go on this manifest (right destination, in inventory, not on another manifest). */
  eligible: Shipment[]
  /** Every shipment, used only to explain why a typed tracking number was rejected. */
  all: Shipment[]
  selectedIds: string[]
  onAdd: (ids: string[]) => void
  onRemove: (id: string) => void
  error?: string
}

/** Build the manifest's parcel list: scan/type a tracking number or pick from eligible parcels. */
export function ParcelPicker({ ready, eligible, all, selectedIds, onAdd, onRemove, error }: ParcelPickerProps) {
  const [code, setCode] = useState('')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  const selected = useMemo(() => selectedIds.map((id) => eligible.find((s) => s.id === id)).filter((s): s is Shipment => Boolean(s)), [selectedIds, eligible])
  const available = useMemo(() => eligible.filter((s) => !selectedIds.includes(s.id) && matchesSearch(s, search)), [eligible, selectedIds, search])
  const remaining = eligible.length - selected.length

  const addByCode = () => {
    const tracking = code.trim().toUpperCase()
    if (!tracking) return
    setCode('')
    const match = eligible.find((s) => s.trackingNumber === tracking)
    if (match) {
      if (selectedIds.includes(match.id)) return setMessage({ ok: false, text: `${tracking} is already on this manifest.` })
      onAdd([match.id])
      return setMessage({ ok: true, text: `${tracking} added.` })
    }
    const other = all.find((s) => s.trackingNumber === tracking)
    setMessage({
      ok: false,
      text: !other
        ? `${tracking} was not found.`
        : other.manifestId
          ? `${tracking} is already on another manifest.`
          : other.status !== 'at_origin_hub'
            ? `${tracking} is not in inventory awaiting linehaul.`
            : `${tracking} is not routed to this manifest’s destination (${other.receiver.city}).`,
    })
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    // Keep Enter from submitting the manifest form while scanning.
    e.preventDefault()
    addByCode()
  }

  if (!ready) return <EmptyState icon={ScanLine} title="Choose a destination first" description="Eligible parcels are listed once the manifest has a destination." className="py-10" />

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="manifest-scan">Add by tracking number</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id="manifest-scan"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={onKeyDown}
            placeholder="Scan or type, then press Enter"
            autoComplete="off"
            spellCheck={false}
            className="h-11 font-mono uppercase placeholder:font-sans placeholder:normal-case"
          />
          <Button variant="secondary" className="h-11" onClick={addByCode}>
            <Plus /> Add
          </Button>
        </div>
        <p aria-live="polite" className={cn('mt-1.5 min-h-4 text-xs font-medium', message?.ok ? 'text-emerald-600' : 'text-red-600')}>
          {message?.text}
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-gray-900">
            On this manifest <span className="tabular font-normal text-gray-500">({selected.length})</span>
          </h4>
          {error && (
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
          )}
        </div>
        {selected.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">No parcels added yet. Scan a parcel or pick from the list below.</p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <THead>
                <tr>
                  <TH>Tracking no.</TH>
                  <TH>Receiver</TH>
                  <TH className="text-right">Weight</TH>
                  <TH className="text-right">COD</TH>
                  <TH>
                    <span className="sr-only">Remove</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {selected.map((s) => (
                  <TR key={s.id}>
                    <TD>
                      <span className="font-mono text-sm font-semibold text-gray-900">{s.trackingNumber}</span>
                      {s.parcel.fragile && (
                        <Badge tone="orange" className="ml-2">
                          Fragile
                        </Badge>
                      )}
                    </TD>
                    <TD>{s.receiver.name}</TD>
                    <TD className="tabular text-right">{formatKg(s.parcel.weightKg)}</TD>
                    <TD className="tabular text-right">{s.codAmount > 0 ? formatPKR(s.codAmount) : '—'}</TD>
                    <TD className="text-right">
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${s.trackingNumber}`} onClick={() => onRemove(s.id)}>
                        <Trash2 />
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-sm font-semibold text-gray-900">
            Eligible parcels <span className="tabular font-normal text-gray-500">({remaining} not added)</span>
          </h4>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search eligible parcels…" className="sm:w-64" />
            <Button variant="soft" disabled={available.length === 0} onClick={() => onAdd(available.map((s) => s.id))}>
              Add all{search ? ' matching' : ''}
            </Button>
          </div>
        </div>
        {eligible.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            No parcels in inventory are waiting for this destination.
          </p>
        ) : available.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
            {remaining === 0 ? 'Every eligible parcel is on this manifest.' : 'No eligible parcels match your search.'}
          </p>
        ) : (
          <ul className="mt-2 max-h-80 divide-y divide-gray-200 overflow-y-auto rounded-lg border border-gray-200">
            {available.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-gray-900">{s.trackingNumber}</p>
                  <p className="truncate text-xs text-gray-500">
                    {s.receiver.name} · {formatKg(s.parcel.weightKg)} · {s.parcel.quantity} pc{s.codAmount > 0 ? ` · COD ${formatPKR(s.codAmount)}` : ''}
                  </p>
                </div>
                {s.parcel.fragile && <Badge tone="orange">Fragile</Badge>}
                <Button variant="secondary" size="sm" aria-label={`Add ${s.trackingNumber}`} onClick={() => onAdd([s.id])}>
                  <Plus /> Add
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
