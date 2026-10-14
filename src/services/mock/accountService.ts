// Customer account records: address book, payments, support tickets, notifications.
import type { AppNotification, Payment, PortalKey, SavedAddress, Ticket } from '@/types'
import { uid } from '@/utils/id'
import { delay, getDb, setDb } from './db'

export const addressService = {
  list: (customerId: string): Promise<SavedAddress[]> => delay(getDb().addresses.filter((a) => a.customerId === customerId)),

  save(input: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress> {
    const db = getDb()
    const address: SavedAddress = { ...input, id: input.id ?? uid('adr') }
    let addresses = db.addresses.some((a) => a.id === address.id)
      ? db.addresses.map((a) => (a.id === address.id ? address : a))
      : [...db.addresses, address]
    if (address.isDefault) {
      addresses = addresses.map((a) => (a.customerId === address.customerId ? { ...a, isDefault: a.id === address.id } : a))
    }
    setDb({ addresses })
    return delay(address, 450)
  },

  remove(id: string): Promise<void> {
    setDb({ addresses: getDb().addresses.filter((a) => a.id !== id) })
    return delay(undefined)
  },
}

export const paymentService = {
  list: (customerId: string): Promise<Payment[]> => delay(getDb().payments.filter((p) => p.customerId === customerId)),
  listAll: (): Promise<Payment[]> => delay(getDb().payments),
}

export const ticketService = {
  list: (customerId: string): Promise<Ticket[]> => delay(getDb().tickets.filter((t) => t.customerId === customerId)),

  create(input: Pick<Ticket, 'customerId' | 'subject' | 'category' | 'priority' | 'trackingNumber'> & { message: string; author: string }): Promise<Ticket> {
    const now = new Date().toISOString()
    const ticket: Ticket = {
      id: uid('tkt'),
      number: `TKT-${Math.floor(5000 + Math.random() * 4999)}`,
      customerId: input.customerId,
      subject: input.subject,
      category: input.category,
      priority: input.priority,
      trackingNumber: input.trackingNumber || undefined,
      status: 'open',
      createdAt: now,
      updatedAt: now,
      messages: [{ id: uid('msg'), from: 'customer', author: input.author, text: input.message, at: now }],
    }
    setDb({ tickets: [ticket, ...getDb().tickets] })
    return delay(ticket, 600)
  },

  reply(ticketId: string, author: string, text: string): Promise<Ticket> {
    const now = new Date().toISOString()
    const tickets = getDb().tickets.map((t) =>
      t.id === ticketId
        ? { ...t, updatedAt: now, messages: [...t.messages, { id: uid('msg'), from: 'customer' as const, author, text, at: now }] }
        : t,
    )
    setDb({ tickets })
    return delay(tickets.find((t) => t.id === ticketId)!)
  },

  setStatus(ticketId: string, status: Ticket['status']): Promise<void> {
    setDb({ tickets: getDb().tickets.map((t) => (t.id === ticketId ? { ...t, status, updatedAt: new Date().toISOString() } : t)) })
    return delay(undefined)
  },
}

export const notificationService = {
  list: (portal: PortalKey): Promise<AppNotification[]> => delay(getDb().notifications.filter((n) => n.portal === portal), 150),
  markAllRead(portal: PortalKey): Promise<void> {
    setDb({ notifications: getDb().notifications.map((n) => (n.portal === portal ? { ...n, read: true } : n)) })
    return delay(undefined, 100)
  },
}
