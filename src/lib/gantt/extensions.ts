/**
 * VisionPlan Gantt - DHTMLX Extensions Manager
 * Gerenciador de TODAS as extensões e plugins do DHTMLX Gantt
 * 
 * Extensões incluídas:
 * - QuickInfo: Popup de informações rápidas
 * - Critical Path: Caminho crítico do projeto
 * - Markers: Marcadores de datas importantes
 * - Auto-scheduling: Agendamento automático de tarefas
 * - Undo/Redo: Desfazer e refazer ações
 * - Keyboard Navigation: Navegação por teclado
 * - Tooltip: Tooltips personalizados
 * - Fullscreen: Modo tela cheia
 * - Grouping: Agrupamento de tarefas
 * - Overlay: Camadas sobrepostas (para baselines, S-curve, etc)
 * - Inline Editors: Edição inline de células
 */

import gantt from 'dhtmlx-gantt';
import { ConfiguracoesProjeto } from '../../types/cronograma';

/**
 * Inicializa TODAS as extensões do DHTMLX Gantt
 */
export function initializeAllExtensions(config?: ConfiguracoesProjeto): void {
  console.log('🚀 Inicializando TODAS as extensões do DHTMLX Gantt...');

  // =========================================================================
  // 1. QUICK INFO - Popup de informações rápidas
  // =========================================================================
  gantt.plugins({
    quick_info: true,
  });
  
  gantt.config.show_quick_info = true;
  gantt.config.quickinfo_buttons = ['icon_delete', 'icon_edit'];
  
  // Templates para QuickInfo
  gantt.templates.quick_info_title = function (_start, _end, task) {
    return `<div style="font-size:16px;font-weight:600;">${task.text}</div>`;
  };
  
  gantt.templates.quick_info_content = function (start, end, task) {
    const startStr = gantt.date.date_to_str('%d/%m/%Y')(start);
    const endStr = gantt.date.date_to_str('%d/%m/%Y')(end);
    return `
      <div style="padding:10px;">
        <div><strong>📅 Início:</strong> ${startStr}</div>
        <div><strong>📅 Fim:</strong> ${endStr}</div>
        <div><strong>⏱️ Duração:</strong> ${task.duration} dias</div>
        <div><strong>📊 Progresso:</strong> ${Math.round(task.progress * 100)}%</div>
        ${task.responsavel ? `<div><strong>👤 Responsável:</strong> ${task.responsavel}</div>` : ''}
        ${task.status ? `<div><strong>🔖 Status:</strong> ${task.status}</div>` : ''}
      </div>
    `;
  };

  gantt.templates.quick_info_date = function (start, end, task) {
    const startStr = gantt.date.date_to_str('%d %M %Y')(start);
    const endStr = gantt.date.date_to_str('%d %M %Y')(end);
    return `${startStr} - ${endStr}`;
  };

  // =========================================================================
  // 2. CRITICAL PATH - Caminho crítico
  // =========================================================================
  gantt.plugins({
    critical_path: true,
  });
  
  gantt.config.highlight_critical_path = true;

  // =========================================================================
  // 3. MARKERS - Marcadores de datas importantes
  // =========================================================================
  gantt.plugins({
    marker: true,
  });

  // Templates para marcadores
  gantt.templates.marker_text = function (marker) {
    return marker.text || '';
  };

  // =========================================================================
  // 4. AUTO-SCHEDULING - Agendamento automático
  // =========================================================================
  gantt.plugins({
    auto_scheduling: true,
  });
  
  gantt.config.auto_scheduling = true;
  gantt.config.auto_scheduling_strict = true;
  gantt.config.auto_scheduling_initial = false;
  gantt.config.auto_scheduling_use_progress = false;
  gantt.config.auto_scheduling_descendant_links = true;
  gantt.config.auto_scheduling_move_projects = true;

  // =========================================================================
  // 5. UNDO/REDO - Desfazer e refazer
  // =========================================================================
  gantt.plugins({
    undo: true,
  });

  // =========================================================================
  // 6. KEYBOARD NAVIGATION - Navegação por teclado
  // =========================================================================
  gantt.plugins({
    keyboard_navigation: true,
  });
  
  gantt.config.keyboard_navigation = true;
  gantt.config.keyboard_navigation_cells = true;

  // =========================================================================
  // 7. TOOLTIP - Tooltips personalizados
  // =========================================================================
  gantt.plugins({
    tooltip: true,
  });
  
  gantt.config.tooltip_offset_x = 15;
  gantt.config.tooltip_offset_y = 15;
  gantt.config.tooltip_timeout = 30;
  gantt.config.tooltip_hide_timeout = 5000;

  // =========================================================================
  // 8. FULLSCREEN - Modo tela cheia
  // =========================================================================
  gantt.plugins({
    fullscreen: true,
  });

  // =========================================================================
  // 9. GROUPING - Agrupamento de tarefas
  // =========================================================================
  gantt.plugins({
    grouping: true,
  });

  // =========================================================================
  // 10. OVERLAY - Camadas sobrepostas
  // =========================================================================
  gantt.plugins({
    overlay: true,
  });

  // =========================================================================
  // 11. INLINE EDITORS - Edição inline
  // =========================================================================
  gantt.plugins({
    inlineEditors: true,
  });

  // =========================================================================
  // 12. MULTISELECT - Seleção múltipla
  // =========================================================================
  gantt.plugins({
    multiselect: true,
  });
  
  gantt.config.multiselect = true;
  gantt.config.select_task = true;

  // =========================================================================
  // 13. CLICK DRAG - Arrastar e criar tarefas
  // =========================================================================
  gantt.plugins({
    click_drag: true,
  });

  // =========================================================================
  // 14. DRAG TIMELINE - Arrastar timeline
  // =========================================================================
  gantt.plugins({
    drag_timeline: true,
  });

  // =========================================================================
  // 15. EXPORT - Exportação
  // =========================================================================
  gantt.plugins({
    export_api: true,
  });

  // =========================================================================
  // CONFIGURAÇÕES GERAIS ADICIONAIS
  // =========================================================================
  
  // Performance
  gantt.config.smart_rendering = true;
  gantt.config.static_background = true;
  gantt.config.preserve_scroll = true;

  // Grid
  gantt.config.grid_resize = true;
  gantt.config.reorder_grid_columns = true;

  // Tarefas
  gantt.config.open_tree_initially = false;
  gantt.config.auto_types = true;
  gantt.config.show_unscheduled = true;
  gantt.config.round_dnd_dates = true;

  // Links
  gantt.config.link_line_width = 2;
  gantt.config.link_arrow_size = 10;
  gantt.config.link_wrapper_width = 20;

  // Working Time
  gantt.config.work_time = true;
  gantt.config.correct_work_time = true;
  gantt.config.skip_off_time = true;

  // WBS
  gantt.config.wbs_code_separator = '.';

  console.log('✅ Todas as extensões do DHTMLX Gantt foram inicializadas!');
}

