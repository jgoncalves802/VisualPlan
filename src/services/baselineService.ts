import { supabase } from './supabaseClient';
import type { AtividadeMock, DependenciaAtividade } from '../types/cronograma';

export type BaselineType = 'ORIGINAL' | 'REVISION' | 'WHAT_IF' | 'APPROVED';

export interface Baseline {
  id: string;
  empresaId: string;
  projetoId: string;
  numero: number;
  nome: string;
  descricao?: string;
  tipo: BaselineType;
  dataBaseline: string;
  dataInicioProjeto?: string;
  dataFimProjeto?: string;
  duracaoTotalDias?: number;
  totalAtividades?: number;
  custoTotalPlanejado?: number;
  isAtual: boolean;
  aprovado: boolean;
  aprovadoPor?: string;
  aprovadoEm?: string;
  metadata: Record<string, unknown>;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface BaselineTask {
  id: string;
  baselineId: string;
  atividadeId: string;
  nome: string;
  codigo?: string;
  wbs?: string;
  dataInicioPlanejada: string;
  dataFimPlanejada: string;
  duracaoPlanejada?: number;
  progressoPlanejado: number;
  status?: string;
  custoPlanejado: number;
  trabalhoPlanejado: number;
  eCritica: boolean;
  folgaTotal: number;
  folgaLivre: number;
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  parentId?: string;
  nivel: number;
  recursosAlocados: any[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface BaselineDependency {
  id: string;
  baselineId: string;
  dependenciaId: string;
  atividadeOrigemId: string;
  atividadeDestinoId: string;
  tipo: 'FS' | 'SS' | 'FF' | 'SF';
  lagDias: number;
  createdAt: string;
}

export interface BaselineVariance {
  atividadeId: string;
  nomeAtual: string;
  nomeBaseline: string;
  dataInicioAtual: string;
  dataInicioBaseline: string;
  dataFimAtual: string;
  dataFimBaseline: string;
  duracaoAtual: number;
  duracaoBaseline: number;
  progressoAtual: number;
  progressoBaseline: number;
  custoAtual: number;
  custoBaseline: number;
  variacaoDiasInicio: number;
  variacaoDiasFim: number;
  variacaoDuracao: number;
  variacaoCusto: number;
  variacaoProgresso: number;
}

function mapBaselineFromDB(data: any): Baseline {
  return {
    id: data.id,
    empresaId: data.empresa_id,
    projetoId: data.projeto_id,
    numero: data.numero,
    nome: data.nome,
    descricao: data.descricao,
    tipo: data.tipo,
    dataBaseline: data.data_baseline,
    dataInicioProjeto: data.data_inicio_projeto,
    dataFimProjeto: data.data_fim_projeto,
    duracaoTotalDias: data.duracao_total_dias,
    totalAtividades: data.total_atividades,
    custoTotalPlanejado: parseFloat(data.custo_total_planejado) || 0,
    isAtual: data.is_atual,
    aprovado: data.aprovado,
    aprovadoPor: data.aprovado_por,
    aprovadoEm: data.aprovado_em,
    metadata: data.metadata || {},
    ativo: data.ativo,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    createdBy: data.created_by,
  };
}

function mapBaselineTaskFromDB(data: any): BaselineTask {
  return {
    id: data.id,
    baselineId: data.baseline_id,
    atividadeId: data.atividade_id,
    nome: data.nome,
    codigo: data.codigo,
    wbs: data.wbs,
    dataInicioPlanejada: data.data_inicio_planejada,
    dataFimPlanejada: data.data_fim_planejada,
    duracaoPlanejada: data.duracao_planejada,
    progressoPlanejado: parseFloat(data.progresso_planejado) || 0,
    status: data.status,
    custoPlanejado: parseFloat(data.custo_planejado) || 0,
    trabalhoPlanejado: parseFloat(data.trabalho_planejado) || 0,
    eCritica: data.e_critica,
    folgaTotal: data.folga_total || 0,
    folgaLivre: data.folga_livre || 0,
    earlyStart: data.early_start,
    earlyFinish: data.early_finish,
    lateStart: data.late_start,
    lateFinish: data.late_finish,
    parentId: data.parent_id,
    nivel: data.nivel || 0,
    recursosAlocados: data.recursos_alocados || [],
    metadata: data.metadata || {},
    createdAt: data.created_at,
  };
}

function mapBaselineDependencyFromDB(data: any): BaselineDependency {
  return {
    id: data.id,
    baselineId: data.baseline_id,
    dependenciaId: data.dependencia_id,
    atividadeOrigemId: data.atividade_origem_id,
    atividadeDestinoId: data.atividade_destino_id,
    tipo: data.tipo,
    lagDias: data.lag_dias || 0,
    createdAt: data.created_at,
  };
}

export const baselineService = {
  async getBaselines(empresaId: string, projetoId?: string): Promise<Baseline[]> {
    let query = supabase
      .from('baselines')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true);

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query.order('numero', { ascending: false });

    if (error) {
      // PGRST205 = table not found - return empty array gracefully
      if (error.code === 'PGRST205') {
        console.warn('Baselines table not found, returning empty array');
        return [];
      }
      console.error('Error fetching baselines:', error);
      return [];
    }

    return (data || []).map(mapBaselineFromDB);
  },

  async getBaselineById(id: string): Promise<Baseline | null> {
    const { data, error } = await supabase
      .from('baselines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error fetching baseline:', error);
      throw error;
    }

    return mapBaselineFromDB(data);
  },

  async getCurrentBaseline(empresaId: string, projetoId: string): Promise<Baseline | null> {
    const { data, error } = await supabase
      .from('baselines')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('projeto_id', projetoId)
      .eq('is_atual', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      // PGRST205 = table not found - return null gracefully
      if (error.code === 'PGRST205') {
        console.warn('Baselines table not found, returning null');
        return null;
      }
      console.error('Error fetching current baseline:', error);
      return null;
    }

    return mapBaselineFromDB(data);
  },

  async createBaseline(
    empresaId: string,
    projetoId: string,
    nome: string,
    atividades: AtividadeMock[],
    dependencias: DependenciaAtividade[],
    options: {
      descricao?: string;
      tipo?: BaselineType;
      createdBy?: string;
      setAsCurrentBaseline?: boolean;
    } = {}
  ): Promise<Baseline> {
    const existingBaselines = await this.getBaselines(empresaId, projetoId);
    const numero = existingBaselines.length > 0 
      ? Math.max(...existingBaselines.map(b => b.numero)) + 1 
      : 1;

    const dates = atividades.map(a => new Date(a.data_inicio).getTime());
    const endDates = atividades.map(a => new Date(a.data_fim).getTime());
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split('T')[0] : null;
    const maxDate = endDates.length > 0 ? new Date(Math.max(...endDates)).toISOString().split('T')[0] : null;
    
    const duracaoTotal = minDate && maxDate 
      ? Math.ceil((new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const custoTotal = atividades.reduce((sum, a) => sum + (a.custo_planejado || 0), 0);

    const { data: baselineData, error: baselineError } = await supabase
      .from('baselines')
      .insert({
        empresa_id: empresaId,
        projeto_id: projetoId,
        numero,
        nome,
        descricao: options.descricao,
        tipo: options.tipo || 'REVISION',
        data_baseline: new Date().toISOString().split('T')[0],
        data_inicio_projeto: minDate,
        data_fim_projeto: maxDate,
        duracao_total_dias: duracaoTotal,
        total_atividades: atividades.length,
        custo_total_planejado: custoTotal,
        is_atual: options.setAsCurrentBaseline || false,
        created_by: options.createdBy,
      })
      .select()
      .single();

    if (baselineError) {
      console.error('Error creating baseline:', baselineError);
      throw baselineError;
    }

    const baselineId = baselineData.id;

    if (atividades.length > 0) {
      const taskInserts = atividades.map(a => ({
        baseline_id: baselineId,
        atividade_id: a.id,
        nome: a.nome,
        codigo: a.codigo,
        wbs: a.edt,
        data_inicio_planejada: a.data_inicio,
        data_fim_planejada: a.data_fim,
        duracao_planejada: a.duracao_dias,
        progresso_planejado: a.progresso,
        status: a.status,
        custo_planejado: a.custo_planejado || 0,
        trabalho_planejado: 0,
        e_critica: a.e_critica || false,
        folga_total: a.folga_total || 0,
        folga_livre: 0,
        parent_id: a.parent_id,
        nivel: 0,
        recursos_alocados: [],
        metadata: {},
      }));

      const { error: tasksError } = await supabase
        .from('baseline_tasks')
        .insert(taskInserts);

      if (tasksError) {
        console.error('Error creating baseline tasks:', tasksError);
      }
    }

    if (dependencias.length > 0) {
      const depInserts = dependencias.map(d => ({
        baseline_id: baselineId,
        dependencia_id: d.id,
        atividade_origem_id: d.atividade_origem_id,
        atividade_destino_id: d.atividade_destino_id,
        tipo: d.tipo,
        lag_dias: d.lag_dias || 0,
      }));

      const { error: depsError } = await supabase
        .from('baseline_dependencies')
        .insert(depInserts);

      if (depsError) {
        console.error('Error creating baseline dependencies:', depsError);
      }
    }

    if (options.setAsCurrentBaseline) {
      await supabase
        .from('baselines')
        .update({ is_atual: false })
        .eq('empresa_id', empresaId)
        .eq('projeto_id', projetoId)
        .neq('id', baselineId);
    }

    return mapBaselineFromDB(baselineData);
  },

  async setCurrentBaseline(baselineId: string): Promise<void> {
    const baseline = await this.getBaselineById(baselineId);
    if (!baseline) throw new Error('Baseline não encontrada');

    await supabase
      .from('baselines')
      .update({ is_atual: false })
      .eq('empresa_id', baseline.empresaId)
      .eq('projeto_id', baseline.projetoId);

    const { error } = await supabase
      .from('baselines')
      .update({ is_atual: true })
      .eq('id', baselineId);

    if (error) {
      console.error('Error setting current baseline:', error);
      throw error;
    }
  },

  async getBaselineTasks(baselineId: string): Promise<BaselineTask[]> {
    const { data, error } = await supabase
      .from('baseline_tasks')
      .select('*')
      .eq('baseline_id', baselineId)
      .order('data_inicio_planejada');

    if (error) {
      console.error('Error fetching baseline tasks:', error);
      throw error;
    }

    return (data || []).map(mapBaselineTaskFromDB);
  },

  async getBaselineDependencies(baselineId: string): Promise<BaselineDependency[]> {
    const { data, error } = await supabase
      .from('baseline_dependencies')
      .select('*')
      .eq('baseline_id', baselineId);

    if (error) {
      console.error('Error fetching baseline dependencies:', error);
      throw error;
    }

    return (data || []).map(mapBaselineDependencyFromDB);
  },

  async deleteBaseline(id: string): Promise<void> {
    const { error } = await supabase
      .from('baselines')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting baseline:', error);
      throw error;
    }
  },

  async approveBaseline(id: string, aprovadoPor: string): Promise<Baseline> {
    const { data, error } = await supabase
      .from('baselines')
      .update({
        aprovado: true,
        aprovado_por: aprovadoPor,
        aprovado_em: new Date().toISOString(),
        tipo: 'APPROVED',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error approving baseline:', error);
      throw error;
    }

    return mapBaselineFromDB(data);
  },

  calculateVariance(
    baselineTasks: BaselineTask[],
    currentActivities: AtividadeMock[]
  ): BaselineVariance[] {
    const variances: BaselineVariance[] = [];

    baselineTasks.forEach(bt => {
      const current = currentActivities.find(a => a.id === bt.atividadeId);
      if (!current) return;

      const baselineStartDate = new Date(bt.dataInicioPlanejada);
      const baselineEndDate = new Date(bt.dataFimPlanejada);
      const currentStartDate = new Date(current.data_inicio);
      const currentEndDate = new Date(current.data_fim);

      const variacaoDiasInicio = Math.ceil(
        (currentStartDate.getTime() - baselineStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      const variacaoDiasFim = Math.ceil(
        (currentEndDate.getTime() - baselineEndDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      variances.push({
        atividadeId: bt.atividadeId,
        nomeAtual: current.nome,
        nomeBaseline: bt.nome,
        dataInicioAtual: current.data_inicio,
        dataInicioBaseline: bt.dataInicioPlanejada,
        dataFimAtual: current.data_fim,
        dataFimBaseline: bt.dataFimPlanejada,
        duracaoAtual: current.duracao_dias,
        duracaoBaseline: bt.duracaoPlanejada || 0,
        progressoAtual: current.progresso,
        progressoBaseline: bt.progressoPlanejado,
        custoAtual: current.custo_real || 0,
        custoBaseline: bt.custoPlanejado,
        variacaoDiasInicio,
        variacaoDiasFim,
        variacaoDuracao: current.duracao_dias - (bt.duracaoPlanejada || 0),
        variacaoCusto: (current.custo_real || 0) - bt.custoPlanejado,
        variacaoProgresso: current.progresso - bt.progressoPlanejado,
      });
    });

    return variances;
  },

  getSummaryStats(variances: BaselineVariance[]): {
    atividadesAdiantadas: number;
    atividadesAtrasadas: number;
    atividadesNoPrazo: number;
    mediaVariacaoDias: number;
    totalVariacaoCusto: number;
    mediaVariacaoProgresso: number;
  } {
    const adiantadas = variances.filter(v => v.variacaoDiasFim < 0).length;
    const atrasadas = variances.filter(v => v.variacaoDiasFim > 0).length;
    const noPrazo = variances.filter(v => v.variacaoDiasFim === 0).length;
    
    const mediaVariacaoDias = variances.length > 0
      ? variances.reduce((sum, v) => sum + v.variacaoDiasFim, 0) / variances.length
      : 0;
    
    const totalVariacaoCusto = variances.reduce((sum, v) => sum + v.variacaoCusto, 0);
    
    const mediaVariacaoProgresso = variances.length > 0
      ? variances.reduce((sum, v) => sum + v.variacaoProgresso, 0) / variances.length
      : 0;

    return {
      atividadesAdiantadas: adiantadas,
      atividadesAtrasadas: atrasadas,
      atividadesNoPrazo: noPrazo,
      mediaVariacaoDias,
      totalVariacaoCusto,
      mediaVariacaoProgresso,
    };
  },
};

export default baselineService;
