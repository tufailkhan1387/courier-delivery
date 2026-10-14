import { calculateQuote, type QuoteInput } from '@/features/pricing/calc'
import type { FinanceConfig, PriceQuote, RateCard } from '@/types'
import { uid } from '@/utils/id'
import { delay, getDb, setDb } from './db'

export const pricingService = {
  listRates: (): Promise<RateCard[]> => delay(getDb().rates),
  getConfig: (): Promise<FinanceConfig> => delay(getDb().financeConfig),

  /** Rates + config in one call, for synchronous quote previews in forms. */
  getPricingData: (): Promise<{ rates: RateCard[]; config: FinanceConfig }> =>
    delay({ rates: getDb().rates, config: getDb().financeConfig }),

  quote: (input: QuoteInput): Promise<PriceQuote | null> => delay(calculateQuote(input, getDb().rates, getDb().financeConfig), 150),

  saveRate(input: Omit<RateCard, 'id'> & { id?: string }): Promise<RateCard> {
    const db = getDb()
    const rate: RateCard = { ...input, id: input.id ?? uid('rate') }
    const exists = db.rates.some((r) => r.id === rate.id)
    setDb({ rates: exists ? db.rates.map((r) => (r.id === rate.id ? rate : r)) : [...db.rates, rate] })
    return delay(rate, 500)
  },

  deleteRate(id: string): Promise<void> {
    setDb({ rates: getDb().rates.filter((r) => r.id !== id) })
    return delay(undefined)
  },

  updateConfig(patch: Partial<FinanceConfig>): Promise<FinanceConfig> {
    const financeConfig = { ...getDb().financeConfig, ...patch }
    setDb({ financeConfig })
    return delay(financeConfig, 500)
  },
}
