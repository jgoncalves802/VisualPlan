import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ProjetoSelecionado {
  id: string | undefined;
  nome: string;
  codigo?: string;
  cor?: string;
}

export interface WbsSelecionado {
  id: string | undefined;
  nome: string;
  codigo?: string;
  cor?: string;
}

interface ProjetoState {
  projetoSelecionado: ProjetoSelecionado;
  wbsSelecionado: WbsSelecionado;
  hasHydrated: boolean;
  
  setProjeto: (projeto: ProjetoSelecionado) => void;
  setWbs: (wbs: WbsSelecionado) => void;
  resetWbs: () => void;
  resetAll: () => void;
  setHasHydrated: (state: boolean) => void;
}

const DEFAULT_PROJETO: ProjetoSelecionado = {
  id: undefined,
  nome: 'Todos os Projetos'
};

const DEFAULT_WBS: WbsSelecionado = {
  id: undefined,
  nome: 'Toda WBS'
};

export const useProjetoStore = create<ProjetoState>()(
  persist(
    (set) => ({
      projetoSelecionado: DEFAULT_PROJETO,
      wbsSelecionado: DEFAULT_WBS,
      hasHydrated: false,

      setProjeto: (projeto) => {
        set({
          projetoSelecionado: projeto,
          wbsSelecionado: DEFAULT_WBS
        });
      },

      setWbs: (wbs) => {
        set({ wbsSelecionado: wbs });
      },

      resetWbs: () => {
        set({ wbsSelecionado: DEFAULT_WBS });
      },

      resetAll: () => {
        set({
          projetoSelecionado: DEFAULT_PROJETO,
          wbsSelecionado: DEFAULT_WBS
        });
      },

      setHasHydrated: (state) => {
        set({ hasHydrated: state });
      }
    }),
    {
      name: 'visionplan-projeto',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
