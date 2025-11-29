import { create } from 'zustand';
import { ObsNode, obsService } from '../services/obsService';

interface ObsState {
  nodes: ObsNode[];
  tree: ObsNode[];
  selectedNode: ObsNode | null;
  isLoading: boolean;
  error: string | null;
  
  loadNodes: (empresaId: string) => Promise<void>;
  loadTree: (empresaId: string) => Promise<void>;
  createNode: (data: {
    empresaId: string;
    parentId?: string | null;
    nome: string;
    codigo?: string;
    descricao?: string;
  }) => Promise<ObsNode>;
  updateNode: (id: string, data: Partial<{
    nome: string;
    codigo: string;
    descricao: string;
    parentId: string | null;
    ordem: number;
  }>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  selectNode: (node: ObsNode | null) => void;
  moveNode: (nodeId: string, newParentId: string | null) => Promise<void>;
  reorderNodes: (nodes: { id: string; ordem: number }[]) => Promise<void>;
  clearError: () => void;
}

export const useObsStore = create<ObsState>((set, get) => ({
  nodes: [],
  tree: [],
  selectedNode: null,
  isLoading: false,
  error: null,

  loadNodes: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const nodes = await obsService.getByEmpresa(empresaId);
      set({ nodes, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  loadTree: async (empresaId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tree = await obsService.getTree(empresaId);
      const nodes = await obsService.getByEmpresa(empresaId);
      set({ tree, nodes, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createNode: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const node = await obsService.create(data);
      const { nodes } = get();
      set({ 
        nodes: [...nodes, node],
        isLoading: false 
      });
      await get().loadTree(data.empresaId);
      return node;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateNode: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedNode = await obsService.update(id, data);
      const { nodes, selectedNode } = get();
      set({
        nodes: nodes.map(n => n.id === id ? updatedNode : n),
        selectedNode: selectedNode?.id === id ? updatedNode : selectedNode,
        isLoading: false,
      });
      if (nodes.length > 0) {
        await get().loadTree(nodes[0].empresaId);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteNode: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await obsService.delete(id);
      const { nodes, selectedNode } = get();
      set({
        nodes: nodes.filter(n => n.id !== id),
        selectedNode: selectedNode?.id === id ? null : selectedNode,
        isLoading: false,
      });
      if (nodes.length > 0) {
        await get().loadTree(nodes[0].empresaId);
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  selectNode: (node) => {
    set({ selectedNode: node });
  },

  moveNode: async (nodeId, newParentId) => {
    set({ isLoading: true, error: null });
    try {
      await obsService.moveNode(nodeId, newParentId);
      const { nodes } = get();
      if (nodes.length > 0) {
        await get().loadTree(nodes[0].empresaId);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  reorderNodes: async (nodes) => {
    set({ isLoading: true, error: null });
    try {
      await obsService.reorder(nodes);
      const storeNodes = get().nodes;
      if (storeNodes.length > 0) {
        await get().loadTree(storeNodes[0].empresaId);
      }
      set({ isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
