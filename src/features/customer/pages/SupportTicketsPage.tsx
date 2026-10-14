import { ChevronRight, Info, LifeBuoy, MessageSquare, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Ticket } from '@/types'
import { timeAgo } from '@/utils/format'
import { SIMULATED_SUPPORT_NOTE, TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL, TICKET_STATUS_LABEL } from '../components/support/meta'
import { NewTicketDialog } from '../components/support/NewTicketDialog'
import { TicketDrawer } from '../components/support/TicketDrawer'
import { useCurrentCustomer, useMyShipments, useMyTickets } from '../hooks'

const STATUS_OPTIONS = (Object.keys(TICKET_STATUS_LABEL) as Ticket['status'][]).map((value) => ({ value, label: TICKET_STATUS_LABEL[value] }))

export default function SupportTicketsPage() {
  const { data: tickets, loading } = useMyTickets()
  const { data: shipments } = useMyShipments()
  const { data: customer } = useCurrentCustomer()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [creating, setCreating] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!tickets) return undefined
    const needle = search.trim().toLowerCase()
    return tickets
      .filter((t) => (!status || t.status === status) && (!needle || [t.subject, t.number, t.trackingNumber ?? ''].some((v) => v.toLowerCase().includes(needle))))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [tickets, search, status])

  const selected = tickets?.find((t) => t.id === selectedId)
  const authorName = customer?.name ?? 'Customer'
  const hasFilters = !!(search || status)
  const openCount = tickets?.filter((t) => t.status !== 'resolved').length ?? 0

  const newTicketButton = (
    <Button onClick={() => setCreating(true)}>
      <Plus /> New ticket
    </Button>
  )

  return (
    <>
      <PageHeader title="Support Tickets" description="Raise an issue about a shipment or your account and follow the conversation." actions={newTicketButton} />

      <p className="mb-6 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-card">
        <Info className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
        {SIMULATED_SUPPORT_NOTE}
      </p>

      <Card>
        <FilterBar actions={tickets ? <span className="text-sm text-gray-500">{openCount} active</span> : undefined}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search subject, ticket or tracking no." />
          <FilterSelect label="Statuses" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </FilterBar>

        <div className="border-t border-gray-200">
          {loading && !filtered ? (
            <TableSkeleton rows={4} columns={3} />
          ) : !filtered?.length ? (
            <EmptyState
              icon={LifeBuoy}
              title={hasFilters ? 'No tickets match your filters' : 'No support tickets'}
              description={hasFilters ? 'Try a different search term or status.' : 'If something goes wrong with a shipment, raise a ticket here.'}
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('')
                      setStatus('')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  newTicketButton
                )
              }
            />
          ) : (
            <ul className="divide-y divide-gray-200">
              {filtered.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(ticket.id)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/70 focus-visible:bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="tabular text-xs font-semibold text-gray-500">{ticket.number}</span>
                        <StateBadge value={ticket.status} label={TICKET_STATUS_LABEL[ticket.status]} />
                        <StateBadge value={ticket.priority} label={`${TICKET_PRIORITY_LABEL[ticket.priority]} priority`} dot={false} />
                      </div>
                      <p className="mt-1.5 break-words text-sm font-semibold text-gray-900">{ticket.subject}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500">
                        <span>{TICKET_CATEGORY_LABEL[ticket.category]}</span>
                        {ticket.trackingNumber && (
                          <>
                            <span aria-hidden>·</span>
                            <span className="font-mono">{ticket.trackingNumber}</span>
                          </>
                        )}
                        <span aria-hidden>·</span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="size-3.5" aria-hidden />
                          {ticket.messages.length}
                        </span>
                        <span aria-hidden>·</span>
                        <span>Updated {timeAgo(ticket.updatedAt)}</span>
                      </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-gray-400" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {creating && (
        <NewTicketDialog
          authorName={authorName}
          shipments={shipments ?? []}
          onClose={() => setCreating(false)}
          onCreated={(ticket) => {
            setCreating(false)
            setSelectedId(ticket.id)
          }}
        />
      )}

      <TicketDrawer ticket={selected} authorName={authorName} onClose={() => setSelectedId(null)} />
    </>
  )
}
