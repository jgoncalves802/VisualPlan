/**
 * Service para gerenciar dados do Cronograma
 * Versão com Supabase para dados reais
 */

import { AtividadeMock, DependenciaAtividade, CaminhoCritico, TipoDependencia, FolgaAtividade } from '../types/cronograma';
import { supabase } from './supabase';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Remove synthetic prefixes (wbs-, eps-) from IDs before saving to database.
 * The database uses pure UUIDs, while the frontend uses prefixed IDs for hierarchy.
 */
const stripSyntheticPrefix = (id: string | undefined | null): string | null => {
  if (!id) return null;
  if (id.startsWith('wbs-')) return id.replace('wbs-', '');
  if (id.startsWith('eps-')) return id.replace('eps-', '');
  return id;
};

// ============================================================================
// ATIVIDADES
// ============================================================================

/**
 * Busca todas as atividades de um projeto
 */
export const getAtividades = async (projetoId: string): Promise<AtividadeMock[]> => {
  const { data, error } = await supabase
    .from('atividades_cronograma')
    .select('*')
    .eq('projeto_id', projetoId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching atividades:', error);
    return [];
  }

  // Convert database format to AtividadeMock format
  return (data || []).map(row => ({
    id: row.id,
    projeto_id: row.projeto_id,
    codigo: row.codigo,
    edt: row.edt,
    nome: row.nome,
    descricao: row.descricao,
    tipo: row.tipo as 'Tarefa' | 'Marco' | 'Fase' | 'WBS',
    parent_id: row.parent_id,
    wbs_id: row.wbs_id,
    data_inicio: row.data_inicio,
    data_fim: row.data_fim,
    duracao_dias: row.duracao_dias,
    unidade_tempo: row.unidade_tempo,
    progresso: Number(row.progresso) || 0,
    status: row.status,
    responsavel_id: row.responsavel_id,
    responsavel_nome: row.responsavel_nome,
    setor_id: row.setor_id,
    prioridade: row.prioridade,
    e_critica: row.e_critica,
    folga_total: row.folga_total,
    calendario_id: row.calendario_id,
    custo_planejado: row.custo_planejado ? Number(row.custo_planejado) : undefined,
    custo_real: row.custo_real ? Number(row.custo_real) : undefined,
    valor_planejado: row.valor_planejado ? Number(row.valor_planejado) : undefined,
    valor_real: row.valor_real ? Number(row.valor_real) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
};

/**
 * Cria uma nova atividade
 */
export const createAtividade = async (
  atividade: Omit<AtividadeMock, 'id' | 'created_at' | 'updated_at'>
): Promise<AtividadeMock> => {
  // Get current user's empresa_id
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('Usuário não autenticado');
  }

  const { data: userProfile } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', userData.user.id)
    .single();

  if (!userProfile?.empresa_id) {
    throw new Error('Usuário não possui empresa associada');
  }

  const { data, error } = await supabase
    .from('atividades_cronograma')
    .insert({
      projeto_id: atividade.projeto_id,
      codigo: atividade.codigo,
      edt: atividade.edt,
      nome: atividade.nome,
      descricao: atividade.descricao,
      tipo: atividade.tipo,
      parent_id: stripSyntheticPrefix(atividade.parent_id),
      wbs_id: stripSyntheticPrefix(atividade.wbs_id),
      data_inicio: atividade.data_inicio,
      data_fim: atividade.data_fim,
      duracao_dias: atividade.duracao_dias,
      unidade_tempo: atividade.unidade_tempo,
      progresso: atividade.progresso,
      status: atividade.status,
      responsavel_id: atividade.responsavel_id,
      responsavel_nome: atividade.responsavel_nome,
      setor_id: atividade.setor_id,
      prioridade: atividade.prioridade,
      e_critica: atividade.e_critica,
      folga_total: atividade.folga_total,
      calendario_id: atividade.calendario_id,
      custo_planejado: atividade.custo_planejado,
      custo_real: atividade.custo_real,
      valor_planejado: atividade.valor_planejado,
      valor_real: atividade.valor_real,
      empresa_id: userProfile.empresa_id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating atividade:', error);
    throw new Error(`Erro ao criar atividade: ${error.message}`);
  }

  return {
    id: data.id,
    projeto_id: data.projeto_id,
    codigo: data.codigo,
    edt: data.edt,
    nome: data.nome,
    descricao: data.descricao,
    tipo: data.tipo as 'Tarefa' | 'Marco' | 'Fase' | 'WBS',
    parent_id: data.parent_id,
    wbs_id: data.wbs_id,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    duracao_dias: data.duracao_dias,
    unidade_tempo: data.unidade_tempo,
    progresso: Number(data.progresso) || 0,
    status: data.status,
    responsavel_id: data.responsavel_id,
    responsavel_nome: data.responsavel_nome,
    setor_id: data.setor_id,
    prioridade: data.prioridade,
    e_critica: data.e_critica,
    folga_total: data.folga_total,
    calendario_id: data.calendario_id,
    custo_planejado: data.custo_planejado ? Number(data.custo_planejado) : undefined,
    custo_real: data.custo_real ? Number(data.custo_real) : undefined,
    valor_planejado: data.valor_planejado ? Number(data.valor_planejado) : undefined,
    valor_real: data.valor_real ? Number(data.valor_real) : undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Atualiza uma atividade existente
 */
export const updateAtividade = async (
  id: string,
  dados: Partial<AtividadeMock>
): Promise<AtividadeMock> => {
  // Clean synthetic prefixes from IDs before saving to database
  const cleanedData = { ...dados };
  if ('parent_id' in cleanedData) {
    cleanedData.parent_id = stripSyntheticPrefix(cleanedData.parent_id) || undefined;
  }
  if ('wbs_id' in cleanedData) {
    cleanedData.wbs_id = stripSyntheticPrefix(cleanedData.wbs_id) || undefined;
  }
  
  const { data, error } = await supabase
    .from('atividades_cronograma')
    .update({
      ...cleanedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating atividade:', error);
    throw new Error(`Erro ao atualizar atividade: ${error.message}`);
  }

  return {
    id: data.id,
    projeto_id: data.projeto_id,
    codigo: data.codigo,
    edt: data.edt,
    nome: data.nome,
    descricao: data.descricao,
    tipo: data.tipo as 'Tarefa' | 'Marco' | 'Fase' | 'WBS',
    parent_id: data.parent_id,
    wbs_id: data.wbs_id,
    data_inicio: data.data_inicio,
    data_fim: data.data_fim,
    duracao_dias: data.duracao_dias,
    unidade_tempo: data.unidade_tempo,
    progresso: Number(data.progresso) || 0,
    status: data.status,
    responsavel_id: data.responsavel_id,
    responsavel_nome: data.responsavel_nome,
    setor_id: data.setor_id,
    prioridade: data.prioridade,
    e_critica: data.e_critica,
    folga_total: data.folga_total,
    calendario_id: data.calendario_id,
    custo_planejado: data.custo_planejado ? Number(data.custo_planejado) : undefined,
    custo_real: data.custo_real ? Number(data.custo_real) : undefined,
    valor_planejado: data.valor_planejado ? Number(data.valor_planejado) : undefined,
    valor_real: data.valor_real ? Number(data.valor_real) : undefined,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Exclui uma atividade
 */
export const deleteAtividade = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('atividades_cronograma')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting atividade:', error);
    throw new Error(`Erro ao excluir atividade: ${error.message}`);
  }
};

// ============================================================================
// DEPENDÊNCIAS
// ============================================================================

/**
 * Busca todas as dependências de um projeto
 */
export const getDependencias = async (projetoId: string): Promise<DependenciaAtividade[]> => {
  // First get all activity IDs for this project
  const { data: atividades, error: atividadesError } = await supabase
    .from('atividades_cronograma')
    .select('id')
    .eq('projeto_id', projetoId);

  if (atividadesError || !atividades) {
    console.error('Error fetching atividades for dependencies:', atividadesError);
    return [];
  }

  const atividadeIds = atividades.map(a => a.id);

  if (atividadeIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('dependencias_atividades')
    .select('*')
    .in('atividade_origem_id', atividadeIds);

  if (error) {
    console.error('Error fetching dependencias:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    atividade_origem_id: row.atividade_origem_id,
    atividade_destino_id: row.atividade_destino_id,
    tipo: row.tipo as TipoDependencia,
    lag_dias: row.lag_dias,
    created_at: row.created_at,
  }));
};

/**
 * Cria uma nova dependência
 */
export const createDependencia = async (
  dependencia: Omit<DependenciaAtividade, 'id' | 'created_at'>
): Promise<DependenciaAtividade> => {
  // Validações
  if (dependencia.atividade_origem_id === dependencia.atividade_destino_id) {
    throw new Error('Uma atividade não pode depender de si mesma');
  }

  // Verifica se já existe essa dependência
  const { data: existente } = await supabase
    .from('dependencias_atividades')
    .select('id')
    .eq('atividade_origem_id', dependencia.atividade_origem_id)
    .eq('atividade_destino_id', dependencia.atividade_destino_id)
    .single();

  if (existente) {
    throw new Error('Esta dependência já existe');
  }

  const { data, error } = await supabase
    .from('dependencias_atividades')
    .insert({
      atividade_origem_id: dependencia.atividade_origem_id,
      atividade_destino_id: dependencia.atividade_destino_id,
      tipo: dependencia.tipo,
      lag_dias: dependencia.lag_dias,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating dependencia:', error);
    throw new Error(`Erro ao criar dependência: ${error.message}`);
  }

  return {
    id: data.id,
    atividade_origem_id: data.atividade_origem_id,
    atividade_destino_id: data.atividade_destino_id,
    tipo: data.tipo as TipoDependencia,
    lag_dias: data.lag_dias,
    created_at: data.created_at,
  };
};

/**
 * Exclui uma dependência
 */
export const deleteDependencia = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('dependencias_atividades')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting dependencia:', error);
    throw new Error(`Erro ao excluir dependência: ${error.message}`);
  }
};

// ============================================================================
// CAMINHO CRÍTICO (CPM - Critical Path Method)
// ============================================================================

/**
 * Calcula o caminho crítico do projeto
 * Implementação do algoritmo CPM (Critical Path Method)
 */
export const calcularCaminhoCritico = async (projetoId: string): Promise<CaminhoCritico> => {
  const atividades = await getAtividades(projetoId);
  const dependencias = await getDependencias(projetoId);

  if (atividades.length === 0) {
    return {
      atividades_criticas: [],
      duracao_total_projeto: 0,
      folgas: {},
      calculado_em: new Date().toISOString(),
    };
  }

  // 1. FORWARD PASS - Calcular Early Start e Early Finish
  const earlyDates = new Map<string, { start: Date; finish: Date }>();
  const lateDates = new Map<string, { start: Date; finish: Date }>();

  // Ordenação topológica
  const sorted = topologicalSort(atividades, dependencias);

  // Forward pass
  for (const atividade of sorted) {
    const predecessoras = dependencias.filter(d => d.atividade_destino_id === atividade.id);
    
    let earlyStart: Date;
    if (predecessoras.length === 0) {
      earlyStart = new Date(atividade.data_inicio);
    } else {
      const maxFinish = Math.max(...predecessoras.map(p => {
        const pred = earlyDates.get(p.atividade_origem_id);
        if (!pred) return new Date(atividade.data_inicio).getTime();
        return pred.finish.getTime() + (p.lag_dias || 0) * 24 * 60 * 60 * 1000;
      }));
      earlyStart = new Date(maxFinish);
    }

    const earlyFinish = new Date(earlyStart.getTime() + (atividade.duracao_dias || 1) * 24 * 60 * 60 * 1000);
    earlyDates.set(atividade.id, { start: earlyStart, finish: earlyFinish });
  }

  // Backward pass
  const reversed = [...sorted].reverse();
  const projectEnd = Math.max(...Array.from(earlyDates.values()).map(d => d.finish.getTime()));

  for (const atividade of reversed) {
    const successoras = dependencias.filter(d => d.atividade_origem_id === atividade.id);
    
    let lateFinish: Date;
    if (successoras.length === 0) {
      lateFinish = new Date(projectEnd);
    } else {
      const minStart = Math.min(...successoras.map(s => {
        const succ = lateDates.get(s.atividade_destino_id);
        if (!succ) return projectEnd;
        return succ.start.getTime() - (s.lag_dias || 0) * 24 * 60 * 60 * 1000;
      }));
      lateFinish = new Date(minStart);
    }

    const lateStart = new Date(lateFinish.getTime() - (atividade.duracao_dias || 1) * 24 * 60 * 60 * 1000);
    lateDates.set(atividade.id, { start: lateStart, finish: lateFinish });
  }

  // Calculate float and identify critical activities
  const atividadesCriticas: string[] = [];
  const folgasRecord: Record<string, FolgaAtividade> = {};

  for (const atividade of atividades) {
    const early = earlyDates.get(atividade.id);
    const late = lateDates.get(atividade.id);
    
    if (early && late) {
      const totalFloat = Math.round((late.start.getTime() - early.start.getTime()) / (24 * 60 * 60 * 1000));
      const freeFloat = 0; // Simplified - would need successor analysis for accurate value
      const isCritical = totalFloat <= 0;
      
      folgasRecord[atividade.id] = {
        atividade_id: atividade.id,
        early_start: early.start,
        early_finish: early.finish,
        late_start: late.start,
        late_finish: late.finish,
        folga_total: totalFloat,
        folga_livre: freeFloat,
        e_critica: isCritical,
      };
      
      if (isCritical) {
        atividadesCriticas.push(atividade.id);
      }
    }
  }

  const duracaoTotal = Math.round((projectEnd - Math.min(...Array.from(earlyDates.values()).map(d => d.start.getTime()))) / (24 * 60 * 60 * 1000));

  return {
    atividades_criticas: atividadesCriticas,
    duracao_total_projeto: duracaoTotal,
    folgas: folgasRecord,
    calculado_em: new Date().toISOString(),
  };
};

/**
 * Ordenação topológica das atividades
 */
function topologicalSort(
  atividades: AtividadeMock[],
  dependencias: DependenciaAtividade[]
): AtividadeMock[] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const a of atividades) {
    inDegree.set(a.id, 0);
    adjacency.set(a.id, []);
  }

  for (const d of dependencias) {
    const current = inDegree.get(d.atividade_destino_id) || 0;
    inDegree.set(d.atividade_destino_id, current + 1);
    
    const adj = adjacency.get(d.atividade_origem_id) || [];
    adj.push(d.atividade_destino_id);
    adjacency.set(d.atividade_origem_id, adj);
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const result: AtividadeMock[] = [];
  const atividadesMap = new Map(atividades.map(a => [a.id, a]));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const atividade = atividadesMap.get(current);
    if (atividade) result.push(atividade);

    for (const neighbor of adjacency.get(current) || []) {
      const degree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, degree);
      if (degree === 0) queue.push(neighbor);
    }
  }

  return result;
}

// ============================================================================
// CALENDÁRIOS (mantido do original)
// ============================================================================

import { CalendarioProjeto, DiaTrabalho, TipoExcecao, UnidadeTempo } from '../types/cronograma';

const calendariosMock: CalendarioProjeto[] = [
  {
    id: 'cal-padrao-5x8',
    nome: 'Calendário Padrão 5x8',
    descricao: 'Segunda a Sexta, 8 horas por dia',
    dias_trabalho: [DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA],
    horario_inicio: '08:00',
    horario_fim: '17:00',
    horario_almoco_inicio: '12:00',
    horario_almoco_fim: '13:00',
    horas_por_dia: 8,
    excecoes: [],
  },
  {
    id: 'cal-6x8',
    nome: 'Calendário 6x8',
    descricao: 'Segunda a Sábado, 8 horas por dia',
    dias_trabalho: [DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA, DiaTrabalho.SABADO],
    horario_inicio: '07:00',
    horario_fim: '16:00',
    horario_almoco_inicio: '12:00',
    horario_almoco_fim: '13:00',
    horas_por_dia: 8,
    excecoes: [],
  },
  {
    id: 'cal-7x24',
    nome: 'Calendário 24/7',
    descricao: 'Operação contínua 24 horas, 7 dias por semana',
    dias_trabalho: [DiaTrabalho.DOMINGO, DiaTrabalho.SEGUNDA, DiaTrabalho.TERCA, DiaTrabalho.QUARTA, DiaTrabalho.QUINTA, DiaTrabalho.SEXTA, DiaTrabalho.SABADO],
    horario_inicio: '00:00',
    horario_fim: '23:59',
    horas_por_dia: 24,
    excecoes: [],
  },
];

export const getCalendarios = async (): Promise<CalendarioProjeto[]> => {
  return calendariosMock;
};

export const getCalendarioPadrao = async (): Promise<string> => {
  return 'cal-padrao-5x8';
};

// ============================================================================
// COLUMN CONFIGURATIONS
// ============================================================================

export interface ColumnConfig {
  id?: string;
  user_id?: string;
  projeto_id: string;
  empresa_id?: string;
  visible_columns: string[];
  column_order: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Get column configuration for current user and project
 */
export const getColumnConfig = async (projetoId: string): Promise<ColumnConfig | null> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.log('[getColumnConfig] User not authenticated');
    return null;
  }

  const { data, error } = await supabase
    .from('cronograma_column_configs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('projeto_id', projetoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - this is expected for new users/projects
      console.log('[getColumnConfig] No config found for user/project');
      return null;
    }
    console.error('[getColumnConfig] Error fetching column config:', error);
    return null;
  }

  return {
    id: data.id,
    user_id: data.user_id,
    projeto_id: data.projeto_id,
    empresa_id: data.empresa_id,
    visible_columns: data.visible_columns || [],
    column_order: data.column_order || [],
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Save column configuration for current user and project (upsert)
 */
export const saveColumnConfig = async (
  projetoId: string,
  visibleColumns: string[],
  columnOrder: string[]
): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    console.error('[saveColumnConfig] User not authenticated');
    return false;
  }

  // Get user's empresa_id
  const { data: userProfile } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', userData.user.id)
    .single();

  if (!userProfile?.empresa_id) {
    console.error('[saveColumnConfig] User has no empresa_id');
    return false;
  }

  const { error } = await supabase
    .from('cronograma_column_configs')
    .upsert({
      user_id: userData.user.id,
      projeto_id: projetoId,
      empresa_id: userProfile.empresa_id,
      visible_columns: visibleColumns,
      column_order: columnOrder,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,projeto_id',
    });

  if (error) {
    console.error('[saveColumnConfig] Error saving column config:', error);
    return false;
  }

  console.log('[saveColumnConfig] Column config saved successfully');
  return true;
};

