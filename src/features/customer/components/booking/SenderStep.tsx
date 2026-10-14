import type { SavedAddress } from '@/types'
import { PartyFields } from './PartyFields'
import { StepHeading } from './StepHeading'

export function SenderStep({ addresses }: { addresses: SavedAddress[] }) {
  return (
    <div>
      <StepHeading title="Sender details" description="Who is sending the parcel, and where should it be collected from?" />
      <PartyFields prefix="sender" addresses={addresses} emailRequired addressLabel="Pickup address" cityLabel="Pickup city" />
    </div>
  )
}
