/**
 * Componente Gantt Chart
 * Wrapper para VisionPlan Gantt (baseado em Frappe Gantt)
 */

import React, { useMemo } from 'react';
import { ViewMode } from 'gantt-task-react';
import { TaskGantt } from '../../../types/cronograma';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { VPGanttChart } from '../../../lib/gantt';
import { createGanttAdapter } from '../../../lib/gantt/adapter';
import type { VPGanttTask, VPGanttConfig } from '../../../lib/gantt/types';

interface GanttChartProps {
  tasks: TaskGantt[];
  viewMode: ViewMode;
  onTaskChange: (task: TaskGantt) => void;
  onTaskDelete: (task: TaskGantt) => void;
  onTaskDoubleClick?: (task: TaskGantt) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  viewMode,
  onTaskChange,
  onTaskDelete,
  onTaskDoubleClick,
}) => {
  const { configuracoes, atividades } = useCronogramaStore();
  const adapter = useMemo(() => createGanttAdapter(), []);

  // Converte tasks do formato antigo para VPGanttTask
  const vpTasks: VPGanttTask[] = useMemo(() => {
    return tasks.map((task) => {
      // Encontra a atividade original para pegar mais informações
      const atividade = atividades.find((a) => a.id === task.id);
      
      return {
        id: task.id,
        name: task.name,
        start: task.start,
        end: task.end,
        progress: task.progress,
        dependencies: task.dependencies,
        parent: (task as any).project,
        
        // Dados customizados
        tipo: atividade?.tipo || 'Tarefa',
        status: atividade?.status || task.status || '',
        responsavel: atividade?.responsavel_nome || task.responsavel,
        e_critica: atividade?.e_critica || task.e_critica,
        duracao_horas: atividade?.duracao_horas,
        codigo: atividade?.codigo,
      };
    });
  }, [tasks, atividades]);

  // Mapeia ViewMode para string
  const getViewModeString = (mode: ViewMode): string => {
    switch (mode) {
      case ViewMode.Hour:
        return 'Hour';
      case ViewMode.Day:
        return 'Day';
      case ViewMode.Week:
        return 'Week';
      case ViewMode.Month:
        return 'Month';
      case ViewMode.Year:
        return 'Year';
      default:
        return 'Day';
    }
  };

  // Configuração do VP Gantt
  const vpConfig: VPGanttConfig = {
    view_mode: getViewModeString(viewMode),
    language: 'pt',
    readonly: false,
    
    // Callbacks
    on_click: (task) => {
      if (onTaskDoubleClick) {
        // Converte de volta para TaskGantt
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          onTaskDoubleClick(originalTask);
        }
      }
    },
    
    on_date_change: (task, start, end) => {
      if (onTaskChange) {
        // Converte de volta para TaskGantt e chama callback
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          onTaskChange({
            ...originalTask,
            start,
            end,
          });
        }
      }
    },
    
    on_progress_change: (task, progress) => {
      if (onTaskChange) {
        const originalTask = tasks.find((t) => t.id === task.id);
        if (originalTask) {
          onTaskChange({
            ...originalTask,
            progress,
          });
        }
      }
    },
  };

  if (vpTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Nenhuma atividade para exibir</p>
        </div>
      </div>
    );
  }

  return <VPGanttChart tasks={vpTasks} config={vpConfig} />;
};

