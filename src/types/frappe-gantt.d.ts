/**
 * Type definitions for frappe-gantt
 * Declarações de tipos para o Frappe Gantt
 */

declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
  }

  export interface GanttOptions {
    view_mode?: string;
    language?: string;
    on_click?: (task: any) => void;
    on_date_change?: (task: any, start: Date, end: Date) => void;
    on_progress_change?: (task: any, progress: number) => void;
    on_view_change?: (mode: string) => void;
    popup_trigger?: string;
    custom_popup_html?: (task: any) => string;
  }

  export default class Gantt {
    constructor(container: HTMLElement, tasks: GanttTask[], options?: GanttOptions);
    change_view_mode(mode: string): void;
    refresh(tasks: GanttTask[]): void;
  }
}

