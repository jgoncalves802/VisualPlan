import { supabase } from './supabase';
import { acoes5w2hService } from './acoes5w2hService';
import { restricoesIshikawaService } from './restricoesIshikawaService';
import { gestaoMudancaService } from './gestaoMudancaService';
import { auditoriaService } from './auditoriaService';
import { StatusAcao5W2H, StatusMudanca, StatusRestricaoIshikawa, Acao5W2H, SolicitacaoMudanca, Auditoria, StatusAuditoria } from '../types/gestao';
import { RestricaoIshikawa } from '../types/gestao';

export interface DashboardKPIs {
  percentualPAC: number;
  tempoMedioResolucao: number;
  spi: number;
  cpi: number;
  restricoesImpeditivas: number;
  restricoesTotal: number;
  atividadesAtrasadas: number;
  atividadesTotal: number;
  acoesAbertas: number;
  acoesTotal: number;
  mudancasPendentes: number;
  auditoriasEmAndamento: number;
  conformidadeMedia: number;
}

export interface CurvaSData {
  mes: string;
  planejado: number;
  realizado: number;
}

export interface RestricaoDistribution {
  categoria: string;
  count: number;
  color: string;
}

export interface AtividadeCritica {
  id: string;
  codigo: string;
  nome: string;
  status: string;
  progresso: number;
  dataFim: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'METODO': '#8B5CF6',
  'MAO_DE_OBRA': '#3B82F6',
  'MATERIAL': '#10B981',
  'MAQUINA': '#F59E0B',
  'MEDIDA': '#EC4899',
  'MEIO_AMBIENTE': '#06B6D4',
};

const CATEGORY_LABELS: Record<string, string> = {
  'METODO': 'Método',
  'MAO_DE_OBRA': 'Mão de Obra',
  'MATERIAL': 'Material',
  'MAQUINA': 'Máquina',
  'MEDIDA': 'Medida',
  'MEIO_AMBIENTE': 'Meio Ambiente',
};

