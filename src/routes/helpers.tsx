import { Compass, TriangleAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import { isRouteErrorResponse, Link, useNavigation, useRouteError } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'

/** Code-split a page module with a default export: `{ path: 'x', ...page(() => import('./pages/X')) }`. */
export function page(loader: () => Promise<{ default: ComponentType }>) {
  return { lazy: async () => ({ Component: (await loader()).default }) }
}

/** Thin top bar shown while a lazy route chunk is loading. */
export function NavigationProgress() {
  const { state } = useNavigation()
  if (state === 'idle') return null
  return <div className="fixed inset-x-0 top-0 z-50 h-0.5 animate-pulse bg-brand-600" role="progressbar" aria-label="Loading page" />
}

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Page not found"
      description="The page you’re looking for doesn’t exist or has moved."
      action={
        <Button asChild>
          <Link to="/">Back to portal selection</Link>
        </Button>
      }
      className="min-h-[60vh]"
    />
  )
}

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : 'Unexpected error'
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={message}
        action={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button asChild>
              <Link to="/">Go to start</Link>
            </Button>
          </div>
        }
      />
    </div>
  )
}
