import { supabase } from './supabaseClient';
import {
  SolicitacaoMudanca,
  StatusMudanca,
  TipoMudanca,
  ImpactoMudanca,
  PrioridadeAcao,
  AprovadorMudanca,
  HistoricoMudanca,
} from '../types/gestao';

interface SolicitacaoMudancaDB {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  justificativa: string | null;
  tipo_mudanca: string;
  prioridade: string;
  solicitante: string;
  solicitante_id: string | null;
  data_solicitacao: string;
  status: string;
  projeto_id: string;
  projeto_nome: string | null;
  impacto_cronograma: number | null;
  impacto_custo: number | null;
  impacto_qualidade: string | null;
  impacto_risco: string | null;
  recursos_necessarios: string | null;
  riscos: string[] | null;
  impacto_estimado: string;
  baseline_afetada: string | null;
  atividades_novas: number | null;
  atividades_removidas: number | null;
  aprovadores: AprovadorMudanca[] | null;
  aprovador: string | null;
  aprovador_id: string | null;
  data_aprovacao: string | null;
  observacoes_aprovacao: string | null;
  anexos: string[] | null;
  historico: HistoricoMudanca[] | null;
  acoes_5w2h: string[] | null;
  empresa_id: string;
  created_by: string | null;
}

const mapFromDB = (data: SolicitacaoMudancaDB): SolicitacaoMudanca => ({
  id: data.id,
  codigo: data.codigo,
  titulo: data.titulo,
  descricao: data.descricao,
  justificativa: data.justificativa || undefined,
  tipoMudanca: data.tipo_mudanca as TipoMudanca,
  prioridade: data.prioridade as PrioridadeAcao,
  solicitante: data.solicitante,
  solicitanteId: data.solicitante_id || undefined,
  dataSolicitacao: new Date(data.data_solicitacao),
  status: data.status as StatusMudanca,
  projetoId: data.projeto_id,
  projetoNome: data.projeto_nome || undefined,
  impactoCronograma: data.impacto_cronograma || undefined,
  impactoCusto: data.impacto_custo || undefined,
  impactoQualidade: data.impacto_qualidade || undefined,
  impactoRisco: data.impacto_risco || undefined,
  recursosNecessarios: data.recursos_necessarios || undefined,
  riscos: data.riscos || undefined,
  impactoEstimado: data.impacto_estimado as ImpactoMudanca,
  baselineAfetada: data.baseline_afetada || undefined,
  atividadesNovas: data.atividades_novas || undefined,
  atividadesRemovidas: data.atividades_removidas || undefined,
  aprovadores: data.aprovadores || undefined,
  aprovador: data.aprovador || undefined,
  aprovadorId: data.aprovador_id || undefined,
  dataAprovacao: data.data_aprovacao ? new Date(data.data_aprovacao) : undefined,
  observacoesAprovacao: data.observacoes_aprovacao || undefined,
  anexos: data.anexos || undefined,
  historico: data.historico || undefined,
  acoes5w2h: data.acoes_5w2h || undefined,
});

const mapToDB = (solicitacao: Partial<SolicitacaoMudanca> & { empresaId: string; createdBy?: string }) => ({
  codigo: solicitacao.codigo,
  titulo: solicitacao.titulo,
  descricao: solicitacao.descricao,
  justificativa: solicitacao.justificativa || null,
  tipo_mudanca: solicitacao.tipoMudanca,
  prioridade: solicitacao.prioridade,
  solicitante: solicitacao.solicitante,
  solicitante_id: solicitacao.solicitanteId || null,
  data_solicitacao: solicitacao.dataSolicitacao instanceof Date ? solicitacao.dataSolicitacao.toISOString() : solicitacao.dataSolicitacao,
  status: solicitacao.status,
  projeto_id: solicitacao.projetoId,
  projeto_nome: solicitacao.projetoNome || null,
  impacto_cronograma: solicitacao.impactoCronograma || null,
  impacto_custo: solicitacao.impactoCusto || null,
  impacto_qualidade: solicitacao.impactoQualidade || null,
  impacto_risco: solicitacao.impactoRisco || null,
  recursos_necessarios: solicitacao.recursosNecessarios || null,
  riscos: solicitacao.riscos || null,
  impacto_estimado: solicitacao.impactoEstimado,
  baseline_afetada: solicitacao.baselineAfetada || null,
  atividades_novas: solicitacao.atividadesNovas || null,
  atividades_removidas: solicitacao.atividadesRemovidas || null,
  aprovadores: solicitacao.aprovadores || null,
  aprovador: solicitacao.aprovador || null,
  aprovador_id: solicitacao.aprovadorId || null,
  data_aprovacao: solicitacao.dataAprovacao instanceof Date ? solicitacao.dataAprovacao.toISOString() : solicitacao.dataAprovacao || null,
  observacoes_aprovacao: solicitacao.observacoesAprovacao || null,
  anexos: solicitacao.anexos || null,
  historico: solicitacao.historico || null,
  acoes_5w2h: solicitacao.acoes5w2h || null,
  empresa_id: solicitacao.empresaId,
  created_by: solicitacao.createdBy || null,
});

