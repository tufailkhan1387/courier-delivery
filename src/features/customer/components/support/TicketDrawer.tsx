import { CheckCircle2, Info, RotateCcw, Send } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { DetailDrawer } from '@/components/shared/DetailDrawer'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Label, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/misc'
import { ticketService } from '@/services'
import type { Ticket } from '@/types'
import { cn } from '@/utils/cn'
import { formatDate, formatFriendlyDateTime } from '@/utils/format'
import { SIMULATED_SUPPORT_NOTE, TICKET_CATEGORY_LABEL, TICKET_PRIORITY_LABEL, TICKET_STATUS_LABEL } from './meta'

interface TicketDrawerProps {
  ticket: Ticket | undefined
  authorName: string
  onClose: () => void
}

/** Ticket conversation with a reply box and resolve / reopen actions. */
export function TicketDrawer({ ticket, authorName, onClose }: TicketDrawerProps) {
  const [updating, setUpdating] = useState(false)
  const threadEnd = useRef<HTMLDivElement>(null)
  const ticketId = ticket?.id
  const messageCount = ticket?.messages.length ?? 0

  // Keep the newest message in view.
  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: 'nearest' })
  }, [ticketId, messageCount])

  const resolved = ticket?.status === 'resolved'

  const setStatus = async (status: Ticket['status']) => {
    if (!ticket) return
    setUpdating(true)
    try {
      await ticketService.setStatus(ticket.id, status)
      toast.success(status === 'resolved' ? `Ticket ${ticket.number} marked as resolved` : `Ticket ${ticket.number} reopened`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'The ticket could not be updated.')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <DetailDrawer
      open={!!ticket}
      onOpenChange={(open) => !open && onClose()}
      title={ticket?.subject ?? 'Ticket'}
      description={ticket ? `${ticket.number} · opened ${formatDate(ticket.createdAt)}` : undefined}
      footer={
        ticket &&
        (resolved ? (
          <Button variant="secondary" size="sm" onClick={() => setStatus('open')} loading={updating}>
            {!updating && <RotateCcw />} Reopen ticket
          </Button>
        ) : (
          <Button variant="success" size="sm" onClick={() => setStatus('resolved')} loading={updating}>
            {!updating && <CheckCircle2 />} Mark as resolved
          </Button>
        ))
      }
    >
      {ticket && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StateBadge value={ticket.status} label={TICKET_STATUS_LABEL[ticket.status]} />
            <StateBadge value={ticket.priority} label={`${TICKET_PRIORITY_LABEL[ticket.priority]} priority`} dot={false} />
            <span className="text-sm text-gray-500">{TICKET_CATEGORY_LABEL[ticket.category]}</span>
          </div>

          {ticket.trackingNumber && (
            <p className="text-sm text-gray-600">
              Related shipment:{' '}
              <Link to={`/customer/track/${ticket.trackingNumber}`} className="font-mono font-semibold text-brand-700 hover:underline">
                {ticket.trackingNumber}
              </Link>
            </p>
          )}

          <ol className="space-y-4" aria-label="Conversation">
            {ticket.messages.map((message) => {
              const mine = message.from === 'customer'
              return (
                <li key={message.id} className={cn('flex gap-3', mine && 'flex-row-reverse')}>
                  <Avatar name={message.author} size="sm" />
                  <div className={cn('min-w-0 max-w-[85%]', mine && 'text-right')}>
                    <p className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{mine ? 'You' : `${message.author} · Support`}</span> · {formatFriendlyDateTime(message.at)}
                    </p>
                    <p
                      className={cn(
                        'mt-1 inline-block whitespace-pre-wrap break-words rounded-xl px-3.5 py-2.5 text-left text-sm leading-relaxed',
                        mine ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-800',
                      )}
                    >
                      {message.text}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
          <div ref={threadEnd} />

          {resolved ? (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">This ticket is resolved. Reopen it if you need to add another message.</p>
          ) : (
            // Keyed so the reply box starts empty for each ticket.
            <ReplyForm key={ticket.id} ticketId={ticket.id} authorName={authorName} />
          )}
        </div>
      )}
    </DetailDrawer>
  )
}

function ReplyForm({ ticketId, authorName }: { ticketId: string; authorName: string }) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const send = async (event: FormEvent) => {
    event.preventDefault()
    const text = reply.trim()
    if (!text) return
    setSending(true)
    try {
      await ticketService.reply(ticketId, authorName, text)
      setReply('')
      toast.success('Reply added', { description: 'Simulated — no agent will respond.' })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Your reply could not be saved.')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={send} className="border-t border-gray-200 pt-4">
      <Label htmlFor="ticket-reply">Add a reply</Label>
      <Textarea id="ticket-reply" rows={3} value={reply} maxLength={1000} onChange={(e) => setReply(e.target.value)} placeholder="Type your message…" className="mt-1.5" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="mt-0.5 size-3.5 shrink-0 text-gray-400" aria-hidden />
          {SIMULATED_SUPPORT_NOTE}
        </p>
        <Button type="submit" size="sm" loading={sending} disabled={!reply.trim()}>
          {!sending && <Send />} Send
        </Button>
      </div>
    </form>
  )
}