export const dashboardService = {
  async getKPIs(empresaId: string, projetoId?: string): Promise<DashboardKPIs> {
    try {
      const [acoes, restricoes, mudancas, auditorias] = await Promise.all([
        acoes5w2hService.getAll(empresaId, projetoId),
        restricoesIshikawaService.getAll(empresaId, projetoId),
        gestaoMudancaService.getAll(empresaId, projetoId),
        auditoriaService.getAllAuditorias(empresaId, projetoId),
      ]);

      const acoesAbertas = acoes.filter((a: Acao5W2H) => 
        a.status !== StatusAcao5W2H.CONCLUIDA && a.status !== StatusAcao5W2H.CANCELADA
      ).length;

      const restricoesImpeditivas = restricoes.filter((r: RestricaoIshikawa) => 
        r.status === StatusRestricaoIshikawa.VENCIDA || 
        r.status === StatusRestricaoIshikawa.ATRASADA
      ).length;

      const mudancasPendentes = mudancas.filter((m: SolicitacaoMudanca) => 
        m.status === StatusMudanca.SUBMETIDA || 
        m.status === StatusMudanca.EM_ANALISE
      ).length;

      const auditoriasEmAndamento = auditorias.filter((a: Auditoria) => 
        a.status !== StatusAuditoria.CONCLUIDA && a.status !== StatusAuditoria.CANCELADA
      ).length;

      const conformidadeMedia = auditorias.length > 0
        ? auditorias.reduce((acc: number, a: Auditoria) => acc + (a.percentualConformidade || 0), 0) / auditorias.length
        : 0;

      let atividadesData = { total: 0, atrasadas: 0, concluidas: 0 };
      try {
        const { data, error } = await supabase
          .from('atividades_cronograma')
          .select('id, data_termino_prevista, data_termino_real, percentual_completo')
          .eq('empresa_id', empresaId);

        if (!error && data) {
          const hoje = new Date();
          atividadesData.total = data.length;
          atividadesData.atrasadas = data.filter(a => {
            const dataTermino = new Date(a.data_termino_prevista);
            return dataTermino < hoje && (a.percentual_completo || 0) < 100;
          }).length;
          atividadesData.concluidas = data.filter(a => (a.percentual_completo || 0) >= 100).length;
        }
      } catch (e) {
        console.warn('Tabela atividades_cronograma não disponível');
      }

      const percentualPAC = atividadesData.total > 0 
        ? (atividadesData.concluidas / atividadesData.total) * 100 
        : 0;

      const restricoesConcluidas = restricoes.filter(r => 
        r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO
      );
      const tempoMedioResolucao = restricoesConcluidas.length > 0
        ? restricoesConcluidas.reduce((acc, r) => {
            if (r.dataConclusao) {
              const dias = Math.ceil((r.dataConclusao.getTime() - r.dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
              return acc + dias;
            }
            return acc;
          }, 0) / restricoesConcluidas.length
        : 0;

      let spi = 1.0;
      let cpi = 1.0;
      try {
        const { data } = await supabase
          .from('atividades_cronograma')
          .select('bcws, bcwp, acwp')
          .eq('empresa_id', empresaId);

        if (data && data.length > 0) {
          const totals = data.reduce((acc, a) => ({
            bcws: acc.bcws + (a.bcws || 0),
            bcwp: acc.bcwp + (a.bcwp || 0),
            acwp: acc.acwp + (a.acwp || 0),
          }), { bcws: 0, bcwp: 0, acwp: 0 });

          if (totals.bcws > 0) spi = totals.bcwp / totals.bcws;
          if (totals.acwp > 0) cpi = totals.bcwp / totals.acwp;
        }
      } catch (e) {
        console.warn('Dados EVM não disponíveis');
      }

      return {
        percentualPAC: Math.round(percentualPAC * 10) / 10,
        tempoMedioResolucao: Math.round(tempoMedioResolucao),
        spi: Math.round(spi * 100) / 100,
        cpi: Math.round(cpi * 100) / 100,
        restricoesImpeditivas,
        restricoesTotal: restricoes.length,
        atividadesAtrasadas: atividadesData.atrasadas,
        atividadesTotal: atividadesData.total,
        acoesAbertas,
        acoesTotal: acoes.length,
        mudancasPendentes,
        auditoriasEmAndamento,
        conformidadeMedia: Math.round(conformidadeMedia * 10) / 10,
      };
    } catch (error) {
      console.error('Erro ao carregar KPIs do dashboard:', error);
      return {
        percentualPAC: 0,
        tempoMedioResolucao: 0,
        spi: 1.0,
        cpi: 1.0,
        restricoesImpeditivas: 0,
        restricoesTotal: 0,
        atividadesAtrasadas: 0,
        atividadesTotal: 0,
        acoesAbertas: 0,
        acoesTotal: 0,
        mudancasPendentes: 0,
        auditoriasEmAndamento: 0,
        conformidadeMedia: 0,
      };
    }
  },

  async getCurvaS(empresaId: string, projetoId?: string): Promise<CurvaSData[]> {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('data_inicio, data_fim, progresso, custo_planejado, duracao_dias')
        .eq('empresa_id', empresaId);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        return [];
      }

      const monthlyData: Record<string, { planejado: number; realizado: number }> = {};
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      data.forEach(activity => {
        if (activity.data_inicio) {
          const date = new Date(activity.data_inicio);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { planejado: 0, realizado: 0 };
          }
          
          const valorAtividade = (activity.custo_planejado && activity.custo_planejado > 0) 
            ? activity.custo_planejado
            : (activity.duracao_dias || 1);
          
          monthlyData[monthKey].planejado += valorAtividade;
          monthlyData[monthKey].realizado += valorAtividade * ((activity.progresso || 0) / 100);
        }
      });

      const sortedKeys = Object.keys(monthlyData).sort();
      let accPlanejado = 0;
      let accRealizado = 0;

      const totalPlanejado = Object.values(monthlyData).reduce((sum, m) => sum + m.planejado, 0);

      return sortedKeys.map(key => {
        const month = key.split('-')[1];
        accPlanejado += monthlyData[key].planejado;
        accRealizado += monthlyData[key].realizado;
        
        const planejadoPercent = totalPlanejado > 0 ? (accPlanejado / totalPlanejado) * 100 : 0;
        const realizadoPercent = totalPlanejado > 0 ? (accRealizado / totalPlanejado) * 100 : 0;
        
        return {
          mes: monthNames[parseInt(month) - 1],
          planejado: Math.round(planejadoPercent),
          realizado: Math.round(realizadoPercent),
        };
      });
    } catch (e) {
      console.warn('Erro ao calcular Curva S:', e);
      return [];
    }
  },

  async getRestricoesPorCategoria(empresaId: string, projetoId?: string): Promise<RestricaoDistribution[]> {
    try {
      const restricoes = await restricoesIshikawaService.getAll(empresaId, projetoId);
      
      if (restricoes.length === 0) {
        return [];
      }

      const countByCategory = restricoes.reduce((acc, r) => {
        const cat = r.categoria?.toUpperCase() || 'OUTROS';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(countByCategory).map(([categoria, count]) => ({
        categoria: CATEGORY_LABELS[categoria] || categoria,
        count,
        color: CATEGORY_COLORS[categoria] || '#6B7280',
      }));
    } catch (e) {
      console.warn('Erro ao buscar restrições por categoria:', e);
      return [];
    }
  },

  async getAtividadesCriticas(empresaId: string, projetoId?: string): Promise<AtividadeCritica[]> {
    try {
      let query = supabase
        .from('atividades_cronograma')
        .select('id, codigo, nome, status, progresso, data_fim, e_critica')
        .eq('empresa_id', empresaId)
        .eq('e_critica', true)
        .order('data_fim', { ascending: true })
        .limit(10);

      if (projetoId) {
        query = query.eq('projeto_id', projetoId);
      }

      const { data, error } = await query;

      if (error || !data) {
        return [];
      }

      return data.map(a => ({
        id: a.id,
        codigo: a.codigo || '-',
        nome: a.nome || 'Sem nome',
        status: a.status || 'EM_ANDAMENTO',
        progresso: a.progresso || 0,
        dataFim: a.data_fim || '',
      }));
    } catch (e) {
      console.warn('Erro ao buscar atividades críticas:', e);
      return [];
    }
  },
};
