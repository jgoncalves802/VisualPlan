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
    case 'PENDENTE': return 'no_prazo';
    case 'CONCLUIDA': return 'concluida_no_prazo';
    case 'ATRASADA': return 'atrasada';
    case 'CANCELADA': return 'vencida';
    default: return 'no_prazo';
  }
};

const mapStatusFromIshikawa = (status: string): RestricaoLPS['status'] => {
  const statusLower = status?.toLowerCase() || 'no_prazo';
  switch (statusLower) {
    case 'concluida_no_prazo': return 'CONCLUIDA';
    case 'em_execucao':
    case 'no_prazo':
      return 'PENDENTE';
    case 'atrasada': return 'ATRASADA';
    case 'vencida': return 'CANCELADA';
    default: return 'PENDENTE';
  }
};

const mapCategoriaToIshikawa = (tipoDetalhado?: TipoRestricaoDetalhado): string => {
  const categoriaMap: Record<string, string> = {
    'MATERIAL': 'material',
    'MAO_DE_OBRA': 'mao_de_obra',
    'MAQUINA': 'maquina',
    'EQUIPAMENTO': 'maquina',
    'DOCUMENTACAO': 'metodo',
    'APROVACAO': 'metodo',
    'LICENCIAMENTO': 'meio_ambiente',
    'SEGURANCA': 'meio_ambiente',
    'AMBIENTAL': 'meio_ambiente',
    'PARALISAR_OBRA': 'metodo',
    'OUTRA': 'metodo',
  };
  return categoriaMap[tipoDetalhado || 'OUTRA'] || 'metodo';
};

const mapCategoriaFromIshikawa = (categoria: string): TipoRestricaoDetalhado | undefined => {
  const catLower = categoria?.toLowerCase() || 'metodo';
  const reverseMap: Record<string, TipoRestricaoDetalhado> = {
    'material': TipoRestricaoDetalhado.MATERIAL,
    'mao_de_obra': TipoRestricaoDetalhado.MAO_DE_OBRA,
    'maquina': TipoRestricaoDetalhado.EQUIPAMENTO,
    'metodo': TipoRestricaoDetalhado.DOCUMENTACAO,
    'meio_ambiente': TipoRestricaoDetalhado.AMBIENTAL,
    'medida': TipoRestricaoDetalhado.OUTRA,
  };
  return reverseMap[catLower] || TipoRestricaoDetalhado.OUTRA;
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

const isValidUUID = (id: string | undefined | null): boolean => {
  if (!id) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

const toRestricaoIshikawaDB = (r: RestricaoLPS, empresaId: string): Record<string, unknown> | null => {
  if (!isValidUUID(empresaId)) {
    console.error('empresa_id inválido para criar restrição:', empresaId);
    return null;
  }
  if (!isValidUUID(r.id)) {
    console.error('id de restrição inválido:', r.id);
    return null;
  }

  const data: Record<string, unknown> = {
    id: r.id,
    empresa_id: empresaId,
    codigo: `ISH-${r.id.slice(0, 6).toUpperCase()}`,
    descricao: r.descricao,
    categoria: mapCategoriaToIshikawa(r.tipo_detalhado),
    status: mapStatusToIshikawa(r.status),
    responsavel: r.responsavel || null,
    data_criacao: r.data_criacao.toISOString(),
    data_prevista: r.prazo_resolucao?.toISOString().split('T')[0] || r.data_conclusao_planejada?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    data_conclusao: r.data_conclusao?.toISOString().split('T')[0] || null,
    impacto_caminho_critico: r.prioridade === 'ALTA',
    dias_atraso: r.dias_latencia || 0,
    score_impacto: r.prioridade === 'ALTA' ? 80 : r.prioridade === 'MEDIA' ? 50 : 20,
    reincidente: false,
  };
  
  if (isValidUUID(r.responsavel_id)) {
    data.responsavel_id = r.responsavel_id;
  }
  if (isValidUUID(r.atividade_id)) {
    data.atividade_id = r.atividade_id;
  }
  if (isValidUUID(r.wbs_id)) {
    data.wbs_id = r.wbs_id;
  }
  
  return data;
};

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
    if (!dbData) {
      console.error('Dados inválidos para criar restrição');
      return null;
    }
    
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
    if (!isValidUUID(id)) {
      console.error('ID de restrição inválido para update:', id);
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (restricao.descricao !== undefined) updateData.descricao = restricao.descricao;
    if (restricao.tipo_detalhado !== undefined) updateData.categoria = mapCategoriaToIshikawa(restricao.tipo_detalhado);
    if (restricao.status !== undefined) updateData.status = mapStatusToIshikawa(restricao.status);
    if (restricao.prioridade !== undefined) updateData.impacto_caminho_critico = restricao.prioridade === 'ALTA';
    if (restricao.responsavel !== undefined) updateData.responsavel = restricao.responsavel || null;
    if (restricao.responsavel_id !== undefined && isValidUUID(restricao.responsavel_id)) {
      updateData.responsavel_id = restricao.responsavel_id;
    }
    if (restricao.prazo_resolucao !== undefined) updateData.data_prevista = restricao.prazo_resolucao?.toISOString().split('T')[0];
    if (restricao.data_conclusao !== undefined) updateData.data_conclusao = restricao.data_conclusao?.toISOString().split('T')[0] || null;
    if (restricao.atividade_id !== undefined && isValidUUID(restricao.atividade_id)) {
      updateData.atividade_id = restricao.atividade_id;
    }
    if (restricao.wbs_id !== undefined && isValidUUID(restricao.wbs_id)) {
      updateData.wbs_id = restricao.wbs_id;
    }

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
    if (!dbData) {
      console.error('Dados inválidos para sincronizar restrição para Ishikawa');
      return;
    }

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
