import type { DeepPartialSkipArrayKey, FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { calculateQuote } from '@/features/pricing/calc'
import { CATEGORY_LABEL } from '@/features/shipments/meta'
import type { FinanceConfig, ParcelCategory, Party, PriceQuote, RateCard, ServiceType } from '@/types'
import { citySchema, emailSchema, nameSchema, optionalEmailSchema, phoneSchema, postalCodeSchema, streetAddressSchema } from '../../validation'

export const CATEGORIES = Object.keys(CATEGORY_LABEL) as ParcelCategory[]
export const SERVICES: ServiceType[] = ['standard', 'express', 'same_day']

const partyBase = {
  name: nameSchema,
  phone: phoneSchema,
  address: streetAddressSchema,
  city: citySchema,
  postalCode: postalCodeSchema,
}

const dimension = (label: string) =>
  z
    .number({ error: `Enter the ${label}` })
    .min(1, 'Minimum 1 cm')
    .max(200, 'Maximum 200 cm')

export const bookingSchema = z
  .object({
    sender: z.object({ ...partyBase, email: emailSchema }),
    receiver: z.object({ ...partyBase, email: optionalEmailSchema }),
    parcel: z.object({
      category: z.enum(CATEGORIES, { error: 'Select a category' }),
      description: z.string().trim().min(3, 'Describe the contents (at least 3 characters)').max(120, 'Keep the description under 120 characters'),
      quantity: z.number({ error: 'Enter the number of pieces' }).int('Use a whole number').min(1, 'At least 1 piece').max(50, 'Maximum 50 pieces per booking'),
      weightKg: z.number({ error: 'Enter the weight' }).positive('Weight must be more than 0 kg').max(70, 'Maximum 70 kg per shipment'),
      length: dimension('length'),
      width: dimension('width'),
      height: dimension('height'),
      declaredValue: z.number({ error: 'Enter the declared value' }).min(0, 'Value cannot be negative').max(1_000_000, 'Maximum declared value is Rs 1,000,000'),
      fragile: z.boolean(),
      instructions: z.string().trim().max(200, 'Keep instructions under 200 characters'),
    }),
    service: z.enum(SERVICES),
    pickupPreference: z.enum(['pickup', 'dropoff']),
    paymentMethod: z.enum(['cod', 'card', 'wallet', 'account']),
    codAmount: z.number({ error: 'Enter the amount to collect' }).min(0, 'Amount cannot be negative').max(500_000, 'Maximum COD amount is Rs 500,000'),
  })
  .superRefine((values, ctx) => {
    if (values.paymentMethod === 'cod' && !(values.codAmount > 0)) {
      ctx.addIssue({ code: 'custom', path: ['codAmount'], message: 'Enter the amount the rider should collect' })
    }
  })

export type BookingValues = z.infer<typeof bookingSchema>

export const BOOKING_STEPS = [
  { title: 'Sender', description: 'Pickup details' },
  { title: 'Receiver', description: 'Delivery details' },
  { title: 'Parcel', description: 'What you’re sending' },
  { title: 'Service', description: 'Speed & payment' },
  { title: 'Review', description: 'Confirm booking' },
]

const PARTY_KEYS = ['name', 'phone', 'email', 'address', 'city', 'postalCode'] as const

/** Fields validated before leaving each step (the review step validates everything on submit). */
export const STEP_FIELDS: FieldPath<BookingValues>[][] = [
  PARTY_KEYS.map((key) => `sender.${key}` as const),
  PARTY_KEYS.map((key) => `receiver.${key}` as const),
  ['parcel.category', 'parcel.description', 'parcel.quantity', 'parcel.weightKg', 'parcel.length', 'parcel.width', 'parcel.height', 'parcel.declaredValue', 'parcel.fragile', 'parcel.instructions'],
  ['service', 'pickupPreference', 'paymentMethod', 'codAmount'],
]

export function toParty(values: BookingValues['sender'] | BookingValues['receiver']): Party {
  return {
    name: values.name.trim(),
    phone: values.phone.trim(),
    email: values.email || undefined,
    address: values.address.trim(),
    city: values.city,
    postalCode: values.postalCode.trim(),
  }
}

export interface PricingData {
  rates: RateCard[]
  config: FinanceConfig
}

export type ServiceQuotes = Record<ServiceType, PriceQuote | null>

const finite = (value: number | undefined) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)

/** Live quotes for every service level from the (possibly half-filled) form values. */
export function computeQuotes(values: DeepPartialSkipArrayKey<BookingValues>, pricing: PricingData | undefined): ServiceQuotes | undefined {
  const origin = values.sender?.city || undefined
  const destination = values.receiver?.city || undefined
  if (!pricing || !origin || !destination) return undefined
  const parcel = values.parcel
  const quoteFor = (service: ServiceType) =>
    calculateQuote(
      {
        origin,
        destination,
        service,
        weightKg: finite(parcel?.weightKg),
        dimensions: { length: finite(parcel?.length), width: finite(parcel?.width), height: finite(parcel?.height) },
        quantity: finite(parcel?.quantity),
        fragile: !!parcel?.fragile,
        codAmount: values.paymentMethod === 'cod' ? finite(values.codAmount) : 0,
      },
      pricing.rates,
      pricing.config,
    )
  return { standard: quoteFor('standard'), express: quoteFor('express'), same_day: quoteFor('same_day') }
}
