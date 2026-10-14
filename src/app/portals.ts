import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  BarChart3,
  BookUser,
  Boxes,
  Building2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  Package,
  PackagePlus,
  PackageSearch,
  ScanLine,
  Settings,
  Shuffle,
  Tags,
  Truck,
  Undo2,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { SEED_BRANCHES, SEED_CUSTOMERS, SEED_DRIVERS, SEED_STAFF, ROLE_META } from '@/data/directory'
import { CURRENT_ADMIN, CURRENT_BRANCH_ID, CURRENT_CUSTOMER_ID, CURRENT_DRIVER_ID, CURRENT_STAFF_ID } from '@/data/session'
import type { PortalKey } from '@/types'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  /** Match the path exactly (used for portal index routes). */
  end?: boolean
}

export interface NavGroup {
  label?: string
  items: NavItem[]
}

export interface PortalConfig {
  key: PortalKey
  name: string
  tagline: string
  basePath: string
  nav: NavGroup[]
  user: { name: string; role: string }
  /** Where the profile menu's "settings" entry goes, if the portal has one. */
  settingsPath?: string
}

const customer = SEED_CUSTOMERS.find((c) => c.id === CURRENT_CUSTOMER_ID)!
const staff = SEED_STAFF.find((s) => s.id === CURRENT_STAFF_ID)!
const branch = SEED_BRANCHES.find((b) => b.id === CURRENT_BRANCH_ID)!
const driver = SEED_DRIVERS.find((d) => d.id === CURRENT_DRIVER_ID)!

export const PORTALS: Record<PortalKey, PortalConfig> = {
  customer: {
    key: 'customer',
    name: 'Customer Portal',
    tagline: 'Book, track and manage your shipments',
    basePath: '/customer',
    user: { name: customer.name, role: 'Personal account' },
    settingsPath: '/customer/settings',
    nav: [
      {
        items: [
          { label: 'Dashboard', to: '/customer', icon: LayoutDashboard, end: true },
          { label: 'Book Shipment', to: '/customer/book', icon: PackagePlus },
          { label: 'My Shipments', to: '/customer/shipments', icon: Package },
          { label: 'Track Shipment', to: '/customer/track', icon: PackageSearch },
        ],
      },
      {
        label: 'Account',
        items: [
          { label: 'Address Book', to: '/customer/addresses', icon: BookUser },
          { label: 'Payment History', to: '/customer/payments', icon: CreditCard },
          { label: 'Support Tickets', to: '/customer/support', icon: LifeBuoy },
          { label: 'Profile & Settings', to: '/customer/settings', icon: Settings },
        ],
      },
    ],
  },
  admin: {
    key: 'admin',
    name: 'Admin Console',
    tagline: 'Network-wide operations, pricing and finance',
    basePath: '/admin',
    user: { name: CURRENT_ADMIN.name, role: CURRENT_ADMIN.role },
    nav: [
      {
        label: 'Operations',
        items: [
          { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
          { label: 'Shipments', to: '/admin/shipments', icon: Package },
          { label: 'Customers', to: '/admin/customers', icon: Users },
        ],
      },
      {
        label: 'Network',
        items: [
          { label: 'Branches', to: '/admin/branches', icon: Building2 },
          { label: 'Staff', to: '/admin/staff', icon: UserCog },
          { label: 'Drivers', to: '/admin/drivers', icon: Truck },
        ],
      },
      {
        label: 'Commercial',
        items: [
          { label: 'Pricing', to: '/admin/pricing', icon: Tags },
          { label: 'COD & Finance', to: '/admin/finance', icon: Banknote },
          { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
        ],
      },
    ],
  },
  branch: {
    key: 'branch',
    name: 'Hub Workspace',
    tagline: 'Scan, sort and dispatch parcels at your facility',
    basePath: '/branch',
    user: { name: staff.name, role: `${ROLE_META[staff.role].label} · ${branch.code}` },
    nav: [
      {
        items: [
          { label: 'Dashboard', to: '/branch', icon: LayoutDashboard, end: true },
          { label: 'Scan Parcel', to: '/branch/scan', icon: ScanLine },
        ],
      },
      {
        label: 'Parcel flow',
        items: [
          { label: 'Incoming Shipments', to: '/branch/incoming', icon: ArrowDownToLine },
          { label: 'Outgoing Shipments', to: '/branch/outgoing', icon: ArrowUpFromLine },
          { label: 'Parcel Sorting', to: '/branch/sorting', icon: Shuffle },
          { label: 'Branch Inventory', to: '/branch/inventory', icon: Boxes },
          { label: 'Returns', to: '/branch/returns', icon: Undo2 },
        ],
      },
      {
        label: 'Linehaul',
        items: [
          { label: 'Manifests', to: '/branch/manifests', icon: ClipboardList },
          { label: 'Dispatch Management', to: '/branch/dispatch', icon: Truck },
          { label: 'Received Manifests', to: '/branch/received', icon: ClipboardCheck },
        ],
      },
      {
        label: 'Insights',
        items: [{ label: 'Branch Reports', to: '/branch/reports', icon: BarChart3 }],
      },
    ],
  },
  driver: {
    key: 'driver',
    name: 'Rider App',
    tagline: 'Today’s run sheet, proof of delivery and COD',
    basePath: '/driver',
    user: { name: driver.name, role: `Rider · ${SEED_BRANCHES.find((b) => b.id === driver.branchId)?.code ?? ''}` },
    settingsPath: '/driver/profile',
    nav: [
      {
        items: [
          { label: 'Home', to: '/driver', icon: LayoutDashboard, end: true },
          { label: 'Deliveries', to: '/driver/deliveries', icon: MapPinned },
          { label: 'Profile', to: '/driver/profile', icon: UserCog },
        ],
      },
    ],
  },
}

export const PORTAL_LIST: PortalConfig[] = [PORTALS.customer, PORTALS.admin, PORTALS.branch, PORTALS.driver]
