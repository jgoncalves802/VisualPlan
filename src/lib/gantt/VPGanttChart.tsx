/**
 * VisionPlan Gantt Chart - Implementação Completa
 * Seguindo exatamente o padrão do exemplo oficial do DHTMLX Gantt Material Theme
 */

import React, { useEffect, useMemo, useRef } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import { VPGanttTask, VPGanttConfig } from './types';
import { useCronogramaStore } from '../../stores/cronogramaStore';
import { formatarData } from '../../utils/dateFormatter';
import { ConfiguracoesProjeto } from '../../types/cronograma';
import './material-gantt-global.css';
import './vp-gantt.css';

interface VPGanttChartProps {
  tasks: VPGanttTask[];
  config?: VPGanttConfig;
}

export const VPGanttChart: React.FC<VPGanttChartProps> = ({ tasks, config = {} }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventIdsRef = useRef<number[]>([]);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { configuracoes, setConfiguracoes } = useCronogramaStore();

  // Converter tasks para formato do Gantt
  const ganttData = useMemo(() => convertToGanttData(tasks), [tasks]);

  // Configuração inicial do Gantt - SEGUINDO EXATAMENTE O EXEMPLO OFICIAL
  useEffect(() => {
    if (!containerRef.current) {
      console.warn('VPGanttChart: Container não encontrado');
      return;
    }

    // Verificar se há dados
    if (tasks.length === 0) {
      console.warn('VPGanttChart: Nenhuma tarefa para exibir');
      // Limpar instância anterior se existir
      try {
        gantt.clearAll();
      } catch (e) {
        // Ignorar erros
      }
      return;
    }

    console.log('VPGanttChart: Inicializando com', tasks.length, 'tarefas');

    // Limpar timeout anterior se existir
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }

    // ========================================================================
    // PASSO 1: APLICAR TEMA MATERIAL (PRIMEIRA COISA - como no exemplo)
    // ========================================================================
    gantt.setSkin("material");

    // ========================================================================
    // PASSO 2: CONFIGURAR PLUGINS (como no exemplo)
    // ========================================================================
    gantt.plugins({
      quick_info: true,
      tooltip: true,
      critical_path: true,
    });

    // ========================================================================
    // PASSO 3: CONFIGURAÇÃO BASE (como no exemplo)
    // ========================================================================
    gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
    gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';
    gantt.config.start_on_monday = false; // Material theme usa domingo

    // ========================================================================
    // PASSO 4: CONFIGURAR ESCALAS (como no exemplo Material)
    // ========================================================================
    gantt.config.scales = [
      { unit: "month", step: 1, format: "%F" },
      {
        unit: "week",
        step: 1,
        format: function (date: Date) {
          const dateToStr = gantt.date.date_to_str("%d %M");
          const endDate = gantt.date.add(date, 6 - date.getDay(), "day");
          return dateToStr(date) + " - " + dateToStr(endDate);
        },
      },
      { unit: "day", step: 1, format: "%D" },
    ];
    gantt.config.scale_height = 36 * 3;

    // ========================================================================
    // PASSO 5: CONFIGURAR COLUNAS (como no exemplo Material)
    // ========================================================================
    const gridWidth = configuracoes.largura_grid || 400;
    const columns = buildColumns(configuracoes);
    
    // Adicionar coluna WBS (como no exemplo Material)
    const hasWBS = columns.some((col) => col.name === 'wbs');
    if (!hasWBS && configuracoes.mostrar_wbs !== false) {
      columns.unshift({
        name: 'wbs',
        label: 'WBS',
        width: 50,
        template: (task: any) => {
          try {
            return gantt.getWBSCode(task);
          } catch (e) {
            return '';
          }
        },
        resize: true,
      });
    }
    
    // Adicionar coluna "add" no final (como no exemplo Material)
    if (!columns.some((col) => col.name === 'add')) {
      columns.push({
        name: 'add',
        width: 40,
      });
    }
    
    gantt.config.columns = columns;

    // ========================================================================
    // PASSO 6: CONFIGURAR LAYOUT (ANTES DE gantt.init() - como no exemplo)
    // ========================================================================
    gantt.config.layout = {
      css: 'gantt_container',
      cols: [
        {
          width: gridWidth,
          min_width: 200,
          max_width: 800,
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

    // ========================================================================
    // PASSO 7: CONFIGURAÇÃO GERAL
    // ========================================================================
    gantt.config.show_grid = configuracoes.mostrar_grid !== false;
    gantt.config.show_chart = true;
    gantt.config.grid_width = gridWidth;
    gantt.config.row_height = configuracoes.altura_linha || 40;
    gantt.config.show_today = configuracoes.mostrar_linha_hoje !== false;
    gantt.config.duration_unit = configuracoes.escala_topo === 'hour' ? 'hour' : 'day';
    gantt.config.readonly = config.readonly ?? !configuracoes.permitir_edicao_drag;
    gantt.config.show_links = configuracoes.mostrar_links !== false;
    gantt.config.highlight_critical_path = configuracoes.destacar_caminho_critico !== false;
    gantt.config.details_on_dblclick = true;
    gantt.config.details_on_create = true;
    gantt.config.grid_resize = true; // Habilitar resize de colunas

    // Drag and drop
    const dragEnabled = !gantt.config.readonly && configuracoes.permitir_edicao_drag !== false;
    gantt.config.drag_move = dragEnabled;
    gantt.config.drag_resize = dragEnabled;
    gantt.config.drag_progress = dragEnabled;
    gantt.config.drag_links = dragEnabled && configuracoes.mostrar_links;

    gantt.config.auto_scheduling = configuracoes.habilitar_auto_scheduling || false;
    gantt.config.auto_scheduling_strict = configuracoes.habilitar_auto_scheduling || false;

    // ========================================================================
    // PASSO 8: CONFIGURAR TEMPLATES
    // ========================================================================
    configureTemplates(configuracoes);

    // ========================================================================
    // PASSO 9: CONFIGURAR RIGHTSIDE TEXT (como no exemplo Material)
    // ========================================================================
    gantt.templates.rightside_text = (start: Date, end: Date, task: any) => {
      if (task.type == gantt.config.types.milestone) {
        return task.text + " / ID: #" + task.id;
      }
      return "";
    };

    // ========================================================================
    // PASSO 10: CONFIGURAR LOCALE
    // ========================================================================
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

    // ========================================================================
    // PASSO 11: APLICAR CORES CUSTOMIZADAS
    // ========================================================================
    applyCustomColors(configuracoes);

    // ========================================================================
    // PASSO 12: INICIALIZAR GANTT (aguardar próximo tick)
    // ========================================================================
    initTimeoutRef.current = setTimeout(() => {
      try {
        if (!containerRef.current) {
          console.error('VPGanttChart: Container não encontrado para inicializar Gantt');
          return;
        }

        console.log('VPGanttChart: Container encontrado:', containerRef.current);
        console.log('VPGanttChart: Container dimensions:', {
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
          clientWidth: containerRef.current.clientWidth,
          clientHeight: containerRef.current.clientHeight,
        });

        // Limpar dados anteriores se existir
        try {
          const existingInstance = containerRef.current.querySelector('.gantt_container');
          if (existingInstance) {
            console.log('VPGanttChart: Instância existente encontrada, limpando...');
            gantt.clearAll();
          }
        } catch (e) {
          console.warn('VPGanttChart: Erro ao limpar instância anterior:', e);
        }

        // Inicializar no container
        console.log('VPGanttChart: Chamando gantt.init()...');
        gantt.init(containerRef.current);
        console.log('VPGanttChart: Gantt inicializado com sucesso');

        // Verificar se o container foi preenchido
        setTimeout(() => {
          const ganttContainer = containerRef.current?.querySelector('.gantt_container');
          if (ganttContainer) {
            console.log('VPGanttChart: Container Gantt criado com sucesso:', {
              width: ganttContainer.clientWidth,
              height: ganttContainer.clientHeight,
            });
          } else {
            console.error('VPGanttChart: Container Gantt NÃO foi criado!');
          }
        }, 50);

        // ========================================================================
        // PASSO 13: CARREGAR DADOS
        // ========================================================================
        try {
          console.log('VPGanttChart: Carregando dados...', {
            tasksCount: ganttData.data?.length || 0,
            linksCount: ganttData.links?.length || 0,
            ganttData,
          });
          gantt.parse(ganttData);
          gantt.render();
          console.log('VPGanttChart: Dados carregados e renderizados com sucesso');
        } catch (error) {
          console.error('VPGanttChart: Erro ao carregar dados do Gantt:', error);
        }

        // ========================================================================
        // PASSO 14: CONFIGURAR EVENTOS
        // ========================================================================
        // Limpar eventos anteriores
        eventIdsRef.current.forEach((id) => {
          try {
            gantt.detachEvent(id);
          } catch (e) {
            // Ignorar erros
          }
        });
        eventIdsRef.current = [];

        // Anexar novos eventos
        const onTaskClick = gantt.attachEvent('onTaskClick', (id: string) => {
          const vpTask = tasks.find((t) => t.id === id);
          if (vpTask && config.on_click) {
            config.on_click(vpTask);
          }
          return true;
        });
        eventIdsRef.current.push(onTaskClick);

        const onAfterTaskDrag = gantt.attachEvent('onAfterTaskDrag', (id: string) => {
          const task = gantt.getTask(id);
          const vpTask = tasks.find((t) => t.id === id);
          if (vpTask && config.on_date_change) {
            config.on_date_change(vpTask, task.start_date, task.end_date);
          }
        });
        eventIdsRef.current.push(onAfterTaskDrag);

        const onAfterTaskUpdate = gantt.attachEvent('onAfterTaskUpdate', (id: string) => {
          const task = gantt.getTask(id);
          const vpTask = tasks.find((t) => t.id === id);
          if (vpTask && config.on_progress_change) {
            config.on_progress_change(vpTask, task.progress * 100);
          }
        });
        eventIdsRef.current.push(onAfterTaskUpdate);

        const onGridResize = gantt.attachEvent('onGridResize', () => {
          const gridEl = containerRef.current?.querySelector<HTMLElement>('.gantt_grid');
          if (gridEl) {
            const width = Math.round(gridEl.clientWidth);
            if (width && Math.abs(width - gantt.config.grid_width) > 2) {
              setConfiguracoes({ largura_grid: width });
            }
          }
        });
        eventIdsRef.current.push(onGridResize);
      } catch (error) {
        console.error('Erro ao inicializar Gantt:', error);
      }
    }, 100);

    // ========================================================================
    // CLEANUP
    // ========================================================================
    return () => {
      // Limpar timeout
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      
      // Detach eventos
      eventIdsRef.current.forEach((id) => {
        try {
          gantt.detachEvent(id);
        } catch (e) {
          // Ignorar erros
        }
      });
      eventIdsRef.current = [];

      // Limpar dados apenas, não destruir a instância
      try {
        gantt.clearAll();
      } catch (e) {
        // Ignorar erros
      }
    };
  }, [ganttData, config, configuracoes, tasks, setConfiguracoes]);

  // Empty state
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
    <div 
      ref={containerRef} 
      className="vp-gantt-container" 
      id="gantt_here"
      style={{ 
        width: '100%', 
        height: '100%', 
        minHeight: '600px',
        position: 'relative',
        padding: '0px',
        overflow: 'hidden'
      }}
    />
  );
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function buildColumns(configuracoes: ConfiguracoesProjeto): any[] {
  const colunasConfig = configuracoes.colunas || [
    { field: 'text', label: 'Nome', width: 170, align: 'left', tree: true },
    { field: 'start_date', label: 'Início', width: 90, align: 'center', tree: false },
    { field: 'duration', label: 'Duração', width: 80, align: 'center', tree: false },
  ];

  const templateMap: Record<string, (task: any) => string> = {
    text: (task: any) => {
      const icon = task.tipo === 'Fase' ? '📁' : task.tipo === 'Marco' ? '📍' : '📋';
      const codigo = configuracoes.mostrar_codigo_atividade && task.codigo ? `${task.codigo} - ` : '';
      return `<span style="font-weight:${task.tipo === 'Fase' ? '600' : '400'}">${icon} ${codigo}${task.text}</span>`;
    },
    start_date: (task: any) => {
      if (!task.start_date) return '';
      const date = typeof task.start_date === 'string' ? new Date(task.start_date) : task.start_date;
      return formatarData(date, configuracoes.formato_data_tabela);
    },
    end_date: (task: any) => {
      if (!task.end_date) return '';
      const date = typeof task.end_date === 'string' ? new Date(task.end_date) : task.end_date;
      return formatarData(date, configuracoes.formato_data_tabela);
    },
    duration: (task: any) => {
      if (task.duracao_horas !== undefined && task.duracao_horas !== null) {
        return `${task.duracao_horas} h`;
      }
      return `${task.duration || 0} d`;
    },
    progress: (task: any) => {
      if (configuracoes.mostrar_progresso_percentual) {
        return `${Math.round((task.progress || 0) * 100)}%`;
      }
      return '';
    },
  };

  // Construir colunas como no exemplo Material: name, label, width, tree, resize, min_width
  return colunasConfig.map((col) => {
    const column: any = {
      name: col.field,
      label: col.label || col.field,
      width: col.width,
      align: col.align || 'left',
      tree: col.tree || false,
      resize: true, // Todas as colunas são redimensionáveis (como no exemplo Material)
    };
    
    // Min width apenas para coluna de texto (como no exemplo: min_width: 10)
    if (col.field === 'text') {
      column.min_width = 10;
    }
    
    // Template personalizado se existir
    if (templateMap[col.field]) {
      column.template = templateMap[col.field];
    }
    
    return column;
  });
}

function configureTemplates(configuracoes: ConfiguracoesProjeto) {
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
}

function convertToGanttData(tasks: VPGanttTask[]) {
  const data = tasks.map((task) => ({
    id: task.id,
    text: task.name,
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
