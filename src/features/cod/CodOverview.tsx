import { Banknote, CheckCircle2, HandCoins, Info } from 'lucide-react'
import { useMemo } from 'react'
import { StatsCard } from '@/components/shared/StatsCard'
import { BarsChart } from '@/features/admin/components/charts/BarsChart'
import { ChartCard } from '@/features/admin/components/charts/ChartCard'
import { CHART_COLORS } from '@/features/admin/components/charts/chartTheme'
import { DonutChart } from '@/features/admin/components/charts/DonutChart'
import { buildSeries } from '@/features/admin/lib/analytics'
import type { Shipment } from '@/types'
import { formatCompact, formatPKR } from '@/utils/format'
import { codTotals } from './codCalc'

const compactPKR = (value: number) => `Rs ${formatCompact(value)}`

/** Full rupee amount at a size that fits a narrow KPI card. */
function Amount({ value }: { value: number }) {
  return <span className="text-2xl">{formatPKR(value)}</span>
}

/** COD KPIs plus charts of cash by stage and by delivery day. */
export function CodOverview({ shipments, loading }: { shipments: Shipment[] | undefined; loading: boolean }) {
  const totals = useMemo(() => codTotals(shipments ?? []), [shipments])
  const series = useMemo(() => buildSeries(shipments ?? [], 14), [shipments])
  const received = series.reduce((t, p) => t + p.codAwaiting + p.codSettled, 0)
  const stages = [
    { name: 'Pending collection', value: totals.pending.amount, color: CHART_COLORS.warning },
    { name: 'Collected, not settled', value: totals.collected.amount, color: CHART_COLORS.brand },
    { name: 'Settled', value: totals.settled.amount, color: CHART_COLORS.success },
  ]
  const empty = !loading && stages.every((s) => s.value === 0)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatsCard label="Pending collection" value={<Amount value={totals.pending.amount} />} icon={HandCoins} tone="orange" hint={`${totals.pending.count} shipments not yet delivered`} loading={loading} />
        <StatsCard label="Collected, not settled" value={<Amount value={totals.collected.amount} />} icon={Banknote} tone="blue" hint={`${totals.collected.count} shipments awaiting settlement`} loading={loading} />
        <StatsCard label="Settled" value={<Amount value={totals.settled.amount} />} icon={CheckCircle2} tone="green" className="sm:col-span-2 lg:col-span-1" hint={`${totals.settled.count} shipments reconciled`} loading={loading} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          className="xl:col-span-2"
          title="COD received by delivery day"
          description="Last 14 days, split by whether it has been settled since"
          height={280}
          loading={loading}
          empty={!loading && received === 0}
          emptyText="No COD parcels were delivered in the last 14 days."
          summary={`${formatPKR(received)} of COD was received on deliveries in the last 14 days.`}
        >
          <BarsChart
            data={series}
            xKey="label"
            stacked
            valueFormatter={formatPKR}
            series={[
              { key: 'codSettled', label: 'Settled', color: CHART_COLORS.success },
              { key: 'codAwaiting', label: 'Awaiting settlement', color: CHART_COLORS.brand },
            ]}
          />
        </ChartCard>

        <ChartCard title="COD by stage" description="All COD shipments" loading={loading} empty={empty} summary={`COD by stage: ${stages.map((s) => `${s.name} ${formatPKR(s.value)}`).join(', ')}.`}>
          <DonutChart data={stages} totalLabel="Total COD" valueFormatter={compactPKR} />
        </ChartCard>
      </div>

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Demo ledger: figures come from mock shipment data. No real cash, bank deposit or payout is represented.
      </p>
    </div>
  )
}
