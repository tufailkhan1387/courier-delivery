import { Bell, ShieldCheck, UserRound, UserX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NotificationsTab } from '../components/settings/NotificationsTab'
import { ProfileTab } from '../components/settings/ProfileTab'
import { SecurityTab } from '../components/settings/SecurityTab'
import { useCurrentCustomer } from '../hooks'

const TABS = ['profile', 'notifications', 'security']

export default function SettingsPage() {
  const { data: customer, loading, refetch } = useCurrentCustomer()
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab') ?? ''
  const tab = TABS.includes(requested) ? requested : 'profile'

  return (
    <>
      <PageHeader title="Profile & Settings" description="Manage your contact details, notification preferences and security." />

      <Tabs value={tab} onValueChange={(value) => setParams(value === 'profile' ? {} : { tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="profile">
            <UserRound className="size-4" aria-hidden /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="size-4" aria-hidden /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="size-4" aria-hidden /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {loading && !customer ? (
            <div className="grid gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <CardSkeleton lines={6} />
              </div>
              <CardSkeleton lines={3} />
            </div>
          ) : customer ? (
            <ProfileTab customer={customer} />
          ) : (
            <Card>
              <EmptyState
                icon={UserX}
                title="Profile unavailable"
                description="We couldn’t load the demo customer profile."
                action={
                  <Button variant="secondary" onClick={refetch}>
                    Try again
                  </Button>
                }
              />
            </Card>
          )}
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
