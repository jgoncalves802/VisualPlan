import { create } from 'zustand';
import { takeoffService } from '../services/takeoffService';
import type {
  TakeoffDisciplina,
  TakeoffMapa,
  TakeoffItem,
  TakeoffColunaConfig,
  TakeoffTotais,
  TakeoffFilter,
  CreateMapaDTO,
  UpdateMapaDTO,
  CreateItemDTO,
  UpdateItemDTO,
} from '../types/takeoff.types';

interface TakeoffState {
  disciplinas: TakeoffDisciplina[];
  mapas: TakeoffMapa[];
  itens: TakeoffItem[];
  colunasConfig: TakeoffColunaConfig[];
  totais: TakeoffTotais;
  
  selectedDisciplinaId: string | null;
  selectedMapaId: string | null;
  selectedProjetoId: string | null;
  
  filter: TakeoffFilter;
  
  isLoading: boolean;
  isLoadingItens: boolean;
  error: string | null;
  
  loadDisciplinas: (empresaId: string) => Promise<void>;
  initializeDisciplinas: (empresaId: string) => Promise<void>;
  loadColunasConfig: (disciplinaId: string) => Promise<void>;
  loadMapas: (projetoId: string, disciplinaId?: string) => Promise<void>;
  loadItens: (filter: TakeoffFilter) => Promise<void>;
  
  createMapa: (dto: CreateMapaDTO) => Promise<TakeoffMapa | null>;
  updateMapa: (id: string, dto: UpdateMapaDTO) => Promise<TakeoffMapa | null>;
  deleteMapa: (id: string) => Promise<boolean>;
  
  createItem: (dto: CreateItemDTO) => Promise<TakeoffItem | null>;
  createItensBatch: (itens: CreateItemDTO[]) => Promise<number>;
  updateItem: (id: string, dto: UpdateItemDTO) => Promise<TakeoffItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  
  setSelectedDisciplina: (id: string | null) => void;
  setSelectedMapa: (id: string | null) => void;
  setSelectedProjeto: (id: string | null) => void;
  setFilter: (filter: Partial<TakeoffFilter>) => void;
  clearFilter: () => void;
}

const initialTotais: TakeoffTotais = {
  totalItens: 0,
  qtdPrevistaTotal: 0,
  qtdTakeoffTotal: 0,
  qtdExecutadaTotal: 0,
  pesoTotal: 0,
  custoTotal: 0,
  percentualMedio: 0,
};

