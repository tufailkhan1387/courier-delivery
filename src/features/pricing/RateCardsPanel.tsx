import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect } from '@/components/shared/FilterBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'
import { SERVICE_META, ZONE_LABEL, type Tone } from '@/features/shipments/meta'
import { useQuery } from '@/hooks/useQuery'
import { pricingService } from '@/services'
import type { PricingZone, RateCard, ServiceType } from '@/types'
import { formatPKR } from '@/utils/format'
import { RateFormDialog } from './RateFormDialog'

const ZONE_TONE: Record<PricingZone, Tone> = { within_city: 'green', same_zone: 'blue', different_zone: 'purple' }
const ZONE_OPTIONS = (Object.keys(ZONE_LABEL) as PricingZone[]).map((z) => ({ value: z, label: ZONE_LABEL[z] }))
const SERVICE_OPTIONS = (Object.keys(SERVICE_META) as ServiceType[]).map((s) => ({ value: s, label: SERVICE_META[s].label }))

/** Rate card table with zone/service filters, active toggle, add/edit and delete. */
export function RateCardsPanel() {
  const { data: rates, loading } = useQuery(() => pricingService.listRates(), [])
  const [zone, setZone] = useState('')
  const [service, setService] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<RateCard | undefined>()
  const [deleting, setDeleting] = useState<RateCard | undefined>()

  const rows = useMemo(() => rates?.filter((r) => (!zone || r.zone === zone) && (!service || r.service === service)), [rates, zone, service])

  const openForm = (rate?: RateCard) => {
    setEditing(rate)
    setFormOpen(true)
  }

  const columns = useMemo<ColumnDef<RateCard, unknown>[]>(
    () => [
      { accessorKey: 'name', header: 'Rate', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.name}</span> },
      { id: 'zone', header: 'Zone', accessorFn: (r) => ZONE_LABEL[r.zone], cell: ({ row }) => <Badge tone={ZONE_TONE[row.original.zone]}>{ZONE_LABEL[row.original.zone]}</Badge> },
      { id: 'service', header: 'Service', accessorFn: (r) => SERVICE_META[r.service].label },
      { accessorKey: 'baseWeightKg', header: 'Base weight', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.baseWeightKg} kg</span> },
      { accessorKey: 'basePrice', header: 'Base price', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{formatPKR(row.original.basePrice)}</span> },
      { accessorKey: 'perKgPrice', header: 'Per extra kg', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{formatPKR(row.original.perKgPrice)}</span> },
      { accessorKey: 'eta', header: 'ETA', enableSorting: false },
      {
        accessorKey: 'active',
        header: 'Active',
        cell: ({ row }) => (
          <Switch
            checked={row.original.active}
            aria-label={`${row.original.name} active`}
            onCheckedChange={async (active) => {
              await pricingService.saveRate({ ...row.original, active })
              toast.success(`${row.original.name} ${active ? 'activated' : 'deactivated'}`)
            }}
          />
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={`Edit ${row.original.name}`} onClick={() => openForm(row.original)}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={`Delete ${row.original.name}`} className="hover:bg-red-50 hover:text-red-600" onClick={() => setDeleting(row.original)}>
              <Trash2 />
            </Button>
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <Card>
      <FilterBar
        actions={
          <Button onClick={() => openForm()}>
            <Plus /> Add rate
          </Button>
        }
      >
        <FilterSelect label="Zones" value={zone} onChange={setZone} options={ZONE_OPTIONS} />
        <FilterSelect label="Services" value={service} onChange={setService} options={SERVICE_OPTIONS} />
      </FilterBar>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        pageSize={12}
        emptyTitle="No rate cards"
        emptyDescription="Add a rate card or clear the filters."
        emptyAction={
          <Button onClick={() => openForm()}>
            <Plus /> Add rate
          </Button>
        }
      />

      <RateFormDialog open={formOpen} onOpenChange={setFormOpen} rate={editing} />
      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        title="Delete rate card?"
        description={`“${deleting?.name ?? ''}” will be removed. Quotes for this zone and service will be unavailable unless another active rate covers them.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return
          await pricingService.deleteRate(deleting.id)
          toast.success(`${deleting.name} deleted`)
        }}
      />
    </Card>
  )
}
