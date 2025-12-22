import { supabase } from './supabase';
import {
  CategoriaIshikawa,
  StatusRestricaoIshikawa,
  RestricaoIshikawa,
} from '../types/gestao';

interface RestricaoIshikawaDB {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  status: string;
  atividade_id?: string;
  atividade_nome?: string;
  wbs_id?: string;
  wbs_nome?: string;
  eps_id?: string;
  eps_nome?: string;
  data_criacao: string;
  data_prevista: string;
  data_conclusao?: string;
  responsavel: string;
  impacto_caminho_critico: boolean;
  duracao_atividade_impactada: number;
  dias_atraso: number;
  score_impacto: number;
  reincidente: boolean;
  created_at?: string;
  updated_at?: string;
}

function mapFromDB(row: RestricaoIshikawaDB): RestricaoIshikawa {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao,
    categoria: row.categoria as CategoriaIshikawa,
    status: row.status as StatusRestricaoIshikawa,
    atividadeId: row.atividade_id,
    atividadeNome: row.atividade_nome,
    wbsId: row.wbs_id,
    wbsNome: row.wbs_nome,
    epsId: row.eps_id,
    epsNome: row.eps_nome,
    dataCriacao: new Date(row.data_criacao),
    dataPrevista: new Date(row.data_prevista),
    dataConclusao: row.data_conclusao ? new Date(row.data_conclusao) : undefined,
    responsavel: row.responsavel,
    impactoCaminhoCritico: row.impacto_caminho_critico,
    duracaoAtividadeImpactada: row.duracao_atividade_impactada,
    diasAtraso: row.dias_atraso,
    scoreImpacto: row.score_impacto,
    reincidente: row.reincidente,
  };
}

function mapToDB(restricao: Partial<RestricaoIshikawa>, empresaId: string): Partial<RestricaoIshikawaDB> {
  const db: Partial<RestricaoIshikawaDB> = {
    empresa_id: empresaId,
  };

  if (restricao.id !== undefined) db.id = restricao.id;
  if (restricao.codigo !== undefined) db.codigo = restricao.codigo;
  if (restricao.descricao !== undefined) db.descricao = restricao.descricao;
  if (restricao.categoria !== undefined) db.categoria = restricao.categoria;
  if (restricao.status !== undefined) db.status = restricao.status;
  if (restricao.atividadeId !== undefined) db.atividade_id = restricao.atividadeId;
  if (restricao.atividadeNome !== undefined) db.atividade_nome = restricao.atividadeNome;
  if (restricao.wbsId !== undefined) db.wbs_id = restricao.wbsId;
  if (restricao.wbsNome !== undefined) db.wbs_nome = restricao.wbsNome;
  if (restricao.epsId !== undefined) db.eps_id = restricao.epsId;
  if (restricao.epsNome !== undefined) db.eps_nome = restricao.epsNome;
  if (restricao.dataCriacao !== undefined) db.data_criacao = restricao.dataCriacao.toISOString();
  if (restricao.dataPrevista !== undefined) db.data_prevista = restricao.dataPrevista.toISOString();
  if (restricao.dataConclusao !== undefined) db.data_conclusao = restricao.dataConclusao.toISOString();
  if (restricao.responsavel !== undefined) db.responsavel = restricao.responsavel;
  if (restricao.impactoCaminhoCritico !== undefined) db.impacto_caminho_critico = restricao.impactoCaminhoCritico;
  if (restricao.duracaoAtividadeImpactada !== undefined) db.duracao_atividade_impactada = restricao.duracaoAtividadeImpactada;
  if (restricao.diasAtraso !== undefined) db.dias_atraso = restricao.diasAtraso;
  if (restricao.scoreImpacto !== undefined) db.score_impacto = restricao.scoreImpacto;
  if (restricao.reincidente !== undefined) db.reincidente = restricao.reincidente;

  return db;
}

export const restricoesIshikawaService = {
  async getAll(empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('Tabela restricoes_ishikawa não encontrada, retornando array vazio');
        return [];
      }
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getById(id: string): Promise<RestricaoIshikawa | null> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data ? mapFromDB(data) : null;
  },

  async create(restricao: Omit<RestricaoIshikawa, 'id'>, empresaId: string): Promise<RestricaoIshikawa> {
    const dbData = mapToDB(restricao, empresaId);
    dbData.id = `rest-${Date.now()}`;

    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return mapFromDB(data);
  },

  async update(id: string, restricao: Partial<RestricaoIshikawa>, empresaId: string): Promise<RestricaoIshikawa> {
    const dbData = mapToDB(restricao, empresaId);

    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapFromDB(data);
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('restricoes_ishikawa')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getByAtividade(atividadeId: string, empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('atividade_id', atividadeId)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByWbs(wbsId: string, empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('wbs_id', wbsId)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByEps(epsId: string, empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('eps_id', epsId)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByStatus(status: StatusRestricaoIshikawa, empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', status)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getByCategoria(categoria: CategoriaIshikawa, empresaId: string): Promise<RestricaoIshikawa[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('categoria', categoria)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') return [];
      throw error;
    }

    return (data || []).map(mapFromDB);
  },

  async getEPSDisponiveis(empresaId: string): Promise<Array<{ id: string; nome: string }>> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select('id, nome')
      .eq('empresa_id', empresaId)
      .order('nome');

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('Tabela eps_nodes não encontrada');
        return [];
      }
      throw error;
    }

    return data || [];
  },

  async getWBSByEPS(epsId: string): Promise<Array<{ id: string; nome: string }>> {
    const { data, error } = await supabase
      .from('wbs_nodes')
      .select('id, nome')
      .eq('eps_node_id', epsId)
      .order('nome');

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('Tabela wbs_nodes não encontrada');
        return [];
      }
      throw error;
    }

    return data || [];
  },

  async getAtividadesByWBS(wbsId: string): Promise<Array<{ id: string; nome: string }>> {
    const { data, error } = await supabase
      .from('atividades_cronograma')
      .select('id, nome')
      .eq('wbs_id', wbsId)
      .order('nome');

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('Tabela atividades_cronograma não encontrada');
        return [];
      }
      throw error;
    }

    return data || [];
  },
};
