import { useCallback, useState } from 'react'

const keyFor = (branchId: string) => `courierpro.branch.sorted.${branchId}`

function load(branchId: string): Set<string> {
  try {
    const raw = localStorage.getItem(keyFor(branchId))
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {
    // Unavailable or corrupt storage — start with nothing sorted.
  }
  return new Set()
}

/**
 * Shipment ids the floor team has physically placed in their sort bin.
 * This is a local working aid (not part of the shipment record), kept in localStorage per branch.
 */
export function useSortedParcels(branchId: string) {
  const [sorted, setSorted] = useState(() => load(branchId))

  const update = useCallback(
    (mutate: (next: Set<string>) => void) => {
      setSorted((prev) => {
        const next = new Set(prev)
        mutate(next)
        try {
          localStorage.setItem(keyFor(branchId), JSON.stringify([...next]))
        } catch {
          // Storage blocked: the selection still works for this visit.
        }
        return next
      })
    },
    [branchId],
  )

  const setMany = useCallback(
    (ids: string[], value: boolean) =>
      update((next) => {
        for (const id of ids) {
          if (value) next.add(id)
          else next.delete(id)
        }
      }),
    [update],
  )

  return { sorted, setMany }
}
