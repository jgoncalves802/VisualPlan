import { supabase } from './supabaseClient';
import {
  Auditoria,
  ChecklistTemplate,
  ItemChecklist,
  ItemAuditoria,
  StatusAuditoria,
  StatusItemAuditoria,
  CategoriaChecklist,
  SeveridadeNaoConformidade,
} from '../types/gestao';

interface ChecklistTemplateDB {
  id: string;
  nome: string;
  categoria: string;
  itens: ItemChecklist[];
  versao: string;
  data_criacao: string;
  data_atualizacao: string | null;
  empresa_id: string;
  created_by: string | null;
}

interface AuditoriaDB {
  id: string;
  codigo: string;
  titulo: string;
  tipo: string;
  template_id: string | null;
  projeto_id: string | null;
  projeto_nome: string | null;
  local_auditoria: string | null;
  data_programada: string;
  data_realizacao: string | null;
  auditor_id: string | null;
  auditor_nome: string | null;
  status: string;
  itens: ItemAuditoria[];
  total_itens: number | null;
  itens_conformes: number | null;
  itens_nao_conformes: number | null;
  itens_nao_aplicaveis: number | null;
  nota_geral: number | null;
  observacoes: string | null;
  empresa_id: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

const mapTemplateFromDB = (data: ChecklistTemplateDB): ChecklistTemplate => ({
  id: data.id,
  nome: data.nome,
  categoria: data.categoria as CategoriaChecklist,
  itens: data.itens || [],
  versao: data.versao,
  dataCriacao: new Date(data.data_criacao),
  dataAtualizacao: data.data_atualizacao ? new Date(data.data_atualizacao) : undefined,
});

const mapStatusFromDB = (dbStatus: string): StatusAuditoria => {
  const statusMap: Record<string, StatusAuditoria> = {
    'PROGRAMADA': StatusAuditoria.PLANEJADA,
    'REALIZADA': StatusAuditoria.CONCLUIDA,
    'EM_ANDAMENTO': StatusAuditoria.EM_ANDAMENTO,
    'CANCELADA': StatusAuditoria.CANCELADA,
  };
  return statusMap[dbStatus] || StatusAuditoria.PLANEJADA;
};

const mapStatusToDB = (status: StatusAuditoria): string => {
  const statusMap: Record<StatusAuditoria, string> = {
    [StatusAuditoria.PLANEJADA]: 'PROGRAMADA',
    [StatusAuditoria.CONCLUIDA]: 'REALIZADA',
    [StatusAuditoria.EM_ANDAMENTO]: 'EM_ANDAMENTO',
    [StatusAuditoria.CANCELADA]: 'CANCELADA',
  };
  return statusMap[status] || 'PROGRAMADA';
};

const mapAuditoriaFromDB = (data: AuditoriaDB): Auditoria => {
  const totalItens = data.total_itens || 0;
  const itensConformes = data.itens_conformes || 0;
  const percentual = totalItens > 0 ? Math.round((itensConformes / totalItens) * 100) : undefined;
  
  return {
    id: data.id,
    codigo: data.codigo,
    titulo: data.titulo,
    descricao: data.observacoes || undefined,
    checklistId: data.template_id || '',
    checklistNome: undefined,
    projetoId: data.projeto_id || '',
    projetoNome: data.projeto_nome || undefined,
    tipo: data.tipo,
    responsavel: data.auditor_nome || '',
    responsavelId: data.auditor_id || undefined,
    dataAuditoria: new Date(data.data_programada),
    status: mapStatusFromDB(data.status),
    itens: (data.itens || []).map(item => ({
      ...item,
      status: item.status as StatusItemAuditoria,
      severidade: item.severidade as SeveridadeNaoConformidade | undefined,
    })),
    percentualConformidade: percentual,
    naoConformidades: data.itens_nao_conformes || undefined,
    acoesGeradas: undefined,
    observacoesGerais: data.observacoes || undefined,
    dataCriacao: new Date(data.created_at),
    atividadeGanttId: undefined,
  };
};

export const auditoriaService = {
  async getAllTemplates(empresaId: string): Promise<ChecklistTemplate[]> {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela checklist_templates não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar templates:', error);
      return [];
    }

    return (data || []).map(mapTemplateFromDB);
  },

