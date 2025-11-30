declare module 'wx-react-gantt' {
  import { ComponentType } from 'react';

  export interface GanttTask {
    id: number | string;
    text: string;
    start: Date;
    end?: Date;
    duration: number;
    progress: number;
    parent?: number | string;
    type?: 'task' | 'summary' | 'milestone';
    open?: boolean;
    lazy?: boolean;
  }

  export interface GanttLink {
    id: number | string;
    source: number | string;
    target: number | string;
    type: 'e2s' | 's2s' | 'e2e' | 's2e';
    lag?: number;
  }

  export interface GanttScale {
    unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';
    step: number;
    format: string;
    css?: (date: Date) => string;
  }

  export interface GanttColumn {
    id: string;
    header: string;
    width?: number;
    flexgrow?: number;
    align?: 'left' | 'center' | 'right';
  }

  export interface GanttAPI {
    on: (event: string, callback: (ev: any) => void) => void;
    exec: (action: string, params?: any) => void;
    setNext: (provider: any) => void;
  }

  export interface GanttProps {
    tasks?: GanttTask[];
    links?: GanttLink[];
    scales?: GanttScale[];
    columns?: GanttColumn[];
    init?: (api: GanttAPI) => void;
    readonly?: boolean;
    cellWidth?: number;
    cellHeight?: number;
    scaleHeight?: number;
  }

  export const Gantt: ComponentType<GanttProps>;
}
