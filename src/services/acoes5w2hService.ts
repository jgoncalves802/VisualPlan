import { supabase } from './supabaseClient';
import {
  Acao5W2H,
  StatusAcao5W2H,
  PrioridadeAcao,
  OrigemAcao,
} from '../types/gestao';

interface Acao5W2HDB {
  id: string;
  codigo: string;
  o_que: string;
  por_que: string;
  onde: string | null;
  quando: string;
  quem: string;
  quem_id: string | null;
  como: string | null;
  quanto: number | null;
  quanto_descricao: string | null;
  status: string;
  prioridade: string;
  origem: string;
  origem_id: string | null;
  origem_descricao: string | null;
  atividade_gantt_id: string | null;
  restricao_lps_id: string | null;
  auditoria_id: string | null;
  kanban_card_id: string | null;
  data_criacao: string;
  data_conclusao: string | null;
  observacoes: string | null;
  percentual_concluido: number | null;
  tags: string[] | null;
  empresa_id: string;
  projeto_id: string | null;
  created_by: string | null;
}

const mapFromDB = (data: Acao5W2HDB): Acao5W2H => ({
  id: data.id,
  codigo: data.codigo,
  oQue: data.o_que,
  porQue: data.por_que,
  onde: data.onde || undefined,
  quando: new Date(data.quando),
  quem: data.quem,
  quemId: data.quem_id || undefined,
  como: data.como || undefined,
  quanto: data.quanto || undefined,
  quantoDescricao: data.quanto_descricao || undefined,
  status: data.status as StatusAcao5W2H,
  prioridade: data.prioridade as PrioridadeAcao,
  origem: data.origem as OrigemAcao,
  origemId: data.origem_id || undefined,
  origemDescricao: data.origem_descricao || undefined,
  atividadeGanttId: data.atividade_gantt_id || undefined,
  restricaoLpsId: data.restricao_lps_id || undefined,
  auditoriaId: data.auditoria_id || undefined,
  kanbanCardId: data.kanban_card_id || undefined,
  dataCriacao: new Date(data.data_criacao),
  dataConclusao: data.data_conclusao ? new Date(data.data_conclusao) : undefined,
  observacoes: data.observacoes || undefined,
  percentualConcluido: data.percentual_concluido || undefined,
  tags: data.tags || undefined,
});

const mapToDB = (acao: Partial<Acao5W2H> & { empresaId: string; projetoId?: string; createdBy?: string }) => ({
  codigo: acao.codigo,
  o_que: acao.oQue,
  por_que: acao.porQue,
  onde: acao.onde || null,
  quando: acao.quando instanceof Date ? acao.quando.toISOString() : acao.quando,
  quem: acao.quem,
  quem_id: acao.quemId || null,
  como: acao.como || null,
  quanto: acao.quanto || null,
  quanto_descricao: acao.quantoDescricao || null,
  status: acao.status,
  prioridade: acao.prioridade,
  origem: acao.origem,
  origem_id: acao.origemId || null,
  origem_descricao: acao.origemDescricao || null,
  atividade_gantt_id: acao.atividadeGanttId || null,
  restricao_lps_id: acao.restricaoLpsId || null,
  auditoria_id: acao.auditoriaId || null,
  kanban_card_id: acao.kanbanCardId || null,
  data_conclusao: acao.dataConclusao instanceof Date ? acao.dataConclusao.toISOString() : acao.dataConclusao || null,
  observacoes: acao.observacoes || null,
  percentual_concluido: acao.percentualConcluido || null,
  tags: acao.tags || null,
  empresa_id: acao.empresaId,
  projeto_id: acao.projetoId || null,
  created_by: acao.createdBy || null,
});

