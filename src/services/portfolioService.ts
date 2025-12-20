import { supabase } from './supabaseClient';

export interface CriterioPriorizacao {
  id: string;
  nome: string;
  descricao?: string;
  peso: number;
  inverso: boolean;
  ativo: boolean;
  ordem: number;
}

export interface ScoreProjeto {
  criterioId: string;
  score: number;
  justificativa?: string;
}

export enum StatusProjeto {
  NO_PRAZO = 'NO_PRAZO',
  EM_RISCO = 'EM_RISCO',
  ATRASADO = 'ATRASADO',
  CRITICO = 'CRITICO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO',
  SUSPENSO = 'SUSPENSO',
}

export interface ProjetoPortfolio {
  id: string;
  epsNodeId?: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  gerente?: string;
  gerenteId?: string;
  orcamento?: number;
  dataInicio?: Date;
  dataFim?: Date;
  status: StatusProjeto;
  scores: ScoreProjeto[];
  valorEstrategico?: number;
  roiEsperado?: number;
  scoreTotal: number;
  ranking?: number;
  categoria?: string;
  fase?: string;
  prioridadeManual?: number;
  notas?: string;
  ativo: boolean;
}

interface CriterioDB {
  id: string;
  empresa_id: string;
  nome: string;
  descricao: string | null;
  peso: number;
  inverso: boolean;
  ativo: boolean;
  ordem: number;
}

interface ProjetoDB {
  id: string;
  empresa_id: string;
  eps_node_id: string | null;
  codigo: string | null;
  nome: string;
  descricao: string | null;
  gerente: string | null;
  gerente_id: string | null;
  orcamento: number | null;
  data_inicio: string | null;
  data_fim: string | null;
  status: string;
  scores: ScoreProjeto[] | null;
  valor_estrategico: number | null;
  roi_esperado: number | null;
  score_total: number | null;
  ranking: number | null;
  categoria: string | null;
  fase: string | null;
  prioridade_manual: number | null;
  notas: string | null;
  ativo: boolean;
}

const mapCriterioFromDB = (data: CriterioDB): CriterioPriorizacao => ({
  id: data.id,
  nome: data.nome,
  descricao: data.descricao || undefined,
  peso: data.peso,
  inverso: data.inverso,
  ativo: data.ativo,
  ordem: data.ordem,
});

const mapProjetoFromDB = (data: ProjetoDB): ProjetoPortfolio => ({
  id: data.id,
  epsNodeId: data.eps_node_id || undefined,
  codigo: data.codigo || undefined,
  nome: data.nome,
  descricao: data.descricao || undefined,
  gerente: data.gerente || undefined,
  gerenteId: data.gerente_id || undefined,
  orcamento: data.orcamento || undefined,
  dataInicio: data.data_inicio ? new Date(data.data_inicio) : undefined,
  dataFim: data.data_fim ? new Date(data.data_fim) : undefined,
  status: data.status as StatusProjeto,
  scores: data.scores || [],
  valorEstrategico: data.valor_estrategico || undefined,
  roiEsperado: data.roi_esperado || undefined,
  scoreTotal: data.score_total || 0,
  ranking: data.ranking || undefined,
  categoria: data.categoria || undefined,
  fase: data.fase || undefined,
  prioridadeManual: data.prioridade_manual || undefined,
  notas: data.notas || undefined,
  ativo: data.ativo,
});

const DEFAULT_CRITERIOS: Omit<CriterioPriorizacao, 'id'>[] = [
  { nome: 'ROI', descricao: 'Retorno sobre Investimento', peso: 20, inverso: false, ativo: true, ordem: 1 },
  { nome: 'Alinhamento Estratégico', descricao: 'Alinhamento com objetivos estratégicos', peso: 20, inverso: false, ativo: true, ordem: 2 },
  { nome: 'Urgência', descricao: 'Urgência de execução', peso: 15, inverso: false, ativo: true, ordem: 3 },
  { nome: 'Complexidade', descricao: 'Complexidade do projeto (menor é melhor)', peso: 15, inverso: true, ativo: true, ordem: 4 },
  { nome: 'Disponibilidade de Recursos', descricao: 'Disponibilidade de recursos necessários', peso: 15, inverso: false, ativo: true, ordem: 5 },
  { nome: 'Risco', descricao: 'Nível de risco do projeto (menor é melhor)', peso: 15, inverso: true, ativo: true, ordem: 6 },
];

