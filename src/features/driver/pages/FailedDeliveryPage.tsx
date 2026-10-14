import { AlertCircle, ArrowLeft, ArrowRight, Info, PackageX, XCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FileUpload } from '@/components/shared/FileUpload'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { RadioCard, RadioGroup } from '@/components/ui/controls'
import { Textarea } from '@/components/ui/input'
import { PORTALS } from '@/app/portals'
import { FAILURE_REASONS } from '@/features/shipments/meta'
import { shipmentService } from '@/services'
import { formatPKR } from '@/utils/format'
import { StickyActions } from '../components/StickyActions'
import { ResultScreen, TaskNotActionable, TaskSkeleton, TaskUnavailable } from '../components/TaskState'
import { useCurrentDriver, useMyTasks, useTask } from '../hooks'
import { pendingStops } from '../tasks'

const OTHER = 'Other'
const REASONS = [...FAILURE_REASONS, OTHER]

const NEXT_STEPS = [
  { value: 'reattempt', label: 'Reattempt tomorrow', description: 'Keep the parcel for another delivery attempt on the next working day.' },
  { value: 'collect', label: 'Customer will collect from branch', description: 'Recipient agreed to pick the parcel up from the branch counter.' },
  { value: 'return', label: 'Return to hub', description: 'Hand the parcel back to the hub for a decision by operations.' },
] as const

type NextStep = (typeof NEXT_STEPS)[number]['value']

interface Outcome {
  reason: string
  nextStep: string
  photoAdded: boolean
}

export default function FailedDeliveryPage() {
  const { id } = useParams()
  const { shipment, loading, mine } = useTask(id)
  const { data: driver } = useCurrentDriver()
  const { data: tasks } = useMyTasks()

  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')
  const [nextStep, setNextStep] = useState<NextStep>('reattempt')
  const [photo, setPhoto] = useState<string | undefined>()
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  if (loading && !shipment) return <TaskSkeleton />
  if (!shipment) return <TaskUnavailable reason="not_found" />
  if (!mine) return <TaskUnavailable reason="not_assigned" />

  const detailPath = `/driver/deliveries/${shipment.id}`

  if (outcome) {
    const next = pendingStops(tasks ?? []).find((s) => s.id !== shipment.id)
    return (
      <ResultScreen
        tone="warning"
        icon={PackageX}
        title="Attempt recorded"
        description="The failed attempt has been added to the tracking timeline. Keep the parcel safe until it is handed over."
        summary={[
          { label: 'Tracking no.', value: <span className="font-mono">{shipment.trackingNumber}</span> },
          { label: 'Recipient', value: shipment.receiver.name },
          { label: 'Reason', value: outcome.reason },
          { label: 'Next step', value: outcome.nextStep },
          { label: 'Photo', value: outcome.photoAdded ? 'Previewed only (not saved in demo)' : 'None' },
          ...(shipment.codAmount > 0 ? [{ label: 'COD', value: `${formatPKR(shipment.codAmount)} not collected` }] : []),
        ]}
        actions={
          <>
            {next && (
              <Button size="lg" className="w-full" asChild>
                <Link to={`/driver/deliveries/${next.id}`}>
                  Next delivery <ArrowRight />
                </Link>
              </Button>
            )}
            <Button variant="secondary" size="lg" className="w-full" asChild>
              <Link to={detailPath}>View this delivery</Link>
            </Button>
            <Button variant="ghost" size="lg" className="w-full" asChild>
              <Link to="/driver/deliveries?tab=failed">Back to list</Link>
            </Button>
          </>
        }
      />
    )
  }

  if (!busy && shipment.status !== 'out_for_delivery') {
    return <TaskNotActionable id={shipment.id} message="A failed attempt can only be reported for a parcel that is out for delivery." />
  }

  const trimmedNotes = notes.trim()
  const reasonError = reason ? undefined : 'Select why the delivery could not be completed'
  const notesError = reason === OTHER && trimmedNotes.length < 5 ? 'Describe what happened (at least 5 characters)' : undefined

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setShowErrors(true)
    if (reasonError || notesError) {
      toast.error('Please complete the required fields.')
      return
    }
    const step = NEXT_STEPS.find((s) => s.value === nextStep)!
    const failureReason = reason === OTHER ? trimmedNotes : reason
    const note = [`${failureReason.replace(/\.+$/, '')}.`, reason !== OTHER && trimmedNotes ? `Rider note: ${trimmedNotes}.` : '', `Next step: ${step.label.toLowerCase()}.`].filter(Boolean).join(' ')
    setBusy(true)
    try {
      await shipmentService.updateStatus(shipment.id, 'failed', { actor: driver?.name ?? PORTALS.driver.user.name, failureReason, note })
      setOutcome({ reason: failureReason, nextStep: step.label, photoAdded: Boolean(photo) })
      toast.success('Failed attempt recorded')
    } catch {
      toast.error('Could not record the attempt. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to={detailPath} className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
        <ArrowLeft className="size-4" /> Back to delivery
      </Link>
      <header className="mb-4 mt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Report failed delivery</h1>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-mono font-medium text-gray-700">{shipment.trackingNumber}</span> · {shipment.receiver.name}
        </p>
      </header>

      <form onSubmit={submit} noValidate className="space-y-4">
        <Card>
          <CardHeader
            title={
              <span id="reason-label">
                Reason for failed attempt <span className="text-red-500" aria-hidden>*</span>
              </span>
            }
            className="px-4 pt-4"
          />
          <CardContent className="p-4">
            <RadioGroup value={reason} onValueChange={setReason} aria-labelledby="reason-label" aria-required className="space-y-2">
              {REASONS.map((option) => (
                <RadioCard key={option} value={option} className="flex min-h-12 items-center py-3 pr-11 text-sm font-medium text-gray-900">
                  {option}
                </RadioCard>
              ))}
            </RadioGroup>
            {showErrors && reasonError && (
              <p role="alert" className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
                <AlertCircle className="size-3.5 shrink-0" /> {reasonError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <FormField
              label="Notes"
              required={reason === OTHER}
              error={showErrors ? notesError : undefined}
              hint={reason === OTHER ? 'Required when the reason is “Other”.' : 'Optional — anything the branch should know.'}
            >
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={240} placeholder="e.g. Gate was locked, neighbour said the family is out of town." />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Photo evidence" description="Optional — e.g. a closed gate or the address plate." className="px-4 pt-4" />
          <CardContent className="p-4">
            <FileUpload capture value={photo} onChange={setPhoto} label="Take or choose a photo" hint="Preview only — the photo is not saved or uploaded in this demo." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={<span id="next-step-label">Reattempt option</span>} description="What should happen with this parcel next?" className="px-4 pt-4" />
          <CardContent className="p-4">
            <RadioGroup value={nextStep} onValueChange={(value) => setNextStep(value as NextStep)} aria-labelledby="next-step-label" className="space-y-2">
              {NEXT_STEPS.map((option) => (
                <RadioCard key={option.value} value={option.value} className="py-3 pr-11">
                  <span className="block text-sm font-semibold text-gray-900">{option.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{option.description}</span>
                </RadioCard>
              ))}
            </RadioGroup>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-gray-500">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Your choice is written to the tracking note for the branch. Nothing is scheduled automatically in this demo.
            </p>
          </CardContent>
        </Card>

        <StickyActions>
          <Button type="submit" variant="destructive" size="lg" className="w-full" loading={busy}>
            {!busy && <XCircle />} Submit failed attempt
          </Button>
        </StickyActions>
      </form>
    </div>
  )
}
