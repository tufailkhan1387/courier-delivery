// Customers, branches, staff and drivers.
import type { Branch, Customer, Driver, Staff } from '@/types'
import { uid } from '@/utils/id'
import { delay, getDb, setDb } from './db'

export const customerService = {
  list: (): Promise<Customer[]> => delay(getDb().customers),
  getById: (id: string): Promise<Customer | undefined> => delay(getDb().customers.find((c) => c.id === id)),
  update(id: string, patch: Partial<Customer>): Promise<Customer> {
    const db = getDb()
    const customers = db.customers.map((c) => (c.id === id ? { ...c, ...patch } : c))
    setDb({ customers })
    return delay(customers.find((c) => c.id === id)!)
  },
}

export const branchService = {
  list: (): Promise<Branch[]> => delay(getDb().branches),
  getById: (id: string): Promise<Branch | undefined> => delay(getDb().branches.find((b) => b.id === id)),
  create(input: Omit<Branch, 'id' | 'openedAt'>): Promise<Branch> {
    const branch: Branch = { ...input, id: uid('br'), openedAt: new Date().toISOString() }
    setDb({ branches: [...getDb().branches, branch] })
    return delay(branch, 500)
  },
  update(id: string, patch: Partial<Branch>): Promise<Branch> {
    const branches = getDb().branches.map((b) => (b.id === id ? { ...b, ...patch } : b))
    setDb({ branches })
    return delay(branches.find((b) => b.id === id)!, 500)
  },
}

export const staffService = {
  list: (): Promise<Staff[]> => delay(getDb().staff),
  getById: (id: string): Promise<Staff | undefined> => delay(getDb().staff.find((s) => s.id === id)),
  create(input: Omit<Staff, 'id' | 'joinedAt'>): Promise<Staff> {
    const member: Staff = { ...input, id: uid('stf'), joinedAt: new Date().toISOString() }
    setDb({ staff: [member, ...getDb().staff] })
    return delay(member, 500)
  },
  update(id: string, patch: Partial<Staff>): Promise<Staff> {
    const staff = getDb().staff.map((s) => (s.id === id ? { ...s, ...patch } : s))
    setDb({ staff })
    return delay(staff.find((s) => s.id === id)!, 500)
  },
}

export const driverService = {
  list: (): Promise<Driver[]> => delay(getDb().drivers),
  getById: (id: string): Promise<Driver | undefined> => delay(getDb().drivers.find((d) => d.id === id)),
  update(id: string, patch: Partial<Driver>): Promise<Driver> {
    const drivers = getDb().drivers.map((d) => (d.id === id ? { ...d, ...patch } : d))
    setDb({ drivers })
    return delay(drivers.find((d) => d.id === id)!)
  },
}
