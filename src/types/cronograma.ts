/**
 * Types para o módulo de Cronograma (Gantt Chart)
 */

import { Task as GanttTask } from 'gantt-task-react';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Tipos de dependência entre atividades
 * - FS (Finish-to-Start): A tarefa B só pode começar após A terminar
 * - SS (Start-to-Start): A tarefa B só pode começar quando A começar
 * - FF (Finish-to-Finish): A tarefa B só pode terminar quando A terminar
 * - SF (Start-to-Finish): A tarefa B só pode terminar quando A começar
 */
export enum TipoDependencia {
  FS = 'FS', // Finish-to-Start (padrão)
  SS = 'SS', // Start-to-Start
  FF = 'FF', // Finish-to-Finish
  SF = 'SF', // Start-to-Finish
}

/**
 * Tipos de visualização do cronograma
 */
export enum VisualizacaoCronograma {
  GANTT = 'GANTT',
  LISTA = 'LISTA',
}

/**
 * Escalas de tempo para o Gantt
 */
export enum EscalaTempo {
  DIA = 'DAY',
  SEMANA = 'WEEK',
  MES = 'MONTH',
  ANO = 'YEAR',
}

/**
 * Tipo de tarefa no Gantt
 */
export enum TipoTarefa {
  TAREFA = 'task',
  MARCO = 'milestone',
  PROJETO = 'project',
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Dependência entre atividades
 */
export interface DependenciaAtividade {
  id: string;
  atividade_origem_id: string;
  atividade_destino_id: string;
  tipo: TipoDependencia;
  lag_dias?: number; // Atraso/Antecipação em dias
  created_at?: string;
}

/**
 * Filtros do cronograma
 */
export interface FiltrosCronograma {
  busca?: string;
  status?: string[];
  responsavel_id?: string;
  setor_id?: string;
  apenas_criticas?: boolean;
  apenas_atrasadas?: boolean;
  data_inicio?: Date;
  data_fim?: Date;
}

/**
 * Resultado do cálculo do caminho crítico
 */
export interface CaminhoCritico {
  atividades_criticas: string[]; // IDs das atividades no caminho crítico
  duracao_total_projeto: number; // em dias
  folgas: Record<string, FolgaAtividade>; // Map de atividade_id => folga
  calculado_em: string; // timestamp
}

/**
 * Folga de uma atividade
 */
export interface FolgaAtividade {
  atividade_id: string;
  early_start: Date;
  early_finish: Date;
  late_start: Date;
  late_finish: Date;
  folga_total: number; // em dias
  folga_livre: number; // em dias
  e_critica: boolean;
}

/**
 * Task adaptada para o gantt-task-react
 */
export interface TaskGantt extends Omit<GanttTask, 'start' | 'end'> {
  id: string;
  type: 'task' | 'milestone' | 'project';
  name: string;
  start: Date;
  end: Date;
  progress: number;
  isDisabled?: boolean;
  dependencies?: string[];
  project?: string;
  styles?: {
    backgroundColor?: string;
    backgroundSelectedColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
  // Campos customizados
  status?: string;
  responsavel?: string;
  e_critica?: boolean;
  folga_total?: number;
}

/**
 * Dados mockados de uma atividade
 */
export interface AtividadeMock {
  id: string;
  projeto_id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  tipo: 'Tarefa' | 'Marco' | 'Fase';
  data_inicio: string;
  data_fim: string;
  duracao_dias: number;
  progresso: number;
  status: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  setor_id?: string;
  prioridade?: string;
  e_critica?: boolean;
  folga_total?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Estado do Cronograma Store
 */
export interface CronogramaState {
  // Dados
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  caminhoCritico: CaminhoCritico | null;

  // UI State
  visualizacao: VisualizacaoCronograma;
  escala: EscalaTempo;
  filtros: FiltrosCronograma;
  
  // Loading states
  isLoading: boolean;
  isCalculandoCPM: boolean;
  erro: string | null;

  // Actions - CRUD Atividades
  carregarAtividades: (projetoId: string) => Promise<void>;
  adicionarAtividade: (atividade: Omit<AtividadeMock, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  atualizarAtividade: (id: string, dados: Partial<AtividadeMock>) => Promise<void>;
  excluirAtividade: (id: string) => Promise<void>;

  // Actions - CRUD Dependências
  carregarDependencias: (projetoId: string) => Promise<void>;
  adicionarDependencia: (dependencia: Omit<DependenciaAtividade, 'id' | 'created_at'>) => Promise<void>;
  excluirDependencia: (id: string) => Promise<void>;

  // Actions - Caminho Crítico
  calcularCaminhoCritico: (projetoId: string) => Promise<void>;

  // Actions - UI
  setVisualizacao: (visualizacao: VisualizacaoCronograma) => void;
  setEscala: (escala: EscalaTempo) => void;
  setFiltros: (filtros: Partial<FiltrosCronograma>) => void;
  limparFiltros: () => void;

  // Actions - Reset
  reset: () => void;
}

/**
 * Dados para exportação
 */
export interface DadosExportacao {
  projeto_nome: string;
  data_exportacao: string;
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  caminhoCritico?: CaminhoCritico;
}

/**
 * Opções de exportação PDF
 */
export interface OpcoesPDF {
  incluir_gantt: boolean;
  incluir_tabela: boolean;
  incluir_dependencias: boolean;
  incluir_caminho_critico: boolean;
  orientacao: 'portrait' | 'landscape';
}

/**
 * Opções de exportação Excel
 */
export interface OpcoesExcel {
  incluir_dependencias: boolean;
  incluir_folgas: boolean;
  incluir_formulas: boolean;
}

