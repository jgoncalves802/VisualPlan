export interface Baseline {
  id: string;
  empresa_id: string;
  projeto_id: string;
  numero: number;
  nome: string;
  descricao?: string;
  ativa: boolean;
  data_criacao: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  duracao_total_dias?: number;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  custo_total_previsto?: number;
  hh_total_previsto?: number;
  motivo_revisao?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface BaselineDTO {
  empresa_id: string;
  projeto_id: string;
  numero: number;
  nome: string;
  descricao?: string;
  ativa?: boolean;
  data_criacao?: string;
  data_aprovacao?: string;
  aprovado_por?: string;
  duracao_total_dias?: number;
  data_inicio_prevista?: string;
  data_fim_prevista?: string;
  custo_total_previsto?: number;
  hh_total_previsto?: number;
  motivo_revisao?: string;
  created_by?: string;
}

export type TipoCurvaS = 
  | 'planejado' 
  | 'previsto' 
  | 'realizado' 
  | `baseline_${number}`;

export interface CurvaSItem {
  id: string;
  empresa_id: string;
  projeto_id: string;
  baseline_id?: string;
  data_referencia: string;
  periodo_ordem: number;
  periodo_label?: string;
  tipo_curva: TipoCurvaS;
  percentual_periodo: number;
  percentual_acumulado: number;
  valor_periodo: number;
  valor_acumulado: number;
  hh_periodo: number;
  hh_acumulado: number;
  atividades_periodo: number;
  atividades_acumulado: number;
  fonte_dados: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CurvaSDTO {
  empresa_id: string;
  projeto_id: string;
  baseline_id?: string;
  data_referencia: string;
  periodo_ordem: number;
  periodo_label?: string;
  tipo_curva: TipoCurvaS;
  percentual_periodo?: number;
  percentual_acumulado?: number;
  valor_periodo?: number;
  valor_acumulado?: number;
  hh_periodo?: number;
  hh_acumulado?: number;
  atividades_periodo?: number;
  atividades_acumulado?: number;
  fonte_dados?: string;
  observacoes?: string;
  created_by?: string;
}

export interface SnapshotEVM {
  id: string;
  empresa_id: string;
  projeto_id: string;
  data_status: string;
  periodo_referencia?: string;
  pv_acumulado: number;
  pv_periodo: number;
  ev_acumulado: number;
  ev_periodo: number;
  ac_acumulado: number;
  ac_periodo: number;
  bac: number;
  cv: number;
  sv: number;
  cpi: number;
  spi: number;
  tcpi?: number;
  eac?: number;
  etc?: number;
  vac?: number;
  percentual_fisico: number;
  percentual_financeiro: number;
  observacoes?: string;
  gerado_automaticamente: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface SnapshotEVMDTO {
  empresa_id: string;
  projeto_id: string;
  data_status: string;
  periodo_referencia?: string;
  pv_acumulado?: number;
  pv_periodo?: number;
  ev_acumulado?: number;
  ev_periodo?: number;
  ac_acumulado?: number;
  ac_periodo?: number;
  bac?: number;
  cv?: number;
  sv?: number;
  cpi?: number;
  spi?: number;
  tcpi?: number;
  eac?: number;
  etc?: number;
  vac?: number;
  percentual_fisico?: number;
  percentual_financeiro?: number;
  observacoes?: string;
  gerado_automaticamente?: boolean;
  created_by?: string;
}

export interface IndicadorLPS {
  id: string;
  empresa_id: string;
  projeto_id: string;
  data_inicio: string;
  data_fim: string;
  semana_numero?: number;
  ano?: number;
  atividades_planejadas: number;
  atividades_concluidas: number;
  ppc: number;
  restricoes_identificadas: number;
  restricoes_removidas: number;
  tmr: number;
  causas_mao_obra: number;
  causas_material: number;
  causas_maquina: number;
  causas_metodo: number;
  causas_meio_ambiente: number;
  causas_medicao: number;
  causas_outras: number;
  compromissos_assumidos: number;
  compromissos_cumpridos: number;
  taxa_compromisso: number;
  atividades_lookahead: number;
  restricoes_lookahead: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface IndicadorQualidade {
  id: string;
  empresa_id: string;
  projeto_id: string;
  data_referencia: string;
  periodo: string;
  total_auditorias: number;
  auditorias_conformes: number;
  auditorias_nao_conformes: number;
  taxa_conformidade: number;
  ncs_abertas: number;
  ncs_fechadas: number;
  ncs_em_tratamento: number;
  tempo_medio_resolucao: number;
  total_inspecoes: number;
  inspecoes_aprovadas: number;
  inspecoes_reprovadas: number;
  taxa_aprovacao: number;
  horas_retrabalho: number;
  custo_retrabalho: number;
  taxa_retrabalho: number;
  incidentes_seguranca: number;
  dias_sem_acidentes: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CurvaSChartData {
  periodo: string;
  ordem: number;
  planejado?: number;
  previsto?: number;
  realizado?: number;
  [key: `baseline_${number}`]: number | undefined;
}
