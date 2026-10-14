import { CITY_INFO } from '@/data/cities'
import type { City, FinanceConfig, PriceQuote, PricingZone, RateCard, ServiceType } from '@/types'

export function getZone(origin: City, destination: City): PricingZone {
  if (origin === destination) return 'within_city'
  return CITY_INFO[origin].region === CITY_INFO[destination].region ? 'same_zone' : 'different_zone'
}

/** Volumetric weight (cm³ / 5000) — the carrier bills whichever is greater. */
export function chargeableWeight(weightKg: number, dims?: { length: number; width: number; height: number }) {
  const volumetric = dims ? (dims.length * dims.width * dims.height) / 5000 : 0
  return Math.max(weightKg || 0, volumetric)
}

export interface QuoteInput {
  origin: City
  destination: City
  service: ServiceType
  /** Weight and dimensions describe one piece; `quantity` multiplies the chargeable weight. */
  weightKg: number
  dimensions?: { length: number; width: number; height: number }
  quantity?: number
  fragile?: boolean
  codAmount?: number
}

/** Pure pricing function. The same shape can later be served by `POST /pricing/quote`. */
export function calculateQuote(input: QuoteInput, rates: RateCard[], config: FinanceConfig): PriceQuote | null {
  const zone = getZone(input.origin, input.destination)
  const rate = rates.find((r) => r.zone === zone && r.service === input.service && r.active)
  if (!rate) return null

  const weight = chargeableWeight(input.weightKg, input.dimensions) * Math.max(1, input.quantity ?? 1)
  const extraKg = Math.max(0, Math.ceil(weight - rate.baseWeightKg))
  const base = rate.basePrice
  const weightCharge = extraKg * rate.perKgPrice
  const fuelSurcharge = Math.round(((base + weightCharge) * config.fuelSurchargePercent) / 100)
  const fragileSurcharge = input.fragile ? config.fragileSurcharge : 0
  const cod = input.codAmount ?? 0
  const codFee = cod > 0 ? Math.max(config.codFeeMin, Math.round((cod * config.codFeePercent) / 100)) : 0

  return {
    zone,
    chargeableWeightKg: Math.round(weight * 100) / 100,
    base,
    weightCharge,
    fuelSurcharge,
    fragileSurcharge,
    codFee,
    total: base + weightCharge + fuelSurcharge + fragileSurcharge + codFee,
    eta: rate.eta,
  }
}
