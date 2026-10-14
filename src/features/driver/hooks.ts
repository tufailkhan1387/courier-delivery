import { CURRENT_DRIVER_ID } from '@/data/session'
import { useQuery } from '@/hooks/useQuery'
import { branchService, driverService, shipmentService } from '@/services'

/** The signed-in demo rider's profile. */
export function useCurrentDriver() {
  return useQuery(() => driverService.getById(CURRENT_DRIVER_ID), [])
}

/** Every shipment assigned to the signed-in rider (deliveries and pickups, open and closed). */
export function useMyTasks() {
  return useQuery(() => shipmentService.listByDriver(CURRENT_DRIVER_ID), [])
}

/** One shipment by id. `mine` is false when it exists but is assigned to someone else. */
export function useTask(id: string | undefined) {
  const query = useQuery(() => (id ? shipmentService.getById(id) : Promise.resolve(undefined)), [id])
  return { ...query, shipment: query.data, mine: query.data?.driverId === CURRENT_DRIVER_ID }
}

/** The rider's home branch. */
export function useMyBranch() {
  return useQuery(async () => {
    const driver = await driverService.getById(CURRENT_DRIVER_ID)
    return driver ? branchService.getById(driver.branchId) : undefined
  }, [])
}
