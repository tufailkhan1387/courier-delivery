import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ComponentProps } from 'react'
import { cn } from '@/utils/cn'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({ className, sideOffset = 8, align = 'end', ...props }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden rounded-lg border border-gray-200 bg-white p-1 shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

interface ItemProps extends ComponentProps<typeof Menu.Item> {
  destructive?: boolean
}

export function DropdownMenuItem({ className, destructive, ...props }: ItemProps) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        destructive ? 'text-red-600 data-[highlighted]:bg-red-50' : 'text-gray-700 data-[highlighted]:bg-gray-50 [&_svg]:text-gray-500',
        className,
      )}
      {...props}
    />
  )
}

export function DropdownMenuLabel({ className, ...props }: ComponentProps<typeof Menu.Label>) {
  return <Menu.Label className={cn('px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400', className)} {...props} />
}

export function DropdownMenuSeparator({ className, ...props }: ComponentProps<typeof Menu.Separator>) {
  return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-gray-200', className)} {...props} />
}
