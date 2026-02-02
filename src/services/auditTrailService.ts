import { supabase } from './supabase';
import type {
  AuditTrailEntry,
  CreateAuditEntryDTO,
  WorkflowActionRequest,
  WorkflowActionResponse,
  ApprovalStatus,
} from '../types/auditTrail.types';

const mapAuditFromDB = (row: Record<string, unknown>): AuditTrailEntry => ({
  id: row.id as string,
  entityType: row.entity_type as AuditTrailEntry['entityType'],
  entityId: row.entity_id as string,
  actionType: row.action_type as AuditTrailEntry['actionType'],
  proponenteId: row.proponente_id as string,
  proponenteNome: row.proponente_nome as string | undefined,
  validadorId: row.validador_id as string | undefined,
  validadorNome: row.validador_nome as string | undefined,
  fiscalizadorId: row.fiscalizador_id as string | undefined,
  fiscalizadorNome: row.fiscalizador_nome as string | undefined,
  status: row.status as ApprovalStatus,
  observacao: row.observacao as string | undefined,
  valoresAnteriores: row.valores_anteriores as Record<string, unknown> | undefined,
  valoresNovos: row.valores_novos as Record<string, unknown> | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

export const auditTrailService = {
  async createEntry(dto: CreateAuditEntryDTO): Promise<AuditTrailEntry | null> {
    const proponenteResult = await supabase
      .from('usuarios')
      .select('nome')
      .eq('id', dto.proponenteId)
      .single();
    
    let validadorNome: string | undefined;
    if (dto.validadorId) {
      const validadorResult = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', dto.validadorId)
        .single();
      validadorNome = validadorResult.data?.nome;
    }

    let fiscalizadorNome: string | undefined;
    if (dto.fiscalizadorId) {
      const fiscalizadorResult = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', dto.fiscalizadorId)
        .single();
      fiscalizadorNome = fiscalizadorResult.data?.nome;
    }

    const { data, error } = await supabase
      .from('audit_trail')
      .insert({
        entity_type: dto.entityType,
        entity_id: dto.entityId,
        action_type: dto.actionType,
        proponente_id: dto.proponenteId,
        proponente_nome: proponenteResult.data?.nome,
        validador_id: dto.validadorId,
        validador_nome: validadorNome,
        fiscalizador_id: dto.fiscalizadorId,
        fiscalizador_nome: fiscalizadorNome,
        status: dto.status,
        observacao: dto.observacao,
        valores_anteriores: dto.valoresAnteriores,
        valores_novos: dto.valoresNovos,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating audit entry:', error);
      return null;
    }

    return mapAuditFromDB(data);
  },

  async getEntriesByEntity(entityType: string, entityId: string): Promise<AuditTrailEntry[]> {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit entries:', error);
      return [];
    }

    return (data || []).map(mapAuditFromDB);
  },

  async getEntriesByEntityIds(entityType: string, entityIds: string[]): Promise<AuditTrailEntry[]> {
    if (entityIds.length === 0) return [];

    const { data, error } = await supabase
      .from('audit_trail')
      .select('*')
      .eq('entity_type', entityType)
      .in('entity_id', entityIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit entries:', error);
      return [];
    }

    return (data || []).map(mapAuditFromDB);
  },

  async executeWorkflowAction(request: WorkflowActionRequest): Promise<WorkflowActionResponse> {
    const entry = await this.createEntry({
      entityType: request.entityType,
      entityId: request.entityId,
      actionType: request.actionType,
      proponenteId: request.usuarioId,
      status: 'aprovado',
      observacao: request.observacao,
    });

    if (!entry) {
      return {
        success: false,
        message: 'Erro ao registrar ação no histórico',
        error: 'Failed to create audit entry',
      };
    }

    return {
      success: true,
      message: 'Ação registrada com sucesso',
      auditEntry: entry,
    };
  },

  async getLatestStatus(entityType: string, entityId: string): Promise<ApprovalStatus | null> {
    const { data, error } = await supabase
      .from('audit_trail')
      .select('status')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data?.status as ApprovalStatus || null;
  },
};

export default auditTrailService;