  async getTemplateById(id: string): Promise<ChecklistTemplate | null> {
    const { data, error } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar template:', error);
      return null;
    }

    return mapTemplateFromDB(data);
  },

  async createTemplate(template: Omit<ChecklistTemplate, 'id' | 'dataCriacao'> & { empresaId: string; createdBy?: string }): Promise<ChecklistTemplate | null> {
    const dbData = {
      nome: template.nome,
      categoria: template.categoria,
      itens: template.itens,
      versao: template.versao,
      data_criacao: new Date().toISOString(),
      empresa_id: template.empresaId,
      created_by: template.createdBy || null,
    };

    const { data, error } = await supabase
      .from('checklist_templates')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar template:', error);
      throw error;
    }

    return mapTemplateFromDB(data);
  },

  async updateTemplate(id: string, template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate | null> {
    const updateData: Record<string, unknown> = {
      data_atualizacao: new Date().toISOString(),
    };
    
    if (template.nome !== undefined) updateData.nome = template.nome;
    if (template.categoria !== undefined) updateData.categoria = template.categoria;
    if (template.itens !== undefined) updateData.itens = template.itens;
    if (template.versao !== undefined) updateData.versao = template.versao;

    const { data, error } = await supabase
      .from('checklist_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar template:', error);
      throw error;
    }

    return mapTemplateFromDB(data);
  },

  async deleteTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir template:', error);
      throw error;
    }

    return true;
  },

  async getAllAuditorias(empresaId: string, projetoId?: string): Promise<Auditoria[]> {
    let query = supabase
      .from('auditorias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('data_programada', { ascending: false });

    if (projetoId) {
      query = query.eq('projeto_id', projetoId);
    }

    const { data, error } = await query;

    if (error) {
      if (error.code === 'PGRST205') {
        console.warn('Tabela auditorias não encontrada, retornando array vazio');
        return [];
      }
      console.error('Erro ao buscar auditorias:', error);
      return [];
    }

    return (data || []).map(mapAuditoriaFromDB);
  },

  async getAuditoriaById(id: string): Promise<Auditoria | null> {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.code === 'PGRST116') {
        return null;
      }
      console.error('Erro ao buscar auditoria:', error);
      return null;
    }

    return mapAuditoriaFromDB(data);
  },

  async createAuditoria(auditoria: Omit<Auditoria, 'id' | 'dataCriacao'> & { empresaId: string; createdBy?: string }): Promise<Auditoria | null> {
    const itens = auditoria.itens || [];
    const conformes = itens.filter(i => i.status === StatusItemAuditoria.CONFORME).length;
    const naoConformes = itens.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME).length;
    const naoAplicaveis = itens.filter(i => i.status === StatusItemAuditoria.NAO_APLICAVEL).length;
    const avaliados = itens.filter(i => i.status !== StatusItemAuditoria.PENDENTE && i.status !== StatusItemAuditoria.NAO_APLICAVEL).length;
    const notaGeral = avaliados > 0 ? Math.round((conformes / avaliados) * 100) : null;

    const dbData = {
      codigo: auditoria.codigo,
      titulo: auditoria.titulo,
      tipo: auditoria.tipo,
      template_id: auditoria.checklistId || null,
      projeto_id: auditoria.projetoId || null,
      projeto_nome: auditoria.projetoNome || null,
      local_auditoria: null,
      data_programada: auditoria.dataAuditoria instanceof Date ? auditoria.dataAuditoria.toISOString().split('T')[0] : auditoria.dataAuditoria,
      data_realizacao: auditoria.status === StatusAuditoria.CONCLUIDA ? new Date().toISOString().split('T')[0] : null,
      auditor_id: auditoria.responsavelId || null,
      auditor_nome: auditoria.responsavel || null,
      status: mapStatusToDB(auditoria.status),
      itens: itens,
      total_itens: itens.length,
      itens_conformes: conformes,
      itens_nao_conformes: naoConformes,
      itens_nao_aplicaveis: naoAplicaveis,
      nota_geral: notaGeral,
      observacoes: auditoria.observacoesGerais || null,
      empresa_id: auditoria.empresaId,
      created_by: auditoria.createdBy || null,
    };

    const { data, error } = await supabase
      .from('auditorias')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar auditoria:', error);
      throw error;
    }

    return mapAuditoriaFromDB(data);
  },

  async updateAuditoria(id: string, auditoria: Partial<Auditoria>): Promise<Auditoria | null> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (auditoria.titulo !== undefined) updateData.titulo = auditoria.titulo;
    if (auditoria.status !== undefined) updateData.status = mapStatusToDB(auditoria.status);
    if (auditoria.observacoesGerais !== undefined) updateData.observacoes = auditoria.observacoesGerais;
    
    if (auditoria.itens !== undefined) {
      const itens = auditoria.itens;
      updateData.itens = itens;
      updateData.total_itens = itens.length;
      updateData.itens_conformes = itens.filter(i => i.status === StatusItemAuditoria.CONFORME).length;
      updateData.itens_nao_conformes = itens.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME).length;
      updateData.itens_nao_aplicaveis = itens.filter(i => i.status === StatusItemAuditoria.NAO_APLICAVEL).length;
      
      const avaliados = itens.filter(i => i.status !== StatusItemAuditoria.PENDENTE && i.status !== StatusItemAuditoria.NAO_APLICAVEL).length;
      const conformes = itens.filter(i => i.status === StatusItemAuditoria.CONFORME).length;
      updateData.nota_geral = avaliados > 0 ? Math.round((conformes / avaliados) * 100) : null;
    }
    
    if (auditoria.status === StatusAuditoria.CONCLUIDA) {
      updateData.data_realizacao = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('auditorias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar auditoria:', error);
      throw error;
    }

    return mapAuditoriaFromDB(data);
  },

  async deleteAuditoria(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('auditorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir auditoria:', error);
      throw error;
    }

    return true;
  },

  async generateNextCodigo(empresaId: string): Promise<string> {
    const { data, error } = await supabase
      .from('auditorias')
      .select('codigo')
      .eq('empresa_id', empresaId)
      .order('codigo', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return 'AUD-001';
    }

    const lastCodigo = data[0].codigo;
    const match = lastCodigo.match(/AUD-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `AUD-${nextNum.toString().padStart(3, '0')}`;
    }

    return 'AUD-001';
  },

  async getAuditoriasByStatus(empresaId: string, status: StatusAuditoria): Promise<Auditoria[]> {
    const { data, error } = await supabase
      .from('auditorias')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('status', mapStatusToDB(status))
      .order('data_programada', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205') {
        return [];
      }
      console.error('Erro ao buscar auditorias por status:', error);
      return [];
    }

    return (data || []).map(mapAuditoriaFromDB);
  },

  calculateConformidade(itens: ItemAuditoria[]): { percentual: number; naoConformidades: number } {
    const itensAvaliados = itens.filter(i => i.status !== StatusItemAuditoria.PENDENTE && i.status !== StatusItemAuditoria.NAO_APLICAVEL);
    const conformes = itensAvaliados.filter(i => i.status === StatusItemAuditoria.CONFORME).length;
    const naoConformes = itensAvaliados.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME).length;
    
    const percentual = itensAvaliados.length > 0 ? Math.round((conformes / itensAvaliados.length) * 100) : 0;
    
    return { percentual, naoConformidades: naoConformes };
  },

  async getProjetosDisponiveis(empresaId: string): Promise<{ id: string; nome: string }[]> {
    const { data, error } = await supabase
      .from('eps_nodes')
      .select('id, nome')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar projetos:', error);
      return [];
    }

    return data || [];
  },

  async getAuditoresDisponiveis(empresaId: string): Promise<{ id: string; nome: string }[]> {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nome')
      .eq('empresa_id', empresaId)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao buscar auditores:', error);
      return [];
    }

    return data || [];
  },
};