export const gestaoMudancaService = {
  async getAll(empresaId: string, projetoId?: string): Promise<SolicitacaoMudanca[]> {
    let query = supabase
      .from('solicitacoes_mudanca')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_solicitacao', { ascending: false });

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela solicitacoes_mudanca não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar solicitações de mudança:', error);
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<SolicitacaoMudanca | null> {
    const { data, error } = await supabase
      .from('solicitacoes_mudanca')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar solicitação de mudança:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async create(solicitacao: Omit<SolicitacaoMudanca, 'id'> & { empresaId: string; createdBy?: string }): Promise<SolicitacaoMudanca | null> {
    const dbData = mapToDB(solicitacao);

    const { data, error } = await supabase
      .from('solicitacoes_mudanca')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar solicitação de mudança:', error);
      throw error;
    }

    return mapFromDB(data);
  },

  async update(id: string, solicitacao: Partial<SolicitacaoMudanca>): Promise<SolicitacaoMudanca | null> {
    const updateData: Record<string, unknown> = {};
    
    if (solicitacao.titulo !== undefined) updateData.titulo = solicitacao.titulo;
    if (solicitacao.descricao !== undefined) updateData.descricao = solicitacao.descricao;
    if (solicitacao.justificativa !== undefined) updateData.justificativa = solicitacao.justificativa;
    if (solicitacao.tipoMudanca !== undefined) updateData.tipo_mudanca = solicitacao.tipoMudanca;
    if (solicitacao.prioridade !== undefined) updateData.prioridade = solicitacao.prioridade;
    if (solicitacao.status !== undefined) updateData.status = solicitacao.status;
    if (solicitacao.impactoCronograma !== undefined) updateData.impacto_cronograma = solicitacao.impactoCronograma;
    if (solicitacao.impactoCusto !== undefined) updateData.impacto_custo = solicitacao.impactoCusto;
    if (solicitacao.impactoQualidade !== undefined) updateData.impacto_qualidade = solicitacao.impactoQualidade;
    if (solicitacao.impactoRisco !== undefined) updateData.impacto_risco = solicitacao.impactoRisco;
    if (solicitacao.recursosNecessarios !== undefined) updateData.recursos_necessarios = solicitacao.recursosNecessarios;
    if (solicitacao.riscos !== undefined) updateData.riscos = solicitacao.riscos;
    if (solicitacao.impactoEstimado !== undefined) updateData.impacto_estimado = solicitacao.impactoEstimado;
    if (solicitacao.aprovadores !== undefined) updateData.aprovadores = solicitacao.aprovadores;
    if (solicitacao.aprovador !== undefined) updateData.aprovador = solicitacao.aprovador;
    if (solicitacao.aprovadorId !== undefined) updateData.aprovador_id = solicitacao.aprovadorId;
    if (solicitacao.dataAprovacao !== undefined) updateData.data_aprovacao = solicitacao.dataAprovacao instanceof Date ? solicitacao.dataAprovacao.toISOString() : solicitacao.dataAprovacao;
    if (solicitacao.observacoesAprovacao !== undefined) updateData.observacoes_aprovacao = solicitacao.observacoesAprovacao;
    if (solicitacao.anexos !== undefined) updateData.anexos = solicitacao.anexos;
    if (solicitacao.historico !== undefined) updateData.historico = solicitacao.historico;
    if (solicitacao.acoes5w2h !== undefined) updateData.acoes_5w2h = solicitacao.acoes5w2h;

    const { data, error } = await supabase
      .from('solicitacoes_mudanca')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar solicitação de mudança:', error);
      throw error;
    }

    return mapFromDB(data);
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('solicitacoes_mudanca')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir solicitação de mudança:', error);
      throw error;
    }

    return true;
  },

  async generateNextCodigo(empresaId: string): Promise<string> {
    const { data, error } = await supabase
      .from('solicitacoes_mudanca')
      .select('codigo')
      .eq('empresa_id', empresaId)
      .order('codigo', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'SM-001';
    }

    const lastCodigo = data[0].codigo;
    const match = lastCodigo.match(/SM-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `SM-${nextNum.toString().padStart(3, '0')}`;
    }

    return 'SM-001';
  },

  async getByStatus(empresaId: string, status: StatusMudanca): Promise<SolicitacaoMudanca[]> {
    const { data, error } = await supabase
      .from('solicitacoes_mudanca')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', status)
      .order('data_solicitacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        return [];
      }
      console.error('Erro ao buscar solicitações por status:', error);
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async addHistorico(id: string, entry: HistoricoMudanca): Promise<SolicitacaoMudanca | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const updatedHistorico = [...(current.historico || []), entry];
    return this.update(id, { historico: updatedHistorico });
  },
};
