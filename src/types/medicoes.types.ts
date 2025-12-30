export type StatusPeriodo = 'aberto' | 'em_medicao' | 'aguardando_aprovacao' | 'aprovado' | 'fechado';
export type StatusAvanco = 'pendente' | 'supervisor_aprovado' | 'fiscal_aprovado' | 'aprovado' | 'rejeitado';
export type OrigemAvanco = 'cronograma' | 'mapa_controle';
export type NivelAprovacao = 'supervisor' | 'fiscal' | 'proponente';
export type AcaoAprovacao = 'aprovado' | 'rejeitado' | 'devolvido';

export interface MedicoesConfig {
  id: string;
  projetoId: string;
  empresaId: string;
  diaInicioPeriodo: number;
  diaFimPeriodo: number;
  prazoContratualInicio?: Date;
  prazoContratualFim?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicoesPeriodo {
  id: string;
  projetoId: string;
  empresaId: string;
  numero: number;
  dataInicio: Date;
  dataFim: Date;
  status: StatusPeriodo;
  valorPrevisto: number;
  valorMedido: number;
  valorAprovado: number;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  avancos?: MedicoesAvanco[];
  restricoes?: MedicoesRestricao[];
}

export interface MedicoesAvanco {
  id: string;
  periodoId: string;
  empresaId: string;
  origem: OrigemAvanco;
  atividadeId?: string;
  itemId?: string;
  descricao: string;
  qtdAnterior: number;
  qtdAvancada: number;
  qtdAcumulada: number;
  percentualAnterior: number;
  percentualAvancado: number;
  percentualAcumulado: number;
  registradoPor?: string;
  registradoEm: Date;
  status: StatusAvanco;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  aprovacoes?: MedicoesAprovacao[];
  atividade?: { id: string; codigo?: string; nome: string };
  item?: { id: string; descricao: string; unidade: string };
  registrador?: { id: string; nome: string };
}

export interface MedicoesAprovacao {
  id: string;
  avancoId: string;
  empresaId: string;
  nivel: NivelAprovacao;
  aprovadorId?: string;
  aprovadorNome?: string;
  acao: AcaoAprovacao;
  comentario?: string;
  dataAcao: Date;
  createdAt: Date;
}

export interface MedicoesRestricao {
  id: string;
  periodoId: string;
  restricaoId: string;
  empresaId: string;
  categoria?: string;
  descricao?: string;
  status?: string;
  impactoMedicao?: string;
  createdAt: Date;
}

export interface CreateConfigDTO {
  projetoId: string;
  empresaId: string;
  diaInicioPeriodo?: number;
  diaFimPeriodo?: number;
  prazoContratualInicio?: Date;
  prazoContratualFim?: Date;
}

export interface UpdateConfigDTO {
  diaInicioPeriodo?: number;
  diaFimPeriodo?: number;
  prazoContratualInicio?: Date;
  prazoContratualFim?: Date;
}

export interface CreatePeriodoDTO {
  projetoId: string;
  empresaId: string;
  numero: number;
  dataInicio: Date;
  dataFim: Date;
  valorPrevisto?: number;
  observacoes?: string;
}

export interface UpdatePeriodoDTO {
  status?: StatusPeriodo;
  valorMedido?: number;
  valorAprovado?: number;
  observacoes?: string;
}

export interface CreateAvancoDTO {
  periodoId: string;
  empresaId: string;
  origem: OrigemAvanco;
  atividadeId?: string;
  itemId?: string;
  descricao: string;
  qtdAnterior?: number;
  qtdAvancada?: number;
  qtdAcumulada?: number;
  percentualAnterior?: number;
  percentualAvancado?: number;
  percentualAcumulado?: number;
  registradoPor?: string;
  observacoes?: string;
}

export interface CreateAprovacaoDTO {
  avancoId: string;
  empresaId: string;
  nivel: NivelAprovacao;
  aprovadorId?: string;
  aprovadorNome?: string;
  acao: AcaoAprovacao;
  comentario?: string;
}

export interface PeriodoGerado {
  numero: number;
  dataInicio: Date;
  dataFim: Date;
}
