import { supabase } from './supabase';
import { parseDateOnly } from '../utils/dateHelpers';
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
  dataReferencia: parseDateOnly(row.data_referencia as string) ?? undefined,
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
  valoresCustom: (row.valores_custom as Record<string, string>) || {},
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapMedicaoFromDB = (row: Record<string, unknown>): TakeoffMedicao => ({
  id: row.id as string,
  itemId: row.item_id as string,
  usuarioId: row.usuario_id as string | undefined,
  periodoInicio: parseDateOnly(row.periodo_inicio as string) ?? new Date(),
  periodoFim: parseDateOnly(row.periodo_fim as string) ?? new Date(),
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
  dataEmissao: parseDateOnly(row.data_emissao as string) ?? undefined,
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
        console.warn('Tabela takeoff_disciplinas não encontrada. Execute as migrações SQL no Supabase.');
        return [];
      }
      console.error('Erro ao buscar disciplinas:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      await this.initializeDisciplinasFromTemplates(empresaId);
      const { data: newData } = await supabase
        .from('takeoff_disciplinas')
        .select('*')
        .eq('empresa_id', empresaId)
        .eq('ativo', true)
        .order('nome');
      return (newData || []).map(mapDisciplinaFromDB);
    }
    
    return data.map(mapDisciplinaFromDB);
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

  async updateDisciplina(id: string, dto: UpdateDisciplinaDTO): Promise<TakeoffDisciplina | null> {
    const { data, error } = await supabase
      .from('takeoff_disciplinas')
      .update({
        nome: dto.nome,
        codigo: dto.codigo,
        descricao: dto.descricao,
        cor: dto.cor,
        icone: dto.icone,
        ativo: dto.ativo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar disciplina:', error);
      return null;
    }
    return mapDisciplinaFromDB(data);
  },

  async deleteDisciplina(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('takeoff_disciplinas')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir disciplina:', error);
      return false;
    }
    return true;
  },

  async initializeDisciplinasFromTemplates(empresaId: string): Promise<void> {
    const { error: rpcError } = await supabase.rpc('initialize_takeoff_disciplinas', {
      p_empresa_id: empresaId
    });

    if (rpcError) {
      console.warn('RPC não disponível, usando inserção direta:', rpcError.message);
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
    }
  },

  async getColunasConfig(disciplinaId: string): Promise<TakeoffColunaConfig[]> {
    const { data, error } = await supabase
      .from('takeoff_colunas_config')
      .select('*')
      .eq('disciplina_id', disciplinaId)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar colunas:', error);
      return [];
    }
    return (data || []).map(mapColunaFromDB);
  },

  async createColunaConfig(dto: {
    disciplinaId: string;
    nome: string;
    codigo: string;
    tipo: string;
    formula?: string;
    opcoes?: string[];
    unidade?: string;
    casasDecimais: number;
    obrigatoria: boolean;
    visivel: boolean;
    ordem: number;
    largura: number;
  }): Promise<TakeoffColunaConfig | null> {
    const { data, error } = await supabase
      .from('takeoff_colunas_config')
      .insert({
        disciplina_id: dto.disciplinaId,
        nome: dto.nome,
        codigo: dto.codigo,
        tipo: dto.tipo,
        formula: dto.formula,
        opcoes: dto.opcoes,
        unidade: dto.unidade,
        casas_decimais: dto.casasDecimais,
        obrigatoria: dto.obrigatoria,
        visivel: dto.visivel,
        ordem: dto.ordem,
        largura: dto.largura,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar coluna:', error);
      return null;
    }
    return mapColunaFromDB(data);
  },

  async updateColunaConfig(id: string, dto: {
    nome?: string;
    codigo?: string;
    tipo?: string;
    formula?: string;
    opcoes?: string[];
    unidade?: string;
    casasDecimais?: number;
    obrigatoria?: boolean;
    visivel?: boolean;
    ordem?: number;
    largura?: number;
  }): Promise<TakeoffColunaConfig | null> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.nome !== undefined) updates.nome = dto.nome;
    if (dto.codigo !== undefined) updates.codigo = dto.codigo;
    if (dto.tipo !== undefined) updates.tipo = dto.tipo;
    if (dto.formula !== undefined) updates.formula = dto.formula;
    if (dto.opcoes !== undefined) updates.opcoes = dto.opcoes;
    if (dto.unidade !== undefined) updates.unidade = dto.unidade;
    if (dto.casasDecimais !== undefined) updates.casas_decimais = dto.casasDecimais;
    if (dto.obrigatoria !== undefined) updates.obrigatoria = dto.obrigatoria;
    if (dto.visivel !== undefined) updates.visivel = dto.visivel;
    if (dto.ordem !== undefined) updates.ordem = dto.ordem;
    if (dto.largura !== undefined) updates.largura = dto.largura;

    const { data, error } = await supabase
      .from('takeoff_colunas_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar coluna:', error);
      return null;
    }
    return mapColunaFromDB(data);
  },

  async deleteColunaConfig(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('takeoff_colunas_config')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir coluna:', error);
      return false;
    }
    return true;
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

  async deleteMapaCascade(id: string): Promise<{ success: boolean; deletedItems: number; error?: string }> {
    try {
      const { data: vinculos } = await supabase
        .from('takeoff_vinculos')
        .select('id')
        .eq('mapa_id', id);
      
      if (vinculos && vinculos.length > 0) {
        const vinculoIds = vinculos.map(v => v.id);
        await supabase.from('takeoff_vinculos').delete().in('id', vinculoIds);
      }

      const { data: itens } = await supabase
        .from('takeoff_itens')
        .select('id')
        .eq('mapa_id', id);
      
      let deletedItems = 0;
      
      if (itens && itens.length > 0) {
        const itemIds = itens.map(i => i.id);
        
        await supabase.from('takeoff_medicoes').delete().in('item_id', itemIds);
        
        const { error: itensError } = await supabase
          .from('takeoff_itens')
          .delete()
          .in('id', itemIds);
        
        if (itensError) {
          console.error('Erro ao excluir itens:', itensError);
          return { success: false, deletedItems: 0, error: 'Erro ao excluir itens do mapa' };
        }
        
        deletedItems = itens.length;
      }
      
      const { error: mapaError } = await supabase
        .from('takeoff_mapas')
        .delete()
        .eq('id', id);
      
      if (mapaError) {
        console.error('Erro ao excluir mapa:', mapaError);
        return { success: false, deletedItems, error: 'Erro ao excluir o mapa' };
      }
      
      return { success: true, deletedItems };
    } catch (error) {
      console.error('Erro ao excluir mapa em cascata:', error);
      return { success: false, deletedItems: 0, error: 'Erro inesperado ao excluir mapa' };
    }
  },

  async getItens(filter: TakeoffFilter): Promise<TakeoffItem[]> {
    let mapaIds: string[] | undefined;

    if (filter.projetoId || filter.disciplinaId) {
      let mapaQuery = supabase.from('takeoff_mapas').select('id');
      if (filter.projetoId) {
        mapaQuery = mapaQuery.eq('projeto_id', filter.projetoId);
      }
      if (filter.disciplinaId) {
        mapaQuery = mapaQuery.eq('disciplina_id', filter.disciplinaId);
      }
      const { data: mapas, error: mapasError } = await mapaQuery;
      if (mapasError) {
        console.error('Erro ao buscar mapas para filtro:', mapasError);
        return [];
      }
      mapaIds = (mapas || []).map(m => m.id);
      if (mapaIds.length === 0) {
        return [];
      }
    }

    let query = supabase.from('takeoff_itens').select('*');

    if (filter.mapaId) {
      query = query.eq('mapa_id', filter.mapaId);
    } else if (mapaIds && mapaIds.length > 0) {
      query = query.in('mapa_id', mapaIds);
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

    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.from('takeoff_itens').insert(batch).select();

      if (error) {
        console.error('Erro ao inserir lote:', error);
        continue;
      }
      totalInserted += data?.length || 0;
    }
    
    return totalInserted;
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

  async deleteItensBatch(ids: string[], onProgress?: (current: number) => void): Promise<{ success: number; errors: string[] }> {
    if (ids.length === 0) return { success: 0, errors: [] };
    
    const errors: string[] = [];
    let successCount = 0;
    
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const { error } = await supabase
        .from('takeoff_itens')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao excluir item:', id, error);
        errors.push(`Item ${id}: ${error.message}`);
      } else {
        successCount++;
      }
      
      if (onProgress) {
        onProgress(i + 1);
      }
    }
    
    return { success: successCount, errors };
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
      .select(`
        *,
        takeoff_itens(*, takeoff_mapas(id, nome))
      `);

    if (error) {
      console.error('Erro ao buscar vínculos:', error);
      return [];
    }

    // Get unique atividade IDs to fetch from atividades_cronograma
    const atividadeIds = [...new Set((data || []).map(row => row.atividade_id).filter(Boolean))];
    
    // Fetch atividade data
    let atividadesMap: Record<string, { id: string; codigo?: string; nome: string; progresso: number }> = {};
    if (atividadeIds.length > 0) {
      const { data: atividades } = await supabase
        .from('atividades_cronograma')
        .select('id, codigo, nome, progresso')
        .in('id', atividadeIds);
      
      if (atividades) {
        atividades.forEach(a => {
          atividadesMap[a.id] = {
            id: a.id,
            codigo: a.codigo,
            nome: a.nome,
            progresso: Number(a.progresso) || 0,
          };
        });
      }
    }

    return (data || []).map((row) => ({
      ...mapVinculoFromDB(row),
      item: row.takeoff_itens ? mapItemFromDB(row.takeoff_itens) : undefined,
      atividade: row.atividade_id ? atividadesMap[row.atividade_id] : undefined,
      mapa: row.takeoff_itens?.takeoff_mapas ? {
        id: row.takeoff_itens.takeoff_mapas.id,
        nome: row.takeoff_itens.takeoff_mapas.nome,
      } : undefined,
    }));
  },

  async getAllMedicoes(): Promise<TakeoffMedicao[]> {
    const { data, error } = await supabase
      .from('takeoff_medicoes')
      .select('*, takeoff_itens(*)')
      .order('periodo_fim', { ascending: false });

    if (error) {
      console.error('Erro ao buscar medições:', error);
      return [];
    }

    return (data || []).map((row) => ({
      ...mapMedicaoFromDB(row),
      item: row.takeoff_itens ? mapItemFromDB(row.takeoff_itens) : undefined,
    }));
  },

  async updateVinculo(id: string, dto: { peso?: number; atividadeId?: string }): Promise<TakeoffVinculo | null> {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.peso !== undefined) updates.peso = dto.peso;
    if (dto.atividadeId !== undefined) updates.atividade_id = dto.atividadeId;

    const { data, error } = await supabase
      .from('takeoff_vinculos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar vínculo:', error);
      return null;
    }
    return mapVinculoFromDB(data);
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

  async updateDocumento(id: string, projetoId: string, updates: Partial<{
    disciplinaId: string | null;
    codigo: string;
    titulo: string | null;
    revisao: string;
    tipo: string;
    status: string;
    dataEmissao: Date;
    observacoes: string | null;
  }>): Promise<TakeoffDocumento | null> {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.disciplinaId !== undefined) dbUpdates.disciplina_id = updates.disciplinaId;
    if (updates.codigo !== undefined) dbUpdates.codigo = updates.codigo;
    if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
    if (updates.revisao !== undefined) dbUpdates.revisao = updates.revisao;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dataEmissao !== undefined) dbUpdates.data_emissao = updates.dataEmissao.toISOString();
    if (updates.observacoes !== undefined) dbUpdates.observacoes = updates.observacoes;

    const { data, error } = await supabase
      .from('takeoff_documentos')
      .update(dbUpdates)
      .eq('id', id)
      .eq('projeto_id', projetoId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar documento:', error);
      return null;
    }
    return mapDocumentoFromDB(data);
  },

  async deleteDocumento(id: string, projetoId: string): Promise<boolean> {
    const { error } = await supabase
      .from('takeoff_documentos')
      .delete()
      .eq('id', id)
      .eq('projeto_id', projetoId);

    if (error) {
      console.error('Erro ao excluir documento:', error);
      return false;
    }
    return true;
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
