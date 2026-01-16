export interface P6TaskRow {
  task_code?: string;
  status_code?: string;
  wbs_id?: string;
  task_name?: string;
  task_type?: string;
  
  act_start_date?: string | Date;
  act_end_date?: string | Date;
  early_start_date?: string | Date;
  early_end_date?: string | Date;
  late_start_date?: string | Date;
  late_end_date?: string | Date;
  target_start_date?: string | Date;
  target_end_date?: string | Date;
  start_date?: string | Date;
  end_date?: string | Date;
  
  base_start_date?: string | Date;
  base_end_date?: string | Date;
  primary_base_start_date?: string | Date;
  primary_base_end_date?: string | Date;
  secondary_base_start_date?: string | Date;
  secondary_base_end_date?: string | Date;
  
  total_drtn_hr_cnt?: number;
  remain_drtn_hr_cnt?: number;
  base_drtn_hr_cnt?: number;
  act_drtn_hr_cnt?: number;
  
  total_float_hr_cnt?: number;
  free_float_hr_cnt?: number;
  remain_float_hr_cnt?: number;
  
  complete_pct?: number;
  drtn_complete_pct?: number;
  work_complete_pct?: number;
  perfm_complete_pct?: number;
  
  acwp?: number;
  bcwp?: number;
  bac?: number;
  bac_work?: number;
  cpi?: number;
  spi?: number;
  cv?: number;
  sv?: number;
  eac?: number;
  etc?: number;
  vac?: number;
  tcpi?: number;
  
  act_cost?: number;
  target_cost?: number;
  remain_cost?: number;
  total_cost?: number;
  base_cost?: number;
  
  act_work_cost?: number;
  act_mat_cost?: number;
  act_equip_cost?: number;
  act_expense_cost?: number;
  
  target_work_cost?: number;
  target_mat_cost?: number;
  target_equip_cost?: number;
  target_expense_cost?: number;
  
  wbs_name?: string;
  wbs_path?: string;
  critical_flag?: string | boolean;
  priority_type?: string;
  duration_type?: string;
  clndr_id?: string;
  rsrc_id?: string;
  
  pred_list?: string;
  succ_list?: string;
  pred_details?: string;
  succ_details?: string;
  resource_list?: string;
  resource_code_list?: string;
  
  [key: string]: unknown;
}

export interface P6PredecessorRow {
  pred_task_id?: string;
  task_id?: string;
  pred_type?: string;
  lag_hr_cnt?: number;
  predtask__task_name?: string;
  task__task_name?: string;
  predtask__projwbs__wbs_full_name?: string;
  task__projwbs__wbs_full_name?: string;
  PREDTASK__status_code?: string;
  TASK__status_code?: string;
  pred_proj_id?: string;
  proj_id?: string;
  delete_record_flag?: string;
  [key: string]: unknown;
}

export interface P6ResourceRow {
  rsrc_short_name?: string;
  rsrc_name?: string;
  rsrc_type?: string;
  unit_id?: string;
  role_id?: string;
  def_qty_per_hr?: number;
  [key: string]: unknown;
}

export interface P6TaskResourceRow {
  rsrc_id?: string;
  task_id?: string;
  TASK__status_code?: string;
  role_id?: string;
  acct_id?: string;
  rsrc_type?: string;
  start_date?: string | Date;
  end_date?: string | Date;
  delete_record_flag?: string;
  [key: string]: unknown;
}

export interface P6ProjectCostRow {
  task_id?: string;
  cost_name?: string;
  TASK__status_code?: string;
  target_cost?: number;
  act_cost?: number;
  remain_cost?: number;
  total_cost?: number;
  delete_record_flag?: string;
  [key: string]: unknown;
}

export interface P6ExcelData {
  TASK?: P6TaskRow[];
  TASKPRED?: P6PredecessorRow[];
  RSRC?: P6ResourceRow[];
  TASKRSRC?: P6TaskResourceRow[];
  PROJCOST?: P6ProjectCostRow[];
  USERDATA?: Record<string, unknown>[];
}

export interface P6SheetInfo {
  name: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  selected: boolean;
}

export interface ColumnMapping {
  p6Column: string;
  visionPlanColumn: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  transform?: (value: unknown) => unknown;
}

export interface P6ImportConfig {
  sheetsToImport: string[];
  columnMappings: {
    tasks: ColumnMapping[];
    predecessors: ColumnMapping[];
    resources: ColumnMapping[];
  };
  taskColumnMappings?: Record<string, string>;
  options: {
    overwriteExisting: boolean;
    createMissingWBS: boolean;
    importBaselines: boolean;
    importResources: boolean;
    dateFormat: string;
    hoursPerDay: number;
  };
}

