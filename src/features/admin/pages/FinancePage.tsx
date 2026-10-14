import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CodOverview } from '@/features/cod/CodOverview'
import { CollectionsTable } from '@/features/cod/CollectionsTable'
import { DriverCash } from '@/features/cod/DriverCash'
import { PendingSettlements } from '@/features/cod/PendingSettlements'
import { TransactionsTable } from '@/features/cod/TransactionsTable'
import { useBranches, useCustomers, useDrivers, useLookup, useShipments } from '../hooks'

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'collections', label: 'Collections' },
  { value: 'settlements', label: 'Pending settlements' },
  { value: 'drivers', label: 'Driver cash' },
  { value: 'transactions', label: 'Transactions' },
]

export default function FinancePage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab')! : 'overview'
  const { data: shipments, loading } = useShipments()
  const { data: drivers } = useDrivers()
  const customers = useLookup(useCustomers().data)
  const branches = useLookup(useBranches().data)
  const driverById = useLookup(drivers)

  return (
    <>
      <PageHeader title="COD & Finance" description="Cash on delivery from collection to settlement. Demo ledger — no real money is handled." />
      <Tabs value={tab} onValueChange={(value) => setParams(value === 'overview' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <CodOverview shipments={shipments} loading={loading} />
        </TabsContent>
        <TabsContent value="collections">
          <CollectionsTable shipments={shipments} customers={customers} drivers={driverById} loading={loading} />
        </TabsContent>
        <TabsContent value="settlements">
          <PendingSettlements shipments={shipments} customers={customers} loading={loading} />
        </TabsContent>
        <TabsContent value="drivers">
          <DriverCash shipments={shipments} drivers={drivers} branches={branches} loading={loading} />
        </TabsContent>
        <TabsContent value="transactions">
          <TransactionsTable customers={customers} drivers={driverById} branches={branches} />
        </TabsContent>
      </Tabs>
    </>
  )
}
