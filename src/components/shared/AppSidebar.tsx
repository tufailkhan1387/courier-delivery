import { ArrowLeftRight, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import type { PortalConfig } from '@/app/portals'
import { Avatar, Tooltip } from '@/components/ui/misc'
import { usePortalUser } from '@/hooks/usePortalUser'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'
import { Logo } from './Logo'

function SidebarBody({ portal, collapsed, onNavigate }: { portal: PortalConfig; collapsed: boolean; onNavigate?: () => void }) {
  const user = usePortalUser(portal)
  return (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 shrink-0 items-center border-b border-gray-200', collapsed ? 'justify-center px-2' : 'px-5')}>
        <Link to={portal.basePath} onClick={onNavigate} aria-label="CourierPro home">
          <Logo compact={collapsed} />
        </Link>
      </div>

      <nav aria-label={`${portal.name} navigation`} className={cn('flex-1 space-y-5 overflow-y-auto py-4', collapsed ? 'px-2.5' : 'px-3')}>
        {!collapsed && <p className="px-3 text-xs font-semibold uppercase tracking-wider text-brand-700">{portal.name}</p>}
        {portal.nav.map((group, gi) => (
          <div key={group.label ?? gi}>
            {group.label && !collapsed && <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>}
            {group.label && collapsed && <div className="mx-2 mb-2 h-px bg-gray-200" />}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const link = (
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    aria-label={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg text-sm font-medium transition-colors',
                        collapsed ? 'size-10 justify-center' : 'px-3 py-2.5',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn('size-5 shrink-0', isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600')} aria-hidden />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                )
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip label={item.label} side="right">
                        {link}
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn('shrink-0 border-t border-gray-200', collapsed ? 'p-2.5' : 'p-3')}>
        {collapsed ? (
          <Tooltip label="Switch portal" side="right">
            <Link to="/" aria-label="Switch portal" className="flex size-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900">
              <ArrowLeftRight className="size-5" />
            </Link>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
            <Avatar name={user.name} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.role}</p>
            </div>
            <Tooltip label="Switch portal">
              <Link to="/" aria-label="Switch portal" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700">
                <ArrowLeftRight className="size-4" />
              </Link>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}

/** Fixed, collapsible sidebar on desktop; slide-over drawer on mobile. */
export function AppSidebar({ portal }: { portal: PortalConfig }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const mobileOpen = useUiStore((s) => s.mobileNavOpen)
  const setMobileOpen = useUiStore((s) => s.setMobileNavOpen)
  const { pathname } = useLocation()

  // Close the mobile drawer on navigation and on Escape.
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen])
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, setMobileOpen])

  return (
    <>
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden border-r border-gray-200 bg-white transition-[width] duration-200 lg:block', collapsed ? 'w-[68px]' : 'w-64')}>
        <SidebarBody portal={portal} collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div className="absolute inset-0 bg-gray-900/50 animate-in fade-in-0" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-pop animate-in slide-in-from-left duration-200">
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-3 top-4 rounded-md p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="size-5" />
            </button>
            <SidebarBody portal={portal} collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}
