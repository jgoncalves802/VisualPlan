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
 * Tipo detalhado de restrição
 */
export enum TipoRestricaoDetalhado {
  PARALISAR_OBRA = 'PARALISAR_OBRA',
  MATERIAL = 'MATERIAL',
  MAO_DE_OBRA = 'MAO_DE_OBRA',
  EQUIPAMENTO = 'EQUIPAMENTO',
  DOCUMENTACAO = 'DOCUMENTACAO',
  APROVACAO = 'APROVACAO',
  LICENCIAMENTO = 'LICENCIAMENTO',
  SEGURANCA = 'SEGURANCA',
  AMBIENTAL = 'AMBIENTAL',
  OUTRA = 'OUTRA',
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
  tipo_detalhado?: TipoRestricaoDetalhado; // Tipo detalhado da restrição
  tipo_responsabilidade?: TipoResponsabilidade; // Preponente, Fiscalização ou Contratada
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
  data_inicio_latencia?: Date; // Data de início da latência (quando tipo é PARALISAR_OBRA)
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

