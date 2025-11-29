import { supabase } from './supabase';

export interface HierarchyLevel {
  id: string;
  empresaId: string;
  nome: string;
  codigo: string;
  descricao?: string;
  nivelOrdem: number;
  cor: string;
  icone?: string;
  isDefault: boolean;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface HierarchyLevelDB {
  id: string;
  empresa_id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  nivel_ordem: number;
  cor: string;
  icone: string | null;
  is_default: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const mapFromDB = (data: HierarchyLevelDB): HierarchyLevel => ({
  id: data.id,
  empresaId: data.empresa_id,
  nome: data.nome,
  codigo: data.codigo,
  descricao: data.descricao || undefined,
  nivelOrdem: data.nivel_ordem,
  cor: data.cor,
  icone: data.icone || undefined,
  isDefault: data.is_default,
  ativo: data.ativo,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const hierarchyService = {
  async getByEmpresa(empresaId: string): Promise<HierarchyLevel[]> {
    const { data, error } = await supabase
      .from('hierarchy_levels')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nivel_ordem', { ascending: true });

    if (error) {
      console.error('Error fetching hierarchy levels:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<HierarchyLevel | null> {
    const { data, error } = await supabase
      .from('hierarchy_levels')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching hierarchy level:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async create(data: {
    empresaId: string;
    nome: string;
    codigo: string;
    descricao?: string;
    nivelOrdem?: number;
    cor?: string;
    icone?: string;
  }): Promise<HierarchyLevel> {
    const { data: existing } = await supabase
      .from('hierarchy_levels')
      .select('nivel_ordem')
      .eq('empresa_id', data.empresaId)
      .order('nivel_ordem', { ascending: false })
      .limit(1);

    const nextOrdem = existing && existing.length > 0 
      ? existing[0].nivel_ordem + 1 
      : 0;

    const { data: created, error } = await supabase
      .from('hierarchy_levels')
      .insert({
        empresa_id: data.empresaId,
        nome: data.nome,
        codigo: data.codigo,
        descricao: data.descricao || null,
        nivel_ordem: data.nivelOrdem ?? nextOrdem,
        cor: data.cor || '#3B82F6',
        icone: data.icone || null,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating hierarchy level:', error);
      throw error;
    }

    return mapFromDB(created);
  },

  async update(id: string, data: {
    nome?: string;
    codigo?: string;
    descricao?: string;
    nivelOrdem?: number;
    cor?: string;
    icone?: string;
  }): Promise<HierarchyLevel> {
    const updateData: Record<string, unknown> = {};
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.nivelOrdem !== undefined) updateData.nivel_ordem = data.nivelOrdem;
    if (data.cor !== undefined) updateData.cor = data.cor;
    if (data.icone !== undefined) updateData.icone = data.icone;

    const { data: updated, error } = await supabase
      .from('hierarchy_levels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating hierarchy level:', error);
      throw error;
    }

    return mapFromDB(updated);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('hierarchy_levels')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting hierarchy level:', error);
      throw error;
    }
  },

  async reorder(empresaId: string, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('hierarchy_levels')
        .update({ nivel_ordem: index })
        .eq('id', id)
        .eq('empresa_id', empresaId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r: { error: unknown }) => r.error);
    
    if (errors.length > 0) {
      console.error('Error reordering hierarchy levels:', errors);
      throw new Error('Failed to reorder hierarchy levels');
    }
  },

  async createDefaults(empresaId: string): Promise<HierarchyLevel[]> {
    const defaults = [
      { nome: 'Diretoria', codigo: 'DIR', descricao: 'Nível de Diretoria Geral', nivel_ordem: 0, cor: '#1E40AF' },
      { nome: 'Gerência', codigo: 'GER', descricao: 'Nível de Gerência', nivel_ordem: 1, cor: '#3B82F6' },
      { nome: 'Coordenação', codigo: 'COORD', descricao: 'Nível de Coordenação', nivel_ordem: 2, cor: '#60A5FA' },
      { nome: 'Supervisão', codigo: 'SUP', descricao: 'Nível de Supervisão', nivel_ordem: 3, cor: '#93C5FD' },
      { nome: 'Encarregado', codigo: 'ENC', descricao: 'Nível de Encarregado', nivel_ordem: 4, cor: '#10B981' },
      { nome: 'Operacional', codigo: 'OPE', descricao: 'Nível Operacional/Execução', nivel_ordem: 5, cor: '#6EE7B7' },
    ];

    const { data, error } = await supabase
      .from('hierarchy_levels')
      .insert(defaults.map(d => ({
        empresa_id: empresaId,
        nome: d.nome,
        codigo: d.codigo,
        descricao: d.descricao,
        nivel_ordem: d.nivel_ordem,
        cor: d.cor,
        is_default: true,
      })))
      .select();

    if (error) {
      console.error('Error creating default hierarchy levels:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },
};
