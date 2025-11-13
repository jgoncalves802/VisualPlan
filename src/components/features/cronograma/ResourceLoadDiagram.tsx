/**
 * Resource Load Diagram - Gráfico de Recursos
 * Seguindo exatamente o padrão do exemplo oficial do DHTMLX Gantt Resource Load Diagram
 */

import React, { useEffect, useMemo, useRef } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import '../../../lib/gantt/material-gantt-global.css';
import './resource-load-diagram.css';

export interface Resource {
  id: string;
  text: string;
  type?: 'work' | 'material';
  unit?: string;
  availability?: number;
  color?: string;
}

export interface ResourceAssignment {
  id: string;
  task_id: string;
  resource_id: string;
  value: number;
  units?: number;
}

export interface ResourceLoadTask {
  id: string;
  text: string;
  start_date: Date;
  end_date: Date;
  progress?: number;
  resource_id?: string;
  value?: number;
}

interface ResourceLoadDiagramProps {
  resources: Resource[];
  tasks: ResourceLoadTask[];
  assignments: ResourceAssignment[];
  scale?: 'day' | 'week' | 'month';
  onResourceClick?: (resourceId: string) => void;
  onTaskClick?: (taskId: string) => void;
}

export const ResourceLoadDiagram: React.FC<ResourceLoadDiagramProps> = ({
  resources,
  tasks,
  assignments,
  scale = 'week',
  onResourceClick,
  onTaskClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const eventIdsRef = useRef<number[]>([]);
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Converter dados para formato do Gantt
  const ganttData = useMemo(() => convertToGanttData(resources, tasks, assignments), [resources, tasks, assignments]);

  // Configuração e inicialização do Gantt - SEGUINDO EXATAMENTE O EXEMPLO OFICIAL
  useEffect(() => {
    if (!containerRef.current || resources.length === 0) {
      return;
    }

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
    gantt.config.columns = [
      {
        name: 'text',
        label: 'Recurso',
        width: 200,
        tree: true,
        resize: true,
        min_width: 10,
        template: (resource: any) => {
          const typeIcon = resource.resource_type === 'material' ? '📦' : '👤';
          return `<span>${typeIcon} ${resource.text}</span>`;
        },
      },
      {
        name: 'availability',
        label: 'Disponibilidade',
        align: 'center',
        width: 100,
        resize: true,
        template: (resource: any) => {
          if (resource.availability !== undefined) {
            return `${resource.availability}%`;
          }
          return '-';
        },
      },
      {
        name: 'add',
        width: 40,
      },
    ];

    // ========================================================================
    // PASSO 6: CONFIGURAR LAYOUT (ANTES DE gantt.init() - como no exemplo)
    // ========================================================================
    gantt.config.layout = {
      css: 'gantt_container',
      cols: [
        {
          width: 300,
          min_width: 200,
          max_width: 500,
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
    gantt.config.readonly = true;
    gantt.config.show_grid = true;
    gantt.config.show_links = false;
    gantt.config.row_height = 40;
    gantt.config.grid_width = 300;
    gantt.config.show_progress = true;
    gantt.config.grid_resize = true; // Habilitar resize de colunas

    // ========================================================================
    // PASSO 8: CONFIGURAR TEMPLATES
    // ========================================================================
    gantt.templates.task_class = (_start, _end, task) => {
      const classes = ['resource-task'];
      if (task.value && task.value > 100) {
        classes.push('resource-overloaded');
      }
      return classes.join(' ');
    };

    gantt.templates.task_text = (_start, _end, task) => {
      if (task.value) {
        return `${task.text} (${task.value}%)`;
      }
      return task.text;
    };

    gantt.templates.grid_row_class = () => 'resource-grid-row';

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
        new_task: 'Novo Recurso',
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
        column_text: 'Recurso',
        column_start_date: 'Início',
        column_duration: 'Duração',
        column_add: '',
        link: 'Ligação',
        confirm_link_deleting: 'será deletado',
        link_start: '(início)',
        link_end: '(fim)',
        type_task: 'Recurso',
        type_project: 'Grupo',
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
    // PASSO 11: INICIALIZAR GANTT (aguardar próximo tick)
    // ========================================================================
    initTimeoutRef.current = setTimeout(() => {
      try {
        if (!containerRef.current) {
          console.warn('Container não encontrado para inicializar Resource Load Diagram');
          return;
        }

        // Limpar dados anteriores se existir
        try {
          gantt.clearAll();
        } catch (e) {
          // Ignorar erros
        }

        // Inicializar no container
        console.log('Inicializando Resource Load Diagram...');
        gantt.init(containerRef.current);
        console.log('Resource Load Diagram inicializado com sucesso');

        // ========================================================================
        // PASSO 12: CARREGAR DADOS
        // ========================================================================
        try {
          console.log('Carregando dados do Resource Load Diagram...', ganttData);
          gantt.parse(ganttData);
          gantt.render();
          console.log('Dados do Resource Load Diagram carregados e renderizados');
        } catch (error) {
          console.error('Erro ao carregar dados do Resource Load Diagram:', error);
        }

        // ========================================================================
        // PASSO 13: CONFIGURAR EVENTOS
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

        const onTaskClickEvent = gantt.attachEvent('onTaskClick', (id: string) => {
          if (onTaskClick) {
            onTaskClick(id);
          }
          return true;
        });
        eventIdsRef.current.push(onTaskClickEvent);

        const onRowClickEvent = gantt.attachEvent('onRowClick', (id: string) => {
          if (onResourceClick) {
            onResourceClick(id);
          }
          return true;
        });
        eventIdsRef.current.push(onRowClickEvent);
      } catch (error) {
        console.error('Erro ao inicializar Resource Load Diagram:', error);
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
  }, [ganttData, scale, onResourceClick, onTaskClick, resources.length]);

  if (resources.length === 0) {
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="text-lg font-medium">Nenhum recurso encontrado</p>
          <p className="text-sm mt-1">Adicione recursos para visualizar o diagrama de carga</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="resource-load-diagram-container"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        position: 'relative',
        padding: '0px',
        overflow: 'hidden',
      }}
    />
  );
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function convertToGanttData(
  resources: Resource[],
  tasks: ResourceLoadTask[],
  assignments: ResourceAssignment[]
) {
  const data: any[] = [];
  const links: any[] = [];

  // Adicionar recursos como tarefas principais (projetos)
  resources.forEach((resource) => {
    data.push({
      id: resource.id,
      text: resource.text,
      type: 'project',
      open: true,
      availability: resource.availability,
      resource_type: resource.type || 'work',
      color: resource.color || '#3b82f6',
    });

    // Adicionar tarefas atribuídas a este recurso
    const resourceAssignments = assignments.filter(
      (assignment) => assignment.resource_id === resource.id
    );

    resourceAssignments.forEach((assignment) => {
      const task = tasks.find((t) => t.id === assignment.task_id);
      if (task) {
        data.push({
          id: `${resource.id}_${task.id}`,
          text: task.text,
          start_date: formatDateForDHTMLX(task.start_date),
          end_date: formatDateForDHTMLX(task.end_date),
          duration: calculateDuration(task.start_date, task.end_date),
          progress: task.progress || 0,
          parent: resource.id,
          type: 'task',
          value: assignment.value,
          units: assignment.units || 100,
        });
      }
    });
  });

  return { data, links };
}

// Helper para converter qualquer valor para Date válido
function parseDate(date: any): Date {
  try {
    if (!date) {
      return new Date();
    }
    if (date instanceof Date) {
      if (isNaN(date.getTime()) || typeof date.getFullYear !== 'function') {
        return new Date();
      }
      return date;
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
        return new Date();
      }
      return parsed;
    }
    if (typeof date === 'number') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
        return new Date();
      }
      return parsed;
    }
    return new Date();
  } catch (error) {
    return new Date();
  }
}

function formatDateForDHTMLX(date: any): string {
  try {
    const dateObj = parseDate(date);
    
    // Verificação final de segurança
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime()) || typeof dateObj.getFullYear !== 'function') {
      const fallbackDate = new Date();
      const year = fallbackDate.getFullYear();
      const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
      const day = String(fallbackDate.getDate()).padStart(2, '0');
      const hours = String(fallbackDate.getHours()).padStart(2, '0');
      const minutes = String(fallbackDate.getMinutes()).padStart(2, '0');
      const seconds = String(fallbackDate.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    const fallbackDate = new Date();
    const year = fallbackDate.getFullYear();
    const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const day = String(fallbackDate.getDate()).padStart(2, '0');
    const hours = String(fallbackDate.getHours()).padStart(2, '0');
    const minutes = String(fallbackDate.getMinutes()).padStart(2, '0');
    const seconds = String(fallbackDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
}

function calculateDuration(start: any, end: any): number {
  try {
    const startDate = parseDate(start);
    const endDate = parseDate(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return 1;
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  } catch (error) {
    return 1;
  }
}
