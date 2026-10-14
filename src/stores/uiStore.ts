import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  mobileNavOpen: boolean
  toggleSidebar: () => void
  setMobileNavOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileNavOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
    }),
    { name: 'courierpro.ui', partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }) },
  ),
)
