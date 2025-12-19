import { supabase } from './supabase';

export interface EpsNode {
  id: string;
  empresaId: string;
  parentId: string | null;
  codigo: string;
  nome: string;
  descricao: string | null;
  responsibleManagerId: string | null;
  responsibleManager?: {
    id: string;
    nome: string;
    codigo: string | null;
  } | null;
  nivel: number;
  ordem: number;
  cor: string;
  icone: string | null;
  pesoEstimado: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  children?: EpsNode[];
}

interface EpsNodeDB {
  id: string;
  empresa_id: string;
  parent_id: string | null;
  codigo: string;
  nome: string;
  descricao: string | null;
  responsible_manager_id: string | null;
  obs_nodes?: {
    id: string;
    nome: string;
    codigo: string | null;
  } | null;
  nivel: number;
  ordem: number;
  cor: string;
  icone: string | null;
  peso_estimado: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const mapFromDB = (node: EpsNodeDB): EpsNode => ({
  id: node.id,
  empresaId: node.empresa_id,
  parentId: node.parent_id,
  codigo: node.codigo,
  nome: node.nome,
  descricao: node.descricao,
  responsibleManagerId: node.responsible_manager_id,
  responsibleManager: node.obs_nodes ? {
    id: node.obs_nodes.id,
    nome: node.obs_nodes.nome,
    codigo: node.obs_nodes.codigo,
  } : null,
  nivel: node.nivel,
  ordem: node.ordem,
  cor: node.cor || '#3B82F6',
  icone: node.icone,
  pesoEstimado: node.peso_estimado ?? 1.0,
  ativo: node.ativo,
  createdAt: node.created_at,
  updatedAt: node.updated_at,
  createdBy: node.created_by,
});

export const epsService = {
  async getByEmpresa(empresaId: string): Promise<EpsNode[]> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nivel', { ascending: true })
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching EPS nodes:', { message: error.message, code: error.code });
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async getTree(empresaId: string): Promise<EpsNode[]> {
    const nodes = await this.getByEmpresa(empresaId);
    return this.buildTree(nodes);
  },

  async getEpsOnlyTree(empresaId: string): Promise<EpsNode[]> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .eq('nivel', 0)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching EPS nodes:', { message: error.message, code: error.code });
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  buildTree(nodes: EpsNode[]): EpsNode[] {
    const nodeMap = new Map<string, EpsNode>();
    const roots: EpsNode[] = [];

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

  /**
   * Get WBS tree for a specific project (EPS node)
   * Returns the project node and all its WBS children as a flat list
   */
  async getProjectWbsTree(projetoId: string): Promise<EpsNode[]> {
    // First get the project node
    const { data: projectNode, error: projectError } = await supabase
      .from('eps_nodes')
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('id', projetoId)
      .eq('ativo', true)
      .single();

    if (projectError || !projectNode) {
      console.error('Error fetching project node:', projectError);
      return [];
    }

    // Then get all descendants (recursive)
    const result: EpsNode[] = [mapFromDB(projectNode)];
    
    const getChildren = async (parentId: string): Promise<void> => {
      const { data: children, error: childError } = await supabase
        .from('eps_nodes')
        .select(`
          *,
          obs_nodes:responsible_manager_id (
            id,
            nome,
            codigo
          )
        `)
        .eq('parent_id', parentId)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (childError || !children) return;

      for (const child of children) {
        result.push(mapFromDB(child));
        await getChildren(child.id);
      }
    };

    await getChildren(projetoId);
    return result;
  },

  async create(data: {
    empresaId: string;
    parentId?: string | null;
    codigo: string;
    nome: string;
    descricao?: string;
    responsibleManagerId?: string | null;
    cor?: string;
    icone?: string;
    ordem?: number;
    pesoEstimado?: number;
  }): Promise<EpsNode> {
    const { data: userData } = await supabase.auth.getUser();
    const maxOrdem = await this.getMaxOrdem(data.empresaId, data.parentId || null);
    const nivel = data.parentId ? await this.getNodeLevel(data.parentId) + 1 : 0;

    const { data: node, error } = await supabase
      .from('eps_nodes')
      .insert({
        empresa_id: data.empresaId,
        parent_id: data.parentId || null,
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao || null,
        responsible_manager_id: data.responsibleManagerId || null,
        nivel,
        ordem: data.ordem ?? maxOrdem + 1,
        cor: data.cor || '#3B82F6',
        icone: data.icone || null,
        peso_estimado: data.pesoEstimado ?? 1.0,
        created_by: userData?.user?.id || null,
      })
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .single();

    if (error) {
      console.error('Error creating EPS node:', error);
      throw error;
    }

    return mapFromDB(node);
  },

  async update(id: string, data: Partial<{
    codigo: string;
    nome: string;
    descricao: string | null;
    responsibleManagerId: string | null;
    parentId: string | null;
    ordem: number;
    cor: string;
    icone: string | null;
    pesoEstimado: number;
    ativo: boolean;
  }>): Promise<EpsNode> {
    const updateData: Record<string, unknown> = {};
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.responsibleManagerId !== undefined) updateData.responsible_manager_id = data.responsibleManagerId;
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.ordem !== undefined) updateData.ordem = data.ordem;
    if (data.cor !== undefined) updateData.cor = data.cor;
    if (data.icone !== undefined) updateData.icone = data.icone;
    if (data.pesoEstimado !== undefined) updateData.peso_estimado = data.pesoEstimado;
    if (data.ativo !== undefined) updateData.ativo = data.ativo;

    const { data: node, error } = await supabase
      .from('eps_nodes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .single();

    if (error) {
      console.error('Error updating EPS node:', error);
      throw error;
    }

    return mapFromDB(node);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('eps_nodes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting EPS node:', error);
      throw error;
    }
  },

