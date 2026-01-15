export type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

export type StatusProgramacao = 'PLANEJADA' | 'AGUARDANDO_ACEITE' | 'ACEITA' | 'EM_EXECUCAO' | 'CONCLUIDA' | 'CANCELADA';
export type StatusAtividade = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'NAO_CONCLUIDA' | 'CANCELADA';
export type Causa6M = 'MATERIAL' | 'MAO_DE_OBRA' | 'MAQUINA' | 'METODO' | 'MEIO_AMBIENTE' | 'MEDIDA' | 'SEGURANCA';
export type TipoAceite = 'ENVIO_PRODUCAO' | 'ACEITE_PRODUCAO' | 'REJEICAO_PRODUCAO' | 'RETORNO_PLANEJAMENTO';
export type TipoEmpresa = 'CONTRATADA' | 'CONTRATANTE' | 'FISCALIZACAO';
export type CategoriaInterferencia = 'MATERIAL' | 'MAO_DE_OBRA' | 'MAQUINA' | 'METODO' | 'MEIO_AMBIENTE' | 'MEDIDA' | 'SEGURANCA' | 'PROJETO' | 'CLIMA' | 'OUTRO';
export type StatusInterferencia = 'ABERTA' | 'EM_ANALISE' | 'RESOLVIDA' | 'CONVERTIDA_RESTRICAO';

export type CondicaoProntidao = 
  | 'PROJETO' 
  | 'MATERIAIS' 
  | 'MAO_DE_OBRA' 
  | 'EQUIPAMENTOS' 
  | 'ESPACO' 
  | 'TAREFAS_PREDECESSORAS' 
  | 'CONDICOES_EXTERNAS'
  | 'SEGURANCA';

export const CONDICOES_PRONTIDAO: CondicaoProntidao[] = [
  'PROJETO',
  'MATERIAIS',
  'MAO_DE_OBRA',
  'EQUIPAMENTOS',
  'ESPACO',
  'TAREFAS_PREDECESSORAS',
  'CONDICOES_EXTERNAS',
  'SEGURANCA',
];

export const CONDICAO_PRONTIDAO_LABEL: Record<CondicaoProntidao, string> = {
  PROJETO: 'Projeto / Informação',
  MATERIAIS: 'Materiais',
  MAO_DE_OBRA: 'Mão de Obra',
  EQUIPAMENTOS: 'Equipamentos / Ferramentas',
  ESPACO: 'Espaço / Área de Trabalho',
  TAREFAS_PREDECESSORAS: 'Tarefas Predecessoras',
  CONDICOES_EXTERNAS: 'Condições Externas',
  SEGURANCA: 'Segurança',
};

export const CONDICAO_PRONTIDAO_DESCRICAO: Record<CondicaoProntidao, string> = {
  PROJETO: 'Projeto aprovado, especificações e informações técnicas disponíveis',
  MATERIAIS: 'Materiais disponíveis no local em quantidade e qualidade suficiente',
  MAO_DE_OBRA: 'Equipe qualificada disponível para executar a tarefa',
  EQUIPAMENTOS: 'Equipamentos e ferramentas disponíveis e em bom estado',
  ESPACO: 'Área de trabalho liberada, limpa e pronta para a atividade',
  TAREFAS_PREDECESSORAS: 'Atividades anteriores concluídas conforme planejado',
  CONDICOES_EXTERNAS: 'Clima, licenças, autorizações e condições externas favoráveis',
  SEGURANCA: 'Condições de segurança garantidas e EPIs disponíveis',
};

export const CONDICAO_PARA_ISHIKAWA: Record<CondicaoProntidao, Causa6M> = {
  PROJETO: 'METODO',
  MATERIAIS: 'MATERIAL',
  MAO_DE_OBRA: 'MAO_DE_OBRA',
  EQUIPAMENTOS: 'MAQUINA',
  ESPACO: 'MEIO_AMBIENTE',
  TAREFAS_PREDECESSORAS: 'METODO',
  CONDICOES_EXTERNAS: 'MEIO_AMBIENTE',
  SEGURANCA: 'SEGURANCA',
};

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

