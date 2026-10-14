import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DataTable } from '@/components/shared/DataTable'
import { FilterBar, FilterSelect, SearchInput } from '@/components/shared/FilterBar'
import { PageHeader } from '@/components/shared/PageHeader'
import { StateBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CITIES } from '@/data/cities'
import type { Branch } from '@/types'
import { BranchFormDialog } from '../components/branches/BranchFormDialog'
import { useBranches, useShipments, useStaff } from '../hooks'
import { branchLoad } from '../lib/analytics'

interface BranchRow extends Branch {
  staffCount: number
  atBranch: number
}

export default function BranchesPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data: branches, loading } = useBranches()
  const { data: staff } = useStaff()
  const { data: shipments } = useShipments()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [type, setType] = useState('')
  const [editing, setEditing] = useState<Branch | undefined>()
  // `?new=1` lets other pages (dashboard quick action) open the Add dialog directly.
  const [formOpen, setFormOpen] = useState(params.get('new') === '1')

  const setOpen = (open: boolean) => {
    setFormOpen(open)
    if (!open && params.has('new')) setParams({}, { replace: true })
  }
  const openForm = (branch?: Branch) => {
    setEditing(branch)
    setFormOpen(true)
  }

  const rows = useMemo<BranchRow[] | undefined>(
    () =>
      branches
        ?.filter((b) => (!city || b.city === city) && (!type || b.type === type))
        .map((b) => ({
          ...b,
          staffCount: (staff ?? []).filter((s) => s.branchId === b.id).length,
          atBranch: branchLoad(shipments ?? [], b.id).atBranch,
        })),
    [branches, staff, shipments, city, type],
  )

  const columns = useMemo<ColumnDef<BranchRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Branch',
        accessorFn: (b) => `${b.name} ${b.code}`,
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-gray-900">{row.original.name}</p>
            <p className="font-mono text-xs text-gray-500">{row.original.code}</p>
          </div>
        ),
      },
      { accessorKey: 'city', header: 'City' },
      { accessorKey: 'type', header: 'Type', cell: ({ row }) => <Badge tone={row.original.type === 'hub' ? 'blue' : 'gray'}>{row.original.type === 'hub' ? 'Hub' : 'Branch'}</Badge> },
      { accessorKey: 'managerName', header: 'Manager' },
      { accessorKey: 'staffCount', header: 'Staff', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular">{row.original.staffCount}</span> },
      { accessorKey: 'atBranch', header: 'Parcels at branch', meta: { align: 'right' }, cell: ({ row }) => <span className="tabular font-medium text-gray-900">{row.original.atBranch}</span> },
      { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StateBadge value={row.original.status} /> },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        meta: { align: 'right' },
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${row.original.name}`}
            onClick={(e) => {
              e.stopPropagation()
              openForm(row.original)
            }}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Pencil />
          </Button>
        ),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="Branches"
        description="Hubs and branches that make up the delivery network."
        actions={
          <Button onClick={() => openForm()}>
            <Plus /> Add branch
          </Button>
        }
      />

      <Card>
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Search branch, code or manager…" />
          <FilterSelect label="Cities" value={city} onChange={setCity} options={CITIES.map((c) => ({ value: c, label: c }))} />
          <FilterSelect
            label="Types"
            value={type}
            onChange={setType}
            options={[
              { value: 'hub', label: 'Hub' },
              { value: 'branch', label: 'Branch' },
            ]}
          />
        </FilterBar>
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          globalFilter={search}
          onRowClick={(b) => navigate(`/admin/branches/${b.id}`)}
          emptyTitle="No branches match"
          emptyDescription="Try a different search term or add a new branch."
          emptyAction={
            <Button onClick={() => openForm()}>
              <Plus /> Add branch
            </Button>
          }
        />
      </Card>

      <BranchFormDialog open={formOpen} onOpenChange={setOpen} branch={editing} existingCodes={(branches ?? []).map((b) => b.code)} />
    </>
  )
}
