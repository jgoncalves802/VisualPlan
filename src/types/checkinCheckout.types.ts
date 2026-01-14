export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type StatusProgramacao = 'PLANEJADA' | 'EM_EXECUCAO' | 'CONCLUIDA' | 'CANCELADA';
export type StatusAtividade = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_CONCLUIDA' | 'CANCELADA';
export type Causa6M = 'MATERIAL' | 'MAO_DE_OBRA' | 'MAQUINA' | 'METODO' | 'MEIO_AMBIENTE' | 'MEDIDA' | 'SEGURANCA';

export const DIAS_SEMANA: DiaSemana[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

export const DIAS_SEMANA_LABEL: Record<DiaSemana, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
};

export const CAUSAS_6M_LABEL: Record<Causa6M, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de Obra',
  MAQUINA: 'Máquina',
  METODO: 'Método',
  MEIO_AMBIENTE: 'Meio Ambiente',
  MEDIDA: 'Medida',
  SEGURANCA: 'Segurança',
};

export const CAUSAS_6M_CORES: Record<Causa6M, string> = {
  MATERIAL: '#ef4444',
  MAO_DE_OBRA: '#f97316',
  MAQUINA: '#eab308',
  METODO: '#22c55e',
  MEIO_AMBIENTE: '#06b6d4',
  MEDIDA: '#8b5cf6',
  SEGURANCA: '#ec4899',
};

export interface ProgramacaoSemanal {
  id: string;
  empresa_id: string;
  projeto_id: string;
  semana: number;
  ano: number;
  data_inicio: string;
  data_fim: string;
  status: StatusProgramacao;
  ppc_semanal: number;
  total_atividades: number;
  atividades_concluidas: number;
  atividades_com_restricao: number;
  observacoes?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProgramacaoAtividade {
  id: string;
  programacao_id: string;
  empresa_id: string;
  atividade_cronograma_id?: string;
  codigo?: string;
  nome: string;
  area?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  unidade: string;
  tem_restricao: boolean;
  restricao_id?: string;
  restricao_descricao?: string;
  prev_seg: number;
  prev_ter: number;
  prev_qua: number;
  prev_qui: number;
  prev_sex: number;
  prev_sab: number;
  prev_dom: number;
  real_seg: number;
  real_ter: number;
  real_qua: number;
  real_qui: number;
  real_sex: number;
  real_sab: number;
  real_dom: number;
  total_previsto?: number;
  total_realizado?: number;
  ppc_atividade: number;
  status: StatusAtividade;
  observacao?: string;
  ordem: number;
  created_at?: string;
  updated_at?: string;
}

export interface CheckinCheckout {
  id: string;
  programacao_atividade_id: string;
  empresa_id: string;
  data: string;
  dia_semana: DiaSemana;
  previsto: number;
  realizado: number;
  concluido: boolean;
  causa_nao_cumprimento?: Causa6M;
  causa_descricao?: string;
  observacao?: string;
  registrado_por?: string;
  registrado_por_nome?: string;
  registrado_em?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PPCDiario {
  id: string;
  programacao_id: string;
  empresa_id: string;
  data: string;
  dia_semana: DiaSemana;
  total_atividades: number;
  atividades_concluidas: number;
  atividades_nao_concluidas: number;
  atividades_com_restricao: number;
  ppc: number;
  causas_6m: Record<Causa6M, number>;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProgramacaoSemanalInput {
  projeto_id: string;
  semana: number;
  ano: number;
  data_inicio: string;
  data_fim: string;
  observacoes?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
}

export interface CreateProgramacaoAtividadeInput {
  programacao_id: string;
  atividade_cronograma_id?: string;
  codigo?: string;
  nome: string;
  area?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  unidade?: string;
  tem_restricao?: boolean;
  restricao_id?: string;
  restricao_descricao?: string;
  prev_seg?: number;
  prev_ter?: number;
  prev_qua?: number;
  prev_qui?: number;
  prev_sex?: number;
  prev_sab?: number;
  prev_dom?: number;
  ordem?: number;
}

export interface UpdateCheckInInput {
  programacao_atividade_id: string;
  dia_semana: DiaSemana;
  data: string;
  realizado: number;
  concluido: boolean;
  causa_nao_cumprimento?: Causa6M;
  causa_descricao?: string;
  observacao?: string;
}

export interface TakeoffItemVinculado {
  id: string;
  itemId: string;
  descricao: string;
  unidade: string;
  qtdTotal: number;
  qtdDiaria: number;
  peso: number;
}

export interface AtividadeParaProgramar {
  id: string;
  codigo?: string;
  nome: string;
  area?: string;
  responsavel_nome?: string;
  tem_restricao: boolean;
  restricao_id?: string;
  restricao_descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  duracao_dias?: number;
  itens_takeoff?: TakeoffItemVinculado[];
}

export interface MetricasPPC {
  ppc_semanal: number;
  ppc_por_dia: Record<DiaSemana, number>;
  total_atividades: number;
  atividades_concluidas: number;
  atividades_nao_concluidas: number;
  atividades_com_restricao: number;
  causas_6m: Record<Causa6M, number>;
}
