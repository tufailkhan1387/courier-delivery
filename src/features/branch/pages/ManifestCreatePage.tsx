import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { DetailList } from '@/components/shared/DetailDrawer'
import { FormField, FormSection } from '@/components/shared/FormField'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input, NativeSelect, Textarea } from '@/components/ui/input'
import { manifestService } from '@/services'
import { formatPKR, titleCase } from '@/utils/format'
import { ParcelPicker } from '../components/manifest/ParcelPicker'
import { BRANCH_ID, useBranch, useBranchDrivers, useBranches, useHubShipments } from '../hooks'
import { formatKg, totalsOf } from '../lib'

const schema = z.object({
  destinationBranchId: z.string().min(1, 'Select a destination facility'),
  driverId: z.string(),
  vehiclePlate: z.string().trim().min(3, 'Enter the vehicle plate number'),
  notes: z.string().max(280, 'Keep notes under 280 characters'),
})

type FormValues = z.infer<typeof schema>

export default function ManifestCreatePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { data: branch } = useBranch()
  const { data: branchList } = useBranches()
  const { data: drivers } = useBranchDrivers()
  const hub = useHubShipments()
  const [selectedIds, setSelectedIds] = useState<string[]>(() => (params.get('parcel') ? [params.get('parcel') as string] : []))
  const [parcelError, setParcelError] = useState<string>()

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationBranchId: params.get('destination') ?? '', driverId: '', vehiclePlate: '', notes: '' },
  })
  const destinationBranchId = useWatch({ control, name: 'destinationBranchId' })

  // Linehaul vehicles (van/truck) first, then by availability.
  const driverOptions = useMemo(
    () =>
      [...(drivers ?? [])].sort(
        (a, b) => Number(a.vehicleType === 'bike') - Number(b.vehicleType === 'bike') || Number(a.availability !== 'available') - Number(b.availability !== 'available'),
      ),
    [drivers],
  )

  // Pre-select the best linehaul driver once drivers have loaded.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || driverOptions.length === 0) return
    prefilled.current = true
    const preferred = driverOptions.find((d) => d.vehicleType !== 'bike' && d.availability !== 'off_duty')
    if (preferred) {
      setValue('driverId', preferred.id)
      setValue('vehiclePlate', preferred.vehiclePlate)
    }
  }, [driverOptions, setValue])

  const unassigned = useMemo(() => hub.linehaul.filter((s) => !s.manifestId), [hub.linehaul])
  const eligible = useMemo(() => unassigned.filter((s) => s.destinationBranchId === destinationBranchId), [unassigned, destinationBranchId])
  const destinations = useMemo(
    () =>
      (branchList ?? [])
        .filter((b) => b.id !== BRANCH_ID && b.status === 'active')
        .map((b) => ({ branch: b, waiting: unassigned.filter((s) => s.destinationBranchId === b.id).length }))
        .sort((a, b) => b.waiting - a.waiting),
    [branchList, unassigned],
  )

  // The destination options arrive after first render: re-apply the (possibly prefilled) value
  // so the native select shows it, and drop a `?destination=` that is not a valid facility.
  const hasDestinations = destinations.length > 0
  useEffect(() => {
    if (!hasDestinations) return
    const current = getValues('destinationBranchId')
    setValue('destinationBranchId', destinations.some((d) => d.branch.id === current) ? current : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDestinations])

  // Only keep parcels that are (still) eligible for the chosen destination.
  const selected = useMemo(() => eligible.filter((s) => selectedIds.includes(s.id)), [eligible, selectedIds])
  const totals = totalsOf(selected)
  const destination = destinations.find((d) => d.branch.id === destinationBranchId)?.branch

  const save = handleSubmit(async (values) => {
    if (selected.length === 0) return setParcelError('Add at least one parcel before saving.')
    try {
      const manifest = await manifestService.create({
        originBranchId: BRANCH_ID,
        destinationBranchId: values.destinationBranchId,
        driverId: values.driverId || undefined,
        vehiclePlate: values.vehiclePlate.toUpperCase(),
        shipmentIds: selected.map((s) => s.id),
        notes: values.notes.trim() || undefined,
      })
      toast.success(`Draft ${manifest.number} saved`, { description: `${selected.length} parcel${selected.length === 1 ? '' : 's'} loaded. Dispatch it when the vehicle is ready.` })
      navigate(`/branch/manifests/${manifest.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save the manifest')
    }
  })

  const driverField = register('driverId', {
    onChange: (e: { target: { value: string } }) => {
      const driver = driverOptions.find((d) => d.id === e.target.value)
      if (driver) setValue('vehiclePlate', driver.vehiclePlate, { shouldValidate: true })
    },
  })

  return (
    <form onSubmit={save} noValidate>
      <PageHeader
        title="Create Manifest"
        description={`Load parcels at ${branch?.name ?? 'this hub'} onto a linehaul vehicle. The manifest is saved as a draft until you dispatch it.`}
        backTo="/branch/manifests"
        backLabel="Manifests"
      />

      <div className="grid items-start gap-6 xl:grid-cols-3">
        <div className="min-w-0 space-y-6 xl:col-span-2">
          <Card>
            <CardContent>
              <FormSection title="Route & vehicle" description="Where the load is going and who is driving it (mock assignment).">
                <FormField label="Destination facility" required error={errors.destinationBranchId?.message} className="sm:col-span-2">
                  <NativeSelect
                    {...register('destinationBranchId', {
                      onChange: () => {
                        setSelectedIds([])
                        setParcelError(undefined)
                      },
                    })}
                  >
                    <option value="">Select destination…</option>
                    {destinations.map(({ branch: b, waiting }) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code}) — {waiting} parcel{waiting === 1 ? '' : 's'} waiting
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField label="Driver" hint="Drivers based at this hub. Vans and trucks are listed first.">
                  <NativeSelect {...driverField}>
                    <option value="">Unassigned</option>
                    {driverOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {titleCase(d.vehicleType)} · {titleCase(d.availability)}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
                <FormField label="Vehicle plate" required error={errors.vehiclePlate?.message} hint="Auto-filled from the driver; edit if a different vehicle is used.">
                  <Input {...register('vehiclePlate')} placeholder="LES-0000" className="font-mono uppercase placeholder:font-sans placeholder:normal-case" />
                </FormField>
                <FormField label="Notes" error={errors.notes?.message} hint="Optional handling notes printed on the manifest." className="sm:col-span-2">
                  <Textarea {...register('notes')} placeholder="e.g. Fragile cartons loaded at the rear" />
                </FormField>
              </FormSection>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Parcels" description="Only parcels in inventory for the chosen destination that are not on another manifest can be added." />
            <CardContent>
              <ParcelPicker
                ready={Boolean(destinationBranchId)}
                eligible={eligible}
                all={hub.all ?? []}
                selectedIds={selectedIds}
                error={parcelError}
                onAdd={(ids) => {
                  setSelectedIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))])
                  setParcelError(undefined)
                }}
                onRemove={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-24">
          <CardHeader title="Manifest totals" description={destination ? `${branch?.code ?? ''} → ${destination.code}` : 'No destination selected'} />
          <CardContent>
            <DetailList
              items={[
                { label: 'Parcels', value: <span className="tabular text-lg">{totals.parcels}</span> },
                { label: 'Pieces', value: <span className="tabular text-lg">{totals.pieces}</span> },
                { label: 'Total weight', value: <span className="tabular text-lg">{formatKg(totals.weightKg)}</span> },
                { label: 'COD value', value: <span className="tabular text-lg">{formatPKR(totals.cod)}</span> },
                { label: 'Fragile', value: <span className="tabular text-lg">{totals.fragile}</span> },
                { label: 'Destination', value: destination?.city ?? '—' },
              ]}
            />
            <div className="mt-6 flex flex-col gap-2">
              <Button type="submit" size="lg" loading={isSubmitting}>
                <Save /> Save draft manifest
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/branch/manifests">Cancel</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-gray-500">A manifest number and seal number are generated when the draft is saved.</p>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
