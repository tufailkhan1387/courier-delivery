import { useCallback, useMemo, useState } from 'react'
import { CURRENT_BRANCH_ID } from '@/data/session'
import { useQuery } from '@/hooks/useQuery'
import { branchService, driverService, manifestService, scanService, shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { isInInventory, isIncoming, isLastMileReady, isLinehaulReady, isOutForDelivery, isReturnPending, toBranchMap } from './lib'

export const BRANCH_ID = CURRENT_BRANCH_ID

/** The signed-in staff member's facility. */
export function useBranch() {
  return useQuery(() => branchService.getById(BRANCH_ID), [])
}

/** All facilities plus an id → branch lookup. */
export function useBranches() {
  const query = useQuery(() => branchService.list(), [])
  const map = useMemo(() => toBranchMap(query.data), [query.data])
  return { ...query, map }
}

/** Riders and linehaul drivers based at this facility. */
export function useBranchDrivers() {
  return useQuery(async () => (await driverService.list()).filter((d) => d.branchId === BRANCH_ID), [])
}

/** Network-wide driver lookup (inbound manifests are driven by other facilities' drivers). */
export function useDriverMap() {
  const query = useQuery(() => driverService.list(), [])
  return useMemo(() => new Map((query.data ?? []).map((d) => [d.id, d])), [query.data])
}

export function useManifests() {
  const query = useQuery(() => manifestService.list(), [])
  const outbound = useMemo(() => query.data?.filter((m) => m.originBranchId === BRANCH_ID), [query.data])
  const inbound = useMemo(() => query.data?.filter((m) => m.destinationBranchId === BRANCH_ID && m.originBranchId !== BRANCH_ID), [query.data])
  return { ...query, outbound, inbound }
}

export function useScanLogs() {
  return useQuery(async () => (await scanService.list(BRANCH_ID)).sort((a, b) => b.at.localeCompare(a.at)), [])
}

/** Every shipment touching this facility, split into the working queues used across the portal. */
export function useHubShipments() {
  const query = useQuery(() => shipmentService.list(), [])
  const buckets = useMemo(() => {
    const all = query.data ?? []
    const pick = (test: (s: Shipment, branchId: string) => boolean) => all.filter((s) => test(s, BRANCH_ID))
    return {
      /** Anything with this facility as origin, destination or current location. */
      related: all.filter((s) => s.originBranchId === BRANCH_ID || s.destinationBranchId === BRANCH_ID || s.currentBranchId === BRANCH_ID),
      incoming: pick(isIncoming),
      inventory: pick(isInInventory),
      linehaul: pick(isLinehaulReady),
      lastMile: pick(isLastMileReady),
      outForDelivery: pick(isOutForDelivery),
      returnsPending: pick(isReturnPending),
    }
  }, [query.data])
  return { ...query, all: query.data, ...buckets }
}

/** Checkbox selection over a list of ids; ids that are no longer present are ignored. */
export function useSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const active = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected])
  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const toggleAll = useCallback(() => {
    setSelected((prev) => (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id)) ? new Set() : new Set(visibleIds)))
  }, [visibleIds])
  const clear = useCallback(() => setSelected(new Set()), [])
  return {
    selected,
    /** Selected ids that are still in the visible list. */
    active,
    allSelected: visibleIds.length > 0 && active.length === visibleIds.length,
    someSelected: active.length > 0 && active.length < visibleIds.length,
    toggle,
    toggleAll,
    clear,
  }
}
