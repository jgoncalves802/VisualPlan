import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Usuario } from '../types';

interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
  updateUsuario: (usuario: Partial<Usuario>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      token: null,
      
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
      }
    }),
    {
      name: 'visionplan-auth'
    }
  )
);
