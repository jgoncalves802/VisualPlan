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
  atividade_nome?: string;
  wbs_id?: string;
  wbs_nome?: string;
  projeto_id?: string;
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
  // Tentar formato com capitalização inicial (ex: Material, Método)
  const categoriaMap: Record<string, string> = {
    'MATERIAL': 'Material',
    'MAO_DE_OBRA': 'Mão de Obra',
    'MAQUINA': 'Máquina',
    'METODO': 'Método',
    'MEIO_AMBIENTE': 'Meio Ambiente',
    'MEDIDA': 'Medida',
  };
  const resultado = categoriaMap[tipoDetalhado || 'METODO'] || 'Método';
  console.log(`mapCategoriaToIshikawa: input="${tipoDetalhado}" => output="${resultado}"`);
  return resultado;
};

const mapCategoriaFromIshikawa = (categoria: string): TipoRestricaoDetalhado => {
  const catLower = categoria?.toLowerCase()?.normalize('NFD')?.replace(/[\u0300-\u036f]/g, '') || 'metodo';
  const reverseMap: Record<string, TipoRestricaoDetalhado> = {
    'material': TipoRestricaoDetalhado.MATERIAL,
    'mao_de_obra': TipoRestricaoDetalhado.MAO_DE_OBRA,
    'mao de obra': TipoRestricaoDetalhado.MAO_DE_OBRA,
    'maquina': TipoRestricaoDetalhado.MAQUINA,
    'metodo': TipoRestricaoDetalhado.METODO,
    'meio_ambiente': TipoRestricaoDetalhado.MEIO_AMBIENTE,
    'meio ambiente': TipoRestricaoDetalhado.MEIO_AMBIENTE,
    'medida': TipoRestricaoDetalhado.MEDIDA,
  };
  return reverseMap[catLower] || TipoRestricaoDetalhado.METODO;
};

