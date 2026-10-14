import type { PortalConfig } from '@/app/portals'
import { CURRENT_CUSTOMER_ID, CURRENT_DRIVER_ID } from '@/data/session'
import { customerService, driverService } from '@/services'
import { useQuery } from './useQuery'

/** Display name/role for the portal's signed-in demo user, kept in sync with profile edits. */
export function usePortalUser(portal: PortalConfig): PortalConfig['user'] {
  const { data: name } = useQuery(async () => {
    if (portal.key === 'customer') return (await customerService.getById(CURRENT_CUSTOMER_ID))?.name
    if (portal.key === 'driver') return (await driverService.getById(CURRENT_DRIVER_ID))?.name
    return undefined
  }, [portal.key])
  return { ...portal.user, name: name ?? portal.user.name }
}
