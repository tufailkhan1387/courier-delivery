// Field-level Zod schemas shared by the customer portal forms.
import { z } from 'zod'
import { CITIES } from '@/data/cities'

export const PHONE_HINT = 'Format: +92 3XX XXXXXXX'

/** Lenient Pakistani phone check: digits, spaces, dashes and an optional +, 10–13 digits in total. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    return /^\+?[\d\s()-]+$/.test(value) && digits.length >= 10 && digits.length <= 13
  }, 'Enter a valid phone number, e.g. +92 300 1234567')

export const emailSchema = z.email('Enter a valid email address')
export const optionalEmailSchema = z.union([z.literal(''), emailSchema])

export const citySchema = z.enum(CITIES, { error: 'Select a city' })

export const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, 'Enter a 5-digit postal code')

export const nameSchema = z.string().trim().min(2, 'Enter the full name').max(80, 'Keep the name under 80 characters')

export const streetAddressSchema = z.string().trim().min(5, 'Enter the complete street address').max(160, 'Keep the address under 160 characters')
