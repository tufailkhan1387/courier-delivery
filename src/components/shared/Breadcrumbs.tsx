import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { PortalConfig } from '@/app/portals'
import { titleCase } from '@/utils/format'

interface Crumb {
  label: string
  to: string
}

/** Builds crumbs from the URL: portal → nav section → sub-page (ids render as "Details"). */
export function buildCrumbs(portal: PortalConfig, pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: portal.name, to: portal.basePath }]
  const items = portal.nav.flatMap((g) => g.items)
  const section = items
    .filter((i) => !i.end && (pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]
  if (!section) {
    if (pathname.replace(/\/$/, '') === portal.basePath) crumbs.push({ label: items.find((i) => i.end)?.label ?? 'Dashboard', to: portal.basePath })
    return crumbs
  }
  crumbs.push({ label: section.label, to: section.to })
  const rest = pathname.slice(section.to.length).split('/').filter(Boolean)
  let path = section.to
  for (const segment of rest) {
    path += `/${segment}`
    const isWord = /^[a-z-]+$/.test(segment)
    crumbs.push({ label: isWord ? titleCase(segment) : 'Details', to: path })
  }
  return crumbs
}

export function Breadcrumbs({ portal }: { portal: PortalConfig }) {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(portal, pathname)
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          return (
            <li key={i} className={last ? 'flex min-w-0 items-center gap-1.5' : 'hidden items-center gap-1.5 sm:flex'}>
              {i > 0 && <ChevronRight className="hidden size-4 shrink-0 text-gray-300 sm:block" aria-hidden />}
              {last ? (
                <span aria-current="page" className="truncate font-semibold text-gray-900">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className="whitespace-nowrap font-medium text-gray-500 transition-colors hover:text-gray-900">
                  {crumb.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
