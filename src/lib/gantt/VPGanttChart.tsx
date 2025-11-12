/**
 * VisionPlan Gantt Chart
 * Wrapper React profissional para DHTMLX Gantt
 */

import React, { useEffect, useMemo, useRef } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { VPGanttTask, VPGanttConfig } from './types';
import { useCronogramaStore } from '../../stores/cronogramaStore';
import { formatarData } from '../../utils/dateFormatter';
import { ConfiguracoesProjeto, FormatoData } from '../../types/cronograma';
import './vp-gantt.css';
import { attachColumnDragAndResize } from './columnInteractions';
import { attachGridResizer, GridResizerHandle } from './gridResizer';
import { initializeAllExtensions } from './extensions';

interface VPGanttChartProps {
  tasks: VPGanttTask[];
  config?: VPGanttConfig;
}

export const VPGanttChart: React.FC<VPGanttChartProps> = ({ tasks, config = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);
  const { configuracoes, setConfiguracoes } = useCronogramaStore();

  const taskLookup = useMemo(() => {
    const map = new Map<
      string,
      {
        codigo?: string;
        nome: string;
      }
    >();

    tasks.forEach((task) => {
      map.set(task.id, {
        codigo: task.codigo,
        nome: task.name,
      });
    });

    return map;
  }, [tasks]);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('VPGantt: container não encontrado');
      return;
    }

    // Configuração base
    gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
    gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';

    const viewMode = config.view_mode || 'Day';
    configureScale(viewMode, configuracoes);

    // Layout
    gantt.config.show_grid = configuracoes.mostrar_grid;
    gantt.config.show_chart = true;
    gantt.config.grid_width = configuracoes.largura_grid;
    gantt.config.row_height = configuracoes.altura_linha;
    gantt.config.scale_height = configuracoes.escala_sub === 'none' ? 42 : 60;
    gantt.config.show_today = configuracoes.mostrar_linha_hoje;
    gantt.config.duration_unit = configuracoes.escala_topo === 'hour' ? 'hour' : 'day';

    // ========================================================================
    // WBS CODES - Função para calcular códigos EDT automaticamente
    // ========================================================================
    const calculateWBSCode = (task: any): string => {
      if (!task) return '';
      
      // Se já tem EDT definido, use-o
      if (task.edt) return task.edt;
      
      try {
        // Se não tem pai, é raiz
        if (!task.parent || task.parent === 0 || task.parent === '0') {
          const rootIndex = gantt.getGlobalTaskIndex(task.id) + 1;
          return `${rootIndex}`;
        }
        
        // Tem pai, calcular baseado no pai
        const parent = gantt.getTask(task.parent);
        const parentWBS = calculateWBSCode(parent);
        
        // Encontrar índice entre irmãos
        const siblings = gantt.getChildren(task.parent);
        const siblingIndex = siblings.indexOf(task.id) + 1;
        
        return `${parentWBS}.${siblingIndex}`;
      } catch (e) {
        return '';
      }
    };

    // Colunas
    // Configuração de colunas baseada em configuracoes.colunas
    const templateMap: Record<string, (task: any) => string> = {
      text: (task: any) => {
        const icon = task.tipo === 'Fase' ? '📁' : task.tipo === 'Marco' ? '📍' : '📋';
        const codigo = configuracoes.mostrar_codigo_atividade && task.codigo ? `${task.codigo} - ` : '';
        return `<span style="font-weight:${task.tipo === 'Fase' ? '600' : '400'}">${icon} ${codigo}${task.text}</span>`;
      },
      edt: (task: any) => {
        // Tenta usar o EDT definido, senão calcula automaticamente
        if (task.edt) return task.edt;
        try {
          return calculateWBSCode(task);
        } catch (e) {
          return '';
        }
      },
      start_date: (task: any) => formatarData(task.start_date, configuracoes.formato_data_tabela),
      end_date: (task: any) => formatarData(task.end_date, configuracoes.formato_data_tabela),
      duration: (task: any) => {
        if (task.duracao_horas !== undefined && task.duracao_horas !== null) {
          return `${task.duracao_horas} h`;
        }
        return `${task.duration} d`;
      },
      progress: (task: any) => {
        if (configuracoes.mostrar_progresso_percentual) {
          return `${Math.round(task.progress * 100)}%`;
        }
        return '';
      },
    };

    // Colunas padrão caso não estejam definidas
    const colunasConfig = configuracoes.colunas || [
      { field: 'text', label: 'Nome', width: 200, align: 'left', tree: true },
      { field: 'edt', label: 'EDT', width: 80, align: 'left', tree: false },
      { field: 'start_date', label: 'Início', width: 100, align: 'center', tree: false },
      { field: 'end_date', label: 'Fim', width: 100, align: 'center', tree: false },
      { field: 'duration', label: 'Duração', width: 80, align: 'center', tree: false },
      { field: 'progress', label: 'Progresso', width: 80, align: 'center', tree: false },
    ];

    const columns: any[] = colunasConfig.map((col) => ({
      name: col.field,
      label: col.label,
      width: col.width,
      align: col.align || 'left',
      tree: col.tree || false,
      template: templateMap[col.field] || ((task: any) => task[col.field] || ''),
    }));

    // Adiciona colunas de predecessores e sucessores se configurado
    if (configuracoes.mostrar_coluna_predecessores) {
      const existePredecessor = columns.some((c) => c.name === 'predecessores');
      if (!existePredecessor) {
        columns.push({
          name: 'predecessores',
          label: 'Predecessoras',
          width: 160,
          template: (task: any) => getRelacoesTexto(task, 'predecessor', taskLookup),
        });
      }
    }

    if (configuracoes.mostrar_coluna_sucessores) {
      const existeSucessor = columns.some((c) => c.name === 'sucessores');
      if (!existeSucessor) {
        columns.push({
          name: 'sucessores',
          label: 'Sucessoras',
          width: 160,
          template: (task: any) => getRelacoesTexto(task, 'sucessor', taskLookup),
        });
      }
    }

    gantt.config.columns = columns;

    // Comportamento
    const readonly = config.readonly ?? !configuracoes.permitir_edicao_drag;
    const dragEnabled = !readonly && configuracoes.permitir_edicao_drag;

    gantt.config.readonly = readonly;
    gantt.config.drag_move = dragEnabled;
    gantt.config.drag_resize = dragEnabled;
    gantt.config.drag_progress = dragEnabled;
    gantt.config.drag_links = dragEnabled && configuracoes.mostrar_links;
    gantt.config.details_on_dblclick = true;
    gantt.config.details_on_create = true;

    gantt.config.auto_scheduling = configuracoes.habilitar_auto_scheduling;
    gantt.config.auto_scheduling_strict = configuracoes.habilitar_auto_scheduling;
    gantt.config.show_links = configuracoes.mostrar_links;
    gantt.config.highlight_critical_path = configuracoes.destacar_caminho_critico;

    // Tooltips
    gantt.templates.tooltip_text = (start, end, task) => `
      <div class="vp-dhx-tooltip">
        <div class="vp-dhx-tooltip-title">${task.text}</div>
        <div class="vp-dhx-tooltip-body">
          <div><strong>Início:</strong> ${formatarData(start, configuracoes.formato_data_tooltip)}</div>
          <div><strong>Fim:</strong> ${formatarData(end, configuracoes.formato_data_tooltip)}</div>
          ${configuracoes.mostrar_progresso_percentual ? `<div><strong>Progresso:</strong> ${Math.round(task.progress * 100)}%</div>` : ''}
          ${task.responsavel ? `<div><strong>Responsável:</strong> ${task.responsavel}</div>` : ''}
          ${task.status ? `<div><strong>Status:</strong> ${task.status}</div>` : ''}
          ${task.e_critica ? '<div class="vp-critical-badge">⚠️ Atividade Crítica</div>' : ''}
        </div>
      </div>
    `;

    // Templates
    gantt.templates.task_class = (_start: Date, _end: Date, task: any) => {
      const classes = ['vp-gantt-task'];
      if (task.e_critica) classes.push('vp-critical');
      if (task.progress === 1) classes.push('vp-completed');
      if (task.status === 'Atrasada') classes.push('vp-delayed');
      if (task.tipo === 'Fase') classes.push('vp-phase');
      if (task.tipo === 'Marco') classes.push('vp-milestone');
      return classes.join(' ');
    };

    gantt.templates.task_text = configuracoes.mostrar_rotulo_barras
      ? (_start: Date, _end: Date, task: any) => {
          if (task.tipo === 'Marco') return '◆';
          const codigo = configuracoes.mostrar_codigo_atividade && task.codigo ? `${task.codigo} - ` : '';
          const base = `${codigo}${task.text}`;
          return configuracoes.mostrar_progresso_percentual ? `${base} (${Math.round(task.progress * 100)}%)` : base;
        }
      : () => '';

    gantt.templates.progress_text = configuracoes.mostrar_progresso_percentual
      ? (_start: Date, _end: Date, task: any) => `${Math.round(task.progress * 100)}%`
      : () => '';

    // Locale
    configurePtBrLocale();
    applyCustomColors(configuracoes);
    
    // Inicializa TODAS as extensões do DHTMLX Gantt
    initializeAllExtensions(configuracoes);
    
    // ========================================================================
    // WBS CODES - Configuração adicional
    // ========================================================================
    gantt.config.wbs_code_separator = '.';

    gantt.config.layout = {
      css: 'vp-gantt-layout',
      cols: [
        {
          width: configuracoes.largura_grid,
          min_width: 240,
          rows: [
            { view: 'grid', scrollX: 'gridScroll', scrollY: 'scrollVer' },
            { view: 'scrollbar', id: 'gridScroll', group: 'horizontal' },
          ],
        },
        { view: 'resizer', width: 6 },
        {
          rows: [
            { view: 'timeline', scrollX: 'scrollHor', scrollY: 'scrollVer' },
            { view: 'scrollbar', id: 'scrollHor', group: 'horizontal' },
          ],
        },
        { view: 'scrollbar', id: 'scrollVer' },
      ],
    };

    if (!isInitialized.current) {
      gantt.init(containerRef.current);
      isInitialized.current = true;
    }

    const ganttData = convertToGanttData(tasks);
    gantt.clearAll();
    gantt.parse(ganttData);

    // Atualizar WBS Codes automaticamente após carregar dados
    gantt.eachTask((task: any) => {
      if (!task.edt) {
        task.edt = calculateWBSCode(task);
      }
    });

    let detachColumnInteractions: () => void = () => {};
    let gridResizerHandle: GridResizerHandle | null = null;

    const refreshColumns = () => {
      gantt.config.columns = columns;
      gantt.render();
      requestAnimationFrame(() => {
        detachColumnInteractions();
        detachColumnInteractions = attachColumnDragAndResize({
          container: containerRef.current,
          columns,
          onChange: refreshColumns,
          resizerClass: 'vp-column-resizer',
        });
        gridResizerHandle?.update();
      });
    };

    detachColumnInteractions = attachColumnDragAndResize({
      container: containerRef.current,
      columns,
      onChange: refreshColumns,
      resizerClass: 'vp-column-resizer',
    });

    gridResizerHandle = attachGridResizer({
      container: containerRef.current,
      minWidth: 260,
      getWidth: () => gantt.config.grid_width,
      setWidth: (width) => {
        const normalized = Math.round(width);
        if (Math.abs(normalized - gantt.config.grid_width) < 1) return;
        gantt.config.grid_width = normalized;
        refreshColumns();
        setConfiguracoes({ largura_grid: normalized });
        updateGridWidthFromDom();
      },
      resizerClass: 'vp-grid-resizer',
    });

    if (configuracoes.auto_calcular_progresso) {
      recalcularProgressoProjetos();
    }

    if (configuracoes.expandir_grupos) {
      gantt.eachTask((task: any) => gantt.open(task.id));
    } else {
      gantt.eachTask((task: any) => {
        if (gantt.hasChild(task.id)) {
          gantt.close(task.id);
        }
      });
    }

    const onTaskClick = gantt.attachEvent('onTaskClick', (id: string) => {
      const vpTask = tasks.find((t) => t.id === id);
      if (vpTask && config.on_click) {
        config.on_click(vpTask);
      }
      return true;
    });

    const onAfterTaskDrag = gantt.attachEvent('onAfterTaskDrag', (id: string) => {
      const task = gantt.getTask(id);
      const vpTask = tasks.find((t) => t.id === id);
      if (vpTask && config.on_date_change) {
        config.on_date_change(vpTask, task.start_date, task.end_date);
      }
      if (configuracoes.auto_calcular_progresso) {
        recalcularProgressoProjetos();
      }
    });

    const onAfterTaskUpdate = gantt.attachEvent('onAfterTaskUpdate', (id: string) => {
      const task = gantt.getTask(id);
      const vpTask = tasks.find((t) => t.id === id);
      if (vpTask && config.on_progress_change) {
        config.on_progress_change(vpTask, task.progress * 100);
      }
      if (configuracoes.auto_calcular_progresso) {
        recalcularProgressoProjetos();
      }
    });

    const updateGridWidthFromDom = () => {
      const gridEl = containerRef.current?.querySelector<HTMLElement>('.gantt_grid');
      if (!gridEl) return;
      const width = Math.round(gridEl.clientWidth);
      if (width && Math.abs(width - configuracoes.largura_grid) > 2) {
        setConfiguracoes({ largura_grid: width });
      }
    };

    const gridResizeEvent = gantt.attachEvent('onGridResize', () => {
      updateGridWidthFromDom();
    });

    const layoutResizeEvent = gantt.attachEvent('onLayoutResize', () => {
      updateGridWidthFromDom();
    });

    return () => {
      gantt.detachEvent(onTaskClick);
      gantt.detachEvent(onAfterTaskDrag);
      gantt.detachEvent(onAfterTaskUpdate);
      gantt.detachEvent(gridResizeEvent);
      gantt.detachEvent(layoutResizeEvent);
      detachColumnInteractions();
      gridResizerHandle?.dispose();
      gantt.clearAll();
    };
  }, [tasks, config, configuracoes, taskLookup]);

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
// HELPERS
// ============================================================================

