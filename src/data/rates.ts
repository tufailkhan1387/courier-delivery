import type { FinanceConfig, PricingZone, RateCard, ServiceType } from '@/types'

const ZONE_LABEL: Record<PricingZone, string> = {
  within_city: 'Within City',
  same_zone: 'Same Zone',
  different_zone: 'Cross Zone',
}

const SERVICE_LABEL: Record<ServiceType, string> = {
  standard: 'Standard',
  express: 'Express',
  same_day: 'Same-Day',
}

// [basePrice, perKgPrice, eta]
const MATRIX: Record<PricingZone, Record<ServiceType, [number, number, string]>> = {
  within_city: {
    standard: [220, 60, '1–2 days'],
    express: [320, 90, 'Next day'],
    same_day: [480, 130, 'Within 8 hours'],
  },
  same_zone: {
    standard: [280, 90, '2–3 days'],
    express: [420, 130, '1–2 days'],
    same_day: [750, 210, 'Same day (cut-off 11 AM)'],
  },
  different_zone: {
    standard: [350, 120, '3–5 days'],
    express: [540, 170, '1–2 days'],
    same_day: [990, 280, 'Same day by air (cut-off 10 AM)'],
  },
}

export const SEED_RATES: RateCard[] = (Object.keys(MATRIX) as PricingZone[]).flatMap((zone) =>
  (Object.keys(MATRIX[zone]) as ServiceType[]).map((service) => {
    const [basePrice, perKgPrice, eta] = MATRIX[zone][service]
    return {
      id: `rate_${zone}_${service}`,
      name: `${ZONE_LABEL[zone]} · ${SERVICE_LABEL[service]}`,
      zone,
      service,
      baseWeightKg: 1,
      basePrice,
      perKgPrice,
      eta,
      active: true,
    }
  }),
)

export const SEED_FINANCE_CONFIG: FinanceConfig = {
  codFeePercent: 1.5,
  codFeeMin: 50,
  fragileSurcharge: 100,
  fuelSurchargePercent: 8,
}
