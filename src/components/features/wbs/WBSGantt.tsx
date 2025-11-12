/**
 * Componente Gantt da visão WBS
 * Visualização executiva de projetos usando DHTMLX Gantt
 */

import React, { useEffect, useMemo, useRef } from 'react';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';
import './wbs-gantt.css';
import { attachColumnDragAndResize } from '../../../lib/gantt/columnInteractions';
import { attachGridResizer, GridResizerHandle } from '../../../lib/gantt/gridResizer';

export interface WBSProject {
  id: string;
  nome: string;
  codigo: string;
  gerente: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  progresso: number;
  cor: string;
  categoria?: string;
  cliente?: string;
}

interface WBSGanttProps {
  projetos: WBSProject[];
  escala: 'Day' | 'Week' | 'Month' | 'Year';
  onProjetoClick?: (projetoId: string) => void;
}

export const WBSGantt: React.FC<WBSGanttProps> = ({ projetos, escala, onProjetoClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const gridWidthRef = useRef(420);

  const dados = useMemo(() => converterProjetos(projetos), [projetos]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    configurarEscala(escala);
    configurarLocale();

    gantt.config.readonly = true;
    gantt.config.show_grid = true;
    gantt.config.show_links = false;
    gantt.config.row_height = 34;
    gantt.config.grid_width = gridWidthRef.current;
    gantt.config.scale_height = escala === 'Month' || escala === 'Year' ? 52 : 44;
    gantt.config.show_progress = true;

    const columns: any[] = [
      {
        name: 'text',
        label: 'Projeto',
        width: 220,
        tree: true,
        template: (task: any) => {
          return `<span class="wbs-col-nome">${task.text}</span><span class="wbs-col-codigo">${task.codigo}</span>`;
        },
      },
      {
        name: 'status',
        label: 'Status',
        align: 'center',
        width: 110,
        template: (task: any) => `<span class="wbs-status wbs-status-${statusToSlug(task.status)}">${task.status}</span>`,
      },
      {
        name: 'gerente',
        label: 'Gerente',
        width: 120,
        template: (task: any) => `<span class="wbs-col-gerente">${task.gerente || '-'}</span>`,
      },
      {
        name: 'progress',
        label: 'Conclusão',
        align: 'center',
        width: 110,
        template: (task: any) => `${Math.round(task.progress * 100)}%`,
      },
    ];

    gantt.config.columns = columns;

    gantt.config.layout = {
      css: 'wbs-gantt-layout',
      cols: [
        {
          width: gridWidthRef.current,
          min_width: 260,
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

    gantt.templates.task_class = (_start, _end, task) => {
      const classes = ['wbs-gantt-task'];
      classes.push(`wbs-${statusToSlug(task.status)}`);
      return classes.join(' ');
    };

    gantt.templates.task_text = (_start, _end, task) => {
      return `${task.text} (${Math.round(task.progress * 100)}%)`;
    };

    gantt.templates.grid_row_class = () => 'wbs-grid-row';

    if (!initializedRef.current) {
      gantt.init(containerRef.current);
      initializedRef.current = true;
    }

    gantt.clearAll();
    gantt.parse(dados);

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
          resizerClass: 'wbs-column-resizer',
        });
        gridResizerHandle?.update();
      });
    };

    detachColumnInteractions = attachColumnDragAndResize({
      container: containerRef.current,
      columns,
      onChange: refreshColumns,
      resizerClass: 'wbs-column-resizer',
    });

    gridResizerHandle = attachGridResizer({
      container: containerRef.current,
      minWidth: 260,
      getWidth: () => gantt.config.grid_width,
      setWidth: (width) => {
        const normalized = Math.round(width);
        if (Math.abs(normalized - gantt.config.grid_width) < 1) return;
        gantt.config.grid_width = normalized;
        gridWidthRef.current = normalized;
        refreshColumns();
      },
      resizerClass: 'wbs-grid-resizer',
    });

    const clickId = gantt.attachEvent('onTaskClick', (id: string) => {
      if (onProjetoClick) {
        onProjetoClick(id);
      }
      return true;
    });

    const updateGridWidthFromDom = () => {
      const gridEl = containerRef.current?.querySelector<HTMLElement>('.gantt_grid');
      if (!gridEl) return;
      gridWidthRef.current = Math.round(gridEl.clientWidth);
    };

    const gridResizeEvent = gantt.attachEvent('onGridResize', () => {
      updateGridWidthFromDom();
    });

    const layoutResizeEvent = gantt.attachEvent('onLayoutResize', () => {
      updateGridWidthFromDom();
    });

    return () => {
      gantt.detachEvent(clickId);
      gantt.detachEvent(gridResizeEvent);
      gantt.detachEvent(layoutResizeEvent);
      detachColumnInteractions();
      gridResizerHandle?.dispose();
      gantt.clearAll();
    };
  }, [dados, escala, onProjetoClick]);

  return <div ref={containerRef} className="wbs-gantt-container" />;
};

function converterProjetos(projetos: WBSProject[]) {
  const data = projetos.map((projeto) => ({
    id: projeto.id,
    text: projeto.nome,
    start_date: formatarParaDhtmlx(new Date(projeto.data_inicio)),
    end_date: formatarParaDhtmlx(new Date(projeto.data_fim)),
    duration: calcularDuracaoDias(new Date(projeto.data_inicio), new Date(projeto.data_fim)),
    progress: projeto.progresso / 100,
    open: true,
    codigo: projeto.codigo,
    status: projeto.status,
    gerente: projeto.gerente,
    color: projeto.cor,
    category: projeto.categoria || '',
    cliente: projeto.cliente || '',
  }));

  return { data, links: [] };
}

function formatarParaDhtmlx(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
}

function calcularDuracaoDias(inicio: Date, fim: Date) {
  const diffTime = Math.abs(fim.getTime() - inicio.getTime());
  return Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1);
}

function configurarEscala(escala: 'Day' | 'Week' | 'Month' | 'Year') {
  switch (escala) {
    case 'Day':
      gantt.config.scale_unit = 'week';
      gantt.config.date_scale = 'Semana %W';
      gantt.config.subscales = [{ unit: 'day', step: 1, date: '%d %M' }];
      break;
    case 'Week':
      gantt.config.scale_unit = 'month';
      gantt.config.date_scale = '%F %Y';
      gantt.config.subscales = [{ unit: 'week', step: 1, date: 'Semana %W' }];
      break;
    case 'Month':
      gantt.config.scale_unit = 'year';
      gantt.config.date_scale = '%Y';
      gantt.config.subscales = [{ unit: 'month', step: 1, date: '%M' }];
      break;
    case 'Year':
      gantt.config.scale_unit = 'year';
      gantt.config.date_scale = '%Y';
      gantt.config.subscales = [{ unit: 'quarter', step: 1, date: 'T%q' }];
      break;
    default:
      gantt.config.scale_unit = 'month';
      gantt.config.date_scale = '%F %Y';
      gantt.config.subscales = [{ unit: 'week', step: 1, date: 'Semana %W' }];
  }
}

function configurarLocale() {
  gantt.locale = {
    date: {
      month_full: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
      month_short: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      day_full: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
      day_short: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
    },
    labels: {
      new_task: 'Novo Projeto',
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
      column_text: 'Projeto',
      column_start_date: 'Início',
      column_duration: 'Duração',
      column_add: '',
      link: 'Ligação',
      confirm_link_deleting: 'será deletado',
      link_start: '(início)',
      link_end: '(fim)',
      type_task: 'Projeto',
      type_project: 'Programa',
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

function statusToSlug(status: string) {
  return status
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

