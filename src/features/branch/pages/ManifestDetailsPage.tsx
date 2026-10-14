import type { ColumnDef } from '@tanstack/react-table'
import { ArrowRight, ClipboardCheck, ClipboardX, Printer, Send, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DataTable } from '@/components/shared/DataTable'
import { DetailList } from '@/components/shared/DetailDrawer'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { usePrint } from '@/components/shared/PrintLabel'
import { StateBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useQuery } from '@/hooks/useQuery'
import { manifestService } from '@/services'
import type { Manifest, Shipment } from '@/types'
import { formatDateTime, formatPKR, titleCase } from '@/utils/format'
import { codColumn, parcelColumn, receiverColumn, trackingColumn } from '../components/columns'
import { DispatchManifestDialog, ReceiveManifestDialog } from '../components/ManifestDialogs'
import { ManifestPrint } from '../components/ManifestPrint'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { BRANCH_ID, useBranches, useDriverMap, useHubShipments } from '../hooks'
import { branchLabel, formatKg, manifestShipments, totalsOf } from '../lib'

const columns: ColumnDef<Shipment, unknown>[] = [
  trackingColumn,
  receiverColumn,
  { id: 'city', header: 'City', accessorFn: (s) => s.receiver.city },
  parcelColumn,
  codColumn,
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
]

export default function ManifestDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: manifest, loading } = useQuery(() => manifestService.getById(id), [id])
  const { map: branches } = useBranches()
  const drivers = useDriverMap()
  const hub = useHubShipments()
  const { print, portal } = usePrint()
  const [dispatching, setDispatching] = useState<Manifest>()
  const [receiving, setReceiving] = useState<Manifest>()
  const [deleting, setDeleting] = useState(false)
  const [openId, setOpenId] = useState<string>()

  const shipments = useMemo(() => (manifest && hub.all ? manifestShipments(manifest, hub.all) : undefined), [manifest, hub.all])

  // `manifest.id !== id` covers navigating between manifests while the previous one is still cached.
  if (loading && (!manifest || manifest.id !== id)) return <PageSkeleton />

  const outbound = manifest?.originBranchId === BRANCH_ID
  const inbound = manifest?.destinationBranchId === BRANCH_ID
  if (!manifest || (!outbound && !inbound)) {
    return (
      <EmptyState
        icon={ClipboardX}
        title="Manifest not found"
        description="This manifest does not exist, was deleted, or does not involve this facility."
        className="min-h-[60vh]"
        action={
          <Button asChild>
            <Link to="/branch/manifests">Back to manifests</Link>
          </Button>
        }
      />
    )
  }

  const origin = branches.get(manifest.originBranchId)
  const destination = branches.get(manifest.destinationBranchId)
  const driver = manifest.driverId ? drivers.get(manifest.driverId) : undefined
  const totals = totalsOf(shipments ?? [])
  const isDraft = manifest.status === 'draft'
  const backTo = outbound ? '/branch/manifests' : '/branch/received'

  return (
    <>
      <PageHeader
        backTo={backTo}
        backLabel={outbound ? 'Manifests' : 'Received manifests'}
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{manifest.number}</span>
            <StateBadge value={manifest.status} />
          </span>
        }
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            {branchLabel(branches, manifest.originBranchId)}
            <ArrowRight className="size-4 text-gray-400" aria-hidden />
            {branchLabel(branches, manifest.destinationBranchId)}
            <span className="text-gray-400">· {outbound ? 'Outbound' : 'Inbound'} linehaul</span>
          </span>
        }
        actions={
          <>
            <Button
              variant="secondary"
              disabled={!shipments}
              onClick={() => print(<ManifestPrint manifest={manifest} shipments={shipments ?? []} origin={origin} destination={destination} driver={driver} printedAt={new Date().toISOString()} />)}
            >
              <Printer /> Print manifest
            </Button>
            {outbound && isDraft && (
              <>
                <Button variant="destructive-outline" onClick={() => setDeleting(true)}>
                  <Trash2 /> Delete draft
                </Button>
                <Button disabled={manifest.shipmentIds.length === 0} onClick={() => setDispatching(manifest)}>
                  <Send /> Dispatch
                </Button>
              </>
            )}
            {inbound && !outbound && manifest.status === 'dispatched' && (
              <Button onClick={() => setReceiving(manifest)}>
                <ClipboardCheck /> Receive manifest
              </Button>
            )}
          </>
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Manifest details" />
          <CardContent>
            <DetailList
              columns={3}
              items={[
                { label: 'Origin', value: origin ? `${origin.name} (${origin.code})` : '—' },
                { label: 'Destination', value: destination ? `${destination.name} (${destination.code})` : '—' },
                { label: 'Status', value: titleCase(manifest.status) },
                { label: 'Vehicle', value: <span className="font-mono">{manifest.vehiclePlate || '—'}</span> },
                { label: 'Driver', value: driver ? `${driver.name} · ${driver.phone}` : 'Unassigned' },
                { label: 'Seal no.', value: <span className="font-mono">{manifest.sealNumber}</span> },
                { label: 'Created', value: formatDateTime(manifest.createdAt) },
                { label: 'Dispatched', value: !isDraft && manifest.dispatchedAt ? formatDateTime(manifest.dispatchedAt) : 'Not yet dispatched' },
                { label: 'Received', value: manifest.receivedAt ? formatDateTime(manifest.receivedAt) : 'Not yet received' },
              ]}
            />
            {manifest.notes && (
              <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Notes: </span>
                {manifest.notes}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Totals" />
          <CardContent>
            <DetailList
              items={[
                { label: 'Parcels', value: <span className="tabular text-lg">{totals.parcels}</span> },
                { label: 'Pieces', value: <span className="tabular text-lg">{totals.pieces}</span> },
                { label: 'Total weight', value: <span className="tabular text-lg">{formatKg(totals.weightKg)}</span> },
                { label: 'COD value', value: <span className="tabular text-lg">{formatPKR(totals.cod)}</span> },
                { label: 'Fragile', value: <span className="tabular text-lg">{totals.fragile}</span> },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Parcels on this manifest" description={isDraft ? 'Loaded and waiting for dispatch' : undefined} className="pb-4" />
        <DataTable
          columns={columns}
          data={shipments}
          loading={hub.loading}
          onRowClick={(s) => setOpenId(s.id)}
          emptyTitle="No parcels on this manifest"
          emptyDescription="Delete this draft and create a new manifest to load parcels."
        />
      </Card>

      <ShipmentDrawer shipment={shipments?.find((s) => s.id === openId)} onClose={() => setOpenId(undefined)} />
      <DispatchManifestDialog manifest={dispatching} facilityName={branchLabel(branches, manifest.destinationBranchId)} onClose={() => setDispatching(undefined)} />
      <ReceiveManifestDialog manifest={receiving} facilityName={branchLabel(branches, manifest.originBranchId)} onClose={() => setReceiving(undefined)} />
      <ConfirmationDialog
        open={deleting}
        onOpenChange={setDeleting}
        destructive
        title={`Delete draft ${manifest.number}?`}
        confirmLabel="Delete draft"
        description={`The ${manifest.shipmentIds.length} parcel${manifest.shipmentIds.length === 1 ? '' : 's'} on it will go back to the outgoing queue and can be added to another manifest.`}
        onConfirm={async () => {
          try {
            await manifestService.remove(manifest.id)
            toast.success(`Draft ${manifest.number} deleted`)
            navigate('/branch/manifests')
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Could not delete the draft')
          }
        }}
      />
      {portal}
    </>
  )
}
