import { PerfilAcesso } from '../types';
import type { WorkflowAction, WorkflowStatus } from '../types/criteriosMedicao.types';

export interface WorkflowPermissionCheck {
  allowed: boolean;
  reason?: string;
}

const ACTION_PERMISSIONS: Record<WorkflowAction, PerfilAcesso[]> = {
  programar: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.DIRETOR,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.ENGENHEIRO_PLANEJAMENTO,
    PerfilAcesso.COORDENADOR_OBRA,
  ],
  aceitar_programacao: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.DIRETOR,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.MESTRE_OBRAS,
  ],
  iniciar_producao: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.MESTRE_OBRAS,
    PerfilAcesso.ENCARREGADO,
  ],
  terminar_producao: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.MESTRE_OBRAS,
    PerfilAcesso.ENCARREGADO,
  ],
  registrar_avanco: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.ENGENHEIRO_PLANEJAMENTO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.MESTRE_OBRAS,
  ],
  aprovar_fiscalizacao: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.FISCALIZACAO_LEAD,
    PerfilAcesso.FISCALIZACAO_TECNICO,
  ],
  rejeitar: [
    PerfilAcesso.ADMIN,
    PerfilAcesso.DIRETOR,
    PerfilAcesso.GERENTE_PROJETO,
    PerfilAcesso.COORDENADOR_OBRA,
    PerfilAcesso.FISCALIZACAO_LEAD,
    PerfilAcesso.FISCALIZACAO_TECNICO,
  ],
};

const ROLE_DISPLAY_NAMES: Record<PerfilAcesso, string> = {
  [PerfilAcesso.ADMIN]: 'Administrador',
  [PerfilAcesso.DIRETOR]: 'Diretor',
  [PerfilAcesso.GERENTE_PROJETO]: 'Gerente de Projeto',
  [PerfilAcesso.ENGENHEIRO_PLANEJAMENTO]: 'Engenheiro de Planejamento',
  [PerfilAcesso.COORDENADOR_OBRA]: 'Coordenador de Obra',
  [PerfilAcesso.MESTRE_OBRAS]: 'Mestre de Obras',
  [PerfilAcesso.ENCARREGADO]: 'Encarregado',
  [PerfilAcesso.COLABORADOR]: 'Colaborador',
  [PerfilAcesso.FISCALIZACAO_LEAD]: 'Líder de Fiscalização',
  [PerfilAcesso.FISCALIZACAO_TECNICO]: 'Técnico de Fiscalização',
};

const ACTION_DISPLAY_NAMES: Record<WorkflowAction, string> = {
  programar: 'Programar',
  aceitar_programacao: 'Aceitar Programação',
  iniciar_producao: 'Iniciar Produção',
  terminar_producao: 'Terminar Produção',
  registrar_avanco: 'Registrar Avanço',
  aprovar_fiscalizacao: 'Aprovar Fiscalização',
  rejeitar: 'Rejeitar',
};

export const workflowPermissionsService = {
  canExecuteAction(
    action: WorkflowAction,
    userProfile: PerfilAcesso
  ): WorkflowPermissionCheck {
    const allowedProfiles = ACTION_PERMISSIONS[action];
    
    if (!allowedProfiles) {
      return {
        allowed: false,
        reason: `Ação desconhecida: ${action}`,
      };
    }

    if (allowedProfiles.includes(userProfile)) {
      return { allowed: true };
    }

    const allowedNames = allowedProfiles
      .map(p => ROLE_DISPLAY_NAMES[p])
      .join(', ');

    return {
      allowed: false,
      reason: `Esta ação requer um dos seguintes perfis: ${allowedNames}`,
    };
  },

  getAvailableActionsForProfile(
    userProfile: PerfilAcesso,
    currentStatus: WorkflowStatus
  ): WorkflowAction[] {
    const allActions = Object.keys(ACTION_PERMISSIONS) as WorkflowAction[];
    
    return allActions.filter(action => {
      const permission = this.canExecuteAction(action, userProfile);
      if (!permission.allowed) return false;
      
      const validNextActions = this.getValidActionsForStatus(currentStatus);
      return validNextActions.includes(action);
    });
  },

  getValidActionsForStatus(status: WorkflowStatus): WorkflowAction[] {
    switch (status) {
      case 'pendente':
        return ['programar'];
      case 'programado':
        return ['aceitar_programacao', 'iniciar_producao', 'rejeitar'];
      case 'em_producao':
        return ['terminar_producao', 'rejeitar'];
      case 'producao_concluida':
        return ['registrar_avanco', 'rejeitar'];
      case 'avancado':
        return ['aprovar_fiscalizacao', 'rejeitar'];
      case 'aprovado':
        return [];
      case 'rejeitado':
        return ['programar'];
      default:
        return [];
    }
  },

  getActionDisplayName(action: WorkflowAction): string {
    return ACTION_DISPLAY_NAMES[action] || action;
  },

  getRoleDisplayName(profile: PerfilAcesso): string {
    return ROLE_DISPLAY_NAMES[profile] || profile;
  },

  getAllowedProfilesForAction(action: WorkflowAction): PerfilAcesso[] {
    return ACTION_PERMISSIONS[action] || [];
  },

  validateWorkflowTransition(
    currentStatus: WorkflowStatus,
    action: WorkflowAction,
    userProfile: PerfilAcesso
  ): WorkflowPermissionCheck {
    const validActions = this.getValidActionsForStatus(currentStatus);
    
    if (!validActions.includes(action)) {
      return {
        allowed: false,
        reason: `A ação '${this.getActionDisplayName(action)}' não é válida para o status atual`,
      };
    }

    return this.canExecuteAction(action, userProfile);
  },

  isAdminProfile(profile: PerfilAcesso): boolean {
    return profile === PerfilAcesso.ADMIN;
  },

  isFiscalizacaoProfile(profile: PerfilAcesso): boolean {
    return (
      profile === PerfilAcesso.FISCALIZACAO_LEAD ||
      profile === PerfilAcesso.FISCALIZACAO_TECNICO
    );
  },

  isProducaoProfile(profile: PerfilAcesso): boolean {
    return (
      profile === PerfilAcesso.COORDENADOR_OBRA ||
      profile === PerfilAcesso.MESTRE_OBRAS ||
      profile === PerfilAcesso.ENCARREGADO
    );
  },

  isPlanejamentoProfile(profile: PerfilAcesso): boolean {
    return (
      profile === PerfilAcesso.ENGENHEIRO_PLANEJAMENTO ||
      profile === PerfilAcesso.GERENTE_PROJETO
    );
  },
};
