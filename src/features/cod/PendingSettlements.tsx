import { CheckCircle2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/misc'
import { codService } from '@/services'
import type { Customer, Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { pendingSettlements, type SettlementRow } from './codCalc'

interface Props {
  shipments: Shipment[] | undefined
  customers: Map<string, Customer>
  loading: boolean
}

/** Collected COD owed to each customer, with a mock "settle" reconciliation action. */
export function PendingSettlements({ shipments, customers, loading }: Props) {
  const rows = useMemo(() => pendingSettlements(shipments ?? [], customers), [shipments, customers])
  const [target, setTarget] = useState<SettlementRow | undefined>()
  const total = rows.reduce((t, r) => t + r.amount, 0)

  const settle = async () => {
    if (!target) return
    const txn = await codService.settle(
      target.shipments.map((s) => s.id),
      `Settlement to ${target.name} (demo reconciliation)`,
      { customerId: target.customerId },
    )
    toast.success(`Marked ${formatPKR(txn.amount)} as settled for ${target.name}`, { description: `Demo ledger entry ${txn.reference}. No money was transferred.` })
  }

  return (
    <Card>
      <CardHeader
        title="Pending settlements"
        description={rows.length ? `${formatPKR(total)} collected and owed to ${rows.length} customer${rows.length === 1 ? '' : 's'}` : 'Collected COD grouped by the customer it is owed to'}
        className="pb-4"
      />
      {loading && !shipments ? (
        <TableSkeleton columns={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Nothing to settle" description="All collected COD has been reconciled in the demo ledger." />
      ) : (
        <Table>
          <THead className="border-t">
            <tr>
              <TH>Customer</TH>
              <TH className="text-right">Shipments</TH>
              <TH>Oldest delivery</TH>
              <TH className="text-right">Amount owed</TH>
              <TH>
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.customerId}>
                <TD>
                  <Link to={`/admin/customers/${row.customerId}`} className="font-medium text-gray-900 hover:text-brand-700 hover:underline">
                    {row.name}
                  </Link>
                  <div className="mt-1">
                    <Badge tone={row.accountType === 'business' ? 'purple' : 'gray'}>{row.accountType === 'business' ? 'Business' : 'Individual'}</Badge>
                  </div>
                </TD>
                <TD className="tabular text-right">{row.shipments.length}</TD>
                <TD>{formatDate(row.oldest)}</TD>
                <TD className="tabular text-right font-semibold text-gray-900">{formatPKR(row.amount)}</TD>
                <TD className="text-right">
                  <Button size="sm" onClick={() => setTarget(row)}>
                    Settle
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <ConfirmationDialog
        open={!!target}
        onOpenChange={(open) => !open && setTarget(undefined)}
        title="Settle collected COD?"
        description={
          target ? (
            <>
              Mark <span className="font-semibold text-gray-900">{formatPKR(target.amount)}</span> across {target.shipments.length} shipment{target.shipments.length === 1 ? '' : 's'} as settled for{' '}
              <span className="font-semibold text-gray-900">{target.name}</span>.
              <span className="mt-2 block rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-orange-800">
                This is a mock reconciliation. It only updates the demo ledger — no money moves and no payout is sent.
              </span>
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Mark as settled"
        onConfirm={settle}
      />
    </Card>
  )
}
