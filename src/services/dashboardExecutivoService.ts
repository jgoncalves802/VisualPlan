import { supabase } from './supabaseClient';
import { acoes5w2hService } from './acoes5w2hService';
import { restricoesIshikawaService } from './restricoesIshikawaService';
import { gestaoMudancaService } from './gestaoMudancaService';
import { auditoriaService } from './auditoriaService';
import { takeoffService } from './takeoffService';
import { restricoesLpsService } from './restricoesLpsService';
import { portfolioService } from './portfolioService';
import { StatusAcao5W2H, StatusMudanca, StatusRestricaoIshikawa, StatusAuditoria, Acao5W2H } from '../types/gestao';
import { RestricaoLPS } from '../types/lps';

export interface DashboardExecutivoKPIs {
  spi: number;
  cpi: number;
  avancoFisico: number;
  avancoFinanceiro: number;
  atividadesTotal: number;
  atividadesConcluidas: number;
  atividadesAtrasadas: number;
  atividadesCriticas: number;
  ppc: number;
  tmr: number;
  restricoesAtivas: number;
  restricoesImpeditivas: number;
  restricoesPorCategoria: RestricaoCategoria[];
  medicaoAtual: MedicaoResumo | null;
  takeoffAvancoGeral: number;
  takeoffPorDisciplina: DisciplinaAvancoItem[];
  acoesAbertas: number;
  acoesVencidas: number;
  acoesTotal: number;
  mudancasPendentes: number;
  mudancasTotal: number;
  auditoriasEmAndamento: number;
  conformidadeMedia: number;
  recursosAlocados: number;
  recursosCapacidade: number;
  portfolioScore: number;
}

export interface RestricaoCategoria {
  categoria: string;
  label: string;
  count: number;
  color: string;
}

export interface MedicaoResumo {
  periodoNumero: number;
  dataInicio: string;
  dataFim: string;
  avancoAcumulado: number;
  statusAprovacao: string;
}

export interface DisciplinaAvancoItem {
  disciplina: string;
  avanco: number;
  meta: number;
  color: string;
}

export interface CurvaSItem {
  periodo: string;
  planejado: number;
  realizado: number;
  baseline?: number;
}

export interface AtividadeCritica {
  id: string;
  codigo: string;
  nome: string;
  dataTermino: string;
  percentual: number;
  atraso: number;
  responsavel: string;
}

export interface Marco {
  id: string;
  nome: string;
  data: string;
  status: 'concluido' | 'em_dia' | 'atrasado' | 'pendente';
}

export interface PPCHistorico {
  semana: string;
  ppc: number;
  meta: number;
}

export interface Acao5W2HResumo {
  id: string;
  titulo: string;
  responsavel: string;
  prazo: string;
  status: string;
  prioridade: string;
}

export interface AuditoriaResumo {
  id: string;
  titulo: string;
  data: string;
  conformidade: number;
  status: string;
}

export interface RecursoAlocacao {
  nome: string;
  tipo: string;
  alocado: number;
  capacidade: number;
}

export interface ProjetoRanking {
  id: string;
  nome: string;
  score: number;
  prioridade: number;
  spi: number;
  cpi: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'METODO': '#6B7280',
  'MAO_DE_OBRA': '#4B5563',
  'MATERIAL': '#374151',
  'MAQUINA': '#9CA3AF',
  'MEDIDA': '#D1D5DB',
  'MEIO_AMBIENTE': '#1F2937',
};

const CATEGORY_LABELS: Record<string, string> = {
  'METODO': 'Método',
  'MAO_DE_OBRA': 'Mão de Obra',
  'MATERIAL': 'Material',
  'MAQUINA': 'Máquina',
  'MEDIDA': 'Medida',
  'MEIO_AMBIENTE': 'Meio Ambiente',
};

const DISCIPLINA_COLORS: Record<string, string> = {
  'Tubulação': '#3B82F6',
  'Elétrica': '#F59E0B',
  'Caldeiraria': '#EF4444',
  'Suporte': '#8B5CF6',
  'Estrutura': '#10B981',
  'Equipamentos': '#06B6D4',
};

