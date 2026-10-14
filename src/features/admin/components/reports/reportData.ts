// Builds the table shown on each report tab. The same dataset feeds the on-screen table and the CSV export.
import { STATUS_META } from '@/features/shipments/meta'
import type { Customer, Shipment } from '@/types'
import { formatDateTime, formatPKR } from '@/utils/format'
import { failedAt, inRange, type PerformanceRow, type SeriesPoint } from '../../lib/analytics'
import type { CsvCell } from '../../lib/csv'

export interface ReportColumn {
  key: string
  label: string
  align?: 'right'
  mono?: boolean
  /** Display formatting only — the CSV always gets the raw value. */
  format?: (value: CsvCell) => string
}

export interface ReportDataset {
  filename: string
  columns: ReportColumn[]
  rows: Record<string, CsvCell>[]
}

const money = (value: CsvCell) => formatPKR(Number(value))
const rate = (value: CsvCell) => (value === '' ? '—' : `${value}%`)
const num: Pick<ReportColumn, 'align'> = { align: 'right' }

export function performanceDataset(series: SeriesPoint[], periodLabel: string): ReportDataset {
  return {
    filename: 'shipment-performance',
    columns: [
      { key: 'period', label: periodLabel },
      { key: 'booked', label: 'Booked', ...num },
      { key: 'delivered', label: 'Delivered', ...num },
      { key: 'failed', label: 'Failed attempts', ...num },
    ],
    rows: series.map((p) => ({ period: p.date, booked: p.booked, delivered: p.delivered, failed: p.failed })),
  }
}

export function successDataset(series: SeriesPoint[], periodLabel: string): ReportDataset {
  return {
    filename: 'delivery-success-rate',
    columns: [
      { key: 'period', label: periodLabel },
      { key: 'delivered', label: 'Delivered', ...num },
      { key: 'failed', label: 'Failed attempts', ...num },
      { key: 'successRate', label: 'Success rate', ...num, format: rate },
    ],
    rows: series.map((p) => ({ period: p.date, delivered: p.delivered, failed: p.failed, successRate: p.successRate ?? '' })),
  }
}

/** Shipments with a failed delivery attempt inside the range, newest first. */
export function failedShipments(shipments: Shipment[], since: number) {
  return shipments
    .map((s) => ({ shipment: s, at: failedAt(s) }))
    .filter((f): f is { shipment: Shipment; at: string } => inRange(f.at, since))
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function failedDataset(failed: ReturnType<typeof failedShipments>, customers: Map<string, Customer>): ReportDataset {
  return {
    filename: 'failed-deliveries',
    columns: [
      { key: 'trackingNumber', label: 'Tracking no.', mono: true },
      { key: 'customer', label: 'Customer' },
      { key: 'destination', label: 'Destination' },
      { key: 'reason', label: 'Reason' },
      { key: 'failedAt', label: 'Failed at', format: (v) => formatDateTime(String(v)) },
      { key: 'attempts', label: 'Attempts', ...num },
      { key: 'status', label: 'Current status' },
    ],
    rows: failed.map(({ shipment: s, at }) => ({
      trackingNumber: s.trackingNumber,
      customer: customers.get(s.customerId)?.name ?? '',
      destination: s.receiver.city,
      reason: s.failureReason ?? 'Not recorded',
      failedAt: at,
      attempts: s.attempts,
      status: STATUS_META[s.status].label,
    })),
  }
}

export function branchDataset(rows: PerformanceRow[]): ReportDataset {
  return {
    filename: 'branch-performance',
    columns: [
      { key: 'branch', label: 'Branch' },
      { key: 'city', label: 'City' },
      { key: 'originated', label: 'Originated', ...num },
      { key: 'delivered', label: 'Delivered', ...num },
      { key: 'failed', label: 'Failed attempts', ...num },
      { key: 'successRate', label: 'Success rate', ...num, format: rate },
      { key: 'codCollected', label: 'COD collected', ...num, format: money },
    ],
    rows: rows.map((r) => ({ branch: r.name, city: r.group, originated: r.originated, delivered: r.delivered, failed: r.failed, successRate: r.successRate ?? '', codCollected: r.codCollected })),
  }
}

export function driverDataset(rows: PerformanceRow[]): ReportDataset {
  return {
    filename: 'driver-performance',
    columns: [
      { key: 'driver', label: 'Driver' },
      { key: 'branch', label: 'Branch' },
      { key: 'delivered', label: 'Delivered', ...num },
      { key: 'failed', label: 'Failed attempts', ...num },
      { key: 'successRate', label: 'Success rate', ...num, format: rate },
      { key: 'codCollected', label: 'COD collected', ...num, format: money },
    ],
    rows: rows.map((r) => ({ driver: r.name, branch: r.group, delivered: r.delivered, failed: r.failed, successRate: r.successRate ?? '', codCollected: r.codCollected })),
  }
}

export function codDataset(series: SeriesPoint[], periodLabel: string): ReportDataset {
  return {
    filename: 'cod-report',
    columns: [
      { key: 'period', label: periodLabel },
      { key: 'awaiting', label: 'Collected, awaiting settlement', ...num, format: money },
      { key: 'settled', label: 'Settled', ...num, format: money },
      { key: 'total', label: 'Total collected', ...num, format: money },
    ],
    rows: series.map((p) => ({ period: p.date, awaiting: p.codAwaiting, settled: p.codSettled, total: p.codAwaiting + p.codSettled })),
  }
}
