import { PackageSearch, Printer } from 'lucide-react'
import { Link } from 'react-router-dom'
import { DetailDrawer } from '@/components/shared/DetailDrawer'
import { usePrint } from '@/components/shared/PrintLabel'
import { Button } from '@/components/ui/button'
import { calculateQuote } from '@/features/pricing/calc'
import type { Customer, Payment, Shipment } from '@/types'
import type { PricingData } from '../booking/schema'
import { InvoiceDocument } from './InvoiceDocument'

interface InvoiceDrawerProps {
  payment: Payment | undefined
  shipment: Shipment | undefined
  customer: Customer | undefined
  pricing: PricingData | undefined
  onClose: () => void
}

const NOTE: Record<Payment['status'], string> = {
  paid: 'Marked as paid in the demo data. No real money was charged.',
  pending: 'Shipping charges for this COD booking are settled when the parcel is delivered (simulated).',
  refunded: 'Marked as refunded in the demo data. No real money was moved.',
}

export function InvoiceDrawer({ payment, shipment, customer, pricing, onClose }: InvoiceDrawerProps) {
  const { print, portal } = usePrint()

  const quote =
    shipment && pricing
      ? calculateQuote(
          {
            origin: shipment.sender.city,
            destination: shipment.receiver.city,
            service: shipment.service,
            weightKg: shipment.parcel.weightKg,
            dimensions: shipment.parcel.dimensions,
            quantity: shipment.parcel.quantity,
            fragile: shipment.parcel.fragile,
            codAmount: shipment.codAmount,
          },
          pricing.rates,
          pricing.config,
        )
      : undefined

  const document = payment && <InvoiceDocument payment={payment} shipment={shipment} customer={customer} quote={quote} />

  return (
    <>
      <DetailDrawer
        open={!!payment}
        onOpenChange={(open) => !open && onClose()}
        title={payment ? <span className="font-mono">{payment.reference}</span> : 'Invoice'}
        description="Invoice details"
        footer={
          payment && (
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => print(<div className="p-8">{document}</div>)}>
                <Printer /> Print invoice
              </Button>
              <Button size="sm" asChild>
                <Link to={`/customer/track/${payment.trackingNumber}`}>
                  <PackageSearch /> Track shipment
                </Link>
              </Button>
            </div>
          )
        }
      >
        {payment && (
          <>
            {document}
            <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">{NOTE[payment.status]}</p>
          </>
        )}
      </DetailDrawer>
      {portal}
    </>
  )
}
