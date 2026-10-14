import { ArrowDownToLine, ArrowUpFromLine, Boxes, CheckCircle2, Pencil, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DetailList } from '@/components/shared/DetailDrawer'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ROLE_META } from '@/data/directory'
import { formatDate, formatNumber, titleCase } from '@/utils/format'
import { BranchFormDialog } from '../components/branches/BranchFormDialog'
import { BarsChart } from '../components/charts/BarsChart'
import { ChartCard } from '../components/charts/ChartCard'
import { CHART_COLORS } from '../components/charts/chartTheme'
import { PersonCell } from '../components/PersonCell'
import { RecordNotFound } from '../components/RecordNotFound'
import { useBranches, useDrivers, useShipments, useStaff } from '../hooks'
import { branchLoad, buildSeries, sumBy } from '../lib/analytics'

export default function BranchDetailPage() {
  const { id = '' } = useParams()
  const { data: branches, loading } = useBranches()
  const { data: staff } = useStaff()
  const { data: drivers } = useDrivers()
  const { data: shipments, loading: shipmentsLoading } = useShipments()
  const [editOpen, setEditOpen] = useState(false)

  const branch = branches?.find((b) => b.id === id)
  const load = useMemo(() => branchLoad(shipments ?? [], id), [shipments, id])
  // Daily parcels booked from this facility vs delivered by it.
  const series = useMemo(() => {
    const list = shipments ?? []
    const out = buildSeries(list.filter((s) => s.originBranchId === id), 14)
    const delivered = buildSeries(list.filter((s) => s.destinationBranchId === id), 14)
    return out.map((p, i) => ({ label: p.label, originated: p.booked, delivered: delivered[i].delivered }))
  }, [shipments, id])

  if (loading && !branches) return <PageSkeleton />
  if (!branch) return <RecordNotFound entity="Branch" backTo="/admin/branches" backLabel="Back to branches" />

  const branchStaff = (staff ?? []).filter((s) => s.branchId === id)
  const branchDrivers = (drivers ?? []).filter((d) => d.branchId === id)
  const originated14 = sumBy(series, (p) => p.originated)
  const delivered14 = sumBy(series, (p) => p.delivered)

  return (
    <>
      <PageHeader
        backTo="/admin/branches"
        backLabel="Branches"
        title={
          <span className="flex flex-wrap items-center gap-3">
            {branch.name}
            <StateBadge value={branch.status} />
          </span>
        }
        description={`${branch.code} · ${branch.type === 'hub' ? 'Hub' : 'Branch'} in ${branch.city}`}
        actions={
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit branch
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="At branch" value={load.atBranch} icon={Boxes} tone="blue" hint="Parcels on the floor" loading={shipmentsLoading} />
        <StatsCard label="Inbound" value={load.inbound} icon={ArrowDownToLine} tone="purple" hint="In transit to here" loading={shipmentsLoading} />
        <StatsCard label="Outbound" value={load.outbound} icon={ArrowUpFromLine} tone="orange" hint="Booked here, not yet dispatched" loading={shipmentsLoading} />
        <StatsCard label="Delivered" value={load.delivered30} icon={CheckCircle2} tone="green" hint="Last 30 days" loading={shipmentsLoading} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="Parcel flow"
          description="Parcels booked from this facility vs delivered by it, last 14 days"
          height={280}
          loading={shipmentsLoading}
          empty={originated14 + delivered14 === 0}
          emptyText="No parcels were booked from or delivered by this facility in the last 14 days."
          summary={`In the last 14 days ${originated14} parcels originated here and ${delivered14} were delivered by this facility.`}
        >
          <BarsChart
            data={series}
            xKey="label"
            series={[
              { key: 'originated', label: 'Originated', color: CHART_COLORS.brand },
              { key: 'delivered', label: 'Delivered', color: CHART_COLORS.success },
            ]}
          />
        </ChartCard>

        <Card>
          <CardHeader title="Location & contact" />
          <CardContent>
            <DetailList
              columns={1}
              items={[
                { label: 'Address', value: branch.address },
                { label: 'City', value: branch.city },
                { label: 'Phone', value: branch.phone },
                { label: 'Manager', value: branch.managerName },
                { label: 'Daily capacity', value: `${formatNumber(branch.dailyCapacity)} parcels` },
                { label: 'Opened', value: formatDate(branch.openedAt) },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Branch staff"
            description={`${branchStaff.length} team member${branchStaff.length === 1 ? '' : 's'}`}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/admin/staff?branch=${branch.id}`}>Manage staff</Link>
              </Button>
            }
          />
          {branchStaff.length === 0 ? (
            <EmptyState icon={Users} title="No staff assigned" description="Assign team members to this branch from Staff Management." className="py-10" />
          ) : (
            <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
              {branchStaff.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <PersonCell name={s.name} sub={s.email} />
                  <div className="flex items-center gap-2">
                    <Badge>{ROLE_META[s.role].label}</Badge>
                    <StateBadge value={s.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Drivers" description="Riders based at this facility" />
          {branchDrivers.length === 0 ? (
            <EmptyState title="No drivers based here" className="py-10" />
          ) : (
            <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
              {branchDrivers.map((d) => (
                <li key={d.id}>
                  <Link to={`/admin/drivers/${d.id}`} className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                    <PersonCell name={d.name} sub={`${titleCase(d.vehicleType)} · ${d.vehiclePlate}`} />
                    <StateBadge value={d.availability} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <BranchFormDialog open={editOpen} onOpenChange={setEditOpen} branch={branch} existingCodes={(branches ?? []).map((b) => b.code)} />
    </>
  )
}
