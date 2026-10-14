import type { RouteObject } from 'react-router-dom'
import { page } from '@/routes/helpers'

export const adminRoutes: RouteObject[] = [
  { index: true, ...page(() => import('./pages/DashboardPage')) },
  { path: 'shipments', ...page(() => import('./pages/ShipmentsPage')) },
  { path: 'shipments/:id', ...page(() => import('./pages/ShipmentDetailPage')) },
  { path: 'customers', ...page(() => import('./pages/CustomersPage')) },
  { path: 'customers/:id', ...page(() => import('./pages/CustomerDetailPage')) },
  { path: 'branches', ...page(() => import('./pages/BranchesPage')) },
  { path: 'branches/:id', ...page(() => import('./pages/BranchDetailPage')) },
  { path: 'staff', ...page(() => import('./pages/StaffPage')) },
  { path: 'drivers', ...page(() => import('./pages/DriversPage')) },
  { path: 'drivers/:id', ...page(() => import('./pages/DriverDetailPage')) },
  { path: 'pricing', ...page(() => import('./pages/PricingPage')) },
  { path: 'finance', ...page(() => import('./pages/FinancePage')) },
  { path: 'reports', ...page(() => import('./pages/ReportsPage')) },
]
