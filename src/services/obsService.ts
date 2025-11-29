import { supabase } from './supabase';

export interface ObsNode {
  id: string;
  empresaId: string;
  parentId: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  nivel: number;
  ordem: number;
  path: string | null;
  metadata: Record<string, unknown>;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  responsibleManagerId: string | null;
  responsibleManager?: {
    id: string;
    nome: string;
    email: string;
  } | null;
  children?: ObsNode[];
}

interface ObsNodeDB {
  id: string;
  empresa_id: string;
  parent_id: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  nivel: number;
  ordem: number;
  path: string | null;
  metadata: Record<string, unknown>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  responsible_manager_id: string | null;
  usuarios?: {
    id: string;
    nome: string;
    email: string;
  } | null;
}

const mapFromDB = (node: ObsNodeDB): ObsNode => ({
  id: node.id,
  empresaId: node.empresa_id,
  parentId: node.parent_id,
  nome: node.nome,
  codigo: node.codigo,
  descricao: node.descricao,
  nivel: node.nivel,
  ordem: node.ordem,
  path: node.path,
  metadata: node.metadata || {},
  ativo: node.ativo,
  createdAt: node.created_at,
  updatedAt: node.updated_at,
  responsibleManagerId: node.responsible_manager_id || null,
  responsibleManager: node.usuarios ? {
    id: node.usuarios.id,
    nome: node.usuarios.nome,
    email: node.usuarios.email,
  } : null,
});

export const obsService = {
  async getByEmpresa(empresaId: string): Promise<ObsNode[]> {
    // Try with responsible_manager join first, fallback to simple query
    let data;
    let error;
    
    // First try with the responsible_manager join
    const result1 = await supabase
      .from('obs_nodes')
      .select(`
        *,
        usuarios:responsible_manager_id (
          id,
          nome,
          email
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nivel', { ascending: true })
      .order('ordem', { ascending: true });
    
    // If the join fails (field doesn't exist), try simple query
    if (result1.error && result1.error.code === 'PGRST200') {
      console.log('responsible_manager_id field not found, using simple query');
      const result2 = await supabase
        .from('obs_nodes')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nivel', { ascending: true })
        .order('ordem', { ascending: true });
      
      data = result2.data;
      error = result2.error;
    } else {
      data = result1.data;
      error = result1.error;
    }

    if (error) {
      console.error('Error fetching OBS nodes:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getTree(empresaId: string): Promise<ObsNode[]> {
    const nodes = await this.getByEmpresa(empresaId);
    return this.buildTree(nodes);
  },

  buildTree(nodes: ObsNode[]): ObsNode[] {
    const nodeMap = new Map<string, ObsNode>();
    const roots: ObsNode[] = [];

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach(node => {
      const currentNode = nodeMap.get(node.id)!;
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(currentNode);
      } else {
        roots.push(currentNode);
      }
    });

    return roots;
  },

  async create(data: {
    empresaId: string;
    parentId?: string | null;
    nome: string;
    codigo?: string;
    descricao?: string;
    ordem?: number;
  }): Promise<ObsNode> {
    const maxOrdem = await this.getMaxOrdem(data.empresaId, data.parentId || null);
    
    const { data: node, error } = await supabase
      .from('obs_nodes')
      .insert({
        empresa_id: data.empresaId,
        parent_id: data.parentId || null,
        nome: data.nome,
        codigo: data.codigo || null,
        descricao: data.descricao || null,
        ordem: data.ordem ?? maxOrdem + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating OBS node:', error);
      throw error;
    }

    return mapFromDB(node);
  },

  async update(id: string, data: Partial<{
    nome: string;
    codigo: string;
    descricao: string;
    parentId: string | null;
    ordem: number;
    ativo: boolean;
    metadata: Record<string, unknown>;
  }>): Promise<ObsNode> {
    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const { data: node, error } = await supabase
      .from('obs_nodes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating OBS node:', error);
      throw error;
    }

    return mapFromDB(node);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('obs_nodes')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting OBS node:', error);
      throw error;
    }
  },

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase
      .from('obs_nodes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error hard deleting OBS node:', error);
      throw error;
    }
  },

  async reorder(nodes: { id: string; ordem: number }[]): Promise<void> {
    for (const node of nodes) {
      await supabase
        .from('obs_nodes')
        .update({ ordem: node.ordem })
        .eq('id', node.id);
    }
  },

  async getMaxOrdem(empresaId: string, parentId: string | null): Promise<number> {
    const query = supabase
      .from('obs_nodes')
      .select('ordem')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (parentId) {
      query.eq('parent_id', parentId);
    } else {
      query.is('parent_id', null);
    }

    const { data, error } = await query.order('ordem', { ascending: false }).limit(1);

    if (error || !data || data.length === 0) {
      return 0;
    }

    return data[0].ordem;
  },

  async moveNode(nodeId: string, newParentId: string | null): Promise<ObsNode> {
    return this.update(nodeId, { parentId: newParentId });
  },

  async getNodeWithChildren(nodeId: string): Promise<ObsNode | null> {
    const { data, error } = await supabase
      .from('obs_nodes')
      .select(`
        *,
        usuarios:responsible_manager_id (
          id,
          nome,
          email
        )
      `)
      .eq('id', nodeId)
      .single();

    if (error || !data) {
      return null;
    }

    const node = mapFromDB(data);
    const { data: children } = await supabase
      .from('obs_nodes')
      .select(`
        *,
        usuarios:responsible_manager_id (
          id,
          nome,
          email
        )
      `)
      .eq('parent_id', nodeId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    node.children = (children || []).map(mapFromDB);
    return node;
  },

  async assignResponsibleManager(nodeId: string, userId: string | null): Promise<ObsNode> {
    // First check if the node exists and is accessible
    const { error: checkError } = await supabase
      .from('obs_nodes')
      .select('id')
      .eq('id', nodeId)
      .single();

    if (checkError) {
      console.error('Error checking node:', checkError);
      if (checkError.code === 'PGRST116') {
        throw new Error('Nó OBS não encontrado ou sem permissão de acesso.');
      }
      throw checkError;
    }

    // Try to update with the responsible_manager_id field
    const { data, error } = await supabase
      .from('obs_nodes')
      .update({ responsible_manager_id: userId })
      .eq('id', nodeId)
      .select('*')
      .single();

    if (error) {
      console.error('Error assigning responsible manager:', error);
      // Check specific error types
      if (error.code === 'PGRST116') {
        throw new Error('Erro de permissão RLS. O UPDATE foi bloqueado. Verifique as políticas de segurança.');
      }
      if (error.code === '42703' || error.message?.includes('column')) {
        throw new Error('O campo responsible_manager_id não existe. Execute a migração SQL.');
      }
      if (error.code === '42501') {
        throw new Error('Sem permissão para atualizar. Verifique as políticas RLS.');
      }
      throw new Error(`Erro: ${error.message || error.code}`);
    }

    return mapFromDB(data);
  },

  async getNodesByResponsibleManager(userId: string): Promise<ObsNode[]> {
    const { data, error } = await supabase
      .from('obs_nodes')
      .select(`
        *,
        usuarios:responsible_manager_id (
          id,
          nome,
          email
        )
      `)
      .eq('responsible_manager_id', userId)
      .eq('ativo', true)
      .order('nivel', { ascending: true })
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching nodes by responsible manager:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },
};
