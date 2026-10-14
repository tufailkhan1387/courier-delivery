import { ArrowLeftRight, Bell, CheckCheck, ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { PORTAL_LIST, type PortalConfig } from '@/app/portals'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/ui/misc'
import { usePortalUser } from '@/hooks/usePortalUser'
import { useQuery } from '@/hooks/useQuery'
import { notificationService } from '@/services'
import { useUiStore } from '@/stores/uiStore'
import type { PortalKey } from '@/types'
import { cn } from '@/utils/cn'
import { timeAgo } from '@/utils/format'
import { Breadcrumbs } from './Breadcrumbs'

/** Bell with unread count and a dropdown of the portal's notifications. */
export function NotificationsMenu({ portal }: { portal: PortalKey }) {
  const { data: notifications = [] } = useQuery(() => notificationService.list(portal), [portal])
  const unread = notifications.filter((n) => !n.read).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}>
          <Bell className="!size-5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-white">{unread}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[22rem] max-w-[calc(100vw-2rem)] p-0">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Notifications</p>
          {unread > 0 && (
            <button type="button" onClick={() => notificationService.markAllRead(portal)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
          )}
        </div>
        <ul className="max-h-80 divide-y divide-gray-100 overflow-y-auto">
          {notifications.length === 0 && <li className="px-4 py-8 text-center text-sm text-gray-500">You’re all caught up.</li>}
          {notifications.map((n) => (
            <li key={n.id} className="flex gap-3 px-4 py-3">
              <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-brand-500')} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                <p className="text-sm text-gray-600">{n.body}</p>
                <p className="mt-0.5 text-xs text-gray-400">{timeAgo(n.at)}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="border-t border-gray-200 px-4 py-2 text-center text-xs text-gray-400">Demo notifications — no SMS or email is sent.</p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Avatar menu: profile summary, settings, portal switching, sign out (returns to the portal chooser). */
export function ProfileMenu({ portal, compact }: { portal: PortalConfig; compact?: boolean }) {
  const navigate = useNavigate()
  const user = usePortalUser(portal)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-gray-100" aria-label="Account menu">
          <Avatar name={user.name} />
          {!compact && (
            <>
              <span className="hidden min-w-0 md:block">
                <span className="block max-w-36 truncate text-sm font-semibold leading-tight text-gray-900">{user.name}</span>
                <span className="block max-w-36 truncate text-xs leading-tight text-gray-500">{user.role}</span>
              </span>
              <ChevronDown className="hidden size-4 text-gray-400 md:block" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="truncate text-xs text-gray-500">{user.role}</p>
        </div>
        <DropdownMenuSeparator />
        {portal.settingsPath && (
          <DropdownMenuItem onSelect={() => navigate(portal.settingsPath!)}>
            <Settings /> Profile & settings
          </DropdownMenuItem>
        )}
        <DropdownMenuLabel>Switch portal</DropdownMenuLabel>
        {PORTAL_LIST.filter((p) => p.key !== portal.key).map((p) => (
          <DropdownMenuItem key={p.key} onSelect={() => navigate(p.basePath)}>
            <ArrowLeftRight /> {p.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/')}>
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppHeader({ portal }: { portal: PortalConfig }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen)
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/90 px-4 backdrop-blur sm:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation menu">
        <Menu className="!size-5" />
      </Button>
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={collapsed}>
        {collapsed ? <PanelLeftOpen className="!size-5" /> : <PanelLeftClose className="!size-5" />}
      </Button>
      <Breadcrumbs portal={portal} />
      <div className="ml-auto flex items-center gap-1.5">
        <Link to="/" className="mr-1 hidden rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 xl:block">
          Demo environment
        </Link>
        <NotificationsMenu portal={portal.key} />
        <ProfileMenu portal={portal} />
      </div>
    </header>
  )
}