/**
 * Delete column configuration (reset to defaults)
 */
export const deleteColumnConfig = async (projetoId: string): Promise<boolean> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return false;
  }

  const { error } = await supabase
    .from('cronograma_column_configs')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('projeto_id', projetoId);

  if (error) {
    console.error('[deleteColumnConfig] Error deleting column config:', error);
    return false;
  }

  return true;
};

// ============================================================================
// ACTIVITY CODE UTILITIES
// ============================================================================

/**
 * Generates Primavera P6-style activity codes (A1010, A1020, etc.)
 * Codes increment by 10, never recycle deleted codes
 */
function generateNextActivityCode(existingCodes: (string | undefined | null)[]): string {
  const prefix = 'A';
  const increment = 10;
  const startSuffix = 1000; // First code will be 1000 + 10 = 1010
  let maxSuffix = startSuffix;
  
  for (const code of existingCodes) {
    if (code && typeof code === 'string' && code.startsWith(prefix)) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const suffix = parseInt(match[1], 10);
        if (suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      }
    }
  }
  
  return `${prefix}${maxSuffix + increment}`;
}

/**
 * Ensures all activities in a project have activity codes.
 * Activities without codes will get auto-generated codes (A1010, A1020, etc.)
 * Returns the number of activities updated.
 */
export const ensureActivityCodes = async (projetoId: string): Promise<number> => {
  // Get all activities
  const { data: atividades, error: fetchError } = await supabase
    .from('atividades_cronograma')
    .select('id, codigo')
    .eq('projeto_id', projetoId)
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('[ensureActivityCodes] Error fetching activities:', fetchError);
    return 0;
  }

  if (!atividades || atividades.length === 0) {
    console.log('[ensureActivityCodes] No activities found');
    return 0;
  }

  // Find activities without codes
  const activitiesWithoutCode = atividades.filter(a => !a.codigo);
  
  if (activitiesWithoutCode.length === 0) {
    console.log('[ensureActivityCodes] All activities have codes');
    return 0;
  }

  // Get all existing codes to avoid collisions
  const existingCodes = atividades.map(a => a.codigo).filter(Boolean);
  
  let updatedCount = 0;
  
  // Update each activity without a code
  for (const activity of activitiesWithoutCode) {
    const newCode = generateNextActivityCode(existingCodes);
    existingCodes.push(newCode); // Track for next iteration
    
    const { error: updateError } = await supabase
      .from('atividades_cronograma')
      .update({ codigo: newCode, updated_at: new Date().toISOString() })
      .eq('id', activity.id);
    
    if (updateError) {
      console.error(`[ensureActivityCodes] Error updating activity ${activity.id}:`, updateError);
    } else {
      console.log(`[ensureActivityCodes] Assigned code ${newCode} to activity ${activity.id}`);
      updatedCount++;
    }
  }
  
  console.log(`[ensureActivityCodes] Updated ${updatedCount} activities`);
  return updatedCount;
};

/**
 * Ensures all activities across ALL projects have activity codes.
 * Useful for data migration or cleanup.
 */
export const ensureAllActivityCodes = async (): Promise<number> => {
  // Get all unique project IDs
  const { data: projects, error: projectError } = await supabase
    .from('atividades_cronograma')
    .select('projeto_id')
    .order('projeto_id');

  if (projectError) {
    console.error('[ensureAllActivityCodes] Error fetching projects:', projectError);
    return 0;
  }

  if (!projects || projects.length === 0) {
    console.log('[ensureAllActivityCodes] No activities found in database');
    return 0;
  }

  // Get unique project IDs
  const uniqueProjectIds = [...new Set(projects.map(p => p.projeto_id))];
  
  let totalUpdated = 0;
  
  for (const projetoId of uniqueProjectIds) {
    const count = await ensureActivityCodes(projetoId);
    totalUpdated += count;
  }
  
  console.log(`[ensureAllActivityCodes] Total activities updated: ${totalUpdated}`);
  return totalUpdated;
};

// ============================================================================
// EXPORTAR TIPOS
// ============================================================================

export type { CalendarioProjeto, DiaTrabalho, TipoExcecao, UnidadeTempo };