export const dashboardExecutivoService = {
  async getKPIs(empresaId: string, projetoId?: string, wbsId?: string): Promise<DashboardExecutivoKPIs> {
    try {
      const [
        cronogramaData,
        restricoesIshikawa,
        restricoesLps,
        acoes,
        mudancas,
        auditorias,
        takeoffData,
        medicaoData,
      ] = await Promise.all([
        this.getCronogramaMetrics(empresaId, projetoId, wbsId),
        restricoesIshikawaService.getAll(empresaId, projetoId),
        this.getRestricaoLpsMetrics(empresaId, projetoId),
        acoes5w2hService.getAll(empresaId, projetoId),
        gestaoMudancaService.getAll(empresaId, projetoId),
        auditoriaService.getAllAuditorias(empresaId),
        this.getTakeoffMetrics(empresaId, projetoId),
        this.getMedicaoAtual(empresaId, projetoId),
      ]);

      const restricoesAtivas = restricoesIshikawa.filter(r => 
        r.status !== StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO
      );

      const restricoesImpeditivas = restricoesIshikawa.filter(r => 
        r.status === StatusRestricaoIshikawa.VENCIDA || 
        r.status === StatusRestricaoIshikawa.ATRASADA
      ).length;

      const restricoesPorCategoria = this.agruparRestricoesPorCategoria(restricoesIshikawa);

      const acoesAbertas = acoes.filter((a: Acao5W2H) => 
        a.status !== StatusAcao5W2H.CONCLUIDA && a.status !== StatusAcao5W2H.CANCELADA
      ).length;

      const acoesVencidas = acoes.filter((a: Acao5W2H) => {
        if (a.status === StatusAcao5W2H.CONCLUIDA || a.status === StatusAcao5W2H.CANCELADA) return false;
        const prazo = new Date(a.quando);
        return prazo < new Date();
      }).length;

      const mudancasPendentes = mudancas.filter(m => 
        m.status === StatusMudanca.SUBMETIDA || m.status === StatusMudanca.EM_ANALISE
      ).length;

      const auditoriasEmAndamento = auditorias.filter(a => 
        a.status !== StatusAuditoria.CONCLUIDA && a.status !== StatusAuditoria.CANCELADA
      ).length;

      const conformidadeMedia = auditorias.length > 0
        ? auditorias.reduce((acc, a) => acc + (a.percentualConformidade || 0), 0) / auditorias.length
        : 0;

      return {
        spi: cronogramaData.spi,
        cpi: cronogramaData.cpi,
        avancoFisico: cronogramaData.avancoFisico,
        avancoFinanceiro: cronogramaData.avancoFinanceiro,
        atividadesTotal: cronogramaData.total,
        atividadesConcluidas: cronogramaData.concluidas,
        atividadesAtrasadas: cronogramaData.atrasadas,
        atividadesCriticas: cronogramaData.criticas,
        ppc: restricoesLps.ppc,
        tmr: restricoesLps.tmr,
        restricoesAtivas: restricoesAtivas.length,
        restricoesImpeditivas,
        restricoesPorCategoria,
        medicaoAtual: medicaoData,
        takeoffAvancoGeral: takeoffData.avancoGeral,
        takeoffPorDisciplina: takeoffData.porDisciplina,
        acoesAbertas,
        acoesVencidas,
        acoesTotal: acoes.length,
        mudancasPendentes,
        mudancasTotal: mudancas.length,
        auditoriasEmAndamento,
        conformidadeMedia: Math.round(conformidadeMedia * 10) / 10,
        recursosAlocados: 0,
        recursosCapacidade: 0,
        portfolioScore: 0,
      };
    } catch (error) {
      console.error('Erro ao carregar KPIs do dashboard executivo:', error);
      return this.getDefaultKPIs();
    }
  },

  async getCronogramaMetrics(empresaId: string, projetoId?: string, wbsId?: string) {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('id, data_termino_prevista, data_termino_real, percentual_completo, bcws, bcwp, acwp, is_critical, custo_previsto, custo_real')
        .eq('empresa_id', empresaId);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      
      if (wbsId) {
        query = query.eq('wbs_id', wbsId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return { spi: 1, cpi: 1, avancoFisico: 0, avancoFinanceiro: 0, total: 0, concluidas: 0, atrasadas: 0, criticas: 0 };
      }

      const hoje = new Date();
      const total = data.length;
      const concluidas = data.filter(a => (a.percentual_completo || 0) >= 100).length;
      const atrasadas = data.filter(a => {
        const dataTermino = new Date(a.data_termino_prevista);
        return dataTermino < hoje && (a.percentual_completo || 0) < 100;
      }).length;
      const criticas = data.filter(a => a.is_critical).length;

      const totals = data.reduce((acc, a) => ({
        bcws: acc.bcws + (a.bcws || 0),
        bcwp: acc.bcwp + (a.bcwp || 0),
        acwp: acc.acwp + (a.acwp || 0),
        custoPrevisto: acc.custoPrevisto + (a.custo_previsto || 0),
        custoReal: acc.custoReal + (a.custo_real || 0),
        percentualTotal: acc.percentualTotal + (a.percentual_completo || 0),
      }), { bcws: 0, bcwp: 0, acwp: 0, custoPrevisto: 0, custoReal: 0, percentualTotal: 0 });

      const spi = totals.bcws > 0 ? totals.bcwp / totals.bcws : 1;
      const cpi = totals.acwp > 0 ? totals.bcwp / totals.acwp : 1;
      const avancoFisico = total > 0 ? totals.percentualTotal / total : 0;
      const avancoFinanceiro = totals.custoPrevisto > 0 ? (totals.custoReal / totals.custoPrevisto) * 100 : 0;

      return {
        spi: Math.round(spi * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
        avancoFisico: Math.round(avancoFisico * 10) / 10,
        avancoFinanceiro: Math.round(avancoFinanceiro * 10) / 10,
        total,
        concluidas,
        atrasadas,
        criticas,
      };
    } catch (e) {
      console.warn('Erro ao buscar métricas do cronograma:', e);
      return { spi: 1, cpi: 1, avancoFisico: 0, avancoFinanceiro: 0, total: 0, concluidas: 0, atrasadas: 0, criticas: 0 };
    }
  },

  async getRestricaoLpsMetrics(empresaId: string, projetoId?: string) {
    try {
      const restricoes = await restricoesLpsService.getAll(empresaId, projetoId);
      
      const concluidas = restricoes.filter((r: RestricaoLPS) => r.status === 'CONCLUIDA');
      const ppc = restricoes.length > 0 ? (concluidas.length / restricoes.length) * 100 : 0;

      let tmr = 0;
      if (concluidas.length > 0) {
        const tempoTotal = concluidas.reduce((acc: number, r: RestricaoLPS) => {
          if (r.data_conclusao_planejada && r.data_conclusao) {
            const dias = Math.ceil(
              (new Date(r.data_conclusao).getTime() - new Date(r.data_conclusao_planejada).getTime()) / (1000 * 60 * 60 * 24)
            );
            return acc + Math.abs(dias);
          }
          return acc;
        }, 0);
        tmr = tempoTotal / concluidas.length;
      }

      return { ppc: Math.round(ppc * 10) / 10, tmr: Math.round(tmr * 10) / 10 };
    } catch (e) {
      console.warn('Erro ao buscar métricas LPS:', e);
      return { ppc: 0, tmr: 0 };
    }
  },

  async getTakeoffMetrics(empresaId: string, projetoId?: string) {
    try {
      const filter = { empresaId, projetoId };
      const totais = await takeoffService.getTotais(filter);
      
      const avancoGeral = totais.percentualMedio || 0;
      
      const disciplinas = await takeoffService.getDisciplinas(empresaId);
      const porDisciplina: DisciplinaAvancoItem[] = disciplinas.map(d => ({
        disciplina: d.nome,
        avanco: 0,
        meta: 100,
        color: DISCIPLINA_COLORS[d.nome] || '#6B7280',
      }));

      return { avancoGeral, porDisciplina };
    } catch (e) {
      console.warn('Erro ao buscar métricas Take-off:', e);
      return { avancoGeral: 0, porDisciplina: [] };
    }
  },

  async getMedicaoAtual(empresaId: string, projetoId?: string): Promise<MedicaoResumo | null> {
    try {
      let query = supabase
        .from('medicoes_periodos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('numero_periodo', { ascending: false })
        .limit(1);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          return null;
        }
        console.warn('Erro ao buscar medição atual:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const periodo = data[0];
      return {
        periodoNumero: periodo.numero_periodo,
        dataInicio: periodo.data_inicio,
        dataFim: periodo.data_fim,
        avancoAcumulado: periodo.percentual_acumulado || 0,
        statusAprovacao: periodo.status_aprovacao || 'pendente',
      };
    } catch (e) {
      console.warn('Erro ao buscar medição atual:', e);
      return null;
    }
  },

  agruparRestricoesPorCategoria(restricoes: any[]): RestricaoCategoria[] {
    const countByCategory = restricoes.reduce((acc, r) => {
      const cat = r.categoria || 'OUTRO';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(countByCategory).map(([categoria, count]) => ({
      categoria,
      label: CATEGORY_LABELS[categoria] || categoria,
      count: count as number,
      color: CATEGORY_COLORS[categoria] || '#6B7280',
    }));
  },

  async getCurvaS(empresaId: string, projetoId?: string, wbsId?: string): Promise<CurvaSItem[]> {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('data_inicio_prevista, data_termino_prevista, percentual_completo, custo_previsto')
        .eq('empresa_id', empresaId);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      
      if (wbsId) {
        query = query.eq('wbs_id', wbsId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return this.getMockCurvaS();
      }

      const atividadesPorMes: Record<string, { planejado: number; realizado: number; total: number }> = {};

      data.forEach(a => {
        if (!a.data_inicio_prevista) return;
        const mes = a.data_inicio_prevista.substring(0, 7);
        if (!atividadesPorMes[mes]) {
          atividadesPorMes[mes] = { planejado: 0, realizado: 0, total: 0 };
        }
        atividadesPorMes[mes].total += 1;
        atividadesPorMes[mes].planejado += 100;
        atividadesPorMes[mes].realizado += (a.percentual_completo || 0);
      });

      const meses = Object.keys(atividadesPorMes).sort();
      let acumuladoPlanejado = 0;
      let acumuladoRealizado = 0;
      const totalGeral = Object.values(atividadesPorMes).reduce((acc, m) => acc + m.planejado, 0);

      return meses.map(mes => {
        acumuladoPlanejado += atividadesPorMes[mes].planejado;
        acumuladoRealizado += atividadesPorMes[mes].realizado;
        return {
          periodo: new Date(mes + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          planejado: totalGeral > 0 ? Math.round((acumuladoPlanejado / totalGeral) * 100) : 0,
          realizado: totalGeral > 0 ? Math.round((acumuladoRealizado / totalGeral) * 100) : 0,
        };
      });
    } catch (e) {
      console.warn('Erro ao gerar Curva S:', e);
      return this.getMockCurvaS();
    }
  },

  async getAtividadesCriticas(empresaId: string, projetoId?: string, wbsId?: string, limit = 10): Promise<AtividadeCritica[]> {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('id, codigo, nome, data_termino_prevista, data_termino_real, percentual_completo, responsavel_id')
        .eq('empresa_id', empresaId)
        .eq('is_critical', true)
        .order('data_termino_prevista', { ascending: true })
        .limit(limit);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      
      if (wbsId) {
        query = query.eq('wbs_id', wbsId);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      const hoje = new Date();
      return data.map(a => {
        const dataTermino = new Date(a.data_termino_prevista);
        const atraso = a.percentual_completo < 100 && dataTermino < hoje
          ? Math.ceil((hoje.getTime() - dataTermino.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return {
          id: a.id,
          codigo: a.codigo || '',
          nome: a.nome || '',
          dataTermino: a.data_termino_prevista,
          percentual: a.percentual_completo || 0,
          atraso,
          responsavel: a.responsavel_id || '-',
        };
      });
    } catch (e) {
      console.warn('Erro ao buscar atividades críticas:', e);
      return [];
    }
  },

  async getMarcos(empresaId: string, projetoId?: string, wbsId?: string): Promise<Marco[]> {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('id, nome, data_termino_prevista, data_termino_real, percentual_completo')
        .eq('empresa_id', empresaId)
        .eq('is_milestone', true)
        .order('data_termino_prevista', { ascending: true });

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }
      
      if (wbsId) {
        query = query.eq('wbs_id', wbsId);
      }

      const { data, error } = await query;

      if (error || !data) return [];

      const hoje = new Date();
      return data.map(m => {
        const dataTermino = new Date(m.data_termino_prevista);
        let status: Marco['status'] = 'pendente';
        
        if ((m.percentual_completo || 0) >= 100) {
          status = 'concluido';
        } else if (dataTermino < hoje) {
          status = 'atrasado';
        } else if (dataTermino <= new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          status = 'em_dia';
        }

        return {
          id: m.id,
          nome: m.nome || '',
          data: m.data_termino_prevista,
          status,
        };
      });
    } catch (e) {
      console.warn('Erro ao buscar marcos:', e);
      return [];
    }
  },

  async getPPCHistorico(empresaId: string, projetoId?: string, semanas = 8): Promise<PPCHistorico[]> {
    try {
      let query = supabase
        .from('ppc_historico')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data_referencia', { ascending: false })
        .limit(semanas);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          return this.getMockPPCHistorico();
        }
        return this.getMockPPCHistorico();
      }

      if (!data || data.length === 0) {
        return this.getMockPPCHistorico();
      }

      return data.reverse().map(d => ({
        semana: `S${d.semana}`,
        ppc: d.ppc || 0,
        meta: 80,
      }));
    } catch (e) {
      return this.getMockPPCHistorico();
    }
  },

  async getAcoesRecentes(empresaId: string, _projetoId?: string, limit = 5): Promise<Acao5W2HResumo[]> {
    try {
      const acoes = await acoes5w2hService.getAll(empresaId);
      
      const filtradas = acoes.filter((a: Acao5W2H) => 
        a.status !== StatusAcao5W2H.CONCLUIDA && a.status !== StatusAcao5W2H.CANCELADA
      );

      const ordenadas = filtradas
        .sort((a: Acao5W2H, b: Acao5W2H) => new Date(a.quando).getTime() - new Date(b.quando).getTime())
        .slice(0, limit);

      return ordenadas.map((a: Acao5W2H) => ({
        id: a.id,
        titulo: a.oQue || '',
        responsavel: a.quem || '-',
        prazo: a.quando instanceof Date ? a.quando.toISOString() : String(a.quando),
        status: a.status,
        prioridade: a.prioridade || 'MEDIA',
      }));
    } catch (e) {
      console.warn('Erro ao buscar ações recentes:', e);
      return [];
    }
  },

  async getAuditoriasRecentes(empresaId: string, projetoId?: string, limit = 5): Promise<AuditoriaResumo[]> {
    try {
      const auditorias = await auditoriaService.getAllAuditorias(empresaId);
      
      let filtradas = auditorias;
      if (projetoId) {
        filtradas = auditorias.filter(a => a.projetoId === projetoId);
      }
      
      const recentes = filtradas
        .sort((a, b) => new Date(b.dataAuditoria).getTime() - new Date(a.dataAuditoria).getTime())
        .slice(0, limit);

      return recentes.map(a => ({
        id: a.id,
        titulo: a.titulo,
        data: a.dataAuditoria instanceof Date ? a.dataAuditoria.toISOString() : a.dataAuditoria,
        conformidade: a.percentualConformidade || 0,
        status: a.status,
      }));
    } catch (e) {
      console.warn('Erro ao buscar auditorias recentes:', e);
      return [];
    }
  },

  async getPortfolioRanking(empresaId: string, projetoId?: string, limit = 5): Promise<ProjetoRanking[]> {
    try {
      const projetos = await portfolioService.getProjetos(empresaId);
      
      let filtrados = projetos;
      if (projetoId) {
        filtrados = projetos.filter(p => p.id === projetoId);
      }
      
      return filtrados
        .sort((a, b) => (b.scoreTotal || 0) - (a.scoreTotal || 0))
        .slice(0, limit)
        .map((p, index) => ({
          id: p.id,
          nome: p.nome,
          score: p.scoreTotal || 0,
          prioridade: index + 1,
          spi: 1,
          cpi: 1,
        }));
    } catch (e) {
      console.warn('Erro ao buscar ranking de portfolio:', e);
      return [];
    }
  },

  getMockCurvaS(): CurvaSItem[] {
    return [
      { periodo: 'jan/24', planejado: 10, realizado: 12 },
      { periodo: 'fev/24', planejado: 25, realizado: 23 },
      { periodo: 'mar/24', planejado: 42, realizado: 40 },
      { periodo: 'abr/24', planejado: 58, realizado: 55 },
      { periodo: 'mai/24', planejado: 73, realizado: 68 },
      { periodo: 'jun/24', planejado: 85, realizado: 78 },
      { periodo: 'jul/24', planejado: 100, realizado: 85 },
    ];
  },

  getMockPPCHistorico(): PPCHistorico[] {
    return [
      { semana: 'S1', ppc: 72, meta: 80 },
      { semana: 'S2', ppc: 78, meta: 80 },
      { semana: 'S3', ppc: 85, meta: 80 },
      { semana: 'S4', ppc: 82, meta: 80 },
      { semana: 'S5', ppc: 79, meta: 80 },
      { semana: 'S6', ppc: 88, meta: 80 },
      { semana: 'S7', ppc: 75, meta: 80 },
      { semana: 'S8', ppc: 83, meta: 80 },
    ];
  },

  getDefaultKPIs(): DashboardExecutivoKPIs {
    return {
      spi: 1,
      cpi: 1,
      avancoFisico: 0,
      avancoFinanceiro: 0,
      atividadesTotal: 0,
      atividadesConcluidas: 0,
      atividadesAtrasadas: 0,
      atividadesCriticas: 0,
      ppc: 0,
      tmr: 0,
      restricoesAtivas: 0,
      restricoesImpeditivas: 0,
      restricoesPorCategoria: [],
      medicaoAtual: null,
      takeoffAvancoGeral: 0,
      takeoffPorDisciplina: [],
      acoesAbertas: 0,
      acoesVencidas: 0,
      acoesTotal: 0,
      mudancasPendentes: 0,
      mudancasTotal: 0,
      auditoriasEmAndamento: 0,
      conformidadeMedia: 0,
      recursosAlocados: 0,
      recursosCapacidade: 0,
      portfolioScore: 0,
    };
  },
};