export const portfolioService = {
  async getCriterios(empresaId: string): Promise<CriterioPriorizacao[]> {
    const { data, error } = await supabase
      .from('criterios_priorizacao')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('ordem', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela criterios_priorizacao não encontrada, retornando critérios padrão');
        return DEFAULT_CRITERIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
      }
      console.error('Erro ao buscar critérios:', error);
      return DEFAULT_CRITERIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
    }

    if (!data || data.length === 0) {
      return DEFAULT_CRITERIOS.map((c, i) => ({ ...c, id: `default-${i}` }));
    }

    return data.map(mapCriterioFromDB);
  },

  async createCriterio(criterio: Omit<CriterioPriorizacao, 'id'>, empresaId: string): Promise<CriterioPriorizacao | null> {
    const dbData = {
      empresa_id: empresaId,
      nome: criterio.nome,
      descricao: criterio.descricao || null,
      peso: criterio.peso,
      inverso: criterio.inverso,
      ativo: criterio.ativo,
      ordem: criterio.ordem,
    };

    const { data, error } = await supabase
      .from('criterios_priorizacao')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar critério:', error);
      throw error;
    }

    return mapCriterioFromDB(data);
  },

  async updateCriterio(id: string, criterio: Partial<CriterioPriorizacao>): Promise<CriterioPriorizacao | null> {
    const updateData: Record<string, unknown> = {};
    
    if (criterio.nome !== undefined) updateData.nome = criterio.nome;
    if (criterio.descricao !== undefined) updateData.descricao = criterio.descricao;
    if (criterio.peso !== undefined) updateData.peso = criterio.peso;
    if (criterio.inverso !== undefined) updateData.inverso = criterio.inverso;
    if (criterio.ativo !== undefined) updateData.ativo = criterio.ativo;
    if (criterio.ordem !== undefined) updateData.ordem = criterio.ordem;

    const { data, error } = await supabase
      .from('criterios_priorizacao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar critério:', error);
      throw error;
    }

    return mapCriterioFromDB(data);
  },

  async deleteCriterio(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('criterios_priorizacao')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir critério:', error);
      throw error;
    }

    return true;
  },

  async initializeDefaultCriterios(empresaId: string): Promise<CriterioPriorizacao[]> {
    const existing = await this.getCriterios(empresaId);
    if (existing.length > 0 && !existing[0].id.startsWith('default-')) {
      return existing;
    }

    const created: CriterioPriorizacao[] = [];
    for (const criterio of DEFAULT_CRITERIOS) {
      try {
        const result = await this.createCriterio(criterio, empresaId);
        if (result) created.push(result);
      } catch {
        console.warn('Erro ao criar critério padrão:', criterio.nome);
      }
    }

    return created.length > 0 ? created : existing;
  },

  async getProjetos(empresaId: string): Promise<ProjetoPortfolio[]> {
    const { data, error } = await supabase
      .from('projetos_portfolio')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('ranking', { ascending: true, nullsFirst: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela projetos_portfolio não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar projetos:', error);
      return [];
    }

    return (data || []).map(mapProjetoFromDB);
  },

  async getProjetoById(id: string): Promise<ProjetoPortfolio | null> {
    const { data, error } = await supabase
      .from('projetos_portfolio')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar projeto:', error);
      return null;
    }

    return mapProjetoFromDB(data);
  },

  async createProjeto(projeto: Omit<ProjetoPortfolio, 'id' | 'scoreTotal'>, empresaId: string): Promise<ProjetoPortfolio | null> {
    const dbData = {
      empresa_id: empresaId,
      eps_node_id: projeto.epsNodeId || null,
      codigo: projeto.codigo || null,
      nome: projeto.nome,
      descricao: projeto.descricao || null,
      gerente: projeto.gerente || null,
      gerente_id: projeto.gerenteId || null,
      orcamento: projeto.orcamento || null,
      data_inicio: projeto.dataInicio ? projeto.dataInicio.toISOString().split('T')[0] : null,
      data_fim: projeto.dataFim ? projeto.dataFim.toISOString().split('T')[0] : null,
      status: projeto.status,
      scores: projeto.scores,
      valor_estrategico: projeto.valorEstrategico || null,
      roi_esperado: projeto.roiEsperado || null,
      score_total: 0,
      ranking: projeto.ranking || null,
      categoria: projeto.categoria || null,
      fase: projeto.fase || null,
      prioridade_manual: projeto.prioridadeManual || null,
      notas: projeto.notas || null,
      ativo: projeto.ativo,
    };

    const { data, error } = await supabase
      .from('projetos_portfolio')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar projeto:', error);
      throw error;
    }

    return mapProjetoFromDB(data);
  },

  async updateProjeto(id: string, projeto: Partial<ProjetoPortfolio>): Promise<ProjetoPortfolio | null> {
    const updateData: Record<string, unknown> = {};
    
    if (projeto.nome !== undefined) updateData.nome = projeto.nome;
    if (projeto.descricao !== undefined) updateData.descricao = projeto.descricao;
    if (projeto.gerente !== undefined) updateData.gerente = projeto.gerente;
    if (projeto.orcamento !== undefined) updateData.orcamento = projeto.orcamento;
    if (projeto.dataInicio !== undefined) updateData.data_inicio = projeto.dataInicio?.toISOString().split('T')[0];
    if (projeto.dataFim !== undefined) updateData.data_fim = projeto.dataFim?.toISOString().split('T')[0];
    if (projeto.status !== undefined) updateData.status = projeto.status;
    if (projeto.scores !== undefined) updateData.scores = projeto.scores;
    if (projeto.valorEstrategico !== undefined) updateData.valor_estrategico = projeto.valorEstrategico;
    if (projeto.roiEsperado !== undefined) updateData.roi_esperado = projeto.roiEsperado;
    if (projeto.scoreTotal !== undefined) updateData.score_total = projeto.scoreTotal;
    if (projeto.ranking !== undefined) updateData.ranking = projeto.ranking;
    if (projeto.categoria !== undefined) updateData.categoria = projeto.categoria;
    if (projeto.fase !== undefined) updateData.fase = projeto.fase;
    if (projeto.notas !== undefined) updateData.notas = projeto.notas;
    if (projeto.ativo !== undefined) updateData.ativo = projeto.ativo;

    const { data, error } = await supabase
      .from('projetos_portfolio')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar projeto:', error);
      throw error;
    }

    return mapProjetoFromDB(data);
  },

  async deleteProjeto(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('projetos_portfolio')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir projeto:', error);
      throw error;
    }

    return true;
  },

  async updateScores(id: string, scores: ScoreProjeto[]): Promise<ProjetoPortfolio | null> {
    return this.updateProjeto(id, { scores });
  },

  calculateScoreTotal(scores: ScoreProjeto[], criterios: CriterioPriorizacao[]): number {
    if (!scores || scores.length === 0 || !criterios || criterios.length === 0) {
      return 0;
    }

    let totalPeso = 0;
    let totalPonderado = 0;

    for (const criterio of criterios) {
      const scoreItem = scores.find(s => s.criterioId === criterio.id);
      if (scoreItem) {
        const scoreNormalizado = criterio.inverso ? (11 - scoreItem.score) : scoreItem.score;
        totalPonderado += scoreNormalizado * criterio.peso;
        totalPeso += criterio.peso;
      }
    }

    return totalPeso > 0 ? (totalPonderado / totalPeso) : 0;
  },

  async recalculateAllRankings(empresaId: string, criterios: CriterioPriorizacao[]): Promise<ProjetoPortfolio[]> {
    const projetos = await this.getProjetos(empresaId);
    
    const projetosComScore = projetos.map(p => ({
      ...p,
      scoreTotal: this.calculateScoreTotal(p.scores, criterios),
    }));

    projetosComScore.sort((a, b) => b.scoreTotal - a.scoreTotal);

    for (let i = 0; i < projetosComScore.length; i++) {
      const projeto = projetosComScore[i];
      await this.updateProjeto(projeto.id, {
        scoreTotal: projeto.scoreTotal,
        ranking: i + 1,
      });
      projeto.ranking = i + 1;
    }

    return projetosComScore;
  },
};
