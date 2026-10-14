import { Info } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { DetailDrawer, DetailList, DetailSection } from '@/components/shared/DetailDrawer'
import { FormField } from '@/components/shared/FormField'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/controls'
import { NativeSelect } from '@/components/ui/input'
import { Avatar } from '@/components/ui/misc'
import { ALL_PERMISSIONS, ROLE_META } from '@/data/directory'
import { staffService } from '@/services'
import type { Branch, Staff, StaffRole } from '@/types'
import { formatDate, titleCase } from '@/utils/format'

const ROLES = Object.keys(ROLE_META) as StaffRole[]
const STATUSES: Staff['status'][] = ['active', 'on_leave', 'inactive']

/** "shipments.update" → "Shipments: Update" */
function permissionLabel(permission: string) {
  const [area, action] = permission.split('.')
  return `${titleCase(area)}: ${titleCase(action ?? '')}`
}

interface Props {
  staff: Staff | undefined
  branches: Branch[]
  onClose: () => void
}

function StaffEditor({ staff, branches, onClose }: { staff: Staff; branches: Branch[]; onClose: () => void }) {
  const groupId = useId()
  const [branchId, setBranchId] = useState(staff.branchId)
  const [role, setRole] = useState(staff.role)
  const [status, setStatus] = useState(staff.status)
  const [permissions, setPermissions] = useState(staff.permissions)
  const [saving, setSaving] = useState(false)

  const dirty =
    branchId !== staff.branchId || role !== staff.role || status !== staff.status || [...permissions].sort().join() !== [...staff.permissions].sort().join()

  const changeRole = (next: StaffRole) => {
    setRole(next)
    setPermissions(ROLE_META[next].permissions)
  }
  const toggle = (permission: string, checked: boolean) =>
    setPermissions((current) => (checked ? [...current, permission] : current.filter((p) => p !== permission)))

  const save = async () => {
    setSaving(true)
    try {
      await staffService.update(staff.id, { branchId, role, status, permissions })
      toast.success(`${staff.name} updated`)
      onClose()
    } catch {
      toast.error('Could not save the changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-4">
        <Avatar name={staff.name} size="xl" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-gray-900">{staff.name}</p>
          <p className="truncate text-sm text-gray-500">{ROLE_META[staff.role].label}</p>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <DetailSection title="Contact">
          <DetailList
            items={[
              { label: 'Email', value: staff.email },
              { label: 'Phone', value: staff.phone },
              { label: 'Joined', value: formatDate(staff.joinedAt) },
              { label: 'Staff ID', value: <span className="font-mono">{staff.id}</span> },
            ]}
          />
        </DetailSection>

        <DetailSection title="Assignment">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Branch" className="sm:col-span-2">
              <NativeSelect value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Role" hint="Changing the role resets permissions to its defaults">
              <NativeSelect value={role} onChange={(e) => changeRole(e.target.value as StaffRole)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Status">
              <NativeSelect value={status} onChange={(e) => setStatus(e.target.value as Staff['status'])}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>
        </DetailSection>

        <DetailSection
          title="Permissions"
          action={
            <Button variant="ghost" size="sm" onClick={() => setPermissions(ROLE_META[role].permissions)}>
              Reset to role defaults
            </Button>
          }
        >
          <p className="mb-4 flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
            <Info className="mt-0.5 size-3.5 shrink-0 text-gray-400" aria-hidden />
            Mock permissions: selections are saved to the demo data but are not enforced anywhere yet.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2" aria-label="Permissions">
            {ALL_PERMISSIONS.map((permission) => {
              const id = `${groupId}-${permission}`
              return (
                <li key={permission} className="flex items-center gap-2.5">
                  <Checkbox id={id} checked={permissions.includes(permission)} onCheckedChange={(checked) => toggle(permission, checked === true)} />
                  <label htmlFor={id} className="cursor-pointer text-sm text-gray-700">
                    {permissionLabel(permission)}
                  </label>
                </li>
              )
            })}
          </ul>
        </DetailSection>
      </div>

      <div className="sticky bottom-0 -mx-6 -mb-5 mt-4 flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-3.5">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Close
        </Button>
        <Button onClick={save} loading={saving} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </div>
  )
}

/** Staff details with editable branch, role, status and (mock) permissions. */
export function StaffDrawer({ staff, branches, onClose }: Props) {
  return (
    <DetailDrawer open={!!staff} onOpenChange={(open) => !open && onClose()} title="Staff details" description="Assignment and access for this team member" width="lg">
      {staff && <StaffEditor key={staff.id} staff={staff} branches={branches} onClose={onClose} />}
    </DetailDrawer>
  )
}
