import { AlertTriangle, HelpCircle } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/utils/cn'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  /** May be async — the confirm button shows a spinner until it settles, then the dialog closes. */
  onConfirm: () => void | Promise<unknown>
  children?: ReactNode
}

export function ConfirmationDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, onConfirm, children }: ConfirmationDialogProps) {
  const [busy, setBusy] = useState(false)
  const Icon = destructive ? AlertTriangle : HelpCircle

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'That action could not be completed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent title={title} size="sm">
        <div className="flex gap-4">
          <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-full', destructive ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600')}>
            <Icon className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-sm leading-relaxed text-gray-600">{description}</div>
        </div>
        {children && <div className="mt-4">{children}</div>}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'primary'} onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
