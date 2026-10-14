import { useMemo } from 'react'
import { useQuery } from '@/hooks/useQuery'
import { branchService, customerService, driverService, shipmentService, staffService } from '@/services'

export const useShipments = () => useQuery(() => shipmentService.list(), [])
export const useBranches = () => useQuery(() => branchService.list(), [])
export const useDrivers = () => useQuery(() => driverService.list(), [])
export const useCustomers = () => useQuery(() => customerService.list(), [])
export const useStaff = () => useQuery(() => staffService.list(), [])

/** Id → record map for resolving references (branch, driver, customer) in tables. */
export function useLookup<T extends { id: string }>(items: T[] | undefined): Map<string, T> {
  return useMemo(() => new Map((items ?? []).map((item) => [item.id, item])), [items])
}
