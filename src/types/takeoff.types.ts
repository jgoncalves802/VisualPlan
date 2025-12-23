export type TipoColuna = 'text' | 'number' | 'decimal' | 'select' | 'date' | 'calculated' | 'reference' | 'percentage';
export type StatusMapa = 'rascunho' | 'em_analise' | 'aprovado' | 'fechado';
export type StatusItem = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';
export type StatusDocumento = 'emitido' | 'em_revisao' | 'aprovado' | 'cancelado' | 'as_built';

export interface TakeoffDisciplina {
  id: string;
  empresaId: string;
  nome: string;
  codigo: string;
  descricao?: string;
  cor: string;
  icone: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TakeoffColunaConfig {
  id: string;
  disciplinaId: string;
  nome: string;
  codigo: string;
  tipo: TipoColuna;
  formula?: string;
  opcoes?: string[];
  unidade?: string;
  casasDecimais: number;
  obrigatoria: boolean;
  visivel: boolean;
  ordem: number;
  largura: number;
}

export interface TakeoffDocumento {
  id: string;
  projetoId: string;
  disciplinaId?: string;
  codigo: string;
  titulo?: string;
  revisao: string;
  tipo?: string;
  status: StatusDocumento;
  dataEmissao?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TakeoffMapa {
  id: string;
  projetoId: string;
  disciplinaId: string;
  nome: string;
  versao: string;
  status: StatusMapa;
  descricao?: string;
  dataReferencia?: Date;
  createdAt: Date;
  updatedAt: Date;
  disciplina?: TakeoffDisciplina;
  itensCount?: number;
}

export interface TakeoffItem {
  id: string;
  mapaId: string;
  documentoId?: string;
  itemPq?: string;
  area?: string;
  edificacao?: string;
  tag?: string;
  linha?: string;
  descricao: string;
  tipoMaterial?: string;
  dimensao?: string;
  unidade: string;
  qtdPrevista: number;
  qtdTakeoff: number;
  qtdExecutada: number;
  pesoUnitario: number;
  pesoTotal: number;
  custoUnitario: number;
  custoTotal: number;
  percentualExecutado: number;
  status: StatusItem;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  valoresCustom?: Record<string, string>;
  documento?: TakeoffDocumento;
}

export interface TakeoffValorCustom {
  id: string;
  itemId: string;
  colunaConfigId: string;
  valor: string;
}

export interface TakeoffMedicao {
  id: string;
  itemId: string;
  usuarioId?: string;
  periodoInicio: Date;
  periodoFim: Date;
  qtdPeriodo: number;
  qtdAcumulada?: number;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
  usuario?: { id: string; nome: string };
}

export interface TakeoffVinculo {
  id: string;
  itemId: string;
  atividadeId: string;
  peso: number;
  createdAt: Date;
  updatedAt: Date;
  item?: TakeoffItem;
  atividade?: { id: string; nome: string; progresso: number };
}

export interface CreateDisciplinaDTO {
  empresaId: string;
  nome: string;
  codigo: string;
  descricao?: string;
  cor?: string;
  icone?: string;
}

export interface UpdateDisciplinaDTO {
  nome?: string;
  codigo?: string;
  descricao?: string;
  cor?: string;
  icone?: string;
  ativo?: boolean;
}

export interface CreateMapaDTO {
  projetoId: string;
  disciplinaId: string;
  nome: string;
  versao?: string;
  descricao?: string;
  dataReferencia?: Date;
}

export interface UpdateMapaDTO {
  nome?: string;
  versao?: string;
  status?: StatusMapa;
  descricao?: string;
  dataReferencia?: Date;
}

export interface CreateItemDTO {
  mapaId: string;
  documentoId?: string;
  itemPq?: string;
  area?: string;
  edificacao?: string;
  tag?: string;
  linha?: string;
  descricao: string;
  tipoMaterial?: string;
  dimensao?: string;
  unidade: string;
  qtdPrevista?: number;
  qtdTakeoff?: number;
  pesoUnitario?: number;
  custoUnitario?: number;
  observacoes?: string;
  valoresCustom?: Record<string, string>;
}

export interface UpdateItemDTO {
  documentoId?: string;
  itemPq?: string;
  area?: string;
  edificacao?: string;
  tag?: string;
  linha?: string;
  descricao?: string;
  tipoMaterial?: string;
  dimensao?: string;
  unidade?: string;
  qtdPrevista?: number;
  qtdTakeoff?: number;
  qtdExecutada?: number;
  pesoUnitario?: number;
  custoUnitario?: number;
  status?: StatusItem;
  observacoes?: string;
  valoresCustom?: Record<string, string>;
}

export interface CreateMedicaoDTO {
  itemId: string;
  usuarioId?: string;
  periodoInicio: Date;
  periodoFim: Date;
  qtdPeriodo: number;
  observacoes?: string;
}

export interface CreateVinculoDTO {
  itemId: string;
  atividadeId: string;
  peso?: number;
}

export interface CreateDocumentoDTO {
  projetoId: string;
  disciplinaId?: string;
  codigo: string;
  titulo?: string;
  revisao?: string;
  tipo?: string;
  dataEmissao?: Date;
  observacoes?: string;
}

export interface TakeoffFilter {
  projetoId?: string;
  disciplinaId?: string;
  mapaId?: string;
  area?: string;
  edificacao?: string;
  status?: StatusItem;
  search?: string;
}

export interface TakeoffTotais {
  totalItens: number;
  qtdPrevistaTotal: number;
  qtdTakeoffTotal: number;
  qtdExecutadaTotal: number;
  pesoTotal: number;
  custoTotal: number;
  percentualMedio: number;
}

export interface CurvaSData {
  data: string;
  previsto: number;
  realizado: number;
  previstoAcumulado: number;
  realizadoAcumulado: number;
}

export interface DisciplinaTemplate {
  codigo: string;
  nome: string;
  cor: string;
  icone: string;
  colunas: Omit<TakeoffColunaConfig, 'id' | 'disciplinaId'>[];
}
