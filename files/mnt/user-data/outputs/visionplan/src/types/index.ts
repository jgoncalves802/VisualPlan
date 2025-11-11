// Tipos baseados no Schema Prisma do VisionPlan

// Enums
export enum CamadaGovernanca {
  PROPONENTE = 'PROPONENTE',
  FISCALIZACAO = 'FISCALIZACAO',
  CONTRATADA = 'CONTRATADA'
}

export enum PerfilAcesso {
  ADMIN = 'ADMIN',
  DIRETOR = 'DIRETOR',
  GERENTE_PROJETO = 'GERENTE_PROJETO',
  ENGENHEIRO_PLANEJAMENTO = 'ENGENHEIRO_PLANEJAMENTO',
  COORDENADOR_OBRA = 'COORDENADOR_OBRA',
  MESTRE_OBRAS = 'MESTRE_OBRAS',
  ENCARREGADO = 'ENCARREGADO',
  COLABORADOR = 'COLABORADOR',
  FISCALIZACAO_LEAD = 'FISCALIZACAO_LEAD',
  FISCALIZACAO_TECNICO = 'FISCALIZACAO_TECNICO'
}

export enum StatusProjeto {
  PLANEJAMENTO = 'PLANEJAMENTO',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  PARALISADO = 'PARALISADO',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
}

export enum TipoAtividade {
  TAREFA = 'TAREFA',
  MARCO = 'MARCO',
  FASE = 'FASE',
  PACOTE_TRABALHO = 'PACOTE_TRABALHO'
}

export enum StatusAtividade {
  NAO_INICIADA = 'NAO_INICIADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  PARALISADA = 'PARALISADA',
  CANCELADA = 'CANCELADA'
}

export enum StatusRestricao {
  ABERTA = 'ABERTA',
  EM_TRATAMENTO = 'EM_TRATAMENTO',
  RESOLVIDA = 'RESOLVIDA',
  IMPEDITIVA = 'IMPEDITIVA'
}

export enum OrigemRestricao {
  PROPONENTE = 'PROPONENTE',
  FISCALIZACAO = 'FISCALIZACAO',
  CONTRATADA = 'CONTRATADA',
  SISTEMA = 'SISTEMA'
}

export enum TipoRestricao {
  PROJETO = 'PROJETO',
  MATERIAL = 'MATERIAL',
  MAO_OBRA = 'MAO_OBRA',
  EQUIPAMENTO = 'EQUIPAMENTO',
  CLIMA = 'CLIMA',
  FINANCEIRO = 'FINANCEIRO',
  QUALIDADE = 'QUALIDADE',
  SEGURANCA = 'SEGURANCA',
  OUTRO = 'OUTRO'
}

export enum StatusTarefa {
  A_FAZER = 'A_FAZER',
  FAZENDO = 'FAZENDO',
  CONCLUIDO = 'CONCLUIDO'
}

export enum TipoNotificacao {
  NOVA_TAREFA = 'NOVA_TAREFA',
  LOOK_AHEAD_PROXIMO = 'LOOK_AHEAD_PROXIMO',
  RESTRICAO_CRIADA = 'RESTRICAO_CRIADA',
  ACAO_ATRIBUIDA = 'ACAO_ATRIBUIDA',
  ATIVIDADE_ATRASADA = 'ATIVIDADE_ATRASADA',
  APROVACAO_PENDENTE = 'APROVACAO_PENDENTE',
  QUALIDADE_REPROVADA = 'QUALIDADE_REPROVADA'
}

// Tema Customizável por Empresa
export interface TemaEmpresa {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

// Interfaces principais
export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  ativo: boolean;
  tema?: TemaEmpresa;
  createdAt: Date;
  updatedAt: Date;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  empresaId: string;
  camadaGovernanca: CamadaGovernanca;
  perfilAcesso: PerfilAcesso;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  empresaId: string;
  status: StatusProjeto;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  orcamentoTotal?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Atividade {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  projetoId: string;
  atividadePaiId?: string;
  tipo: TipoAtividade;
  status: StatusAtividade;
  nivelWBS: number;
  dataInicioPlanejada?: Date;
  dataFimPlanejada?: Date;
  dataInicioReal?: Date;
  dataFimReal?: Date;
  duracao?: number;
  percentualConcluido: number;
  custoOrcado?: number;
  custoReal?: number;
  caminhoCritico: boolean;
  setorId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Restricao {
  id: string;
  descricao: string;
  atividadeId: string;
  tipo: TipoRestricao;
  status: StatusRestricao;
  origem: OrigemRestricao;
  responsavel?: string;
  causaParalisacao?: string;
  impeditiva: boolean;
  bloqueaCronograma: boolean;
  dataIdentificacao: Date;
  dataInicioBloqueio?: Date;
  dataFimBloqueio?: Date;
  dataResolucao?: Date;
  tempoParalisacao?: number;
  tempoTratativa?: number;
  criadoPorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TarefaUsuario {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusTarefa;
  usuarioId: string;
  atividadeId?: string;
  prioridade: number;
  dataCheckIn?: Date;
  dataCheckOut?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notificacao {
  id: string;
  usuarioId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string;
  createdAt: Date;
}

export interface KPIData {
  percentualPAC: number;
  tempoMedioResolucao: number;
  spi: number;
  cpi: number;
  restricoesImpeditivas: number;
  atividadesAtrasadas: number;
}

export interface DashboardData {
  kpis: KPIData;
  curvaS: Array<{ data: string; planejado: number; realizado: number }>;
  restricoesPorTipo: Record<TipoRestricao, number>;
  atividadesPorStatus: Record<StatusAtividade, number>;
}

export interface PlanoSemanalTrabalho {
  id: string;
  projetoId: string;
  numeroSemana: number;
  ano: number;
  dataInicio: Date;
  dataFim: Date;
  observacoes?: string;
  fechado: boolean;
  dataFechamento?: Date;
  percentualPAC?: number;
  createdAt: Date;
  updatedAt: Date;
}
