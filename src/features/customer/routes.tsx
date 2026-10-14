import type { RouteObject } from 'react-router-dom'
import { page } from '@/routes/helpers'

export const customerRoutes: RouteObject[] = [
  { index: true, ...page(() => import('./pages/DashboardPage')) },
  { path: 'book', ...page(() => import('./pages/BookShipmentPage')) },
  { path: 'shipments', ...page(() => import('./pages/MyShipmentsPage')) },
  { path: 'track', ...page(() => import('./pages/TrackShipmentPage')) },
  { path: 'track/:trackingNumber', ...page(() => import('./pages/TrackShipmentPage')) },
  { path: 'addresses', ...page(() => import('./pages/AddressBookPage')) },
  { path: 'payments', ...page(() => import('./pages/PaymentHistoryPage')) },
  { path: 'support', ...page(() => import('./pages/SupportTicketsPage')) },
  { path: 'settings', ...page(() => import('./pages/SettingsPage')) },
]