export interface VisionPlanTaskTarget {
  codigo: string;
  nome: string;
  wbs_id?: string;
  data_inicio?: Date;
  data_fim?: Date;
  data_inicio_real?: Date;
  data_fim_real?: Date;
  data_inicio_baseline?: Date;
  data_fim_baseline?: Date;
  duracao_dias?: number;
  duracao_restante_dias?: number;
  percentual_conclusao?: number;
  custo_orcado?: number;
  custo_real?: number;
  custo_restante?: number;
  is_marco?: boolean;
  is_resumo?: boolean;
  is_critico?: boolean;
  prioridade?: string;
  tipo_duracao?: string;
  calendario_id?: string;
}

export interface VisionPlanDependencyTarget {
  atividade_predecessora_codigo: string;
  atividade_sucessora_codigo: string;
  tipo: 'FS' | 'FF' | 'SS' | 'SF';
  lag_dias: number;
}

export interface P6ImportValidationError {
  row: number;
  column: string;
  value: unknown;
  message: string;
  severity: 'error' | 'warning';
}

export interface P6ImportResult {
  success: boolean;
  tasksImported: number;
  dependenciesImported: number;
  resourcesImported: number;
  errors: P6ImportValidationError[];
  warnings: P6ImportValidationError[];
}

export const P6_PREDECESSOR_TYPES: Record<string, 'FS' | 'FF' | 'SS' | 'SF'> = {
  'PR_FS': 'FS',
  'FS': 'FS',
  'PR_FF': 'FF',
  'FF': 'FF',
  'PR_SS': 'SS',
  'SS': 'SS',
  'PR_SF': 'SF',
  'SF': 'SF',
};

export const P6_STATUS_MAPPING: Record<string, string> = {
  'TK_NotStart': 'NAO_INICIADA',
  'TK_Active': 'EM_ANDAMENTO',
  'TK_Complete': 'CONCLUIDA',
};

export const VISIONPLAN_TASK_COLUMNS = [
  { key: 'codigo', label: 'Código', required: true, dataType: 'string' as const },
  { key: 'nome', label: 'Nome', required: true, dataType: 'string' as const },
  { key: 'wbs_id', label: 'WBS', required: false, dataType: 'string' as const },
  { key: 'data_inicio', label: 'Data Início Planejada', required: false, dataType: 'date' as const },
  { key: 'data_fim', label: 'Data Fim Planejada', required: false, dataType: 'date' as const },
  { key: 'data_inicio_real', label: 'Data Início Real', required: false, dataType: 'date' as const },
  { key: 'data_fim_real', label: 'Data Fim Real', required: false, dataType: 'date' as const },
  { key: 'data_inicio_baseline', label: 'Data Início Baseline', required: false, dataType: 'date' as const },
  { key: 'data_fim_baseline', label: 'Data Fim Baseline', required: false, dataType: 'date' as const },
  { key: 'duracao_dias', label: 'Duração (dias)', required: false, dataType: 'number' as const },
  { key: 'duracao_restante_dias', label: 'Duração Restante (dias)', required: false, dataType: 'number' as const },
  { key: 'percentual_conclusao', label: '% Conclusão', required: false, dataType: 'number' as const },
  { key: 'custo_orcado', label: 'Custo Orçado', required: false, dataType: 'number' as const },
  { key: 'custo_real', label: 'Custo Real', required: false, dataType: 'number' as const },
  { key: 'custo_restante', label: 'Custo Restante', required: false, dataType: 'number' as const },
  { key: 'is_marco', label: 'Marco', required: false, dataType: 'boolean' as const },
  { key: 'is_resumo', label: 'Resumo', required: false, dataType: 'boolean' as const },
  { key: 'is_critico', label: 'Crítico', required: false, dataType: 'boolean' as const },
  { key: 'prioridade', label: 'Prioridade', required: false, dataType: 'string' as const },
  { key: 'tipo_duracao', label: 'Tipo Duração', required: false, dataType: 'string' as const },
];

