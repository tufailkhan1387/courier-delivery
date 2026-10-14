import { CalendarPlus, CheckCircle2, Download, PackageX, Percent } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatsCard } from '@/components/shared/StatsCard'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/utils/cn'
import { formatPKR } from '@/utils/format'
import { BarsChart } from '../components/charts/BarsChart'
import { ChartCard } from '../components/charts/ChartCard'
import { CHART_COLORS } from '../components/charts/chartTheme'
import { TrendChart } from '../components/charts/TrendChart'
import { branchDataset, codDataset, driverDataset, failedDataset, failedShipments, performanceDataset, successDataset, type ReportDataset } from '../components/reports/reportData'
import { ReportTable } from '../components/reports/ReportTable'
import { useBranches, useCustomers, useDrivers, useLookup, useShipments } from '../hooks'
import { branchPerformance, buildSeries, countBy, driverPerformance, formatRate, sinceDays, successRate, sumBy } from '../lib/analytics'
import { downloadCsv } from '../lib/csv'

const RANGES = [7, 30, 90] as const
type Range = (typeof RANGES)[number]

const TABS = [
  { value: 'performance', label: 'Shipment performance' },
  { value: 'success', label: 'Delivery success' },
  { value: 'failed', label: 'Failed deliveries' },
  { value: 'branches', label: 'Branch performance' },
  { value: 'drivers', label: 'Driver performance' },
  { value: 'cod', label: 'COD report' },
] as const
type TabKey = (typeof TABS)[number]['value']

const percentLabel = (value: number) => `${value}%`

