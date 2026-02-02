/**
 * Tipos para o módulo de Critérios de Medição / Critério de Avanço
 * 
 * Estrutura hierárquica:
 * WBS → Take Off (Mapa de Controle) → Item → Critério de Medição → Etapas
 * 
 * Cada item do Take-off pode ter um critério de medição associado,
 * que define as etapas e percentuais para avanço físico.
 */

export type StatusCriterioMedicao = 'ativo' | 'inativo' | 'rascunho';
export type StatusAvancoEtapa = 'pendente' | 'em_andamento' | 'concluido' | 'aprovado' | 'rejeitado';
export type NivelAprovacao = 'producao' | 'planejamento' | 'gerencia';
export type PeriodoTipo = 'hora' | 'dia' | 'semana' | 'mes';

export interface CriterioMedicao {
  id: string;
  empresaId: string;
  projetoId?: string;
  codigo: string;
  descritivo: string;
  descritivoConcreto?: string;
  status: StatusCriterioMedicao;
  observacoes?: string;
  criadoPor?: string;
  createdAt: Date;
  updatedAt: Date;
  etapas?: CriterioMedicaoEtapa[];
  totalPercentual?: number;
}

export interface CriterioMedicaoEtapa {
  id: string;
  criterioId: string;
  numeroEtapa: number;
  descritivo: string;
  descritivoDocumento?: string;
  percentual: number;
  ordem: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ItemCriterioMedicao {
  id: string;
  itemId: string;
  criterioId: string;
  createdAt: Date;
  criterio?: CriterioMedicao;
  item?: {
    id: string;
    descricao: string;
    qtdPrevista: number;
    unidade: string;
  };
}

export interface AvancoEtapa {
  id: string;
  itemCriterioId: string;
  etapaId: string;
  empresaId: string;
  periodoInicio: Date;
  periodoFim: Date;
  qtdAvancada: number;
  qtdAcumulada: number;
  percentualAvancado: number;
  percentualAcumulado: number;
  status: StatusAvancoEtapa;
  registradoPor?: string;
  registradoEm: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  etapa?: CriterioMedicaoEtapa;
  aprovacoes?: AvancoAprovacao[];
}

export interface AvancoAprovacao {
  id: string;
  avancoId: string;
  empresaId: string;
  nivel: NivelAprovacao;
  aprovadorId?: string;
  aprovadorNome?: string;
  acao: 'aprovado' | 'rejeitado' | 'pendente';
  comentario?: string;
  dataAcao: Date;
  createdAt: Date;
}

export interface UsuarioPermissaoCriterio {
  id: string;
  criterioId: string;
  usuarioId: string;
  empresaId: string;
  podeEditar: boolean;
  podeAprovar: boolean;
  createdAt: Date;
  usuario?: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface CreateCriterioDTO {
  empresaId: string;
  projetoId?: string;
  codigo: string;
  descritivo: string;
  descritivoConcreto?: string;
  observacoes?: string;
  criadoPor?: string;
  etapas?: CreateEtapaDTO[];
}

export interface UpdateCriterioDTO {
  codigo?: string;
  descritivo?: string;
  descritivoConcreto?: string;
  status?: StatusCriterioMedicao;
  observacoes?: string;
}

export interface CreateEtapaDTO {
  criterioId?: string;
  numeroEtapa: number;
  descritivo: string;
  descritivoDocumento?: string;
  percentual: number;
  ordem?: number;
}

export interface UpdateEtapaDTO {
  descritivo?: string;
  descritivoDocumento?: string;
  percentual?: number;
  ordem?: number;
}

export interface CreateAvancoDTO {
  itemCriterioId: string;
  etapaId: string;
  empresaId?: string;
  periodoInicio: Date;
  periodoFim: Date;
  periodoTipo?: PeriodoTipo;
  qtdAvancada?: number;
  percentualAvancado?: number;
  registradoPor?: string;
  registradoPorNome?: string;
  observacoes?: string;
}

export interface CriterioImportRow {
  criterioMedicao: string;
  descritivoConcreto?: string;
  etapa: number;
  descritivo: string;
  descritivoDocumento?: string;
  percentual: number;
}

export interface CriterioImportResult {
  success: boolean;
  criteriosImportados: number;
  etapasImportadas: number;
  erros: string[];
  criterios: CriterioMedicao[];
}

export interface EAPItemNode {
  id: string;
  tipo: 'mapa' | 'item' | 'criterio' | 'etapa';
  codigo?: string;
  descricao: string;
  unidade?: string;
  qtdPrevista?: number;
  qtdPonderada?: number;
  percentualPeso?: number;
  percentualAvanco?: number;
  status?: string;
  children?: EAPItemNode[];
}

export interface CriterioMedicaoFilter {
  empresaId?: string;
  projetoId?: string;
  codigo?: string;
  status?: StatusCriterioMedicao;
  busca?: string;
}

export type WorkflowStatus = 'pendente' | 'programado' | 'em_producao' | 'producao_concluida' | 'avancado' | 'aprovado' | 'rejeitado';

export interface TakeoffItemEtapa {
  id: string;
  itemId: string;
  etapaId: string;
  concluido: boolean;
  dataConclusao?: Date;
  concluidoPor?: string;
  observacoes?: string;
  dataInicio?: Date;
  dataTermino?: Date;
  dataAvanco?: Date;
  dataAprovacao?: Date;
  usuarioInicioId?: string;
  usuarioTerminoId?: string;
  usuarioAvancoId?: string;
  usuarioAprovacaoId?: string;
  workflowStatus: WorkflowStatus;
  proponenteId?: string;
  dataProposta?: Date;
  validadorId?: string;
  dataValidacao?: Date;
  fiscalizadorId?: string;
  dataFiscalizacao?: Date;
  motivoRejeicao?: string;
  createdAt: Date;
  updatedAt: Date;
  etapa?: CriterioMedicaoEtapa;
  usuarioInicio?: { id: string; nome: string };
  usuarioTermino?: { id: string; nome: string };
  usuarioAvanco?: { id: string; nome: string };
  usuarioAprovacao?: { id: string; nome: string };
}

export interface CreateItemEtapaDTO {
  itemId: string;
  etapaId: string;
  concluido?: boolean;
  observacoes?: string;
}

export type WorkflowAction = 
  | 'programar'
  | 'aceitar_programacao'
  | 'iniciar_producao'
  | 'terminar_producao'
  | 'registrar_avanco'
  | 'aprovar_fiscalizacao'
  | 'rejeitar';

export interface UpdateItemEtapaDTO {
  concluido?: boolean;
  observacoes?: string;
  workflowAction?: WorkflowAction;
  usuarioId?: string;
  dataInicio?: Date;
  dataTermino?: Date;
  dataAvanco?: Date;
  dataAprovacao?: Date;
  motivoRejeicao?: string;
}

export interface ItemComEtapas {
  item: {
    id: string;
    descricao: string;
    tag?: string;
    area?: string;
    unidade: string;
    qtdPrevista: number;
    percentualExecutado: number;
  };
  criterio?: CriterioMedicao;
  etapas: TakeoffItemEtapa[];
  percentualConcluido: number;
}
