import type { ColumnDef } from '@tanstack/react-table'
import { Banknote, PackageX, RotateCcw, Undo2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { FormField } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FAILURE_REASONS } from '@/features/shipments/meta'
import type { Shipment } from '@/types'
import { formatFriendlyDateTime, formatPKR } from '@/utils/format'
import { returnToSender, scheduleReattempt } from '../actions'
import { ageColumn, codColumn, receiverColumn, routeColumn, trackingColumn } from '../components/columns'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { BRANCH_ID, useBranch, useHubShipments } from '../hooks'
import { lastEventAt, matchesSearch, totalsOf } from '../lib'

const REASON_OPTIONS = FAILURE_REASONS.map((r) => ({ value: r, label: r }))

const historyColumns: ColumnDef<Shipment, unknown>[] = [
  trackingColumn,
  routeColumn,
  receiverColumn,
  { id: 'reason', header: 'Failure reason', accessorFn: (s) => s.failureReason ?? '—' },
  { accessorKey: 'attempts', header: 'Attempts', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.attempts}</span> },
  { id: 'returnedAt', header: 'Returned', accessorFn: (s) => lastEventAt(s), cell: ({ row }) => formatFriendlyDateTime(lastEventAt(row.original)) },
]

export default function ReturnsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'history' ? 'history' : 'pending'
  const { data: branch } = useBranch()
  const hub = useHubShipments()
  const [search, setSearch] = useState('')
  const [reason, setReason] = useState('')
  const [reattempting, setReattempting] = useState<Shipment>()
  const [returning, setReturning] = useState<Shipment>()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<string>()
  const loading = hub.loading && !hub.all

  const pending = useMemo(() => hub.returnsPending.filter((s) => matchesSearch(s, search) && (!reason || s.failureReason === reason)), [hub.returnsPending, search, reason])
  const history = useMemo(
    () =>
      (hub.all ?? [])
        .filter((s) => s.status === 'returned' && (s.destinationBranchId === BRANCH_ID || s.originBranchId === BRANCH_ID))
        .sort((a, b) => lastEventAt(b).localeCompare(lastEventAt(a))),
    [hub.all],
  )

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      trackingColumn,
      receiverColumn,
      {
        id: 'reason',
        header: 'Failure reason',
        accessorFn: (s) => s.failureReason ?? '',
        cell: ({ row }) => <span className="font-medium text-red-700">{row.original.failureReason ?? 'Not recorded'}</span>,
      },
      {
        accessorKey: 'attempts',
        header: 'Attempts',
        meta: { align: 'right' },
        cell: ({ row }) => <Badge tone={row.original.attempts >= 2 ? 'red' : 'orange'}>{row.original.attempts}</Badge>,
      },
      ageColumn,
      codColumn,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <span className="inline-flex gap-2" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="soft"
              onClick={() => {
                setNote('')
                setReattempting(row.original)
              }}
            >
              <RotateCcw /> Schedule reattempt
            </Button>
            <Button size="sm" variant="destructive-outline" onClick={() => setReturning(row.original)}>
              <Undo2 /> Return to sender
            </Button>
          </span>
        ),
      },
    ],
    [],
  )

  const confirmReattempt = async () => {
    if (!reattempting) return
    setBusy(true)
    try {
      await scheduleReattempt(reattempting, note)
      toast.success(`Reattempt scheduled for ${reattempting.trackingNumber}`, { description: 'The parcel is back in the last-mile queue (demo — the customer is not notified).' })
      setReattempting(undefined)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not schedule the reattempt')
    } finally {
      setBusy(false)
    }
  }

  const opened = hub.all?.find((s) => s.id === openId)
  const pendingCod = totalsOf(hub.returnsPending).cod

  return (
    <>
      <PageHeader title="Returns" description="Failed deliveries waiting for a decision, and parcels already returned to their senders." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard label="Awaiting decision" value={hub.returnsPending.length} icon={PackageX} tone="red" hint="Reattempt or return" loading={loading} />
        <StatsCard label="COD at risk" value={formatPKR(pendingCod)} icon={Banknote} tone="orange" hint="On failed parcels" loading={loading} />
        <StatsCard label="Returned to sender" value={history.length} icon={Undo2} tone="gray" hint="History" loading={loading} className="col-span-2 lg:col-span-1" />
      </div>

      <Tabs className="mt-6" value={tab} onValueChange={(value) => setParams(value === 'pending' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="pending">
            Awaiting decision <Badge tone={tab === 'pending' ? 'blue' : 'gray'}>{hub.returnsPending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">
            Returned history <Badge tone={tab === 'history' ? 'blue' : 'gray'}>{history.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <FilterBar>
              <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver…" />
              <FilterSelect label="Reasons" value={reason} onChange={setReason} options={REASON_OPTIONS} className="sm:w-64" />
            </FilterBar>
            <DataTable
              columns={columns}
              data={loading ? undefined : pending}
              loading={hub.loading}
              initialSorting={[{ id: 'age', desc: true }]}
              onRowClick={(s) => setOpenId(s.id)}
              emptyTitle={hub.returnsPending.length === 0 ? 'No failed deliveries to review' : 'No parcels match your filters'}
              emptyDescription={hub.returnsPending.length === 0 ? 'Failed delivery attempts come back to the hub and are listed here.' : 'Try clearing the search or reason filter.'}
            />
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <DataTable
              columns={historyColumns}
              data={loading ? undefined : history}
              loading={hub.loading}
              onRowClick={(s) => setOpenId(s.id)}
              emptyTitle="No returned parcels"
              emptyDescription="Parcels returned to their senders will be kept here as a record."
            />
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(reattempting)} onOpenChange={(open) => !open && !busy && setReattempting(undefined)}>
        <DialogContent title="Schedule reattempt" description={reattempting ? `${reattempting.trackingNumber} · ${reattempting.receiver.name}` : undefined} size="sm">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void confirmReattempt()
            }}
          >
            <p className="mb-4 text-sm text-gray-600">
              The parcel returns to <span className="font-semibold text-gray-900">At Destination Hub</span> so it can be assigned to a rider again
              {reattempting?.failureReason ? ` (last attempt: ${reattempting.failureReason.toLowerCase()})` : ''}.
            </p>
            <FormField label="Note for the next attempt" hint="Optional — added to the tracking history.">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="e.g. Receiver asked for delivery after 5 PM" />
            </FormField>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setReattempting(undefined)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Schedule reattempt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        open={Boolean(returning)}
        onOpenChange={(open) => !open && setReturning(undefined)}
        destructive
        title="Return to sender?"
        confirmLabel="Return parcel"
        description={
          <>
            <span className="font-mono font-semibold text-gray-900">{returning?.trackingNumber}</span> will be marked Returned and routed back to {returning?.sender.name} in{' '}
            {returning?.sender.city}. Delivery attempts end and any COD is cancelled.
          </>
        }
        onConfirm={async () => {
          if (!returning) return
          try {
            await returnToSender(returning, branch)
            toast.success(`${returning.trackingNumber} marked as returned`, { description: 'Demo — no return vehicle or sender notification is triggered.' })
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not return the parcel')
          }
        }}
      />

      <ShipmentDrawer shipment={opened} onClose={() => setOpenId(undefined)} />
    </>
  )
}
