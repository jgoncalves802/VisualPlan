import { supabase } from './supabase';
import { RestricaoLPS, TipoRestricao, TipoRestricaoDetalhado } from '../types/lps';

interface RestricaoIshikawaDB {
  id: string;
  empresa_id: string;
  codigo: string;
  descricao: string;
  categoria: string;
  status: string;
  responsavel?: string;
  responsavel_id?: string;
  data_criacao: string;
  data_prevista: string;
  data_conclusao?: string;
  atividade_id?: string;
  wbs_id?: string;
  impacto_caminho_critico?: boolean;
  dias_atraso?: number;
  score_impacto?: number;
  reincidente?: boolean;
}

const mapStatusToIshikawa = (status: RestricaoLPS['status']): string => {
  switch (status) {
    case 'PENDENTE': return 'NO_PRAZO';
    case 'CONCLUIDA': return 'CONCLUIDA_NO_PRAZO';
    case 'ATRASADA': return 'ATRASADA';
    case 'CANCELADA': return 'VENCIDA';
    default: return 'NO_PRAZO';
  }
};

const mapStatusFromIshikawa = (status: string): RestricaoLPS['status'] => {
  switch (status) {
    case 'CONCLUIDA_NO_PRAZO': return 'CONCLUIDA';
    case 'EM_EXECUCAO':
    case 'NO_PRAZO':
      return 'PENDENTE';
    case 'ATRASADA': return 'ATRASADA';
    case 'VENCIDA': return 'CANCELADA';
    default: return 'PENDENTE';
  }
};

const mapCategoriaToIshikawa = (tipoDetalhado?: TipoRestricaoDetalhado): string => {
  const categoriaMap: Record<string, string> = {
    'MATERIAL': 'MATERIAL',
    'MAO_DE_OBRA': 'MAO_DE_OBRA',
    'MAQUINA': 'MAQUINA',
    'EQUIPAMENTO': 'MAQUINA',
    'DOCUMENTACAO': 'METODO',
    'APROVACAO': 'METODO',
    'LICENCIAMENTO': 'MEIO_AMBIENTE',
    'SEGURANCA': 'MEIO_AMBIENTE',
    'AMBIENTAL': 'MEIO_AMBIENTE',
    'PARALISAR_OBRA': 'METODO',
    'OUTRA': 'METODO',
  };
  return categoriaMap[tipoDetalhado || 'OUTRA'] || 'METODO';
};

const mapCategoriaFromIshikawa = (categoria: string): TipoRestricaoDetalhado | undefined => {
  const reverseMap: Record<string, TipoRestricaoDetalhado> = {
    'MATERIAL': TipoRestricaoDetalhado.MATERIAL,
    'MAO_DE_OBRA': TipoRestricaoDetalhado.MAO_DE_OBRA,
    'MAQUINA': TipoRestricaoDetalhado.EQUIPAMENTO,
    'METODO': TipoRestricaoDetalhado.DOCUMENTACAO,
    'MEIO_AMBIENTE': TipoRestricaoDetalhado.AMBIENTAL,
    'MEDIDA': TipoRestricaoDetalhado.OUTRA,
  };
  return reverseMap[categoria] || TipoRestricaoDetalhado.OUTRA;
};

const toRestricaoLPS = (db: RestricaoIshikawaDB): RestricaoLPS => ({
  id: db.id,
  descricao: db.descricao,
  tipo: TipoRestricao.RESTRICAO,
  tipo_detalhado: mapCategoriaFromIshikawa(db.categoria),
  wbs_id: db.wbs_id,
  responsavel: db.responsavel,
  responsavel_id: db.responsavel_id,
  data_conclusao: db.data_conclusao ? new Date(db.data_conclusao) : undefined,
  data_conclusao_planejada: db.data_prevista ? new Date(db.data_prevista) : undefined,
  data_criacao: new Date(db.data_criacao),
  prazo_resolucao: db.data_prevista ? new Date(db.data_prevista) : undefined,
  status: mapStatusFromIshikawa(db.status),
  atividade_id: db.atividade_id,
  prioridade: db.impacto_caminho_critico ? 'ALTA' : 'MEDIA',
  dias_latencia: db.dias_atraso,
  categoria: db.categoria,
});

