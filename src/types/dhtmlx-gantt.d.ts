/**
 * Type definitions for dhtmlx-gantt
 * Declarações de tipos para o DHTMLX Gantt
 */

declare module 'dhtmlx-gantt' {
  export interface GanttStatic {
    // Core methods
    init(container: HTMLElement | string): void;
    parse(data: any): void;
    clearAll(): void;
    render(): void;
    
    // Configuration
    config: GanttConfigOptions;
    locale: any;
    i18n: any;
    
    // Data manipulation
    addTask(task: any, parent?: string, index?: number): string;
    updateTask(id: string, task?: any): void;
    deleteTask(id: string): void;
    getTask(id: string): any;
    
    // Events
    attachEvent(name: string, handler: Function): string;
    detachEvent(id: string): void;
    
    // Templates
    templates: GanttTemplates;
    
    // Plugins
    plugins(config: any): void;
    ext: any;
  }

  export interface GanttConfigOptions {
    // Date format
    date_format?: string;
    xml_date?: string;
    
    // Scale configuration
    scale_unit?: string;
    date_scale?: string;
    subscales?: Array<{ unit: string; step: number; date: string }>;
    step?: number;
    
    // Columns
    columns?: Array<{
      name: string;
      label: string;
      width?: number | string;
      align?: string;
      tree?: boolean;
      template?: (task: any) => string;
    }>;
    
    // Layout
    layout?: any;
    show_grid?: boolean;
    show_chart?: boolean;
    grid_width?: number;
    row_height?: number;
    
    // Behavior
    readonly?: boolean;
    drag_move?: boolean;
    drag_resize?: boolean;
    drag_progress?: boolean;
    drag_links?: boolean;
    details_on_dblclick?: boolean;
    
    // Localization
    locale?: any;
    
    // Other
    [key: string]: any;
  }

  export interface GanttTemplates {
    task_text?: (start: Date, end: Date, task: any) => string;
    tooltip_text?: (start: Date, end: Date, task: any) => string;
    task_class?: (start: Date, end: Date, task: any) => string;
    grid_header_class?: (columnName: string, column: any) => string;
    scale_cell_class?: (date: Date) => string;
    timeline_cell_class?: (task: any, date: Date) => string;
    [key: string]: any;
  }

  const gantt: GanttStatic;
  export default gantt;
}

