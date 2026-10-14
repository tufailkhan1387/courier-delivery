import { AlertTriangle, Building2, RefreshCw, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DetailList } from '@/components/shared/DetailDrawer'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { PrintLabelButton } from '@/components/shared/PrintLabel'
import { ShipmentProgress, ShipmentTimeline } from '@/components/shared/ShipmentTimeline'
import { CodStatusBadge, StateBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { CATEGORY_LABEL, PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import { ProofOfDeliveryCard } from '@/features/tracking/TrackingDetails'
import { useQuery } from '@/hooks/useQuery'
import { shipmentService } from '@/services'
import type { Party } from '@/types'
import { formatDate, formatDateTime, formatPKR, titleCase } from '@/utils/format'
import { PersonCell } from '../components/PersonCell'
import { RecordNotFound } from '../components/RecordNotFound'
import { AssignDriverDialog } from '../components/shipments/AssignDriverDialog'
import { UpdateStatusDialog } from '../components/shipments/UpdateStatusDialog'
import { useBranches, useCustomers, useDrivers, useLookup } from '../hooks'
import { canAssignDriver, driverLeg, NEXT_STATUSES } from '../lib/statusRules'

function PartyBlock({ label, party }: { label: string; party: Party }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 font-semibold text-gray-900">{party.name}</p>
      <p className="text-gray-600">{party.address}</p>
      <p className="text-gray-600">
        {party.city} {party.postalCode}
      </p>
      <p className="mt-1 text-gray-500">{party.phone}</p>
      {party.email && <p className="break-all text-gray-500">{party.email}</p>}
    </div>
  )
}

export default function ShipmentDetailPage() {
  const { id = '' } = useParams()
  const { data: shipment, loading } = useQuery(() => shipmentService.getById(id), [id])
  const { data: drivers } = useDrivers()
  const branches = useLookup(useBranches().data)
  const customers = useLookup(useCustomers().data)
  const [statusOpen, setStatusOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  if (loading && !shipment) return <PageSkeleton />
  if (!shipment) return <RecordNotFound entity="Shipment" backTo="/admin/shipments" backLabel="Back to shipments" />

  const { parcel } = shipment
  const customer = customers.get(shipment.customerId)
  const driver = drivers?.find((d) => d.id === shipment.driverId)
  const currentBranch = branches.get(shipment.currentBranchId)
  const canUpdate = NEXT_STATUSES[shipment.status].length > 0
  const canAssign = canAssignDriver(shipment.status)

  return (
    <>
      <PageHeader
        backTo="/admin/shipments"
        backLabel="Shipments"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono">{shipment.trackingNumber}</span>
            <StatusBadge status={shipment.status} />
          </span>
        }
        description={`Booked ${formatDateTime(shipment.createdAt)} · ${SERVICE_META[shipment.service].label} · ${shipment.sender.city} to ${shipment.receiver.city}`}
        actions={
          <>
            <PrintLabelButton shipment={shipment} />
            <Button variant="secondary" onClick={() => setAssignOpen(true)} disabled={!canAssign}>
              <UserPlus /> {driver ? 'Reassign driver' : 'Assign driver'}
            </Button>
            <Button onClick={() => setStatusOpen(true)} disabled={!canUpdate}>
              <RefreshCw /> Update status
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          <ShipmentProgress shipment={shipment} />
          {shipment.status === 'failed' && shipment.failureReason && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              Last attempt failed: {shipment.failureReason}
            </p>
          )}
          {!canUpdate && <p className="text-sm text-gray-500">This shipment is in a final state, so its status can no longer be changed.</p>}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Sender & receiver"
              description={customer ? `Booked by ${customer.company ?? customer.name}` : undefined}
              action={
                customer && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/customers/${customer.id}`}>View customer</Link>
                  </Button>
                )
              }
            />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <PartyBlock label="Sender" party={shipment.sender} />
              <PartyBlock label="Receiver" party={shipment.receiver} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Parcel" />
            <CardContent>
              <DetailList
                columns={3}
                items={[
                  { label: 'Contents', value: parcel.description },
                  { label: 'Category', value: CATEGORY_LABEL[parcel.category] },
                  { label: 'Quantity', value: parcel.quantity },
                  { label: 'Weight', value: `${parcel.weightKg} kg` },
                  { label: 'Dimensions', value: `${parcel.dimensions.length} × ${parcel.dimensions.width} × ${parcel.dimensions.height} cm` },
                  { label: 'Declared value', value: formatPKR(parcel.declaredValue) },
                  { label: 'Handling', value: parcel.fragile ? 'Fragile' : 'Standard' },
                  { label: 'Handover', value: shipment.pickupPreference === 'pickup' ? 'Rider pickup' : 'Drop-off at branch' },
                  { label: 'Instructions', value: parcel.instructions ?? '—' },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Tracking history" description="Every scan and status update for this parcel" />
            <CardContent>
              <ShipmentTimeline events={shipment.events} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Payment & COD" />
            <CardContent>
              <DetailList
                items={[
                  { label: 'Payment method', value: PAYMENT_LABEL[shipment.paymentMethod] },
                  { label: 'Shipping cost', value: formatPKR(shipment.shippingCost) },
                  { label: 'COD amount', value: shipment.codAmount > 0 ? formatPKR(shipment.codAmount) : '—' },
                  { label: 'COD status', value: <CodStatusBadge status={shipment.codStatus} /> },
                  { label: 'Delivery attempts', value: shipment.attempts },
                  { label: shipment.deliveredAt ? 'Delivered' : 'Estimated delivery', value: formatDate(shipment.deliveredAt ?? shipment.estimatedDelivery) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Current branch" />
            <CardContent>
              {currentBranch ? (
                <Link to={`/admin/branches/${currentBranch.id}`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Building2 className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">{currentBranch.name}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {currentBranch.code} · {currentBranch.city}
                    </span>
                  </span>
                </Link>
              ) : (
                <p className="text-sm text-gray-500">Branch record unavailable.</p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                Route: {branches.get(shipment.originBranchId)?.name ?? '—'} to {branches.get(shipment.destinationBranchId)?.name ?? '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Assigned driver" description={canAssign ? `${titleCase(driverLeg(shipment).leg)} leg · ${driverLeg(shipment).city}` : undefined} />
            <CardContent>
              {driver ? (
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/admin/drivers/${driver.id}`} className="min-w-0 hover:opacity-80">
                    <PersonCell name={driver.name} sub={`${titleCase(driver.vehicleType)} · ${driver.vehiclePlate}`} />
                  </Link>
                  <StateBadge value={driver.availability} />
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-500">No driver assigned yet.</p>
                  {canAssign && (
                    <Button variant="soft" size="sm" onClick={() => setAssignOpen(true)}>
                      <UserPlus /> Assign
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <ProofOfDeliveryCard shipment={shipment} />
        </div>
      </div>

      <UpdateStatusDialog shipment={shipment} open={statusOpen} onOpenChange={setStatusOpen} />
      <AssignDriverDialog shipment={shipment} drivers={drivers ?? []} branches={branches} open={assignOpen} onOpenChange={setAssignOpen} />
    </>
  )
}
