import { StateBadge } from '@/components/shared/StatusBadge'
import { PAYMENT_LABEL, SERVICE_META } from '@/features/shipments/meta'
import type { Customer, Payment, PriceQuote, Shipment } from '@/types'
import { formatDate, formatPKR } from '@/utils/format'
import { PAYMENT_STATUS_LABEL } from './meta'

interface InvoiceDocumentProps {
  payment: Payment
  shipment: Shipment | undefined
  customer: Customer | undefined
  /** Breakdown recomputed from the current rate card; only shown when it adds up to the invoiced amount. */
  quote: PriceQuote | null | undefined
}

/** Itemised mock invoice. Rendered in the payment drawer and reused for printing. */
export function InvoiceDocument({ payment, shipment, customer, quote }: InvoiceDocumentProps) {
  const itemised = quote && quote.total === payment.amount
  const lines = itemised
    ? [
        { label: `Base rate — ${shipment ? SERVICE_META[shipment.service].label : 'Shipping'}`, amount: quote.base },
        { label: `Weight charge (${quote.chargeableWeightKg} kg chargeable)`, amount: quote.weightCharge },
        { label: 'Fuel surcharge', amount: quote.fuelSurcharge },
        ...(quote.fragileSurcharge ? [{ label: 'Fragile handling', amount: quote.fragileSurcharge }] : []),
        ...(quote.codFee ? [{ label: 'COD fee', amount: quote.codFee }] : []),
      ]
    : [{ label: shipment ? `Shipping charges — ${SERVICE_META[shipment.service].label} service` : 'Shipping charges', amount: payment.amount }]

  return (
    <div className="bg-white text-sm text-gray-700">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-gray-900">CourierPro</p>
          <p className="text-xs text-gray-500">Sample invoice — demo data, not a tax document</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-semibold text-gray-900">{payment.reference}</p>
          <p className="text-xs text-gray-500">Issued {formatDate(payment.date)}</p>
          <div className="mt-1.5">
            <StateBadge value={payment.status} label={PAYMENT_STATUS_LABEL[payment.status]} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-lg bg-gray-50 p-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Billed to</p>
          <p className="mt-1 font-semibold text-gray-900">{customer?.company ?? customer?.name ?? 'Customer'}</p>
          {customer && (
            <>
              <p className="break-words">
                {customer.address}, {customer.city}
              </p>
              <p className="break-all text-gray-500">{customer.email}</p>
            </>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Shipment</p>
          <p className="mt-1 font-mono font-semibold text-gray-900">{payment.trackingNumber}</p>
          {shipment ? (
            <>
              <p>
                {shipment.sender.city} → {shipment.receiver.city}
              </p>
              <p className="text-gray-500">
                To {shipment.receiver.name} · {shipment.parcel.weightKg} kg
              </p>
            </>
          ) : (
            <p className="text-gray-500">Shipment record unavailable</p>
          )}
        </div>
      </div>

      <table className="mt-5 w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th scope="col" className="py-2 pr-4 font-semibold">
              Description
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lines.map((line) => (
            <tr key={line.label}>
              <td className="py-2.5 pr-4 text-gray-700">{line.label}</td>
              <td className="tabular whitespace-nowrap py-2.5 text-right font-medium text-gray-900">{formatPKR(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-300">
            <th scope="row" className="py-3 pr-4 text-left text-sm font-semibold text-gray-900">
              {payment.status === 'refunded' ? 'Total refunded' : payment.status === 'pending' ? 'Total due' : 'Total paid'}
            </th>
            <td className="tabular whitespace-nowrap py-3 text-right text-lg font-semibold text-gray-900">{formatPKR(payment.amount)}</td>
          </tr>
        </tfoot>
      </table>

      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Payment method</dt>
          <dd className="mt-1 font-medium text-gray-900">{PAYMENT_LABEL[payment.method]}</dd>
        </div>
        {shipment && shipment.codAmount > 0 && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">COD amount on this shipment</dt>
            <dd className="tabular mt-1 font-medium text-gray-900">{formatPKR(shipment.codAmount)}</dd>
          </div>
        )}
      </dl>

      {!itemised && <p className="mt-4 text-xs text-gray-500">A line-by-line breakdown is not available for this invoice because rates have changed since it was issued.</p>}
    </div>
  )
}
