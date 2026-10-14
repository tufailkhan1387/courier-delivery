import { Suspense } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration } from 'react-router-dom'
import { PORTALS } from '@/app/portals'
import { NotificationsMenu, ProfileMenu } from '@/components/shared/AppHeader'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { NavigationProgress } from '@/routes/helpers'
import { Logo } from '@/components/shared/Logo'
import { cn } from '@/utils/cn'

/**
 * Mobile-first shell for the rider app: compact top bar, single content column and a
 * thumb-reachable bottom tab bar. On desktop the column is centred at phone/tablet width.
 */
export function DriverLayout() {
  const portal = PORTALS.driver
  const tabs = portal.nav[0].items
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-gray-50 shadow-card">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 backdrop-blur">
          <Link to="/driver" aria-label="Rider app home" className="flex items-center gap-2">
            <Logo />
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">Rider</span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationsMenu portal="driver" />
            <ProfileMenu portal={portal} compact />
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-24 pt-5">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>

        <nav aria-label="Rider navigation" className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-xl border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <ul className="grid grid-cols-3">
            {tabs.map((tab) => (
              <li key={tab.to}>
                <NavLink
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) =>
                    cn('flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors', isActive ? 'text-brand-700' : 'text-gray-500 hover:text-gray-800')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn('flex h-7 w-14 items-center justify-center rounded-full transition-colors', isActive && 'bg-brand-50')}>
                        <tab.icon className="size-5" aria-hidden />
                      </span>
                      {tab.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <NavigationProgress />
      <ScrollRestoration />
    </div>
  )
}
