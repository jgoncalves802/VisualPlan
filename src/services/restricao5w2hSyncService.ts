import { supabase } from './supabaseClient';
import { RestricaoLPS } from '../types/lps';
import { Acao5W2H, StatusAcao5W2H, PrioridadeAcao, OrigemAcao } from '../types/gestao';
import { acoes5w2hService } from './acoes5w2hService';
import { restricoesLpsService } from './restricoesLpsService';

const mapRestricaoStatusTo5W2H = (status: RestricaoLPS['status']): StatusAcao5W2H => {
  switch (status) {
    case 'PENDENTE': return StatusAcao5W2H.PENDENTE;
    case 'CONCLUIDA': return StatusAcao5W2H.CONCLUIDA;
    case 'ATRASADA': return StatusAcao5W2H.ATRASADA;
    case 'CANCELADA': return StatusAcao5W2H.CANCELADA;
    default: return StatusAcao5W2H.PENDENTE;
  }
};

const map5W2HStatusToRestricao = (status: StatusAcao5W2H): RestricaoLPS['status'] => {
  switch (status) {
    case StatusAcao5W2H.PENDENTE:
    case StatusAcao5W2H.EM_ANDAMENTO:
      return 'PENDENTE';
    case StatusAcao5W2H.CONCLUIDA: return 'CONCLUIDA';
    case StatusAcao5W2H.ATRASADA: return 'ATRASADA';
    case StatusAcao5W2H.CANCELADA: return 'CANCELADA';
    default: return 'PENDENTE';
  }
};

const mapRestricaoPrioridadeTo5W2H = (prioridade: 'ALTA' | 'MEDIA' | 'BAIXA'): PrioridadeAcao => {
  switch (prioridade) {
    case 'ALTA': return PrioridadeAcao.ALTA;
    case 'MEDIA': return PrioridadeAcao.MEDIA;
    case 'BAIXA': return PrioridadeAcao.BAIXA;
    default: return PrioridadeAcao.MEDIA;
  }
};

