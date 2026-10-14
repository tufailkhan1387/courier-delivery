import { EmptyState } from '@/components/shared/EmptyState'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { cn } from '@/utils/cn'
import type { ReportDataset } from './reportData'

/** Read-only table for a report dataset; scrolls inside its card when long or wide. */
export function ReportTable({ dataset, loading, emptyTitle = 'No data for this period' }: { dataset: ReportDataset; loading?: boolean; emptyTitle?: string }) {
  if (loading) return <TableSkeleton columns={Math.min(dataset.columns.length, 6)} />
  if (dataset.rows.length === 0) return <EmptyState title={emptyTitle} description="Try a longer date range." className="py-10" />
  return (
    <div className="max-h-[28rem] overflow-auto border-t border-gray-200">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 shadow-[inset_0_-1px_0_var(--color-gray-200)]">
          <tr>
            {dataset.columns.map((c) => (
              <th key={c.key} scope="col" className={cn('whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500', c.align === 'right' ? 'text-right' : 'text-left')}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {dataset.rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/70">
              {dataset.columns.map((c, ci) => (
                <td
                  key={c.key}
                  className={cn('whitespace-nowrap px-5 py-3 text-gray-600', c.align === 'right' && 'tabular text-right', c.mono && 'font-mono font-semibold text-gray-900', ci === 0 && !c.mono && 'font-medium text-gray-900')}
                >
                  {c.format ? c.format(row[c.key]) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
