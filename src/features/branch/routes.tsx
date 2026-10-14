import type { RouteObject } from 'react-router-dom'
import { page } from '@/routes/helpers'

export const branchRoutes: RouteObject[] = [
  { index: true, ...page(() => import('./pages/DashboardPage')) },
  { path: 'scan', ...page(() => import('./pages/ScanPage')) },
  { path: 'incoming', ...page(() => import('./pages/IncomingPage')) },
  { path: 'outgoing', ...page(() => import('./pages/OutgoingPage')) },
  { path: 'sorting', ...page(() => import('./pages/SortingPage')) },
  { path: 'inventory', ...page(() => import('./pages/InventoryPage')) },
  { path: 'returns', ...page(() => import('./pages/ReturnsPage')) },
  { path: 'manifests', ...page(() => import('./pages/ManifestsPage')) },
  { path: 'manifests/new', ...page(() => import('./pages/ManifestCreatePage')) },
  { path: 'manifests/:id', ...page(() => import('./pages/ManifestDetailsPage')) },
  { path: 'dispatch', ...page(() => import('./pages/DispatchPage')) },
  { path: 'received', ...page(() => import('./pages/ReceivedManifestsPage')) },
  { path: 'reports', ...page(() => import('./pages/ReportsPage')) },
]
