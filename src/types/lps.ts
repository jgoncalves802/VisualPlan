/**
 * Types para o módulo LPS (Last Planner System / Planejamento Puxado)
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Status de uma atividade no LPS
 */
export enum StatusAtividadeLPS {
  PLANEJADA = 'PLANEJADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  ATRASADA = 'ATRASADA',
  BLOQUEADA = 'BLOQUEADA',
}

/**
 * Tipo de atividade no LPS
 */
export enum TipoAtividadeLPS {
  NORMAL = 'NORMAL',
  CRITICA = 'CRITICA',
  MARCO = 'MARCO',
  PREPARATORIA = 'PREPARATORIA',
}

/**
 * Tipo de restrição (sim/não)
 */
export enum TipoRestricao {
  RESTRICAO = 'S', // Sim, tem restrição
  SEM_RESTRICAO = 'N', // Não, sem restrição
}

/**
 * Tipo de responsabilidade pela restrição
 */
export enum TipoResponsabilidade {
  PREPONENTE = 'PREPONENTE',
  FISCALIZACAO = 'FISCALIZACAO',
  CONTRATADA = 'CONTRATADA',
}

/**
 * Tipo detalhado de restrição (categorias 6M do Ishikawa)
 */
export enum TipoRestricaoDetalhado {
  MATERIAL = 'MATERIAL',
  MAO_DE_OBRA = 'MAO_DE_OBRA',
  MAQUINA = 'MAQUINA',
  METODO = 'METODO',
  MEIO_AMBIENTE = 'MEIO_AMBIENTE',
  MEDIDA = 'MEDIDA',
}

/**
 * Categoria de atividade (cor do post-it)
 */
