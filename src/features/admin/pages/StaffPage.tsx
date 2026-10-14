import type { ColumnDef } from '@tanstack/react-table'
import { UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ROLE_META } from '@/data/directory'
import type { Staff, StaffRole } from '@/types'
import { formatDate } from '@/utils/format'
import { PersonCell } from '../components/PersonCell'
import { StaffDrawer } from '../components/staff/StaffDrawer'
import { StaffFormDialog } from '../components/staff/StaffFormDialog'
import { useBranches, useLookup, useStaff } from '../hooks'

const ROLE_OPTIONS = (Object.keys(ROLE_META) as StaffRole[]).map((r) => ({ value: r, label: ROLE_META[r].label }))

export default function StaffPage() {
  const [params] = useSearchParams()
  const { data: staff, loading } = useStaff()
  const { data: branches } = useBranches()
  const branchById = useLookup(branches)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [branchId, setBranchId] = useState(params.get('branch') ?? '')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const rows = useMemo(() => staff?.filter((s) => (!role || s.role === role) && (!branchId || s.branchId === branchId)), [staff, role, branchId])

  const columns = useMemo<ColumnDef<Staff, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Employee',
        accessorFn: (s) => `${s.name} ${s.email}`,
        cell: ({ row }) => <PersonCell name={row.original.name} sub={row.original.email} />,
      },
      { id: 'role', header: 'Role', accessorFn: (s) => ROLE_META[s.role].label, cell: ({ getValue }) => <Badge>{String(getValue())}</Badge> },
      { id: 'branch', header: 'Branch', accessorFn: (s) => branchById.get(s.branchId)?.name ?? '—' },
      { accessorKey: 'phone', header: 'Phone', enableSorting: false, cell: ({ row }) => <span className="tabular">{row.original.phone}</span> },
      { id: 'permissions', header: 'Permissions', accessorFn: (s) => s.permissions.length, meta: { align: 'right' }, cell: ({ getValue }) => <span className="tabular">{String(getValue())}</span> },
      { accessorKey: 'joinedAt', header: 'Joined', cell: ({ row }) => formatDate(row.original.joinedAt) },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StateBadge value={row.original.status} /> },
    ],
    [branchById],
  )

  return (
    <>
      <PageHeader
        title="Staff"
        description="Employee directory with branch assignments, roles and permissions."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <UserPlus /> Add staff
          </Button>
        }
      />

      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email or branch…" />
          <FilterSelect label="Roles" value={role} onChange={setRole} options={ROLE_OPTIONS} />
          <FilterSelect label="Branches" value={branchId} onChange={setBranchId} options={(branches ?? []).map((b) => ({ value: b.id, label: b.name }))} className="sm:w-60" />
        </FilterBar>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          globalFilter={search}
          onRowClick={(s) => setSelectedId(s.id)}
          emptyTitle="No staff match"
          emptyDescription="Try a different search term or clear the filters."
          emptyAction={
            <Button onClick={() => setFormOpen(true)}>
              <UserPlus /> Add staff
            </Button>
          }
        />
      </Card>

      <StaffDrawer staff={staff?.find((s) => s.id === selectedId)} branches={branches ?? []} onClose={() => setSelectedId(null)} />
      <StaffFormDialog open={formOpen} onOpenChange={setFormOpen} branches={branches ?? []} defaultBranchId={branchId || undefined} />
    </>
  )
}
