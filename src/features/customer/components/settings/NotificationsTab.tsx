import { Info } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/controls'

const STORAGE_KEY = 'courierpro.customer.notification-prefs.v1'

const PREFERENCES = [
  { key: 'statusEmail', group: 'Shipment updates', label: 'Email updates', description: 'Booking confirmations and delivery status changes by email.' },
  { key: 'statusSms', group: 'Shipment updates', label: 'SMS updates', description: 'Text messages when a parcel is out for delivery or delivered.' },
  { key: 'deliveryExceptions', group: 'Shipment updates', label: 'Delivery problems', description: 'Alerts for failed attempts, returns and delays.' },
  { key: 'codSettlements', group: 'Billing', label: 'COD and invoices', description: 'Notices when an invoice is issued or COD is collected.' },
  { key: 'supportReplies', group: 'Billing', label: 'Support replies', description: 'A notification when a support ticket is updated.' },
  { key: 'promotions', group: 'Marketing', label: 'Offers and news', description: 'Occasional discounts and product announcements.' },
] as const

type PreferenceKey = (typeof PREFERENCES)[number]['key']
type Preferences = Record<PreferenceKey, boolean>

const DEFAULTS: Preferences = { statusEmail: true, statusSms: true, deliveryExceptions: true, codSettlements: true, supportReplies: true, promotions: false }
const GROUPS = [...new Set(PREFERENCES.map((p) => p.group))]

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const stored = JSON.parse(raw) as Partial<Record<PreferenceKey, unknown>>
    const merged = { ...DEFAULTS }
    for (const { key } of PREFERENCES) {
      const value = stored[key]
      if (typeof value === 'boolean') merged[key] = value
    }
    return merged
  } catch {
    return DEFAULTS
  }
}

function storePreferences(preferences: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    return true
  } catch {
    return false
  }
}

export function NotificationsTab() {
  const baseId = useId()
  const [preferences, setPreferences] = useState(loadPreferences)

  const update = (next: Preferences, message: string) => {
    setPreferences(next)
    if (storePreferences(next)) toast.success(message)
    else toast.error('Your browser blocked storage, so this preference will reset when you reload.')
  }

  const isDefault = PREFERENCES.every(({ key }) => preferences[key] === DEFAULTS[key])

  return (
    <Card className="max-w-3xl">
      <CardHeader
        title="Notification preferences"
        description="Choose which updates you would like to receive."
        action={
          <Button variant="ghost" size="sm" onClick={() => update(DEFAULTS, 'Preferences reset to defaults')} disabled={isDefault}>
            Reset
          </Button>
        }
      />
      <CardContent>
        <p className="flex items-start gap-2.5 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
          These are preferences only, saved in this browser. The demo does not send any emails, SMS or push notifications.
        </p>

        {GROUPS.map((group) => (
          <section key={group} className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{group}</h4>
            <ul className="mt-1 divide-y divide-gray-200">
              {PREFERENCES.filter((p) => p.group === group).map(({ key, label, description }) => {
                const id = `${baseId}-${key}`
                return (
                  <li key={key} className="flex items-center justify-between gap-4 py-3.5">
                    <div className="min-w-0">
                      <label htmlFor={id} className="text-sm font-medium text-gray-900">
                        {label}
                      </label>
                      <p id={`${id}-desc`} className="text-sm text-gray-500">
                        {description}
                      </p>
                    </div>
                    <Switch
                      id={id}
                      aria-describedby={`${id}-desc`}
                      checked={preferences[key]}
                      onCheckedChange={(checked) => update({ ...preferences, [key]: checked }, `${label} turned ${checked ? 'on' : 'off'}`)}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </CardContent>
    </Card>
  )
}
