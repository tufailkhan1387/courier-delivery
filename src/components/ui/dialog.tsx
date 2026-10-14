import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

const overlayClass =
  'fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0'

const closeClass = 'rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'

interface DialogContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> {
  title: ReactNode
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' }

/** Centered modal. `title` is required for accessibility; body content scrolls when tall. */
export function DialogContent({ title, description, size = 'md', className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl bg-white shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
          SIZE[size],
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="mt-0.5 text-sm text-gray-500">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className={closeClass} aria-label="Close">
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Sticky action row for the bottom of a DialogContent / SheetContent body. */
export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)} {...props} />
}

interface SheetContentProps extends Omit<ComponentProps<typeof DialogPrimitive.Content>, 'title'> {
  title: ReactNode
  description?: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg' | 'xl'
}

const SHEET_WIDTH = { md: 'sm:max-w-md', lg: 'sm:max-w-xl', xl: 'sm:max-w-2xl' }

/** Right-side drawer built on the same Dialog primitive (use inside <Dialog>). */
export function SheetContent({ title, description, footer, width = 'lg', className, children, ...props }: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className={overlayClass} />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-pop duration-300 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right',
          SHEET_WIDTH[width],
          className,
        )}
        {...(description ? {} : { 'aria-describedby': undefined })}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
          <div className="min-w-0">
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="mt-0.5 text-sm text-gray-500">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className={closeClass} aria-label="Close">
            <X className="size-5" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-25 px-6 py-3.5">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
