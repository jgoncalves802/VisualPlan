import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario, TemaEmpresa } from '../types';

interface AppState {
  // Autenticação
  usuario: Usuario | null;
  isAuthenticated: boolean;
  setUsuario: (usuario: Usuario | null) => void;
  
  // Tema customizável por empresa
  tema: TemaEmpresa;
  setTema: (tema: Partial<TemaEmpresa>) => void;
  
  // Modo apresentação (RF035)
  modoApresentacao: boolean;
  toggleModoApresentacao: () => void;
  
  // Sidebar
  sidebarAberta: boolean;
  toggleSidebar: () => void;
  
  // Projeto atual
  projetoAtualId: string | null;
  setProjetoAtual: (id: string | null) => void;
}

const temaDefault: TemaEmpresa = {
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
