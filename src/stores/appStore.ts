import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '../types';

interface TemaApp {
  corPrimaria: string;
  corSecundaria: string;
  logoUrl?: string;
}

interface AppState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
  setUsuario: (usuario: Usuario | null) => void;
  
  tema: TemaApp;
  setTema: (tema: Partial<TemaApp>) => void;
  
  modoApresentacao: boolean;
  toggleModoApresentacao: () => void;
  
  sidebarAberta: boolean;
  toggleSidebar: () => void;
  
  projetoAtualId: string | null;
  setProjetoAtual: (id: string | null) => void;
}

const temaDefault: TemaApp = {
  corPrimaria: '#0ea5e9',
  corSecundaria: '#0284c7',
  logoUrl: undefined,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      usuario: null,
      isAuthenticated: false,
      setUsuario: (usuario) => set({ usuario, isAuthenticated: !!usuario }),
      
      tema: temaDefault,
      setTema: (novoTema) => set((state) => ({
        tema: { ...state.tema, ...novoTema },
      })),
      
      modoApresentacao: false,
      toggleModoApresentacao: () => set((state) => ({
        modoApresentacao: !state.modoApresentacao,
      })),
      
      sidebarAberta: true,
      toggleSidebar: () => set((state) => ({
        sidebarAberta: !state.sidebarAberta,
      })),
      
      projetoAtualId: null,
      setProjetoAtual: (id) => set({ projetoAtualId: id }),
    }),
    {
      name: 'visionplan-storage',
    }
  )
);
