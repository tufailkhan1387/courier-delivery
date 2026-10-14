import { BookUser, Mail, MapPin, Pencil, Phone, Plus, Star, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ConfirmationDialog } from '@/components/shared/ConfirmationDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { addressService } from '@/services'
import type { SavedAddress } from '@/types'
import { AddressFormDialog } from '../components/addresses/AddressFormDialog'
import { useMyAddresses } from '../hooks'

type FormState = { mode: 'add' } | { mode: 'edit'; address: SavedAddress } | null

export default function AddressBookPage() {
  const { data: addresses, loading } = useMyAddresses()
  const [form, setForm] = useState<FormState>(null)
  const [deleting, setDeleting] = useState<SavedAddress | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  // Default address first, then alphabetical by label.
  const sorted = addresses && [...addresses].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.label.localeCompare(b.label))

  const makeDefault = async (address: SavedAddress) => {
    setSettingDefault(address.id)
    try {
      await addressService.save({ ...address, isDefault: true })
      toast.success(`“${address.label}” is now your default address`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not update the default address.')
    } finally {
      setSettingDefault(null)
    }
  }

  const remove = async () => {
    if (!deleting) return
    try {
      await addressService.remove(deleting.id)
      toast.success(`“${deleting.label}” removed from your address book`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete the address.')
    }
  }

  return (
    <>
      <PageHeader
        title="Address Book"
        description="Save the addresses you ship from and to most often."
        actions={
          <Button onClick={() => setForm({ mode: 'add' })}>
            <Plus /> Add address
          </Button>
        }
      />

      {loading && !sorted ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <CardSkeleton key={i} lines={3} />
          ))}
        </div>
      ) : !sorted?.length ? (
        <Card>
          <EmptyState
            icon={BookUser}
            title="No saved addresses"
            description="Add a pickup or delivery address once and reuse it every time you book."
            action={
              <Button onClick={() => setForm({ mode: 'add' })}>
                <Plus /> Add address
              </Button>
            }
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((address) => (
            <li key={address.id}>
              <Card className="flex h-full flex-col">
                <div className="flex-1 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 break-words text-base font-semibold text-gray-900">{address.label}</h2>
                    {address.isDefault && (
                      <Badge tone="blue">
                        <Star className="size-3" aria-hidden /> Default
                      </Badge>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-gray-900">{address.name}</p>
                  <dl className="mt-2 space-y-1.5 text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <dt className="sr-only">Address</dt>
                      <MapPin className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
                      <dd className="min-w-0 break-words">
                        {address.address}, {address.city} {address.postalCode}
                      </dd>
                    </div>
                    <div className="flex items-center gap-2">
                      <dt className="sr-only">Phone</dt>
                      <Phone className="size-4 shrink-0 text-gray-400" aria-hidden />
                      <dd className="tabular">{address.phone}</dd>
                    </div>
                    {address.email && (
                      <div className="flex items-center gap-2">
                        <dt className="sr-only">Email</dt>
                        <Mail className="size-4 shrink-0 text-gray-400" aria-hidden />
                        <dd className="min-w-0 truncate">{address.email}</dd>
                      </div>
                    )}
                  </dl>
                </div>
                <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-5 py-3">
                  {!address.isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => makeDefault(address)} loading={settingDefault === address.id} disabled={settingDefault !== null} className="-ml-2">
                      Set as default
                    </Button>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setForm({ mode: 'edit', address })}>
                      <Pencil /> Edit
                    </Button>
                    <Button variant="destructive-outline" size="sm" onClick={() => setDeleting(address)} aria-label={`Delete ${address.label}`}>
                      <Trash2 /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <AddressFormDialog
          key={form.mode === 'edit' ? form.address.id : 'new'}
          address={form.mode === 'edit' ? form.address : undefined}
          firstAddress={!addresses?.length}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmationDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this address?"
        description={
          deleting ? (
            <>
              <span className="font-medium text-gray-900">{deleting.label}</span> ({deleting.address}, {deleting.city}) will be removed from your address book.
              {deleting.isDefault && ' It is your default address, so you will need to choose a new default.'} Existing shipments are not affected.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Delete address"
        destructive
        onConfirm={remove}
      />
    </>
  )
}
