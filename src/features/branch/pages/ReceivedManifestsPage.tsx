import type { ColumnDef } from '@tanstack/react-table'
import { ClipboardCheck, PackageCheck, ScanLine, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Manifest } from '@/types'
import { formatFriendlyDateTime } from '@/utils/format'
import { ManifestCard } from '../components/ManifestCard'
import { ReceiveManifestDialog } from '../components/ManifestDialogs'
import { useBranches, useDriverMap, useHubShipments, useManifests } from '../hooks'
import { branchLabel } from '../lib'

export default function ReceivedManifestsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'received' ? 'received' : 'arriving'
  const { map: branches } = useBranches()
  const drivers = useDriverMap()
  const hub = useHubShipments()
  const manifests = useManifests()
  const [receiving, setReceiving] = useState<Manifest>()

  const arriving = useMemo(
    () => (manifests.inbound ?? []).filter((m) => m.status === 'dispatched').sort((a, b) => (a.dispatchedAt ?? '').localeCompare(b.dispatchedAt ?? '')),
    [manifests.inbound],
  )
  const received = useMemo(
    () => (manifests.inbound ?? []).filter((m) => m.status === 'received').sort((a, b) => (b.receivedAt ?? '').localeCompare(a.receivedAt ?? '')),
    [manifests.inbound],
  )
  const loading = (manifests.loading && !manifests.data) || (hub.loading && !hub.all)
  const arrivingParcels = arriving.reduce((t, m) => t + m.shipmentIds.length, 0)

  const columns = useMemo<ColumnDef<Manifest, unknown>[]>(
    () => [
      { accessorKey: 'number', header: 'Manifest no.', cell: ({ row }) => <span className="font-mono text-sm font-semibold text-gray-900">{row.original.number}</span> },
      { id: 'origin', header: 'From', accessorFn: (m) => branchLabel(branches, m.originBranchId), cell: ({ getValue }) => <span className="font-medium text-gray-900">{String(getValue())}</span> },
      { id: 'parcels', header: 'Parcels', accessorFn: (m) => m.shipmentIds.length, meta: { align: 'right' }, cell: ({ getValue }) => <span className="tabular">{String(getValue())}</span> },
      { accessorKey: 'vehiclePlate', header: 'Vehicle', cell: ({ row }) => <span className="font-mono">{row.original.vehiclePlate || '—'}</span> },
      { id: 'driver', header: 'Driver', accessorFn: (m) => (m.driverId && drivers.get(m.driverId)?.name) || 'Unassigned' },
      { accessorKey: 'sealNumber', header: 'Seal no.', cell: ({ row }) => <span className="font-mono">{row.original.sealNumber}</span> },
      { id: 'dispatchedAt', header: 'Dispatched', accessorFn: (m) => m.dispatchedAt ?? '', cell: ({ row }) => (row.original.dispatchedAt ? formatFriendlyDateTime(row.original.dispatchedAt) : '—') },
      { id: 'receivedAt', header: 'Received', accessorFn: (m) => m.receivedAt ?? '', cell: ({ row }) => (row.original.receivedAt ? formatFriendlyDateTime(row.original.receivedAt) : '—') },
    ],
    [branches, drivers],
  )

  return (
    <>
      <PageHeader
        title="Received Manifests"
        description="Inbound linehaul manifests for this hub. Receive a whole manifest when the vehicle arrives, or scan parcels in one by one."
        actions={
          <Button variant="secondary" asChild>
            <Link to="/branch/scan">
              <ScanLine /> Scan parcels instead
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard label="Arriving manifests" value={arriving.length} icon={Truck} tone="blue" hint="Dispatched to this hub" loading={loading} />
        <StatsCard label="Parcels on the way" value={arrivingParcels} icon={PackageCheck} tone="indigo" hint="Across arriving manifests" loading={loading} />
        <StatsCard label="Received manifests" value={received.length} icon={ClipboardCheck} tone="green" hint="History" loading={loading} className="col-span-2 lg:col-span-1" />
      </div>

      <Tabs className="mt-6" value={tab} onValueChange={(value) => setParams(value === 'arriving' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="arriving">
            Arriving <Badge tone={tab === 'arriving' ? 'blue' : 'gray'}>{arriving.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="received">
            Received <Badge tone={tab === 'received' ? 'blue' : 'gray'}>{received.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arriving">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : arriving.length === 0 ? (
            <Card>
              <EmptyState icon={Truck} title="No manifests on the way" description="Manifests dispatched to this hub from other facilities will appear here." />
            </Card>
          ) : (
            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {arriving.map((m) => (
                <ManifestCard
                  key={m.id}
                  manifest={m}
                  shipments={hub.all ?? []}
                  branches={branches}
                  driver={m.driverId ? drivers.get(m.driverId) : undefined}
                  actions={
                    <>
                      <Button size="sm" onClick={() => setReceiving(m)}>
                        <ClipboardCheck /> Receive manifest
                      </Button>
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={`/branch/manifests/${m.id}`}>Details</Link>
                      </Button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <DataTable
              columns={columns}
              data={manifests.data ? received : undefined}
              loading={manifests.loading}
              onRowClick={(m) => navigate(`/branch/manifests/${m.id}`)}
              initialSorting={[{ id: 'receivedAt', desc: true }]}
              emptyTitle="No received manifests yet"
              emptyDescription="Manifests you receive are kept here as a record."
            />
          </Card>
        </TabsContent>
      </Tabs>

      <ReceiveManifestDialog manifest={receiving} facilityName={receiving ? branchLabel(branches, receiving.originBranchId) : ''} onClose={() => setReceiving(undefined)} />
    </>
  )
}