  async assignResponsibleManager(epsId: string, obsNodeId: string | null): Promise<EpsNode> {
    return this.update(epsId, { responsibleManagerId: obsNodeId });
  },

  async getMaxOrdem(empresaId: string, parentId: string | null): Promise<number> {
    const query = supabase
      .from('eps_nodes')
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

  async getNodeLevel(nodeId: string): Promise<number> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select('nivel')
      .eq('id', nodeId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.nivel;
  },

  async reorder(empresaId: string, _parentId: string | null, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('eps_nodes')
        .update({ ordem: index })
        .eq('id', id)
        .eq('empresa_id', empresaId)
    );

    await Promise.all(updates);
  },

  async getNodeWithChildren(nodeId: string): Promise<EpsNode | null> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('id', nodeId)
      .single();

    if (error || !data) {
      return null;
    }

    const node = mapFromDB(data);
    const { data: children } = await supabase
      .from('eps_nodes')
      .select(`
        *,
        obs_nodes:responsible_manager_id (
          id,
          nome,
          codigo
        )
      `)
      .eq('parent_id', nodeId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    node.children = (children || []).map(mapFromDB);
    return node;
  },

  async getVisibleEpsForUser(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .rpc('get_visible_eps_for_user', { p_user_id: userId });

    if (error) {
      console.error('Error getting visible EPS for user:', error);
      return [];
    }

    return (data || []).map((d: { eps_node_id: string }) => d.eps_node_id);
  },

  async canAccessEps(userId: string, epsId: string): Promise<boolean> {
    const { data, error } = await supabase
      .rpc('can_access_eps', { p_user_id: userId, p_eps_id: epsId });

    if (error) {
      console.error('Error checking EPS access:', error);
      return false;
    }

    return data === true;
  },

  calculateChildrenWeightSum(node: EpsNode): number {
    if (!node.children || node.children.length === 0) {
      return 0;
    }
    return node.children.reduce((sum, child) => sum + (child.pesoEstimado || 1.0), 0);
  },

  validateWeights(node: EpsNode): { valid: boolean; sum: number; message: string } {
    const sum = this.calculateChildrenWeightSum(node);
    if (!node.children || node.children.length === 0) {
      return { valid: true, sum: 0, message: 'Nenhum subnó cadastrado' };
    }
    const isValid = Math.abs(sum - 1.0) < 0.0001;
    return {
      valid: isValid,
      sum,
      message: isValid 
        ? 'Peso total: 100%' 
        : `Peso total: ${(sum * 100).toFixed(1)}% (deve ser 100%)`
    };
  },
};
