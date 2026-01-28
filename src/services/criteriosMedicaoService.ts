import { supabase } from './supabase';
import type {
  CriterioMedicao,
  CriterioMedicaoEtapa,
  ItemCriterioMedicao,
  AvancoEtapa,
  AvancoAprovacao,
  UsuarioPermissaoCriterio,
  CreateCriterioDTO,
  UpdateCriterioDTO,
  CreateEtapaDTO,
  UpdateEtapaDTO,
  CreateAvancoDTO,
  CriterioImportRow,
  CriterioImportResult,
  CriterioMedicaoFilter,
  EAPItemNode,
} from '../types/criteriosMedicao.types';
import { parseDateOnly } from '../utils/dateHelpers';

const mapCriterioFromDB = (row: Record<string, unknown>): CriterioMedicao => ({
  id: row.id as string,
  empresaId: row.empresa_id as string,
  projetoId: row.projeto_id as string | undefined,
  codigo: row.codigo as string,
  descritivo: row.descritivo as string,
  descritivoConcreto: row.descritivo_concreto as string | undefined,
  status: row.status as CriterioMedicao['status'],
  observacoes: row.observacoes as string | undefined,
  criadoPor: row.criado_por as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapEtapaFromDB = (row: Record<string, unknown>): CriterioMedicaoEtapa => ({
  id: row.id as string,
  criterioId: row.criterio_id as string,
  numeroEtapa: row.numero_etapa as number,
  descritivo: row.descritivo as string,
  descritivoDocumento: row.descritivo_documento as string | undefined,
  percentual: Number(row.percentual) || 0,
  ordem: row.ordem as number,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapItemCriterioFromDB = (row: Record<string, unknown>): ItemCriterioMedicao => ({
  id: row.id as string,
  itemId: row.item_id as string,
  criterioId: row.criterio_id as string,
  createdAt: new Date(row.created_at as string),
});

const mapAvancoFromDB = (row: Record<string, unknown>): AvancoEtapa => ({
  id: row.id as string,
  itemCriterioId: row.item_criterio_id as string,
  etapaId: row.etapa_id as string,
  empresaId: row.empresa_id as string,
  periodoInicio: parseDateOnly(row.periodo_inicio as string) ?? new Date(),
  periodoFim: parseDateOnly(row.periodo_fim as string) ?? new Date(),
  qtdAvancada: Number(row.qtd_avancada) || 0,
  qtdAcumulada: Number(row.qtd_acumulada) || 0,
  percentualAvancado: Number(row.percentual_avancado) || 0,
  percentualAcumulado: Number(row.percentual_acumulado) || 0,
  status: row.status as AvancoEtapa['status'],
  registradoPor: row.registrado_por as string | undefined,
  registradoEm: new Date(row.registrado_em as string),
  observacoes: row.observacoes as string | undefined,
  createdAt: new Date(row.created_at as string),
  updatedAt: new Date(row.updated_at as string),
});

const mapAprovacaoFromDB = (row: Record<string, unknown>): AvancoAprovacao => ({
  id: row.id as string,
  avancoId: row.avanco_id as string,
  empresaId: row.empresa_id as string,
  nivel: row.nivel as AvancoAprovacao['nivel'],
  aprovadorId: row.aprovador_id as string | undefined,
  aprovadorNome: row.aprovador_nome as string | undefined,
  acao: row.acao as AvancoAprovacao['acao'],
  comentario: row.comentario as string | undefined,
  dataAcao: new Date(row.data_acao as string),
  createdAt: new Date(row.created_at as string),
});

const mapPermissaoFromDB = (row: Record<string, unknown>): UsuarioPermissaoCriterio => ({
  id: row.id as string,
  criterioId: row.criterio_id as string,
  usuarioId: row.usuario_id as string,
  empresaId: row.empresa_id as string,
  podeEditar: row.pode_editar as boolean,
  podeAprovar: row.pode_aprovar as boolean,
  createdAt: new Date(row.created_at as string),
});

export const criteriosMedicaoService = {
  async getCriterios(filter: CriterioMedicaoFilter): Promise<CriterioMedicao[]> {
    let query = supabase
      .from('criterios_medicao')
      .select('*')
      .order('codigo', { ascending: true });

    if (filter.empresaId) {
      query = query.eq('empresa_id', filter.empresaId);
    }
    if (filter.projetoId) {
      query = query.eq('projeto_id', filter.projetoId);
    }
    if (filter.status) {
      query = query.eq('status', filter.status);
    }
    if (filter.codigo) {
      query = query.ilike('codigo', `%${filter.codigo}%`);
    }
    if (filter.busca) {
      query = query.or(`codigo.ilike.%${filter.busca}%,descritivo.ilike.%${filter.busca}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapCriterioFromDB);
  },

  async getCriterioById(id: string): Promise<CriterioMedicao | null> {
    const { data, error } = await supabase
      .from('criterios_medicao')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapCriterioFromDB(data);
  },

  async getCriterioComEtapas(id: string): Promise<CriterioMedicao | null> {
    const criterio = await this.getCriterioById(id);
    if (!criterio) return null;

    const etapas = await this.getEtapasByCriterio(id);
    criterio.etapas = etapas;
    criterio.totalPercentual = etapas.reduce((sum, e) => sum + e.percentual, 0);

    return criterio;
  },

  async getCriterioByCodigo(empresaId: string, codigo: string): Promise<CriterioMedicao | null> {
    const { data, error } = await supabase
      .from('criterios_medicao')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('codigo', codigo)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapCriterioFromDB(data);
  },

  async createCriterio(dto: CreateCriterioDTO): Promise<CriterioMedicao> {
    const { data, error } = await supabase
      .from('criterios_medicao')
      .insert({
        empresa_id: dto.empresaId,
        projeto_id: dto.projetoId || null,
        codigo: dto.codigo,
        descritivo: dto.descritivo,
        descritivo_concreto: dto.descritivoConcreto || null,
        observacoes: dto.observacoes || null,
        criado_por: dto.criadoPor || null,
        status: 'ativo',
      })
      .select()
      .single();

    if (error) throw error;

    const criterio = mapCriterioFromDB(data);

    if (dto.etapas && dto.etapas.length > 0) {
      await this.createEtapasEmLote(criterio.id, dto.etapas);
    }

    return criterio;
  },

  async updateCriterio(id: string, dto: UpdateCriterioDTO): Promise<CriterioMedicao> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.codigo !== undefined) updates.codigo = dto.codigo;
    if (dto.descritivo !== undefined) updates.descritivo = dto.descritivo;
    if (dto.descritivoConcreto !== undefined) updates.descritivo_concreto = dto.descritivoConcreto;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.observacoes !== undefined) updates.observacoes = dto.observacoes;

    const { data, error } = await supabase
      .from('criterios_medicao')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapCriterioFromDB(data);
  },

  async deleteCriterio(id: string): Promise<void> {
    const { error } = await supabase
      .from('criterios_medicao')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getEtapasByCriterio(criterioId: string): Promise<CriterioMedicaoEtapa[]> {
    const { data, error } = await supabase
      .from('criterios_medicao_etapas')
      .select('*')
      .eq('criterio_id', criterioId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapEtapaFromDB);
  },

  async createEtapa(criterioId: string, dto: CreateEtapaDTO): Promise<CriterioMedicaoEtapa> {
    const { data, error } = await supabase
      .from('criterios_medicao_etapas')
      .insert({
        criterio_id: criterioId,
        numero_etapa: dto.numeroEtapa,
        descritivo: dto.descritivo,
        descritivo_documento: dto.descritivoDocumento || null,
        percentual: dto.percentual,
        ordem: dto.ordem || dto.numeroEtapa,
      })
      .select()
      .single();

    if (error) throw error;
    return mapEtapaFromDB(data);
  },

  async createEtapasEmLote(criterioId: string, etapas: CreateEtapaDTO[]): Promise<CriterioMedicaoEtapa[]> {
    const inserts = etapas.map((dto, index) => ({
      criterio_id: criterioId,
      numero_etapa: dto.numeroEtapa,
      descritivo: dto.descritivo,
      descritivo_documento: dto.descritivoDocumento || null,
      percentual: dto.percentual,
      ordem: dto.ordem || index + 1,
    }));

    const { data, error } = await supabase
      .from('criterios_medicao_etapas')
      .insert(inserts)
      .select();

    if (error) throw error;
    return (data || []).map(mapEtapaFromDB);
  },

  async updateEtapa(id: string, dto: UpdateEtapaDTO): Promise<CriterioMedicaoEtapa> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.descritivo !== undefined) updates.descritivo = dto.descritivo;
    if (dto.descritivoDocumento !== undefined) updates.descritivo_documento = dto.descritivoDocumento;
    if (dto.percentual !== undefined) updates.percentual = dto.percentual;
    if (dto.ordem !== undefined) updates.ordem = dto.ordem;

    const { data, error } = await supabase
      .from('criterios_medicao_etapas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapEtapaFromDB(data);
  },

  async deleteEtapa(id: string): Promise<void> {
    const { error } = await supabase
      .from('criterios_medicao_etapas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async vincularItemCriterio(itemId: string, criterioId: string): Promise<ItemCriterioMedicao> {
    const { data, error } = await supabase
      .from('item_criterio_medicao')
      .upsert({
        item_id: itemId,
        criterio_id: criterioId,
      }, { onConflict: 'item_id' })
      .select()
      .single();

    if (error) throw error;
    return mapItemCriterioFromDB(data);
  },

  async desvincularItemCriterio(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('item_criterio_medicao')
      .delete()
      .eq('item_id', itemId);

    if (error) throw error;
  },

  async getItemCriterio(itemId: string): Promise<ItemCriterioMedicao | null> {
    const { data, error } = await supabase
      .from('item_criterio_medicao')
      .select(`
        *,
        criterio:criterios_medicao(
          id, codigo, descritivo, status
        )
      `)
      .eq('item_id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const result = mapItemCriterioFromDB(data);
    if (data.criterio) {
      result.criterio = mapCriterioFromDB(data.criterio as Record<string, unknown>);
    }
    return result;
  },

  async getItensByCriterio(criterioId: string): Promise<ItemCriterioMedicao[]> {
    const { data, error } = await supabase
      .from('item_criterio_medicao')
      .select(`
        *,
        item:takeoff_itens(
          id, descricao, qtd_prevista, unidade
        )
      `)
      .eq('criterio_id', criterioId);

    if (error) throw error;

    return (data || []).map(row => {
      const result = mapItemCriterioFromDB(row);
      if (row.item) {
        result.item = {
          id: (row.item as { id: string }).id,
          descricao: (row.item as { descricao: string }).descricao,
          qtdPrevista: Number((row.item as { qtd_prevista: number }).qtd_prevista) || 0,
          unidade: (row.item as { unidade: string }).unidade,
        };
      }
      return result;
    });
  },

  async registrarAvanco(dto: CreateAvancoDTO): Promise<AvancoEtapa> {
    const ultimoAvanco = await this.getUltimoAvancoEtapa(dto.itemCriterioId, dto.etapaId);
    const percentualAcumuladoAnterior = ultimoAvanco?.percentualAcumulado || 0;
    const qtdAcumuladaAnterior = ultimoAvanco?.qtdAcumulada || 0;

    const itemCriterio = await supabase
      .from('item_criterio_medicao')
      .select('item:takeoff_itens(qtd_prevista), empresa_id')
      .eq('id', dto.itemCriterioId)
      .single();

    const etapa = await supabase
      .from('criterios_medicao_etapas')
      .select('percentual')
      .eq('id', dto.etapaId)
      .single();

    const itemData = itemCriterio.data?.item as unknown;
    let qtdPrevista = 0;
    if (Array.isArray(itemData) && itemData.length > 0) {
      qtdPrevista = Number((itemData[0] as { qtd_prevista?: number })?.qtd_prevista) || 0;
    } else if (itemData && typeof itemData === 'object') {
      qtdPrevista = Number((itemData as { qtd_prevista?: number })?.qtd_prevista) || 0;
    }
    const percentualEtapa = Number(etapa.data?.percentual) || 0;
    const qtdPonderada = qtdPrevista * (percentualEtapa / 100);
    const empresaId = dto.empresaId || (itemCriterio.data as Record<string, unknown>)?.empresa_id as string;

    let qtdAvancada: number;
    let percentualAvancado: number;
    let qtdAcumulada: number;
    let percentualAcumulado: number;

    if (dto.percentualAvancado !== undefined) {
      percentualAvancado = dto.percentualAvancado;
      qtdAvancada = qtdPonderada > 0 ? (dto.percentualAvancado / 100) * qtdPonderada : 0;
      percentualAcumulado = percentualAcumuladoAnterior + dto.percentualAvancado;
      qtdAcumulada = qtdAcumuladaAnterior + qtdAvancada;
    } else {
      qtdAvancada = dto.qtdAvancada || 0;
      qtdAcumulada = qtdAcumuladaAnterior + qtdAvancada;
      percentualAvancado = qtdPonderada > 0 ? (qtdAvancada / qtdPonderada) * 100 : 0;
      percentualAcumulado = qtdPonderada > 0 ? (qtdAcumulada / qtdPonderada) * 100 : 0;
    }

    const { data, error } = await supabase
      .from('avancos_etapas')
      .insert({
        item_criterio_id: dto.itemCriterioId,
        etapa_id: dto.etapaId,
        empresa_id: empresaId,
        periodo_inicio: dto.periodoInicio.toISOString().split('T')[0],
        periodo_fim: dto.periodoFim.toISOString().split('T')[0],
        periodo_tipo: dto.periodoTipo || 'dia',
        qtd_avancada: qtdAvancada,
        qtd_acumulada: qtdAcumulada,
        percentual_avancado: percentualAvancado,
        percentual_acumulado: Math.min(percentualAcumulado, 100),
        status: 'pendente',
        registrado_por: dto.registradoPor || null,
        registrado_por_nome: dto.registradoPorNome || null,
        registrado_em: new Date().toISOString(),
        observacoes: dto.observacoes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapAvancoFromDB(data);
  },

  async getUltimoAvancoEtapa(itemCriterioId: string, etapaId: string): Promise<AvancoEtapa | null> {
    const { data, error } = await supabase
      .from('avancos_etapas')
      .select('*')
      .eq('item_criterio_id', itemCriterioId)
      .eq('etapa_id', etapaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapAvancoFromDB(data);
  },

  async getAvancosEtapa(itemCriterioId: string, etapaId: string): Promise<AvancoEtapa[]> {
    const { data, error } = await supabase
      .from('avancos_etapas')
      .select('*')
      .eq('item_criterio_id', itemCriterioId)
      .eq('etapa_id', etapaId)
      .order('periodo_inicio', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAvancoFromDB);
  },

  async getAvancosPorPeriodo(itemCriterioId: string, periodoInicio: Date, periodoFim: Date): Promise<AvancoEtapa[]> {
    const { data, error } = await supabase
      .from('avancos_etapas')
      .select(`
        *,
        etapa:criterios_medicao_etapas(id, numero_etapa, descritivo, percentual)
      `)
      .eq('item_criterio_id', itemCriterioId)
      .gte('periodo_inicio', periodoInicio.toISOString().split('T')[0])
      .lte('periodo_fim', periodoFim.toISOString().split('T')[0])
      .order('periodo_inicio', { ascending: true });

    if (error) throw error;

    return (data || []).map(row => {
      const avanco = mapAvancoFromDB(row);
      if (row.etapa) {
        avanco.etapa = mapEtapaFromDB(row.etapa as Record<string, unknown>);
      }
      return avanco;
    });
  },

  async aprovarAvanco(avancoId: string, aprovadorId: string, aprovadorNome: string, nivel: AvancoAprovacao['nivel'], comentario?: string): Promise<AvancoAprovacao> {
    const { data, error } = await supabase
      .from('avancos_aprovacoes')
      .insert({
        avanco_id: avancoId,
        empresa_id: (await supabase.from('avancos_etapas').select('empresa_id').eq('id', avancoId).single()).data?.empresa_id,
        nivel,
        aprovador_id: aprovadorId,
        aprovador_nome: aprovadorNome,
        acao: 'aprovado',
        comentario: comentario || null,
        data_acao: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('avancos_etapas')
      .update({ status: 'aprovado', updated_at: new Date().toISOString() })
      .eq('id', avancoId);

    return mapAprovacaoFromDB(data);
  },

  async rejeitarAvanco(avancoId: string, aprovadorId: string, aprovadorNome: string, nivel: AvancoAprovacao['nivel'], comentario: string): Promise<AvancoAprovacao> {
    const { data, error } = await supabase
      .from('avancos_aprovacoes')
      .insert({
        avanco_id: avancoId,
        empresa_id: (await supabase.from('avancos_etapas').select('empresa_id').eq('id', avancoId).single()).data?.empresa_id,
        nivel,
        aprovador_id: aprovadorId,
        aprovador_nome: aprovadorNome,
        acao: 'rejeitado',
        comentario,
        data_acao: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('avancos_etapas')
      .update({ status: 'rejeitado', updated_at: new Date().toISOString() })
      .eq('id', avancoId);

    return mapAprovacaoFromDB(data);
  },

  async importarCriterios(empresaId: string, rows: CriterioImportRow[], projetoId?: string): Promise<CriterioImportResult> {
    const result: CriterioImportResult = {
      success: true,
      criteriosImportados: 0,
      etapasImportadas: 0,
      erros: [],
      criterios: [],
    };

    const criteriosMap = new Map<string, { dto: CreateCriterioDTO; etapas: CreateEtapaDTO[] }>();

    for (const row of rows) {
      if (!row.criterioMedicao || !row.descritivo || row.percentual === undefined) {
        result.erros.push(`Linha inválida: ${JSON.stringify(row)}`);
        continue;
      }

      const codigo = row.criterioMedicao.trim().toUpperCase();

      if (!criteriosMap.has(codigo)) {
        criteriosMap.set(codigo, {
          dto: {
            empresaId,
            projetoId,
            codigo,
            descritivo: row.descritivoConcreto || codigo,
            descritivoConcreto: row.descritivoConcreto,
          },
          etapas: [],
        });
      }

      const criterioData = criteriosMap.get(codigo)!;
      criterioData.etapas.push({
        numeroEtapa: row.etapa,
        descritivo: row.descritivo,
        descritivoDocumento: row.descritivoDocumento,
        percentual: row.percentual,
        ordem: row.etapa,
      });
    }

    for (const [codigo, { dto, etapas }] of criteriosMap) {
      try {
        const existente = await this.getCriterioByCodigo(empresaId, codigo);

        if (existente) {
          await supabase
            .from('criterios_medicao_etapas')
            .delete()
            .eq('criterio_id', existente.id);

          await this.createEtapasEmLote(existente.id, etapas);
          result.criterios.push(existente);
        } else {
          const criterio = await this.createCriterio({ ...dto, etapas });
          result.criterios.push(criterio);
          result.criteriosImportados++;
        }

        result.etapasImportadas += etapas.length;
      } catch (error) {
        result.erros.push(`Erro ao importar critério ${codigo}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        result.success = false;
      }
    }

    return result;
  },

  async getEAPMapa(mapaId: string): Promise<EAPItemNode[]> {
    const { data: itens, error } = await supabase
      .from('takeoff_itens')
      .select(`
        id, descricao, unidade, qtd_prevista,
        item_criterio:item_criterio_medicao(
          id, criterio_id,
          criterio:criterios_medicao(
            id, codigo, descritivo,
            etapas:criterios_medicao_etapas(
              id, numero_etapa, descritivo, percentual, ordem
            )
          )
        )
      `)
      .eq('mapa_id', mapaId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (itens || []).map(item => {
      const itemCriterioData = item.item_criterio;
      const itemCriterio = Array.isArray(itemCriterioData) 
        ? itemCriterioData[0] 
        : itemCriterioData;

      const criterioData = itemCriterio?.criterio;
      const criterio = Array.isArray(criterioData) ? criterioData[0] : criterioData;
      const etapas = (criterio?.etapas || []) as Array<{ id: string; numero_etapa: number; descritivo: string; percentual: number }>;

      const children: EAPItemNode[] = etapas.map((etapa) => ({
        id: etapa.id,
        tipo: 'etapa' as const,
        descricao: `Etapa ${etapa.numero_etapa}: ${etapa.descritivo}`,
        percentualPeso: Number(etapa.percentual) || 0,
        qtdPonderada: (Number(item.qtd_prevista) || 0) * (Number(etapa.percentual) / 100),
        unidade: item.unidade as string,
      }));

      return {
        id: item.id as string,
        tipo: 'item' as const,
        codigo: criterio?.codigo as string | undefined,
        descricao: item.descricao as string,
        unidade: item.unidade as string,
        qtdPrevista: Number(item.qtd_prevista) || 0,
        children: children.length > 0 ? children : undefined,
      };
    });
  },

  async calcularAvancoItem(itemId: string): Promise<{ percentualTotal: number; qtdExecutada: number }> {
    const itemCriterio = await this.getItemCriterio(itemId);
    if (!itemCriterio) {
      return { percentualTotal: 0, qtdExecutada: 0 };
    }

    const etapas = await this.getEtapasByCriterio(itemCriterio.criterioId);

    let percentualTotal = 0;

    for (const etapa of etapas) {
      const ultimoAvanco = await this.getUltimoAvancoEtapa(itemCriterio.id, etapa.id);
      if (ultimoAvanco && ultimoAvanco.status === 'aprovado') {
        const contribuicao = (ultimoAvanco.percentualAcumulado / 100) * etapa.percentual;
        percentualTotal += contribuicao;
      }
    }

    const { data: item } = await supabase
      .from('takeoff_itens')
      .select('qtd_prevista')
      .eq('id', itemId)
      .single();

    const qtdPrevista = Number(item?.qtd_prevista) || 0;
    const qtdExecutada = qtdPrevista * (percentualTotal / 100);

    return { percentualTotal: Math.min(percentualTotal, 100), qtdExecutada };
  },

  async adicionarPermissao(criterioId: string, usuarioId: string, empresaId: string, podeEditar: boolean, podeAprovar: boolean): Promise<UsuarioPermissaoCriterio> {
    const { data, error } = await supabase
      .from('usuarios_permissao_criterio')
      .upsert({
        criterio_id: criterioId,
        usuario_id: usuarioId,
        empresa_id: empresaId,
        pode_editar: podeEditar,
        pode_aprovar: podeAprovar,
      }, { onConflict: 'criterio_id,usuario_id' })
      .select()
      .single();

    if (error) throw error;
    return mapPermissaoFromDB(data);
  },

  async removerPermissao(criterioId: string, usuarioId: string): Promise<void> {
    const { error } = await supabase
      .from('usuarios_permissao_criterio')
      .delete()
      .eq('criterio_id', criterioId)
      .eq('usuario_id', usuarioId);

    if (error) throw error;
  },

  async getPermissoesCriterio(criterioId: string): Promise<UsuarioPermissaoCriterio[]> {
    const { data, error } = await supabase
      .from('usuarios_permissao_criterio')
      .select(`
        *,
        usuario:usuarios(id, nome, email)
      `)
      .eq('criterio_id', criterioId);

    if (error) throw error;

    return (data || []).map(row => {
      const permissao = mapPermissaoFromDB(row);
      if (row.usuario) {
        permissao.usuario = row.usuario as { id: string; nome: string; email: string };
      }
      return permissao;
    });
  },

  async calcularAvancoWBS(wbsId: string): Promise<{ percentualTotal: number; qtdTotal: number; qtdExecutada: number }> {
    const { data: vinculos, error } = await supabase
      .from('takeoff_vinculos')
      .select(`
        peso,
        item:takeoff_itens(
          id,
          qtd_prevista
        )
      `)
      .eq('wbs_id', wbsId);

    if (error || !vinculos || vinculos.length === 0) {
      return { percentualTotal: 0, qtdTotal: 0, qtdExecutada: 0 };
    }

    let somaPercentualPonderado = 0;
    let somaPesos = 0;
    let qtdTotal = 0;
    let qtdExecutada = 0;

    for (const vinculo of vinculos) {
      const itemData = vinculo.item as unknown as { id: string; qtd_prevista: number } | null;
      if (!itemData) continue;

      const peso = vinculo.peso || 100;
      somaPesos += peso;

      const avancoItem = await this.calcularAvancoItem(itemData.id);
      somaPercentualPonderado += (avancoItem.percentualTotal * peso) / 100;

      const qtdPrevista = itemData.qtd_prevista || 0;
      qtdTotal += qtdPrevista * (peso / 100);
      qtdExecutada += avancoItem.qtdExecutada * (peso / 100);
    }

    const percentualTotal = somaPesos > 0 ? (somaPercentualPonderado / somaPesos) * 100 : 0;

    return {
      percentualTotal: Math.min(percentualTotal, 100),
      qtdTotal,
      qtdExecutada,
    };
  },

  async getEAPCompleta(projetoId: string): Promise<EAPItemNode[]> {
    const { data: wbsNodes, error } = await supabase
      .from('wbs_nodes')
      .select(`
        id,
        codigo,
        nome,
        parent_id
      `)
      .eq('projeto_id', projetoId)
      .order('ordem', { ascending: true });

    if (error || !wbsNodes) {
      return [];
    }

    const nodesMap = new Map<string, EAPItemNode>();
    const rootNodes: EAPItemNode[] = [];

    for (const wbs of wbsNodes) {
      const avanco = await this.calcularAvancoWBS(wbs.id);

      const node: EAPItemNode = {
        id: wbs.id,
        tipo: 'item',
        codigo: wbs.codigo,
        descricao: wbs.nome,
        percentualAvanco: avanco.percentualTotal,
        qtdPrevista: avanco.qtdTotal,
        qtdPonderada: avanco.qtdExecutada,
        children: [],
      };

      nodesMap.set(wbs.id, node);
    }

    for (const wbs of wbsNodes) {
      const node = nodesMap.get(wbs.id)!;

      if (wbs.parent_id && nodesMap.has(wbs.parent_id)) {
        nodesMap.get(wbs.parent_id)!.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    const calcularAvancoHierarquico = (node: EAPItemNode): { qtdTotal: number; qtdExecutada: number } => {
      if (!node.children || node.children.length === 0) {
        return {
          qtdTotal: node.qtdPrevista || 0,
          qtdExecutada: node.qtdPonderada || 0,
        };
      }

      let somaQtdTotal = 0;
      let somaQtdExecutada = 0;
      for (const child of node.children) {
        const childResult = calcularAvancoHierarquico(child);
        somaQtdTotal += childResult.qtdTotal;
        somaQtdExecutada += childResult.qtdExecutada;
      }

      node.qtdPrevista = somaQtdTotal;
      node.qtdPonderada = somaQtdExecutada;
      node.percentualAvanco = somaQtdTotal > 0 ? (somaQtdExecutada / somaQtdTotal) * 100 : 0;

      return { qtdTotal: somaQtdTotal, qtdExecutada: somaQtdExecutada };
    };

    for (const root of rootNodes) {
      calcularAvancoHierarquico(root);
    }

    return rootNodes;
  },
};

export default criteriosMedicaoService;
