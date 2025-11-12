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
  HORA = 'HOUR',
  DIA = 'DAY',
  SEMANA = 'WEEK',
  MES = 'MONTH',
  ANO = 'YEAR',
}

/**
 * Unidade de duração das atividades
 */
export enum UnidadeTempo {
  HORAS = 'HORAS',
  DIAS = 'DIAS',
}

/**
 * Dias da semana para calendário
 */
export enum DiaTrabalho {
  DOMINGO = 'DOMINGO',
  SEGUNDA = 'SEGUNDA',
  TERCA = 'TERCA',
  QUARTA = 'QUARTA',
  QUINTA = 'QUINTA',
  SEXTA = 'SEXTA',
  SABADO = 'SABADO',
}

/**
 * Formatos de Data (baseado no MS Project)
 */
export enum FormatoData {
  // Formatos Completos
  DIA_MES_ANO_HORA = 'DD/MM/YYYY HH:mm',           // 28/01/2009 12:33
  DIA_MES_ANO = 'DD/MM/YYYY',                      // 28/01/2009
  DIA_MES_ANO_CURTO = 'DD/MM/YY',                  // 28/01/09
  
  // Formatos com Nome do Mês
  DIA_MES_EXTENSO_ANO = 'DD MMMM YYYY',            // 28 Janeiro 2009
  DIA_MES_EXTENSO_ANO_HORA = 'DD MMMM YYYY HH:mm', // 28 Janeiro 2009 12:33
  DIA_MES_ABREV_ANO = 'DD/MMM/YY',                 // 28/Jan/09
  DIA_MES_ABREV_HORA = 'DD/MMM HH:mm',             // 28/Jan 12:33
  
  // Formatos com Dia da Semana
  SEMANA_DIA_MES_ANO_HORA = 'ddd DD/MM/YY HH:mm',  // Qua 28/01/09 12:33
  SEMANA_DIA_MES_ANO = 'ddd DD/MM/YY',             // Qua 28/01/09
  SEMANA_HORA = 'ddd HH:mm',                        // Qua 12:33
  SEMANA_DIA_MES = 'ddd DD/MM',                     // Qua 28/01
  SEMANA_DIA = 'ddd/DD',                            // Qua/28
  
  // Formatos Compactos
  DIA_MES = 'DD/MM',                                // 28/01
  DIA = 'DD',                                       // 28
  HORA = 'HH:mm',                                   // 12:33
  
  // Formatos Personalizados Brasil
  SEMANA_DIA_MES_EXTENSO = 'ddd, DD [de] MMMM',    // qua, 28 de janeiro
  DIA_MES_EXTENSO = 'DD [de] MMMM [de] YYYY',      // 28 de janeiro de 2009
  SEMANA_COMPLETA_DATA = 'dddd, DD [de] MMMM [de] YYYY', // quarta-feira, 28 de janeiro de 2009
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
  edt?: string;
  nome: string;
  descricao?: string;
  tipo: 'Tarefa' | 'Marco' | 'Fase';
  parent_id?: string; // ID da atividade mãe (para hierarquia)
  data_inicio: string;
  data_fim: string;
  duracao_dias: number;
  duracao_horas?: number; // Duração em horas (para cronogramas de curto prazo)
  unidade_tempo?: UnidadeTempo; // HORAS ou DIAS
  progresso: number;
  status: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  setor_id?: string;
  prioridade?: string;
  e_critica?: boolean;
  folga_total?: number;
  calendario_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoColunaGantt {
  id: string;
  titulo: string;
  largura: number;
  alinhar?: 'left' | 'center' | 'right';
  habilitada: boolean;
}

/**
 * Tipo de exceção no calendário
 */
export enum TipoExcecao {
  FERIADO = 'FERIADO',                    // Não trabalhando
  DIA_NAO_UTIL = 'DIA_NAO_UTIL',          // Não trabalhando (folga)
  TRABALHO_PERSONALIZADO = 'TRABALHO_PERSONALIZADO', // Trabalhando com horários diferentes
  HORA_EXTRA = 'HORA_EXTRA',              // Trabalhando mais horas
}

/**
 * Padrão de recorrência para exceções
 */
export enum PadraoRecorrencia {
  UNICO = 'UNICO',                        // Ocorre apenas uma vez
  DIARIAMENTE = 'DIARIAMENTE',            // Todo dia
  SEMANALMENTE = 'SEMANALMENTE',          // Toda semana (ex: toda segunda)
  MENSALMENTE = 'MENSALMENTE',            // Todo mês (ex: dia 15)
  ANUALMENTE = 'ANUALMENTE',              // Todo ano (ex: Natal)
}

/**
 * Período de trabalho (horário de início e fim)
 */
export interface PeriodoTrabalho {
  inicio: string; // HH:mm
  fim: string;    // HH:mm
}

/**
 * Exceção de calendário (feriados, dias especiais, horas extras)
 */
export interface ExcecaoCalendario {
  id: string;
  nome: string;                           // Ex: "Natal", "Hora Extra - Concretagem"
  tipo: TipoExcecao;
  data_inicio: string;                    // ISO date string (YYYY-MM-DD)
  data_fim?: string;                      // ISO date string (para exceções de múltiplos dias)
  
  // Padrão de recorrência
  recorrencia: PadraoRecorrencia;
  intervalo_recorrencia?: number;         // Ex: a cada 2 semanas
  termina_apos?: string;                  // Data fim da recorrência (ISO)
  
