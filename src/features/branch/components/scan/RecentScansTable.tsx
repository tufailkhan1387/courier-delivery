import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { ScanLog } from '@/types'
import { formatFriendlyDateTime } from '@/utils/format'
import { useScanLogs } from '../../hooks'
import { Tracking } from '../cells'

const columns: ColumnDef<ScanLog, unknown>[] = [
  { accessorKey: 'at', header: 'Time', cell: ({ row }) => <time dateTime={row.original.at}>{formatFriendlyDateTime(row.original.at)}</time> },
  { accessorKey: 'trackingNumber', header: 'Tracking no.', cell: ({ row }) => <Tracking value={row.original.trackingNumber} /> },
  { accessorKey: 'action', header: 'Action', cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.action}</span> },
  { accessorKey: 'resultStatus', header: 'Status after scan', cell: ({ row }) => <StatusBadge status={row.original.resultStatus} /> },
  { accessorKey: 'staffName', header: 'Scanned by' },
]

interface RecentScansTableProps {
  pageSize?: number
  hidePagination?: boolean
  /** Limit to the most recent N scans (dashboards). */
  limit?: number
  onSelect?: (log: ScanLog) => void
}

/** Latest scans recorded at this facility, newest first. */
export function RecentScansTable({ pageSize = 8, hidePagination, limit, onSelect }: RecentScansTableProps) {
  const { data, loading } = useScanLogs()
  return (
    <DataTable
      columns={columns}
      data={limit ? data?.slice(0, limit) : data}
      loading={loading}
      pageSize={pageSize}
      hidePagination={hidePagination}
      onRowClick={onSelect}
      emptyTitle="No scans yet"
      emptyDescription="Scans recorded at this hub will appear here."
    />
  )
}
