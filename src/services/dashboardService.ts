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
  async getKPIs(empresaId: string): Promise<DashboardKPIs> {
    try {
      const [acoes, restricoes, mudancas, auditorias] = await Promise.all([
        acoes5w2hService.getAll(empresaId),
        restricoesIshikawaService.getAll(empresaId),
        gestaoMudancaService.getAll(empresaId),
        auditoriaService.getAllAuditorias(empresaId),
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

  async getCurvaS(empresaId: string): Promise<CurvaSData[]> {
    try {
      const { data, error } = await supabase
        .from('curva_s')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('data', { ascending: true });

      if (error || !data || data.length === 0) {
        return generateMockCurvaS();
      }

      return data.map(row => ({
        mes: row.mes,
        planejado: row.planejado,
        realizado: row.realizado,
      }));
    } catch (e) {
      return generateMockCurvaS();
    }
  },

  async getRestricoesPorCategoria(empresaId: string): Promise<RestricaoDistribution[]> {
    try {
      const restricoes = await restricoesIshikawaService.getAll(empresaId);
      
      if (restricoes.length === 0) {
        return generateMockRestricoesPorCategoria();
      }

      const countByCategory = restricoes.reduce((acc, r) => {
        acc[r.categoria] = (acc[r.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(countByCategory).map(([categoria, count]) => ({
        categoria: CATEGORY_LABELS[categoria] || categoria,
        count,
        color: CATEGORY_COLORS[categoria] || '#6B7280',
      }));
    } catch (e) {
      return generateMockRestricoesPorCategoria();
    }
  },
};

function generateMockCurvaS(): CurvaSData[] {
  return [
    { mes: 'Jan', planejado: 10, realizado: 12 },
    { mes: 'Fev', planejado: 25, realizado: 23 },
    { mes: 'Mar', planejado: 42, realizado: 40 },
    { mes: 'Abr', planejado: 58, realizado: 55 },
    { mes: 'Mai', planejado: 73, realizado: 68 },
    { mes: 'Jun', planejado: 85, realizado: 78 },
    { mes: 'Jul', planejado: 100, realizado: 85 },
  ];
}

function generateMockRestricoesPorCategoria(): RestricaoDistribution[] {
  return [
    { categoria: 'Material', count: 15, color: '#10B981' },
    { categoria: 'Mão de Obra', count: 8, color: '#3B82F6' },
    { categoria: 'Máquina', count: 5, color: '#F59E0B' },
    { categoria: 'Método', count: 12, color: '#8B5CF6' },
    { categoria: 'Meio Ambiente', count: 3, color: '#06B6D4' },
  ];
}
