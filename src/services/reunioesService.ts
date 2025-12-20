import { supabase } from './supabaseClient';
import {
  Reuniao,
  PautaReuniao,
  ItemPauta,
  TipoReuniao,
} from '../types/gestao';

interface ReuniaoDB {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  frequencia: string;
  participantes: string[];
  pauta_fixa: string[] | null;
  proxima_data: string | null;
  hora_inicio: string | null;
  duracao: number | null;
  local: string | null;
  ativo: boolean;
  empresa_id: string;
  projeto_id: string | null;
  created_by: string | null;
  created_at: string;
}

interface PautaReuniaoDB {
  id: string;
  reuniao_id: string;
  data: string;
  itens: ItemPauta[];
  participantes_presentes: string[] | null;
  observacoes: string | null;
  acoes_geradas: string[] | null;
  empresa_id: string;
  created_by: string | null;
}

const mapReuniaoFromDB = (data: ReuniaoDB): Reuniao => ({
  id: data.id,
  tipo: data.tipo as TipoReuniao,
  titulo: data.titulo,
  descricao: data.descricao || undefined,
  frequencia: data.frequencia,
  participantes: data.participantes || [],
  pautaFixa: data.pauta_fixa || undefined,
  proximaData: data.proxima_data ? new Date(data.proxima_data) : undefined,
  horaInicio: data.hora_inicio || undefined,
  duracao: data.duracao || undefined,
  local: data.local || undefined,
  ativo: data.ativo,
});

const mapPautaFromDB = (data: PautaReuniaoDB): PautaReuniao => ({
  id: data.id,
  reuniaoId: data.reuniao_id,
  data: new Date(data.data),
  itens: data.itens || [],
  participantesPresentes: data.participantes_presentes || undefined,
  observacoes: data.observacoes || undefined,
  acoesGeradas: data.acoes_geradas || undefined,
});

export const reunioesService = {
  async getAllReunioes(empresaId: string, projetoId?: string): Promise<Reuniao[]> {
    let query = supabase
      .from('reunioes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('proxima_data', { ascending: true });

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela reunioes não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar reuniões:', error);
      return [];
    }

    return (data || []).map(mapReuniaoFromDB);
  },

  async getReuniaoById(id: string): Promise<Reuniao | null> {
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar reunião:', error);
      return null;
    }

    return mapReuniaoFromDB(data);
  },

  async createReuniao(reuniao: Omit<Reuniao, 'id'> & { empresaId: string; projetoId?: string; createdBy?: string }): Promise<Reuniao | null> {
    const dbData = {
      tipo: reuniao.tipo,
      titulo: reuniao.titulo,
      descricao: reuniao.descricao || null,
      frequencia: reuniao.frequencia,
      participantes: reuniao.participantes,
      pauta_fixa: reuniao.pautaFixa || null,
      proxima_data: reuniao.proximaData instanceof Date ? reuniao.proximaData.toISOString() : reuniao.proximaData || null,
      hora_inicio: reuniao.horaInicio || null,
      duracao: reuniao.duracao || null,
      local: reuniao.local || null,
      ativo: reuniao.ativo,
      empresa_id: reuniao.empresaId,
      projeto_id: reuniao.projetoId || null,
      created_by: reuniao.createdBy || null,
    };

    const { data, error } = await supabase
      .from('reunioes')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar reunião:', error);
      throw error;
    }

    return mapReuniaoFromDB(data);
  },

  async updateReuniao(id: string, reuniao: Partial<Reuniao>): Promise<Reuniao | null> {
    const updateData: Record<string, unknown> = {};
    
    if (reuniao.tipo !== undefined) updateData.tipo = reuniao.tipo;
    if (reuniao.titulo !== undefined) updateData.titulo = reuniao.titulo;
    if (reuniao.descricao !== undefined) updateData.descricao = reuniao.descricao;
    if (reuniao.frequencia !== undefined) updateData.frequencia = reuniao.frequencia;
    if (reuniao.participantes !== undefined) updateData.participantes = reuniao.participantes;
    if (reuniao.pautaFixa !== undefined) updateData.pauta_fixa = reuniao.pautaFixa;
    if (reuniao.proximaData !== undefined) updateData.proxima_data = reuniao.proximaData instanceof Date ? reuniao.proximaData.toISOString() : reuniao.proximaData;
    if (reuniao.horaInicio !== undefined) updateData.hora_inicio = reuniao.horaInicio;
    if (reuniao.duracao !== undefined) updateData.duracao = reuniao.duracao;
    if (reuniao.local !== undefined) updateData.local = reuniao.local;
    if (reuniao.ativo !== undefined) updateData.ativo = reuniao.ativo;

    const { data, error } = await supabase
      .from('reunioes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar reunião:', error);
      throw error;
    }

    return mapReuniaoFromDB(data);
  },

  async deleteReuniao(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('reunioes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir reunião:', error);
      throw error;
    }

    return true;
  },

  async getAllPautas(reuniaoId: string): Promise<PautaReuniao[]> {
    const { data, error } = await supabase
      .from('pautas_reuniao')
      .select('*')
      .eq('reuniao_id', reuniaoId)
      .order('data', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela pautas_reuniao não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar pautas:', error);
      return [];
    }

    return (data || []).map(mapPautaFromDB);
  },

  async createPauta(pauta: Omit<PautaReuniao, 'id'> & { empresaId: string; createdBy?: string }): Promise<PautaReuniao | null> {
    const dbData = {
      reuniao_id: pauta.reuniaoId,
      data: pauta.data instanceof Date ? pauta.data.toISOString() : pauta.data,
      itens: pauta.itens,
      participantes_presentes: pauta.participantesPresentes || null,
      observacoes: pauta.observacoes || null,
      acoes_geradas: pauta.acoesGeradas || null,
      empresa_id: pauta.empresaId,
      created_by: pauta.createdBy || null,
    };

    const { data, error } = await supabase
      .from('pautas_reuniao')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pauta:', error);
      throw error;
    }

    return mapPautaFromDB(data);
  },

  async updatePauta(id: string, pauta: Partial<PautaReuniao>): Promise<PautaReuniao | null> {
    const updateData: Record<string, unknown> = {};
    
    if (pauta.itens !== undefined) updateData.itens = pauta.itens;
    if (pauta.participantesPresentes !== undefined) updateData.participantes_presentes = pauta.participantesPresentes;
    if (pauta.observacoes !== undefined) updateData.observacoes = pauta.observacoes;
    if (pauta.acoesGeradas !== undefined) updateData.acoes_geradas = pauta.acoesGeradas;

    const { data, error } = await supabase
      .from('pautas_reuniao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pauta:', error);
      throw error;
    }

    return mapPautaFromDB(data);
  },

  async getReunioesPorSemana(empresaId: string, dataInicio: Date, dataFim: Date): Promise<Reuniao[]> {
    const { data, error } = await supabase
      .from('reunioes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .gte('proxima_data', dataInicio.toISOString())
      .lte('proxima_data', dataFim.toISOString())
      .order('proxima_data', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        return [];
      }
      console.error('Erro ao buscar reuniões da semana:', error);
      return [];
    }

    return (data || []).map(mapReuniaoFromDB);
  },
};
