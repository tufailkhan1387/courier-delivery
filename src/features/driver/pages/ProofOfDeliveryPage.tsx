import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ArrowLeft, ArrowRight, Banknote, CheckCircle2, Info, Loader2, PackageCheck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm, type FieldErrors } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { FileUpload } from '@/components/shared/FileUpload'
import { FormField } from '@/components/shared/FormField'
import { SignaturePad } from '@/components/shared/SignaturePad'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/controls'
import { Input } from '@/components/ui/input'
import { PORTALS } from '@/app/portals'
import { shipmentService } from '@/services'
import type { ProofOfDelivery, Shipment } from '@/types'
import { formatDateTime, formatPKR } from '@/utils/format'
import { OtpInput } from '../components/OtpInput'
import { StickyActions } from '../components/StickyActions'
import { ResultScreen, TaskNotActionable, TaskSkeleton, TaskUnavailable } from '../components/TaskState'
import { useCurrentDriver, useMyTasks, useTask } from '../hooks'
import { pendingStops } from '../tasks'

/** Demo delivery code. No SMS is sent anywhere — this value is simply accepted by the mock check. */
const DEMO_OTP = '1234'
const SIGNATURE_CARD_ID = 'pod-signature'

const baseSchema = z.object({
  recipientName: z.string().trim().min(2, 'Enter the name of the person who received the parcel'),
  relationship: z.string().trim().max(40, 'Keep this under 40 characters'),
  signatureDataUrl: z.string().min(1, 'A signature is required to complete the delivery'),
  photoDataUrl: z.string(),
  codConfirmed: z.boolean(),
})

type PodFormValues = z.infer<typeof baseSchema>

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-2 flex items-center gap-1 text-xs font-medium text-red-600">
      <AlertCircle className="size-3.5 shrink-0" /> {message}
    </p>
  )
}

type OtpState = 'idle' | 'verifying' | 'verified' | 'error'

function OtpSection({ state, onStateChange }: { state: OtpState; onStateChange: (state: OtpState) => void }) {
  const [code, setCode] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const verify = () => {
    if (code.length !== DEMO_OTP.length || state === 'verifying' || state === 'verified') return
    onStateChange('verifying')
    // Simulated check: there is no SMS gateway or server in this demo.
    timer.current = setTimeout(() => onStateChange(code === DEMO_OTP ? 'verified' : 'error'), 900)
  }

  const change = (next: string) => {
    setCode(next)
    if (state === 'error') onStateChange('idle')
  }

  return (
    <Card>
      <CardHeader title="Delivery code (OTP)" description="Ask the recipient for their 4-digit delivery code." className="px-4 pt-4" />
      <CardContent className="p-4">
        <OtpInput label="Delivery code" value={code} onChange={change} onEnter={verify} length={DEMO_OTP.length} disabled={state === 'verifying' || state === 'verified'} invalid={state === 'error'} />

        <div className="mt-3 min-h-5" aria-live="polite">
          {state === 'verifying' && (
            <p className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Verifying code (simulated)…
            </p>
          )}
          {state === 'verified' && (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-4" aria-hidden /> Code verified (demo)
            </p>
          )}
          {state === 'error' && (
            <p className="flex items-center gap-2 text-sm font-medium text-red-600">
              <AlertCircle className="size-4" aria-hidden /> That code does not match. Try again.
            </p>
          )}
        </div>

        {state !== 'verified' && (
          <Button variant="secondary" size="lg" className="mt-2 w-full" onClick={verify} disabled={code.length !== DEMO_OTP.length} loading={state === 'verifying'}>
            Verify code
          </Button>
        )}

        <p className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
          <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
          <span>
            Demo only: no SMS is sent to the recipient. Use the demo code <span className="font-mono font-semibold text-gray-900">{DEMO_OTP}</span>. The code is optional here — the signature below is always required.
          </span>
        </p>
      </CardContent>
    </Card>
  )
}

type PodDraft = Omit<ProofOfDelivery, 'deliveredAt'>

