import { supabase } from './supabaseClient';

export type ResourceCategory = 'WORK' | 'MATERIAL' | 'COST' | 'GENERIC' | 'BUDGET';
export type AllocationStatus = 'PLANNED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ConflictSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CurveType = 'LINEAR' | 'BELL' | 'FRONT_LOADED' | 'BACK_LOADED' | 'TRIANGULAR' | 'TRAPEZOIDAL' | 'CUSTOM';
export type RateUnitType = 'hour' | 'day' | 'week' | 'month' | 'unit' | 'fixed';

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

export interface ResourceRate {
  id: string;
  empresaId: string;
  resourceId: string;
  rateType: number;
  rateName: string;
  pricePerUnit: number;
  unitType: RateUnitType;
  effectiveFrom: string;
  effectiveTo?: string;
  descricao?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceCurve {
  id: string;
  empresaId?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  curveType: CurveType;
  distributionPoints: number[];
  isSystemDefault: boolean;
  cor: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ResourceAssignmentPeriod {
  id: string;
  allocationId: string;
  periodStart: string;
  periodEnd: string;
  periodType: 'day' | 'week' | 'month';
  plannedUnits: number;
  actualUnits: number;
  remainingUnits: number;
  plannedCost: number;
  actualCost: number;
  remainingCost: number;
  earnedValue: number;
  isManualEntry: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceAllocationP6 extends ResourceAllocation {
  curveId?: string;
  curve?: ResourceCurve;
  rateType: number;
  unitsPerTime: number;
  budgetedUnits: number;
  actualUnits: number;
  remainingUnits: number;
  atCompletionUnits: number;
  budgetedCost: number;
  actualCost: number;
  remainingCost: number;
  atCompletionCost: number;
  actualStart?: string;
  actualFinish?: string;
  periods?: ResourceAssignmentPeriod[];
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

function mapResourceRateFromDB(data: any): ResourceRate {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    resourceId: data.resource_id,
    rateType: data.rate_type,
    rateName: data.rate_name,
    pricePerUnit: parseFloat(data.price_per_unit) || 0,
    unitType: data.unit_type || 'hour',
    effectiveFrom: data.effective_from,
    effectiveTo: data.effective_to,
    descricao: data.descricao,
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapResourceCurveFromDB(data: any): ResourceCurve {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    codigo: data.codigo,
    nome: data.nome,
    descricao: data.descricao,
    curveType: data.curve_type || 'LINEAR',
    distributionPoints: data.distribution_points || [0,5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,100],
    isSystemDefault: data.is_system_default || false,
    cor: data.cor || '#3B82F6',
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

function mapAssignmentPeriodFromDB(data: any): ResourceAssignmentPeriod {
  return {
    id: data.id,
    allocationId: data.allocation_id,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    periodType: data.period_type || 'day',
    plannedUnits: parseFloat(data.planned_units) || 0,
    actualUnits: parseFloat(data.actual_units) || 0,
    remainingUnits: parseFloat(data.remaining_units) || 0,
    plannedCost: parseFloat(data.planned_cost) || 0,
    actualCost: parseFloat(data.actual_cost) || 0,
    remainingCost: parseFloat(data.remaining_cost) || 0,
    earnedValue: parseFloat(data.earned_value) || 0,
    isManualEntry: data.is_manual_entry || false,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapAllocationP6FromDB(data: any): ResourceAllocationP6 {
  const base = mapAllocationFromDB(data);
  return {
    ...base,
    curveId: data.curve_id,
    curve: data.resource_curves ? mapResourceCurveFromDB(data.resource_curves) : undefined,
    rateType: data.rate_type || 1,
    unitsPerTime: parseFloat(data.units_per_time) || 8,
    budgetedUnits: parseFloat(data.budgeted_units) || 0,
    actualUnits: parseFloat(data.actual_units) || 0,
    remainingUnits: parseFloat(data.remaining_units) || 0,
    atCompletionUnits: parseFloat(data.at_completion_units) || 0,
    budgetedCost: parseFloat(data.budgeted_cost) || 0,
    actualCost: parseFloat(data.actual_cost) || 0,
    remainingCost: parseFloat(data.remaining_cost) || 0,
    atCompletionCost: parseFloat(data.at_completion_cost) || 0,
    actualStart: data.actual_start,
    actualFinish: data.actual_finish,
    periods: data.resource_assignment_periods?.map(mapAssignmentPeriodFromDB),
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
      console.error('Error fetching resource types:', { message: error.message, code: error.code });
      return [];
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
      console.error('Error fetching resources:', { message: error.message, code: error.code });
      return [];
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

  async getAllocations(empresaId: string, projetoId?: string): Promise<ResourceAllocation[]> {
    let query = supabase
      .from('resource_allocations')
      .select(`
        *,
        resources (*, resource_types (*))
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query.order('data_inicio');

    if (error) {
      console.error('Error fetching allocations:', { message: error.message, code: error.code });
      return [];
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
      console.error('Error fetching allocations by resource:', { message: error.message, code: error.code });
      return [];
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
      console.error('Error fetching conflicts:', { message: error.message, code: error.code });
      return [];
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

  async getResourceRates(resourceId: string): Promise<ResourceRate[]> {
    const { data, error } = await supabase
      .from('resource_rates')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('ativo', true)
      .order('rate_type');

    if (error) {
      console.error('Error fetching resource rates:', error);
      throw error;
    }

    return (data || []).map(mapResourceRateFromDB);
  },

  async createResourceRate(rate: Omit<ResourceRate, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResourceRate> {
    const { data, error } = await supabase
      .from('resource_rates')
      .insert({
        empresa_id: rate.empresaId,
        resource_id: rate.resourceId,
        rate_type: rate.rateType,
        rate_name: rate.rateName,
        price_per_unit: rate.pricePerUnit,
        unit_type: rate.unitType,
        effective_from: rate.effectiveFrom,
        effective_to: rate.effectiveTo,
        descricao: rate.descricao,
        ativo: rate.ativo ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource rate:', error);
      throw error;
    }

    return mapResourceRateFromDB(data);
  },

  async updateResourceRate(id: string, updates: Partial<ResourceRate>): Promise<ResourceRate> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.rateName !== undefined) updateData.rate_name = updates.rateName;
    if (updates.pricePerUnit !== undefined) updateData.price_per_unit = updates.pricePerUnit;
    if (updates.unitType !== undefined) updateData.unit_type = updates.unitType;
    if (updates.effectiveFrom !== undefined) updateData.effective_from = updates.effectiveFrom;
    if (updates.effectiveTo !== undefined) updateData.effective_to = updates.effectiveTo;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

    const { data, error } = await supabase
      .from('resource_rates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resource rate:', error);
      throw error;
    }

    return mapResourceRateFromDB(data);
  },

  async deleteResourceRate(id: string): Promise<void> {
    const { error } = await supabase
      .from('resource_rates')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting resource rate:', error);
      throw error;
    }
  },

  async getResourceCurves(empresaId?: string): Promise<ResourceCurve[]> {
    let query = supabase
      .from('resource_curves')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (empresaId) {
      query = query.or(`empresa_id.eq.${empresaId},empresa_id.is.null`);
    } else {
      query = query.is('empresa_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching resource curves:', error);
      throw error;
    }

    return (data || []).map(mapResourceCurveFromDB);
  },

  async getSystemDefaultCurves(): Promise<ResourceCurve[]> {
    const { data, error } = await supabase
      .from('resource_curves')
      .select('*')
      .eq('is_system_default', true)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('Error fetching system default curves:', error);
      throw error;
    }

    return (data || []).map(mapResourceCurveFromDB);
  },

  async createResourceCurve(curve: Omit<ResourceCurve, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResourceCurve> {
    const { data, error } = await supabase
      .from('resource_curves')
      .insert({
        empresa_id: curve.empresaId,
        codigo: curve.codigo,
        nome: curve.nome,
        descricao: curve.descricao,
        curve_type: curve.curveType,
        distribution_points: curve.distributionPoints,
        is_system_default: curve.isSystemDefault || false,
        cor: curve.cor,
        ativo: curve.ativo ?? true,
        created_by: curve.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating resource curve:', error);
      throw error;
    }

    return mapResourceCurveFromDB(data);
  },

  async updateResourceCurve(id: string, updates: Partial<ResourceCurve>): Promise<ResourceCurve> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.curveType !== undefined) updateData.curve_type = updates.curveType;
    if (updates.distributionPoints !== undefined) updateData.distribution_points = updates.distributionPoints;
    if (updates.cor !== undefined) updateData.cor = updates.cor;
    if (updates.ativo !== undefined) updateData.ativo = updates.ativo;

    const { data, error } = await supabase
      .from('resource_curves')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating resource curve:', error);
      throw error;
    }

    return mapResourceCurveFromDB(data);
  },

  async getAllocationsP6(empresaId: string, atividadeId?: string): Promise<ResourceAllocationP6[]> {
    let query = supabase
      .from('resource_allocations')
      .select(`
        *,
        resources (*, resource_types (*)),
        resource_curves (*),
        resource_assignment_periods (*)
      `)
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (atividadeId) {
      query = query.eq('atividade_id', atividadeId);
    }

    const { data, error } = await query.order('data_inicio');

    if (error) {
      console.error('Error fetching P6 allocations:', error);
      throw error;
    }

    return (data || []).map(mapAllocationP6FromDB);
  },

  async createAllocationP6(allocation: Omit<ResourceAllocationP6, 'id' | 'createdAt' | 'updatedAt' | 'resource' | 'curve' | 'periods'>): Promise<ResourceAllocationP6> {
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
        curve_id: allocation.curveId,
        rate_type: allocation.rateType,
        units_per_time: allocation.unitsPerTime,
        budgeted_units: allocation.budgetedUnits,
        actual_units: allocation.actualUnits,
        remaining_units: allocation.remainingUnits,
        at_completion_units: allocation.atCompletionUnits,
        budgeted_cost: allocation.budgetedCost,
        actual_cost: allocation.actualCost,
        remaining_cost: allocation.remainingCost,
        at_completion_cost: allocation.atCompletionCost,
        actual_start: allocation.actualStart,
        actual_finish: allocation.actualFinish,
      })
      .select(`
        *,
        resources (*, resource_types (*)),
        resource_curves (*)
      `)
      .single();

    if (error) {
      console.error('Error creating P6 allocation:', error);
      throw error;
    }

    return mapAllocationP6FromDB(data);
  },

  async updateAllocationP6(id: string, updates: Partial<ResourceAllocationP6>): Promise<ResourceAllocationP6> {
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
    if (updates.curveId !== undefined) updateData.curve_id = updates.curveId;
    if (updates.rateType !== undefined) updateData.rate_type = updates.rateType;
    if (updates.unitsPerTime !== undefined) updateData.units_per_time = updates.unitsPerTime;
    if (updates.budgetedUnits !== undefined) updateData.budgeted_units = updates.budgetedUnits;
    if (updates.actualUnits !== undefined) updateData.actual_units = updates.actualUnits;
    if (updates.remainingUnits !== undefined) updateData.remaining_units = updates.remainingUnits;
    if (updates.atCompletionUnits !== undefined) updateData.at_completion_units = updates.atCompletionUnits;
    if (updates.budgetedCost !== undefined) updateData.budgeted_cost = updates.budgetedCost;
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
    if (updates.remainingCost !== undefined) updateData.remaining_cost = updates.remainingCost;
    if (updates.atCompletionCost !== undefined) updateData.at_completion_cost = updates.atCompletionCost;
    if (updates.actualStart !== undefined) updateData.actual_start = updates.actualStart;
    if (updates.actualFinish !== undefined) updateData.actual_finish = updates.actualFinish;

    const { data, error } = await supabase
      .from('resource_allocations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        resources (*, resource_types (*)),
        resource_curves (*)
      `)
      .single();

    if (error) {
      console.error('Error updating P6 allocation:', error);
      throw error;
    }

    return mapAllocationP6FromDB(data);
  },

  async getAssignmentPeriods(allocationId: string): Promise<ResourceAssignmentPeriod[]> {
    const { data, error } = await supabase
      .from('resource_assignment_periods')
      .select('*')
      .eq('allocation_id', allocationId)
      .order('period_start');

    if (error) {
      console.error('Error fetching assignment periods:', error);
      throw error;
    }

    return (data || []).map(mapAssignmentPeriodFromDB);
  },

  async updateAssignmentPeriod(id: string, updates: Partial<ResourceAssignmentPeriod>): Promise<ResourceAssignmentPeriod> {
    const updateData: Record<string, unknown> = {};
    
    if (updates.plannedUnits !== undefined) updateData.planned_units = updates.plannedUnits;
    if (updates.actualUnits !== undefined) updateData.actual_units = updates.actualUnits;
    if (updates.remainingUnits !== undefined) updateData.remaining_units = updates.remainingUnits;
    if (updates.plannedCost !== undefined) updateData.planned_cost = updates.plannedCost;
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
    if (updates.remainingCost !== undefined) updateData.remaining_cost = updates.remainingCost;
    if (updates.earnedValue !== undefined) updateData.earned_value = updates.earnedValue;
    if (updates.isManualEntry !== undefined) updateData.is_manual_entry = updates.isManualEntry;

    const { data, error } = await supabase
      .from('resource_assignment_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating assignment period:', error);
      throw error;
    }

    return mapAssignmentPeriodFromDB(data);
  },

  calculateCurveDistribution(
    totalUnits: number,
    startDate: Date,
    endDate: Date,
    distributionPoints: number[]
  ): { date: Date; units: number; cumulativePercent: number }[] {
    const result: { date: Date; units: number; cumulativePercent: number }[] = [];
    const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    for (let i = 0; i < duration; i++) {
      const progressPercent = (i / duration) * 100;
      const curveIndex = Math.min(Math.floor(progressPercent / 5), 19);
      
      const prevPct = distributionPoints[curveIndex] || 0;
      const currPct = distributionPoints[curveIndex + 1] || 100;
      
      const interpolatedPct = prevPct + ((currPct - prevPct) * ((progressPercent % 5) / 5));
      const nextInterpolatedPct = i < duration - 1 
        ? prevPct + ((currPct - prevPct) * (((progressPercent + (100/duration)) % 5) / 5))
        : 100;
      
      const dailyUnits = totalUnits * (nextInterpolatedPct - interpolatedPct) / 100;
      
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      result.push({
        date,
        units: Math.max(0, dailyUnits),
        cumulativePercent: interpolatedPct,
      });
    }
    
    return result;
  },

  generateSCurveData(
    allocations: ResourceAllocationP6[],
    _startDate?: Date,
    _endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'week'
  ): { 
    date: string; 
    plannedCumulative: number; 
    actualCumulative: number;
    remainingCumulative: number;
    earnedValueCumulative: number;
  }[] {
    const result: Map<string, { planned: number; actual: number; remaining: number; earnedValue: number }> = new Map();
    
    allocations.forEach(alloc => {
      if (!alloc.periods) return;
      
      alloc.periods.forEach(period => {
        const periodDate = new Date(period.periodStart);
        let dateKey: string;
        
        if (groupBy === 'day') {
          dateKey = periodDate.toISOString().split('T')[0];
        } else if (groupBy === 'week') {
          const weekStart = new Date(periodDate);
          weekStart.setDate(periodDate.getDate() - periodDate.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
        } else {
          dateKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}-01`;
        }
        
        if (!result.has(dateKey)) {
          result.set(dateKey, { planned: 0, actual: 0, remaining: 0, earnedValue: 0 });
        }
        
        const entry = result.get(dateKey)!;
        entry.planned += period.plannedCost;
        entry.actual += period.actualCost;
        entry.remaining += period.remainingCost;
        entry.earnedValue += period.earnedValue;
      });
    });
    
    const sortedDates = Array.from(result.keys()).sort();
    let plannedCumulative = 0;
    let actualCumulative = 0;
    let remainingCumulative = 0;
    let earnedValueCumulative = 0;
    
    return sortedDates.map(date => {
      const entry = result.get(date)!;
      plannedCumulative += entry.planned;
      actualCumulative += entry.actual;
      remainingCumulative += entry.remaining;
      earnedValueCumulative += entry.earnedValue;
      
      return {
        date,
        plannedCumulative,
        actualCumulative,
        remainingCumulative,
        earnedValueCumulative,
      };
    });
  },

  generateCommodityCurveData(
    allocations: ResourceAllocationP6[],
    resources: Resource[],
    groupBy: 'day' | 'week' | 'month' = 'week'
  ): Map<string, { date: string; value: number; cumulative: number }[]> {
    const categoryData: Map<string, Map<string, number>> = new Map();
    
    allocations.forEach(alloc => {
      const resource = resources.find(r => r.id === alloc.resourceId);
      if (!resource?.resourceType) return;
      
      const category = resource.resourceType.categoria;
      if (!categoryData.has(category)) {
        categoryData.set(category, new Map());
      }
      
      const catMap = categoryData.get(category)!;
      
      if (alloc.periods) {
        alloc.periods.forEach(period => {
          const periodDate = new Date(period.periodStart);
          let dateKey: string;
          
          if (groupBy === 'day') {
            dateKey = periodDate.toISOString().split('T')[0];
          } else if (groupBy === 'week') {
            const weekStart = new Date(periodDate);
            weekStart.setDate(periodDate.getDate() - periodDate.getDay());
            dateKey = weekStart.toISOString().split('T')[0];
          } else {
            dateKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}-01`;
          }
          
          catMap.set(dateKey, (catMap.get(dateKey) || 0) + period.plannedCost);
        });
      }
    });
    
    const result: Map<string, { date: string; value: number; cumulative: number }[]> = new Map();
    
    categoryData.forEach((dateMap, category) => {
      const sortedDates = Array.from(dateMap.keys()).sort();
      let cumulative = 0;
      
      result.set(category, sortedDates.map(date => {
        const value = dateMap.get(date) || 0;
        cumulative += value;
        return { date, value, cumulative };
      }));
    });
    
    return result;
  },
};

export default resourceService;
