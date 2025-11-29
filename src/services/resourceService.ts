import { supabase } from './supabaseClient';

export type ResourceCategory = 'WORK' | 'MATERIAL' | 'COST' | 'GENERIC' | 'BUDGET';
export type AllocationStatus = 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ResourceType {
  id: string;
  empresaId: string;
  codigo: string;
  nome: string;
  categoria: ResourceCategory;
  descricao?: string;
  unidadePadrao: string;
  custoPadrao: number;
  cor: string;
  icone?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Resource {
  id: string;
  empresaId: string;
  resourceTypeId?: string;
  resourceType?: ResourceType;
  codigo: string;
  nome: string;
  email?: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  capacidadeDiaria: number;
  unidadeCapacidade: string;
  disponivelDe?: string;
  disponivelAte?: string;
  custoPorHora: number;
  custoPorUso: number;
  custoHoraExtra: number;
  custoFixo: number;
  habilidades: string[];
  calendarioId?: string;
  avatarUrl?: string;
  metadata: Record<string, unknown>;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocation {
  id: string;
  empresaId: string;
  atividadeId: string;
  resourceId: string;
  resource?: Resource;
  dataInicio: string;
  dataFim: string;
  unidades: number;
  unidadeTipo: string;
  quantidadePlanejada: number;
  quantidadeReal: number;
  custoPlanejado: number;
  custoReal: number;
  curvaAlocacao: string;
  status: AllocationStatus;
  notas?: string;
  metadata: Record<string, unknown>;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ResourceConflict {
  id: string;
  empresaId: string;
  resourceId: string;
  resource?: Resource;
  dataInicio: string;
  dataFim: string;
  alocacaoTotal: number;
  capacidadeDisponivel: number;
  excesso: number;
  atividadesIds: string[];
  allocationIds: string[];
  severidade: ConflictSeverity;
  resolvido: boolean;
  resolucaoTipo?: string;
  resolucaoNotas?: string;
  resolvidoPor?: string;
  resolvidoEm?: string;
  createdAt: string;
  updatedAt: string;
}

function mapResourceTypeFromDB(data: any): ResourceType {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    codigo: data.codigo,
    nome: data.nome,
    categoria: data.categoria,
    descricao: data.descricao,
    unidadePadrao: data.unidade_padrao || 'hora',
    custoPadrao: parseFloat(data.custo_padrao) || 0,
    cor: data.cor || '#3B82F6',
    icone: data.icone,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapResourceFromDB(data: any): Resource {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    resourceTypeId: data.resource_type_id,
    resourceType: data.resource_types ? mapResourceTypeFromDB(data.resource_types) : undefined,
    codigo: data.codigo,
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    cargo: data.cargo,
    departamento: data.departamento,
    capacidadeDiaria: parseFloat(data.capacidade_diaria) || 8,
    unidadeCapacidade: data.unidade_capacidade || 'hora',
    disponivelDe: data.disponivel_de,
    disponivelAte: data.disponivel_ate,
    custoPorHora: parseFloat(data.custo_por_hora) || 0,
    custoPorUso: parseFloat(data.custo_por_uso) || 0,
    custoHoraExtra: parseFloat(data.custo_hora_extra) || 0,
    custoFixo: parseFloat(data.custo_fixo) || 0,
    habilidades: data.habilidades || [],
    calendarioId: data.calendario_id,
    avatarUrl: data.avatar_url,
    metadata: data.metadata || {},
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapAllocationFromDB(data: any): ResourceAllocation {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    atividadeId: data.atividade_id,
    resourceId: data.resource_id,
    resource: data.resources ? mapResourceFromDB(data.resources) : undefined,
    dataInicio: data.data_inicio,
    dataFim: data.data_fim,
    unidades: parseFloat(data.unidades) || 100,
    unidadeTipo: data.unidade_tipo || 'PERCENT',
    quantidadePlanejada: parseFloat(data.quantidade_planejada) || 0,
    quantidadeReal: parseFloat(data.quantidade_real) || 0,
    custoPlanejado: parseFloat(data.custo_planejado) || 0,
    custoReal: parseFloat(data.custo_real) || 0,
    curvaAlocacao: data.curva_alocacao || 'FLAT',
    status: data.status || 'PLANNED',
    notas: data.notas,
    metadata: data.metadata || {},
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

function mapConflictFromDB(data: any): ResourceConflict {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    resourceId: data.resource_id,
    resource: data.resources ? mapResourceFromDB(data.resources) : undefined,
    dataInicio: data.data_inicio,
    dataFim: data.data_fim,
    alocacaoTotal: parseFloat(data.alocacao_total) || 0,
    capacidadeDisponivel: parseFloat(data.capacidade_disponivel) || 0,
    excesso: parseFloat(data.excesso) || 0,
    atividadesIds: data.atividades_ids || [],
    allocationIds: data.allocation_ids || [],
    severidade: data.severidade || 'MEDIUM',
    resolvido: data.resolvido || false,
    resolucaoTipo: data.resolucao_tipo,
    resolucaoNotas: data.resolucao_notas,
    resolvidoPor: data.resolvido_por,
    resolvidoEm: data.resolvido_em,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const resourceService = {
  async getResourceTypes(empresaId: string): Promise<ResourceType[]> {
    const { data, error } = await supabase
      .from('resource_types')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Error fetching resource types:', error);
      throw error;
    }

    return (data || []).map(mapResourceTypeFromDB);
  },

  async createResourceType(resourceType: Omit<ResourceType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResourceType> {
    const { data, error } = await supabase
      .from('resource_types')
      .insert({
        empresa_id: resourceType.empresaId,
        codigo: resourceType.codigo,
        nome: resourceType.nome,
        categoria: resourceType.categoria,
        descricao: resourceType.descricao,
        unidade_padrao: resourceType.unidadePadrao,
        custo_padrao: resourceType.custoPadrao,
        cor: resourceType.cor,
        icone: resourceType.icone,
        ativo: resourceType.ativo ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource type:', error);
      throw error;
    }

    return mapResourceTypeFromDB(data);
  },

  async getResources(empresaId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        resource_types (*)
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }

    return (data || []).map(mapResourceFromDB);
  },

  async getResourceById(id: string): Promise<Resource | null> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        resource_types (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching resource:', error);
      throw error;
    }

    return mapResourceFromDB(data);
  },

  async createResource(resource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt' | 'resourceType'>): Promise<Resource> {
    const { data, error } = await supabase
      .from('resources')
      .insert({
        empresa_id: resource.empresaId,
        resource_type_id: resource.resourceTypeId,
        codigo: resource.codigo,
        nome: resource.nome,
        email: resource.email,
        telefone: resource.telefone,
        cargo: resource.cargo,
        departamento: resource.departamento,
        capacidade_diaria: resource.capacidadeDiaria,
        unidade_capacidade: resource.unidadeCapacidade,
        disponivel_de: resource.disponivelDe,
        disponivel_ate: resource.disponivelAte,
        custo_por_hora: resource.custoPorHora,
        custo_por_uso: resource.custoPorUso,
        custo_hora_extra: resource.custoHoraExtra,
        custo_fixo: resource.custoFixo,
        habilidades: resource.habilidades,
        calendario_id: resource.calendarioId,
        avatar_url: resource.avatarUrl,
        metadata: resource.metadata,
        ativo: resource.ativo ?? true,
      })
      .select(`
        *,
        resource_types (*)
      `)
      .single();

    if (error) {
      console.error('Error creating resource:', error);
      throw error;
    }

    return mapResourceFromDB(data);
  },

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.resourceTypeId !== undefined) updateData.resource_type_id = updates.resourceTypeId;
    if (updates.codigo !== undefined) updateData.codigo = updates.codigo;
    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.telefone !== undefined) updateData.telefone = updates.telefone;
    if (updates.cargo !== undefined) updateData.cargo = updates.cargo;
    if (updates.departamento !== undefined) updateData.departamento = updates.departamento;
    if (updates.capacidadeDiaria !== undefined) updateData.capacidade_diaria = updates.capacidadeDiaria;
    if (updates.unidadeCapacidade !== undefined) updateData.unidade_capacidade = updates.unidadeCapacidade;
    if (updates.disponivelDe !== undefined) updateData.disponivel_de = updates.disponivelDe;
    if (updates.disponivelAte !== undefined) updateData.disponivel_ate = updates.disponivelAte;
    if (updates.custoPorHora !== undefined) updateData.custo_por_hora = updates.custoPorHora;
    if (updates.custoPorUso !== undefined) updateData.custo_por_uso = updates.custoPorUso;
    if (updates.custoHoraExtra !== undefined) updateData.custo_hora_extra = updates.custoHoraExtra;
    if (updates.custoFixo !== undefined) updateData.custo_fixo = updates.custoFixo;
    if (updates.habilidades !== undefined) updateData.habilidades = updates.habilidades;
    if (updates.calendarioId !== undefined) updateData.calendario_id = updates.calendarioId;
    if (updates.avatarUrl !== undefined) updateData.avatar_url = updates.avatarUrl;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

    const { data, error } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resource_types (*)
      `)
      .single();

    if (error) {
      console.error('Error updating resource:', error);
      throw error;
    }

    return mapResourceFromDB(data);
  },

  async deleteResource(id: string): Promise<void> {
    const { error } = await supabase
      .from('resources')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  },

  async getAllocations(empresaId: string, atividadeId?: string): Promise<ResourceAllocation[]> {
    let query = supabase
      .from('resource_allocations')
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (atividadeId) {
      query = query.eq('atividade_id', atividadeId);
    }

    const { data, error } = await query.order('data_inicio');

    if (error) {
      console.error('Error fetching allocations:', error);
      throw error;
    }

    return (data || []).map(mapAllocationFromDB);
  },

  async getAllocationsByResource(resourceId: string): Promise<ResourceAllocation[]> {
    const { data, error } = await supabase
      .from('resource_allocations')
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .eq('resource_id', resourceId)
      .eq('ativo', true)
      .order('data_inicio');

    if (error) {
      console.error('Error fetching allocations by resource:', error);
      throw error;
    }

    return (data || []).map(mapAllocationFromDB);
  },

  async createAllocation(allocation: Omit<ResourceAllocation, 'id' | 'createdAt' | 'updatedAt' | 'resource'>): Promise<ResourceAllocation> {
    const { data, error } = await supabase
      .from('resource_allocations')
      .insert({
        empresa_id: allocation.empresaId,
        atividade_id: allocation.atividadeId,
        resource_id: allocation.resourceId,
        data_inicio: allocation.dataInicio,
        data_fim: allocation.dataFim,
        unidades: allocation.unidades,
        unidade_tipo: allocation.unidadeTipo,
        quantidade_planejada: allocation.quantidadePlanejada,
        quantidade_real: allocation.quantidadeReal,
        custo_planejado: allocation.custoPlanejado,
        custo_real: allocation.custoReal,
        curva_alocacao: allocation.curvaAlocacao,
        status: allocation.status,
        notas: allocation.notas,
        metadata: allocation.metadata,
        ativo: allocation.ativo ?? true,
        created_by: allocation.createdBy,
      })
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .single();

    if (error) {
      console.error('Error creating allocation:', error);
      throw error;
    }

    return mapAllocationFromDB(data);
  },

  async updateAllocation(id: string, updates: Partial<ResourceAllocation>): Promise<ResourceAllocation> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.dataInicio !== undefined) updateData.data_inicio = updates.dataInicio;
    if (updates.dataFim !== undefined) updateData.data_fim = updates.dataFim;
    if (updates.unidades !== undefined) updateData.unidades = updates.unidades;
    if (updates.unidadeTipo !== undefined) updateData.unidade_tipo = updates.unidadeTipo;
    if (updates.quantidadePlanejada !== undefined) updateData.quantidade_planejada = updates.quantidadePlanejada;
    if (updates.quantidadeReal !== undefined) updateData.quantidade_real = updates.quantidadeReal;
    if (updates.custoPlanejado !== undefined) updateData.custo_planejado = updates.custoPlanejado;
    if (updates.custoReal !== undefined) updateData.custo_real = updates.custoReal;
    if (updates.curvaAlocacao !== undefined) updateData.curva_alocacao = updates.curvaAlocacao;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notas !== undefined) updateData.notas = updates.notas;
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

    const { data, error } = await supabase
      .from('resource_allocations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .single();

    if (error) {
      console.error('Error updating allocation:', error);
      throw error;
    }

    return mapAllocationFromDB(data);
  },

  async deleteAllocation(id: string): Promise<void> {
    const { error } = await supabase
      .from('resource_allocations')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting allocation:', error);
      throw error;
    }
  },

  async getConflicts(empresaId: string, unresolvedOnly: boolean = true): Promise<ResourceConflict[]> {
    let query = supabase
      .from('resource_conflicts')
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .eq('empresa_id', empresaId);

    if (unresolvedOnly) {
      query = query.eq('resolvido', false);
    }

    const { data, error } = await query.order('severidade', { ascending: false });

    if (error) {
      console.error('Error fetching conflicts:', error);
      throw error;
    }

    return (data || []).map(mapConflictFromDB);
  },

  async resolveConflict(id: string, resolucaoTipo: string, resolucaoNotas: string, resolvidoPor: string): Promise<void> {
    const { error } = await supabase
      .from('resource_conflicts')
      .update({
        resolvido: true,
        resolucao_tipo: resolucaoTipo,
        resolucao_notas: resolucaoNotas,
        resolvido_por: resolvidoPor,
        resolvido_em: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  },

  async detectConflicts(empresaId: string, resourceId?: string): Promise<ResourceConflict[]> {
    const allocations = await this.getAllocations(empresaId);
    const resources = await this.getResources(empresaId);
    
    const conflicts: ResourceConflict[] = [];
    const resourceAllocations = new Map<string, ResourceAllocation[]>();
    
    allocations.forEach(alloc => {
      const key = alloc.resourceId;
      if (!resourceAllocations.has(key)) {
        resourceAllocations.set(key, []);
      }
      resourceAllocations.get(key)!.push(alloc);
    });
    
    for (const [resId, allocs] of resourceAllocations) {
      if (resourceId && resId !== resourceId) continue;
      
      const resource = resources.find(r => r.id === resId);
      if (!resource) continue;
      
      const dailyCapacity = resource.capacidadeDiaria;
      const dateAllocations = new Map<string, number>();
      const dateActivities = new Map<string, string[]>();
      const dateAllocationIds = new Map<string, string[]>();
      
      allocs.forEach(alloc => {
        const start = new Date(alloc.dataInicio);
        const end = new Date(alloc.dataFim);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split('T')[0];
          const hoursPerDay = (alloc.unidades / 100) * dailyCapacity;
          
          dateAllocations.set(dateKey, (dateAllocations.get(dateKey) || 0) + hoursPerDay);
          
          if (!dateActivities.has(dateKey)) dateActivities.set(dateKey, []);
          if (!dateActivities.get(dateKey)!.includes(alloc.atividadeId)) {
            dateActivities.get(dateKey)!.push(alloc.atividadeId);
          }
          
          if (!dateAllocationIds.has(dateKey)) dateAllocationIds.set(dateKey, []);
          dateAllocationIds.get(dateKey)!.push(alloc.id);
        }
      });
      
      let conflictStart: string | null = null;
      let conflictActivities: string[] = [];
      let conflictAllocIds: string[] = [];
      let maxExcesso = 0;
      
      const sortedDates = Array.from(dateAllocations.keys()).sort();
      
      for (const dateKey of sortedDates) {
        const totalAlloc = dateAllocations.get(dateKey)!;
        
        if (totalAlloc > dailyCapacity) {
          if (!conflictStart) {
            conflictStart = dateKey;
            conflictActivities = [];
            conflictAllocIds = [];
          }
          
          const excesso = totalAlloc - dailyCapacity;
          maxExcesso = Math.max(maxExcesso, excesso);
          
          dateActivities.get(dateKey)!.forEach(a => {
            if (!conflictActivities.includes(a)) conflictActivities.push(a);
          });
          dateAllocationIds.get(dateKey)!.forEach(a => {
            if (!conflictAllocIds.includes(a)) conflictAllocIds.push(a);
          });
        } else if (conflictStart) {
          const severity: ConflictSeverity = 
            maxExcesso > dailyCapacity ? 'CRITICAL' :
            maxExcesso > dailyCapacity * 0.5 ? 'HIGH' :
            maxExcesso > dailyCapacity * 0.25 ? 'MEDIUM' : 'LOW';
          
          conflicts.push({
            id: crypto.randomUUID(),
            empresaId,
            resourceId: resId,
            resource,
            dataInicio: conflictStart,
            dataFim: sortedDates[sortedDates.indexOf(dateKey) - 1] || conflictStart,
            alocacaoTotal: dailyCapacity + maxExcesso,
            capacidadeDisponivel: dailyCapacity,
            excesso: maxExcesso,
            atividadesIds: conflictActivities,
            allocationIds: conflictAllocIds,
            severidade: severity,
            resolvido: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          conflictStart = null;
          maxExcesso = 0;
        }
      }
      
      if (conflictStart) {
        const severity: ConflictSeverity = 
          maxExcesso > dailyCapacity ? 'CRITICAL' :
          maxExcesso > dailyCapacity * 0.5 ? 'HIGH' :
          maxExcesso > dailyCapacity * 0.25 ? 'MEDIUM' : 'LOW';
        
        conflicts.push({
          id: crypto.randomUUID(),
          empresaId,
          resourceId: resId,
          resource,
          dataInicio: conflictStart,
          dataFim: sortedDates[sortedDates.length - 1],
          alocacaoTotal: dailyCapacity + maxExcesso,
          capacidadeDisponivel: dailyCapacity,
          excesso: maxExcesso,
          atividadesIds: conflictActivities,
          allocationIds: conflictAllocIds,
          severidade: severity,
          resolvido: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }
    
    return conflicts;
  },

  calculateResourceHistogram(
    allocations: ResourceAllocation[],
    resource: Resource,
    startDate: Date,
    endDate: Date
  ): { date: string; allocated: number; capacity: number; utilization: number }[] {
    const histogram: { date: string; allocated: number; capacity: number; utilization: number }[] = [];
    const dailyCapacity = resource.capacidadeDiaria;
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      let allocated = 0;
      
      allocations.forEach(alloc => {
        const allocStart = new Date(alloc.dataInicio);
        const allocEnd = new Date(alloc.dataFim);
        
        if (d >= allocStart && d <= allocEnd) {
          allocated += (alloc.unidades / 100) * dailyCapacity;
        }
      });
      
      histogram.push({
        date: dateKey,
        allocated,
        capacity: dailyCapacity,
        utilization: dailyCapacity > 0 ? (allocated / dailyCapacity) * 100 : 0,
      });
    }
    
    return histogram;
  },
};

export default resourceService;
