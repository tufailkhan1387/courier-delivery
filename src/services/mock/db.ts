// In-memory mock database, seeded with demo data and persisted to LocalStorage.
// Only the service modules in this folder should touch it — UI code goes through services,
// so each service can later be re-implemented with real NestJS API calls.
import { generateSeed } from '@/data/seed'
import type { Database } from '@/types'

const STORAGE_KEY = 'courierpro.db.v2'

function load(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as Database
  } catch {
    // Corrupt or unavailable storage — fall through to a fresh seed.
  }
  return generateSeed()
}

let db: Database = load()
let version = 0
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked: the demo keeps working in memory.
  }
}
persist()

export function getDb(): Database {
  return db
}

/** Replace one or more collections immutably and notify subscribers. */
export function setDb(patch: Partial<Database>) {
  db = { ...db, ...patch }
  version++
  persist()
  listeners.forEach((l) => l())
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getVersion() {
  return version
}

export function resetDb() {
  db = generateSeed()
  version++
  persist()
  listeners.forEach((l) => l())
}

/** Simulated network latency so loading states are exercised. */
export function delay<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}
