import { create } from 'zustand';
import { epsService, type EpsNode } from '../services/epsService';

interface EpsState {
  nodes: EpsNode[];
  projetos: EpsNode[];
  isLoading: boolean;
  error: string | null;
  loadNodes: (empresaId: string) => Promise<void>;
  loadProjetos: (empresaId: string) => Promise<void>;
}

export const useEpsStore = create<EpsState>((set) => ({
  nodes: [],
  projetos: [],
  isLoading: false,
  error: null,

  loadNodes: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await epsService.getByEmpresa(empresaId);
      set({ nodes, isLoading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar nós EPS', isLoading: false });
    }
  },

  loadProjetos: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await epsService.getByEmpresa(empresaId);
      const projetos = nodes.filter(n => n.nivel === 0 && n.parentId === null);
      set({ projetos, isLoading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar projetos', isLoading: false });
    }
  },
}));
