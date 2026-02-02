import { supabase } from './supabase';
import { resourceService, Resource } from './resourceService';
import type { TakeoffItem } from '../types/takeoff.types';

export interface TakeoffResourceLink {
  id: string;
  takeoffItemId: string;
  resourceId: string;
  activeCode: string;
  quantidadeTakeoff: number;
  quantidadeAlocada: number;
  unidade: string;
  custoUnitario: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface CreateResourceFromTakeoffOptions {
  takeoffItem: TakeoffItem;
  empresaId: string;
  resourceTypeId?: string;
  materialTypeId?: string;
  custoPorUnidade?: number;
  capacidadeDiaria?: number;
}

export interface SyncTakeoffToResourcesResult {
  created: number;
  updated: number;
  linked: number;
  errors: string[];
}

function generateActiveCode(item: TakeoffItem): string {
  if (item.activeCode) return item.activeCode;
  
  const parts = [
    item.area?.slice(0, 8) || 'GEN',
    item.tag || `TKF-${item.id.slice(0, 8)}`,
  ];
  return parts.join('-').toUpperCase();
}

export const takeoffResourceService = {
  async createResourceFromTakeoffItem(options: CreateResourceFromTakeoffOptions): Promise<Resource | null> {
    const { takeoffItem, empresaId, resourceTypeId, custoPorUnidade, capacidadeDiaria } = options;

    try {
      const descricao = takeoffItem.descricao || '';
      const unidade = takeoffItem.unidade || 'un';
      const peso = takeoffItem.pesoUnitario || 0;
      const quantidade = takeoffItem.qtdTakeoff || takeoffItem.qtdPrevista || 0;
      
      const resource = await resourceService.createResource({
        empresaId,
        resourceTypeId,
        codigo: takeoffItem.tag || `TKF-${takeoffItem.id.slice(0, 8)}`,
        nome: descricao,
        capacidadeDiaria: capacidadeDiaria || quantidade || 1,
        unidadeCapacidade: unidade,
        custoPorHora: 0,
        custoPorUso: custoPorUnidade || takeoffItem.custoUnitario || 0,
        custoHoraExtra: 0,
        custoFixo: 0,
        habilidades: [],
        metadata: {
          origem: 'takeoff',
          takeoffItemId: takeoffItem.id,
          activeCode: generateActiveCode(takeoffItem),
          quantidade,
          unidade,
          peso,
          tipoRecurso: takeoffItem.tipoRecurso || 'material',
        },
        ativo: true,
      });

      if (resource) {
        await this.createTakeoffResourceLink({
          takeoffItemId: takeoffItem.id,
          resourceId: resource.id,
          activeCode: generateActiveCode(takeoffItem),
          quantidadeTakeoff: quantidade,
          quantidadeAlocada: 0,
          unidade,
          custoUnitario: custoPorUnidade || takeoffItem.custoUnitario || 0,
        });
      }

      return resource;
    } catch (error) {
      console.error('[takeoffResourceService] Error creating resource from takeoff item:', error);
      return null;
    }
  },

  async createTakeoffResourceLink(data: Omit<TakeoffResourceLink, 'id' | 'createdAt' | 'updatedAt'>): Promise<TakeoffResourceLink | null> {
    const { data: link, error } = await supabase
      .from('takeoff_resource_links')
      .insert({
        takeoff_item_id: data.takeoffItemId,
        resource_id: data.resourceId,
        active_code: data.activeCode,
        quantidade_takeoff: data.quantidadeTakeoff,
        quantidade_alocada: data.quantidadeAlocada,
        unidade: data.unidade,
        custo_unitario: data.custoUnitario,
        created_by: data.createdBy,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '42P01') {
        console.warn('[takeoffResourceService] Table takeoff_resource_links does not exist yet');
        return null;
      }
      console.error('[takeoffResourceService] Error creating link:', error);
      return null;
    }

    return this.mapLinkFromDB(link);
  },

  async getTakeoffResourceLinks(takeoffItemId: string): Promise<TakeoffResourceLink[]> {
    const { data, error } = await supabase
      .from('takeoff_resource_links')
      .select('*')
      .eq('takeoff_item_id', takeoffItemId);

    if (error) {
      if (error.code === '42P01') return [];
      console.error('[takeoffResourceService] Error fetching links:', error);
      return [];
    }

    return (data || []).map(this.mapLinkFromDB);
  },

  async getResourcesByActiveCode(activeCode: string, empresaId: string): Promise<Resource[]> {
    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        resource_types (*)
      `)
      .eq('empresa_id', empresaId)
      .contains('metadata', { activeCode });

    if (error) {
      console.error('[takeoffResourceService] Error fetching resources by activeCode:', error);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      empresaId: r.empresa_id,
      resourceTypeId: r.resource_type_id,
      codigo: r.codigo,
      nome: r.nome,
      email: r.email,
      telefone: r.telefone,
      cargo: r.cargo,
      departamento: r.departamento,
      capacidadeDiaria: parseFloat(r.capacidade_diaria) || 0,
      unidadeCapacidade: r.unidade_capacidade,
      disponivelDe: r.disponivel_de,
      disponivelAte: r.disponivel_ate,
      custoPorHora: parseFloat(r.custo_por_hora) || 0,
      custoPorUso: parseFloat(r.custo_por_uso) || 0,
      custoHoraExtra: parseFloat(r.custo_hora_extra) || 0,
      custoFixo: parseFloat(r.custo_fixo) || 0,
      habilidades: r.habilidades || [],
      calendarioId: r.calendario_id,
      avatarUrl: r.avatar_url,
      metadata: r.metadata || {},
      ativo: r.ativo,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async syncTakeoffItemsToResources(
    takeoffItems: TakeoffItem[],
    empresaId: string,
    materialResourceTypeId?: string
  ): Promise<SyncTakeoffToResourcesResult> {
    const result: SyncTakeoffToResourcesResult = {
      created: 0,
      updated: 0,
      linked: 0,
      errors: [],
    };

    for (const item of takeoffItems) {
      if (item.tipoRecurso !== 'material') continue;

      try {
        const activeCode = generateActiveCode(item);
        
        const existingResources = await this.getResourcesByActiveCode(activeCode, empresaId);
        
        if (existingResources.length > 0) {
          const resource = existingResources[0];
          await resourceService.updateResource(resource.id, {
            nome: item.descricao,
            metadata: {
              ...resource.metadata,
              quantidade: item.qtdTakeoff || item.qtdPrevista,
              updatedFromTakeoff: new Date().toISOString(),
            },
          });
          result.updated++;
        } else {
          const resource = await this.createResourceFromTakeoffItem({
            takeoffItem: item,
            empresaId,
            resourceTypeId: materialResourceTypeId,
          });
          
          if (resource) {
            result.created++;
            result.linked++;
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        result.errors.push(`Item ${item.tag || item.id}: ${errorMsg}`);
      }
    }

    return result;
  },

  async updateAllocationFromTakeoff(
    takeoffItemId: string,
    quantidadeAlocada: number
  ): Promise<boolean> {
    const links = await this.getTakeoffResourceLinks(takeoffItemId);
    
    if (links.length === 0) return false;

    for (const link of links) {
      const { error } = await supabase
        .from('takeoff_resource_links')
        .update({
          quantidade_alocada: quantidadeAlocada,
          updated_at: new Date().toISOString(),
        })
        .eq('id', link.id);

      if (error) {
        console.error('[takeoffResourceService] Error updating allocation:', error);
        return false;
      }
    }

    return true;
  },

  async getMaterialResourceType(empresaId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('resource_types')
      .select('id')
      .eq('empresa_id', empresaId)
      .eq('categoria', 'MATERIAL')
      .eq('ativo', true)
      .limit(1)
      .single();

    if (error || !data) {
      const { data: created, error: createError } = await supabase
        .from('resource_types')
        .insert({
          empresa_id: empresaId,
          codigo: 'MAT',
          nome: 'Material',
          categoria: 'MATERIAL',
          descricao: 'Materiais de construção provenientes do Take-off',
          unidade_padrao: 'un',
          custo_padrao: 0,
          cor: '#10B981',
          ativo: true,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('[takeoffResourceService] Error creating material type:', createError);
        return null;
      }

      return created?.id || null;
    }

    return data.id;
  },

  mapLinkFromDB(data: any): TakeoffResourceLink {
    return {
      id: data.id,
      takeoffItemId: data.takeoff_item_id,
      resourceId: data.resource_id,
      activeCode: data.active_code,
      quantidadeTakeoff: parseFloat(data.quantidade_takeoff) || 0,
      quantidadeAlocada: parseFloat(data.quantidade_alocada) || 0,
      unidade: data.unidade,
      custoUnitario: parseFloat(data.custo_unitario) || 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      createdBy: data.created_by,
    };
  },
};