export const restricao5w2hSyncService = {
  async createAcaoFrom5W2H(restricao: RestricaoLPS, empresaId: string, projetoId?: string, createdBy?: string): Promise<Acao5W2H | null> {
    try {
      const codigo = await acoes5w2hService.generateNextCodigo(empresaId);
      
      const novaAcao: Omit<Acao5W2H, 'id' | 'dataCriacao'> & { empresaId: string; projetoId?: string; createdBy?: string } = {
        codigo,
        oQue: restricao.descricao,
        porQue: `Restrição identificada: ${restricao.tipo_detalhado || 'Não especificado'}`,
        onde: restricao.wbs_nome || restricao.atividade_nome || 'A definir',
        quando: restricao.prazo_resolucao || restricao.data_conclusao_planejada || new Date(),
        quem: restricao.responsavel || 'Aguardando atribuição',
        quemId: restricao.responsavel_id,
        como: 'A definir - aguardando plano de ação',
        status: mapRestricaoStatusTo5W2H(restricao.status),
        prioridade: mapRestricaoPrioridadeTo5W2H(restricao.prioridade || 'MEDIA'),
        origem: OrigemAcao.RESTRICAO_LPS,
        origemId: restricao.id,
        origemDescricao: `Restrição: ${restricao.descricao.substring(0, 100)}`,
        restricaoLpsId: restricao.id,
        observacoes: restricao.observacoes,
        percentualConcluido: restricao.status === 'CONCLUIDA' ? 100 : 0,
        tags: ['Restrição', restricao.tipo_detalhado || 'METODO'],
        empresaId,
        projetoId,
        createdBy,
      };

      const acaoCriada = await acoes5w2hService.create(novaAcao);
      
      if (acaoCriada) {
        console.log(`Ação 5W2H ${acaoCriada.codigo} criada para restrição ${restricao.id}`);
      }
      
      return acaoCriada;
    } catch (error) {
      console.error('Erro ao criar ação 5W2H para restrição:', error);
      return null;
    }
  },

  async syncRestricaoTo5W2H(restricaoId: string, updates: Partial<RestricaoLPS>): Promise<boolean> {
    try {
      const { data: acoes, error } = await supabase
        .from('acoes_5w2h')
        .select('id')
        .eq('restricao_lps_id', restricaoId)
        .limit(1);

      if (error || !acoes || acoes.length === 0) {
        console.warn(`Nenhuma ação 5W2H encontrada para restrição ${restricaoId}`);
        return false;
      }

      const acaoId = acoes[0].id;
      const updateData: Partial<Acao5W2H> = {};

      if (updates.descricao !== undefined) updateData.oQue = updates.descricao;
      if (updates.responsavel !== undefined) updateData.quem = updates.responsavel || 'Aguardando atribuição';
      if (updates.responsavel_id !== undefined) updateData.quemId = updates.responsavel_id;
      if (updates.prazo_resolucao !== undefined) updateData.quando = updates.prazo_resolucao;
      if (updates.status !== undefined) updateData.status = mapRestricaoStatusTo5W2H(updates.status);
      if (updates.prioridade !== undefined) updateData.prioridade = mapRestricaoPrioridadeTo5W2H(updates.prioridade);
      if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;

      if (updates.status === 'CONCLUIDA') {
        updateData.percentualConcluido = 100;
        updateData.dataConclusao = new Date();
      }

      await acoes5w2hService.update(acaoId, updateData);
      console.log(`Ação 5W2H ${acaoId} sincronizada com restrição ${restricaoId}`);
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar restrição para 5W2H:', error);
      return false;
    }
  },

  async sync5W2HToRestricao(acaoId: string, updates: Partial<Acao5W2H>, empresaId: string): Promise<boolean> {
    try {
      const acao = await acoes5w2hService.getById(acaoId);
      if (!acao || !acao.restricaoLpsId) {
        console.warn(`Ação ${acaoId} não está vinculada a uma restrição`);
        return false;
      }

      const restricaoUpdates: Partial<RestricaoLPS> = {};

      if (updates.oQue !== undefined) restricaoUpdates.descricao = updates.oQue;
      if (updates.quem !== undefined) restricaoUpdates.responsavel = updates.quem;
      if (updates.quemId !== undefined) restricaoUpdates.responsavel_id = updates.quemId;
      if (updates.quando !== undefined) restricaoUpdates.prazo_resolucao = updates.quando;
      if (updates.status !== undefined) restricaoUpdates.status = map5W2HStatusToRestricao(updates.status);
      if (updates.observacoes !== undefined) restricaoUpdates.observacoes = updates.observacoes;

      if (updates.status === StatusAcao5W2H.CONCLUIDA) {
        restricaoUpdates.data_conclusao = new Date();
      }

      await restricoesLpsService.update(acao.restricaoLpsId, restricaoUpdates, empresaId);
      console.log(`Restrição ${acao.restricaoLpsId} sincronizada com ação 5W2H ${acaoId}`);
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar 5W2H para restrição:', error);
      return false;
    }
  },

  async getAcaoByRestricaoId(restricaoId: string): Promise<Acao5W2H | null> {
    try {
      const { data, error } = await supabase
        .from('acoes_5w2h')
        .select('*')
        .eq('restricao_lps_id', restricaoId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Erro ao buscar ação 5W2H por restrição:', error);
        return null;
      }

      return data ? {
        id: data.id,
        codigo: data.codigo,
        oQue: data.o_que,
        porQue: data.por_que,
        onde: data.onde,
        quando: new Date(data.quando),
        quem: data.quem,
        quemId: data.quem_id,
        como: data.como,
        quanto: data.quanto,
        quantoDescricao: data.quanto_descricao,
        status: data.status as StatusAcao5W2H,
        prioridade: data.prioridade as PrioridadeAcao,
        origem: data.origem as OrigemAcao,
        origemId: data.origem_id,
        origemDescricao: data.origem_descricao,
        restricaoLpsId: data.restricao_lps_id,
        dataCriacao: new Date(data.data_criacao),
        dataConclusao: data.data_conclusao ? new Date(data.data_conclusao) : undefined,
        observacoes: data.observacoes,
        percentualConcluido: data.percentual_concluido,
        tags: data.tags,
      } : null;
    } catch (error) {
      console.error('Erro ao buscar ação por restrição:', error);
      return null;
    }
  },

  async deleteAcaoByRestricaoId(restricaoId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('acoes_5w2h')
        .delete()
        .eq('restricao_lps_id', restricaoId);

      if (error) {
        console.error('Erro ao excluir ação 5W2H vinculada:', error);
        return false;
      }

      console.log(`Ação 5W2H vinculada à restrição ${restricaoId} excluída`);
      return true;
    } catch (error) {
      console.error('Erro ao excluir ação:', error);
      return false;
    }
  },
};
