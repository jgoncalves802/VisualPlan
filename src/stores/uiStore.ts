import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  presentationMode: boolean;
  adminMode: boolean;
  toggleSidebar: () => void;
  togglePresentationMode: () => void;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      presentationMode: false,
      adminMode: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      togglePresentationMode: () => set((state) => ({ presentationMode: !state.presentationMode })),
      toggleAdminMode: () => set((state) => ({ adminMode: !state.adminMode })),
      setAdminMode: (value: boolean) => set({ adminMode: value }),
    }),
    {
      name: 'visionplan-ui',
    }
  )
);
