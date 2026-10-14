import { ArrowDownToLine, ArrowRight, Boxes, ClipboardCheck, ClipboardList, ScanLine, Shuffle, Truck, Undo2, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { formatFriendlyDateTime, timeAgo } from '@/utils/format'
import { ChartCard } from '../components/ChartCard'
import { CHART } from '../components/chartTheme'
import { RecentScansTable } from '../components/scan/RecentScansTable'
import { BRANCH_ID, useBranch, useBranches, useHubShipments, useManifests } from '../hooks'
import { branchLabel, manifestEta } from '../lib'
import { dailyThroughput } from '../reports'

const QUICK_LINKS: { label: string; hint: string; to: string; icon: LucideIcon }[] = [
  { label: 'Sort parcels', hint: 'Group inventory into destination bins', to: '/branch/sorting', icon: Shuffle },
  { label: 'Create manifest', hint: 'Load parcels for linehaul', to: '/branch/manifests/new', icon: ClipboardList },
  { label: 'Dispatch board', hint: 'Vehicles and riders on the road', to: '/branch/dispatch', icon: Truck },
  { label: 'Handle returns', hint: 'Reattempt or return failed parcels', to: '/branch/returns', icon: Undo2 },
]

function ScanCallToAction() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const code = value.trim().toUpperCase()
    navigate(code ? `/branch/scan?code=${encodeURIComponent(code)}` : '/branch/scan')
  }
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 bg-brand-600 px-5 py-6 text-white lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <ScanLine className="size-6" aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Scan parcel</h2>
            <p className="mt-0.5 text-sm text-brand-100">Receive, sort and send out parcels with one scan. Works with a hardware scanner or the keyboard.</p>
          </div>
        </div>
        <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tracking number"
            aria-label="Tracking number to scan"
            className="h-12 border-transparent font-mono uppercase placeholder:font-sans placeholder:normal-case focus:ring-white/30 sm:w-64"
          />
          <Button type="submit" variant="secondary" size="lg" className="border-transparent">
            <ScanLine /> Open scanner
          </Button>
        </form>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const hub = useHubShipments()
  const manifests = useManifests()
  const loading = hub.loading && !hub.all

  const openManifests = useMemo(() => manifests.outbound?.filter((m) => m.status === 'draft') ?? [], [manifests.outbound])
  const arriving = useMemo(
    () => (manifests.inbound ?? []).filter((m) => m.status === 'dispatched').sort((a, b) => (a.dispatchedAt ?? '').localeCompare(b.dispatchedAt ?? '')),
    [manifests.inbound],
  )
  const throughput = useMemo(() => dailyThroughput(hub.all ?? [], BRANCH_ID, 7), [hub.all])
  const hasThroughput = throughput.some((d) => d.received + d.dispatched > 0)

  return (
    <>
      <PageHeader
        title={branch?.name ?? 'Hub dashboard'}
        description={branch ? `${branch.code} · ${branch.address} · Shift lead ${branch.managerName}` : 'Loading facility…'}
        actions={
          <Button variant="secondary" asChild>
            <Link to="/branch/manifests/new">
              <ClipboardList /> Create manifest
            </Link>
          </Button>
        }
      />

      <ScanCallToAction />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatsCard label="Incoming expected" value={hub.incoming.length} icon={ArrowDownToLine} tone="blue" hint="On linehaul or with pickup riders" loading={loading} to="/branch/incoming" />
        <StatsCard label="In inventory" value={hub.inventory.length} icon={Boxes} tone="indigo" hint={branch ? `of ${branch.dailyCapacity.toLocaleString()} daily capacity` : undefined} loading={loading} to="/branch/inventory" />
        <StatsCard label="Awaiting dispatch" value={hub.linehaul.length + hub.lastMile.length} icon={ClipboardList} tone="purple" hint={`${hub.linehaul.length} linehaul · ${hub.lastMile.length} last-mile`} loading={loading} to="/branch/outgoing" />
        <StatsCard label="Out for delivery" value={hub.outForDelivery.length} icon={Truck} tone="orange" hint="With riders right now" loading={loading} to="/branch/dispatch" />
        <StatsCard label="Failed / returns pending" value={hub.returnsPending.length} icon={Undo2} tone="red" hint="Need a decision" loading={loading} to="/branch/returns" />
        <StatsCard label="Manifests open" value={openManifests.length} icon={ClipboardCheck} tone="gray" hint="Drafts not yet dispatched" loading={manifests.loading && !manifests.data} to="/branch/manifests?status=draft" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Parcels processed"
          description="Received into and dispatched from this hub, last 7 days"
          className="xl:col-span-2"
          loading={loading}
          empty={!hasThroughput}
          action={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/branch/reports">
                Reports <ArrowRight />
              </Link>
            </Button>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={throughput} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={4}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="label" tick={CHART.tick} tickLine={false} axisLine={false} />
              <YAxis tick={CHART.tick} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={CHART.tooltip} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#667085' }} />
              <Bar dataKey="received" name="Received" fill={CHART.brand} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="dispatched" name="Dispatched" fill={CHART.brandLight} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <Card>
          <CardHeader
            title="Inbound manifests due"
            description="Linehaul vehicles heading to this hub"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/branch/received">
                  View all <ArrowRight />
                </Link>
              </Button>
            }
          />
          <CardContent>
            {manifests.loading && !manifests.data ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : arriving.length === 0 ? (
              <p className="text-sm text-gray-500">No inbound manifests are on the road right now.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {arriving.slice(0, 5).map((m) => {
                  const eta = manifestEta(m, hub.all ?? [])
                  return (
                    <li key={m.id} className="py-3 first:pt-0 last:pb-0">
                      <Link to={`/branch/manifests/${m.id}`} className="group flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold text-gray-900 group-hover:text-brand-700">{m.number}</p>
                          <p className="truncate text-xs text-gray-500">
                            From {branchLabel(branches, m.originBranchId)} · {m.shipmentIds.length} parcels
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-xs text-gray-500">
                          <p className="font-medium text-gray-700">{eta ? `Due ${formatFriendlyDateTime(eta)}` : 'On the road'}</p>
                          {m.dispatchedAt && <p>Left {timeAgo(m.dispatchedAt)}</p>}
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader
            title="Recent scans"
            description="Latest scan events at this facility"
            className="pb-4"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/branch/scan">
                  Open scanner <ArrowRight />
                </Link>
              </Button>
            }
          />
          <RecentScansTable limit={6} hidePagination />
        </Card>

        <Card>
          <CardHeader title="Quick links" />
          <CardContent className="space-y-2">
            {QUICK_LINKS.map(({ label, hint, to, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:border-brand-200 hover:bg-brand-25">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{label}</span>
                  <span className="block truncate text-xs text-gray-500">{hint}</span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-gray-400" aria-hidden />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
