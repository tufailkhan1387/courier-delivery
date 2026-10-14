import { Copy, Info, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import type { Party } from '@/types'
import { fullAddress } from '../tasks'

interface NavigateDialogProps {
  /** The stop to show, or null when the dialog is closed. */
  party: Party | null
  /** "Delivery" or "Pickup" — used in the heading. */
  kind?: string
  onClose: () => void
}

/** Static street-grid drawing. Purely decorative: it does not reflect the real address or the rider's position. */
function IllustrativeMap() {
  return (
    <figure className="overflow-hidden rounded-xl border border-gray-200 bg-brand-25">
      <svg viewBox="0 0 160 90" className="block w-full" role="img" aria-label="Illustrative map with a sample route to the stop">
        <rect width="160" height="90" fill="var(--color-brand-25)" />
        {[18, 44, 70].map((y) => (
          <rect key={`h${y}`} x="0" y={y} width="160" height="5" fill="#fff" stroke="var(--color-brand-100)" strokeWidth="0.4" />
        ))}
        {[24, 62, 100, 134].map((x) => (
          <rect key={`v${x}`} x={x} y="0" width="5" height="90" fill="#fff" stroke="var(--color-brand-100)" strokeWidth="0.4" />
        ))}
        <rect x="70" y="26" width="27" height="15" rx="2" fill="#d1fae5" />
        <path d="M 26.5 72.5 H 64.5 V 46.5 H 102.5 V 20.5 H 126" fill="none" stroke="var(--color-brand-600)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3" />
        <circle cx="26.5" cy="72.5" r="5" fill="var(--color-brand-600)" opacity="0.18" />
        <circle cx="26.5" cy="72.5" r="2.6" fill="var(--color-brand-600)" stroke="#fff" strokeWidth="1" />
        <text x="33" y="82" fontSize="5" fill="var(--color-gray-500)">
          Start (sample)
        </text>
        <path d="M 126 21 c -4 -5 -6 -8 -6 -11 a 6 6 0 0 1 12 0 c 0 3 -2 6 -6 11 z" fill="#ef4444" stroke="#fff" strokeWidth="0.8" />
        <circle cx="126" cy="10" r="2" fill="#fff" />
        <text x="118" y="30" fontSize="5" fontWeight="600" fill="var(--color-gray-900)">
          Stop
        </text>
      </svg>
      <figcaption className="border-t border-brand-100 bg-white px-3 py-2 text-xs text-gray-500">Illustration only — not a real map of this address.</figcaption>
    </figure>
  )
}

/** Mock "Navigate" sheet: shows the address and an illustrative map. No GPS or turn-by-turn navigation is started. */
export function NavigateDialog({ party, kind = 'Delivery', onClose }: NavigateDialogProps) {
  const address = party ? fullAddress(party) : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      toast.success('Address copied to clipboard')
    } catch {
      toast.error('Could not copy the address on this device.')
    }
  }

  return (
    <Dialog open={party !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title={`${kind} address`} description="Navigation preview (demo)" size="sm">
        {party && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <MapPin className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{party.name}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{address}</p>
              </div>
            </div>

            <IllustrativeMap />

            <p className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5 text-xs leading-relaxed text-gray-600">
              <Info className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
              This is a demo. No live GPS, location tracking or turn-by-turn navigation is started. Copy the address to use it in your own maps app.
            </p>

            <DialogFooter className="mt-2 sm:flex-col-reverse">
              <Button variant="secondary" size="lg" className="w-full" onClick={onClose}>
                Close
              </Button>
              <Button size="lg" className="w-full" onClick={copy}>
                <Copy /> Copy address
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
