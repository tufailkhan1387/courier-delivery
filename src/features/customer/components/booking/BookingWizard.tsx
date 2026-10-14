import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormProvider, useForm, useWatch, type DefaultValues } from 'react-hook-form'
import { toast } from 'sonner'
import { Stepper } from '@/components/shared/Stepper'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { CURRENT_CUSTOMER_ID } from '@/data/session'
import { shipmentService } from '@/services'
import type { Customer, SavedAddress, Shipment } from '@/types'
import { usePricingData } from '../../hooks'
import { ParcelStep } from './ParcelStep'
import { ReceiverStep } from './ReceiverStep'
import { ReviewStep } from './ReviewStep'
import { bookingSchema, BOOKING_STEPS, computeQuotes, STEP_FIELDS, toParty, type BookingValues } from './schema'
import { SenderStep } from './SenderStep'
import { ServiceStep } from './ServiceStep'

const REVIEW_STEP = BOOKING_STEPS.length - 1

function buildDefaults(customer: Customer | undefined, addresses: SavedAddress[]): DefaultValues<BookingValues> {
  const home = addresses.find((a) => a.isDefault)
  return {
    sender: {
      name: home?.name ?? customer?.name ?? '',
      phone: home?.phone ?? customer?.phone ?? '',
      email: home?.email ?? customer?.email ?? '',
      address: home?.address ?? customer?.address ?? '',
      city: home?.city ?? customer?.city,
      postalCode: home?.postalCode ?? '',
    },
    receiver: { name: '', phone: '', email: '', address: '', postalCode: '' },
    parcel: { description: '', quantity: 1, weightKg: 1, length: 20, width: 15, height: 10, declaredValue: 1000, fragile: false, instructions: '' },
    service: 'standard',
    pickupPreference: 'pickup',
    paymentMethod: 'cod',
    codAmount: 0,
  }
}

interface BookingWizardProps {
  customer: Customer | undefined
  addresses: SavedAddress[]
  onCreated: (shipment: Shipment) => void
}

export function BookingWizard({ customer, addresses, onCreated }: BookingWizardProps) {
  const [step, setStep] = useState(0)
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: buildDefaults(customer, addresses),
    mode: 'onTouched',
  })
  const { data: pricing, loading: pricingLoading } = usePricingData()
  const values = useWatch({ control: form.control })
  const quotes = computeQuotes(values, pricing)
  const submitting = form.formState.isSubmitting

  // Each step starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [step])

  const next = async () => {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true })
    if (!valid) return
    if (step === 3 && quotes && !quotes[form.getValues('service')]) {
      toast.error('That service is not available on this route. Please choose another one.')
      return
    }
    setStep((s) => Math.min(s + 1, REVIEW_STEP))
  }

  const confirm = form.handleSubmit(
    async (data) => {
      try {
        const shipment = await shipmentService.create({
          customerId: CURRENT_CUSTOMER_ID,
          sender: toParty(data.sender),
          receiver: toParty(data.receiver),
          parcel: {
            category: data.parcel.category,
            description: data.parcel.description,
            quantity: data.parcel.quantity,
            weightKg: data.parcel.weightKg,
            dimensions: { length: data.parcel.length, width: data.parcel.width, height: data.parcel.height },
            declaredValue: data.parcel.declaredValue,
            fragile: data.parcel.fragile,
            instructions: data.parcel.instructions || undefined,
          },
          service: data.service,
          pickupPreference: data.pickupPreference,
          paymentMethod: data.paymentMethod,
          codAmount: data.paymentMethod === 'cod' ? data.codAmount : 0,
        })
        toast.success(`Shipment booked — ${shipment.trackingNumber}`)
        onCreated(shipment)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'The booking could not be created. Please try again.')
      }
    },
    () => toast.error('Some details need attention. Use the Edit links to review each section.'),
  )

  return (
    <FormProvider {...form}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          if (step === REVIEW_STEP) void confirm()
          else void next()
        }}
      >
        <Card className="mb-6">
          <CardContent>
            <Stepper steps={BOOKING_STEPS} current={step} onStepClick={submitting ? undefined : setStep} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="sm:p-6">
            {step === 0 && <SenderStep addresses={addresses} />}
            {step === 1 && <ReceiverStep addresses={addresses} />}
            {step === 2 && <ParcelStep />}
            {step === 3 && <ServiceStep quotes={quotes} pricingLoading={pricingLoading && !pricing} />}
            {step === REVIEW_STEP && <ReviewStep quotes={quotes} pricingLoading={pricingLoading && !pricing} onEdit={setStep} />}
          </CardContent>
          <CardFooter className="justify-between sm:px-6">
            <Button variant="secondary" onClick={() => setStep((s) => Math.max(s - 1, 0))} disabled={step === 0 || submitting}>
              <ArrowLeft /> Back
            </Button>
            {step === REVIEW_STEP ? (
              <Button type="submit" loading={submitting}>
                {!submitting && <Check />} Confirm booking
              </Button>
            ) : (
              <Button type="submit">
                Next <ArrowRight />
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  )
}