export const useTakeoffStore = create<TakeoffState>((set, get) => ({
  disciplinas: [],
  mapas: [],
  itens: [],
  colunasConfig: [],
  totais: initialTotais,
  
  selectedDisciplinaId: null,
  selectedMapaId: null,
  selectedProjetoId: null,
  
  filter: {},
  
  isLoading: false,
  isLoadingItens: false,
  error: null,

  loadDisciplinas: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const disciplinas = await takeoffService.getDisciplinas(empresaId);
      set({ disciplinas, isLoading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar disciplinas', isLoading: false });
    }
  },

  initializeDisciplinas: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      await takeoffService.initializeDisciplinasFromTemplates(empresaId);
      const disciplinas = await takeoffService.getDisciplinas(empresaId);
      set({ disciplinas, isLoading: false });
    } catch (error) {
      set({ error: 'Erro ao inicializar disciplinas', isLoading: false });
    }
  },

  loadColunasConfig: async (disciplinaId: string) => {
    try {
      const colunasConfig = await takeoffService.getColunasConfig(disciplinaId);
      set({ colunasConfig });
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
    }
  },

  loadMapas: async (projetoId: string, disciplinaId?: string) => {
    set({ isLoading: true, error: null, selectedProjetoId: projetoId });
    try {
      const mapas = await takeoffService.getMapas(projetoId, disciplinaId);
      set({ mapas, isLoading: false });
    } catch (error) {
      set({ error: 'Erro ao carregar mapas', isLoading: false });
    }
  },

  loadItens: async (filter: TakeoffFilter) => {
    set({ isLoadingItens: true, error: null, filter });
    try {
      const [itens, totais] = await Promise.all([
        takeoffService.getItens(filter),
        takeoffService.getTotais(filter),
      ]);
      set({ itens, totais, isLoadingItens: false });
    } catch (error) {
      set({ error: 'Erro ao carregar itens', isLoadingItens: false });
    }
  },

  createMapa: async (dto: CreateMapaDTO) => {
    try {
      const mapa = await takeoffService.createMapa(dto);
      if (mapa) {
        set((state) => ({ mapas: [mapa, ...state.mapas] }));
      }
      return mapa;
    } catch (error) {
      set({ error: 'Erro ao criar mapa' });
      return null;
    }
  },

  updateMapa: async (id: string, dto: UpdateMapaDTO) => {
    try {
      const mapa = await takeoffService.updateMapa(id, dto);
      if (mapa) {
        set((state) => ({
          mapas: state.mapas.map((m) => (m.id === id ? mapa : m)),
        }));
      }
      return mapa;
    } catch (error) {
      set({ error: 'Erro ao atualizar mapa' });
      return null;
    }
  },

  deleteMapa: async (id: string) => {
    try {
      const success = await takeoffService.deleteMapa(id);
      if (success) {
        set((state) => ({
          mapas: state.mapas.filter((m) => m.id !== id),
        }));
      }
      return success;
    } catch (error) {
      set({ error: 'Erro ao excluir mapa' });
      return false;
    }
  },

  createItem: async (dto: CreateItemDTO) => {
    try {
      const item = await takeoffService.createItem(dto);
      if (item) {
        set((state) => ({ itens: [...state.itens, item] }));
        const { filter } = get();
        const totais = await takeoffService.getTotais(filter);
        set({ totais });
      }
      return item;
    } catch (error) {
      set({ error: 'Erro ao criar item' });
      return null;
    }
  },

  createItensBatch: async (itens: CreateItemDTO[]) => {
    try {
      const count = await takeoffService.createItensBatch(itens);
      if (count > 0) {
        const { filter } = get();
        await get().loadItens(filter);
      }
      return count;
    } catch (error) {
      set({ error: 'Erro ao importar itens' });
      return 0;
    }
  },

  updateItem: async (id: string, dto: UpdateItemDTO) => {
    try {
      const item = await takeoffService.updateItem(id, dto);
      if (item) {
        set((state) => ({
          itens: state.itens.map((i) => (i.id === id ? item : i)),
        }));
        const { filter } = get();
        const totais = await takeoffService.getTotais(filter);
        set({ totais });
      }
      return item;
    } catch (error) {
      set({ error: 'Erro ao atualizar item' });
      return null;
    }
  },

  deleteItem: async (id: string) => {
    try {
      const success = await takeoffService.deleteItem(id);
      if (success) {
        set((state) => ({
          itens: state.itens.filter((i) => i.id !== id),
        }));
        const { filter } = get();
        const totais = await takeoffService.getTotais(filter);
        set({ totais });
      }
      return success;
    } catch (error) {
      set({ error: 'Erro ao excluir item' });
      return false;
    }
  },

  setSelectedDisciplina: (id: string | null) => {
    set({ selectedDisciplinaId: id, selectedMapaId: null, itens: [], totais: initialTotais });
    if (id) {
      get().loadColunasConfig(id);
    }
  },

  setSelectedMapa: (id: string | null) => {
    set({ selectedMapaId: id });
    if (id) {
      get().loadItens({ mapaId: id });
    } else {
      set({ itens: [], totais: initialTotais });
    }
  },

  setSelectedProjeto: (id: string | null) => {
    set({ 
      selectedProjetoId: id, 
      selectedDisciplinaId: null, 
      selectedMapaId: null,
      mapas: [],
      itens: [],
      totais: initialTotais,
    });
  },

  setFilter: (filter: Partial<TakeoffFilter>) => {
    const newFilter = { ...get().filter, ...filter };
    set({ filter: newFilter });
    get().loadItens(newFilter);
  },

  clearFilter: () => {
    const { selectedMapaId } = get();
    const newFilter: TakeoffFilter = selectedMapaId ? { mapaId: selectedMapaId } : {};
    set({ filter: newFilter });
    get().loadItens(newFilter);
  },
}));
