import { Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DetailDrawer, DetailList, DetailSection } from '@/components/shared/DetailDrawer'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import type { Branch, Driver, Shipment } from '@/types'
import { formatFriendlyDateTime, formatPKR, titleCase } from '@/utils/format'
import { driverCash } from './codCalc'

interface Props {
  shipments: Shipment[] | undefined
  drivers: Driver[] | undefined
  branches: Map<string, Branch>
  loading: boolean
}

/** COD cash held per driver (collected, not yet settled) with a per-shipment drawer. */
export function DriverCash({ shipments, drivers, branches, loading }: Props) {
  const rows = useMemo(() => driverCash(shipments ?? [], drivers ?? []), [shipments, drivers])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = rows.find((r) => r.driver.id === selectedId)
  const total = rows.reduce((t, r) => t + r.amount, 0)

  return (
    <Card>
      <CardHeader
        title="Driver cash"
        description={rows.length ? `${formatPKR(total)} collected by ${rows.length} driver${rows.length === 1 ? '' : 's'} and not yet settled` : 'COD collected by drivers and not yet settled'}
        className="pb-4"
      />
      {loading && (!shipments || !drivers) ? (
        <TableSkeleton columns={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} title="No cash held by drivers" description="Collected COD appears here until it is settled." />
      ) : (
        <Table>
          <THead className="border-t">
            <tr>
              <TH>Driver</TH>
              <TH>Branch</TH>
              <TH>Availability</TH>
              <TH className="text-right">Shipments</TH>
              <TH className="text-right">Cash held</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {rows.map(({ driver, amount, shipments: items }) => (
              <TR key={driver.id}>
                <TD className="font-medium text-gray-900">{driver.name}</TD>
                <TD>{branches.get(driver.branchId)?.name ?? '—'}</TD>
                <TD>
                  <StateBadge value={driver.availability} />
                </TD>
                <TD className="tabular text-right">{items.length}</TD>
                <TD className="tabular text-right font-semibold text-gray-900">{formatPKR(amount)}</TD>
                <TD className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedId(driver.id)}>
                    View details
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <DetailDrawer
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected ? selected.driver.name : 'Driver cash'}
        description="COD collected and not yet settled"
        footer={
          selected && (
            <Button variant="secondary" asChild>
              <Link to={`/admin/drivers/${selected.driver.id}`}>Open driver profile</Link>
            </Button>
          )
        }
      >
        {selected && (
          <>
            <DetailSection title="Summary">
              <DetailList
                items={[
                  { label: 'Cash held', value: formatPKR(selected.amount) },
                  { label: 'Shipments', value: selected.shipments.length },
                  { label: 'Branch', value: branches.get(selected.driver.branchId)?.name ?? '—' },
                  { label: 'Vehicle', value: `${titleCase(selected.driver.vehicleType)} · ${selected.driver.vehiclePlate}` },
                ]}
              />
            </DetailSection>
            <DetailSection title="Collected shipments">
              <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                {selected.shipments.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 px-3.5 py-3">
                    <div className="min-w-0">
                      <Link to={`/admin/shipments/${s.id}`} className="font-mono text-sm font-semibold text-gray-900 hover:text-brand-700 hover:underline">
                        {s.trackingNumber}
                      </Link>
                      <p className="truncate text-xs text-gray-500">
                        {s.receiver.name} · {s.deliveredAt ? formatFriendlyDateTime(s.deliveredAt) : '—'}
                      </p>
                    </div>
                    <span className="tabular shrink-0 text-sm font-semibold text-gray-900">{formatPKR(s.codAmount)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-gray-500">Demo figures derived from delivered COD shipments. Settle them per customer under Pending settlements.</p>
            </DetailSection>
          </>
        )}
      </DetailDrawer>
    </Card>
  )
}
