import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

interface OtpInputProps {
  /** Digits entered so far (0..length characters). */
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  invalid?: boolean
  /** Accessible name for the group, e.g. "Delivery code". */
  label: string
  /** Called when Enter is pressed in any box (instead of submitting the surrounding form). */
  onEnter?: () => void
}

/** Segmented one-time-code input with auto-advance, backspace, arrow keys and paste support. */
export function OtpInput({ value, onChange, length = 4, disabled, invalid, label, onEnter }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const focus = (index: number) => refs.current[Math.max(0, Math.min(length - 1, index))]?.focus()

  const setDigits = (digits: string[]) => onChange(digits.join('').slice(0, length))

  const handleInput = (index: number, raw: string) => {
    let typed = raw.replace(/\D/g, '')
    // A second keystroke in a filled box arrives as "old + new": keep only the new digit.
    if (typed.length === 2 && value[index]) typed = typed.replace(value[index], '')
    if (!typed) return
    // Typing replaces the digit in this box; anything extra (autofill) spills into the next boxes.
    const digits = value.padEnd(index, ' ').split('')
    typed.split('').forEach((d, i) => {
      if (index + i < length) digits[index + i] = d
    })
    const next = digits.join('').replace(/\s/g, '')
    onChange(next.slice(0, length))
    focus(Math.min(index + typed.length, next.length))
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onEnter?.()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      const digits = value.split('')
      if (digits[index]) {
        digits.splice(index, 1)
        setDigits(digits)
      } else if (index > 0) {
        digits.splice(index - 1, 1)
        setDigits(digits)
        focus(index - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      focus(index - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focus(Math.min(index + 1, value.length))
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted)
    focus(pasted.length)
  }

  return (
    <div role="group" aria-label={label} className="flex gap-2.5">
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          pattern="[0-9]*"
          maxLength={length}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          value={value[i] ?? ''}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'tabular h-14 w-12 rounded-lg border border-gray-300 bg-white text-center text-xl font-semibold text-gray-900 shadow-xs transition-colors focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-gray-50 disabled:text-gray-500',
            invalid && 'border-red-400 focus:border-red-400 focus:ring-red-100',
          )}
        />
      ))}
    </div>
  )
}
