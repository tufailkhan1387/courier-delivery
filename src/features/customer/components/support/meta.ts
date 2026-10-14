import type { Ticket } from '@/types'

export const TICKET_CATEGORY_LABEL: Record<Ticket['category'], string> = {
  delivery: 'Delivery issue',
  billing: 'Billing & invoices',
  damage: 'Damaged or missing item',
  account: 'Account',
  other: 'Something else',
}

export const TICKET_STATUS_LABEL: Record<Ticket['status'], string> = {
  open: 'Open',
  in_progress: 'In progress',
  resolved: 'Resolved',
}

export const TICKET_PRIORITY_LABEL: Record<Ticket['priority'], string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const TICKET_CATEGORIES = Object.keys(TICKET_CATEGORY_LABEL) as Ticket['category'][]
export const TICKET_PRIORITIES = Object.keys(TICKET_PRIORITY_LABEL) as Ticket['priority'][]

export const SIMULATED_SUPPORT_NOTE = 'Support is simulated in this demo: your messages are saved in this browser, but no agent will actually reply.'
