import { supabase } from './supabase';
import type {
  TakeoffItemEtapa,
  CreateItemEtapaDTO,
  CriterioMedicaoEtapa,
} from '../types/criteriosMedicao.types';

import type { WorkflowStatus, WorkflowAction } from '../types/criteriosMedicao.types';

const mapItemEtapaFromDB = (row: Record<string, unknown>): TakeoffItemEtapa => ({
  id: row.id as string,
  itemId: row.item_id as string,
  etapaId: row.etapa_id as string,
  concluido: row.concluido as boolean,
  dataConclusao: row.data_conclusao ? new Date(row.data_conclusao as string) : undefined,
  concluidoPor: row.concluido_por as string | undefined,
  observacoes: row.observacoes as string | undefined,
  dataInicio: row.data_inicio ? new Date(row.data_inicio as string) : undefined,
  dataTermino: row.data_termino ? new Date(row.data_termino as string) : undefined,
  dataAvanco: row.data_avanco ? new Date(row.data_avanco as string) : undefined,
  dataAprovacao: row.data_aprovacao ? new Date(row.data_aprovacao as string) : undefined,
  usuarioInicioId: row.usuario_inicio_id as string | undefined,
  usuarioTerminoId: row.usuario_termino_id as string | undefined,
  usuarioAvancoId: row.usuario_avanco_id as string | undefined,
  usuarioAprovacaoId: row.usuario_aprovacao_id as string | undefined,
  workflowStatus: (row.workflow_status as WorkflowStatus) || 'pendente',
  proponenteId: row.proponente_id as string | undefined,
  dataProposta: row.data_proposta ? new Date(row.data_proposta as string) : undefined,
  validadorId: row.validador_id as string | undefined,
  dataValidacao: row.data_validacao ? new Date(row.data_validacao as string) : undefined,
  fiscalizadorId: row.fiscalizador_id as string | undefined,
  dataFiscalizacao: row.data_fiscalizacao ? new Date(row.data_fiscalizacao as string) : undefined,
  motivoRejeicao: row.motivo_rejeicao as string | undefined,
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
        workflowStatus: 'pendente' as const,
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

  async executeWorkflowAction(
    etapaId: string,
    action: 'programar' | 'aceitar_programacao' | 'iniciar_producao' | 'terminar_producao' | 'registrar_avanco' | 'aprovar_fiscalizacao' | 'rejeitar',
    usuarioId: string,
    observacao?: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();
    
    let updates: Record<string, unknown> = { updated_at: now };
    
    switch (action) {
      case 'programar':
        updates = {
          ...updates,
          workflow_status: 'programado',
          proponente_id: usuarioId,
          data_proposta: now,
        };
        break;

      case 'aceitar_programacao':
        updates = {
          ...updates,
          workflow_status: 'programado',
          validador_id: usuarioId,
          data_validacao: now,
        };
        break;
        
      case 'iniciar_producao':
        updates = {
          ...updates,
          data_inicio: now,
          usuario_inicio_id: usuarioId,
          workflow_status: 'em_producao',
        };
        break;
        
      case 'terminar_producao':
        updates = {
          ...updates,
          data_termino: now,
          usuario_termino_id: usuarioId,
          workflow_status: 'producao_concluida',
        };
        break;
        
      case 'registrar_avanco':
        updates = {
          ...updates,
          data_avanco: now,
          usuario_avanco_id: usuarioId,
          validador_id: usuarioId,
          data_validacao: now,
          workflow_status: 'avancado',
        };
        break;
        
      case 'aprovar_fiscalizacao':
        updates = {
          ...updates,
          data_aprovacao: now,
          usuario_aprovacao_id: usuarioId,
          fiscalizador_id: usuarioId,
          data_fiscalizacao: now,
          workflow_status: 'aprovado',
          concluido: true,
          data_conclusao: now,
          concluido_por: usuarioId,
        };
        break;
        
      case 'rejeitar':
        updates = {
          ...updates,
          workflow_status: 'rejeitado',
          motivo_rejeicao: observacao,
        };
        break;
    }
    
    if (observacao && action !== 'rejeitar') {
      updates.observacoes = observacao;
    }
    
    const { error } = await supabase
      .from('takeoff_item_etapas')
      .update(updates)
      .eq('id', etapaId);
    
    if (error) {
      console.error('Erro ao executar ação de workflow:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  },

  async getWorkflowHistory(etapaId: string): Promise<{
    dataProposta?: Date;
    proponente?: string;
    dataValidacao?: Date;
    validador?: string;
    dataInicio?: Date;
    usuarioInicio?: string;
    dataTermino?: Date;
    usuarioTermino?: string;
    dataAvanco?: Date;
    usuarioAvanco?: string;
    dataAprovacao?: Date;
    usuarioAprovacao?: string;
    fiscalizador?: string;
    dataFiscalizacao?: Date;
    status: WorkflowStatus;
    motivoRejeicao?: string;
  } | null> {
    const { data, error } = await supabase
      .from('takeoff_item_etapas')
      .select(`
        proponente_id, data_proposta,
        validador_id, data_validacao,
        fiscalizador_id, data_fiscalizacao,
        data_inicio, usuario_inicio_id,
        data_termino, usuario_termino_id,
        data_avanco, usuario_avanco_id,
        data_aprovacao, usuario_aprovacao_id,
        workflow_status, motivo_rejeicao
      `)
      .eq('id', etapaId)
      .single();
    
    if (error || !data) return null;
    
    const userIds = [
      data.proponente_id,
      data.validador_id,
      data.fiscalizador_id,
      data.usuario_inicio_id,
      data.usuario_termino_id,
      data.usuario_avanco_id,
      data.usuario_aprovacao_id,
    ].filter(Boolean);
    
    let usersMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('usuarios')
        .select('id, nome')
        .in('id', userIds);
      
      usersMap = (users || []).reduce((acc, u) => {
        acc[u.id] = u.nome;
        return acc;
      }, {} as Record<string, string>);
    }
    
    return {
      dataProposta: data.data_proposta ? new Date(data.data_proposta) : undefined,
      proponente: usersMap[data.proponente_id] || undefined,
      dataValidacao: data.data_validacao ? new Date(data.data_validacao) : undefined,
      validador: usersMap[data.validador_id] || undefined,
      dataInicio: data.data_inicio ? new Date(data.data_inicio) : undefined,
      usuarioInicio: usersMap[data.usuario_inicio_id] || undefined,
      dataTermino: data.data_termino ? new Date(data.data_termino) : undefined,
      usuarioTermino: usersMap[data.usuario_termino_id] || undefined,
      dataAvanco: data.data_avanco ? new Date(data.data_avanco) : undefined,
      usuarioAvanco: usersMap[data.usuario_avanco_id] || undefined,
      dataAprovacao: data.data_aprovacao ? new Date(data.data_aprovacao) : undefined,
      usuarioAprovacao: usersMap[data.usuario_aprovacao_id] || undefined,
      fiscalizador: usersMap[data.fiscalizador_id] || undefined,
      dataFiscalizacao: data.data_fiscalizacao ? new Date(data.data_fiscalizacao) : undefined,
      status: (data.workflow_status as WorkflowStatus) || 'pendente',
      motivoRejeicao: data.motivo_rejeicao || undefined,
    };
  },

  getValidWorkflowActions(status: WorkflowStatus): WorkflowAction[] {
    const validTransitions: Record<WorkflowStatus, WorkflowAction[]> = {
      pendente: ['programar'],
      programado: ['aceitar_programacao', 'iniciar_producao', 'rejeitar'],
      em_producao: ['terminar_producao', 'rejeitar'],
      producao_concluida: ['registrar_avanco', 'rejeitar'],
      avancado: ['aprovar_fiscalizacao', 'rejeitar'],
      aprovado: [],
      rejeitado: ['programar'],
    };
    return validTransitions[status] || [];
  },

  isValidTransition(currentStatus: WorkflowStatus, action: WorkflowAction): boolean {
    const validActions = this.getValidWorkflowActions(currentStatus);
    return validActions.includes(action);
  },
};
