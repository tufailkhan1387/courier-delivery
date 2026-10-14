import { createBrowserRouter } from 'react-router-dom'
import { PORTALS } from '@/app/portals'
import { adminRoutes } from '@/features/admin/routes'
import { branchRoutes } from '@/features/branch/routes'
import { customerRoutes } from '@/features/customer/routes'
import { driverRoutes } from '@/features/driver/routes'
import { DriverLayout } from '@/layouts/DriverLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { NotFoundPage, page, RouteErrorPage } from './helpers'

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', ...page(() => import('@/app/PortalSelectPage')) },
      { path: '/customer', element: <PortalLayout portal={PORTALS.customer} />, children: [...customerRoutes, { path: '*', element: <NotFoundPage /> }] },
      { path: '/admin', element: <PortalLayout portal={PORTALS.admin} />, children: [...adminRoutes, { path: '*', element: <NotFoundPage /> }] },
      { path: '/branch', element: <PortalLayout portal={PORTALS.branch} />, children: [...branchRoutes, { path: '*', element: <NotFoundPage /> }] },
      { path: '/driver', element: <DriverLayout />, children: [...driverRoutes, { path: '*', element: <NotFoundPage /> }] },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
