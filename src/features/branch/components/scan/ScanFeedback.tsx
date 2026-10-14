import { Check, ScanLine, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ScanTone = 'success' | 'warning' | 'error'

export interface ScanFeedbackState {
  tone: ScanTone
  title: string
  message: string
  /** Changes on every scan so the confirmation animation replays. */
  key: number
}

const TONES: Record<ScanTone, { icon: LucideIcon; wrap: string; badge: string; title: string }> = {
  success: { icon: Check, wrap: 'border-emerald-200 bg-emerald-50', badge: 'bg-emerald-500', title: 'text-emerald-900' },
  warning: { icon: TriangleAlert, wrap: 'border-orange-200 bg-orange-50', badge: 'bg-orange-500', title: 'text-orange-900' },
  error: { icon: X, wrap: 'border-red-200 bg-red-50', badge: 'bg-red-500', title: 'text-red-900' },
}

/** Large scan confirmation banner. Announced to assistive tech through the live region. */
export function ScanFeedback({ feedback, busy }: { feedback: ScanFeedbackState | null; busy: boolean }) {
  const tone = feedback ? TONES[feedback.tone] : null
  const Icon = tone?.icon ?? ScanLine
  return (
    <div
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className={cn('flex min-h-[88px] items-center gap-4 rounded-xl border px-4 py-4 sm:px-5', tone ? tone.wrap : 'border-dashed border-gray-300 bg-gray-50')}
    >
      <span
        key={feedback?.key ?? 'idle'}
        className={cn('flex size-14 shrink-0 items-center justify-center rounded-full text-white', tone ? [tone.badge, 'animate-scan-pop'] : 'bg-gray-200 text-gray-500')}
      >
        <Icon className="size-7" strokeWidth={tone ? 3 : 2} aria-hidden />
      </span>
      <div className="min-w-0">
        {feedback && tone ? (
          <>
            <p className={cn('text-lg font-semibold leading-6', tone.title)}>{feedback.title}</p>
            <p className="mt-0.5 text-sm text-gray-700">{feedback.message}</p>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold leading-6 text-gray-900">{busy ? 'Looking up parcel…' : 'Ready to scan'}</p>
            <p className="mt-0.5 text-sm text-gray-500">Scan a barcode or type a tracking number and press Enter.</p>
          </>
        )}
      </div>
    </div>
  )
}