export enum CategoriaAtividade {
  PRINCIPAL = 'PRINCIPAL', // Amarelo
  SECUNDARIA = 'SECUNDARIA', // Rosa
  ESPECIAL = 'ESPECIAL', // Branco
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * WBS - Work Breakdown Structure (Estrutura Analítica do Projeto)
 * Representa uma fase ou pacote de trabalho do projeto
 */
export interface WBSLPS {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  nivel: number;
  parent_id?: string;
  ordem: number;
  cor?: string;
  icone?: string;
  data_inicio?: Date;
  data_fim?: Date;
  progresso?: number;
  responsavel?: string;
  responsavel_id?: string;
}

/**
 * Histórico de conclusão de uma atividade
 */
export interface AtividadeHistoricoConclusao {
  id: string;
  atividade_id: string;
  status_anterior: StatusAtividadeLPS;
  status_novo: StatusAtividadeLPS;
  data_alteracao: Date;
  responsavel?: string;
  responsavel_id?: string;
  motivo?: string;
  ppc?: number; // Porcentagem Planejada Concluída
}

/**
 * Atividade no LPS (post-it no calendário)
 */
export interface AtividadeLPS {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  data_inicio: Date;
  data_fim: Date;
  data_atribuida?: Date; // Data em que foi atribuída no calendário
  status: StatusAtividadeLPS;
  tipo: TipoAtividadeLPS;
  categoria: CategoriaAtividade;
  wbs_id?: string; // Link com WBS (fase do projeto)
  responsavel?: string;
  responsavel_id?: string;
  apoio?: string;
  apoio_id?: string;
  recursos?: string[]; // IDs dos recursos atribuídos
  atividade_cronograma_id?: string; // Link com atividade do cronograma
  dependencias?: string[]; // IDs de atividades dependentes
  ordem?: number; // Ordem na coluna da data
  posicao_x?: number; // Posição X no calendário (drag and drop)
  posicao_y?: number; // Posição Y no calendário (drag and drop)
  cor?: string; // Cor personalizada
  tags?: string[];
  observacoes?: string;
  data_conclusao?: Date; // Data real de conclusão
  data_conclusao_planejada?: Date; // Data planejada de conclusão
  historico_conclusao?: AtividadeHistoricoConclusao[]; // Histórico de mudanças de status
}

/**
 * Evidência de uma restrição (arquivo anexado)
 */
export interface RestricaoEvidencia {
  id: string;
  restricao_id: string;
  nome_arquivo: string;
  tipo_arquivo: 'PDF' | 'IMAGEM' | 'OUTRO';
  url_arquivo: string; // URL do arquivo armazenado
  tamanho?: number; // Tamanho em bytes
  data_upload: Date;
  upload_por?: string; // ID do usuário que fez upload
  descricao?: string;
}

/**
 * Andamento de uma restrição
 */
export interface RestricaoAndamento {
  id: string;
  restricao_id: string;
  descricao: string;
  data: Date;
  responsavel?: string; // ID do usuário
  evidencias?: string[]; // IDs das evidências relacionadas
}

/**
 * Histórico de reagendamento de uma restrição
 */
export interface RestricaoHistorico {
  id: string;
  restricao_id: string;
  data_anterior: Date;
  data_nova: Date;
  motivo?: string;
  responsavel?: string;
  responsavel_id?: string;
  data_reagendamento: Date;
  impacto?: string; // Descrição do impacto esperado
}

/**
 * Restrição no LPS
 */
export interface RestricaoLPS {
  id: string;
  descricao: string;
  tipo: TipoRestricao; // S (Sim, tem restrição) ou N (Não, sem restrição)
  tipo_detalhado?: TipoRestricaoDetalhado; // Categoria 6M (Material, Mão de Obra, etc.)
  tipo_responsabilidade?: TipoResponsabilidade; // Preponente, Fiscalização ou Contratada
  wbs_id?: string; // Link com WBS (fase do projeto)
  wbs_nome?: string; // Nome do WBS para exibição
  projeto_id?: string; // Link com projeto
  projeto_nome?: string; // Nome do projeto para exibição
  responsavel?: string;
  responsavel_id?: string;
  apoio?: string;
  apoio_id?: string;
  data_conclusao?: Date;
  data_conclusao_planejada?: Date;
  data_criacao: Date;
  prazo_resolucao?: Date; // Prazo definido pelo responsável para resolver
  status: 'PENDENTE' | 'CONCLUIDA' | 'ATRASADA' | 'CANCELADA';
  atividade_id?: string; // Link com atividade relacionada
  atividade_nome?: string; // Nome da atividade para exibição
  prioridade?: 'ALTA' | 'MEDIA' | 'BAIXA';
  observacoes?: string;
  historico?: RestricaoHistorico[]; // Histórico de reagendamentos
  categoria?: string; // Categoria da restrição
  impacto_previsto?: string; // Impacto previsto se não concluída
  dependencias?: string[]; // IDs de outras restrições dependentes
  andamento?: RestricaoAndamento[]; // Histórico de andamento da restrição
  evidencias?: RestricaoEvidencia[]; // Evidências anexadas (PDFs, fotos)
  criado_por?: string; // ID do usuário que criou a restrição
  criado_por_nome?: string; // Nome do usuário que criou
  paralisar_obra?: boolean; // Se true, restrição tem prioridade máxima e conta latência
  data_inicio_latencia?: Date; // Data de início da latência (quando paralisar_obra=true)
  data_fim_latencia?: Date; // Data de fim da latência (quando restrição é resolvida)
  dias_latencia?: number; // Total de dias de latência acumulados
}

/**
 * Anotação no LPS
 */
export interface AnotacaoLPS {
  id: string;
  descricao: string;
  atividade_id?: string;
  restricao_id?: string;
  data_criacao: Date;
  responsavel?: string;
  tags?: string[];
}

/**
 * Planejamento LPS (período de planejamento)
 */
export interface PlanejamentoLPS {
  id: string;
  nome: string;
  projeto_id: string;
  data_inicio: Date;
  data_fim: Date;
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  anotacoes: AnotacaoLPS[];
  status: 'RASCUNHO' | 'ATIVO' | 'CONCLUIDO' | 'ARQUIVADO';
  criado_por?: string;
  criado_em: Date;
  atualizado_em: Date;
}

/**
 * Configuração do calendário LPS
 */
export interface ConfiguracaoCalendarioLPS {
  data_inicio: Date;
  data_fim: Date;
  dias_visiveis: number; // Quantos dias mostrar no calendário
  mostrar_fins_de_semana: boolean;
  mostrar_feriados: boolean;
  altura_linha: number;
  largura_coluna: number;
  cores_categorias: {
    [CategoriaAtividade.PRINCIPAL]: string;
    [CategoriaAtividade.SECUNDARIA]: string;
    [CategoriaAtividade.ESPECIAL]: string;
  };
}

/**
 * Evento de drag and drop
 */
export interface DragDropEvent {
  atividade_id: string;
  data_origem: Date;
  data_destino: Date;
  posicao_x?: number;
  posicao_y?: number;
}

// ============================================================================
// CONDIÇÕES DE PRONTIDÃO (MAKE-READY)
// ============================================================================

/**
 * Tipo de condição de prontidão para atividades
 * Baseado no Last Planner System - 6 condições obrigatórias
 */
export enum TipoCondicaoProntidao {
  PREDECESSORA = 'PREDECESSORA',   // Atividade anterior concluída
  PROJETO = 'PROJETO',             // Documentação técnica disponível
  MATERIAL = 'MATERIAL',           // Materiais entregues no local
  MAO_DE_OBRA = 'MAO_DE_OBRA',     // Equipe mobilizada e disponível
  EQUIPAMENTO = 'EQUIPAMENTO',     // Ferramentas/máquinas disponíveis
  QSSMA = 'QSSMA',                 // Requisitos de segurança atendidos
}

/**
 * Status de uma condição de prontidão
 */
export enum StatusCondicaoProntidao {
  PENDENTE = 'PENDENTE',
  ATENDIDA = 'ATENDIDA',
  NAO_APLICAVEL = 'NAO_APLICAVEL',
}

/**
 * Configuração de cores para condições de prontidão
 */
export const CoresCondicaoProntidao: Record<TipoCondicaoProntidao, string> = {
  [TipoCondicaoProntidao.PREDECESSORA]: '#3B82F6',   // Azul
  [TipoCondicaoProntidao.PROJETO]: '#22C55E',        // Verde
  [TipoCondicaoProntidao.MATERIAL]: '#EAB308',       // Amarelo
  [TipoCondicaoProntidao.MAO_DE_OBRA]: '#F97316',    // Laranja
  [TipoCondicaoProntidao.EQUIPAMENTO]: '#EF4444',    // Vermelho
  [TipoCondicaoProntidao.QSSMA]: '#A855F7',          // Roxo
};

/**
 * Labels para condições de prontidão
 */
export const LabelsCondicaoProntidao: Record<TipoCondicaoProntidao, string> = {
  [TipoCondicaoProntidao.PREDECESSORA]: 'Predecessora',
  [TipoCondicaoProntidao.PROJETO]: 'Projeto',
  [TipoCondicaoProntidao.MATERIAL]: 'Material',
  [TipoCondicaoProntidao.MAO_DE_OBRA]: 'Mão de Obra',
  [TipoCondicaoProntidao.EQUIPAMENTO]: 'Equipamento',
  [TipoCondicaoProntidao.QSSMA]: 'QSSMA',
};

/**
 * Condição de prontidão de uma atividade
 */
export interface CondicaoProntidao {
  id: string;
  empresaId: string;
  atividadeId: string;
  tipoCondicao: TipoCondicaoProntidao;
  status: StatusCondicaoProntidao;
  responsavelId?: string;
  responsavelNome?: string;
  dataPrevista?: Date;
  dataAtendida?: Date;
  observacoes?: string;
  restricaoId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Resumo de prontidão de uma atividade
 */
export interface ResumoProntidao {
  atividadeId: string;
  totalCondicoes: number;
  condicoesAtendidas: number;
  condicoesPendentes: number;
  condicoesNaoAplicaveis: number;
  percentualProntidao: number;
  prontaParaExecucao: boolean;
  condicoes: CondicaoProntidao[];
}

