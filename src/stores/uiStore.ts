import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarOpen: boolean;
  presentationMode: boolean;
  toggleSidebar: () => void;
  togglePresentationMode: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      presentationMode: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      togglePresentationMode: () => set((state) => ({ presentationMode: !state.presentationMode })),
    }),
    {
      name: 'visionplan-ui',
    }
  )
);