export const P6_TASK_COLUMNS = [
  { key: 'task_code', label: 'Código da Atividade', dataType: 'string' as const },
  { key: 'task_name', label: 'Nome da Atividade', dataType: 'string' as const },
  { key: 'wbs_id', label: 'ID WBS', dataType: 'string' as const },
  { key: 'wbs_name', label: 'Nome WBS', dataType: 'string' as const },
  { key: 'wbs_path', label: 'Caminho WBS', dataType: 'string' as const },
  { key: 'status_code', label: 'Status', dataType: 'string' as const },
  { key: 'start_date', label: 'Data Início', dataType: 'date' as const },
  { key: 'end_date', label: 'Data Fim', dataType: 'date' as const },
  { key: 'early_start_date', label: 'Início Cedo', dataType: 'date' as const },
  { key: 'early_end_date', label: 'Fim Cedo', dataType: 'date' as const },
  { key: 'late_start_date', label: 'Início Tarde', dataType: 'date' as const },
  { key: 'late_end_date', label: 'Fim Tarde', dataType: 'date' as const },
  { key: 'target_start_date', label: 'Início Target', dataType: 'date' as const },
  { key: 'target_end_date', label: 'Fim Target', dataType: 'date' as const },
  { key: 'act_start_date', label: 'Início Real', dataType: 'date' as const },
  { key: 'act_end_date', label: 'Fim Real', dataType: 'date' as const },
  { key: 'base_start_date', label: 'Início Baseline', dataType: 'date' as const },
  { key: 'base_end_date', label: 'Fim Baseline', dataType: 'date' as const },
  { key: 'primary_base_start_date', label: 'Início Baseline Primário', dataType: 'date' as const },
  { key: 'primary_base_end_date', label: 'Fim Baseline Primário', dataType: 'date' as const },
  { key: 'total_drtn_hr_cnt', label: 'Duração Total (h)', dataType: 'number' as const },
  { key: 'remain_drtn_hr_cnt', label: 'Duração Restante (h)', dataType: 'number' as const },
  { key: 'base_drtn_hr_cnt', label: 'Duração Baseline (h)', dataType: 'number' as const },
  { key: 'total_float_hr_cnt', label: 'Folga Total (h)', dataType: 'number' as const },
  { key: 'free_float_hr_cnt', label: 'Folga Livre (h)', dataType: 'number' as const },
  { key: 'complete_pct', label: '% Conclusão', dataType: 'number' as const },
  { key: 'drtn_complete_pct', label: '% Duração Concluída', dataType: 'number' as const },
  { key: 'work_complete_pct', label: '% Trabalho Concluído', dataType: 'number' as const },
  { key: 'critical_flag', label: 'Crítico', dataType: 'boolean' as const },
  { key: 'priority_type', label: 'Prioridade', dataType: 'string' as const },
  { key: 'duration_type', label: 'Tipo Duração', dataType: 'string' as const },
  { key: 'task_type', label: 'Tipo Atividade', dataType: 'string' as const },
  { key: 'total_cost', label: 'Custo Total', dataType: 'number' as const },
  { key: 'act_cost', label: 'Custo Real', dataType: 'number' as const },
  { key: 'remain_cost', label: 'Custo Restante', dataType: 'number' as const },
  { key: 'target_cost', label: 'Custo Target', dataType: 'number' as const },
  { key: 'base_cost', label: 'Custo Baseline', dataType: 'number' as const },
  { key: 'acwp', label: 'ACWP', dataType: 'number' as const },
  { key: 'bcwp', label: 'BCWP', dataType: 'number' as const },
  { key: 'bac', label: 'BAC', dataType: 'number' as const },
  { key: 'cpi', label: 'CPI', dataType: 'number' as const },
  { key: 'spi', label: 'SPI', dataType: 'number' as const },
  { key: 'cv', label: 'CV', dataType: 'number' as const },
  { key: 'sv', label: 'SV', dataType: 'number' as const },
  { key: 'eac', label: 'EAC', dataType: 'number' as const },
  { key: 'etc', label: 'ETC', dataType: 'number' as const },
  { key: 'vac', label: 'VAC', dataType: 'number' as const },
  { key: 'tcpi', label: 'TCPI', dataType: 'number' as const },
];

export const DEFAULT_COLUMN_MAPPINGS: Record<string, string> = {
  'task_code': 'codigo',
  'task_name': 'nome',
  'wbs_id': 'wbs_id',
  'target_start_date': 'data_inicio',
  'target_end_date': 'data_fim',
  'act_start_date': 'data_inicio_real',
  'act_end_date': 'data_fim_real',
  'primary_base_start_date': 'data_inicio_baseline',
  'primary_base_end_date': 'data_fim_baseline',
  'total_drtn_hr_cnt': 'duracao_dias',
  'remain_drtn_hr_cnt': 'duracao_restante_dias',
  'complete_pct': 'percentual_conclusao',
  'target_cost': 'custo_orcado',
  'act_cost': 'custo_real',
  'remain_cost': 'custo_restante',
  'critical_flag': 'is_critico',
  'priority_type': 'prioridade',
  'duration_type': 'tipo_duracao',
};