/**
 * Ativa o modo tela cheia
 */
export function enterFullscreen(): void {
  if (gantt.ext && gantt.ext.fullscreen) {
    gantt.ext.fullscreen.toggle();
  }
}

/**
 * Desfaz a última ação
 */
export function undo(): void {
  if (gantt.undo) {
    gantt.undo();
  }
}

/**
 * Refaz a última ação desfeita
 */
export function redo(): void {
  if (gantt.redo) {
    gantt.redo();
  }
}

/**
 * Agrupa tarefas por um campo específico
 */
export function groupBy(field: string): void {
  if (gantt.groupBy) {
    gantt.groupBy({
      groups: gantt.serverList(field),
      relation_property: field,
      group_id: 'key',
      group_text: 'label',
    });
  }
}

/**
 * Remove agrupamento
 */
export function removeGrouping(): void {
  if (gantt.groupBy) {
    gantt.groupBy(false);
  }
}

/**
 * Adiciona um marcador personalizado
 */
export function addCustomMarker(
  date: Date,
  text: string,
  css: string = 'custom-marker',
  title?: string
): string {
  const dateToStr = gantt.date.date_to_str(gantt.config.task_date);
  return gantt.addMarker({
    start_date: date,
    css,
    text,
    title: title || `${text}: ${dateToStr(date)}`,
  });
}

/**
 * Remove um marcador
 */
export function removeMarker(markerId: string): void {
  gantt.deleteMarker(markerId);
}

/**
 * Atualiza a linha "Hoje"
 */
export function updateTodayMarker(): void {
  if (typeof gantt.addMarker !== 'function') {
    console.warn('gantt.addMarker não está disponível. Certifique-se de que o plugin marker está habilitado e o gantt foi inicializado.');
    return;
  }

  // Adiciona novo marcador "hoje"
  const dateToStr = gantt.date.date_to_str(gantt.config.task_date);
  const today = new Date();
  gantt.addMarker({
    start_date: today,
    css: 'today-marker',
    text: 'Hoje',
    title: `Hoje: ${dateToStr(today)}`,
  });
  gantt.render();
}

/**
 * Exporta para PDF com configurações personalizadas
 */
export function exportToPDF(config?: any): void {
  gantt.exportToPDF(
    config || {
      name: 'gantt.pdf',
      header: '<h1>Cronograma do Projeto</h1>',
      footer: '<div>Gerado em: ' + new Date().toLocaleDateString('pt-BR') + '</div>',
      locale: 'pt-BR',
    }
  );
}

/**
 * Exporta para PNG
 */
export function exportToPNG(config?: any): void {
  gantt.exportToPNG(
    config || {
      name: 'gantt.png',
    }
  );
}