const toRestricaoLPS = (db: RestricaoIshikawaDB): RestricaoLPS => {
  const scoreImpacto = db.score_impacto || 0;
  const paralisarObra = db.impacto_caminho_critico && scoreImpacto >= 100;
  
  let prioridade: 'ALTA' | 'MEDIA' | 'BAIXA' = 'MEDIA';
  if (paralisarObra || scoreImpacto >= 70) {
    prioridade = 'ALTA';
  } else if (scoreImpacto >= 40) {
    prioridade = 'MEDIA';
  } else {
    prioridade = 'BAIXA';
  }
  
  return {
    id: db.id,
    descricao: db.descricao,
    tipo: TipoRestricao.RESTRICAO,
    tipo_detalhado: mapCategoriaFromIshikawa(db.categoria),
    wbs_id: db.wbs_id,
    wbs_nome: db.wbs_nome,
    responsavel: db.responsavel,
    responsavel_id: db.responsavel_id,
    data_conclusao: db.data_conclusao ? new Date(db.data_conclusao) : undefined,
    data_conclusao_planejada: db.data_prevista ? new Date(db.data_prevista) : undefined,
    data_criacao: new Date(db.data_criacao),
    prazo_resolucao: db.data_prevista ? new Date(db.data_prevista) : undefined,
    status: mapStatusFromIshikawa(db.status),
    atividade_id: db.atividade_id,
    atividade_nome: db.atividade_nome,
    projeto_id: db.projeto_id,
    prioridade,
    paralisar_obra: paralisarObra,
    dias_latencia: db.dias_atraso,
    categoria: db.categoria,
  };
};

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
    responsavel: r.responsavel || 'Não atribuído',
    data_criacao: r.data_criacao.toISOString(),
    data_prevista: r.prazo_resolucao?.toISOString().split('T')[0] || r.data_conclusao_planejada?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
    data_conclusao: r.data_conclusao?.toISOString().split('T')[0] || null,
    impacto_caminho_critico: r.paralisar_obra || false,
    dias_atraso: r.dias_latencia || 0,
    score_impacto: r.paralisar_obra ? 100 : (r.prioridade === 'ALTA' ? 80 : r.prioridade === 'MEDIA' ? 50 : 20),
    reincidente: false,
  };
  
  if (isValidUUID(r.responsavel_id)) {
    data.responsavel_id = r.responsavel_id;
  }
  if (isValidUUID(r.atividade_id)) {
    data.atividade_id = r.atividade_id;
  }
  if (r.atividade_nome) {
    data.atividade_nome = r.atividade_nome;
  }
  if (isValidUUID(r.wbs_id)) {
    data.wbs_id = r.wbs_id;
  }
  if (r.wbs_nome) {
    data.wbs_nome = r.wbs_nome;
  }
  if (isValidUUID(r.projeto_id)) {
    data.projeto_id = r.projeto_id;
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
    
    console.log('Criando restrição com dados:', JSON.stringify(dbData, null, 2));
    console.log('Categoria sendo enviada:', dbData.categoria);
    
    const { data, error } = await supabase
      .from('restricoes_ishikawa')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar restrição:', error);
      console.error('Dados enviados:', dbData);
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
    
    if (restricao.paralisar_obra !== undefined) {
      updateData.impacto_caminho_critico = restricao.paralisar_obra;
      updateData.score_impacto = restricao.paralisar_obra ? 100 : (restricao.prioridade === 'ALTA' ? 80 : restricao.prioridade === 'MEDIA' ? 50 : 20);
    } else if (restricao.prioridade !== undefined) {
      updateData.score_impacto = restricao.prioridade === 'ALTA' ? 80 : restricao.prioridade === 'MEDIA' ? 50 : 20;
    }
    
    if (restricao.responsavel !== undefined) updateData.responsavel = restricao.responsavel || 'Não atribuído';
    if (restricao.responsavel_id !== undefined && isValidUUID(restricao.responsavel_id)) {
      updateData.responsavel_id = restricao.responsavel_id;
    }
    if (restricao.prazo_resolucao !== undefined) updateData.data_prevista = restricao.prazo_resolucao?.toISOString().split('T')[0];
    if (restricao.data_conclusao !== undefined) updateData.data_conclusao = restricao.data_conclusao?.toISOString().split('T')[0] || null;
    if (restricao.atividade_id !== undefined && isValidUUID(restricao.atividade_id)) {
      updateData.atividade_id = restricao.atividade_id;
    }
    if (restricao.atividade_nome !== undefined) updateData.atividade_nome = restricao.atividade_nome;
    if (restricao.wbs_id !== undefined && isValidUUID(restricao.wbs_id)) {
      updateData.wbs_id = restricao.wbs_id;
    }
    if (restricao.wbs_nome !== undefined) updateData.wbs_nome = restricao.wbs_nome;
    if (restricao.projeto_id !== undefined && isValidUUID(restricao.projeto_id)) {
      updateData.projeto_id = restricao.projeto_id;
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

  async getProjetos(empresaId: string): Promise<{ id: string; nome: string }[]> {
    const { data, error } = await supabase
      .from('atividades_cronograma')
      .select('projeto_id, nome')
      .eq('empresa_id', empresaId)
      .is('parent_id', null)
      .not('projeto_id', 'is', null);

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela não disponível para busca de projetos');
        return [];
      }
      console.error('Erro ao buscar projetos:', error);
      return [];
    }

    const uniqueProjects = new Map<string, string>();
    (data || []).forEach((row: { projeto_id: string; nome: string }) => {
      if (row.projeto_id && !uniqueProjects.has(row.projeto_id)) {
        uniqueProjects.set(row.projeto_id, row.nome || 'Projeto sem nome');
      }
    });

    return Array.from(uniqueProjects.entries()).map(([id, nome]) => ({ id, nome }));
  },

  async getWbsNodes(projetoId: string): Promise<{ id: string; nome: string; codigo: string }[]> {
    // Primeiro, buscar wbs_id das atividades
    const { data, error } = await supabase
      .from('atividades_cronograma')
      .select('wbs_id')
      .eq('projeto_id', projetoId)
      .not('wbs_id', 'is', null);

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela atividades_cronograma não disponível para busca de WBS');
        return [];
      }
      console.error('Erro ao buscar WBS nodes das atividades:', error);
      return [];
    }

    const uniqueWbsIds = [...new Set((data || []).map((r: { wbs_id: string }) => r.wbs_id).filter(Boolean))];
    
    if (uniqueWbsIds.length === 0) return [];

    // Tentar buscar da tabela wbs_nodes
    const { data: wbsData, error: wbsError } = await supabase
      .from('wbs_nodes')
      .select('id, nome, codigo')
      .in('id', uniqueWbsIds)
      .order('codigo');

    if (wbsError) {
      // Se a tabela wbs_nodes não estiver acessível, criar fallback com dados genéricos
      if (wbsError.code === 'PGRST205') {
        console.warn('Tabela wbs_nodes não disponível, usando fallback');
        return uniqueWbsIds.map((id) => ({
          id,
          nome: `WBS ${id.slice(0, 8)}`,
          codigo: '',
        }));
      }
      console.error('Erro ao buscar WBS nodes:', wbsError);
      return [];
    }
    return wbsData || [];
  },

  async getAtividadesByProjeto(projetoId: string): Promise<{ id: string; nome: string; codigo: string }[]> {
    const { data, error } = await supabase
      .from('atividades_cronograma')
      .select('id, nome, codigo')
      .eq('projeto_id', projetoId)
      .eq('tipo', 'Tarefa')
      .order('codigo');

    if (error) {
      console.error('Erro ao buscar atividades:', error);
      return [];
    }
    return data || [];
  },

  async getAtividadeById(atividadeId: string): Promise<{ 
    id: string; 
    nome: string; 
    codigo: string; 
    projeto_id: string; 
    projeto_nome?: string;
    wbs_id?: string;
    wbs_nome?: string;
  } | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(atividadeId)) return null;

    const { data, error } = await supabase
      .from('atividades_cronograma')
      .select('id, nome, codigo, projeto_id, wbs_id')
      .eq('id', atividadeId)
      .single();

    if (error) {
      console.error('Erro ao buscar atividade:', error);
      return null;
    }

    if (!data) return null;

    let projeto_nome: string | undefined;
    let wbs_nome: string | undefined;

    if (data.wbs_id) {
      const { data: wbsData, error: wbsError } = await supabase
        .from('wbs_nodes')
        .select('nome')
        .eq('id', data.wbs_id)
        .single();
      
      if (wbsError) {
        if (wbsError.code === 'PGRST205') {
          console.warn('Tabela wbs_nodes não disponível');
        }
        // Fallback: buscar wbs_codigo da própria atividade se existir
      } else {
        wbs_nome = wbsData?.nome;
      }
    }

    if (data.projeto_id) {
      const { data: atividadeRaiz } = await supabase
        .from('atividades_cronograma')
        .select('nome')
        .eq('projeto_id', data.projeto_id)
        .is('parent_id', null)
        .limit(1)
        .single();
      
      if (atividadeRaiz?.nome) {
        projeto_nome = atividadeRaiz.nome;
      }
    }

    return {
      ...data,
      projeto_nome,
      wbs_nome,
    };
  },
};