export default function ReportsPage() {
  const [range, setRange] = useState<Range>(30)
  const [tab, setTab] = useState<TabKey>('performance')
  const { data: shipments, loading } = useShipments()
  const { data: branches } = useBranches()
  const { data: drivers } = useDrivers()
  const customers = useLookup(useCustomers().data)
  const branchById = useLookup(branches)

  // 90 days is grouped by week so trends stay readable.
  const weekly = range === 90
  const periodLabel = weekly ? 'Week starting' : 'Date'

  const report = useMemo(() => {
    const list = shipments ?? []
    const since = sinceDays(range)
    const series = buildSeries(list, range, weekly ? 7 : 1)
    const failed = failedShipments(list, since)
    const branchRows = branchPerformance(list, branches ?? [], since).sort((a, b) => b.delivered + b.originated - (a.delivered + a.originated))
    const driverRows = driverPerformance(list, drivers ?? [], branchById, since)
      .filter((r) => r.delivered + r.failed > 0)
      .sort((a, b) => b.delivered - a.delivered)
    const datasets: Record<TabKey, ReportDataset> = {
      performance: performanceDataset(series, periodLabel),
      success: successDataset(series, periodLabel),
      failed: failedDataset(failed, customers),
      branches: branchDataset(branchRows),
      drivers: driverDataset(driverRows),
      cod: codDataset(series, periodLabel),
    }
    const booked = sumBy(series, (p) => p.booked)
    const delivered = sumBy(series, (p) => p.delivered)
    return {
      series,
      datasets,
      branchRows: branchRows.filter((r) => r.originated + r.delivered + r.failed > 0),
      reasons: countBy(failed, (f) => f.shipment.failureReason ?? 'Not recorded').map((r) => ({ reason: r.name, count: r.value })),
      booked,
      delivered,
      failedCount: failed.length,
      rate: successRate(delivered, failed.length),
      codAwaiting: sumBy(series, (p) => p.codAwaiting),
      codSettled: sumBy(series, (p) => p.codSettled),
    }
  }, [shipments, branches, drivers, branchById, customers, range, weekly, periodLabel])

  const dataset = report.datasets[tab]
  const rangeText = `last ${range} days`

  const exportCsv = () => {
    downloadCsv(
      `${dataset.filename}-${range}d.csv`,
      dataset.columns.map((c) => c.label),
      dataset.rows.map((row) => dataset.columns.map((c) => row[c.key])),
    )
    toast.success(`Exported ${dataset.rows.length} rows to CSV`)
  }

  const tableCard = (title: string, description: string, emptyTitle?: string) => (
    <Card>
      <CardHeader title={title} description={description} className="pb-4" />
      <ReportTable dataset={dataset} loading={loading && !shipments} emptyTitle={emptyTitle} />
    </Card>
  )

  return (
    <>
      <PageHeader
        title="Reports & Analytics"
        description="Network performance for the selected period. All figures come from demo data."
        actions={
          <>
            <div role="group" aria-label="Date range" className="inline-flex rounded-lg border border-gray-300 bg-white p-0.5 shadow-xs">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={cn('rounded-md px-3 py-1.5 text-sm font-semibold transition-colors', range === r ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-100')}
                >
                  {r} days
                </button>
              ))}
            </div>
            <Button variant="secondary" onClick={exportCsv} disabled={dataset.rows.length === 0}>
              <Download /> Export CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatsCard label="Booked" value={report.booked} icon={CalendarPlus} tone="blue" hint={`In the ${rangeText}`} loading={loading} />
        <StatsCard label="Delivered" value={report.delivered} icon={CheckCircle2} tone="green" hint={`In the ${rangeText}`} loading={loading} />
        <StatsCard label="Failed attempts" value={report.failedCount} icon={PackageX} tone="red" hint={`In the ${rangeText}`} loading={loading} />
        <StatsCard label="Success rate" value={formatRate(report.rate)} icon={Percent} tone="purple" hint="Delivered vs failed attempts" loading={loading} />
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="mt-6">
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <ChartCard
            title="Shipment volume"
            description={`Bookings, deliveries and failed attempts per ${weekly ? 'week' : 'day'}, ${rangeText}`}
            height={320}
            loading={loading}
            empty={report.booked + report.delivered + report.failedCount === 0}
            summary={`In the ${rangeText}: ${report.booked} booked, ${report.delivered} delivered, ${report.failedCount} failed attempts.`}
          >
            <TrendChart
              data={report.series}
              xKey="label"
              series={[
                { key: 'booked', label: 'Booked', color: CHART_COLORS.brand },
                { key: 'delivered', label: 'Delivered', color: CHART_COLORS.success, type: 'line' },
                { key: 'failed', label: 'Failed', color: CHART_COLORS.error, type: 'line' },
              ]}
            />
          </ChartCard>
          {tableCard('Volume by period', 'The data behind the chart')}
        </TabsContent>

        <TabsContent value="success" className="space-y-6">
          <ChartCard
            title="Delivery success rate"
            description={`Share of delivery attempts that succeeded per ${weekly ? 'week' : 'day'}, ${rangeText}`}
            height={320}
            loading={loading}
            empty={report.rate === null}
            emptyText="No delivery attempts in this period."
            summary={`Delivery success rate for the ${rangeText} is ${formatRate(report.rate)}: ${report.delivered} delivered and ${report.failedCount} failed attempts.`}
          >
            <TrendChart data={report.series} xKey="label" domain={[0, 100]} valueFormatter={percentLabel} series={[{ key: 'successRate', label: 'Success rate', color: CHART_COLORS.success, type: 'line' }]} />
          </ChartCard>
          {tableCard('Success rate by period', 'Periods without delivery attempts show no rate')}
        </TabsContent>

        <TabsContent value="failed" className="space-y-6">
          <ChartCard
            title="Failure reasons"
            description={`Why delivery attempts failed, ${rangeText}`}
            height={Math.max(180, report.reasons.length * 44 + 40)}
            loading={loading}
            empty={report.reasons.length === 0}
            emptyText="No failed delivery attempts in this period."
            summary={`Failure reasons: ${report.reasons.map((r) => `${r.reason} ${r.count}`).join(', ')}.`}
          >
            <BarsChart data={report.reasons} xKey="reason" horizontal series={[{ key: 'count', label: 'Failed attempts', color: CHART_COLORS.error }]} />
          </ChartCard>
          {tableCard('Failed deliveries', 'Shipments with a failed attempt in the period, newest first', 'No failed deliveries in this period')}
        </TabsContent>

        <TabsContent value="branches" className="space-y-6">
          <ChartCard
            title="Branch throughput"
            description={`Parcels originated and delivered per facility, ${rangeText}`}
            height={Math.max(220, report.branchRows.length * 52 + 60)}
            loading={loading}
            empty={report.branchRows.length === 0}
            summary={`Branch throughput: ${report.branchRows.map((r) => `${r.name} originated ${r.originated}, delivered ${r.delivered}`).join('; ')}.`}
          >
            <BarsChart
              data={report.branchRows}
              xKey="name"
              horizontal
              series={[
                { key: 'originated', label: 'Originated', color: CHART_COLORS.brand },
                { key: 'delivered', label: 'Delivered', color: CHART_COLORS.success },
              ]}
            />
          </ChartCard>
          {tableCard('Branch performance', 'Origin volume, deliveries and COD by facility')}
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          {tableCard('Driver performance', `Drivers with delivery attempts in the ${rangeText}, most deliveries first`, 'No driver activity in this period')}
        </TabsContent>

        <TabsContent value="cod" className="space-y-6">
          <ChartCard
            title="COD collected vs settled"
            description={`COD received on deliveries per ${weekly ? 'week' : 'day'}, split by current settlement state`}
            height={320}
            loading={loading}
            empty={report.codAwaiting + report.codSettled === 0}
            emptyText="No COD parcels were delivered in this period."
            summary={`COD collected in the ${rangeText}: ${formatPKR(report.codSettled)} settled and ${formatPKR(report.codAwaiting)} awaiting settlement.`}
          >
            <BarsChart
              data={report.series}
              xKey="label"
              stacked
              valueFormatter={formatPKR}
              series={[
                { key: 'codSettled', label: 'Settled', color: CHART_COLORS.success },
                { key: 'codAwaiting', label: 'Awaiting settlement', color: CHART_COLORS.brand },
              ]}
            />
          </ChartCard>
          {tableCard('COD by period', 'Grouped by delivery date. Mock ledger — no real payouts.')}
        </TabsContent>
      </Tabs>
    </>
  )
}
