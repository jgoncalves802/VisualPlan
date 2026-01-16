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
  descricao?: string;
  notas?: string;
  wbs_id?: string;
  wbs_codigo?: string;
  wbs_nome?: string;
  wbs_caminho?: string;
  nivel?: number;
  parent_id?: string;
  data_inicio?: Date;
  data_fim?: Date;
  data_inicio_target?: Date;
  data_fim_target?: Date;
  data_inicio_real?: Date;
  data_fim_real?: Date;
  data_suspensao?: Date;
  data_retomada?: Date;
  data_inicio_baseline?: Date;
  data_fim_baseline?: Date;
  data_inicio_baseline_primario?: Date;
  data_fim_baseline_primario?: Date;
  data_inicio_baseline_secundario?: Date;
  data_fim_baseline_secundario?: Date;
  data_inicio_cedo?: Date;
  data_fim_cedo?: Date;
  data_inicio_tarde?: Date;
  data_fim_tarde?: Date;
  duracao_dias?: number;
  duracao_horas?: number;
  duracao_restante_dias?: number;
  duracao_restante_horas?: number;
  duracao_baseline?: number;
  duracao_real?: number;
  variacao_duracao?: number;
  folga_total?: number;
  folga_livre?: number;
  folga_restante?: number;
  percentual_conclusao?: number;
  percentual_duracao?: number;
  percentual_trabalho?: number;
  percentual_fisico?: number;
  percentual_performance?: number;
  custo_orcado?: number;
  custo_real?: number;
  custo_restante?: number;
  custo_total?: number;
  custo_baseline?: number;
  custo_target?: number;
  variacao_custo?: number;
  custo_mao_obra_real?: number;
  custo_material_real?: number;
  custo_equipamento_real?: number;
  custo_despesas_real?: number;
  custo_mao_obra_target?: number;
  custo_material_target?: number;
  custo_equipamento_target?: number;
  custo_despesas_target?: number;
  bcws?: number;
  bcwp?: number;
  acwp?: number;
  bac?: number;
  bac_trabalho?: number;
  eac?: number;
  etc?: number;
  vac?: number;
  cv?: number;
  sv?: number;
  cpi?: number;
  spi?: number;
  tcpi?: number;
  cv_percent?: number;
  sv_percent?: number;
  recurso_id?: string;
  recurso_nome?: string;
  lista_recursos?: string;
  horas_trabalho?: number;
  horas_trabalho_restante?: number;
  unidades?: number;
  unidades_restantes?: number;
  status?: string;
  is_marco?: boolean;
  is_resumo?: boolean;
  is_critico?: boolean;
  tipo_atividade?: string;
  prioridade?: string;
  tipo_duracao?: string;
  tipo_restricao?: string;
  data_restricao?: Date;
  predecessoras?: string;
  sucessoras?: string;
  predecessoras_detalhes?: string;
  sucessoras_detalhes?: string;
  calendario_id?: string;
  responsavel?: string;
  departamento?: string;
  local?: string;
  fase?: string;
  codigo_atividade_1?: string;
  codigo_atividade_2?: string;
  codigo_atividade_3?: string;
  user_defined_1?: string;
  user_defined_2?: string;
  user_defined_3?: string;
  user_defined_4?: string;
  user_defined_5?: string;
  peso?: number;
  quantidade?: number;
  unidade_medida?: string;
  [key: string]: unknown;
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

export interface VisionPlanColumnDefinition {
  key: string;
  label: string;
  category: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  description?: string;
}

export const VISIONPLAN_COLUMN_CATEGORIES = {
  IDENTIFICACAO: 'Identificação',
  DATAS_PLANEJADAS: 'Datas Planejadas',
  DATAS_REAIS: 'Datas Reais',
  DATAS_BASELINE: 'Datas Baseline',
  DATAS_CEDO_TARDE: 'Datas Cedo/Tarde (CPM)',
  DURACAO: 'Duração',
  FOLGA: 'Folga',
  PROGRESSO: 'Progresso',
  CUSTOS: 'Custos',
  CUSTOS_DETALHADOS: 'Custos Detalhados',
  EVM: 'Earned Value Management (EVM)',
  RECURSOS: 'Recursos',
  STATUS: 'Status e Tipo',
  WBS: 'WBS/Estrutura',
  DEPENDENCIAS: 'Dependências',
  OUTROS: 'Outros',
} as const;

