import type { RouteObject } from 'react-router-dom'
import { page } from '@/routes/helpers'

export const driverRoutes: RouteObject[] = [
  { index: true, ...page(() => import('./pages/DashboardPage')) },
  { path: 'deliveries', ...page(() => import('./pages/DeliveriesPage')) },
  { path: 'deliveries/:id', ...page(() => import('./pages/DeliveryDetailPage')) },
  { path: 'deliveries/:id/pod', ...page(() => import('./pages/ProofOfDeliveryPage')) },
  { path: 'deliveries/:id/failed', ...page(() => import('./pages/FailedDeliveryPage')) },
  { path: 'profile', ...page(() => import('./pages/ProfilePage')) },
]