/**
 * Exporta para Excel
 */
export function exportToExcel(config?: any): void {
  gantt.exportToExcel(
    config || {
      name: 'gantt.xlsx',
      visual: true,
      cellColors: true,
    }
  );
}

/**
 * Exporta para MS Project
 */
export function exportToMSProject(config?: any): void {
  gantt.exportToMSProject(
    config || {
      name: 'project.xml',
    }
  );
}

/**
 * Exporta para Primavera P6
 */
export function exportToPrimaveraP6(config?: any): void {
  gantt.exportToPrimaveraP6(
    config || {
      name: 'project.xml',
    }
  );
}

/**
 * Exporta para iCal
 */
export function exportToICal(config?: any): void {
  gantt.exportToICal(
    config || {
      name: 'calendar.ics',
    }
  );
}

/**
 * Ativa/desativa caminho crítico
 */
export function toggleCriticalPath(enabled: boolean): void {
  gantt.config.highlight_critical_path = enabled;
  gantt.render();
}

/**
 * Ativa/desativa auto-scheduling
 */
export function toggleAutoScheduling(enabled: boolean): void {
  gantt.config.auto_scheduling = enabled;
  gantt.config.auto_scheduling_strict = enabled;
  if (enabled) {
    gantt.autoSchedule();
  }
}

/**
 * Zoom In (aumentar nível de detalhes)
 */
export function zoomIn(): void {
  if (gantt.ext && gantt.ext.zoom) {
    gantt.ext.zoom.zoomIn();
  }
}

/**
 * Zoom Out (diminuir nível de detalhes)
 */
export function zoomOut(): void {
  if (gantt.ext && gantt.ext.zoom) {
    gantt.ext.zoom.zoomOut();
  }
}

/**
 * Zoom to Fit (ajustar para caber na tela)
 */
export function zoomToFit(): void {
  if (gantt.ext && gantt.ext.zoom) {
    gantt.ext.zoom.setLevel('fit');
  }
}

/**
 * Ordena tarefas por um campo
 */
export function sortTasks(field: string, descending: boolean = false): void {
  gantt.sort(field, descending);
}

/**
 * Filtra tarefas baseado em um critério
 */
export function filterTasks(filterFn: (task: any) => boolean): void {
  gantt.filter(filterFn);
}

/**
 * Remove filtros
 */
export function clearFilters(): void {
  gantt.resetFilter();
}

/**
 * Adiciona uma camada de baseline (linha de base)
 */
export function addBaselineLayer(): string {
  return gantt.addTaskLayer((task: any) => {
    if (task.baseline_start && task.baseline_end) {
      const sizes = gantt.getTaskPosition(
        task,
        new Date(task.baseline_start),
        new Date(task.baseline_end)
      );
      return `
        <div class="baseline-bar" style="
          left: ${sizes.left}px;
          width: ${sizes.width}px;
          top: ${sizes.top + sizes.height / 2 + 10}px;
          height: 8px;
          background: #ccc;
          border: 1px solid #999;
          opacity: 0.6;
          border-radius: 2px;
        "></div>
      `;
    }
    return false;
  });
}

/**
 * Remove uma camada de tarefas
 */
export function removeTaskLayer(layerId: string): void {
  gantt.removeTaskLayer(layerId);
}

/**
 * Adiciona uma deadline (prazo final) a uma tarefa
 */
export function addDeadlineLayer(): string {
  return gantt.addTaskLayer((task: any) => {
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const sizes = gantt.getTaskPosition(task, deadlineDate, deadlineDate);
      return `
        <div class="deadline-marker" style="
          left: ${sizes.left}px;
          top: ${sizes.top}px;
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 12px solid #ff0000;
        " title="Deadline: ${deadlineDate.toLocaleDateString('pt-BR')}"></div>
      `;
    }
    return false;
  });
}

/**
 * Calcula e exibe o slack time (folga)
 */
export function calculateSlackTime(): void {
  gantt.eachTask((task) => {
    if (task.auto_scheduling !== false) {
      const links = gantt.getLinks();
      const outgoingLinks = links.filter((link: any) => link.source === task.id);
      
      if (outgoingLinks.length > 0) {
        let minSuccessorStart = null;
        
        outgoingLinks.forEach((link: any) => {
          const successor = gantt.getTask(link.target);
          const successorStart = successor.start_date.getTime();
          
          if (!minSuccessorStart || successorStart < minSuccessorStart) {
            minSuccessorStart = successorStart;
          }
        });
        
        if (minSuccessorStart) {
          const taskEnd = task.end_date.getTime();
          const slackMs = minSuccessorStart - taskEnd;
          const slackDays = Math.floor(slackMs / (1000 * 60 * 60 * 24));
          task.slack = slackDays;
        }
      }
    }
  });
  
  gantt.render();
}
