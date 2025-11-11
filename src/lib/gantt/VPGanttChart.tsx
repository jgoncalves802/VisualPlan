/**
 * VisionPlan Gantt Chart
 * Componente React wrapper para DHTMLX Gantt
 */

import React, { useEffect, useRef } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { VPGanttTask, VPGanttConfig } from './types';
import { useCronogramaStore } from '../../stores/cronogramaStore';
import { formatarData } from '../../utils/dateFormatter';
import { FormatoData } from '../../types/cronograma';
import './vp-gantt.css';

interface VPGanttChartProps {
  tasks: VPGanttTask[];
  config?: VPGanttConfig;
}

export const VPGanttChart: React.FC<VPGanttChartProps> = ({ tasks, config = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const { configuracoes } = useCronogramaStore();

  useEffect(() => {
    if (!containerRef.current) {
      console.log('VPGantt: Container não disponível');
      return;
    }

    console.log('VPGantt: Inicializando DHTMLX Gantt', {
      tasksCount: tasks.length,
      viewMode: config.view_mode || 'Day',
      container: containerRef.current
    });

    // ========================================================================
    // CONFIGURAÇÃO DO DHTMLX GANTT
    // ========================================================================

    // Configurações básicas
    gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
    gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';
    
    // Escala de tempo
    const viewMode = config.view_mode || 'Day';
    configureScale(viewMode);
    
    // Layout e grid
    gantt.config.show_grid = true;
    gantt.config.show_chart = true;
    gantt.config.grid_width = 350;
    gantt.config.row_height = 32;
    gantt.config.scale_height = 50;
    
    // Colunas da grid
    gantt.config.columns = [
      {
        name: 'text',
        label: 'Atividade',
        width: 200,
        tree: true,
        template: (task: any) => {
          const icon = task.tipo === 'Fase' ? '📁' : task.tipo === 'Marco' ? '📍' : '📋';
          return `<span style="font-weight: ${task.tipo === 'Fase' ? '600' : '400'}">${icon} ${task.text}</span>`;
        }
      },
      {
        name: 'start_date',
        label: 'Início',
        align: 'center',
        width: 80,
        template: (task: any) => formatarData(task.start_date, configuracoes.formato_data_tabela)
      },
      {
        name: 'duration',
        label: 'Duração',
        align: 'center',
        width: 70
      }
    ];
    
    // Comportamento
    gantt.config.readonly = config.readonly || false;
    gantt.config.drag_move = !config.readonly;
    gantt.config.drag_resize = !config.readonly;
    gantt.config.drag_progress = !config.readonly;
    gantt.config.drag_links = !config.readonly;
    gantt.config.details_on_dblclick = true;
    gantt.config.details_on_create = true;
    
    // Auto-scheduling
    gantt.config.auto_scheduling = true;
    gantt.config.auto_scheduling_strict = false;
    
    // Links/Dependencies
    gantt.config.show_links = true;
    gantt.config.highlight_critical_path = true;
    
    // Tooltip
    gantt.templates.tooltip_text = (start, end, task) => {
      return `
        <div class="vp-dhx-tooltip">
          <div class="vp-dhx-tooltip-title">${task.text}</div>
          <div class="vp-dhx-tooltip-body">
            <div><strong>Início:</strong> ${formatarData(start, configuracoes.formato_data_tooltip)}</div>
            <div><strong>Fim:</strong> ${formatarData(end, configuracoes.formato_data_tooltip)}</div>
            <div><strong>Progresso:</strong> ${Math.round(task.progress * 100)}%</div>
            ${task.responsavel ? `<div><strong>Responsável:</strong> ${task.responsavel}</div>` : ''}
            ${task.status ? `<div><strong>Status:</strong> ${task.status}</div>` : ''}
            ${task.e_critica ? '<div class="vp-critical-badge">⚠️ Atividade Crítica</div>' : ''}
          </div>
        </div>
      `;
    };
    
    // Classes CSS customizadas
    gantt.templates.task_class = (start, end, task) => {
      const classes = ['vp-gantt-task'];
      
      if (task.e_critica) classes.push('vp-critical');
      if (task.progress === 1) classes.push('vp-completed');
      if (task.status === 'Atrasada') classes.push('vp-delayed');
      if (task.tipo === 'Fase') classes.push('vp-phase');
      if (task.tipo === 'Marco') classes.push('vp-milestone');
      
      return classes.join(' ');
    };
    
    // Texto nas barras
    gantt.templates.task_text = (start, end, task) => {
      if (task.tipo === 'Marco') return '◆';
      return task.text;
    };
    
    // Locale pt-BR
    configurePtBrLocale();
    
    // Aplicar cores customizadas
    applyCustomColors(configuracoes);
    
    // ========================================================================
    // INICIALIZAÇÃO
    // ========================================================================
    
    if (!isInitialized.current) {
      gantt.init(containerRef.current);
      isInitialized.current = true;
      console.log('VPGantt: DHTMLX Gantt inicializado');
    }
    
    // ========================================================================
    // CARREGAR DADOS
    // ========================================================================
    
    const ganttData = convertToGanttData(tasks);
    
    console.log('VPGantt: Carregando dados', {
      tasksCount: ganttData.data.length,
      linksCount: ganttData.links.length,
      sample: ganttData.data[0]
    });
    
    gantt.clearAll();
    gantt.parse(ganttData);
    
    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    const onTaskClick = gantt.attachEvent('onTaskClick', (id: string) => {
      const task = gantt.getTask(id);
      console.log('VPGantt: Task clicked', task);
      
      // Encontra a task original
      const vpTask = tasks.find(t => t.id === id);
      if (vpTask && config.on_click) {
        config.on_click(vpTask);
      }
      
      return true;
    });
    
    const onAfterTaskDrag = gantt.attachEvent('onAfterTaskDrag', (id: string) => {
      const task = gantt.getTask(id);
      const vpTask = tasks.find(t => t.id === id);
      
      if (vpTask && config.on_date_change) {
        config.on_date_change(vpTask, task.start_date, task.end_date);
      }
    });
    
    const onAfterTaskUpdate = gantt.attachEvent('onAfterTaskUpdate', (id: string) => {
      const task = gantt.getTask(id);
      const vpTask = tasks.find(t => t.id === id);
      
      if (vpTask && config.on_progress_change) {
        config.on_progress_change(vpTask, task.progress * 100);
      }
    });
    
    console.log('VPGantt: Renderizado com sucesso!');
    
    // ========================================================================
    // CLEANUP
    // ========================================================================
    
    return () => {
      gantt.detachEvent(onTaskClick);
      gantt.detachEvent(onAfterTaskDrag);
      gantt.detachEvent(onAfterTaskUpdate);
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
      <div ref={containerRef} className="vp-gantt-chart" style={{ width: '100%', height: '600px' }}></div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Configura a escala de tempo baseada no view mode
 */
function configureScale(viewMode: string) {
  switch (viewMode) {
    case 'Hour':
      gantt.config.scale_unit = 'day';
      gantt.config.date_scale = '%d %M';
      gantt.config.step = 1;
      gantt.config.subscales = [
        { unit: 'hour', step: 1, date: '%H:%i' }
      ];
      break;
    
    case 'Day':
      gantt.config.scale_unit = 'week';
      gantt.config.date_scale = 'Semana %W';
      gantt.config.step = 1;
      gantt.config.subscales = [
        { unit: 'day', step: 1, date: '%d %M' }
      ];
      break;
    
    case 'Week':
      gantt.config.scale_unit = 'month';
      gantt.config.date_scale = '%F %Y';
      gantt.config.step = 1;
      gantt.config.subscales = [
        { unit: 'week', step: 1, date: 'S%W' }
      ];
      break;
    
    case 'Month':
      gantt.config.scale_unit = 'year';
      gantt.config.date_scale = '%Y';
      gantt.config.step = 1;
      gantt.config.subscales = [
        { unit: 'month', step: 1, date: '%M' }
      ];
      break;
    
    case 'Year':
      gantt.config.scale_unit = 'year';
      gantt.config.date_scale = '%Y';
      gantt.config.step = 1;
      break;
    
    default:
      gantt.config.scale_unit = 'week';
      gantt.config.date_scale = 'Semana %W';
      gantt.config.step = 1;
      gantt.config.subscales = [
        { unit: 'day', step: 1, date: '%d %M' }
      ];
  }
}

/**
 * Configura locale pt-BR
 */
function configurePtBrLocale() {
  gantt.locale = {
    date: {
      month_full: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                   'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      month_short: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      day_full: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      day_short: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    },
    labels: {
      new_task: 'Nova Tarefa',
      dhx_cal_today_button: 'Hoje',
      day_tab: 'Dia',
      week_tab: 'Semana',
      month_tab: 'Mês',
      new_event: 'Novo evento',
      icon_save: 'Salvar',
      icon_cancel: 'Cancelar',
      icon_details: 'Detalhes',
      icon_edit: 'Editar',
      icon_delete: 'Deletar',
      confirm_closing: '',
      confirm_deleting: 'Tem certeza que deseja deletar?',
      section_description: 'Descrição',
      section_time: 'Período',
      section_type: 'Tipo',
      column_text: 'Nome da Tarefa',
      column_start_date: 'Início',
      column_duration: 'Duração',
      column_add: '',
      link: 'Link',
      confirm_link_deleting: 'será deletado',
      link_start: '(início)',
      link_end: '(fim)',
      type_task: 'Tarefa',
      type_project: 'Projeto',
      type_milestone: 'Marco',
      minutes: 'Minutos',
      hours: 'Horas',
      days: 'Dias',
      weeks: 'Semanas',
      months: 'Meses',
      years: 'Anos'
    }
  };
}

/**
 * Converte tasks do VisionPlan para formato DHTMLX Gantt
 */
function convertToGanttData(tasks: VPGanttTask[]) {
  const data = tasks.map(task => ({
    id: task.id,
    text: task.name,
    start_date: formatDateForDHTMLX(task.start),
    end_date: formatDateForDHTMLX(task.end),
    duration: calculateDuration(task.start, task.end),
    progress: task.progress / 100, // DHTMLX usa 0-1, não 0-100
    parent: task.parent || 0,
    type: task.tipo === 'Marco' ? 'milestone' : task.tipo === 'Fase' ? 'project' : 'task',
    
    // Dados customizados
    tipo: task.tipo,
    status: task.status,
    responsavel: task.responsavel,
    e_critica: task.e_critica,
    codigo: task.codigo,
    duracao_horas: task.duracao_horas
  }));
  
  // Extrai links/dependências
  const links: any[] = [];
  let linkId = 1;
  
  tasks.forEach(task => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach(depId => {
        links.push({
          id: linkId++,
          source: depId,
          target: task.id,
          type: '0' // Finish-to-Start
        });
      });
    }
  });
  
  return { data, links };
}

/**
 * Formata data para o formato que DHTMLX espera
 */
function formatDateForDHTMLX(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Calcula duração em dias
 */
function calculateDuration(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Aplica cores customizadas
 */
function applyCustomColors(configuracoes: any) {
  // Cria ou atualiza style tag
  let styleEl = document.getElementById('vp-dhx-custom-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'vp-dhx-custom-styles';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = `
    /* Tarefa normal */
    .gantt_task_line.vp-gantt-task {
      background-color: ${configuracoes.cor_tarefa_normal};
      border-color: ${configuracoes.cor_tarefa_normal};
    }
    
    /* Tarefa crítica */
    .gantt_task_line.vp-critical {
      background-color: ${configuracoes.cor_tarefa_critica};
      border-color: ${configuracoes.cor_tarefa_critica};
      border-width: 2px;
    }
    
    /* Tarefa concluída */
    .gantt_task_line.vp-completed {
      background-color: ${configuracoes.cor_tarefa_concluida};
      border-color: ${configuracoes.cor_tarefa_concluida};
      opacity: 0.8;
    }
    
    /* Marco */
    .gantt_task_line.vp-milestone {
      background-color: ${configuracoes.cor_marco};
      border-color: ${configuracoes.cor_marco};
    }
    
    /* Fase/Projeto */
    .gantt_task_line.vp-phase {
      background-color: ${configuracoes.cor_fase};
      border-color: ${configuracoes.cor_fase};
    }
  `;
}