export const VISIONPLAN_TASK_COLUMNS: VisionPlanColumnDefinition[] = [
  // IDENTIFICAÇÃO
  { key: 'codigo', label: 'Código', category: 'IDENTIFICACAO', required: true, dataType: 'string', description: 'Código único da atividade' },
  { key: 'nome', label: 'Nome', category: 'IDENTIFICACAO', required: true, dataType: 'string', description: 'Nome da atividade' },
  { key: 'descricao', label: 'Descrição', category: 'IDENTIFICACAO', required: false, dataType: 'string', description: 'Descrição detalhada' },
  { key: 'notas', label: 'Notas', category: 'IDENTIFICACAO', required: false, dataType: 'string', description: 'Notas e observações' },
  
  // WBS/ESTRUTURA
  { key: 'wbs_id', label: 'WBS ID', category: 'WBS', required: false, dataType: 'string', description: 'ID da WBS pai' },
  { key: 'wbs_codigo', label: 'WBS Código', category: 'WBS', required: false, dataType: 'string', description: 'Código da WBS' },
  { key: 'wbs_nome', label: 'WBS Nome', category: 'WBS', required: false, dataType: 'string', description: 'Nome da WBS' },
  { key: 'wbs_caminho', label: 'WBS Caminho', category: 'WBS', required: false, dataType: 'string', description: 'Caminho completo da WBS' },
  { key: 'nivel', label: 'Nível', category: 'WBS', required: false, dataType: 'number', description: 'Nível hierárquico' },
  { key: 'parent_id', label: 'Atividade Pai', category: 'WBS', required: false, dataType: 'string', description: 'ID da atividade pai' },
  
  // DATAS PLANEJADAS
  { key: 'data_inicio', label: 'Data Início Planejada', category: 'DATAS_PLANEJADAS', required: false, dataType: 'date', description: 'Data de início planejada' },
  { key: 'data_fim', label: 'Data Fim Planejada', category: 'DATAS_PLANEJADAS', required: false, dataType: 'date', description: 'Data de fim planejada' },
  { key: 'data_inicio_target', label: 'Data Início Target', category: 'DATAS_PLANEJADAS', required: false, dataType: 'date', description: 'Data de início target/meta' },
  { key: 'data_fim_target', label: 'Data Fim Target', category: 'DATAS_PLANEJADAS', required: false, dataType: 'date', description: 'Data de fim target/meta' },
  
  // DATAS REAIS
  { key: 'data_inicio_real', label: 'Data Início Real', category: 'DATAS_REAIS', required: false, dataType: 'date', description: 'Data de início real' },
  { key: 'data_fim_real', label: 'Data Fim Real', category: 'DATAS_REAIS', required: false, dataType: 'date', description: 'Data de fim real' },
  { key: 'data_suspensao', label: 'Data Suspensão', category: 'DATAS_REAIS', required: false, dataType: 'date', description: 'Data de suspensão' },
  { key: 'data_retomada', label: 'Data Retomada', category: 'DATAS_REAIS', required: false, dataType: 'date', description: 'Data de retomada' },
  
  // DATAS BASELINE
  { key: 'data_inicio_baseline', label: 'Data Início Baseline', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Data de início do baseline' },
  { key: 'data_fim_baseline', label: 'Data Fim Baseline', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Data de fim do baseline' },
  { key: 'data_inicio_baseline_primario', label: 'Início Baseline Primário', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Início do baseline primário' },
  { key: 'data_fim_baseline_primario', label: 'Fim Baseline Primário', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Fim do baseline primário' },
  { key: 'data_inicio_baseline_secundario', label: 'Início Baseline Secundário', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Início do baseline secundário' },
  { key: 'data_fim_baseline_secundario', label: 'Fim Baseline Secundário', category: 'DATAS_BASELINE', required: false, dataType: 'date', description: 'Fim do baseline secundário' },
  
  // DATAS CEDO/TARDE (CPM)
  { key: 'data_inicio_cedo', label: 'Início Cedo (ES)', category: 'DATAS_CEDO_TARDE', required: false, dataType: 'date', description: 'Early Start - Início mais cedo possível' },
  { key: 'data_fim_cedo', label: 'Fim Cedo (EF)', category: 'DATAS_CEDO_TARDE', required: false, dataType: 'date', description: 'Early Finish - Fim mais cedo possível' },
  { key: 'data_inicio_tarde', label: 'Início Tarde (LS)', category: 'DATAS_CEDO_TARDE', required: false, dataType: 'date', description: 'Late Start - Início mais tarde possível' },
  { key: 'data_fim_tarde', label: 'Fim Tarde (LF)', category: 'DATAS_CEDO_TARDE', required: false, dataType: 'date', description: 'Late Finish - Fim mais tarde possível' },
  
  // DURAÇÃO
  { key: 'duracao_dias', label: 'Duração (dias)', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração total em dias' },
  { key: 'duracao_horas', label: 'Duração (horas)', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração total em horas' },
  { key: 'duracao_restante_dias', label: 'Duração Restante (dias)', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração restante em dias' },
  { key: 'duracao_restante_horas', label: 'Duração Restante (horas)', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração restante em horas' },
  { key: 'duracao_baseline', label: 'Duração Baseline', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração do baseline em dias' },
  { key: 'duracao_real', label: 'Duração Real', category: 'DURACAO', required: false, dataType: 'number', description: 'Duração real em dias' },
  { key: 'variacao_duracao', label: 'Variação de Duração', category: 'DURACAO', required: false, dataType: 'number', description: 'Diferença entre planejado e real' },
  
  // FOLGA
  { key: 'folga_total', label: 'Folga Total', category: 'FOLGA', required: false, dataType: 'number', description: 'Total Float em dias' },
  { key: 'folga_livre', label: 'Folga Livre', category: 'FOLGA', required: false, dataType: 'number', description: 'Free Float em dias' },
  { key: 'folga_restante', label: 'Folga Restante', category: 'FOLGA', required: false, dataType: 'number', description: 'Folga restante em dias' },
  
  // PROGRESSO
  { key: 'percentual_conclusao', label: '% Conclusão', category: 'PROGRESSO', required: false, dataType: 'number', description: 'Percentual de conclusão física' },
  { key: 'percentual_duracao', label: '% Duração Concluída', category: 'PROGRESSO', required: false, dataType: 'number', description: 'Percentual de duração concluída' },
  { key: 'percentual_trabalho', label: '% Trabalho Concluído', category: 'PROGRESSO', required: false, dataType: 'number', description: 'Percentual de trabalho concluído' },
  { key: 'percentual_fisico', label: '% Físico', category: 'PROGRESSO', required: false, dataType: 'number', description: 'Progresso físico' },
  { key: 'percentual_performance', label: '% Performance', category: 'PROGRESSO', required: false, dataType: 'number', description: 'Percentual de performance' },
  
  // CUSTOS
  { key: 'custo_orcado', label: 'Custo Orçado', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo orçado total' },
  { key: 'custo_real', label: 'Custo Real', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo real incorrido' },
  { key: 'custo_restante', label: 'Custo Restante', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo restante estimado' },
  { key: 'custo_total', label: 'Custo Total', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo total (real + restante)' },
  { key: 'custo_baseline', label: 'Custo Baseline', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo do baseline' },
  { key: 'custo_target', label: 'Custo Target', category: 'CUSTOS', required: false, dataType: 'number', description: 'Custo meta/target' },
  { key: 'variacao_custo', label: 'Variação de Custo', category: 'CUSTOS', required: false, dataType: 'number', description: 'Diferença entre orçado e real' },
  
  // CUSTOS DETALHADOS
  { key: 'custo_mao_obra_real', label: 'Custo Mão de Obra Real', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo real de mão de obra' },
  { key: 'custo_material_real', label: 'Custo Material Real', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo real de materiais' },
  { key: 'custo_equipamento_real', label: 'Custo Equipamento Real', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo real de equipamentos' },
  { key: 'custo_despesas_real', label: 'Custo Despesas Real', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo real de despesas' },
  { key: 'custo_mao_obra_target', label: 'Custo Mão de Obra Target', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo target de mão de obra' },
  { key: 'custo_material_target', label: 'Custo Material Target', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo target de materiais' },
  { key: 'custo_equipamento_target', label: 'Custo Equipamento Target', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo target de equipamentos' },
  { key: 'custo_despesas_target', label: 'Custo Despesas Target', category: 'CUSTOS_DETALHADOS', required: false, dataType: 'number', description: 'Custo target de despesas' },
  
  // EVM (Earned Value Management)
  { key: 'bcws', label: 'BCWS (Valor Planejado)', category: 'EVM', required: false, dataType: 'number', description: 'Budgeted Cost of Work Scheduled' },
  { key: 'bcwp', label: 'BCWP (Valor Agregado)', category: 'EVM', required: false, dataType: 'number', description: 'Budgeted Cost of Work Performed' },
  { key: 'acwp', label: 'ACWP (Custo Real)', category: 'EVM', required: false, dataType: 'number', description: 'Actual Cost of Work Performed' },
  { key: 'bac', label: 'BAC (Orçamento na Conclusão)', category: 'EVM', required: false, dataType: 'number', description: 'Budget at Completion' },
  { key: 'bac_trabalho', label: 'BAC Trabalho', category: 'EVM', required: false, dataType: 'number', description: 'BAC baseado em trabalho' },
  { key: 'eac', label: 'EAC (Estimativa na Conclusão)', category: 'EVM', required: false, dataType: 'number', description: 'Estimate at Completion' },
  { key: 'etc', label: 'ETC (Estimativa para Conclusão)', category: 'EVM', required: false, dataType: 'number', description: 'Estimate to Complete' },
  { key: 'vac', label: 'VAC (Variação na Conclusão)', category: 'EVM', required: false, dataType: 'number', description: 'Variance at Completion' },
  { key: 'cv', label: 'CV (Variação de Custo)', category: 'EVM', required: false, dataType: 'number', description: 'Cost Variance = BCWP - ACWP' },
  { key: 'sv', label: 'SV (Variação de Prazo)', category: 'EVM', required: false, dataType: 'number', description: 'Schedule Variance = BCWP - BCWS' },
  { key: 'cpi', label: 'CPI (Índice de Custo)', category: 'EVM', required: false, dataType: 'number', description: 'Cost Performance Index = BCWP / ACWP' },
  { key: 'spi', label: 'SPI (Índice de Prazo)', category: 'EVM', required: false, dataType: 'number', description: 'Schedule Performance Index = BCWP / BCWS' },
  { key: 'tcpi', label: 'TCPI (Índice Necessário)', category: 'EVM', required: false, dataType: 'number', description: 'To Complete Performance Index' },
  { key: 'cv_percent', label: 'CV%', category: 'EVM', required: false, dataType: 'number', description: 'Variação de custo percentual' },
  { key: 'sv_percent', label: 'SV%', category: 'EVM', required: false, dataType: 'number', description: 'Variação de prazo percentual' },
  
  // RECURSOS
  { key: 'recurso_id', label: 'ID Recurso', category: 'RECURSOS', required: false, dataType: 'string', description: 'ID do recurso principal' },
  { key: 'recurso_nome', label: 'Nome Recurso', category: 'RECURSOS', required: false, dataType: 'string', description: 'Nome do recurso principal' },
  { key: 'lista_recursos', label: 'Lista de Recursos', category: 'RECURSOS', required: false, dataType: 'string', description: 'Lista de todos os recursos' },
  { key: 'horas_trabalho', label: 'Horas de Trabalho', category: 'RECURSOS', required: false, dataType: 'number', description: 'Total de horas de trabalho' },
  { key: 'horas_trabalho_restante', label: 'Horas Trabalho Restante', category: 'RECURSOS', required: false, dataType: 'number', description: 'Horas de trabalho restantes' },
  { key: 'unidades', label: 'Unidades', category: 'RECURSOS', required: false, dataType: 'number', description: 'Quantidade de unidades' },
  { key: 'unidades_restantes', label: 'Unidades Restantes', category: 'RECURSOS', required: false, dataType: 'number', description: 'Unidades restantes' },
  
  // STATUS E TIPO
  { key: 'status', label: 'Status', category: 'STATUS', required: false, dataType: 'string', description: 'Status da atividade' },
  { key: 'is_marco', label: 'Marco', category: 'STATUS', required: false, dataType: 'boolean', description: 'É um marco (milestone)' },
  { key: 'is_resumo', label: 'Resumo', category: 'STATUS', required: false, dataType: 'boolean', description: 'É uma atividade resumo' },
  { key: 'is_critico', label: 'Crítico', category: 'STATUS', required: false, dataType: 'boolean', description: 'Está no caminho crítico' },
  { key: 'tipo_atividade', label: 'Tipo Atividade', category: 'STATUS', required: false, dataType: 'string', description: 'Tipo da atividade' },
  { key: 'prioridade', label: 'Prioridade', category: 'STATUS', required: false, dataType: 'string', description: 'Nível de prioridade' },
  { key: 'tipo_duracao', label: 'Tipo Duração', category: 'STATUS', required: false, dataType: 'string', description: 'Tipo de duração (Fixed Units, etc)' },
  { key: 'tipo_restricao', label: 'Tipo Restrição', category: 'STATUS', required: false, dataType: 'string', description: 'Tipo de restrição de data' },
  { key: 'data_restricao', label: 'Data Restrição', category: 'STATUS', required: false, dataType: 'date', description: 'Data da restrição' },
  
  // DEPENDÊNCIAS
  { key: 'predecessoras', label: 'Predecessoras', category: 'DEPENDENCIAS', required: false, dataType: 'string', description: 'Lista de predecessoras' },
  { key: 'sucessoras', label: 'Sucessoras', category: 'DEPENDENCIAS', required: false, dataType: 'string', description: 'Lista de sucessoras' },
  { key: 'predecessoras_detalhes', label: 'Detalhes Predecessoras', category: 'DEPENDENCIAS', required: false, dataType: 'string', description: 'Detalhes das predecessoras' },
  { key: 'sucessoras_detalhes', label: 'Detalhes Sucessoras', category: 'DEPENDENCIAS', required: false, dataType: 'string', description: 'Detalhes das sucessoras' },
  
  // OUTROS
  { key: 'calendario_id', label: 'Calendário', category: 'OUTROS', required: false, dataType: 'string', description: 'ID do calendário' },
  { key: 'responsavel', label: 'Responsável', category: 'OUTROS', required: false, dataType: 'string', description: 'Responsável pela atividade' },
  { key: 'departamento', label: 'Departamento', category: 'OUTROS', required: false, dataType: 'string', description: 'Departamento responsável' },
  { key: 'local', label: 'Local', category: 'OUTROS', required: false, dataType: 'string', description: 'Local de execução' },
  { key: 'fase', label: 'Fase', category: 'OUTROS', required: false, dataType: 'string', description: 'Fase do projeto' },
  { key: 'codigo_atividade_1', label: 'Código Atividade 1', category: 'OUTROS', required: false, dataType: 'string', description: 'Código de atividade customizado 1' },
  { key: 'codigo_atividade_2', label: 'Código Atividade 2', category: 'OUTROS', required: false, dataType: 'string', description: 'Código de atividade customizado 2' },
  { key: 'codigo_atividade_3', label: 'Código Atividade 3', category: 'OUTROS', required: false, dataType: 'string', description: 'Código de atividade customizado 3' },
  { key: 'user_defined_1', label: 'Campo Customizado 1', category: 'OUTROS', required: false, dataType: 'string', description: 'Campo definido pelo usuário 1' },
  { key: 'user_defined_2', label: 'Campo Customizado 2', category: 'OUTROS', required: false, dataType: 'string', description: 'Campo definido pelo usuário 2' },
  { key: 'user_defined_3', label: 'Campo Customizado 3', category: 'OUTROS', required: false, dataType: 'string', description: 'Campo definido pelo usuário 3' },
  { key: 'user_defined_4', label: 'Campo Customizado 4', category: 'OUTROS', required: false, dataType: 'string', description: 'Campo definido pelo usuário 4' },
  { key: 'user_defined_5', label: 'Campo Customizado 5', category: 'OUTROS', required: false, dataType: 'string', description: 'Campo definido pelo usuário 5' },
  { key: 'peso', label: 'Peso', category: 'OUTROS', required: false, dataType: 'number', description: 'Peso/importância da atividade' },
  { key: 'quantidade', label: 'Quantidade', category: 'OUTROS', required: false, dataType: 'number', description: 'Quantidade física' },
  { key: 'unidade_medida', label: 'Unidade de Medida', category: 'OUTROS', required: false, dataType: 'string', description: 'Unidade de medida' },
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
  'wbs_name': 'wbs_nome',
  'wbs_path': 'wbs_caminho',
  'status_code': 'status',
  'task_type': 'tipo_atividade',
  'target_start_date': 'data_inicio',
  'target_end_date': 'data_fim',
  'start_date': 'data_inicio',
  'end_date': 'data_fim',
  'act_start_date': 'data_inicio_real',
  'act_end_date': 'data_fim_real',
  'early_start_date': 'data_inicio_cedo',
  'early_end_date': 'data_fim_cedo',
  'late_start_date': 'data_inicio_tarde',
  'late_end_date': 'data_fim_tarde',
  'base_start_date': 'data_inicio_baseline',
  'base_end_date': 'data_fim_baseline',
  'primary_base_start_date': 'data_inicio_baseline_primario',
  'primary_base_end_date': 'data_fim_baseline_primario',
  'secondary_base_start_date': 'data_inicio_baseline_secundario',
  'secondary_base_end_date': 'data_fim_baseline_secundario',
  'total_drtn_hr_cnt': 'duracao_dias',
  'remain_drtn_hr_cnt': 'duracao_restante_dias',
  'base_drtn_hr_cnt': 'duracao_baseline',
  'act_drtn_hr_cnt': 'duracao_real',
  'total_float_hr_cnt': 'folga_total',
  'free_float_hr_cnt': 'folga_livre',
  'remain_float_hr_cnt': 'folga_restante',
  'complete_pct': 'percentual_conclusao',
  'drtn_complete_pct': 'percentual_duracao',
  'work_complete_pct': 'percentual_trabalho',
  'perfm_complete_pct': 'percentual_performance',
  'phys_complete_pct': 'percentual_fisico',
  'target_cost': 'custo_orcado',
  'act_cost': 'custo_real',
  'remain_cost': 'custo_restante',
  'total_cost': 'custo_total',
  'base_cost': 'custo_baseline',
  'act_work_cost': 'custo_mao_obra_real',
  'act_mat_cost': 'custo_material_real',
  'act_equip_cost': 'custo_equipamento_real',
  'act_expense_cost': 'custo_despesas_real',
  'target_work_cost': 'custo_mao_obra_target',
  'target_mat_cost': 'custo_material_target',
  'target_equip_cost': 'custo_equipamento_target',
  'target_expense_cost': 'custo_despesas_target',
  'bcws': 'bcws',
  'bcwp': 'bcwp',
  'acwp': 'acwp',
  'bac': 'bac',
  'bac_work': 'bac_trabalho',
  'eac': 'eac',
  'etc': 'etc',
  'vac': 'vac',
  'cv': 'cv',
  'sv': 'sv',
  'cpi': 'cpi',
  'spi': 'spi',
  'tcpi': 'tcpi',
  'critical_flag': 'is_critico',
  'priority_type': 'prioridade',
  'duration_type': 'tipo_duracao',
  'clndr_id': 'calendario_id',
  'rsrc_id': 'recurso_id',
  'pred_list': 'predecessoras',
  'succ_list': 'sucessoras',
};

export const P6_COLUMN_PATTERNS: Array<{ pattern: RegExp; visionplanField: string }> = [
  { pattern: /^task[_\s]?code$/i, visionplanField: 'codigo' },
  { pattern: /^(activity[_\s]?)?id$/i, visionplanField: 'codigo' },
  { pattern: /^task[_\s]?name$/i, visionplanField: 'nome' },
  { pattern: /^(activity[_\s]?)?name$/i, visionplanField: 'nome' },
  { pattern: /^wbs[_\s]?id$/i, visionplanField: 'wbs_id' },
  { pattern: /^wbs[_\s]?name$/i, visionplanField: 'wbs_nome' },
  { pattern: /^wbs[_\s]?(path|full[_\s]?name)$/i, visionplanField: 'wbs_caminho' },
  { pattern: /^status[_\s]?code$/i, visionplanField: 'status' },
  { pattern: /^task[_\s]?type$/i, visionplanField: 'tipo_atividade' },
  { pattern: /^(target[_\s]?)?start[_\s]?date$/i, visionplanField: 'data_inicio' },
  { pattern: /^(target[_\s]?)?end[_\s]?date$/i, visionplanField: 'data_fim' },
  { pattern: /^(target[_\s]?)?finish[_\s]?date$/i, visionplanField: 'data_fim' },
  { pattern: /^act(ual)?[_\s]?start[_\s]?date$/i, visionplanField: 'data_inicio_real' },
  { pattern: /^act(ual)?[_\s]?(end|finish)[_\s]?date$/i, visionplanField: 'data_fim_real' },
  { pattern: /^early[_\s]?start[_\s]?date$/i, visionplanField: 'data_inicio_cedo' },
  { pattern: /^early[_\s]?(end|finish)[_\s]?date$/i, visionplanField: 'data_fim_cedo' },
  { pattern: /^late[_\s]?start[_\s]?date$/i, visionplanField: 'data_inicio_tarde' },
  { pattern: /^late[_\s]?(end|finish)[_\s]?date$/i, visionplanField: 'data_fim_tarde' },
  { pattern: /^(base(line)?|bl)[_\s]?start[_\s]?date$/i, visionplanField: 'data_inicio_baseline' },
  { pattern: /^(base(line)?|bl)[_\s]?(end|finish)[_\s]?date$/i, visionplanField: 'data_fim_baseline' },
  { pattern: /^(primary|bl1)[_\s]?base[_\s]?start[_\s]?date$/i, visionplanField: 'data_inicio_baseline_primario' },
  { pattern: /^(primary|bl1)[_\s]?base[_\s]?(end|finish)[_\s]?date$/i, visionplanField: 'data_fim_baseline_primario' },
  { pattern: /^total[_\s]?dr(tn|ation)[_\s]?(hr[_\s]?cnt|hours?)$/i, visionplanField: 'duracao_dias' },
  { pattern: /^(original[_\s]?)?duration$/i, visionplanField: 'duracao_dias' },
  { pattern: /^remain(ing)?[_\s]?dr(tn|ation)[_\s]?(hr[_\s]?cnt|hours?)$/i, visionplanField: 'duracao_restante_dias' },
  { pattern: /^remain(ing)?[_\s]?duration$/i, visionplanField: 'duracao_restante_dias' },
  { pattern: /^base[_\s]?dr(tn|ation)[_\s]?(hr[_\s]?cnt|hours?)$/i, visionplanField: 'duracao_baseline' },
  { pattern: /^(bl|baseline)[_\s]?duration$/i, visionplanField: 'duracao_baseline' },
  { pattern: /^act(ual)?[_\s]?dr(tn|ation)[_\s]?(hr[_\s]?cnt|hours?)$/i, visionplanField: 'duracao_real' },
  { pattern: /^actual[_\s]?duration$/i, visionplanField: 'duracao_real' },
  { pattern: /^total[_\s]?float[_\s]?(hr[_\s]?cnt|hours?)?$/i, visionplanField: 'folga_total' },
  { pattern: /^free[_\s]?float[_\s]?(hr[_\s]?cnt|hours?)?$/i, visionplanField: 'folga_livre' },
  { pattern: /^remain(ing)?[_\s]?float[_\s]?(hr[_\s]?cnt|hours?)?$/i, visionplanField: 'folga_restante' },
  { pattern: /^complete[_\s]?p(ct|ercent)$/i, visionplanField: 'percentual_conclusao' },
  { pattern: /^(activity[_\s]?)?%[_\s]?complete$/i, visionplanField: 'percentual_conclusao' },
  { pattern: /^dr(tn|ation)[_\s]?complete[_\s]?p(ct|ercent)$/i, visionplanField: 'percentual_duracao' },
  { pattern: /^(duration|physical)[_\s]?%[_\s]?complete$/i, visionplanField: 'percentual_duracao' },
  { pattern: /^work[_\s]?complete[_\s]?p(ct|ercent)$/i, visionplanField: 'percentual_trabalho' },
  { pattern: /^perf(m|ormance)?[_\s]?complete[_\s]?p(ct|ercent)$/i, visionplanField: 'percentual_performance' },
  { pattern: /^target[_\s]?cost$/i, visionplanField: 'custo_orcado' },
  { pattern: /^budget(ed)?[_\s]?cost$/i, visionplanField: 'custo_orcado' },
  { pattern: /^act(ual)?[_\s]?cost$/i, visionplanField: 'custo_real' },
  { pattern: /^remain(ing)?[_\s]?cost$/i, visionplanField: 'custo_restante' },
  { pattern: /^total[_\s]?cost$/i, visionplanField: 'custo_total' },
  { pattern: /^(eac|at[_\s]?completion)[_\s]?cost$/i, visionplanField: 'custo_total' },
  { pattern: /^base(line)?[_\s]?cost$/i, visionplanField: 'custo_baseline' },
  { pattern: /^bcws$/i, visionplanField: 'bcws' },
  { pattern: /^bcwp$/i, visionplanField: 'bcwp' },
  { pattern: /^acwp$/i, visionplanField: 'acwp' },
  { pattern: /^bac$/i, visionplanField: 'bac' },
  { pattern: /^eac$/i, visionplanField: 'eac' },
  { pattern: /^etc$/i, visionplanField: 'etc' },
  { pattern: /^vac$/i, visionplanField: 'vac' },
  { pattern: /^cv$/i, visionplanField: 'cv' },
  { pattern: /^sv$/i, visionplanField: 'sv' },
  { pattern: /^cpi$/i, visionplanField: 'cpi' },
  { pattern: /^spi$/i, visionplanField: 'spi' },
  { pattern: /^tcpi$/i, visionplanField: 'tcpi' },
  { pattern: /^critical[_\s]?(flag|path)?$/i, visionplanField: 'is_critico' },
  { pattern: /^is[_\s]?critical$/i, visionplanField: 'is_critico' },
  { pattern: /^priority[_\s]?(type)?$/i, visionplanField: 'prioridade' },
  { pattern: /^duration[_\s]?type$/i, visionplanField: 'tipo_duracao' },
  { pattern: /^cal(endar|ndr)[_\s]?id$/i, visionplanField: 'calendario_id' },
  { pattern: /^rsrc[_\s]?id$/i, visionplanField: 'recurso_id' },
  { pattern: /^resource[_\s]?id$/i, visionplanField: 'recurso_id' },
  { pattern: /^pred(ecessor)?[_\s]?list$/i, visionplanField: 'predecessoras' },
  { pattern: /^succ(essor)?[_\s]?list$/i, visionplanField: 'sucessoras' },
];

export function autoMapP6Column(p6ColumnName: string): string | null {
  const normalized = p6ColumnName.trim().toLowerCase();
  
  if (DEFAULT_COLUMN_MAPPINGS[normalized]) {
    return DEFAULT_COLUMN_MAPPINGS[normalized];
  }
  
  for (const { pattern, visionplanField } of P6_COLUMN_PATTERNS) {
    if (pattern.test(p6ColumnName)) {
      return visionplanField;
    }
  }
  
  return null;
}

export function generateAutoMappings(p6Columns: string[]): Record<string, string> {
  const mappings: Record<string, string> = {};
  const usedVisionPlanFields = new Set<string>();
  
  for (const p6Col of p6Columns) {
    const visionPlanField = autoMapP6Column(p6Col);
    if (visionPlanField && !usedVisionPlanFields.has(visionPlanField)) {
      mappings[p6Col] = visionPlanField;
      usedVisionPlanFields.add(visionPlanField);
    }
  }
  
  return mappings;
}
