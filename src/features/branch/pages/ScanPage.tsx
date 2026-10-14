import { ScanLine } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { Label } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/misc'
import { STATUS_META } from '@/features/shipments/meta'
import { shipmentService } from '@/services'
import type { Shipment } from '@/types'
import { cn } from '@/utils/cn'
import { logLookup, receiveParcel, returnToSender, scheduleReattempt } from '../actions'
import { AssignRiderDialog } from '../components/AssignRiderDialog'
import { Kbd, ParcelPanel } from '../components/scan/ParcelPanel'
import { RecentScansTable } from '../components/scan/RecentScansTable'
import { ScanFeedback, type ScanFeedbackState, type ScanTone } from '../components/scan/ScanFeedback'
import { BRANCH_ID, useBranch, useBranches, useHubShipments } from '../hooks'
import { assessScan, type ScanAction } from '../lib'

interface ScanResult {
  shipment: Shipment
  /** Set once an action has been applied, so Enter does not fire a second action by accident. */
  applied?: string
}

const UNKNOWN_SAMPLE = 'CPLHE00000000'

export default function ScanPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: branch } = useBranch()
  const { map: branches } = useBranches()
  const hub = useHubShipments()

  const inputRef = useRef<HTMLInputElement>(null)
  const scanSeq = useRef(0)
  const feedbackSeq = useRef(0)
  const handledCode = useRef<string | null>(null)
  const [value, setValue] = useState('')
  const [pending, setPending] = useState(0)
  const [acting, setActing] = useState(false)
  const [autoApply, setAutoApply] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [feedback, setFeedback] = useState<ScanFeedbackState | null>(null)
  const [counters, setCounters] = useState({ scanned: 0, received: 0, exceptions: 0 })
  const [riderOpen, setRiderOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const assessment = useMemo(() => (result ? assessScan(result.shipment, BRANCH_ID) : null), [result])
  const dialogOpen = riderOpen || returnOpen

  const notify = useCallback((tone: ScanTone, title: string, message: string) => {
    feedbackSeq.current += 1
    setFeedback({ tone, title, message, key: feedbackSeq.current })
  }, [])
  const bump = (key: keyof typeof counters) => setCounters((c) => ({ ...c, [key]: c[key] + 1 }))

  // Keep the scan field focused so a hardware scanner can fire continuously.
  useEffect(() => {
    if (dialogOpen) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [dialogOpen, result, feedback])

  const applyReceive = async (shipment: Shipment, showResult: boolean) => {
    const next = await receiveParcel(shipment, branch)
    bump('received')
    if (showResult) {
      setResult({ shipment: next, applied: `Received — now ${STATUS_META[next.status].label}` })
      notify('success', 'Received', `${next.trackingNumber} checked in at ${branch?.name ?? 'this hub'}.`)
    }
  }

  const scan = async (raw: string) => {
    const tracking = raw.trim().toUpperCase()
    if (!tracking) return
    const seq = ++scanSeq.current
    const isLatest = () => seq === scanSeq.current
    setValue('')
    setResult(null)
    setFeedback(null)
    setPending((n) => n + 1)
    try {
      const shipment = await shipmentService.getByTrackingNumber(tracking)
      bump('scanned')
      if (!shipment) {
        bump('exceptions')
        if (isLatest()) notify('error', 'Unknown tracking number', `${tracking} was not found. Check the label and scan again.`)
        return
      }
      const verdict = assessScan(shipment, BRANCH_ID)
      if (verdict.actions.length === 0) {
        bump('exceptions')
        await logLookup(shipment, `Exception — ${verdict.headline.toLowerCase()}`)
        if (isLatest()) {
          setResult({ shipment })
          notify('warning', verdict.headline, `${tracking} · ${verdict.message}`)
        }
        return
      }
      if (autoApply && verdict.actions[0].key === 'receive') {
        await applyReceive(shipment, isLatest())
        return
      }
      if (isLatest()) {
        setResult({ shipment })
        notify(verdict.tone, verdict.headline, `${tracking} · ${verdict.message}`)
      }
    } catch (err) {
      if (isLatest()) notify('error', 'Scan failed', err instanceof Error ? err.message : 'Something went wrong. Scan again.')
    } finally {
      setPending((n) => n - 1)
    }
  }

  const runAction = async (action: ScanAction) => {
    if (!result || acting) return
    const { shipment } = result
    if (action.key === 'out_for_delivery') return setRiderOpen(true)
    if (action.key === 'return') return setReturnOpen(true)
    if (action.key === 'manifest') {
      return navigate(shipment.manifestId ? `/branch/manifests/${shipment.manifestId}` : `/branch/manifests/new?destination=${shipment.destinationBranchId}&parcel=${shipment.id}`)
    }
    setActing(true)
    try {
      if (action.key === 'receive') await applyReceive(shipment, true)
      else {
        const next = await scheduleReattempt(shipment)
        setResult({ shipment: next, applied: 'Reattempt scheduled — back in last-mile queue' })
        notify('success', 'Reattempt scheduled', `${next.trackingNumber} is ready to go out again.`)
      }
    } catch (err) {
      notify('error', 'Action failed', err instanceof Error ? err.message : 'Could not update the parcel.')
    } finally {
      setActing(false)
    }
  }

  // Deep link from the dashboard: /branch/scan?code=<tracking number>
  const initialCode = params.get('code')
  useEffect(() => {
    if (!initialCode || handledCode.current === initialCode) return
    handledCode.current = initialCode
    setParams({}, { replace: true })
    void scan(initialCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode])

  const clear = () => {
    scanSeq.current += 1
    setValue('')
    setResult(null)
    setFeedback(null)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (value.trim()) void scan(value)
    // Enter on an empty field applies the primary action of the parcel on screen.
    else if (result && !result.applied && assessment?.actions[0]) void runAction(assessment.actions[0])
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      clear()
    } else if (e.key.toLowerCase() === 'r' && !value && result && !result.applied) {
      const returnAction = assessment?.actions.find((a) => a.key === 'return')
      if (returnAction) {
        e.preventDefault()
        void runAction(returnAction)
      }
    }
  }

  const samples = useMemo(() => {
    const unrelated = hub.all?.find((s) => s.status === 'in_transit' && !hub.related.includes(s))
    const list: { label: string; tracking: string }[] = [
      ...hub.incoming.slice(0, 2).map((s) => ({ label: 'Inbound', tracking: s.trackingNumber })),
      ...hub.lastMile.slice(0, 1).map((s) => ({ label: 'Last-mile', tracking: s.trackingNumber })),
      ...hub.linehaul.slice(0, 1).map((s) => ({ label: 'Linehaul', tracking: s.trackingNumber })),
      ...hub.returnsPending.slice(0, 1).map((s) => ({ label: 'Failed', tracking: s.trackingNumber })),
      ...(unrelated ? [{ label: 'Other hub', tracking: unrelated.trackingNumber }] : []),
      { label: 'Unknown', tracking: UNKNOWN_SAMPLE },
    ]
    return list
  }, [hub.all, hub.related, hub.incoming, hub.lastMile, hub.linehaul, hub.returnsPending])

  return (
    <>
      <PageHeader title="Scan Parcel" description={`Scan parcels in and out of ${branch?.name ?? 'the hub'}. Keyboard and hardware scanners both work.`} />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-5 xl:col-span-2">
          <Card>
            <CardContent className="space-y-4">
              <form onSubmit={onSubmit}>
                <Label htmlFor="scan-input" className="text-sm font-semibold text-gray-900">
                  Tracking number or barcode
                </Label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <div className="relative min-w-0 flex-1">
                    <ScanLine className="pointer-events-none absolute left-4 top-1/2 size-6 -translate-y-1/2 text-gray-400" aria-hidden />
                    <input
                      id="scan-input"
                      ref={inputRef}
                      value={value}
                      onChange={(e) => setValue(e.target.value.toUpperCase())}
                      onKeyDown={onKeyDown}
                      autoFocus
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      enterKeyHint="go"
                      placeholder="CPLHE00000000"
                      aria-describedby="scan-help"
                      className="h-16 w-full rounded-xl border-2 border-gray-300 bg-white pl-14 pr-4 font-mono text-2xl font-semibold uppercase tracking-wider text-gray-900 shadow-xs transition-colors placeholder:font-normal placeholder:text-gray-300 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 sm:text-3xl"
                    />
                  </div>
                  <Button type="submit" size="lg" className="h-16 px-8">
                    Scan
                  </Button>
                </div>
                <p id="scan-help" className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>Enter</Kbd> scan / apply primary action
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>R</Kbd> return to sender (failed parcels, empty field)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>Esc</Kbd> clear
                  </span>
                </p>
              </form>

              <ScanFeedback feedback={feedback} busy={pending > 0} />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Sample parcels for this demo</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {hub.loading && !hub.all
                    ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-8 w-44 rounded-full" />)
                    : samples.map((sample) => (
                        <button
                          key={`${sample.label}-${sample.tracking}`}
                          type="button"
                          onClick={() => void scan(sample.tracking)}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-600 shadow-xs transition-colors hover:border-brand-300 hover:bg-brand-25"
                        >
                          <span className="font-semibold text-gray-900">{sample.label}</span>
                          <span className="font-mono">{sample.tracking}</span>
                        </button>
                      ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {result && assessment && (
            <ParcelPanel shipment={result.shipment} assessment={assessment} applied={result.applied} branch={branch} branches={branches} busy={acting} onAction={(a) => void runAction(a)} />
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="This session" description="Counts reset when you leave the page" />
            <CardContent>
              <dl className="grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ['Scanned', counters.scanned, 'text-gray-900'],
                    ['Received', counters.received, 'text-emerald-600'],
                    ['Exceptions', counters.exceptions, counters.exceptions > 0 ? 'text-red-600' : 'text-gray-900'],
                  ] as const
                ).map(([label, count, tone]) => (
                  <div key={label} className="rounded-lg bg-gray-50 px-2 py-3">
                    <dd className={cn('tabular text-3xl font-semibold leading-9', tone)}>{count}</dd>
                    <dt className="mt-0.5 text-xs font-medium text-gray-500">{label}</dt>
                  </div>
                ))}
              </dl>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 w-full"
                disabled={counters.scanned === 0}
                onClick={() => {
                  setCounters({ scanned: 0, received: 0, exceptions: 0 })
                  toast.success('Session counters reset')
                }}
              >
                Reset counters
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label htmlFor="auto-apply" className="text-sm font-semibold text-gray-900">
                    Rapid receiving mode
                  </Label>
                  <p className="mt-1 text-sm text-gray-500">Automatically apply “Receive” as soon as an expected parcel is scanned. Other actions still need confirmation.</p>
                </div>
                <Switch id="auto-apply" checked={autoApply} onCheckedChange={setAutoApply} />
              </div>
              <p className={cn('mt-3 rounded-lg px-3 py-2 text-xs font-medium', autoApply ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-50 text-gray-500')}>
                {autoApply ? 'On — inbound parcels are received on scan.' : 'Off — review each parcel, then press Enter to apply.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent scans" description="Latest scan events recorded at this facility" className="pb-4" />
        <RecentScansTable onSelect={(log) => void scan(log.trackingNumber)} />
      </Card>

      <AssignRiderDialog
        open={riderOpen}
        onOpenChange={setRiderOpen}
        shipments={result ? [result.shipment] : []}
        onDone={([next]) => {
          if (!next) return
          setResult({ shipment: next, applied: 'Sent out for delivery' })
          notify('success', 'Out for delivery', `${next.trackingNumber} handed to the rider (demo).`)
        }}
      />

      <ConfirmationDialog
        open={returnOpen}
        onOpenChange={setReturnOpen}
        destructive
        title="Return to sender?"
        confirmLabel="Return parcel"
        description={
          <>
            <span className="font-mono font-semibold text-gray-900">{result?.shipment.trackingNumber}</span> will be marked Returned and routed back to {result?.shipment.sender.city}. This
            ends delivery attempts for this parcel.
          </>
        }
        onConfirm={async () => {
          if (!result) return
          try {
            const next = await returnToSender(result.shipment, branch)
            setResult({ shipment: next, applied: 'Marked as returned to sender' })
            notify('success', 'Return initiated', `${next.trackingNumber} is going back to the sender.`)
          } catch (err) {
            notify('error', 'Action failed', err instanceof Error ? err.message : 'Could not update the parcel.')
          }
        }}
      />
    </>
  )
}
