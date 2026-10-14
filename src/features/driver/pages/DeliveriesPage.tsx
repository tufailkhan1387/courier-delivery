import { CheckCircle2, PackageCheck, PackageOpen, PackageX, Search, SearchX, X, type LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Shipment } from '@/types'
import { NavigateDialog } from '../components/NavigateDialog'
import { TaskCard } from '../components/TaskCard'
import { useMyTasks } from '../hooks'
import { closedAt, isPickupTask, pendingStops, TASK_GROUPS, taskContact, taskGroup, type TaskGroup } from '../tasks'

const TAB_META: Record<TaskGroup, { label: string; emptyIcon: LucideIcon; emptyTitle: string; emptyDescription: string }> = {
  pending: { label: 'Pending', emptyIcon: PackageCheck, emptyTitle: 'No pending deliveries', emptyDescription: 'Every parcel on your run sheet has been attempted.' },
  pickups: { label: 'Pickups', emptyIcon: PackageOpen, emptyTitle: 'No pickups assigned', emptyDescription: 'New pickup requests assigned by your branch will appear here.' },
  completed: { label: 'Completed', emptyIcon: CheckCircle2, emptyTitle: 'Nothing completed yet', emptyDescription: 'Delivered parcels and collected pickups will be listed here.' },
  failed: { label: 'Failed', emptyIcon: PackageX, emptyTitle: 'No failed attempts', emptyDescription: 'Deliveries you report as failed will show here for a reattempt.' },
}

function isTaskGroup(value: string | null): value is TaskGroup {
  return TASK_GROUPS.includes(value as TaskGroup)
}

function matches(shipment: Shipment, needle: string) {
  const contact = taskContact(shipment)
  return [shipment.trackingNumber, contact.name, contact.address, contact.city, contact.phone, shipment.receiver.name].some((v) => v.toLowerCase().includes(needle))
}

export default function DeliveriesPage() {
  const [params, setParams] = useSearchParams()
  const tabParam = params.get('tab')
  const tab: TaskGroup = isTaskGroup(tabParam) ? tabParam : 'pending'
  const [query, setQuery] = useState('')
  const [navTarget, setNavTarget] = useState<Shipment | null>(null)
  const { data: tasks, loading } = useMyTasks()

  const groups = useMemo(() => {
    const list = tasks ?? []
    const byRecent = (a: Shipment, b: Shipment) => closedAt(b).localeCompare(closedAt(a))
    return {
      pending: pendingStops(list),
      pickups: list.filter((s) => taskGroup(s) === 'pickups').sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      completed: list.filter((s) => taskGroup(s) === 'completed').sort(byRecent),
      failed: list.filter((s) => taskGroup(s) === 'failed').sort(byRecent),
    } satisfies Record<TaskGroup, Shipment[]>
  }, [tasks])

  const needle = query.trim().toLowerCase()
  const visible = needle ? groups[tab].filter((s) => matches(s, needle)) : groups[tab]
  const meta = TAB_META[tab]

  return (
    <div>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Assigned deliveries</h1>
        <p className="mt-1 text-sm text-gray-500">Your run sheet: deliveries, pickups and completed stops.</p>
      </header>

      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, tracking no. or address"
          aria-label="Search deliveries by recipient, tracking number or address"
          className="h-12 pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-700"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Tabs value={tab} onValueChange={(value) => setParams(value === 'pending' ? {} : { tab: value }, { replace: true })}>
        <TabsList aria-label="Filter tasks" className="grid grid-cols-4 gap-1 overflow-visible rounded-xl border-0 bg-gray-100 p-1">
          {TASK_GROUPS.map((group) => (
            <TabsTrigger
              key={group}
              value={group}
              className="mb-0 h-12 flex-col justify-center gap-0 rounded-lg border-0 p-0 text-xs data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-xs"
            >
              <span className="tabular text-base font-semibold leading-5">{loading ? '–' : groups[group].length}</span>
              {TAB_META[group].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, i) => (
                <CardSkeleton key={i} lines={3} />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card>
              {needle && groups[tab].length > 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No matches"
                  description={`Nothing in ${meta.label.toLowerCase()} matches “${query.trim()}”.`}
                  action={
                    <Button variant="secondary" onClick={() => setQuery('')}>
                      Clear search
                    </Button>
                  }
                  className="py-10"
                />
              ) : (
                <EmptyState icon={meta.emptyIcon} title={meta.emptyTitle} description={meta.emptyDescription} className="py-10" />
              )}
            </Card>
          ) : (
            <ul className="space-y-3">
              {visible.map((shipment) => (
                <li key={shipment.id}>
                  <TaskCard shipment={shipment} onNavigate={setNavTarget} />
                </li>
              ))}
            </ul>
          )}
          {!loading && needle && visible.length > 0 && (
            <p className="mt-3 text-center text-xs text-gray-500" role="status">
              Showing {visible.length} of {groups[tab].length} in {meta.label.toLowerCase()}
            </p>
          )}
        </TabsContent>
      </Tabs>

      <NavigateDialog party={navTarget ? taskContact(navTarget) : null} kind={navTarget && isPickupTask(navTarget) ? 'Pickup' : 'Delivery'} onClose={() => setNavTarget(null)} />
    </div>
  )
}