function PodForm({ shipment, onSubmit }: { shipment: Shipment; onSubmit: (pod: PodDraft) => Promise<void> }) {
  const cod = shipment.codAmount
  const schema = useMemo(
    () => baseSchema.refine((v) => cod <= 0 || v.codConfirmed, { path: ['codConfirmed'], message: 'Confirm that you have collected the cash' }),
    [cod],
  )
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PodFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { recipientName: shipment.receiver.name, relationship: '', signatureDataUrl: '', photoDataUrl: '', codConfirmed: false },
  })
  const [otpState, setOtpState] = useState<OtpState>('idle')

  const onValid = async (values: PodFormValues) => {
    const relationship = values.relationship ? ` (${values.relationship})` : ''
    await onSubmit({
      recipientName: `${values.recipientName}${relationship}`,
      otpVerified: otpState === 'verified',
      signatureDataUrl: values.signatureDataUrl,
      photoDataUrl: values.photoDataUrl || undefined,
      codCollected: cod > 0 ? cod : undefined,
    })
  }

  const onInvalid = (invalid: FieldErrors<PodFormValues>) => {
    toast.error('Please complete the required fields.')
    if (invalid.signatureDataUrl && !invalid.recipientName) document.getElementById(SIGNATURE_CARD_ID)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="space-y-4">
      <Card>
        <CardHeader title="Received by" description="Who actually took the parcel?" className="px-4 pt-4" />
        <CardContent className="space-y-4 p-4">
          <FormField label="Recipient name" required error={errors.recipientName?.message}>
            <Input className="h-12" autoComplete="off" {...register('recipientName')} />
          </FormField>
          <FormField label="Relationship to addressee" hint="Optional — e.g. self, family member, colleague, security guard." error={errors.relationship?.message}>
            <Input className="h-12" autoComplete="off" placeholder="e.g. Brother" {...register('relationship')} />
          </FormField>
        </CardContent>
      </Card>

      <OtpSection state={otpState} onStateChange={setOtpState} />

      <Card id={SIGNATURE_CARD_ID}>
        <CardHeader
          title={
            <>
              Signature <span className="text-red-500" aria-hidden>*</span>
            </>
          }
          description="Ask the recipient to sign in the box."
          className="px-4 pt-4"
        />
        <CardContent className="p-4">
          <Controller
            control={control}
            name="signatureDataUrl"
            render={({ field }) => <SignaturePad onChange={(dataUrl) => field.onChange(dataUrl ?? '')} className={errors.signatureDataUrl ? 'border-red-400' : undefined} />}
          />
          <FieldError message={errors.signatureDataUrl?.message} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Delivery photo" description="Optional — parcel at the door or with the recipient." className="px-4 pt-4" />
        <CardContent className="p-4">
          <Controller
            control={control}
            name="photoDataUrl"
            render={({ field }) => <FileUpload capture value={field.value || undefined} onChange={(dataUrl) => field.onChange(dataUrl ?? '')} label="Take or choose a photo" />}
          />
        </CardContent>
      </Card>

      {cod > 0 && (
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-orange-700">
              <Banknote className="size-4" aria-hidden /> Cash on delivery
            </p>
            <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-gray-900">{formatPKR(cod)}</p>
            <Controller
              control={control}
              name="codConfirmed"
              render={({ field }) => (
                <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-gray-25 px-3 py-3 text-sm font-medium text-gray-900">
                  <Checkbox
                    ref={field.ref}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                    onBlur={field.onBlur}
                    aria-invalid={errors.codConfirmed ? true : undefined}
                    aria-describedby={errors.codConfirmed ? 'cod-error' : undefined}
                    className="size-5"
                  />
                  <span>
                    I have collected <span className="tabular font-semibold">{formatPKR(cod)}</span> in cash
                  </span>
                </label>
              )}
            />
            <FieldError id="cod-error" message={errors.codConfirmed?.message} />
            <p className="mt-3 text-xs text-gray-500">Demo: this records the amount as collected. No real payment is processed.</p>
          </CardContent>
        </Card>
      )}

      <StickyActions>
        <Button type="submit" variant="success" size="lg" className="w-full" loading={isSubmitting}>
          {!isSubmitting && <PackageCheck />} Confirm delivery
        </Button>
      </StickyActions>
    </form>
  )
}

export default function ProofOfDeliveryPage() {
  const { id } = useParams()
  const { shipment, loading, mine } = useTask(id)
  const { data: driver } = useCurrentDriver()
  const { data: tasks } = useMyTasks()
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ProofOfDelivery | null>(null)

  if (loading && !shipment) return <TaskSkeleton />
  if (!shipment) return <TaskUnavailable reason="not_found" />
  if (!mine) return <TaskUnavailable reason="not_assigned" />

  if (result) {
    const next = pendingStops(tasks ?? []).find((s) => s.id !== shipment.id)
    return (
      <ResultScreen
        tone="success"
        title="Delivered"
        description="Proof of delivery has been saved to this shipment (stored locally in this demo)."
        summary={[
          { label: 'Tracking no.', value: <span className="font-mono">{shipment.trackingNumber}</span> },
          { label: 'Received by', value: result.recipientName },
          { label: 'Time', value: formatDateTime(result.deliveredAt) },
          { label: 'Delivery code', value: result.otpVerified ? 'Verified (demo)' : 'Not verified' },
          { label: 'Signature', value: 'Captured' },
          { label: 'Photo', value: result.photoDataUrl ? 'Attached' : 'None' },
          ...(result.codCollected ? [{ label: 'COD collected', value: formatPKR(result.codCollected) }] : []),
        ]}
        actions={
          <>
            {next ? (
              <Button size="lg" className="w-full" asChild>
                <Link to={`/driver/deliveries/${next.id}`}>
                  Next delivery <ArrowRight />
                </Link>
              </Button>
            ) : (
              <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">That was your last pending delivery.</p>
            )}
            <Button variant="secondary" size="lg" className="w-full" asChild>
              <Link to="/driver/deliveries">Back to list</Link>
            </Button>
          </>
        }
      />
    )
  }

  if (!busy && shipment.status !== 'out_for_delivery') {
    return <TaskNotActionable id={shipment.id} message="Proof of delivery can only be recorded for a parcel that is out for delivery." />
  }

  const submit = async (draft: PodDraft) => {
    const pod: ProofOfDelivery = { ...draft, deliveredAt: new Date().toISOString() }
    setBusy(true)
    try {
      await shipmentService.updateStatus(shipment.id, 'delivered', { actor: driver?.name ?? PORTALS.driver.user.name, pod })
      setResult(pod)
      toast.success('Delivery confirmed')
    } catch {
      toast.error('Could not save the delivery. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to={`/driver/deliveries/${shipment.id}`} className="inline-flex h-9 items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
        <ArrowLeft className="size-4" /> Back to delivery
      </Link>
      <header className="mb-4 mt-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Proof of delivery</h1>
        <p className="mt-1 text-sm text-gray-500">
          <span className="font-mono font-medium text-gray-700">{shipment.trackingNumber}</span> · {shipment.receiver.name}
        </p>
      </header>
      <PodForm shipment={shipment} onSubmit={submit} />
    </div>
  )
}
