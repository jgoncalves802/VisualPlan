/**
 * Configuração Centralizada do Tema Material para DHTMLX Gantt
 * Garante consistência entre todos os componentes Gantt
 * 
 * IMPORTANTE: DHTMLX Gantt é um singleton - todas as instâncias compartilham gantt.config
 * Cada componente deve configurar TUDO antes de chamar gantt.init()
 */

import gantt from 'dhtmlx-gantt';

/**
 * Aplica o tema Material e configurações base comuns
 * Deve ser chamado PRIMEIRO, antes de qualquer outra configuração
 */
export function applyMaterialThemeBase(): void {
  // ========================================================================
  // TEMA MATERIAL (DEVE SER A PRIMEIRA CONFIGURAÇÃO - ANTES DE TUDO)
  // ========================================================================
  gantt.setSkin("material");

  // ========================================================================
  // PLUGINS BASE (CONFIGURAR ANTES DE gantt.init())
  // ========================================================================
  gantt.plugins({
    quick_info: true,
    tooltip: true,
    critical_path: true,
  });

  // ========================================================================
  // CONFIGURAÇÃO BASE COMUM
  // ========================================================================
  gantt.config.date_format = '%Y-%m-%d %H:%i:%s';
  gantt.config.xml_date = '%Y-%m-%d %H:%i:%s';
  gantt.config.start_on_monday = false; // Material theme usa domingo como início
}

/**
 * Configura escalas padrão do Material Theme
 * Month > Week > Day (como no exemplo oficial)
 */
export function configureMaterialScales(): void {
  gantt.config.scales = [
    { unit: "month", step: 1, format: "%F" },
    {
      unit: "week",
      step: 1,
      format: function (date: Date) {
        const dateToStr = gantt.date.date_to_str("%d %M");
        // Calcular data final da semana (domingo = 0, então 6 - date.getDay() dá o domingo)
        const endDate = gantt.date.add(date, 6 - date.getDay(), "day");
        return dateToStr(date) + " - " + dateToStr(endDate);
      },
    },
    { unit: "day", step: 1, format: "%D" },
  ];
  
  // Altura padrão para 3 escalas
  gantt.config.scale_height = 36 * 3;
}

/**
 * Configura locale Português Brasil
 */
export function configurePtBrLocale(): void {
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

/**
 * Configura layout padrão do Material Theme (como no exemplo oficial)
 * IMPORTANTE: Deve ser chamado ANTES de gantt.init()
 */
export function configureMaterialLayout(gridWidth: number = 400, minWidth: number = 200, maxWidth: number = 800): void {
  gantt.config.layout = {
    css: 'gantt_container',
    cols: [
      {
        width: gridWidth,
        min_width: minWidth,
        max_width: maxWidth,
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
}

/**
 * Configurações padrão de colunas para Material Theme
 */
export function configureMaterialColumnsBase(): void {
  // Habilitar resize de colunas
  gantt.config.grid_resize = true;
  
  // Configuração de templates para milestones (como no exemplo Material)
  gantt.templates.rightside_text = (start: Date, end: Date, task: any) => {
    if (task.type == gantt.config.types.milestone) {
      return task.text + " / ID: #" + task.id;
    }
    return "";
  };
}

/**
 * Inicializa apenas o tema base do Material
 * Cada componente deve configurar seu próprio layout, escalas e colunas
 */
export function initializeMaterialThemeBase(): void {
  applyMaterialThemeBase();
  configurePtBrLocale();
  configureMaterialColumnsBase();
}
