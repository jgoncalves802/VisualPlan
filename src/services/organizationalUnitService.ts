import { supabase } from './supabase';

export interface OrganizationalUnit {
  id: string;
  empresaId: string;
  parentId: string | null;
  nome: string;
  codigo: string;
  descricao?: string;
  sigla?: string;
  tipo: string;
  ordem: number;
  cor: string;
  responsavelId?: string;
  responsavel?: {
    id: string;
    nome: string;
  };
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  children?: OrganizationalUnit[];
}

interface OrganizationalUnitDB {
  id: string;
  empresa_id: string;
  parent_id: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  sigla: string | null;
  tipo: string;
  ordem: number;
  cor: string;
  responsavel_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  usuarios?: { id: string; nome: string } | null;
}

const mapFromDB = (data: OrganizationalUnitDB): OrganizationalUnit => ({
  id: data.id,
  empresaId: data.empresa_id,
  parentId: data.parent_id,
  nome: data.nome,
  codigo: data.codigo || '',
  descricao: data.descricao || undefined,
  sigla: data.sigla || undefined,
  tipo: data.tipo,
  ordem: data.ordem,
  cor: data.cor,
  responsavelId: data.responsavel_id || undefined,
  responsavel: data.usuarios ? {
    id: data.usuarios.id,
    nome: data.usuarios.nome,
  } : undefined,
  ativo: data.ativo,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const buildTree = (units: OrganizationalUnit[]): OrganizationalUnit[] => {
  const map = new Map<string, OrganizationalUnit>();
  const roots: OrganizationalUnit[] = [];

  units.forEach(unit => {
    map.set(unit.id, { ...unit, children: [] });
  });

  units.forEach(unit => {
    const node = map.get(unit.id)!;
    if (unit.parentId && map.has(unit.parentId)) {
      const parent = map.get(unit.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const organizationalUnitService = {
  async getByEmpresa(empresaId: string): Promise<OrganizationalUnit[]> {
    const { data, error } = await supabase
      .from('organizational_units')
      .select('*, usuarios(id, nome)')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching organizational units:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getTree(empresaId: string): Promise<OrganizationalUnit[]> {
    const units = await this.getByEmpresa(empresaId);
    return buildTree(units);
  },

  async getById(id: string): Promise<OrganizationalUnit | null> {
    const { data, error } = await supabase
      .from('organizational_units')
      .select('*, usuarios(id, nome)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching organizational unit:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async create(data: {
    empresaId: string;
    parentId?: string | null;
    nome: string;
    codigo?: string;
    descricao?: string;
    sigla?: string;
    tipo?: string;
    cor?: string;
    responsavelId?: string;
  }): Promise<OrganizationalUnit> {
    const { data: existing } = await supabase
      .from('organizational_units')
      .select('ordem')
      .eq('empresa_id', data.empresaId)
      .eq('parent_id', data.parentId || null)
      .order('ordem', { ascending: false })
      .limit(1);

    const nextOrdem = existing && existing.length > 0 
      ? existing[0].ordem + 1 
      : 0;

    const { data: created, error } = await supabase
      .from('organizational_units')
      .insert({
        empresa_id: data.empresaId,
        parent_id: data.parentId || null,
        nome: data.nome,
        codigo: data.codigo || null,
        descricao: data.descricao || null,
        sigla: data.sigla || null,
        tipo: data.tipo || 'departamento',
        ordem: nextOrdem,
        cor: data.cor || '#6366F1',
        responsavel_id: data.responsavelId || null,
      })
      .select('*, usuarios(id, nome)')
      .single();

    if (error) {
      console.error('Error creating organizational unit:', error);
      throw error;
    }

    return mapFromDB(created);
  },

  async update(id: string, data: {
    parentId?: string | null;
    nome?: string;
    codigo?: string;
    descricao?: string;
    sigla?: string;
    tipo?: string;
    cor?: string;
    responsavelId?: string | null;
  }): Promise<OrganizationalUnit> {
    const updateData: Record<string, unknown> = {};
    if (data.parentId !== undefined) updateData.parent_id = data.parentId;
    if (data.nome !== undefined) updateData.nome = data.nome;
    if (data.codigo !== undefined) updateData.codigo = data.codigo;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.sigla !== undefined) updateData.sigla = data.sigla;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.cor !== undefined) updateData.cor = data.cor;
    if (data.responsavelId !== undefined) updateData.responsavel_id = data.responsavelId;

    const { data: updated, error } = await supabase
      .from('organizational_units')
      .update(updateData)
      .eq('id', id)
      .select('*, usuarios(id, nome)')
      .single();

    if (error) {
      console.error('Error updating organizational unit:', error);
      throw error;
    }

    return mapFromDB(updated);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizational_units')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organizational unit:', error);
      throw error;
    }
  },

  async reorder(empresaId: string, _parentId: string | null, orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => 
      supabase
        .from('organizational_units')
        .update({ ordem: index })
        .eq('id', id)
        .eq('empresa_id', empresaId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r: { error: unknown }) => r.error);
    
    if (errors.length > 0) {
      console.error('Error reordering organizational units:', errors);
      throw new Error('Failed to reorder organizational units');
    }
  },

  async createDefaults(empresaId: string): Promise<OrganizationalUnit[]> {
    const defaults = [
      { nome: 'Diretoria', codigo: 'DIR', sigla: 'DIR', tipo: 'unidade', ordem: 0, cor: '#1E40AF' },
      { nome: 'Administrativo Financeiro', codigo: 'ADM-FIN', sigla: 'ADM', tipo: 'unidade', ordem: 1, cor: '#7C3AED' },
      { nome: 'Comercial', codigo: 'COM', sigla: 'COM', tipo: 'unidade', ordem: 2, cor: '#2563EB' },
      { nome: 'Operacional', codigo: 'OPE', sigla: 'OPE', tipo: 'unidade', ordem: 3, cor: '#059669' },
      { nome: 'Recursos Humanos', codigo: 'RH', sigla: 'RH', tipo: 'departamento', ordem: 4, cor: '#D97706' },
      { nome: 'Tecnologia', codigo: 'TI', sigla: 'TI', tipo: 'departamento', ordem: 5, cor: '#0891B2' },
    ];

    const { data, error } = await supabase
      .from('organizational_units')
      .insert(defaults.map(d => ({
        empresa_id: empresaId,
        parent_id: null,
        nome: d.nome,
        codigo: d.codigo,
        sigla: d.sigla,
        tipo: d.tipo,
        ordem: d.ordem,
        cor: d.cor,
      })))
      .select();

    if (error) {
      console.error('Error creating default organizational units:', error);
      throw error;
    }

    return (data || []).map(mapFromDB);
  },
};

export const UNIT_TYPES = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'setor', label: 'Setor' },
  { value: 'area', label: 'Área' },
  { value: 'nucleo', label: 'Núcleo' },
  { value: 'coordenacao', label: 'Coordenação' },
];
