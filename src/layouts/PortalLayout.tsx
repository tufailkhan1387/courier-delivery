import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import type { PortalConfig } from '@/app/portals'
import { AppHeader } from '@/components/shared/AppHeader'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { PageSkeleton } from '@/components/shared/LoadingSkeleton'
import { NavigationProgress } from '@/routes/helpers'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

/** Desktop shell shared by the Customer, Admin and Branch portals: sidebar + sticky header + content. */
export function PortalLayout({ portal }: { portal: PortalConfig }) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-pop">
        Skip to content
      </a>
      <AppSidebar portal={portal} />
      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-64')}>
        <AppHeader portal={portal} />
        <main id="main" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <NavigationProgress />
      <ScrollRestoration />
    </div>
  )
}
