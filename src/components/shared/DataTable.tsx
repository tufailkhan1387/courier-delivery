import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
import { EmptyState } from './EmptyState'
import { TableSkeleton } from './LoadingSkeleton'

interface DataTableProps<T> {
  columns: ColumnDef<T, unknown>[]
  data: T[] | undefined
  loading?: boolean
  /** Free-text filter applied across all columns' accessor values. */
  globalFilter?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  /** Hide the pagination footer (e.g. short "recent" tables on dashboards). */
  hidePagination?: boolean
  initialSorting?: SortingState
  className?: string
}

/**
 * Sortable, paginated table built on TanStack Table.
 * Columns opt out of sorting with `enableSorting: false`; right-align with `meta: { align: 'right' }`.
 */
export function DataTable<T>({
  columns,
  data,
  loading,
  globalFilter,
  pageSize = 10,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your search or filters.',
  emptyAction,
  hidePagination,
  initialSorting = [],
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    autoResetPageIndex: true,
  })

  if (loading && !data) return <TableSkeleton columns={Math.min(columns.length, 6)} />

  const rows = table.getRowModel().rows
  const total = table.getFilteredRowModel().rows.length
  const { pageIndex, pageSize: size } = table.getState().pagination
  const alignOf = (meta: unknown) => ((meta as { align?: string } | undefined)?.align === 'right' ? 'text-right' : 'text-left')

  return (
    <div className={className}>
      <div className="relative w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-y border-gray-200 bg-gray-50">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                      className={cn('whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500', alignOf(header.column.columnDef.meta))}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button type="button" onClick={header.column.getToggleSortingHandler()} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-gray-700">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' ? <ArrowUp className="size-3.5" /> : sorted === 'desc' ? <ArrowDown className="size-3.5" /> : <ChevronsUpDown className="size-3.5 text-gray-300" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row.original) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn('transition-colors hover:bg-gray-50/70', onRowClick && 'cursor-pointer')}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className={cn('whitespace-nowrap px-5 py-3.5 text-gray-600', alignOf(cell.column.columnDef.meta))}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}

      {!hidePagination && total > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-5 py-3 sm:flex-row">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{pageIndex * size + 1}</span>–
            <span className="font-medium text-gray-700">{Math.min((pageIndex + 1) * size, total)}</span> of{' '}
            <span className="font-medium text-gray-700">{total}</span>
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft /> Previous
            </Button>
            <span className="tabular px-1 text-sm text-gray-500">
              Page {pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </span>
            <Button variant="secondary" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
