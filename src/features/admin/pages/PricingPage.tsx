import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FinanceConfigForm } from '@/features/pricing/FinanceConfigForm'
import { PriceCalculator } from '@/features/pricing/PriceCalculator'
import { RateCardsPanel } from '@/features/pricing/RateCardsPanel'
import { ZoneMatrix } from '@/features/pricing/ZoneMatrix'

const TABS = [
  { value: 'rates', label: 'Rate cards' },
  { value: 'zones', label: 'City / zone matrix' },
  { value: 'fees', label: 'Fees & calculator' },
]

export default function PricingPage() {
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab')! : 'rates'

  return (
    <>
      <PageHeader title="Pricing" description="Rate cards by zone and service, COD fees, surcharges and a quote preview." />
      <Tabs value={tab} onValueChange={(value) => setParams(value === 'rates' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="rates">
          <RateCardsPanel />
        </TabsContent>
        <TabsContent value="zones">
          <ZoneMatrix />
        </TabsContent>
        <TabsContent value="fees">
          <div className="grid items-start gap-6 xl:grid-cols-2">
            <FinanceConfigForm />
            <PriceCalculator />
          </div>
        </TabsContent>
      </Tabs>
    </>
  )
}
