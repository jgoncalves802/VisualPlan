/**
 * VisionPlan Gantt Chart
 * Componente React wrapper para Frappe Gantt
 */

import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import { VPGanttTask, VPGanttConfig } from './types';
import { useCronogramaStore } from '../../stores/cronogramaStore';
import { formatarData } from '../../utils/dateFormatter';
import './vp-gantt.css';

interface VPGanttChartProps {
  tasks: VPGanttTask[];
  config?: VPGanttConfig;
}

export const VPGanttChart: React.FC<VPGanttChartProps> = ({ tasks, config = {} }) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<any>(null);
  const { configuracoes } = useCronogramaStore();

  useEffect(() => {
    if (!svgRef.current || tasks.length === 0) {
      console.log('VPGantt: Não pode renderizar', { 
        hasContainer: !!svgRef.current, 
        tasksCount: tasks.length 
      });
      return;
    }

    // Limpa Gantt anterior se existir
    if (ganttRef.current) {
      svgRef.current.innerHTML = '';
    }

    // Prepara tasks para o Frappe Gantt
    const frappeTasks = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      start: formatDateForFrappe(task.start),
      end: formatDateForFrappe(task.end),
      progress: task.progress,
      dependencies: task.dependencies?.join(', ') || '',
      custom_class: task.custom_class || '',
    }));

    console.log('VPGantt: Preparando renderização', {
      tasksCount: frappeTasks.length,
      firstTask: frappeTasks[0],
      container: svgRef.current,
      viewMode: config.view_mode || 'Day'
    });

    try {
      // Cria instância do Frappe Gantt
      ganttRef.current = new Gantt(svgRef.current, frappeTasks, {
        view_mode: mapViewMode(config.view_mode || 'Day'),
        language: config.language || 'pt',
        
        // Callbacks
        on_click: (task: any) => {
          const vpTask = tasks.find((t) => t.id === task.id);
          if (vpTask && config.on_click) {
            config.on_click(vpTask);
          }
        },
        
        on_date_change: (task: any, start: Date, end: Date) => {
          const vpTask = tasks.find((t) => t.id === task.id);
          if (vpTask && config.on_date_change) {
            config.on_date_change(vpTask, start, end);
          }
        },
        
        on_progress_change: (task: any, progress: number) => {
          const vpTask = tasks.find((t) => t.id === task.id);
          if (vpTask && config.on_progress_change) {
            config.on_progress_change(vpTask, progress);
          }
        },
        
        on_view_change: (mode: string) => {
          if (config.on_view_change) {
            config.on_view_change(mode);
          }
        },
        
        // Customização de popup/tooltip
        popup_trigger: 'hover',
        custom_popup_html: (task: any) => {
          const vpTask = tasks.find((t) => t.id === task.id);
          if (!vpTask) return '';

          return `
            <div class="vp-gantt-popup">
              <div class="vp-gantt-popup-title">${vpTask.name}</div>
              <div class="vp-gantt-popup-details">
                <div class="vp-gantt-popup-row">
                  <span class="vp-gantt-popup-label">Início:</span>
                  <span class="vp-gantt-popup-value">${formatarData(
                    vpTask.start,
                    configuracoes.formato_data_tooltip
                  )}</span>
                </div>
                <div class="vp-gantt-popup-row">
                  <span class="vp-gantt-popup-label">Fim:</span>
                  <span class="vp-gantt-popup-value">${formatarData(
                    vpTask.end,
                    configuracoes.formato_data_tooltip
                  )}</span>
                </div>
                <div class="vp-gantt-popup-row">
                  <span class="vp-gantt-popup-label">Progresso:</span>
                  <span class="vp-gantt-popup-value">${vpTask.progress}%</span>
                </div>
                ${
                  vpTask.responsavel
                    ? `
                  <div class="vp-gantt-popup-row">
                    <span class="vp-gantt-popup-label">Responsável:</span>
                    <span class="vp-gantt-popup-value">${vpTask.responsavel}</span>
                  </div>
                `
                    : ''
                }
                ${
                  vpTask.status
                    ? `
                  <div class="vp-gantt-popup-row">
                    <span class="vp-gantt-popup-label">Status:</span>
                    <span class="vp-gantt-popup-value">${vpTask.status}</span>
                  </div>
                `
                    : ''
                }
                ${
                  vpTask.e_critica
                    ? `
                  <div class="vp-gantt-popup-row">
                    <span class="vp-gantt-popup-label vp-critical-label">⚠️ Atividade Crítica</span>
                  </div>
                `
                    : ''
                }
              </div>
            </div>
          `;
        },
      });

      // Aplica estilos customizados baseados nas configurações
      applyCustomStyles(configuracoes);
      
      console.log('VPGantt: Renderizado com sucesso!', {
        ganttInstance: ganttRef.current,
        container: svgRef.current
      });
    } catch (error) {
      console.error('VPGantt: Erro ao criar Gantt:', error);
      console.error('VPGantt: Tasks que tentou renderizar:', frappeTasks);
      console.error('VPGantt: Config:', config);
    }

    // Cleanup
    return () => {
      if (svgRef.current) {
        svgRef.current.innerHTML = '';
      }
    };
  }, [tasks, config, configuracoes]);

  // Se não há tasks, mostra mensagem
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
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
          <p className="text-lg font-medium">Nenhuma atividade para exibir</p>
          <p className="text-sm mt-1">Adicione atividades para visualizar o cronograma</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vp-gantt-container">
      <div ref={svgRef} className="vp-gantt-svg"></div>
    </div>
  );
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formata data para o formato que Frappe Gantt espera
 */
function formatDateForFrappe(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Mapeia view mode do VisionPlan para Frappe Gantt
 */
function mapViewMode(mode: string): string {
  const modeMap: Record<string, string> = {
    Hour: 'Hour',
    Day: 'Day',
    Week: 'Week',
    Month: 'Month',
    Year: 'Year',
  };
  return modeMap[mode] || 'Day';
}

/**
 * Aplica estilos customizados baseados nas configurações
 */
function applyCustomStyles(configuracoes: any) {
  // Cria ou atualiza style tag com cores customizadas
  let styleEl = document.getElementById('vp-gantt-custom-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'vp-gantt-custom-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    /* Tarefa normal */
    .vp-gantt-container .bar {
      fill: ${configuracoes.cor_tarefa_normal} !important;
    }
    
    /* Tarefa crítica */
    .vp-gantt-container .bar.vp-critical {
      fill: ${configuracoes.cor_tarefa_critica} !important;
    }
    
    /* Tarefa concluída */
    .vp-gantt-container .bar.vp-completed {
      fill: ${configuracoes.cor_tarefa_concluida} !important;
    }
    
    /* Marco */
    .vp-gantt-container .bar.vp-milestone {
      fill: ${configuracoes.cor_marco} !important;
    }
    
    /* Fase/Grupo */
    .vp-gantt-container .bar.vp-phase {
      fill: ${configuracoes.cor_fase} !important;
    }
    
    /* Barra de progresso */
    .vp-gantt-container .bar-progress {
      opacity: 0.8;
    }
  `;
}

