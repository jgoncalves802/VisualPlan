export enum StatusKanban {
  PLANEJAMENTO = 'PLANEJAMENTO',
  EXECUCAO = 'EXECUCAO',
  CONTROLE = 'CONTROLE',
  ENCERRAMENTO = 'ENCERRAMENTO',
}

export enum TipoItemKanban {
  ATIVIDADE_CRONOGRAMA = 'ATIVIDADE_CRONOGRAMA',
  ATIVIDADE_LPS = 'ATIVIDADE_LPS',
  RESTRICAO = 'RESTRICAO',
  ACAO_TRATATIVA = 'ACAO_TRATATIVA',
  ACAO_5W2H = 'ACAO_5W2H',
  AUDITORIA = 'AUDITORIA',
  MUDANCA = 'MUDANCA',
  PDCA = 'PDCA',
}

export enum PrioridadeKanban {
  BAIXA = 0,
  MEDIA = 1,
  ALTA = 2,
  CRITICA = 3,
}

export interface EvidenciaKanban {
  id: string;
  nome: string;
  tipo: string;
  url: string;
}

export interface ItemKanban {
  id: string;
  tipo: TipoItemKanban;
  status: StatusKanban;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  responsavel_id?: string;
  prioridade: PrioridadeKanban;
  dataCriacao: Date;
  dataVencimento?: Date;
  dataInicio?: Date;
  dataFim?: Date;
  percentualConcluido?: number;
  caminhoCritico?: boolean;
  
  origemAtividade?: any;
  origemAtividadeLPS?: any;
  origemRestricao?: any;
  origemAcao5W2H?: any;
  origemAuditoria?: any;
  origemMudanca?: any;
  origemPDCA?: any;
  
  atividadeId?: string;
  restricaoId?: string;
  projetoId?: string;
  acaoId?: string;
  auditoriaId?: string;
  mudancaId?: string;
  pdcaId?: string;
  
  evidencias?: EvidenciaKanban[];
  quantidadeEvidencias?: number;
  
  podeCheckIn?: boolean;
  podeCheckOut?: boolean;
  podeConcluir?: boolean;
  podeAdicionarEvidencia?: boolean;
  
  tags?: string[];
}

export interface FiltrosKanban {
  tipos?: TipoItemKanban[];
  busca?: string;
  responsavelId?: string;
  prioridadeMinima?: PrioridadeKanban;
  apenasCriticas?: boolean;
  apenasComEvidencias?: boolean;
  dataInicio?: Date;
  dataFim?: Date;
}
