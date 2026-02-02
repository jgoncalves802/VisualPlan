export type AuditActionType = 
  | 'programacao_criada'
  | 'programacao_aceita'
  | 'programacao_rejeitada'
  | 'atividade_iniciada'
  | 'atividade_terminada'
  | 'avanco_registrado'
  | 'avanco_validado'
  | 'avanco_rejeitado'
  | 'aprovacao_fiscalizacao'
  | 'rejeicao_fiscalizacao';

export type AuditEntityType = 
  | 'takeoff_item'
  | 'takeoff_etapa'
  | 'atividade'
  | 'programacao'
  | 'checkin_checkout';

export type ApprovalStatus = 
  | 'pendente'
  | 'em_validacao'
  | 'aprovado'
  | 'rejeitado';

export interface AuditTrailEntry {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  proponenteId: string;
  proponenteNome?: string;
  validadorId?: string;
  validadorNome?: string;
  fiscalizadorId?: string;
  fiscalizadorNome?: string;
  status: ApprovalStatus;
  observacao?: string;
  valoresAnteriores?: Record<string, unknown>;
  valoresNovos?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalWorkflowState {
  itemId: string;
  etapaId?: string;
  proponenteId?: string;
  proponenteNome?: string;
  dataProposta?: Date;
  validadorId?: string;
  validadorNome?: string;
  dataValidacao?: Date;
  fiscalizadorId?: string;
  fiscalizadorNome?: string;
  dataFiscalizacao?: Date;
  status: ApprovalStatus;
  observacao?: string;
}

export interface CreateAuditEntryDTO {
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  proponenteId: string;
  validadorId?: string;
  fiscalizadorId?: string;
  status: ApprovalStatus;
  observacao?: string;
  valoresAnteriores?: Record<string, unknown>;
  valoresNovos?: Record<string, unknown>;
}

export interface WorkflowActionRequest {
  entityType: AuditEntityType;
  entityId: string;
  actionType: AuditActionType;
  usuarioId: string;
  observacao?: string;
}

export interface WorkflowActionResponse {
  success: boolean;
  message: string;
  auditEntry?: AuditTrailEntry;
  error?: string;
}
