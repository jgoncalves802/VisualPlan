import { supabase } from './supabase';

export type ActivityCodeScope = 'global' | 'project' | 'eps';

export interface ActivityCodeType {
  id: string;
  empresaId: string;
  projetoId: string | null;
  epsId: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  escopo: ActivityCodeScope;
  maxLength: number;
  isSecure: boolean;
  obrigatorio: boolean;
  cor: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  values?: ActivityCodeValue[];
}

export interface ActivityCodeValue {
  id: string;
  typeId: string;
  parentId: string | null;
  valor: string;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  ordem: number;
  nivel: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  children?: ActivityCodeValue[];
}

export interface ActivityTaskCode {
  id: string;
  atividadeId: string;
  codeValueId: string;
  typeId: string;
  createdAt: string;
  createdBy: string | null;
  codeType?: ActivityCodeType;
  codeValue?: ActivityCodeValue;
}

interface ActivityCodeTypeDB {
  id: string;
  empresa_id: string;
  projeto_id: string | null;
  eps_id: string | null;
  nome: string;
  codigo: string | null;
  descricao: string | null;
  escopo: ActivityCodeScope;
  max_length: number;
  is_secure: boolean;
  obrigatorio: boolean;
  cor: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ActivityCodeValueDB {
  id: string;
  type_id: string;
  parent_id: string | null;
  valor: string;
  descricao: string | null;
  cor: string | null;
  icone: string | null;
  ordem: number;
  nivel: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface ActivityTaskCodeDB {
  id: string;
  atividade_id: string;
  code_value_id: string;
  type_id: string;
  created_at: string;
  created_by: string | null;
  activity_code_types?: ActivityCodeTypeDB;
  activity_code_values?: ActivityCodeValueDB;
}

function mapTypeFromDB(data: ActivityCodeTypeDB): ActivityCodeType {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    projetoId: data.projeto_id,
    epsId: data.eps_id,
    nome: data.nome,
    codigo: data.codigo,
    descricao: data.descricao,
    escopo: data.escopo,
    maxLength: data.max_length,
    isSecure: data.is_secure,
    obrigatorio: data.obrigatorio,
    cor: data.cor || '#3B82F6',
    icone: data.icone,
    ordem: data.ordem,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

function mapValueFromDB(data: ActivityCodeValueDB): ActivityCodeValue {
  return {
    id: data.id,
    typeId: data.type_id,
    parentId: data.parent_id,
    valor: data.valor,
    descricao: data.descricao,
    cor: data.cor,
    icone: data.icone,
    ordem: data.ordem,
    nivel: data.nivel,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapTaskCodeFromDB(data: ActivityTaskCodeDB): ActivityTaskCode {
  return {
    id: data.id,
    atividadeId: data.atividade_id,
    codeValueId: data.code_value_id,
    typeId: data.type_id,
    createdAt: data.created_at,
    createdBy: data.created_by,
    codeType: data.activity_code_types ? mapTypeFromDB(data.activity_code_types) : undefined,
    codeValue: data.activity_code_values ? mapValueFromDB(data.activity_code_values) : undefined,
  };
}

function buildValueTree(values: ActivityCodeValue[]): ActivityCodeValue[] {
  const map = new Map<string, ActivityCodeValue>();
  const roots: ActivityCodeValue[] = [];

  values.forEach(v => {
    map.set(v.id, { ...v, children: [] });
  });

  values.forEach(v => {
    const node = map.get(v.id)!;
    if (v.parentId && map.has(v.parentId)) {
      const parent = map.get(v.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots.sort((a, b) => a.ordem - b.ordem);
}

export const activityCodeService = {
  async getTypes(empresaId: string, options?: { projetoId?: string; includeGlobal?: boolean }): Promise<ActivityCodeType[]> {
    let query = supabase
      .from('activity_code_types')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (options?.projetoId) {
      if (options.includeGlobal !== false) {
        query = query.or(`projeto_id.eq.${options.projetoId},escopo.eq.global`);
      } else {
        query = query.eq('projeto_id', options.projetoId);
      }
    }

    const { data, error } = await query.order('ordem', { ascending: true });

    if (error) {
      // PGRST205 = table not found - return empty array gracefully
      if (error.code === 'PGRST205') {
        console.warn('Activity code types table not found, returning empty array');
        return [];
      }
      console.error('Error fetching activity code types:', error);
      return [];
    }

    return (data || []).map(mapTypeFromDB);
  },

  async getTypeById(id: string): Promise<ActivityCodeType | null> {
    const { data, error } = await supabase
      .from('activity_code_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching activity code type:', error);
      throw error;
    }

    return mapTypeFromDB(data);
  },

  async createType(
    empresaId: string,
    input: {
      nome: string;
      codigo?: string;
      descricao?: string;
      escopo?: ActivityCodeScope;
      projetoId?: string;
      epsId?: string;
      cor?: string;
      obrigatorio?: boolean;
      isSecure?: boolean;
      createdBy?: string;
    }
  ): Promise<ActivityCodeType> {
    const existingTypes = await this.getTypes(empresaId);
    const maxOrdem = existingTypes.length > 0 
      ? Math.max(...existingTypes.map(t => t.ordem)) 
      : 0;

    const { data, error } = await supabase
      .from('activity_code_types')
      .insert({
        empresa_id: empresaId,
        projeto_id: input.projetoId || null,
        eps_id: input.epsId || null,
        nome: input.nome,
        codigo: input.codigo,
        descricao: input.descricao,
        escopo: input.escopo || 'global',
        cor: input.cor || '#3B82F6',
        obrigatorio: input.obrigatorio || false,
        is_secure: input.isSecure || false,
        ordem: maxOrdem + 1,
        created_by: input.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity code type:', error);
      throw error;
    }

    return mapTypeFromDB(data);
  },

  async updateType(id: string, input: Partial<{
    nome: string;
    codigo: string;
    descricao: string;
    cor: string;
    obrigatorio: boolean;
    isSecure: boolean;
    ordem: number;
  }>): Promise<ActivityCodeType> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.nome !== undefined) updateData.nome = input.nome;
    if (input.codigo !== undefined) updateData.codigo = input.codigo;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.cor !== undefined) updateData.cor = input.cor;
    if (input.obrigatorio !== undefined) updateData.obrigatorio = input.obrigatorio;
    if (input.isSecure !== undefined) updateData.is_secure = input.isSecure;
    if (input.ordem !== undefined) updateData.ordem = input.ordem;

    const { data, error } = await supabase
      .from('activity_code_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity code type:', error);
      throw error;
    }

    return mapTypeFromDB(data);
  },

  async deleteType(id: string): Promise<void> {
    const { error } = await supabase
      .from('activity_code_types')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity code type:', error);
      throw error;
    }
  },

  async getValues(typeId: string): Promise<ActivityCodeValue[]> {
    const { data, error } = await supabase
      .from('activity_code_values')
      .select('*')
      .eq('type_id', typeId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      console.error('Error fetching activity code values:', error);
      throw error;
    }

    return (data || []).map(mapValueFromDB);
  },

  async getValuesTree(typeId: string): Promise<ActivityCodeValue[]> {
    const values = await this.getValues(typeId);
    return buildValueTree(values);
  },

  async createValue(
    typeId: string,
    input: {
      valor: string;
      descricao?: string;
      parentId?: string;
      cor?: string;
      icone?: string;
    }
  ): Promise<ActivityCodeValue> {
    const existingValues = await this.getValues(typeId);
    const sameParentValues = existingValues.filter(v => v.parentId === (input.parentId || null));
    const maxOrdem = sameParentValues.length > 0
      ? Math.max(...sameParentValues.map(v => v.ordem))
      : 0;

    const parentValue = input.parentId 
      ? existingValues.find(v => v.id === input.parentId)
      : null;
    const nivel = parentValue ? parentValue.nivel + 1 : 0;

    const { data, error } = await supabase
      .from('activity_code_values')
      .insert({
        type_id: typeId,
        parent_id: input.parentId || null,
        valor: input.valor,
        descricao: input.descricao,
        cor: input.cor,
        icone: input.icone,
        ordem: maxOrdem + 1,
        nivel,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity code value:', error);
      throw error;
    }

    return mapValueFromDB(data);
  },

  async updateValue(id: string, input: Partial<{
    valor: string;
    descricao: string;
    cor: string;
    icone: string;
    ordem: number;
  }>): Promise<ActivityCodeValue> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.valor !== undefined) updateData.valor = input.valor;
    if (input.descricao !== undefined) updateData.descricao = input.descricao;
    if (input.cor !== undefined) updateData.cor = input.cor;
    if (input.icone !== undefined) updateData.icone = input.icone;
    if (input.ordem !== undefined) updateData.ordem = input.ordem;

    const { data, error } = await supabase
      .from('activity_code_values')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating activity code value:', error);
      throw error;
    }

    return mapValueFromDB(data);
  },

  async deleteValue(id: string): Promise<void> {
    const { error } = await supabase
      .from('activity_code_values')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity code value:', error);
      throw error;
    }
  },

  async getTaskCodes(atividadeId: string): Promise<ActivityTaskCode[]> {
    const { data, error } = await supabase
      .from('activity_task_codes')
      .select(`
        *,
        activity_code_types (*),
        activity_code_values (*)
      `)
      .eq('atividade_id', atividadeId);

    if (error) {
      // PGRST205 = table not found - return empty array gracefully
      if (error.code === 'PGRST205') {
        console.warn('Activity task codes table not found, returning empty array');
        return [];
      }
      console.error('Error fetching task codes:', error);
      return [];
    }

    return (data || []).map(mapTaskCodeFromDB);
  },

  async getTaskCodesForProject(_projetoId: string): Promise<Map<string, ActivityTaskCode[]>> {
    const { data, error } = await supabase
      .from('activity_task_codes')
      .select(`
        *,
        activity_code_types (*),
        activity_code_values (*)
      `);

    if (error) {
      // PGRST205 = table not found - return empty map gracefully
      if (error.code === 'PGRST205') {
        console.warn('Activity task codes table not found, returning empty map');
        return new Map();
      }
      console.error('Error fetching project task codes:', error);
      return new Map();
    }

    const taskCodesMap = new Map<string, ActivityTaskCode[]>();
    
    (data || []).forEach(item => {
      const taskCode = mapTaskCodeFromDB(item);
      const existing = taskCodesMap.get(taskCode.atividadeId) || [];
      existing.push(taskCode);
      taskCodesMap.set(taskCode.atividadeId, existing);
    });

    return taskCodesMap;
  },

  async assignCode(
    atividadeId: string,
    codeValueId: string,
    typeId: string,
    createdBy?: string
  ): Promise<ActivityTaskCode> {
    const { data: existing } = await supabase
      .from('activity_task_codes')
      .select('id')
      .eq('atividade_id', atividadeId)
      .eq('type_id', typeId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('activity_task_codes')
        .update({
          code_value_id: codeValueId,
        })
        .eq('id', existing.id)
        .select(`
          *,
          activity_code_types (*),
          activity_code_values (*)
        `)
        .single();

      if (error) {
        console.error('Error updating task code:', error);
        throw error;
      }

      return mapTaskCodeFromDB(data);
    }

    const { data, error } = await supabase
      .from('activity_task_codes')
      .insert({
        atividade_id: atividadeId,
        code_value_id: codeValueId,
        type_id: typeId,
        created_by: createdBy,
      })
      .select(`
        *,
        activity_code_types (*),
        activity_code_values (*)
      `)
      .single();

    if (error) {
      console.error('Error assigning code to task:', error);
      throw error;
    }

    return mapTaskCodeFromDB(data);
  },

  async removeCode(atividadeId: string, typeId: string): Promise<void> {
    const { error } = await supabase
      .from('activity_task_codes')
      .delete()
      .eq('atividade_id', atividadeId)
      .eq('type_id', typeId);

    if (error) {
      console.error('Error removing task code:', error);
      throw error;
    }
  },

  async initializeDefaultTypes(empresaId: string, createdBy?: string): Promise<ActivityCodeType[]> {
    const existingTypes = await this.getTypes(empresaId);
    if (existingTypes.length > 0) {
      return existingTypes;
    }

    const defaultTypes = [
      { nome: 'Disciplina', codigo: 'DISC', descricao: 'Disciplina técnica (Civil, Mecânica, Elétrica)', cor: '#3B82F6' },
      { nome: 'Área', codigo: 'AREA', descricao: 'Área ou localização da obra', cor: '#10B981' },
      { nome: 'Fase', codigo: 'FASE', descricao: 'Fase do projeto', cor: '#F59E0B' },
      { nome: 'Responsável', codigo: 'RESP', descricao: 'Contratada/Equipe responsável', cor: '#8B5CF6' },
      { nome: 'Tipo de Trabalho', codigo: 'TIPO', descricao: 'Tipo de serviço', cor: '#EF4444' },
    ];

    const createdTypes: ActivityCodeType[] = [];

    for (const type of defaultTypes) {
      const created = await this.createType(empresaId, {
        ...type,
        escopo: 'global',
        createdBy,
      });
      createdTypes.push(created);
    }

    const disciplineType = createdTypes.find(t => t.codigo === 'DISC');
    if (disciplineType) {
      const defaultDisciplines = [
        { valor: 'CIV', descricao: 'Civil', cor: '#3B82F6' },
        { valor: 'MEC', descricao: 'Mecânica', cor: '#EF4444' },
        { valor: 'ELE', descricao: 'Elétrica', cor: '#F59E0B' },
        { valor: 'INS', descricao: 'Instrumentação', cor: '#10B981' },
        { valor: 'TUB', descricao: 'Tubulação', cor: '#8B5CF6' },
      ];

      for (const disc of defaultDisciplines) {
        await this.createValue(disciplineType.id, disc);
      }
    }

    const phaseType = createdTypes.find(t => t.codigo === 'FASE');
    if (phaseType) {
      const defaultPhases = [
        { valor: 'PLAN', descricao: 'Planejamento', cor: '#3B82F6' },
        { valor: 'PROJ', descricao: 'Projeto', cor: '#F59E0B' },
        { valor: 'EXEC', descricao: 'Execução', cor: '#10B981' },
        { valor: 'COMM', descricao: 'Comissionamento', cor: '#8B5CF6' },
        { valor: 'ENCR', descricao: 'Encerramento', cor: '#EF4444' },
      ];

      for (const phase of defaultPhases) {
        await this.createValue(phaseType.id, phase);
      }
    }

    return createdTypes;
  },
};

export default activityCodeService;
