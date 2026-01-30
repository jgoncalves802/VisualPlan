import { supabase } from './supabase';
import type {
  TakeoffItemEtapa,
  CreateItemEtapaDTO,
  CriterioMedicaoEtapa,
} from '../types/criteriosMedicao.types';

const mapItemEtapaFromDB = (row: Record<string, unknown>): TakeoffItemEtapa => ({
  id: row.id as string,
  itemId: row.item_id as string,
  etapaId: row.etapa_id as string,
  concluido: row.concluido as boolean,
  dataConclusao: row.data_conclusao ? new Date(row.data_conclusao as string) : undefined,
  concluidoPor: row.concluido_por as string | undefined,
  observacoes: row.observacoes as string | undefined,
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

export const takeoffItemEtapasService = {
  async getEtapasByItemId(itemId: string): Promise<TakeoffItemEtapa[]> {
    const { data, error } = await supabase
      .from('takeoff_item_etapas')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar etapas do item:', error);
      return [];
    }

    return (data || []).map(mapItemEtapaFromDB);
  },

  async getEtapasByItemIds(itemIds: string[]): Promise<Map<string, TakeoffItemEtapa[]>> {
    if (itemIds.length === 0) return new Map();

    const { data, error } = await supabase
      .from('takeoff_item_etapas')
      .select('*')
      .in('item_id', itemIds);

    if (error) {
      console.error('Erro ao buscar etapas dos itens:', error);
      return new Map();
    }

    const result = new Map<string, TakeoffItemEtapa[]>();
    for (const row of data || []) {
      const mapped = mapItemEtapaFromDB(row);
      const existing = result.get(mapped.itemId) || [];
      existing.push(mapped);
      result.set(mapped.itemId, existing);
    }

    return result;
  },

  async getEtapasComCriterioByItemId(itemId: string): Promise<(TakeoffItemEtapa & { etapa: CriterioMedicaoEtapa })[]> {
    const { data: vinculo } = await supabase
      .from('item_criterio_medicao')
      .select('criterio_id')
      .eq('item_id', itemId)
      .single();

    if (!vinculo) return [];

    const { data: etapasCriterio } = await supabase
      .from('criterios_medicao_etapas')
      .select('*')
      .eq('criterio_id', vinculo.criterio_id)
      .order('ordem', { ascending: true });

    if (!etapasCriterio || etapasCriterio.length === 0) return [];

    const { data: etapasItem } = await supabase
      .from('takeoff_item_etapas')
      .select('*')
      .eq('item_id', itemId);

    const etapasItemMap = new Map<string, TakeoffItemEtapa>();
    for (const row of etapasItem || []) {
      const mapped = mapItemEtapaFromDB(row);
      etapasItemMap.set(mapped.etapaId, mapped);
    }

    return etapasCriterio.map((etapaRow) => {
      const etapa = mapEtapaFromDB(etapaRow);
      const itemEtapa = etapasItemMap.get(etapa.id);

      if (itemEtapa) {
        return { ...itemEtapa, etapa };
      }

      return {
        id: '',
        itemId,
        etapaId: etapa.id,
        concluido: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        etapa,
      };
    });
  },

  async createOrUpdateEtapa(dto: CreateItemEtapaDTO): Promise<TakeoffItemEtapa | null> {
    const { data: existing } = await supabase
      .from('takeoff_item_etapas')
      .select('id')
      .eq('item_id', dto.itemId)
      .eq('etapa_id', dto.etapaId)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from('takeoff_item_etapas')
        .update({
          concluido: dto.concluido ?? false,
          data_conclusao: dto.concluido ? new Date().toISOString() : null,
          observacoes: dto.observacoes,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar etapa do item:', error);
        return null;
      }
      return mapItemEtapaFromDB(data);
    }

    const { data, error } = await supabase
      .from('takeoff_item_etapas')
      .insert({
        item_id: dto.itemId,
        etapa_id: dto.etapaId,
        concluido: dto.concluido ?? false,
        data_conclusao: dto.concluido ? new Date().toISOString() : null,
        observacoes: dto.observacoes,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar etapa do item:', error);
      return null;
    }
    return mapItemEtapaFromDB(data);
  },

  async toggleEtapa(itemId: string, etapaId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('takeoff_item_etapas')
      .select('*')
      .eq('item_id', itemId)
      .eq('etapa_id', etapaId)
      .single();

    if (existing) {
      const newConcluido = !existing.concluido;
      const { error } = await supabase
        .from('takeoff_item_etapas')
        .update({
          concluido: newConcluido,
          data_conclusao: newConcluido ? new Date().toISOString() : null,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Erro ao toggle etapa:', error);
        return false;
      }
      return true;
    }

    const { error } = await supabase
      .from('takeoff_item_etapas')
      .insert({
        item_id: itemId,
        etapa_id: etapaId,
        concluido: true,
        data_conclusao: new Date().toISOString(),
      });

    if (error) {
      console.error('Erro ao criar etapa toggle:', error);
      return false;
    }
    return true;
  },

  async marcarEtapasEmLote(
    itemIds: string[],
    etapaNumero: number,
    concluido: boolean
  ): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const itemId of itemIds) {
      const { data: vinculo } = await supabase
        .from('item_criterio_medicao')
        .select('criterio_id')
        .eq('item_id', itemId)
        .single();

      if (!vinculo) {
        errors++;
        continue;
      }

      const { data: etapa } = await supabase
        .from('criterios_medicao_etapas')
        .select('id')
        .eq('criterio_id', vinculo.criterio_id)
        .eq('numero_etapa', etapaNumero)
        .single();

      if (!etapa) {
        errors++;
        continue;
      }

      const result = await this.createOrUpdateEtapa({
        itemId,
        etapaId: etapa.id,
        concluido,
      });

      if (result) {
        success++;
      } else {
        errors++;
      }
    }

    return { success, errors };
  },

  async marcarEtapasPorIdEmLote(
    updates: Array<{ itemId: string; etapaId: string; concluido: boolean }>
  ): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    for (const update of updates) {
      const result = await this.createOrUpdateEtapa({
        itemId: update.itemId,
        etapaId: update.etapaId,
        concluido: update.concluido,
      });

      if (result) {
        success++;
      } else {
        errors++;
      }
    }

    return { success, errors };
  },

  async calcularPercentualItem(itemId: string): Promise<number> {
    const etapas = await this.getEtapasComCriterioByItemId(itemId);
    if (etapas.length === 0) return 0;

    const totalPercentual = etapas.reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);
    const percentualConcluido = etapas
      .filter((e) => e.concluido)
      .reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);

    if (totalPercentual === 0) return 0;
    return Math.round((percentualConcluido / totalPercentual) * 100);
  },

  async atualizarPercentualItem(_itemId: string): Promise<boolean> {
    return true;
  },

  async initializeEtapasForItem(itemId: string, criterioId: string): Promise<number> {
    const { data: etapasCriterio, error: etapasError } = await supabase
      .from('criterios_medicao_etapas')
      .select('id')
      .eq('criterio_id', criterioId)
      .order('ordem', { ascending: true });

    if (etapasError || !etapasCriterio || etapasCriterio.length === 0) {
      console.error('Erro ao buscar etapas do critério:', etapasError);
      return 0;
    }

    const etapasToInsert = etapasCriterio.map((etapa) => ({
      item_id: itemId,
      etapa_id: etapa.id,
      concluido: false,
    }));

    const { error: insertError } = await supabase
      .from('takeoff_item_etapas')
      .upsert(etapasToInsert, { onConflict: 'item_id,etapa_id' });

    if (insertError) {
      console.error('Erro ao inicializar etapas do item:', insertError);
      return 0;
    }

    return etapasCriterio.length;
  },

  async initializeEtapasForItemsBatch(
    items: Array<{ itemId: string; criterioId: string }>
  ): Promise<number> {
    if (items.length === 0) return 0;

    const criterioIds = [...new Set(items.map((i) => i.criterioId))];

    const { data: allEtapas, error: etapasError } = await supabase
      .from('criterios_medicao_etapas')
      .select('id, criterio_id')
      .in('criterio_id', criterioIds);

    if (etapasError || !allEtapas) {
      console.error('Erro ao buscar etapas dos critérios:', etapasError);
      return 0;
    }

    const etapasPorCriterio = new Map<string, string[]>();
    for (const etapa of allEtapas) {
      const existing = etapasPorCriterio.get(etapa.criterio_id) || [];
      existing.push(etapa.id);
      etapasPorCriterio.set(etapa.criterio_id, existing);
    }

    const etapasToInsert: Array<{ item_id: string; etapa_id: string; concluido: boolean }> = [];

    for (const item of items) {
      const etapaIds = etapasPorCriterio.get(item.criterioId) || [];
      for (const etapaId of etapaIds) {
        etapasToInsert.push({
          item_id: item.itemId,
          etapa_id: etapaId,
          concluido: false,
        });
      }
    }

    if (etapasToInsert.length === 0) return 0;

    const batchSize = 500;
    let totalInserted = 0;

    for (let i = 0; i < etapasToInsert.length; i += batchSize) {
      const batch = etapasToInsert.slice(i, i + batchSize);
      const { error: insertError } = await supabase
        .from('takeoff_item_etapas')
        .upsert(batch, { onConflict: 'item_id,etapa_id' });

      if (insertError) {
        console.error('Erro ao inserir etapas em lote:', insertError);
      } else {
        totalInserted += batch.length;
      }
    }

    console.log(`[takeoffItemEtapasService] Inicializadas ${totalInserted} etapas para ${items.length} itens`);
    return totalInserted;
  },

  async getEtapasDisponiveisPorMapa(mapaId: string): Promise<Map<number, string>> {
    const { data: itens } = await supabase
      .from('takeoff_itens')
      .select('id')
      .eq('mapa_id', mapaId);

    if (!itens || itens.length === 0) return new Map();

    const itemIds = itens.map((i) => i.id);

    const { data: vinculos } = await supabase
      .from('item_criterio_medicao')
      .select('criterio_id')
      .in('item_id', itemIds);

    if (!vinculos || vinculos.length === 0) return new Map();

    const criterioIds = [...new Set(vinculos.map((v) => v.criterio_id))];

    const { data: etapas } = await supabase
      .from('criterios_medicao_etapas')
      .select('numero_etapa, descritivo')
      .in('criterio_id', criterioIds)
      .order('numero_etapa', { ascending: true });

    const result = new Map<number, string>();
    for (const etapa of etapas || []) {
      if (!result.has(etapa.numero_etapa)) {
        result.set(etapa.numero_etapa, etapa.descritivo);
      }
    }

    return result;
  },
};
