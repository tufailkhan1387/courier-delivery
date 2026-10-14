import { Check } from 'lucide-react'
import { cn } from '@/utils/cn'

interface StepperProps {
  steps: { title: string; description?: string }[]
  /** Zero-based index of the active step. */
  current: number
  /** When provided, completed steps become clickable. */
  onStepClick?: (index: number) => void
  className?: string
}

export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      {/* Compact progress on mobile */}
      <div className="sm:hidden">
        <p className="text-sm font-medium text-brand-700">
          Step {current + 1} of {steps.length}
        </p>
        <p className="text-base font-semibold text-gray-900">{steps[current]?.title}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full rounded-full bg-brand-600 transition-all duration-300" style={{ width: `${((current + 1) / steps.length) * 100}%` }} />
        </div>
      </div>

      <ol className="hidden items-start sm:flex">
        {steps.map((step, i) => {
          const done = i < current
          const active = i === current
          const clickable = done && !!onStepClick
          return (
            <li key={step.title} className={cn('relative flex-1', i === steps.length - 1 && 'flex-none')} aria-current={active ? 'step' : undefined}>
              {i < steps.length - 1 && (
                <span className={cn('absolute left-9 right-0 top-4 h-0.5 -translate-y-1/2', done ? 'bg-brand-600' : 'bg-gray-200')} aria-hidden />
              )}
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStepClick?.(i)}
                className={cn('group relative flex flex-col items-start gap-2 pr-4 text-left', clickable ? 'cursor-pointer' : 'cursor-default')}
              >
                <span
                  className={cn(
                    'relative z-10 flex size-8 items-center justify-center rounded-full text-sm font-semibold ring-4 ring-white transition-colors',
                    done && 'bg-brand-600 text-white group-hover:bg-brand-700',
                    active && 'border-2 border-brand-600 bg-brand-50 text-brand-700',
                    !done && !active && 'border border-gray-300 bg-white text-gray-500',
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                </span>
                <span>
                  <span className={cn('block text-sm font-semibold', active ? 'text-brand-700' : done ? 'text-gray-900' : 'text-gray-500')}>{step.title}</span>
                  {step.description && <span className="hidden text-xs text-gray-500 lg:block">{step.description}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