const toRestricaoIshikawaDB = (r: RestricaoLPS, empresaId: string): RestricaoIshikawaDB => ({
  id: r.id,
  empresa_id: empresaId,
  codigo: `ISH-${r.id.slice(0, 6).toUpperCase()}`,
  descricao: r.descricao,
  categoria: mapCategoriaToIshikawa(r.tipo_detalhado),
  status: mapStatusToIshikawa(r.status),
  responsavel: r.responsavel,
  responsavel_id: r.responsavel_id,
  data_criacao: r.data_criacao.toISOString(),
  data_prevista: r.prazo_resolucao?.toISOString().split('T')[0] || r.data_conclusao_planejada?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
  data_conclusao: r.data_conclusao?.toISOString().split('T')[0],
  atividade_id: r.atividade_id,
  wbs_id: r.wbs_id,
  impacto_caminho_critico: r.prioridade === 'ALTA',
  dias_atraso: r.dias_latencia || 0,
  score_impacto: r.prioridade === 'ALTA' ? 80 : r.prioridade === 'MEDIA' ? 50 : 20,
  reincidente: false,
});

export const restricoesLpsService = {
  async getAll(empresaId: string): Promise<RestricaoLPS[]> {
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_criacao', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela restricoes_ishikawa não disponível');
        return [];
      }
      console.error('Erro ao buscar restrições:', error);
      return [];
    }

    return (data || []).map(toRestricaoLPS);
  },

  async getById(id: string): Promise<RestricaoLPS | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return null;
    }

    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Erro ao buscar restrição:', error);
      return null;
    }

    return data ? toRestricaoLPS(data) : null;
  },

  async create(restricao: RestricaoLPS, empresaId: string): Promise<RestricaoLPS | null> {
    const dbData = toRestricaoIshikawaDB(restricao, empresaId);
    
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar restrição:', error);
      return null;
    }

    return data ? toRestricaoLPS(data) : null;
  },

  async update(id: string, restricao: Partial<RestricaoLPS>, _empresaId?: string): Promise<RestricaoLPS | null> {
    const updateData: Record<string, unknown> = {};

    if (restricao.descricao !== undefined) updateData.descricao = restricao.descricao;
    if (restricao.tipo_detalhado !== undefined) updateData.categoria = mapCategoriaToIshikawa(restricao.tipo_detalhado);
    if (restricao.status !== undefined) updateData.status = mapStatusToIshikawa(restricao.status);
    if (restricao.prioridade !== undefined) updateData.impacto_caminho_critico = restricao.prioridade === 'ALTA';
    if (restricao.responsavel !== undefined) updateData.responsavel = restricao.responsavel;
    if (restricao.responsavel_id !== undefined) updateData.responsavel_id = restricao.responsavel_id;
    if (restricao.prazo_resolucao !== undefined) updateData.data_prevista = restricao.prazo_resolucao?.toISOString().split('T')[0];
    if (restricao.data_conclusao !== undefined) updateData.data_conclusao = restricao.data_conclusao?.toISOString().split('T')[0];
    if (restricao.atividade_id !== undefined) updateData.atividade_id = restricao.atividade_id;
    if (restricao.wbs_id !== undefined) updateData.wbs_id = restricao.wbs_id;

    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar restrição:', error);
      return null;
    }

    return data ? toRestricaoLPS(data) : null;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('restricoes_ishikawa')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir restrição:', error);
      return false;
    }

    return true;
  },

  async syncToIshikawa(restricao: RestricaoLPS, empresaId: string): Promise<void> {
    const dbData = toRestricaoIshikawaDB(restricao, empresaId);

    const { error } = await supabase
      .from('restricoes_ishikawa')
      .upsert(dbData, { onConflict: 'id' });

    if (error) {
      console.error('Erro ao sincronizar restrição para Ishikawa:', error);
    }
  },

  async deleteFromIshikawa(id: string): Promise<void> {
    const { error } = await supabase
      .from('restricoes_ishikawa')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao remover restrição do Ishikawa:', error);
    }
  },
};