export const STATUS_PROGRAMACAO_LABEL: Record<StatusProgramacao, string> = {
  PLANEJADA: 'Planejada',
  AGUARDANDO_ACEITE: 'Aguardando Aceite',
  ACEITA: 'Aceita',
  EM_EXECUCAO: 'Em Execução',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export const STATUS_PROGRAMACAO_CORES: Record<StatusProgramacao, string> = {
  PLANEJADA: '#6b7280',
  AGUARDANDO_ACEITE: '#f59e0b',
  ACEITA: '#10b981',
  EM_EXECUCAO: '#3b82f6',
  CONCLUIDA: '#22c55e',
  CANCELADA: '#ef4444',
};

export const TIPO_ACEITE_LABEL: Record<TipoAceite, string> = {
  ENVIO_PRODUCAO: 'Envio para Produção',
  ACEITE_PRODUCAO: 'Aceite da Produção',
  REJEICAO_PRODUCAO: 'Rejeição da Produção',
  RETORNO_PLANEJAMENTO: 'Retorno para Planejamento',
};

export const TIPO_EMPRESA_LABEL: Record<TipoEmpresa, string> = {
  CONTRATADA: 'Contratada',
  CONTRATANTE: 'Contratante',
  FISCALIZACAO: 'Fiscalização',
};

export const CATEGORIA_INTERFERENCIA_LABEL: Record<CategoriaInterferencia, string> = {
  MATERIAL: 'Material',
  MAO_DE_OBRA: 'Mão de Obra',
  MAQUINA: 'Máquina',
  METODO: 'Método',
  MEIO_AMBIENTE: 'Meio Ambiente',
  MEDIDA: 'Medida',
  SEGURANCA: 'Segurança',
  PROJETO: 'Projeto',
  CLIMA: 'Clima',
  OUTRO: 'Outro',
};

export const STATUS_INTERFERENCIA_LABEL: Record<StatusInterferencia, string> = {
  ABERTA: 'Aberta',
  EM_ANALISE: 'Em Análise',
  RESOLVIDA: 'Resolvida',
  CONVERTIDA_RESTRICAO: 'Convertida em Restrição',
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

export interface AceiteProgramacao {
  id: string;
  empresa_id: string;
  programacao_id: string;
  usuario_id: string;
  usuario_nome: string;
  setor: string;
  tipo_aceite: TipoAceite;
  observacoes?: string;
  data_aceite: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAceiteInput {
  programacao_id: string;
  tipo_aceite: TipoAceite;
  observacoes?: string;
}

export interface InterferenciaObra {
  id: string;
  empresa_id: string;
  projeto_id: string;
  programacao_id?: string;
  atividade_id?: string;
  atividade_codigo?: string;
  atividade_nome?: string;
  usuario_id: string;
  usuario_nome: string;
  setor: string;
  empresa_nome: string;
  tipo_empresa: TipoEmpresa;
  categoria?: CategoriaInterferencia;
  descricao: string;
  impacto?: string;
  acao_tomada?: string;
  data_ocorrencia: string;
  data_registro: string;
  convertida_restricao: boolean;
  restricao_id?: string;
  status: StatusInterferencia;
  created_at?: string;
  updated_at?: string;
}

export interface CreateInterferenciaInput {
  projeto_id: string;
  programacao_id?: string;
  atividade_id?: string;
  atividade_codigo?: string;
  atividade_nome?: string;
  setor: string;
  empresa_nome: string;
  tipo_empresa: TipoEmpresa;
  categoria?: CategoriaInterferencia;
  descricao: string;
  impacto?: string;
  acao_tomada?: string;
  data_ocorrencia: string;
}