  // Configuração de trabalho (se for dia trabalhando)
  trabalhando: boolean;                   // true = trabalhando, false = folga
  periodos?: PeriodoTrabalho[];           // Períodos de trabalho (se trabalhando)
  
  // Observações
  observacoes?: string;
}

/**
 * Calendário de trabalho do projeto
 */
export interface CalendarioProjeto {
  id: string;
  nome: string;
  descricao?: string;
  dias_trabalho: DiaTrabalho[];
  horas_por_dia: number;
  horario_inicio: string; // HH:mm
  horario_almoco_inicio?: string; // HH:mm
  horario_almoco_fim?: string; // HH:mm
  horario_fim: string; // HH:mm
  
  // Exceções (substituindo apenas 'feriados')
  excecoes: ExcecaoCalendario[];
  
  is_padrao?: boolean;
}

/**
 * Configurações globais do projeto
 */
export interface ConfiguracoesProjeto {
  // Formatos de Data
  formato_data_tabela: FormatoData;          // Formato usado na tabela de atividades
  formato_data_gantt: FormatoData;           // Formato usado no Gantt (timeline)
  formato_data_tooltip: FormatoData;         // Formato usado em tooltips
  escala_topo: 'hour' | 'day' | 'week' | 'month' | 'year'; // Unidade principal da timeline
  escala_sub: 'none' | 'minute' | 'hour' | 'day' | 'week' | 'month'; // Subdivisão da timeline
  
  // Configurações de Exibição
  mostrar_codigo_atividade: boolean;         // Mostrar código junto com nome
  mostrar_progresso_percentual: boolean;     // Mostrar % nas barras
  destacar_caminho_critico: boolean;         // Destacar visualmente
  mostrar_grid: boolean;                     // Exibir grid lateral
  mostrar_linha_hoje: boolean;               // Exibir linha vertical de hoje
  mostrar_links: boolean;                    // Exibir setas de dependência
  mostrar_rotulo_barras: boolean;            // Exibir rótulo de progresso dentro das barras
  mostrar_coluna_predecessores: boolean;     // Exibir coluna de predecessores na grid
  mostrar_coluna_sucessores: boolean;        // Exibir coluna de sucessores na grid
  expandir_grupos: boolean;                  // Expandir hierarquia ao carregar
  largura_grid: number;                      // Largura da grid lateral
  altura_linha: number;                      // Altura de cada linha do Gantt
  colunas: ConfiguracaoColunaGantt[];        // Configuração das colunas exibidas
  
  // Configurações de Comportamento
  permitir_edicao_drag: boolean;             // Permitir arrastar para editar datas
  auto_calcular_progresso: boolean;          // Calcular progresso automaticamente
  habilitar_auto_scheduling: boolean;        // Recalcular datas baseado em dependências
  
  // ========================================================================
  // EXTENSÕES DHTMLX GANTT
  // ========================================================================
  
  // Extensões Principais
  habilitar_quick_info: boolean;             // Quick Info ao clicar em tarefa
  habilitar_tooltip: boolean;                // Tooltip ao passar mouse
  habilitar_critical_path: boolean;          // Destaque do caminho crítico
  habilitar_keyboard_navigation: boolean;    // Navegação por teclado
  habilitar_undo_redo: boolean;              // Desfazer/Refazer ações
  habilitar_multiselect: boolean;            // Seleção múltipla de tarefas
  
  // Funcionalidades Avançadas
  habilitar_inline_editing: boolean;         // Edição inline na grid
  habilitar_drag_timeline: boolean;          // Arrastar timeline com Ctrl
  habilitar_markers: boolean;                // Marcadores verticais (hoje, etc)
  habilitar_baselines: boolean;              // Linhas de base
  habilitar_deadlines: boolean;              // Marcadores de deadline
  habilitar_split_tasks: boolean;            // Tarefas divididas
  habilitar_grouping: boolean;               // Agrupamento de tarefas
  habilitar_resources: boolean;              // Gerenciamento de recursos
  habilitar_constraints: boolean;            // Restrições (ASAP, ALAP, etc)
  habilitar_wbs_codes: boolean;              // Códigos WBS automáticos
  
  // Configurações de Cores (tema do cronograma)
  cor_tarefa_normal: string;
  cor_tarefa_critica: string;
  cor_tarefa_concluida: string;
  cor_marco: string;
  cor_fase: string;
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
  unidadeTempoPadrao: UnidadeTempo; // Unidade padrão do projeto (DIAS ou HORAS)
  configuracoes: ConfiguracoesProjeto; // Configurações globais do projeto
  calendarios: CalendarioProjeto[];     // Calendários disponíveis
  calendario_padrao?: string;
  
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
  setUnidadeTempoPadrao: (unidade: UnidadeTempo) => void;
  setConfiguracoes: (configuracoes: Partial<ConfiguracoesProjeto>) => void;

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
 * Configuração de cabeçalho para impressão
 */
export interface CabecalhoImpressao {
  nome_projeto: string;
  logo_contratada?: string; // URL ou base64
  logo_contratante?: string; // URL ou base64
  logo_fiscalizacao?: string; // URL ou base64
  numero_contrato?: string;
  data_impressao?: Date;
  responsavel_impressao?: string;
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
  cabecalho?: CabecalhoImpressao;
}

/**
 * Opções de exportação Excel
 */
export interface OpcoesExcel {
  incluir_dependencias: boolean;
  incluir_folgas: boolean;
  incluir_formulas: boolean;
  cabecalho?: CabecalhoImpressao;
}