function configureScale(viewMode: string, configuracoes: ConfiguracoesProjeto) {
  const unit = configuracoes.escala_topo || mapViewModeToUnit(viewMode);
  const sub = configuracoes.escala_sub;

  gantt.config.scale_unit = unit;
  gantt.config.date_scale = mapFormatoDataToDhtmlx(configuracoes.formato_data_gantt) || getDefaultScaleFormat(unit);
  gantt.config.step = 1;

  if (sub && sub !== 'none') {
    gantt.config.subscales = [
      {
        unit: sub,
        step: 1,
        date: getDefaultSubScaleFormat(sub),
      },
    ];
  } else {
    gantt.config.subscales = [];
  }
}

function mapViewModeToUnit(viewMode: string): 'hour' | 'day' | 'week' | 'month' | 'year' {
  switch (viewMode) {
    case 'Hour':
      return 'day';
    case 'Day':
      return 'week';
    case 'Week':
      return 'month';
    case 'Month':
      return 'year';
    case 'Year':
      return 'year';
    default:
      return 'week';
  }
}

function configurePtBrLocale() {
  gantt.locale = {
    date: {
      month_full: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      month_short: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      day_full: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      day_short: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
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
      column_text: 'Nome da tarefa',
      column_start_date: 'Início',
      column_duration: 'Duração',
      column_add: '',
      link: 'Ligação',
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
      years: 'Anos',
    },
  };
}

