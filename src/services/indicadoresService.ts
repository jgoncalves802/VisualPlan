import { supabase } from './supabaseClient';
import { acoes5w2hService } from './acoes5w2hService';
import { restricoesIshikawaService } from './restricoesIshikawaService';
import { gestaoMudancaService } from './gestaoMudancaService';
import { auditoriaService } from './auditoriaService';
import { StatusAcao5W2H, StatusMudanca, StatusRestricaoIshikawa, StatusAuditoria } from '../types/gestao';

export interface IndicadorEVM {
  spi: number;
  cpi: number;
  eac: number;
  vac: number;
  bac: number;
  sv?: number;
  cv?: number;
  etc?: number;
  tcpi?: number;
  percentualFisico?: number;
  percentualFinanceiro?: number;
}

export interface IndicadorLPS {
  ppc: number;
  tmr: number;
  restricoesAtivas: number;
  tarefasPlanejadas?: number;
  tarefasConcluidas?: number;
}

export interface IndicadorQualidade {
  iqo: number;
  auditoriasCompletas: number;
  naoConformidades: number;
  acoesCorretivas: number;
}

export interface IndicadorRecursos {
  capacidadeEquipe: number;
  alocacaoAtual: number;
  indiceProdutividade: number;
}

export interface IndicadorGestao {
  solicitacoesMudanca: number;
  acoes5w2h: number;
  ciclosPdca: number;
  licoesAprendidas: number;
}

export interface CurvaSItem {
  mes: string;
  planejado: number;
  realizado: number;
}

export interface PPCSemanal {
  semana: string;
  ppc: number;
}

export interface AtividadeAtrasada {
  id: string;
  nome: string;
  atraso: number;
  responsavel: string;
}

export interface AlocacaoRecurso {
  recurso: string;
  alocado: number;
  capacidade: number;
}

export interface AuditoriaRecente {
  id: string;
  titulo: string;
  data: string;
  conformidade: number;
}

export interface AcaoRecente {
  id: string;
  titulo: string;
  status: string;
  prazo: string;
}

export interface RestricaoPorTipo {
  tipo: string;
  quantidade: number;
}

const DEFAULT_EVM: IndicadorEVM = {
  spi: 0.95,
  cpi: 1.02,
  eac: 15800000,
  vac: -280000,
  bac: 15520000,
};

const DEFAULT_LPS: IndicadorLPS = {
  ppc: 78.5,
  tmr: 4.2,
  restricoesAtivas: 15,
};

const DEFAULT_QUALIDADE: IndicadorQualidade = {
  iqo: 92.5,
  auditoriasCompletas: 12,
  naoConformidades: 8,
  acoesCorretivas: 5,
};

const DEFAULT_RECURSOS: IndicadorRecursos = {
  capacidadeEquipe: 45,
  alocacaoAtual: 87,
  indiceProdutividade: 1.05,
};

const DEFAULT_GESTAO: IndicadorGestao = {
  solicitacoesMudanca: 3,
  acoes5w2h: 18,
  ciclosPdca: 4,
  licoesAprendidas: 12,
};

