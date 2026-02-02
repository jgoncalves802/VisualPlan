import React, { useState, useMemo } from 'react';
import {
  Play,
  Square,
  CheckCircle,
  XCircle,
  ArrowRight,
  Loader2,
  CalendarCheck,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react';
import type { WorkflowStatus, WorkflowAction } from '../../../types/criteriosMedicao.types';
import { takeoffItemEtapasService } from '../../../services/takeoffItemEtapasService';
import { workflowPermissionsService } from '../../../services/workflowPermissionsService';
import { PerfilAcesso } from '../../../types';

interface WorkflowActionButtonsProps {
  etapaId: string;
  itemId?: string;
  criterioEtapaId?: string;
  status: WorkflowStatus;
  onActionComplete: () => void;
  usuarioId: string;
  userProfile: PerfilAcesso;
  compact?: boolean;
}

interface ActionConfig {
  action: WorkflowAction;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverBg: string;
  confirmTitle: string;
  confirmMessage: string;
  requiresObservation?: boolean;
}

const actionConfigs: Record<WorkflowAction, ActionConfig> = {
  programar: {
    action: 'programar',
    label: 'Programar',
    icon: <CalendarCheck className="w-3 h-3" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-200',
    confirmTitle: 'Programar Etapa',
    confirmMessage: 'Confirma a programação desta etapa para produção?',
  },
  aceitar_programacao: {
    action: 'aceitar_programacao',
    label: 'Aceitar',
    icon: <ThumbsUp className="w-3 h-3" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    hoverBg: 'hover:bg-green-200',
    confirmTitle: 'Aceitar Programação',
    confirmMessage: 'Confirma a aceitação da programação pela produção?',
  },
  iniciar_producao: {
    action: 'iniciar_producao',
    label: 'Iniciar',
    icon: <Play className="w-3 h-3" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    hoverBg: 'hover:bg-amber-200',
    confirmTitle: 'Iniciar Produção',
    confirmMessage: 'Confirma o início da produção desta etapa?',
  },
  terminar_producao: {
    action: 'terminar_producao',
    label: 'Terminar',
    icon: <Square className="w-3 h-3" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    hoverBg: 'hover:bg-orange-200',
    confirmTitle: 'Terminar Produção',
    confirmMessage: 'Confirma o término da produção desta etapa?',
  },
  registrar_avanco: {
    action: 'registrar_avanco',
    label: 'Avançar',
    icon: <ArrowRight className="w-3 h-3" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    hoverBg: 'hover:bg-purple-200',
    confirmTitle: 'Registrar Avanço',
    confirmMessage: 'Confirma o registro de avanço (validação do planejamento)?',
  },
  aprovar_fiscalizacao: {
    action: 'aprovar_fiscalizacao',
    label: 'Aprovar',
    icon: <CheckCircle className="w-3 h-3" />,
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    hoverBg: 'hover:bg-green-200',
    confirmTitle: 'Aprovar Fiscalização',
    confirmMessage: 'Confirma a aprovação final pela fiscalização?',
  },
  rejeitar: {
    action: 'rejeitar',
    label: 'Rejeitar',
    icon: <XCircle className="w-3 h-3" />,
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    hoverBg: 'hover:bg-red-200',
    confirmTitle: 'Rejeitar Etapa',
    confirmMessage: 'Informe o motivo da rejeição:',
    requiresObservation: true,
  },
};

const statusLabels: Record<WorkflowStatus, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: 'text-gray-600', bg: 'bg-gray-100' },
  programado: { label: 'Programado', color: 'text-blue-600', bg: 'bg-blue-100' },
  em_producao: { label: 'Em Produção', color: 'text-amber-600', bg: 'bg-amber-100' },
  producao_concluida: { label: 'Prod. Concluída', color: 'text-orange-600', bg: 'bg-orange-100' },
  avancado: { label: 'Avançado', color: 'text-purple-600', bg: 'bg-purple-100' },
  aprovado: { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-100' },
  rejeitado: { label: 'Rejeitado', color: 'text-red-600', bg: 'bg-red-100' },
};