function convertToGanttData(tasks: VPGanttTask[]) {
  const data = tasks.map((task) => ({
    id: task.id,
    text: task.name,
    edt: task.edt,
    start_date: formatDateForDHTMLX(task.start),
    end_date: formatDateForDHTMLX(task.end),
    duration: calculateDuration(task),
    progress: task.progress / 100,
    parent: task.parent || 0,
    type: task.tipo === 'Marco' ? 'milestone' : task.tipo === 'Fase' ? 'project' : 'task',
    tipo: task.tipo,
    status: task.status,
    responsavel: task.responsavel,
    e_critica: task.e_critica,
    codigo: task.codigo,
    duracao_horas: task.duracao_horas,
  }));

  const links: any[] = [];
  let linkId = 1;

  tasks.forEach((task) => {
    if (task.dependencies?.length) {
      task.dependencies.forEach((depId) => {
        links.push({
          id: linkId++,
          source: depId,
          target: task.id,
          type: '0',
        });
      });
    }
  });

  return { data, links };
}

function formatDateForDHTMLX(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function calculateDuration(task: VPGanttTask): number {
  if (task.duracao_horas !== undefined && task.duracao_horas !== null) {
    return Math.max(Math.round((task.duracao_horas / 24) * 100) / 100, 0.1);
  }

  const diffTime = Math.abs(task.end.getTime() - task.start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

function applyCustomColors(configuracoes: ConfiguracoesProjeto) {
  let styleEl = document.getElementById('vp-dhx-custom-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'vp-dhx-custom-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    .gantt_task_line.vp-gantt-task {
      background-color: ${configuracoes.cor_tarefa_normal};
      border-color: ${configuracoes.cor_tarefa_normal};
    }
    .gantt_task_line.vp-critical {
      background-color: ${configuracoes.cor_tarefa_critica};
      border-color: ${configuracoes.cor_tarefa_critica};
      border-width: 2px;
    }
    .gantt_task_line.vp-completed {
      background-color: ${configuracoes.cor_tarefa_concluida};
      border-color: ${configuracoes.cor_tarefa_concluida};
      opacity: 0.85;
    }
    .gantt_task_line.vp-milestone {
      background-color: ${configuracoes.cor_marco};
      border-color: ${configuracoes.cor_marco};
    }
    .gantt_task_line.vp-phase {
      background-color: ${configuracoes.cor_fase};
      border-color: ${configuracoes.cor_fase};
    }
  `;
}

function getRelacoesTexto(task: any, tipo: 'predecessor' | 'sucessor', lookup: Map<string, { codigo?: string; nome: string }>) {
  try {
    const linksIds = tipo === 'predecessor' ? task.$target : task.$source;
    if (!linksIds || !linksIds.length) {
      return '-';
    }

    const nomes = linksIds
      .map((linkId: string) => gantt.getLink(linkId))
      .map((link: any) => {
        const relacaoTaskId = tipo === 'predecessor' ? link.source : link.target;
        const info = lookup.get(relacaoTaskId);
        if (info) {
          return info.codigo || info.nome;
        }
        const relacaoTask = gantt.isTaskExists(relacaoTaskId) ? gantt.getTask(relacaoTaskId) : null;
        return relacaoTask ? relacaoTask.text : relacaoTaskId;
      })
      .filter(Boolean);

    return nomes.length ? nomes.join(', ') : '-';
  } catch (error) {
    console.error('VPGantt: erro ao obter relações', error);
    return '-';
  }
}

function recalcularProgressoProjetos() {
  gantt.batchUpdate(() => {
    const ids: string[] = [];
    gantt.eachTask((task) => ids.push(task.id));
    ids.reverse().forEach((id) => {
      const task = gantt.getTask(id);
      if (task.type !== 'project') return;

      const children = gantt.getChildren(id);
      if (!children.length) return;

      const total = children.reduce((acc, childId) => {
        const child = gantt.getTask(childId);
        return acc + (child.progress || 0);
      }, 0);

      task.progress = total / children.length;
      gantt.updateTask(id);
    });
  });
}

function mapFormatoDataToDhtmlx(formato: FormatoData): string | null {
  const raw = formato
    .replace(/\[|\]/g, '')
    .replace(/dddd/g, '%l')
    .replace(/ddd/g, '%D')
    .replace(/DD/g, '%d')
    .replace(/MMMM/g, '%F')
    .replace(/MMM/g, '%M')
    .replace(/MM/g, '%m')
    .replace(/YYYY/g, '%Y')
    .replace(/YY/g, '%y')
    .replace(/HH/g, '%H')
    .replace(/hh/g, '%H')
    .replace(/mm/g, '%i');

  return raw.includes('%') ? raw : null;
}

function getDefaultScaleFormat(unit: string): string {
  switch (unit) {
    case 'hour':
      return '%d %M';
    case 'day':
      return '%d %M';
    case 'week':
      return 'Semana %W';
    case 'month':
      return '%F %Y';
    case 'year':
      return '%Y';
    default:
      return '%d %M';
  }
}

function getDefaultSubScaleFormat(unit: string): string {
  switch (unit) {
    case 'minute':
      return '%H:%i';
    case 'hour':
      return '%H:%i';
    case 'day':
      return '%d %M';
    case 'week':
      return 'S%W';
    case 'month':
      return '%M %Y';
    default:
      return '%d %M';
  }
}

