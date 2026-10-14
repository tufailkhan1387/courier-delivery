import type { ColumnDef } from '@tanstack/react-table'
import { Bike, Truck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { Shipment } from '@/types'
import { useSelection } from '../../hooks'
import { matchesSearch } from '../../lib'
import { AssignRiderDialog } from '../AssignRiderDialog'
import { SelectionProvider } from '../cells'
import { ageColumn, codColumn, parcelColumn, receiverColumn, selectionColumn, trackingColumn } from '../columns'

const PAYMENT_OPTIONS = [
  { value: 'cod', label: 'COD parcels' },
  { value: 'prepaid', label: 'Prepaid parcels' },
]

interface LastMileTabProps {
  shipments: Shipment[]
  loading: boolean
  onOpen: (shipment: Shipment) => void
}

/** Parcels ready for local delivery: assign a rider and send them out, one by one or in bulk. */
export function LastMileTab({ shipments, loading, onOpen }: LastMileTabProps) {
  const [search, setSearch] = useState('')
  const [payment, setPayment] = useState('')
  const [assigning, setAssigning] = useState<Shipment[]>([])

  const rows = useMemo(
    () => shipments.filter((s) => matchesSearch(s, search) && (!payment || (payment === 'cod' ? s.codAmount > 0 : s.codAmount === 0))),
    [shipments, search, payment],
  )
  const selection = useSelection(useMemo(() => rows.map((s) => s.id), [rows]))
  const selectedRows = rows.filter((s) => selection.selected.has(s.id))

  const columns = useMemo<ColumnDef<Shipment, unknown>[]>(
    () => [
      selectionColumn<Shipment>((s) => s.trackingNumber),
      trackingColumn,
      receiverColumn,
      { id: 'area', header: 'Postal code', accessorFn: (s) => s.receiver.postalCode, cell: ({ row }) => <span className="tabular">{row.original.receiver.postalCode}</span> },
      parcelColumn,
      codColumn,
      ageColumn,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="soft"
            onClick={(e) => {
              e.stopPropagation()
              setAssigning([row.original])
            }}
          >
            <Bike /> Assign rider
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <Card>
      <FilterBar
        actions={
          <>
            {selection.active.length > 0 && <Badge tone="blue">{selection.active.length} selected</Badge>}
            <Button disabled={selectedRows.length === 0} onClick={() => setAssigning(selectedRows)}>
              <Truck /> Send selected out
            </Button>
          </>
        }
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Search tracking no., receiver, address…" />
        <FilterSelect label="Payment types" value={payment} onChange={setPayment} options={PAYMENT_OPTIONS} />
      </FilterBar>
      {!loading && shipments.length === 0 ? (
        <EmptyState icon={Bike} title="No parcels awaiting last-mile" description="Parcels received for local delivery will queue up here." />
      ) : (
        <SelectionProvider value={selection}>
          <DataTable columns={columns} data={loading ? undefined : rows} loading={loading} onRowClick={onOpen} emptyTitle="No parcels match your filters" />
        </SelectionProvider>
      )}
      <AssignRiderDialog open={assigning.length > 0} onOpenChange={(open) => !open && setAssigning([])} shipments={assigning} onDone={selection.clear} />
    </Card>
  )
}
