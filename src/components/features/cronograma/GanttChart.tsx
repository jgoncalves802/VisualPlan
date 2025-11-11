/**
 * Componente Gantt Chart
 * Wrapper para gantt-task-react
 */

import React from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';
import { TaskGantt } from '../../../types/cronograma';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { formatarData } from '../../../utils/dateFormatter';

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
  const { configuracoes } = useCronogramaStore();

  if (tasks.length === 0) {
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

  return (
    <div className="gantt-container" style={{ width: '100%', height: '600px', overflow: 'auto' }}>
      <Gantt
        tasks={tasks}
        viewMode={viewMode}
        onDateChange={onTaskChange}
        onDelete={onTaskDelete}
        onDoubleClick={onTaskDoubleClick}
        onProgressChange={onTaskChange}
        listCellWidth="180px"
        columnWidth={viewMode === ViewMode.Month ? 300 : viewMode === ViewMode.Week ? 250 : 60}
        locale="pt-BR"
        // Estilos customizados
        todayColor="rgba(59, 130, 246, 0.3)"
        barProgressColor="#3b82f6"
        barProgressSelectedColor="#1e40af"
        barBackgroundColor="#93c5fd"
        barBackgroundSelectedColor="#3b82f6"
        projectProgressColor="#10b981"
        projectProgressSelectedColor="#059669"
        projectBackgroundColor="#6ee7b7"
        projectBackgroundSelectedColor="#10b981"
        milestoneBackgroundColor="#f59e0b"
        milestoneBackgroundSelectedColor="#d97706"
        // Configurações de interação
        arrowColor="#6b7280"
        arrowIndent={20}
        fontSize="14px"
        fontFamily="'Inter', 'system-ui', sans-serif"
        // Tooltips
        TooltipContent={({ task }) => (
          <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-sm">
            <div className="font-semibold text-sm mb-2">{task.name}</div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Início:</span>
                <span>{formatarData(task.start, configuracoes.formato_data_tooltip)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Fim:</span>
                <span>{formatarData(task.end, configuracoes.formato_data_tooltip)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-300">Progresso:</span>
                <span>{task.progress}%</span>
              </div>
              {task.responsavel && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-300">Responsável:</span>
                  <span>{task.responsavel}</span>
                </div>
              )}
              {task.status && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-300">Status:</span>
                  <span>{task.status}</span>
                </div>
              )}
              {task.e_critica && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                  <svg
                    className="w-4 h-4 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-red-400 font-medium">Atividade Crítica</span>
                </div>
              )}
              {task.folga_total !== undefined && task.folga_total >= 0 && (
                <div className="flex justify-between gap-4 text-gray-300">
                  <span>Folga:</span>
                  <span>{task.folga_total.toFixed(1)} dias</span>
                </div>
              )}
            </div>
          </div>
        )}
      />

      {/* Estilo customizado adicional */}
      <style>{`
        .gantt-container {
          font-family: 'Inter', 'system-ui', sans-serif;
        }

        /* Customiza a lista de tarefas */
        ._taskList {
          border-right: 1px solid #e5e7eb;
        }

        /* Customiza as linhas da grid */
        ._grid {
          border-color: #e5e7eb;
        }

        /* Customiza o header do calendário */
        ._calendarHeader {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        /* Destaque para linha de hoje */
        ._todayHighlight {
          fill: rgba(59, 130, 246, 0.1);
        }

        /* Hover sobre tarefa */
        ._barWrapper:hover ._barBackground {
          opacity: 0.8;
        }

        /* Cursor ao passar sobre tarefa */
        ._bar {
          cursor: pointer;
        }

        /* Setas de dependência */
        ._arrow {
          stroke: #6b7280;
          stroke-width: 1.5;
          fill: none;
        }

        /* Milestone (marco) */
        ._projectTop {
          fill: #f59e0b;
        }

        /* Scrollbars customizados */
        .gantt-container::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .gantt-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .gantt-container::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .gantt-container::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

