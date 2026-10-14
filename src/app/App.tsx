import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/misc'
import { router } from '@/routes/router'

export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
    </TooltipProvider>
  )
}
