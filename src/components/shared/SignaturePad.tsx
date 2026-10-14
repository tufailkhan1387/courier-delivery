import { Eraser } from 'lucide-react'
import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { cn } from '@/utils/cn'

interface SignaturePadProps {
  /** Called with a PNG data URL after each stroke, or undefined when cleared. */
  onChange: (dataUrl: string | undefined) => void
  className?: string
  height?: number
}

/** Pointer-based signature capture (mouse, touch and stylus). */
export function SignaturePad({ onChange, className, height = 180 }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  // Match the canvas backing store to its CSS size for crisp lines.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(ratio, ratio)
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#101828'
  }, [])

  const point = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const start = (e: PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = true
    const { x, y } = point(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const move = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = point(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const end = () => {
    if (!drawing.current) return
    drawing.current = false
    setHasInk(true)
    onChange(canvasRef.current?.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    setHasInk(false)
    onChange(undefined)
  }

  return (
    <div className={cn('overflow-hidden rounded-xl border border-gray-300 bg-white', className)}>
      <div className="relative">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature area. Draw the recipient's signature here."
          style={{ height }}
          className="block w-full touch-none bg-[linear-gradient(transparent_calc(100%-36px),var(--color-gray-200)_calc(100%-36px),var(--color-gray-200)_calc(100%-35px),transparent_calc(100%-35px))]"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {!hasInk && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">Sign here</p>}
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-25 px-3 py-2">
        <span className="text-xs text-gray-500">{hasInk ? 'Signature captured' : 'Use a finger, stylus or mouse'}</span>
        <button type="button" onClick={clear} disabled={!hasInk} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40">
          <Eraser className="size-4" /> Clear
        </button>
      </div>
    </div>
  )
}
