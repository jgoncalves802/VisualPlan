/**
 * Types para os módulos de Gestão de Projetos
 * Dashboard, 5W2H, Auditoria, PDCA, Gestão da Mudança
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum StatusAcao5W2H {
  PENDENTE = 'PENDENTE',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  ATRASADA = 'ATRASADA',
  CANCELADA = 'CANCELADA',
}

export enum PrioridadeAcao {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAIXA = 'BAIXA',
}

export enum OrigemAcao {
  RESTRICAO_LPS = 'RESTRICAO_LPS',
  AUDITORIA = 'AUDITORIA',
  MUDANCA = 'MUDANCA',
  PDCA = 'PDCA',
  MANUAL = 'MANUAL',
  KPI_DESVIO = 'KPI_DESVIO',
}

export enum StatusAuditoria {
  PLANEJADA = 'PLANEJADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum StatusItemAuditoria {
  CONFORME = 'CONFORME',
  NAO_CONFORME = 'NAO_CONFORME',
  NAO_APLICAVEL = 'NAO_APLICAVEL',
  PENDENTE = 'PENDENTE',
}

export enum FasePDCA {
  PLAN = 'PLAN',
  DO = 'DO',
  CHECK = 'CHECK',
  ACT = 'ACT',
}

export enum StatusMudanca {
  RASCUNHO = 'RASCUNHO',
  ANALISE = 'ANALISE',
  APROVADA = 'APROVADA',
  REJEITADA = 'REJEITADA',
  IMPLEMENTADA = 'IMPLEMENTADA',
}

export enum TipoReuniao {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  QUINZENAL = 'QUINZENAL',
  MENSAL = 'MENSAL',
  EXTRAORDINARIA = 'EXTRAORDINARIA',
}

export enum SetorDashboard {
  CRONOGRAMA_EVM = 'CRONOGRAMA_EVM',
  PRODUCAO_LPS = 'PRODUCAO_LPS',
  QUALIDADE = 'QUALIDADE',
  RECURSOS = 'RECURSOS',
  GESTAO = 'GESTAO',
}

export enum StatusSemaforo {
  VERDE = 'VERDE',
  AMARELO = 'AMARELO',
  VERMELHO = 'VERMELHO',
}

// ============================================================================
// INTERFACES - INDICADORES
// ============================================================================

export interface Indicador {
  id: string;
  nome: string;
  sigla: string;
  descricao?: string;
  setor: SetorDashboard;
  valor: number;
  meta: number;
  unidade: string;
  semaforo: StatusSemaforo;
  tendencia?: 'SUBINDO' | 'DESCENDO' | 'ESTAVEL';
  variacao?: number;
  dataAtualizacao: Date;
  formula?: string;
  fonte?: string;
  frequencia?: 'DIARIO' | 'SEMANAL' | 'MENSAL';
}

export interface HistoricoIndicador {
  id: string;
  indicadorId: string;
  valor: number;
  data: Date;
  observacao?: string;
}

// ============================================================================
// INTERFACES - 5W2H
// ============================================================================

export interface Acao5W2H {
  id: string;
  codigo: string;
  oQue: string;
  porQue: string;
  onde?: string;
  quando: Date;
  quem: string;
  quemId?: string;
  como?: string;
  quanto?: number;
  quantoDescricao?: string;
  status: StatusAcao5W2H;
  prioridade: PrioridadeAcao;
  origem: OrigemAcao;
  origemId?: string;
  origemDescricao?: string;
  atividadeGanttId?: string;
  restricaoLpsId?: string;
  auditoriaId?: string;
  kanbanCardId?: string;
  dataCriacao: Date;
  dataConclusao?: Date;
  observacoes?: string;
  percentualConcluido?: number;
  tags?: string[];
}

// ============================================================================
// INTERFACES - AUDITORIA
// ============================================================================

export interface ItemAuditoria {
  id: string;
  auditoriaId: string;
  ordem: number;
  pergunta: string;
  status: StatusItemAuditoria;
  observacao?: string;
  evidencia?: string;
  acaoCorretiva?: string;
  acao5w2hId?: string;
}

export interface Auditoria {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  responsavel: string;
  responsavelId?: string;
  dataAuditoria: Date;
  status: StatusAuditoria;
  itens: ItemAuditoria[];
  percentualConformidade?: number;
  acoesGeradas?: string[];
  observacoesGerais?: string;
  dataCriacao: Date;
  atividadeGanttId?: string;
}

// ============================================================================
// INTERFACES - PDCA
// ============================================================================

export interface CicloPDCA {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  fase: FasePDCA;
  origemProblema?: string;
  analiseRaiz?: string;
  planoPlan?: string;
  planoDo?: string;
  resultadosCheck?: string;
  padronizacaoAct?: string;
  responsavel: string;
  responsavelId?: string;
  dataInicio: Date;
  dataFim?: Date;
  licoesAprendidas?: string;
  acoes5w2h?: string[];
  indicadorId?: string;
  valorInicial?: number;
  valorFinal?: number;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
}

export interface LicaoAprendida {
  id: string;
  titulo: string;
  descricao: string;
  contexto?: string;
  categoria: string;
  impacto: 'POSITIVO' | 'NEGATIVO';
  recomendacao?: string;
  tags?: string[];
  projetoId?: string;
  ciclopdcaId?: string;
  dataCriacao: Date;
  criadoPor?: string;
}

// ============================================================================
// INTERFACES - GESTÃO DA MUDANÇA
// ============================================================================

export interface SolicitacaoMudanca {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  justificativa?: string;
  solicitante: string;
  solicitanteId?: string;
  dataSolicitacao: Date;
  status: StatusMudanca;
  impactoCronograma?: number;
  impactoCusto?: number;
  impactoQualidade?: string;
  impactoRisco?: string;
  baselineAfetada?: string;
  atividadesNovas?: number;
  atividadesRemovidas?: number;
  aprovador?: string;
  aprovadorId?: string;
  dataAprovacao?: Date;
  observacoesAprovacao?: string;
  acoes5w2h?: string[];
}

// ============================================================================
// INTERFACES - REUNIÕES
// ============================================================================

export interface Reuniao {
  id: string;
  tipo: TipoReuniao;
  titulo: string;
  descricao?: string;
  frequencia: string;
  participantes: string[];
  pautaFixa?: string[];
  proximaData?: Date;
  horaInicio?: string;
  duracao?: number;
  local?: string;
  ativo: boolean;
}

export interface PautaReuniao {
  id: string;
  reuniaoId: string;
  data: Date;
  itens: ItemPauta[];
  participantesPresentes?: string[];
  observacoes?: string;
  acoesGeradas?: string[];
}

export interface ItemPauta {
  id: string;
  titulo: string;
  tipo: 'RESTRICAO' | 'KPI' | 'ACAO' | 'INFORMATIVO' | 'DELIBERATIVO';
  origemId?: string;
  descricao?: string;
  responsavel?: string;
  decisao?: string;
}

// ============================================================================
// INTERFACES - KANBAN MULTI-ORIGEM
// ============================================================================

export type OrigemCard = 'GANTT' | 'ACAO_5W2H' | 'RESTRICAO_LPS' | 'AUDITORIA' | 'PDCA' | 'MUDANCA';

export interface KanbanCardExtended {
  id: string;
  titulo: string;
  descricao?: string;
  origem: OrigemCard;
  origemId: string;
  cor: string;
  responsavel?: string;
  responsavelId?: string;
  dataLimite?: Date;
  prioridade?: PrioridadeAcao;
  status: string;
  colunaId: string;
  ordem: number;
  tags?: string[];
  linkAtividadeGantt?: string;
}

// ============================================================================
// INTERFACES - DASHBOARD SETORIZADO
// ============================================================================

export interface SetorIndicadores {
  id: SetorDashboard;
  nome: string;
  icone: string;
  cor: string;
  indicadores: Indicador[];
  expandido: boolean;
}

export interface DashboardState {
  setores: SetorIndicadores[];
  filtroDataInicio?: Date;
  filtroDataFim?: Date;
  projetoId?: string;
  ultimaAtualizacao: Date;
}

// ============================================================================
// INTERFACES - DIAGNÓSTICO DE RECURSOS
// ============================================================================

export interface CompetenciaRecurso {
  id: string;
  nome: string;
  nivel: number;
  nivelMeta: number;
}

export interface DiagnosticoRecurso {
  id: string;
  recursoId: string;
  recursoNome: string;
  competencias: CompetenciaRecurso[];
  capacidadeHoras: number;
  alocacaoAtual: number;
  percentualAlocacao: number;
  gaps: string[];
  planoDesenvolvimento?: string;
  dataAvaliacao: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getSemaforoFromValue(valor: number, meta: number, inverso: boolean = false): StatusSemaforo {
  const percentual = (valor / meta) * 100;
  
  if (inverso) {
    if (percentual <= 100) return StatusSemaforo.VERDE;
    if (percentual <= 120) return StatusSemaforo.AMARELO;
    return StatusSemaforo.VERMELHO;
  }
  
  if (percentual >= 95) return StatusSemaforo.VERDE;
  if (percentual >= 80) return StatusSemaforo.AMARELO;
  return StatusSemaforo.VERMELHO;
}

export function getCorSemaforo(semaforo: StatusSemaforo): string {
  switch (semaforo) {
    case StatusSemaforo.VERDE: return '#22C55E';
    case StatusSemaforo.AMARELO: return '#EAB308';
    case StatusSemaforo.VERMELHO: return '#EF4444';
  }
}

export function getCorOrigem(origem: OrigemCard): string {
  switch (origem) {
    case 'GANTT': return '#3B82F6';
    case 'ACAO_5W2H': return '#22C55E';
    case 'RESTRICAO_LPS': return '#F97316';
    case 'AUDITORIA': return '#EF4444';
    case 'PDCA': return '#8B5CF6';
    case 'MUDANCA': return '#EAB308';
    default: return '#6B7280';
  }
}

export function getIconeOrigem(origem: OrigemCard): string {
  switch (origem) {
    case 'GANTT': return 'calendar';
    case 'ACAO_5W2H': return 'clipboard-list';
    case 'RESTRICAO_LPS': return 'alert-triangle';
    case 'AUDITORIA': return 'check-square';
    case 'PDCA': return 'refresh-cw';
    case 'MUDANCA': return 'git-branch';
    default: return 'file';
  }
}
