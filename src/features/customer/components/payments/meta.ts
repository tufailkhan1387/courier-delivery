import type { Payment } from '@/types'

export const PAYMENT_STATUS_LABEL: Record<Payment['status'], string> = { paid: 'Paid', pending: 'Pending', refunded: 'Refunded' }