export const WorkflowStatusBadge: React.FC<{ status: WorkflowStatus }> = ({ status }) => {
  const config = statusLabels[status];
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg}`}>
      {config.label}
    </span>
  );
};

export const WorkflowActionButtons: React.FC<WorkflowActionButtonsProps> = ({
  etapaId,
  itemId,
  criterioEtapaId,
  status,
  onActionComplete,
  usuarioId,
  userProfile,
  compact = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<WorkflowAction | null>(null);
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const validActions = useMemo(() => {
    const baseActions = takeoffItemEtapasService.getValidWorkflowActions(status);
    
    return baseActions.filter(action => {
      const check = workflowPermissionsService.canExecuteAction(action, userProfile);
      return check.allowed;
    });
  }, [status, userProfile]);

  const checkPermissionAndShowConfirm = (action: WorkflowAction) => {
    const check = workflowPermissionsService.validateWorkflowTransition(status, action, userProfile);
    if (!check.allowed) {
      setPermissionError(check.reason || 'Sem permissão para esta ação');
      return;
    }
    setPermissionError(null);
    setShowConfirm(action);
  };

  const handleAction = async (action: WorkflowAction) => {
    const config = actionConfigs[action];
    if (config.requiresObservation && !observacao.trim()) {
      setError('O motivo é obrigatório');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let targetEtapaId = etapaId;

      if (!targetEtapaId && itemId && criterioEtapaId) {
        const created = await takeoffItemEtapasService.createOrUpdateEtapa({
          itemId,
          etapaId: criterioEtapaId,
          concluido: false,
        });
        if (created?.id) {
          targetEtapaId = created.id;
        } else {
          throw new Error('Não foi possível criar o registro de etapa');
        }
      }

      if (!targetEtapaId) {
        throw new Error('ID da etapa não encontrado');
      }

      const result = await takeoffItemEtapasService.executeWorkflowAction(
        targetEtapaId,
        action,
        usuarioId,
        observacao || undefined,
        userProfile
      );

      if (result.success) {
        setShowConfirm(null);
        setObservacao('');
        onActionComplete();
      } else {
        setError(result.error || 'Erro ao executar ação');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'aprovado') {
    return <WorkflowStatusBadge status={status} />;
  }

  return (
    <>
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 flex-wrap">
          <WorkflowStatusBadge status={status} />
          {validActions.filter(a => a !== 'rejeitar').map((action) => {
            const config = actionConfigs[action];
            return (
              <button
                key={action}
                onClick={() => checkPermissionAndShowConfirm(action)}
                disabled={isLoading}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${config.color} ${config.bgColor} ${config.hoverBg}`}
                title={config.label}
              >
                {compact ? config.icon : (
                  <>
                    {config.icon}
                    {config.label}
                  </>
                )}
              </button>
            );
          })}
          {validActions.includes('rejeitar') && (
            <button
              onClick={() => checkPermissionAndShowConfirm('rejeitar')}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors text-red-700 bg-red-100 hover:bg-red-200"
              title="Rejeitar"
            >
              <XCircle className="w-3 h-3" />
            </button>
          )}
        </div>
        {permissionError && (
          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <AlertCircle className="w-3 h-3" />
            {permissionError}
          </div>
        )}
      </div>

      {showConfirm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
          onClick={() => {
            setShowConfirm(null);
            setObservacao('');
            setError(null);
          }}
        >
          <div 
            className="rounded-lg shadow-xl max-w-md w-full mx-4"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-lg font-semibold theme-text">
                {actionConfigs[showConfirm].confirmTitle}
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="theme-text-secondary">
                {actionConfigs[showConfirm].confirmMessage}
              </p>
              
              <div>
                <label className="block text-sm font-medium theme-text mb-1">
                  {actionConfigs[showConfirm].requiresObservation ? 'Motivo *' : 'Observação (opcional)'}
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder={actionConfigs[showConfirm].requiresObservation ? 'Informe o motivo...' : 'Adicione uma observação...'}
                  className="w-full px-3 py-2 rounded theme-text"
                  style={{
                    backgroundColor: 'var(--color-surface-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                  rows={3}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => {
                  setShowConfirm(null);
                  setObservacao('');
                  setError(null);
                }}
                className="px-4 py-2 text-sm rounded theme-text"
                style={{ backgroundColor: 'var(--color-surface-secondary)' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction(showConfirm)}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded text-white ${
                  showConfirm === 'rejeitar' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  actionConfigs[showConfirm].icon
                )}
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WorkflowActionButtons;
