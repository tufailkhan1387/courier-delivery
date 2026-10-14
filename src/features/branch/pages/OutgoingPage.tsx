import { Bike, ClipboardList, Truck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LastMileTab } from '../components/outgoing/LastMileTab'
import { LinehaulTab } from '../components/outgoing/LinehaulTab'
import { ShipmentDrawer } from '../components/ShipmentDrawer'
import { useBranches, useHubShipments, useManifests } from '../hooks'

export default function OutgoingPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'last-mile' ? 'last-mile' : 'linehaul'
  const { map: branches } = useBranches()
  const hub = useHubShipments()
  const manifests = useManifests()
  const [openId, setOpenId] = useState<string>()
  const loading = hub.loading && !hub.all

  return (
    <>
      <PageHeader
        title="Outgoing Shipments"
        description="Parcels in inventory waiting to leave this hub — by linehaul to other cities or with riders for local delivery."
        actions={
          <Button variant="secondary" asChild>
            <Link to="/branch/dispatch">
              <Truck /> Dispatch board
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setParams(value === 'linehaul' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="linehaul">
            <ClipboardList className="size-4" aria-hidden /> Linehaul (to other cities)
            <Badge tone={tab === 'linehaul' ? 'blue' : 'gray'}>{hub.linehaul.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="last-mile">
            <Bike className="size-4" aria-hidden /> Last-mile (local delivery)
            <Badge tone={tab === 'last-mile' ? 'blue' : 'gray'}>{hub.lastMile.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="linehaul">
          <LinehaulTab shipments={hub.linehaul} manifests={manifests.outbound} branches={branches} loading={loading} onOpen={(s) => setOpenId(s.id)} />
        </TabsContent>
        <TabsContent value="last-mile">
          <LastMileTab shipments={hub.lastMile} loading={loading} onOpen={(s) => setOpenId(s.id)} />
        </TabsContent>
      </Tabs>

      <ShipmentDrawer shipment={hub.all?.find((s) => s.id === openId)} onClose={() => setOpenId(undefined)} />
    </>
  )
}
