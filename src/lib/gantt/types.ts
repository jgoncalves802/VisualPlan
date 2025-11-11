/**
 * VisionPlan Gantt - Types
 * Tipos próprios do VisionPlan Gantt
 */

import { AtividadeMock, DependenciaAtividade, FormatoData } from '../../types/cronograma';

/**
 * Task do VisionPlan Gantt
 */
export interface VPGanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  dependencies?: string[];
  custom_class?: string;
  parent?: string;
  
  // Dados customizados
  tipo: 'Tarefa' | 'Marco' | 'Fase';
  status: string;
  responsavel?: string;
  e_critica?: boolean;
  duracao_horas?: number;
  codigo?: string;
}

/**
 * Configurações do VisionPlan Gantt
 */
export interface VPGanttConfig {
  // Formatos de data
  formato_header?: FormatoData;
  formato_tooltip?: FormatoData;
  
  // Cores
  cor_barra_normal?: string;
  cor_barra_critica?: string;
  cor_barra_concluida?: string;
  cor_marco?: string;
  cor_fase?: string;
  
  // Comportamento
  view_mode?: 'Hour' | 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
  language?: string;
  readonly?: boolean;
  
  // Callbacks
  on_click?: (task: VPGanttTask) => void;
  on_date_change?: (task: VPGanttTask, start: Date, end: Date) => void;
  on_progress_change?: (task: VPGanttTask, progress: number) => void;
  on_view_change?: (mode: string) => void;
}

/**
 * Adapter para converter dados
 */
export interface VPGanttAdapter {
  /**
   * Converte atividades do VisionPlan para tasks do Gantt
   */
  toGanttTasks(atividades: AtividadeMock[]): VPGanttTask[];
  
  /**
   * Converte task do Gantt de volta para atividade
   */
  fromGanttTask(task: VPGanttTask): Partial<AtividadeMock>;
}

