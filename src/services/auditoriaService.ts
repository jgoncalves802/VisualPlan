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
  descricao: string | null;
  checklist_id: string;
  checklist_nome: string | null;
  projeto_id: string;
  projeto_nome: string | null;
  tipo: string;
  responsavel: string;
  responsavel_id: string | null;
  data_auditoria: string;
  status: string;
  itens: ItemAuditoria[];
  percentual_conformidade: number | null;
  nao_conformidades: number | null;
  acoes_geradas: string[] | null;
  observacoes_gerais: string | null;
  data_criacao: string;
  atividade_gantt_id: string | null;
  empresa_id: string;
  created_by: string | null;
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

const mapAuditoriaFromDB = (data: AuditoriaDB): Auditoria => ({
  id: data.id,
  codigo: data.codigo,
  titulo: data.titulo,
  descricao: data.descricao || undefined,
  checklistId: data.checklist_id,
  checklistNome: data.checklist_nome || undefined,
  projetoId: data.projeto_id,
  projetoNome: data.projeto_nome || undefined,
  tipo: data.tipo,
  responsavel: data.responsavel,
  responsavelId: data.responsavel_id || undefined,
  dataAuditoria: new Date(data.data_auditoria),
  status: data.status as StatusAuditoria,
  itens: (data.itens || []).map(item => ({
    ...item,
    status: item.status as StatusItemAuditoria,
    severidade: item.severidade as SeveridadeNaoConformidade | undefined,
  })),
  percentualConformidade: data.percentual_conformidade || undefined,
  naoConformidades: data.nao_conformidades || undefined,
  acoesGeradas: data.acoes_geradas || undefined,
  observacoesGerais: data.observacoes_gerais || undefined,
  dataCriacao: new Date(data.data_criacao),
  atividadeGanttId: data.atividade_gantt_id || undefined,
});

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
      .order('data_auditoria', { ascending: false });

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
    const dbData = {
      codigo: auditoria.codigo,
      titulo: auditoria.titulo,
      descricao: auditoria.descricao || null,
      checklist_id: auditoria.checklistId,
      checklist_nome: auditoria.checklistNome || null,
      projeto_id: auditoria.projetoId,
      projeto_nome: auditoria.projetoNome || null,
      tipo: auditoria.tipo,
      responsavel: auditoria.responsavel,
      responsavel_id: auditoria.responsavelId || null,
      data_auditoria: auditoria.dataAuditoria instanceof Date ? auditoria.dataAuditoria.toISOString() : auditoria.dataAuditoria,
      status: auditoria.status,
      itens: auditoria.itens,
      percentual_conformidade: auditoria.percentualConformidade || null,
      nao_conformidades: auditoria.naoConformidades || null,
      acoes_geradas: auditoria.acoesGeradas || null,
      observacoes_gerais: auditoria.observacoesGerais || null,
      data_criacao: new Date().toISOString(),
      atividade_gantt_id: auditoria.atividadeGanttId || null,
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
    const updateData: Record<string, unknown> = {};
    
    if (auditoria.titulo !== undefined) updateData.titulo = auditoria.titulo;
    if (auditoria.descricao !== undefined) updateData.descricao = auditoria.descricao;
    if (auditoria.status !== undefined) updateData.status = auditoria.status;
    if (auditoria.itens !== undefined) updateData.itens = auditoria.itens;
    if (auditoria.percentualConformidade !== undefined) updateData.percentual_conformidade = auditoria.percentualConformidade;
    if (auditoria.naoConformidades !== undefined) updateData.nao_conformidades = auditoria.naoConformidades;
    if (auditoria.acoesGeradas !== undefined) updateData.acoes_geradas = auditoria.acoesGeradas;
    if (auditoria.observacoesGerais !== undefined) updateData.observacoes_gerais = auditoria.observacoesGerais;

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
      .eq('status', status)
      .order('data_auditoria', { ascending: false });

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
};
