import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  token: string | null;
  hasHydrated: boolean;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
  updateUsuario: (usuario: Partial<Usuario>) => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      token: null,
      hasHydrated: false,
      
      login: (usuario, token) => {
        set({
          usuario,
          token,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        set({
          usuario: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      updateUsuario: (updates) => {
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...updates } : null
        }));
      },
      
      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      }
    }),
    {
      name: 'visionplan-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
