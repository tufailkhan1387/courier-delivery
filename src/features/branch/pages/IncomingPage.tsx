import type { ColumnDef } from '@tanstack/react-table'
import { ArrowDownToLine, Bike, ClipboardCheck, ScanLine, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Shipment } from '@/types'
import { formatFriendlyDateTime } from '@/utils/format'
import { receiveParcel } from '../actions'
import { SelectionProvider } from '../components/cells'
import { codColumn, parcelColumn, receiverColumn, selectionColumn, trackingColumn } from '../components/columns'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { useBranch, useBranches, useHubShipments, useManifests, useSelection } from '../hooks'
import { branchLabel, matchesSearch } from '../lib'

const SOURCE_OPTIONS = [
  { value: 'linehaul', label: 'Linehaul' },
  { value: 'pickup', label: 'Rider pickup' },
]

const sourceOf = (s: Shipment) => (s.status === 'in_transit' ? 'linehaul' : 'pickup')

export default function IncomingPage() {
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const hub = useHubShipments()
  const manifests = useManifests()
  const [search, setSearch] = useState('')
  const [source, setSource] = useState('')
  const [origin, setOrigin] = useState('')
  const [busyIds, setBusyIds] = useState<string[]>([])
  const [openId, setOpenId] = useState<string>()

  const manifestById = useMemo(() => new Map((manifests.data ?? []).map((m) => [m.id, m])), [manifests.data])
  const originOptions = useMemo(() => [...new Set(hub.incoming.map((s) => s.sender.city))].sort().map((c) => ({ value: c, label: c })), [hub.incoming])
  const rows = useMemo(
    () =>
      hub.incoming
        .filter((s) => matchesSearch(s, search) && (!source || sourceOf(s) === source) && (!origin || s.sender.city === origin))
        .sort((a, b) => a.estimatedDelivery.localeCompare(b.estimatedDelivery)),
    [hub.incoming, search, source, origin],
  )
  const selection = useSelection(useMemo(() => rows.map((s) => s.id), [rows]))
  const opened = hub.all?.find((s) => s.id === openId)

  const receive = async (shipments: Shipment[]) => {
    if (shipments.length === 0) return
    setBusyIds(shipments.map((s) => s.id))
    try {
      for (const s of shipments) await receiveParcel(s, branch)
      toast.success(shipments.length === 1 ? `${shipments[0].trackingNumber} received` : `${shipments.length} parcels received`, {
        description: `Checked into inventory at ${branch?.name ?? 'this hub'}.`,
      })
      selection.clear()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not receive the parcels')
    } finally {
      setBusyIds([])
    }
  }

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      selectionColumn<Shipment>((s) => s.trackingNumber),
      trackingColumn,
      {
        id: 'origin',
        header: 'Coming from',
        accessorFn: (s) => s.sender.city,
        cell: ({ row }) => {
          const s = row.original
          const linehaul = sourceOf(s) === 'linehaul'
          const Icon = linehaul ? Truck : Bike
          return (
            <div className="flex items-center gap-2.5">
              <Icon className="size-4 shrink-0 text-gray-400" aria-hidden />
              <div>
                <p className="font-medium text-gray-900">{linehaul ? branchLabel(branches, s.originBranchId) : s.sender.name}</p>
                <p className="text-xs text-gray-500">{linehaul ? 'Linehaul' : `Rider pickup · ${s.sender.city}`}</p>
              </div>
            </div>
          )
        },
      },
      {
        id: 'manifest',
        header: 'Manifest',
        accessorFn: (s) => (s.manifestId ? (manifestById.get(s.manifestId)?.number ?? '') : ''),
        cell: ({ row }) => {
          const manifest = row.original.manifestId ? manifestById.get(row.original.manifestId) : undefined
          return manifest ? (
            <Link to={`/branch/manifests/${manifest.id}`} onClick={(e) => e.stopPropagation()} className="font-mono text-sm font-medium text-brand-700 hover:underline">
              {manifest.number}
            </Link>
          ) : (
            <span className="text-gray-400">—</span>
          )
        },
      },
      { accessorKey: 'estimatedDelivery', header: 'Delivery ETA', cell: ({ row }) => formatFriendlyDateTime(row.original.estimatedDelivery) },
      receiverColumn,
      parcelColumn,
      codColumn,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="soft"
            loading={busyIds.includes(row.original.id)}
            disabled={busyIds.length > 0}
            onClick={(e) => {
              e.stopPropagation()
              void receive([row.original])
            }}
          >
            Receive
          </Button>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [branch, branches, manifestById, busyIds],
  )

  const loading = hub.loading && !hub.all
  const linehaulCount = hub.incoming.filter((s) => sourceOf(s) === 'linehaul').length
  const selectedRows = rows.filter((s) => selection.selected.has(s.id))

  return (
    <>
      <PageHeader
        title="Incoming Shipments"
        description="Parcels heading to this hub on linehaul or with pickup riders."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link to="/branch/received">
                <ClipboardCheck /> Receive by manifest
              </Link>
            </Button>
            <Button asChild>
              <Link to="/branch/scan">
                <ScanLine /> Scan to receive
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard label="Expected parcels" value={hub.incoming.length} icon={ArrowDownToLine} tone="blue" loading={loading} />
        <StatsCard label="On linehaul" value={linehaulCount} icon={Truck} tone="indigo" hint="Arriving from other cities" loading={loading} />
        <StatsCard label="Rider pickups" value={hub.incoming.length - linehaulCount} icon={Bike} tone="orange" hint="Collected, on the way in" loading={loading} className="col-span-2 lg:col-span-1" />
      </div>

      <Card className="mt-6">
        <FilterBar
          actions={
            <>
              {selection.active.length > 0 && <Badge tone="blue">{selection.active.length} selected</Badge>}
              <Button disabled={selectedRows.length === 0 || busyIds.length > 0} loading={busyIds.length > 1} onClick={() => void receive(selectedRows)}>
                <ArrowDownToLine /> Receive selected
              </Button>
            </>
          }
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver, city…" />
          <FilterSelect label="Sources" value={source} onChange={setSource} options={SOURCE_OPTIONS} />
          <FilterSelect label="Origins" value={origin} onChange={setOrigin} options={originOptions} />
        </FilterBar>
        <SelectionProvider value={selection}>
          <DataTable
            columns={columns}
            data={hub.all ? rows : undefined}
            loading={hub.loading}
            onRowClick={(s) => setOpenId(s.id)}
            emptyTitle={hub.incoming.length === 0 ? 'Nothing inbound right now' : 'No parcels match your filters'}
            emptyDescription={hub.incoming.length === 0 ? 'Parcels dispatched to this hub will be listed here.' : 'Try clearing the search or filters.'}
          />
        </SelectionProvider>
      </Card>

      <ShipmentDrawer
        shipment={opened}
        onClose={() => setOpenId(undefined)}
        actions={
          opened &&
          hub.incoming.some((s) => s.id === opened.id) && (
            <Button loading={busyIds.includes(opened.id)} onClick={() => void receive([opened])}>
              Receive at hub
            </Button>
          )
        }
      />
    </>
  )
}
