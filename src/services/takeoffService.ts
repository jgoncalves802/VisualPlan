import { supabase } from './supabase';
import type {
  TakeoffDisciplina,
  TakeoffColunaConfig,
  TakeoffMapa,
  TakeoffItem,
  TakeoffMedicao,
  TakeoffVinculo,
  TakeoffDocumento,
  CreateDisciplinaDTO,
  UpdateDisciplinaDTO,
  CreateMapaDTO,
  UpdateMapaDTO,
  CreateItemDTO,
  UpdateItemDTO,
  CreateMedicaoDTO,
  CreateVinculoDTO,
  CreateDocumentoDTO,
  TakeoffFilter,
  TakeoffTotais,
  DisciplinaTemplate,
} from '../types/takeoff.types';

const mapDisciplinaFromDB = (row: Record<string, unknown>): TakeoffDisciplina => ({
  id: row.id as string,
  empresaId: row.empresa_id as string,
  nome: row.nome as string,
  codigo: row.codigo as string,
  descricao: row.descricao as string | undefined,
  cor: row.cor as string,
  icone: row.icone as string,
  ativo: row.ativo as boolean,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapColunaFromDB = (row: Record<string, unknown>): TakeoffColunaConfig => ({
  id: row.id as string,
  disciplinaId: row.disciplina_id as string,
  nome: row.nome as string,
  codigo: row.codigo as string,
  tipo: row.tipo as TakeoffColunaConfig['tipo'],
  formula: row.formula as string | undefined,
  opcoes: row.opcoes as string[] | undefined,
  unidade: row.unidade as string | undefined,
  casasDecimais: row.casas_decimais as number,
  obrigatoria: row.obrigatoria as boolean,
  visivel: row.visivel as boolean,
  ordem: row.ordem as number,
  largura: row.largura as number,
});

const mapMapaFromDB = (row: Record<string, unknown>): TakeoffMapa => ({
  id: row.id as string,
  projetoId: row.projeto_id as string,
  disciplinaId: row.disciplina_id as string,
  nome: row.nome as string,
  versao: row.versao as string,
  status: row.status as TakeoffMapa['status'],
  descricao: row.descricao as string | undefined,
  dataReferencia: row.data_referencia ? new Date(row.data_referencia as string) : undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapItemFromDB = (row: Record<string, unknown>): TakeoffItem => ({
  id: row.id as string,
  mapaId: row.mapa_id as string,
  documentoId: row.documento_id as string | undefined,
  itemPq: row.item_pq as string | undefined,
  area: row.area as string | undefined,
  edificacao: row.edificacao as string | undefined,
  tag: row.tag as string | undefined,
  linha: row.linha as string | undefined,
  descricao: row.descricao as string,
  tipoMaterial: row.tipo_material as string | undefined,
  dimensao: row.dimensao as string | undefined,
  unidade: row.unidade as string,
  qtdPrevista: Number(row.qtd_prevista) || 0,
  qtdTakeoff: Number(row.qtd_takeoff) || 0,
  qtdExecutada: Number(row.qtd_executada) || 0,
  pesoUnitario: Number(row.peso_unitario) || 0,
  pesoTotal: Number(row.peso_total) || 0,
  custoUnitario: Number(row.custo_unitario) || 0,
  custoTotal: Number(row.custo_total) || 0,
  percentualExecutado: Number(row.percentual_executado) || 0,
  status: row.status as TakeoffItem['status'],
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapMedicaoFromDB = (row: Record<string, unknown>): TakeoffMedicao => ({
  id: row.id as string,
  itemId: row.item_id as string,
  usuarioId: row.usuario_id as string | undefined,
  periodoInicio: new Date(row.periodo_inicio as string),
  periodoFim: new Date(row.periodo_fim as string),
  qtdPeriodo: Number(row.qtd_periodo) || 0,
  qtdAcumulada: row.qtd_acumulada ? Number(row.qtd_acumulada) : undefined,
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapVinculoFromDB = (row: Record<string, unknown>): TakeoffVinculo => ({
  id: row.id as string,
  itemId: row.item_id as string,
  atividadeId: row.atividade_id as string,
  peso: Number(row.peso) || 100,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapDocumentoFromDB = (row: Record<string, unknown>): TakeoffDocumento => ({
  id: row.id as string,
  projetoId: row.projeto_id as string,
  disciplinaId: row.disciplina_id as string | undefined,
  codigo: row.codigo as string,
  titulo: row.titulo as string | undefined,
  revisao: row.revisao as string,
  tipo: row.tipo as string | undefined,
  status: row.status as TakeoffDocumento['status'],
  dataEmissao: row.data_emissao ? new Date(row.data_emissao as string) : undefined,
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

export const DISCIPLINA_TEMPLATES: DisciplinaTemplate[] = [
  {
    codigo: 'TUB',
    nome: 'Tubulação',
    cor: '#3B82F6',
    icone: 'cylinder',
    colunas: [
      { nome: 'Linha', codigo: 'linha', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120 },
      { nome: 'Isométrico', codigo: 'isometrico', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 130 },
      { nome: 'Diâmetro', codigo: 'diametro', tipo: 'text', ordem: 3, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 80 },
      { nome: 'Material', codigo: 'material', tipo: 'text', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 150 },
      { nome: 'Schedule', codigo: 'schedule', tipo: 'text', ordem: 5, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 80 },
      { nome: 'Fluido', codigo: 'fluido', tipo: 'text', ordem: 6, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100 },
      { nome: 'Soldas (un)', codigo: 'soldas', tipo: 'number', ordem: 7, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 80 },
      { nome: 'Pol. Soldadas', codigo: 'pol_soldadas', tipo: 'decimal', ordem: 8, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 100, formula: 'diametro * soldas' },
    ],
  },
  {
    codigo: 'ELE',
    nome: 'Elétrica',
    cor: '#F59E0B',
    icone: 'zap',
    colunas: [
      { nome: 'Circuito', codigo: 'circuito', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120 },
      { nome: 'Cabo', codigo: 'cabo', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 150 },
      { nome: 'Seção (mm²)', codigo: 'secao', tipo: 'decimal', ordem: 3, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 100 },
      { nome: 'Tipo', codigo: 'tipo_cabo', tipo: 'select', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100, opcoes: ['Força', 'Controle', 'Instrumentação', 'Aterramento'] },
      { nome: 'Bandeja', codigo: 'bandeja', tipo: 'text', ordem: 5, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100 },
      { nome: 'Metragem', codigo: 'metragem', tipo: 'decimal', ordem: 6, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 100, unidade: 'm' },
    ],
  },
  {
    codigo: 'CAL',
    nome: 'Caldeiraria',
    cor: '#EF4444',
    icone: 'box',
    colunas: [
      { nome: 'TAG Equipamento', codigo: 'tag_equip', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 130 },
      { nome: 'Peso (ton)', codigo: 'peso_ton', tipo: 'decimal', ordem: 2, casasDecimais: 3, obrigatoria: false, visivel: true, largura: 100, unidade: 'ton' },
      { nome: 'Área Pintura (m²)', codigo: 'area_pintura', tipo: 'decimal', ordem: 3, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 120, unidade: 'm²' },
      { nome: 'Tipo Solda', codigo: 'tipo_solda', tipo: 'select', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100, opcoes: ['TIG', 'MIG', 'Eletrodo', 'Arco Submerso'] },
    ],
  },
  {
    codigo: 'SUP',
    nome: 'Suporte',
    cor: '#8B5CF6',
    icone: 'layers',
    colunas: [
      { nome: 'Tipo Suporte', codigo: 'tipo_suporte', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 130 },
      { nome: 'Perfil', codigo: 'perfil', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100 },
      { nome: 'Comprimento (m)', codigo: 'comprimento', tipo: 'decimal', ordem: 3, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 120, unidade: 'm' },
    ],
  },
  {
    codigo: 'EST',
    nome: 'Estrutura',
    cor: '#10B981',
    icone: 'building',
    colunas: [
      { nome: 'Peça', codigo: 'peca', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120 },
      { nome: 'Perfil', codigo: 'perfil', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 100 },
      { nome: 'Comprimento (m)', codigo: 'comprimento', tipo: 'decimal', ordem: 3, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 120, unidade: 'm' },
      { nome: 'Tratamento', codigo: 'tratamento', tipo: 'select', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120, opcoes: ['Galvanizado', 'Pintado', 'Zincado', 'Natural'] },
    ],
  },
  {
    codigo: 'EQP',
    nome: 'Equipamentos',
    cor: '#06B6D4',
    icone: 'settings',
    colunas: [
      { nome: 'TAG', codigo: 'tag_equip', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: true, visivel: true, largura: 120 },
      { nome: 'Peso (ton)', codigo: 'peso_ton', tipo: 'decimal', ordem: 2, casasDecimais: 3, obrigatoria: false, visivel: true, largura: 100, unidade: 'ton' },
      { nome: 'Dimensões', codigo: 'dimensoes', tipo: 'text', ordem: 3, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 150 },
      { nome: 'Tipo Montagem', codigo: 'tipo_montagem', tipo: 'select', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120, opcoes: ['Içamento', 'Rigging', 'Manual', 'Rolamento'] },
    ],
  },
];

const DEMO_DISCIPLINAS: TakeoffDisciplina[] = [
  { id: 'demo-tub', empresaId: 'demo', nome: 'Tubulação', codigo: 'TUB', cor: '#3B82F6', icone: 'tube', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-ele', empresaId: 'demo', nome: 'Elétrica', codigo: 'ELE', cor: '#F59E0B', icone: 'zap', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-cal', empresaId: 'demo', nome: 'Caldeiraria', codigo: 'CAL', cor: '#EF4444', icone: 'hammer', ativo: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-est', empresaId: 'demo', nome: 'Estrutura', codigo: 'EST', cor: '#10B981', icone: 'building', ativo: true, createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_MAPAS: TakeoffMapa[] = [
  { id: 'demo-mapa-1', projetoId: '', disciplinaId: 'demo-tub', nome: 'Tubulação - Área 01', versao: '1.0', status: 'aprovado', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-mapa-2', projetoId: '', disciplinaId: 'demo-tub', nome: 'Tubulação - Área 02', versao: '1.0', status: 'rascunho', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-mapa-3', projetoId: '', disciplinaId: 'demo-ele', nome: 'Elétrica - Bloco A', versao: '1.0', status: 'em_analise', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-mapa-4', projetoId: '', disciplinaId: 'demo-cal', nome: 'Caldeiraria - Equipamentos', versao: '2.0', status: 'aprovado', createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_ITENS: TakeoffItem[] = [
  { id: 'demo-item-1', mapaId: 'demo-mapa-1', descricao: 'Tubo Aço Carbono ASTM A106 Gr.B', unidade: 'm', qtdPrevista: 150, qtdTakeoff: 145.5, qtdExecutada: 87, pesoUnitario: 12.5, pesoTotal: 1818.75, custoUnitario: 250, custoTotal: 36375, percentualExecutado: 59.8, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-2', mapaId: 'demo-mapa-1', descricao: 'Tubo Inox 316L', unidade: 'm', qtdPrevista: 80, qtdTakeoff: 82, qtdExecutada: 82, pesoUnitario: 8.2, pesoTotal: 672.4, custoUnitario: 450, custoTotal: 36900, percentualExecutado: 100, status: 'concluido', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-3', mapaId: 'demo-mapa-1', descricao: 'Curva 90° LR', unidade: 'un', qtdPrevista: 24, qtdTakeoff: 24, qtdExecutada: 18, pesoUnitario: 3.5, pesoTotal: 84, custoUnitario: 180, custoTotal: 4320, percentualExecutado: 75, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-4', mapaId: 'demo-mapa-1', descricao: 'Flange WN 150#', unidade: 'un', qtdPrevista: 16, qtdTakeoff: 16, qtdExecutada: 12, pesoUnitario: 5.2, pesoTotal: 83.2, custoUnitario: 320, custoTotal: 5120, percentualExecutado: 75, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-5', mapaId: 'demo-mapa-3', descricao: 'Cabo 3x4mm² XLPE', unidade: 'm', qtdPrevista: 500, qtdTakeoff: 520, qtdExecutada: 312, pesoUnitario: 0.15, pesoTotal: 78, custoUnitario: 28, custoTotal: 14560, percentualExecutado: 60, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-6', mapaId: 'demo-mapa-3', descricao: 'Eletrocalha 100x50mm', unidade: 'm', qtdPrevista: 120, qtdTakeoff: 125, qtdExecutada: 100, pesoUnitario: 2.8, pesoTotal: 350, custoUnitario: 85, custoTotal: 10625, percentualExecutado: 80, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-7', mapaId: 'demo-mapa-4', descricao: 'Vaso de Pressão V-101', unidade: 'un', qtdPrevista: 1, qtdTakeoff: 1, qtdExecutada: 1, pesoUnitario: 12500, pesoTotal: 12500, custoUnitario: 450000, custoTotal: 450000, percentualExecutado: 100, status: 'concluido', createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-item-8', mapaId: 'demo-mapa-4', descricao: 'Trocador de Calor E-201', unidade: 'un', qtdPrevista: 2, qtdTakeoff: 2, qtdExecutada: 1, pesoUnitario: 8200, pesoTotal: 16400, custoUnitario: 280000, custoTotal: 560000, percentualExecutado: 50, status: 'em_andamento', createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_MEDICOES: TakeoffMedicao[] = [
  { id: 'demo-med-1', itemId: 'demo-item-1', usuarioId: 'user-1', periodoInicio: new Date('2024-11-01'), periodoFim: new Date('2024-11-15'), qtdPeriodo: 45, qtdAcumulada: 45, observacoes: 'Primeira medição - Área 01', createdAt: new Date('2024-11-15'), updatedAt: new Date('2024-11-15') },
  { id: 'demo-med-2', itemId: 'demo-item-1', usuarioId: 'user-1', periodoInicio: new Date('2024-11-16'), periodoFim: new Date('2024-11-30'), qtdPeriodo: 42, qtdAcumulada: 87, observacoes: 'Segunda medição', createdAt: new Date('2024-11-30'), updatedAt: new Date('2024-11-30') },
  { id: 'demo-med-3', itemId: 'demo-item-2', usuarioId: 'user-1', periodoInicio: new Date('2024-11-01'), periodoFim: new Date('2024-11-30'), qtdPeriodo: 82, qtdAcumulada: 82, observacoes: 'Instalação completa', createdAt: new Date('2024-11-30'), updatedAt: new Date('2024-11-30') },
  { id: 'demo-med-4', itemId: 'demo-item-5', usuarioId: 'user-2', periodoInicio: new Date('2024-12-01'), periodoFim: new Date('2024-12-15'), qtdPeriodo: 200, qtdAcumulada: 200, observacoes: 'Lançamento de cabos - Trecho A', createdAt: new Date('2024-12-15'), updatedAt: new Date('2024-12-15') },
  { id: 'demo-med-5', itemId: 'demo-item-5', usuarioId: 'user-2', periodoInicio: new Date('2024-12-16'), periodoFim: new Date('2024-12-31'), qtdPeriodo: 112, qtdAcumulada: 312, observacoes: 'Lançamento de cabos - Trecho B', createdAt: new Date('2024-12-31'), updatedAt: new Date('2024-12-31') },
  { id: 'demo-med-6', itemId: 'demo-item-7', usuarioId: 'user-1', periodoInicio: new Date('2024-10-01'), periodoFim: new Date('2024-10-31'), qtdPeriodo: 1, qtdAcumulada: 1, observacoes: 'Montagem do vaso V-101 concluída', createdAt: new Date('2024-10-31'), updatedAt: new Date('2024-10-31') },
];

const DEMO_VINCULOS: TakeoffVinculo[] = [
  { id: 'demo-vinc-1', itemId: 'demo-item-1', atividadeId: 'ativ-tub-001', peso: 60, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-2', itemId: 'demo-item-1', atividadeId: 'ativ-tub-002', peso: 40, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-3', itemId: 'demo-item-2', atividadeId: 'ativ-tub-003', peso: 100, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-4', itemId: 'demo-item-5', atividadeId: 'ativ-ele-001', peso: 100, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-5', itemId: 'demo-item-6', atividadeId: 'ativ-ele-002', peso: 70, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-6', itemId: 'demo-item-6', atividadeId: 'ativ-ele-003', peso: 30, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-7', itemId: 'demo-item-7', atividadeId: 'ativ-cal-001', peso: 100, createdAt: new Date(), updatedAt: new Date() },
  { id: 'demo-vinc-8', itemId: 'demo-item-8', atividadeId: 'ativ-cal-002', peso: 100, createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_DOCUMENTOS: TakeoffDocumento[] = [
  { id: 'demo-doc-1', projetoId: '', disciplinaId: 'demo-tub', codigo: 'ISO-TUB-001', titulo: 'Isométrico Linha 01-P-001', revisao: 'A', tipo: 'isometrico', status: 'aprovado', dataEmissao: new Date('2024-09-15'), createdAt: new Date('2024-09-15'), updatedAt: new Date('2024-09-15') },
  { id: 'demo-doc-2', projetoId: '', disciplinaId: 'demo-tub', codigo: 'ISO-TUB-002', titulo: 'Isométrico Linha 02-P-002', revisao: 'B', tipo: 'isometrico', status: 'aprovado', dataEmissao: new Date('2024-09-20'), createdAt: new Date('2024-09-20'), updatedAt: new Date('2024-10-05') },
  { id: 'demo-doc-3', projetoId: '', disciplinaId: 'demo-ele', codigo: 'UNI-ELE-001', titulo: 'Diagrama Unifilar QGF', revisao: 'C', tipo: 'diagrama', status: 'aprovado', dataEmissao: new Date('2024-08-10'), createdAt: new Date('2024-08-10'), updatedAt: new Date('2024-09-25') },
  { id: 'demo-doc-4', projetoId: '', disciplinaId: 'demo-ele', codigo: 'LAY-ELE-001', titulo: 'Layout de Bandejamento', revisao: 'A', tipo: 'layout', status: 'em_revisao', dataEmissao: new Date('2024-10-01'), observacoes: 'Pendente aprovação cliente', createdAt: new Date('2024-10-01'), updatedAt: new Date('2024-10-01') },
  { id: 'demo-doc-5', projetoId: '', disciplinaId: 'demo-cal', codigo: 'DES-CAL-001', titulo: 'Fabricação Vaso V-101', revisao: 'D', tipo: 'fabricacao', status: 'aprovado', dataEmissao: new Date('2024-07-15'), createdAt: new Date('2024-07-15'), updatedAt: new Date('2024-08-20') },
  { id: 'demo-doc-6', projetoId: '', disciplinaId: 'demo-cal', codigo: 'DES-CAL-002', titulo: 'Montagem Trocador E-201', revisao: 'B', tipo: 'montagem', status: 'aprovado', dataEmissao: new Date('2024-09-01'), createdAt: new Date('2024-09-01'), updatedAt: new Date('2024-09-15') },
];

const DEMO_COLUNAS: TakeoffColunaConfig[] = [
  { id: 'demo-col-1', disciplinaId: 'demo-tub', nome: 'Linha', codigo: 'linha', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120 },
  { id: 'demo-col-2', disciplinaId: 'demo-tub', nome: 'Isométrico', codigo: 'isometrico', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 130 },
  { id: 'demo-col-3', disciplinaId: 'demo-tub', nome: 'Diâmetro', codigo: 'diametro', tipo: 'text', ordem: 3, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 80 },
  { id: 'demo-col-4', disciplinaId: 'demo-tub', nome: 'Material', codigo: 'material', tipo: 'text', ordem: 4, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 150 },
  { id: 'demo-col-5', disciplinaId: 'demo-ele', nome: 'Circuito', codigo: 'circuito', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 120 },
  { id: 'demo-col-6', disciplinaId: 'demo-ele', nome: 'Cabo', codigo: 'cabo', tipo: 'text', ordem: 2, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 150 },
  { id: 'demo-col-7', disciplinaId: 'demo-ele', nome: 'Seção (mm²)', codigo: 'secao', tipo: 'decimal', ordem: 3, casasDecimais: 2, obrigatoria: false, visivel: true, largura: 100 },
  { id: 'demo-col-8', disciplinaId: 'demo-cal', nome: 'TAG Equipamento', codigo: 'tag_equip', tipo: 'text', ordem: 1, casasDecimais: 0, obrigatoria: false, visivel: true, largura: 130 },
  { id: 'demo-col-9', disciplinaId: 'demo-cal', nome: 'Peso (ton)', codigo: 'peso_ton', tipo: 'decimal', ordem: 2, casasDecimais: 3, obrigatoria: false, visivel: true, largura: 100, unidade: 'ton' },
];

const isPGRST205Error = (error: { code?: string }) => error?.code === 'PGRST205';

export const takeoffService = {
  async getDisciplinas(empresaId: string): Promise<TakeoffDisciplina[]> {
    const { data, error } = await supabase
      .from('takeoff_disciplinas')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('ativo', true)
      .order('nome');

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_DISCIPLINAS;
      }
      console.error('Erro ao buscar disciplinas:', error);
      return [];
    }
    return (data || []).map(mapDisciplinaFromDB);
  },

  async createDisciplina(dto: CreateDisciplinaDTO): Promise<TakeoffDisciplina | null> {
    const { data, error } = await supabase
      .from('takeoff_disciplinas')
      .insert({
        empresa_id: dto.empresaId,
        nome: dto.nome,
        codigo: dto.codigo,
        descricao: dto.descricao,
        cor: dto.cor || '#3B82F6',
        icone: dto.icone || 'package',
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar disciplina:', error);
      return null;
    }
    return mapDisciplinaFromDB(data);
  },

  async initializeDisciplinasFromTemplates(empresaId: string): Promise<void> {
    const existing = await this.getDisciplinas(empresaId);
    if (existing.length > 0) return;

    for (const template of DISCIPLINA_TEMPLATES) {
      const disciplina = await this.createDisciplina({
        empresaId,
        nome: template.nome,
        codigo: template.codigo,
        cor: template.cor,
        icone: template.icone,
      });

      if (disciplina) {
        for (const coluna of template.colunas) {
          await supabase.from('takeoff_colunas_config').insert({
            disciplina_id: disciplina.id,
            nome: coluna.nome,
            codigo: coluna.codigo,
            tipo: coluna.tipo,
            formula: coluna.formula,
            opcoes: coluna.opcoes,
            unidade: coluna.unidade,
            casas_decimais: coluna.casasDecimais,
            obrigatoria: coluna.obrigatoria,
            visivel: coluna.visivel,
            ordem: coluna.ordem,
            largura: coluna.largura,
          });
        }
      }
    }
  },

  async getColunasConfig(disciplinaId: string): Promise<TakeoffColunaConfig[]> {
    const { data, error } = await supabase
      .from('takeoff_colunas_config')
      .select('*')
      .eq('disciplina_id', disciplinaId)
      .eq('visivel', true)
      .order('ordem');

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_COLUNAS.filter(c => c.disciplinaId === disciplinaId).sort((a, b) => a.ordem - b.ordem);
      }
      console.error('Erro ao buscar colunas:', error);
      return [];
    }
    return (data || []).map(mapColunaFromDB);
  },

  async getMapas(projetoId: string, disciplinaId?: string): Promise<TakeoffMapa[]> {
    let query = supabase
      .from('takeoff_mapas')
      .select('*, takeoff_disciplinas(*)')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false });

    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId);
    }

    const { data, error } = await query;

    if (error) {
      if (isPGRST205Error(error)) {
        const filteredMapas = disciplinaId 
          ? DEMO_MAPAS.filter(m => m.disciplinaId === disciplinaId)
          : DEMO_MAPAS;
        return filteredMapas.map(m => ({
          ...m,
          projetoId,
          disciplina: DEMO_DISCIPLINAS.find(d => d.id === m.disciplinaId),
        }));
      }
      console.error('Erro ao buscar mapas:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapMapaFromDB(row),
      disciplina: row.takeoff_disciplinas ? mapDisciplinaFromDB(row.takeoff_disciplinas) : undefined,
    }));
  },

  async createMapa(dto: CreateMapaDTO): Promise<TakeoffMapa | null> {
    const { data, error } = await supabase
      .from('takeoff_mapas')
      .insert({
        projeto_id: dto.projetoId,
        disciplina_id: dto.disciplinaId,
        nome: dto.nome,
        versao: dto.versao || '1.0',
        descricao: dto.descricao,
        data_referencia: dto.dataReferencia?.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar mapa:', error);
      return null;
    }
    return mapMapaFromDB(data);
  },

  async updateMapa(id: string, dto: UpdateMapaDTO): Promise<TakeoffMapa | null> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.nome !== undefined) updates.nome = dto.nome;
    if (dto.versao !== undefined) updates.versao = dto.versao;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.descricao !== undefined) updates.descricao = dto.descricao;
    if (dto.dataReferencia !== undefined) updates.data_referencia = dto.dataReferencia?.toISOString();

    const { data, error } = await supabase
      .from('takeoff_mapas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar mapa:', error);
      return null;
    }
    return mapMapaFromDB(data);
  },

  async deleteMapa(id: string): Promise<boolean> {
    const { error } = await supabase.from('takeoff_mapas').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir mapa:', error);
      return false;
    }
    return true;
  },

  async getItens(filter: TakeoffFilter): Promise<TakeoffItem[]> {
    let query = supabase.from('takeoff_itens').select('*');

    if (filter.mapaId) {
      query = query.eq('mapa_id', filter.mapaId);
    }
    if (filter.area) {
      query = query.eq('area', filter.area);
    }
    if (filter.edificacao) {
      query = query.eq('edificacao', filter.edificacao);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.search) {
      query = query.or(`descricao.ilike.%${filter.search}%,tag.ilike.%${filter.search}%,item_pq.ilike.%${filter.search}%`);
    }

    const { data, error } = await query.order('created_at');

    if (error) {
      if (isPGRST205Error(error)) {
        let filteredItens = DEMO_ITENS;
        if (filter.mapaId) {
          filteredItens = filteredItens.filter(i => i.mapaId === filter.mapaId);
        }
        if (filter.area) {
          filteredItens = filteredItens.filter(i => i.area === filter.area);
        }
        if (filter.edificacao) {
          filteredItens = filteredItens.filter(i => i.edificacao === filter.edificacao);
        }
        if (filter.status) {
          filteredItens = filteredItens.filter(i => i.status === filter.status);
        }
        if (filter.search) {
          const search = filter.search.toLowerCase();
          filteredItens = filteredItens.filter(i => 
            i.descricao.toLowerCase().includes(search) ||
            (i.tag && i.tag.toLowerCase().includes(search)) ||
            (i.itemPq && i.itemPq.toLowerCase().includes(search))
          );
        }
        return filteredItens.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      console.error('Erro ao buscar itens:', error);
      return [];
    }
    return (data || []).map(mapItemFromDB);
  },

  async createItem(dto: CreateItemDTO): Promise<TakeoffItem | null> {
    const { data, error } = await supabase
      .from('takeoff_itens')
      .insert({
        mapa_id: dto.mapaId,
        documento_id: dto.documentoId,
        item_pq: dto.itemPq,
        area: dto.area,
        edificacao: dto.edificacao,
        tag: dto.tag,
        linha: dto.linha,
        descricao: dto.descricao,
        tipo_material: dto.tipoMaterial,
        dimensao: dto.dimensao,
        unidade: dto.unidade,
        qtd_prevista: dto.qtdPrevista || 0,
        qtd_takeoff: dto.qtdTakeoff || 0,
        peso_unitario: dto.pesoUnitario || 0,
        custo_unitario: dto.custoUnitario || 0,
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar item:', error);
      return null;
    }
    return mapItemFromDB(data);
  },

  async createItensBatch(itens: CreateItemDTO[]): Promise<number> {
    if (itens.length === 0) return 0;

    const rows = itens.map((dto) => ({
      mapa_id: dto.mapaId,
      documento_id: dto.documentoId,
      item_pq: dto.itemPq,
      area: dto.area,
      edificacao: dto.edificacao,
      tag: dto.tag,
      linha: dto.linha,
      descricao: dto.descricao,
      tipo_material: dto.tipoMaterial,
      dimensao: dto.dimensao,
      unidade: dto.unidade,
      qtd_prevista: dto.qtdPrevista || 0,
      qtd_takeoff: dto.qtdTakeoff || 0,
      peso_unitario: dto.pesoUnitario || 0,
      custo_unitario: dto.custoUnitario || 0,
      observacoes: dto.observacoes,
    }));

    const { data, error } = await supabase.from('takeoff_itens').insert(rows).select();

    if (error) {
      console.error('Erro ao criar itens em lote:', error);
      return 0;
    }
    return data?.length || 0;
  },

  async updateItem(id: string, dto: UpdateItemDTO): Promise<TakeoffItem | null> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.documentoId !== undefined) updates.documento_id = dto.documentoId;
    if (dto.itemPq !== undefined) updates.item_pq = dto.itemPq;
    if (dto.area !== undefined) updates.area = dto.area;
    if (dto.edificacao !== undefined) updates.edificacao = dto.edificacao;
    if (dto.tag !== undefined) updates.tag = dto.tag;
    if (dto.linha !== undefined) updates.linha = dto.linha;
    if (dto.descricao !== undefined) updates.descricao = dto.descricao;
    if (dto.tipoMaterial !== undefined) updates.tipo_material = dto.tipoMaterial;
    if (dto.dimensao !== undefined) updates.dimensao = dto.dimensao;
    if (dto.unidade !== undefined) updates.unidade = dto.unidade;
    if (dto.qtdPrevista !== undefined) updates.qtd_prevista = dto.qtdPrevista;
    if (dto.qtdTakeoff !== undefined) updates.qtd_takeoff = dto.qtdTakeoff;
    if (dto.qtdExecutada !== undefined) updates.qtd_executada = dto.qtdExecutada;
    if (dto.pesoUnitario !== undefined) updates.peso_unitario = dto.pesoUnitario;
    if (dto.custoUnitario !== undefined) updates.custo_unitario = dto.custoUnitario;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.observacoes !== undefined) updates.observacoes = dto.observacoes;

    const { data, error } = await supabase
      .from('takeoff_itens')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar item:', error);
      return null;
    }
    return mapItemFromDB(data);
  },

  async deleteItem(id: string): Promise<boolean> {
    const { error } = await supabase.from('takeoff_itens').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir item:', error);
      return false;
    }
    return true;
  },

  async getTotais(filter: TakeoffFilter): Promise<TakeoffTotais> {
    const itens = await this.getItens(filter);
    
    const totais: TakeoffTotais = {
      totalItens: itens.length,
      qtdPrevistaTotal: 0,
      qtdTakeoffTotal: 0,
      qtdExecutadaTotal: 0,
      pesoTotal: 0,
      custoTotal: 0,
      percentualMedio: 0,
    };

    if (itens.length === 0) return totais;

    itens.forEach((item) => {
      totais.qtdPrevistaTotal += item.qtdPrevista;
      totais.qtdTakeoffTotal += item.qtdTakeoff;
      totais.qtdExecutadaTotal += item.qtdExecutada;
      totais.pesoTotal += item.pesoTotal;
      totais.custoTotal += item.custoTotal;
    });

    totais.percentualMedio = totais.qtdTakeoffTotal > 0
      ? (totais.qtdExecutadaTotal / totais.qtdTakeoffTotal) * 100
      : 0;

    return totais;
  },

  async createMedicao(dto: CreateMedicaoDTO): Promise<TakeoffMedicao | null> {
    const { data: lastMedicao } = await supabase
      .from('takeoff_medicoes')
      .select('qtd_acumulada')
      .eq('item_id', dto.itemId)
      .order('periodo_fim', { ascending: false })
      .limit(1)
      .single();

    const qtdAcumuladaAnterior = lastMedicao?.qtd_acumulada || 0;
    const qtdAcumulada = Number(qtdAcumuladaAnterior) + dto.qtdPeriodo;

    const { data, error } = await supabase
      .from('takeoff_medicoes')
      .insert({
        item_id: dto.itemId,
        usuario_id: dto.usuarioId,
        periodo_inicio: dto.periodoInicio.toISOString(),
        periodo_fim: dto.periodoFim.toISOString(),
        qtd_periodo: dto.qtdPeriodo,
        qtd_acumulada: qtdAcumulada,
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar medição:', error);
      return null;
    }

    await supabase
      .from('takeoff_itens')
      .update({ 
        qtd_executada: qtdAcumulada,
        status: 'em_andamento',
        updated_at: new Date().toISOString(),
      })
      .eq('id', dto.itemId);

    return mapMedicaoFromDB(data);
  },

  async getMedicoes(itemId: string): Promise<TakeoffMedicao[]> {
    const { data, error } = await supabase
      .from('takeoff_medicoes')
      .select('*, usuarios(id, nome)')
      .eq('item_id', itemId)
      .order('periodo_fim', { ascending: false });

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_MEDICOES.filter(m => m.itemId === itemId)
          .sort((a, b) => new Date(b.periodoFim).getTime() - new Date(a.periodoFim).getTime())
          .map(m => ({ ...m, usuario: { id: m.usuarioId || 'user-1', nome: 'Usuário Demo' } }));
      }
      console.error('Erro ao buscar medições:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapMedicaoFromDB(row),
      usuario: row.usuarios ? { id: row.usuarios.id, nome: row.usuarios.nome } : undefined,
    }));
  },

  async createVinculo(dto: CreateVinculoDTO): Promise<TakeoffVinculo | null> {
    const { data, error } = await supabase
      .from('takeoff_vinculos')
      .insert({
        item_id: dto.itemId,
        atividade_id: dto.atividadeId,
        peso: dto.peso || 100,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar vínculo:', error);
      return null;
    }
    return mapVinculoFromDB(data);
  },

  async getVinculosByAtividade(atividadeId: string): Promise<TakeoffVinculo[]> {
    const { data, error } = await supabase
      .from('takeoff_vinculos')
      .select('*, takeoff_itens(*)')
      .eq('atividade_id', atividadeId);

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_VINCULOS.filter(v => v.atividadeId === atividadeId)
          .map(v => ({ ...v, item: DEMO_ITENS.find(i => i.id === v.itemId) }));
      }
      console.error('Erro ao buscar vínculos:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapVinculoFromDB(row),
      item: row.takeoff_itens ? mapItemFromDB(row.takeoff_itens) : undefined,
    }));
  },

  async getAllVinculos(): Promise<TakeoffVinculo[]> {
    const { data, error } = await supabase
      .from('takeoff_vinculos')
      .select('*, takeoff_itens(*)');

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_VINCULOS.map(v => ({ ...v, item: DEMO_ITENS.find(i => i.id === v.itemId) }));
      }
      console.error('Erro ao buscar vínculos:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapVinculoFromDB(row),
      item: row.takeoff_itens ? mapItemFromDB(row.takeoff_itens) : undefined,
    }));
  },

  async getAllMedicoes(): Promise<TakeoffMedicao[]> {
    const { data, error } = await supabase
      .from('takeoff_medicoes')
      .select('*, takeoff_itens(*)')
      .order('periodo_fim', { ascending: false });

    if (error) {
      if (isPGRST205Error(error)) {
        return DEMO_MEDICOES.map(m => ({ 
          ...m, 
          usuario: { id: m.usuarioId || 'user-1', nome: 'Usuário Demo' },
          item: DEMO_ITENS.find(i => i.id === m.itemId),
        })).sort((a, b) => new Date(b.periodoFim).getTime() - new Date(a.periodoFim).getTime());
      }
      console.error('Erro ao buscar medições:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapMedicaoFromDB(row),
      item: row.takeoff_itens ? mapItemFromDB(row.takeoff_itens) : undefined,
    }));
  },

  async deleteVinculo(id: string): Promise<boolean> {
    const { error } = await supabase.from('takeoff_vinculos').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir vínculo:', error);
      return false;
    }
    return true;
  },

  async calcularProgressoAtividade(atividadeId: string): Promise<number> {
    const vinculos = await this.getVinculosByAtividade(atividadeId);
    if (vinculos.length === 0) return 0;

    let somaPesos = 0;
    let somaProgresso = 0;

    vinculos.forEach((vinculo) => {
      if (vinculo.item) {
        somaPesos += vinculo.peso;
        somaProgresso += (vinculo.item.percentualExecutado * vinculo.peso) / 100;
      }
    });

    return somaPesos > 0 ? (somaProgresso / somaPesos) * 100 : 0;
  },

  async getDocumentos(projetoId: string, disciplinaId?: string): Promise<TakeoffDocumento[]> {
    let query = supabase
      .from('takeoff_documentos')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('codigo');

    if (disciplinaId) {
      query = query.eq('disciplina_id', disciplinaId);
    }

    const { data, error } = await query;

    if (error) {
      if (isPGRST205Error(error)) {
        const filteredDocs = disciplinaId 
          ? DEMO_DOCUMENTOS.filter(d => d.disciplinaId === disciplinaId)
          : DEMO_DOCUMENTOS;
        return filteredDocs.map(d => ({ ...d, projetoId })).sort((a, b) => a.codigo.localeCompare(b.codigo));
      }
      console.error('Erro ao buscar documentos:', error);
      return [];
    }
    return (data || []).map(mapDocumentoFromDB);
  },

  async createDocumento(dto: CreateDocumentoDTO): Promise<TakeoffDocumento | null> {
    const { data, error } = await supabase
      .from('takeoff_documentos')
      .insert({
        projeto_id: dto.projetoId,
        disciplina_id: dto.disciplinaId,
        codigo: dto.codigo,
        titulo: dto.titulo,
        revisao: dto.revisao || '0',
        tipo: dto.tipo,
        data_emissao: dto.dataEmissao?.toISOString(),
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar documento:', error);
      return null;
    }
    return mapDocumentoFromDB(data);
  },

  async getAreasDisponiveis(mapaId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('takeoff_itens')
      .select('area')
      .eq('mapa_id', mapaId)
      .not('area', 'is', null);

    if (error) return [];
    const areas = new Set((data || []).map((r) => r.area as string).filter(Boolean));
    return Array.from(areas).sort();
  },

  async getEdificacoesDisponiveis(mapaId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('takeoff_itens')
      .select('edificacao')
      .eq('mapa_id', mapaId)
      .not('edificacao', 'is', null);

    if (error) return [];
    const edificacoes = new Set((data || []).map((r) => r.edificacao as string).filter(Boolean));
    return Array.from(edificacoes).sort();
  },
};
