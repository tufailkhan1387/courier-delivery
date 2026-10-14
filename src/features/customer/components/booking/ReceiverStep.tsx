import type { SavedAddress } from '@/types'
import { PartyFields } from './PartyFields'
import { StepHeading } from './StepHeading'

export function ReceiverStep({ addresses }: { addresses: SavedAddress[] }) {
  return (
    <div>
      <StepHeading title="Receiver details" description="Who will receive the parcel, and where should it be delivered?" />
      <PartyFields prefix="receiver" addresses={addresses} addressLabel="Delivery address" cityLabel="Destination city" />
    </div>
  )
}
