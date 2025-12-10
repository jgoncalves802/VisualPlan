import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  Flag,
  Link2,
  FileText,
  BarChart3,
  Target,
  TrendingUp
} from 'lucide-react';
import type { Task } from '../../../lib/vision-gantt/types';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onEdit?: (taskId: string) => void;
  onManageResources?: (task: Task) => void;
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  onClose,
  onEdit,
  onManageResources
}) => {
  if (!task) return null;

  const getStatusInfo = (status: string) => {
    const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
      not_started: { 
        color: 'text-gray-600', 
        bg: 'bg-gray-100',
        icon: <Clock className="w-4 h-4" />,
        label: 'Não Iniciada'
      },
      in_progress: { 
        color: 'text-blue-600', 
        bg: 'bg-blue-100',
        icon: <Play className="w-4 h-4" />,
        label: 'Em Andamento'
      },
      completed: { 
        color: 'text-green-600', 
        bg: 'bg-green-100',
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Concluída'
      },
      on_hold: { 
        color: 'text-amber-600', 
        bg: 'bg-amber-100',
        icon: <Pause className="w-4 h-4" />,
        label: 'Pausada'
      }
    };
    return statusConfig[status] || statusConfig.not_started;
  };

  const statusInfo = getStatusInfo(task.status);
  const progress = task.progress || 0;
  const isCritical = task.isCritical;
  const isNearCritical = task.isNearCritical;

  const formatDate = (date: Date | undefined) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getDuration = () => {
    if (task.duration) return `${task.duration} dias`;
    if (task.startDate && task.endDate) {
      const diff = Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24));
      return `${diff} dias`;
    }
    return '-';
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 h-full overflow-y-auto shadow-lg">
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate flex-1 mr-2">
            Detalhes da Atividade
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <div className="flex items-start gap-3">
            {task.isGroup ? (
              <div className="p-2 bg-amber-100 rounded-lg mt-0.5">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
            ) : task.isMilestone ? (
              <div className="p-2 bg-purple-100 rounded-lg mt-0.5">
                <Flag className="w-5 h-5 text-purple-600" />
              </div>
            ) : (
              <div className="p-2 bg-blue-100 rounded-lg mt-0.5">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight">
                {task.name}
              </h4>
              {task.wbs && (
                <span className="text-sm text-gray-500 font-mono">EDT: {task.wbs}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>
          {isCritical && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              <AlertCircle className="w-3 h-3" />
              Crítica
            </span>
          )}
          {isNearCritical && !isCritical && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
              <AlertCircle className="w-3 h-3" />
              Quase Crítica
            </span>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso</span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{progress}%</span>
          </div>
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                progress === 100 ? 'bg-green-500' : 
                isCritical ? 'bg-red-500' : 
                'bg-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-500">Início</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(task.startDate)}
            </span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-500">Fim</span>
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(task.endDate)}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-500">Duração</span>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {getDuration()}
          </span>
        </div>

        {(task.totalFloat !== undefined || task.freeFloat !== undefined) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500">Folga Total</span>
              </div>
              <span className={`text-sm font-semibold ${
                (task.totalFloat || 0) <= 0 ? 'text-red-600' : 
                (task.totalFloat || 0) <= 5 ? 'text-orange-600' : 
                'text-gray-900 dark:text-gray-100'
              }`}>
                {task.totalFloat ?? 0} dias
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-medium text-gray-500">Folga Livre</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {task.freeFloat ?? 0} dias
              </span>
            </div>
          </div>
        )}

        {task.assignedResources && task.assignedResources.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-500">Recursos</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {task.assignedResources.map((resource, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700"
                >
                  {resource}
                </span>
              ))}
            </div>
          </div>
        )}

        {(task.predecessors?.length || task.successors?.length) && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-500">Dependências</span>
            </div>
            {task.predecessors && task.predecessors.length > 0 && (
              <div className="mb-2">
                <span className="text-xs text-gray-400">Predecessoras:</span>
                <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">
                  {task.predecessors.join(', ')}
                </span>
              </div>
            )}
            {task.successors && task.successors.length > 0 && (
              <div>
                <span className="text-xs text-gray-400">Sucessoras:</span>
                <span className="text-sm ml-1 text-gray-700 dark:text-gray-300">
                  {task.successors.join(', ')}
                </span>
              </div>
            )}
          </div>
        )}

        {task.bcwp !== undefined && task.acwp !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-gray-500">EVM</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-400">PV</div>
                <div className="text-sm font-semibold">{task.bcws?.toLocaleString() || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">EV</div>
                <div className="text-sm font-semibold">{task.bcwp?.toLocaleString() || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">AC</div>
                <div className="text-sm font-semibold">{task.acwp?.toLocaleString() || '-'}</div>
              </div>
            </div>
            {(task.cpi || task.spi) && (
              <div className="grid grid-cols-2 gap-2 mt-2 text-center border-t border-gray-200 dark:border-gray-600 pt-2">
                <div>
                  <div className="text-xs text-gray-400">CPI</div>
                  <div className={`text-sm font-bold ${(task.cpi || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {task.cpi?.toFixed(2) || '-'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">SPI</div>
                  <div className={`text-sm font-bold ${(task.spi || 0) >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                    {task.spi?.toFixed(2) || '-'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {task.description && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-500">Descrição</span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {(() => {
          const isWbsOrReadOnly = task.isReadOnly || task.isWbsNode || task.id.startsWith('wbs-');
          
          if (isWbsOrReadOnly) {
            return (
              <div className="text-center py-2 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-sm text-amber-700 font-medium">
                  Este item é somente leitura (WBS/EPS)
                </span>
              </div>
            );
          }
          
          return (
            <div className="space-y-2">
              {onManageResources && (
                <button
                  onClick={() => onManageResources(task)}
                  className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Gerenciar Recursos
                </button>
              )}
              {onEdit && (
                <button
                  onClick={() => onEdit(task.id)}
                  className="w-full py-2.5 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  Editar Atividade
                </button>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