export const indicadoresService = {
  async getEVM(empresaId: string, projetoId?: string): Promise<IndicadorEVM> {
    try {
      let query = supabase
        .from('snapshots_evm')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_referencia', { ascending: false })
        .limit(1);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          return await this.calculateEVMFromActivities(empresaId);
        }
        console.warn('Erro ao buscar snapshot EVM:', error);
        return await this.calculateEVMFromActivities(empresaId);
      }

      if (!data || data.length === 0) {
        return await this.calculateEVMFromActivities(empresaId);
      }

      const snapshot = data[0];
      return {
        spi: snapshot.spi || 1,
        cpi: snapshot.cpi || 1,
        eac: snapshot.eac || 0,
        vac: snapshot.vac || 0,
        bac: snapshot.bac || 0,
        sv: snapshot.sv,
        cv: snapshot.cv,
        etc: snapshot.etc,
        tcpi: snapshot.tcpi,
        percentualFisico: snapshot.percentual_fisico,
        percentualFinanceiro: snapshot.percentual_financeiro,
      };
    } catch (e) {
      console.error('Erro ao buscar indicadores EVM:', e);
      return DEFAULT_EVM;
    }
  },

  async calculateEVMFromActivities(empresaId: string): Promise<IndicadorEVM> {
    try {
      const { data } = await supabase
        .from('atividades_cronograma')
        .select('bcws, bcwp, acwp, custo_orcado')
        .eq('empresa_id', empresaId);

      if (!data || data.length === 0) {
        return DEFAULT_EVM;
      }

      const totals = data.reduce((acc, a) => ({
        bcws: acc.bcws + (a.bcws || 0),
        bcwp: acc.bcwp + (a.bcwp || 0),
        acwp: acc.acwp + (a.acwp || 0),
        bac: acc.bac + (a.custo_orcado || 0),
      }), { bcws: 0, bcwp: 0, acwp: 0, bac: 0 });

      const spi = totals.bcws > 0 ? totals.bcwp / totals.bcws : 1;
      const cpi = totals.acwp > 0 ? totals.bcwp / totals.acwp : 1;
      const sv = totals.bcwp - totals.bcws;
      const cv = totals.bcwp - totals.acwp;
      const eac = cpi > 0 ? totals.bac / cpi : totals.bac;
      const vac = totals.bac - eac;

      return {
        spi: Math.round(spi * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
        eac: Math.round(eac),
        vac: Math.round(vac),
        bac: Math.round(totals.bac),
        sv: Math.round(sv),
        cv: Math.round(cv),
      };
    } catch {
      return DEFAULT_EVM;
    }
  },

  async getLPS(empresaId: string, projetoId?: string): Promise<IndicadorLPS> {
    try {
      let query = supabase
        .from('indicadores_lps')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_referencia', { ascending: false })
        .limit(1);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          return await this.calculateLPSFromRestrictions(empresaId);
        }
        console.warn('Erro ao buscar indicadores LPS:', error);
        return await this.calculateLPSFromRestrictions(empresaId);
      }

      if (!data || data.length === 0) {
        return await this.calculateLPSFromRestrictions(empresaId);
      }

      const indicador = data[0];
      return {
        ppc: indicador.ppc || 0,
        tmr: indicador.tmr_dias || 0,
        restricoesAtivas: indicador.restricoes_ativas || 0,
        tarefasPlanejadas: indicador.tarefas_planejadas,
        tarefasConcluidas: indicador.tarefas_concluidas,
      };
    } catch (e) {
      console.error('Erro ao buscar indicadores LPS:', e);
      return DEFAULT_LPS;
    }
  },

  async calculateLPSFromRestrictions(empresaId: string): Promise<IndicadorLPS> {
    try {
      const restricoes = await restricoesIshikawaService.getAll(empresaId);

      if (restricoes.length === 0) {
        return DEFAULT_LPS;
      }

      const ativas = restricoes.filter(r =>
        r.status !== StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO
      ).length;

      const concluidas = restricoes.filter(r =>
        r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO
      );

      let tmr = 0;
      if (concluidas.length > 0) {
        const totalDias = concluidas.reduce((acc, r) => {
          if (r.dataConclusao) {
            const dias = Math.ceil((r.dataConclusao.getTime() - r.dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
            return acc + dias;
          }
          return acc;
        }, 0);
        tmr = totalDias / concluidas.length;
      }

      const ppc = restricoes.length > 0 
        ? (concluidas.length / restricoes.length) * 100 
        : 0;

      return {
        ppc: Math.round(ppc * 10) / 10,
        tmr: Math.round(tmr * 10) / 10,
        restricoesAtivas: ativas,
      };
    } catch {
      return DEFAULT_LPS;
    }
  },

  async getQualidade(empresaId: string, projetoId?: string): Promise<IndicadorQualidade> {
    try {
      let query = supabase
        .from('indicadores_qualidade')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_referencia', { ascending: false })
        .limit(1);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          return await this.calculateQualidadeFromAuditorias(empresaId);
        }
        return await this.calculateQualidadeFromAuditorias(empresaId);
      }

      if (!data || data.length === 0) {
        return await this.calculateQualidadeFromAuditorias(empresaId);
      }

      const indicador = data[0];
      return {
        iqo: indicador.iqo || 0,
        auditoriasCompletas: indicador.auditorias_realizadas || 0,
        naoConformidades: indicador.nao_conformidades_abertas || 0,
        acoesCorretivas: indicador.acoes_corretivas_abertas || 0,
      };
    } catch (e) {
      console.error('Erro ao buscar indicadores de qualidade:', e);
      return DEFAULT_QUALIDADE;
    }
  },

  async calculateQualidadeFromAuditorias(empresaId: string): Promise<IndicadorQualidade> {
    try {
      const auditorias = await auditoriaService.getAllAuditorias(empresaId);

      if (auditorias.length === 0) {
        return DEFAULT_QUALIDADE;
      }

      const completas = auditorias.filter(a => a.status === StatusAuditoria.CONCLUIDA);
      const iqo = completas.length > 0
        ? completas.reduce((acc, a) => acc + (a.percentualConformidade || 0), 0) / completas.length
        : 0;

      const naoConformidades = auditorias.reduce((acc, a) => acc + (a.naoConformidades || 0), 0);
      const acoesGeradas = auditorias.reduce((acc, a) => acc + (a.acoesGeradas?.length || 0), 0);

      return {
        iqo: Math.round(iqo * 10) / 10,
        auditoriasCompletas: completas.length,
        naoConformidades,
        acoesCorretivas: acoesGeradas,
      };
    } catch {
      return DEFAULT_QUALIDADE;
    }
  },

  async getRecursos(empresaId: string): Promise<IndicadorRecursos> {
    try {
      const { data: recursos } = await supabase
        .from('resources')
        .select('id, capacidade_maxima')
        .eq('empresa_id', empresaId);

      const { data: alocacoes } = await supabase
        .from('resource_allocations')
        .select('resource_id, unidades')
        .gte('data_fim', new Date().toISOString().split('T')[0]);

      if (!recursos || recursos.length === 0) {
        return DEFAULT_RECURSOS;
      }

      const capacidadeTotal = recursos.reduce((acc, r) => acc + (r.capacidade_maxima || 0), 0);
      const alocacaoTotal = alocacoes?.reduce((acc, a) => acc + (a.unidades || 0), 0) || 0;
      const percentualAlocacao = capacidadeTotal > 0 ? (alocacaoTotal / capacidadeTotal) * 100 : 0;

      return {
        capacidadeEquipe: recursos.length,
        alocacaoAtual: Math.round(percentualAlocacao),
        indiceProdutividade: 1.0,
      };
    } catch {
      return DEFAULT_RECURSOS;
    }
  },

  async getGestao(empresaId: string): Promise<IndicadorGestao> {
    try {
      const [acoes, mudancas] = await Promise.all([
        acoes5w2hService.getAll(empresaId),
        gestaoMudancaService.getAll(empresaId),
      ]);

      const acoesAbertas = acoes.filter(a =>
        a.status !== StatusAcao5W2H.CONCLUIDA && a.status !== StatusAcao5W2H.CANCELADA
      ).length;

      const mudancasPendentes = mudancas.filter(m =>
        m.status === StatusMudanca.SUBMETIDA || m.status === StatusMudanca.EM_ANALISE
      ).length;

      const hasRealData = acoes.length > 0 || mudancas.length > 0;
      if (!hasRealData) {
        return DEFAULT_GESTAO;
      }

      return {
        solicitacoesMudanca: mudancasPendentes,
        acoes5w2h: acoesAbertas,
        ciclosPdca: 0,
        licoesAprendidas: 0,
      };
    } catch {
      return DEFAULT_GESTAO;
    }
  },

  async getCurvaS(empresaId: string, projetoId?: string): Promise<CurvaSItem[]> {
    try {
      let query = supabase
        .from('curva_s')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data', { ascending: true });

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return this.generateDefaultCurvaS();
      }

      return data.map(row => ({
        mes: row.mes,
        planejado: row.planejado,
        realizado: row.realizado,
      }));
    } catch {
      return this.generateDefaultCurvaS();
    }
  },

  generateDefaultCurvaS(): CurvaSItem[] {
    return [
      { mes: 'Jan', planejado: 5, realizado: 6 },
      { mes: 'Fev', planejado: 12, realizado: 11 },
      { mes: 'Mar', planejado: 22, realizado: 20 },
      { mes: 'Abr', planejado: 35, realizado: 32 },
      { mes: 'Mai', planejado: 48, realizado: 44 },
      { mes: 'Jun', planejado: 62, realizado: 56 },
      { mes: 'Jul', planejado: 75, realizado: 68 },
      { mes: 'Ago', planejado: 85, realizado: 78 },
    ];
  },

  async getPPCSemanal(empresaId: string, projetoId?: string): Promise<PPCSemanal[]> {
    try {
      let query = supabase
        .from('indicadores_lps')
        .select('semana, ano, ppc')
        .eq('empresa_id', empresaId)
        .order('ano', { ascending: true })
        .order('semana', { ascending: true })
        .limit(8);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return this.generateDefaultPPCSemanal();
      }

      return data.map(row => ({
        semana: `S${row.semana}`,
        ppc: row.ppc || 0,
      }));
    } catch {
      return this.generateDefaultPPCSemanal();
    }
  },

  generateDefaultPPCSemanal(): PPCSemanal[] {
    return [
      { semana: 'S1', ppc: 72 },
      { semana: 'S2', ppc: 68 },
      { semana: 'S3', ppc: 75 },
      { semana: 'S4', ppc: 82 },
      { semana: 'S5', ppc: 79 },
      { semana: 'S6', ppc: 78 },
      { semana: 'S7', ppc: 85 },
      { semana: 'S8', ppc: 78.5 },
    ];
  },

  async getAtividadesAtrasadas(empresaId: string, limit: number = 5): Promise<AtividadeAtrasada[]> {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('atividades_cronograma')
        .select('id, nome, data_termino_prevista, responsavel')
        .eq('empresa_id', empresaId)
        .lt('data_termino_prevista', hoje)
        .lt('percentual_completo', 100)
        .order('data_termino_prevista', { ascending: true })
        .limit(limit);

      if (error || !data || data.length === 0) {
        return this.generateDefaultAtividadesAtrasadas();
      }

      return data.map(a => {
        const dataTermino = new Date(a.data_termino_prevista);
        const atraso = Math.ceil((new Date().getTime() - dataTermino.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: a.id,
          nome: a.nome,
          atraso,
          responsavel: a.responsavel || 'Não atribuído',
        };
      });
    } catch {
      return this.generateDefaultAtividadesAtrasadas();
    }
  },

  generateDefaultAtividadesAtrasadas(): AtividadeAtrasada[] {
    return [
      { id: '1.2.3.1', nome: 'Fundação Bloco A', atraso: 12, responsavel: 'João Silva' },
      { id: '1.3.2.4', nome: 'Estrutura Metálica P2', atraso: 8, responsavel: 'Maria Santos' },
      { id: '2.1.1.3', nome: 'Instalações Elétricas', atraso: 6, responsavel: 'Carlos Lima' },
      { id: '1.4.5.2', nome: 'Acabamento Interno', atraso: 5, responsavel: 'Ana Costa' },
      { id: '2.2.3.1', nome: 'Sistema HVAC', atraso: 4, responsavel: 'Pedro Souza' },
    ];
  },

  async getRestricoesPorTipo(empresaId: string): Promise<RestricaoPorTipo[]> {
    try {
      const restricoes = await restricoesIshikawaService.getAll(empresaId);

      if (restricoes.length === 0) {
        return this.generateDefaultRestricoesPorTipo();
      }

      const countByCategory = restricoes.reduce((acc, r) => {
        const label = this.getCategoryLabel(r.categoria);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(countByCategory).map(([tipo, quantidade]) => ({
        tipo,
        quantidade,
      }));
    } catch {
      return this.generateDefaultRestricoesPorTipo();
    }
  },

  getCategoryLabel(categoria: string): string {
    const labels: Record<string, string> = {
      'METODO': 'Método',
      'MAO_DE_OBRA': 'Mão de Obra',
      'MATERIAL': 'Material',
      'MAQUINA': 'Equipamento',
      'MEDIDA': 'Medida',
      'MEIO_AMBIENTE': 'Clima',
    };
    return labels[categoria] || categoria;
  },

  generateDefaultRestricoesPorTipo(): RestricaoPorTipo[] {
    return [
      { tipo: 'Material', quantidade: 6 },
      { tipo: 'Mão de Obra', quantidade: 4 },
      { tipo: 'Equipamento', quantidade: 2 },
      { tipo: 'Projeto', quantidade: 2 },
      { tipo: 'Clima', quantidade: 1 },
    ];
  },

  async getAlocacaoRecursos(empresaId: string): Promise<AlocacaoRecurso[]> {
    try {
      const { data: recursos } = await supabase
        .from('resources')
        .select('id, nome, capacidade_maxima')
        .eq('empresa_id', empresaId)
        .limit(5);

      if (!recursos || recursos.length === 0) {
        return this.generateDefaultAlocacaoRecursos();
      }

      const { data: alocacoes } = await supabase
        .from('resource_allocations')
        .select('resource_id, unidades')
        .gte('data_fim', new Date().toISOString().split('T')[0]);

      return recursos.map(r => {
        const alocado = alocacoes
          ?.filter(a => a.resource_id === r.id)
          .reduce((acc, a) => acc + (a.unidades || 0), 0) || 0;
        const percentual = r.capacidade_maxima > 0 ? (alocado / r.capacidade_maxima) * 100 : 0;
        return {
          recurso: r.nome,
          alocado: Math.round(percentual),
          capacidade: r.capacidade_maxima || 0,
        };
      });
    } catch {
      return this.generateDefaultAlocacaoRecursos();
    }
  },

  generateDefaultAlocacaoRecursos(): AlocacaoRecurso[] {
    return [
      { recurso: 'Engenheiros Civis', alocado: 92, capacidade: 8 },
      { recurso: 'Técnicos', alocado: 85, capacidade: 15 },
      { recurso: 'Operadores', alocado: 78, capacidade: 12 },
      { recurso: 'Supervisores', alocado: 95, capacidade: 5 },
      { recurso: 'Auxiliares', alocado: 70, capacidade: 10 },
    ];
  },

  async getAuditoriasRecentes(empresaId: string, limit: number = 4): Promise<AuditoriaRecente[]> {
    try {
      const auditorias = await auditoriaService.getAllAuditorias(empresaId);

      if (auditorias.length === 0) {
        return this.generateDefaultAuditoriasRecentes();
      }

      return auditorias.slice(0, limit).map(a => ({
        id: a.codigo,
        titulo: a.titulo,
        data: a.dataAuditoria.toISOString().split('T')[0],
        conformidade: a.percentualConformidade || 0,
      }));
    } catch {
      return this.generateDefaultAuditoriasRecentes();
    }
  },

  generateDefaultAuditoriasRecentes(): AuditoriaRecente[] {
    return [
      { id: 'AUD-001', titulo: 'Auditoria Estrutural', data: '2024-12-05', conformidade: 95 },
      { id: 'AUD-002', titulo: 'Auditoria de Segurança', data: '2024-12-03', conformidade: 88 },
      { id: 'AUD-003', titulo: 'Auditoria Ambiental', data: '2024-11-28', conformidade: 92 },
      { id: 'AUD-004', titulo: 'Auditoria de Qualidade', data: '2024-11-25', conformidade: 96 },
    ];
  },

  async getAcoesRecentes(empresaId: string, limit: number = 5): Promise<AcaoRecente[]> {
    try {
      const acoes = await acoes5w2hService.getAll(empresaId);

      if (acoes.length === 0) {
        return this.generateDefaultAcoesRecentes();
      }

      return acoes.slice(0, limit).map(a => ({
        id: a.codigo,
        titulo: a.oQue,
        status: a.status,
        prazo: a.quando.toISOString().split('T')[0],
      }));
    } catch {
      return this.generateDefaultAcoesRecentes();
    }
  },

  generateDefaultAcoesRecentes(): AcaoRecente[] {
    return [
      { id: '5W2H-018', titulo: 'Replanejar atividade fundação', status: 'EM_ANDAMENTO', prazo: '2024-12-15' },
      { id: '5W2H-017', titulo: 'Treinar equipe nova', status: 'PENDENTE', prazo: '2024-12-20' },
      { id: '5W2H-016', titulo: 'Revisar cronograma', status: 'ATRASADA', prazo: '2024-12-10' },
      { id: '5W2H-015', titulo: 'Contratar subempreiteiro', status: 'CONCLUIDA', prazo: '2024-12-01' },
      { id: '5W2H-014', titulo: 'Atualizar projeto executivo', status: 'EM_ANDAMENTO', prazo: '2024-12-18' },
    ];
  },
};