export const acoes5w2hService = {
  async getAll(empresaId: string, projetoId?: string): Promise<Acao5W2H[]> {
    let query = supabase
      .from('acoes_5w2h')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_criacao', { ascending: false });

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela acoes_5w2h não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar ações 5W2H:', error);
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<Acao5W2H | null> {
    const { data, error } = await supabase
      .from('acoes_5w2h')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar ação 5W2H:', error);
      return null;
    }

    return mapFromDB(data);
  },

  async getByOrigem(origemTipo: OrigemAcao, origemId: string): Promise<Acao5W2H[]> {
    const { data, error } = await supabase
      .from('acoes_5w2h')
      .select('*')
      .eq('origem', origemTipo)
      .eq('origem_id', origemId);

    if (error) {
      if (error.code === 'PGRST205') {
        return [];
      }
      console.error('Erro ao buscar ações por origem:', error);
      return [];
    }

    return (data || []).map(mapFromDB);
  },

  async create(acao: Omit<Acao5W2H, 'id' | 'dataCriacao'> & { empresaId: string; projetoId?: string; createdBy?: string }): Promise<Acao5W2H | null> {
    const dbData = {
      ...mapToDB(acao),
      data_criacao: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('acoes_5w2h')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      if (error.code === '23514' && error.message?.includes('acoes_5w2h_origem_check')) {
        console.log('Usando RPC para inserir ação 5W2H (schema cache desatualizado)');
        const { data: rpcId, error: rpcError } = await supabase.rpc('insert_acao_5w2h', {
          p_codigo: acao.codigo,
          p_o_que: acao.oQue,
          p_por_que: acao.porQue,
          p_onde: acao.onde || null,
          p_quando: acao.quando instanceof Date ? acao.quando.toISOString() : acao.quando,
          p_quem: acao.quem,
          p_quem_id: acao.quemId || null,
          p_como: acao.como || null,
          p_status: acao.status,
          p_prioridade: acao.prioridade,
          p_origem: acao.origem,
          p_origem_id: acao.origemId || null,
          p_origem_descricao: acao.origemDescricao || null,
          p_empresa_id: acao.empresaId,
          p_projeto_id: acao.projetoId || null,
        });

        if (rpcError) {
          console.error('Erro ao criar ação 5W2H via RPC:', rpcError);
          throw rpcError;
        }

        return {
          id: rpcId,
          codigo: acao.codigo,
          oQue: acao.oQue,
          porQue: acao.porQue,
          onde: acao.onde,
          quando: acao.quando instanceof Date ? acao.quando : new Date(acao.quando as string),
          quem: acao.quem,
          quemId: acao.quemId,
          como: acao.como,
          status: acao.status,
          prioridade: acao.prioridade,
          origem: acao.origem,
          origemId: acao.origemId,
          origemDescricao: acao.origemDescricao,
          dataCriacao: new Date(),
        } as Acao5W2H;
      }
      
      console.error('Erro ao criar ação 5W2H:', error);
      throw error;
    }

    return mapFromDB(data);
  },

  async update(id: string, acao: Partial<Acao5W2H>): Promise<Acao5W2H | null> {
    const updateData: Record<string, unknown> = {};
    
    if (acao.oQue !== undefined) updateData.o_que = acao.oQue;
    if (acao.porQue !== undefined) updateData.por_que = acao.porQue;
    if (acao.onde !== undefined) updateData.onde = acao.onde;
    if (acao.quando !== undefined) updateData.quando = acao.quando instanceof Date ? acao.quando.toISOString() : acao.quando;
    if (acao.quem !== undefined) updateData.quem = acao.quem;
    if (acao.quemId !== undefined) updateData.quem_id = acao.quemId;
    if (acao.como !== undefined) updateData.como = acao.como;
    if (acao.quanto !== undefined) updateData.quanto = acao.quanto;
    if (acao.quantoDescricao !== undefined) updateData.quanto_descricao = acao.quantoDescricao;
    if (acao.status !== undefined) updateData.status = acao.status;
    if (acao.prioridade !== undefined) updateData.prioridade = acao.prioridade;
    if (acao.percentualConcluido !== undefined) updateData.percentual_concluido = acao.percentualConcluido;
    if (acao.dataConclusao !== undefined) updateData.data_conclusao = acao.dataConclusao instanceof Date ? acao.dataConclusao.toISOString() : acao.dataConclusao;
    if (acao.observacoes !== undefined) updateData.observacoes = acao.observacoes;
    if (acao.tags !== undefined) updateData.tags = acao.tags;

    const { data, error } = await supabase
      .from('acoes_5w2h')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ação 5W2H:', error);
      throw error;
    }

    return mapFromDB(data);
  },

  async updateWithSync(id: string, acao: Partial<Acao5W2H>, empresaId: string): Promise<Acao5W2H | null> {
    const updated = await this.update(id, acao);
    
    if (updated && updated.restricaoLpsId) {
      const { restricao5w2hSyncService } = await import('./restricao5w2hSyncService');
      restricao5w2hSyncService.sync5W2HToRestricao(id, acao, empresaId).catch(err => {
        console.error('Erro ao sincronizar 5W2H para restrição:', err);
      });
    }
    
    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('acoes_5w2h')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir ação 5W2H:', error);
      throw error;
    }

    return true;
  },

  async generateNextCodigo(empresaId: string): Promise<string> {
    const { data, error } = await supabase
      .from('acoes_5w2h')
      .select('codigo')
      .eq('empresa_id', empresaId)
      .order('codigo', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return '5W2H-001';
    }

    const lastCodigo = data[0].codigo;
    const match = lastCodigo.match(/5W2H-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `5W2H-${nextNum.toString().padStart(3, '0')}`;
    }

    return '5W2H-001';
  },

  async getStatsByStatus(empresaId: string): Promise<Record<StatusAcao5W2H, number>> {
    const { data, error } = await supabase
      .from('acoes_5w2h')
      .select('status')
      .eq('empresa_id', empresaId);

    const stats: Record<StatusAcao5W2H, number> = {
      [StatusAcao5W2H.PENDENTE]: 0,
      [StatusAcao5W2H.EM_ANDAMENTO]: 0,
      [StatusAcao5W2H.CONCLUIDA]: 0,
      [StatusAcao5W2H.ATRASADA]: 0,
      [StatusAcao5W2H.CANCELADA]: 0,
    };

    if (error || !data) {
      return stats;
    }

    data.forEach(item => {
      const status = item.status as StatusAcao5W2H;
      if (stats[status] !== undefined) {
        stats[status]++;
      }
    });

    return stats;
  },
};
