import { ArrowRight, Building2, RotateCcw, ShieldCheck, Truck, User, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/button'
import { resetDemoData } from '@/services'
import type { PortalKey } from '@/types'
import { PORTAL_LIST } from './portals'

const ICONS: Record<PortalKey, LucideIcon> = { customer: User, admin: ShieldCheck, branch: Building2, driver: Truck }

const HIGHLIGHTS: Record<PortalKey, string[]> = {
  customer: ['Book in five guided steps', 'Live-style tracking timeline', 'Address book & payments'],
  admin: ['Network KPIs and analytics', 'Pricing & rate cards', 'COD reconciliation'],
  branch: ['Keyboard-first parcel scanning', 'Manifests & dispatch', 'Inventory and returns'],
  driver: ['Mobile run sheet', 'Signature & photo proof', 'COD collection summary'],
}

/** Entry screen: stands in for sign-in until real authentication exists. */
export default function PortalSelectPage() {
  const [resetOpen, setResetOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw /> Reset demo data
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Frontend prototype</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">Courier &amp; logistics management, end to end</h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Choose a workspace to explore. Each portal runs on realistic sample data stored in your browser — no real payments, deliveries, SMS or GPS
            actions take place.
          </p>
        </div>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {PORTAL_LIST.map((portal) => {
            const Icon = ICONS[portal.key]
            return (
              <li key={portal.key}>
                <Link
                  to={portal.basePath}
                  className="group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-card transition-all hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <ArrowRight className="size-5 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-brand-600" aria-hidden />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-gray-900">{portal.name}</h2>
                  <p className="mt-1 text-sm text-gray-500">{portal.tagline}</p>
                  <ul className="mt-4 space-y-1.5 text-sm text-gray-600">
                    {HIGHLIGHTS[portal.key].map((h) => (
                      <li key={h} className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-brand-400" aria-hidden />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
                    Signed in as <span className="font-semibold text-gray-700">{portal.user.name}</span> · {portal.user.role}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      </main>

      <ConfirmationDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset demo data?"
        description="All shipments, manifests and settings you created in this browser will be replaced with a fresh sample dataset."
        confirmLabel="Reset data"
        destructive
        onConfirm={() => {
          resetDemoData()
          toast.success('Demo data has been reset.')
        }}
      />
    </div>
  )
}
