import { ImagePlus, Trash2 } from 'lucide-react'
import { useId, useRef, type ChangeEvent } from 'react'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'

interface FileUploadProps {
  /** Current image as a data URL (preview), or undefined when empty. */
  value?: string
  onChange: (dataUrl: string | undefined) => void
  label?: string
  hint?: string
  /** Opens the camera on mobile devices when supported. */
  capture?: boolean
  className?: string
}

const MAX_EDGE = 900

/** Downscale to keep previews small enough for LocalStorage. */
function toPreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unreadable image'))
    }
    img.src = url
  })
}

/** Image picker with local preview. Nothing is uploaded anywhere — the preview stays in the browser. */
export function FileUpload({ value, onChange, label = 'Add a photo', hint = 'JPG or PNG. Stays on this device (demo).', capture, className }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const id = useId()

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    try {
      onChange(await toPreview(file))
    } catch {
      toast.error('That image could not be read. Try another one.')
    }
  }

  return (
    <div className={className}>
      <input ref={inputRef} id={id} type="file" accept="image/*" capture={capture ? 'environment' : undefined} className="sr-only" onChange={handleFile} />
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-gray-200">
          <img src={value} alt="Selected upload preview" className="max-h-64 w-full bg-gray-50 object-contain" />
          <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-white px-3 py-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="text-sm font-semibold text-brand-700 hover:underline">
              Replace photo
            </button>
            <button type="button" onClick={() => onChange(undefined)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline">
              <Trash2 className="size-4" /> Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={id}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-25 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-25',
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-xs ring-1 ring-gray-200">
            <ImagePlus className="size-5" />
          </span>
          <span className="mt-3 text-sm font-semibold text-brand-700">{label}</span>
          <span className="mt-0.5 text-xs text-gray-500">{hint}</span>
        </label>
      )}
    </div>
  )
}
