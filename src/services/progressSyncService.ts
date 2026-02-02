import { supabase } from './supabase';
import { takeoffResourceService } from './takeoffResourceService';

export interface ProgressSyncResult {
  success: boolean;
  takeoffUpdated: number;
  resourcesUpdated: number;
  errors: string[];
}

export interface DailyProgress {
  programacaoAtividadeId: string;
  atividadeId: string;
  data: string;
  percentualRealizado: number;
  concluido: boolean;
}

export const progressSyncService = {
  async syncCheckInToTakeoff(
    checkInData: DailyProgress
  ): Promise<ProgressSyncResult> {
    const result: ProgressSyncResult = {
      success: true,
      takeoffUpdated: 0,
      resourcesUpdated: 0,
      errors: [],
    };

    try {
      const { data: vinculos, error: vinculosError } = await supabase
        .from('takeoff_vinculos')
        .select(`
          id,
          item_id,
          atividade_id,
          peso,
          takeoff_itens (
            id,
            descricao,
            qtd_prevista,
            qtd_takeoff,
            qtd_executada,
            percentual_executado,
            unidade
          )
        `)
        .eq('atividade_id', checkInData.atividadeId);

      if (vinculosError) {
        result.errors.push(`Erro ao buscar vínculos: ${vinculosError.message}`);
        result.success = false;
        return result;
      }

      if (!vinculos || vinculos.length === 0) {
        return result;
      }

      for (const vinculo of vinculos) {
        const item = (vinculo as any).takeoff_itens;
        if (!item) continue;

        const qtdTotal = item.qtd_prevista || item.qtd_takeoff || 0;
        const qtdDiaria = qtdTotal * (checkInData.percentualRealizado / 100) * (vinculo.peso / 100);
        const novaQtdExecutada = Math.min(qtdTotal, (item.qtd_executada || 0) + qtdDiaria);
        const novoPercentual = qtdTotal > 0 ? (novaQtdExecutada / qtdTotal) * 100 : 0;

        const { error: updateError } = await supabase
          .from('takeoff_itens')
          .update({
            qtd_executada: novaQtdExecutada,
            percentual_executado: novoPercentual,
            status: novoPercentual >= 100 ? 'concluido' : novoPercentual > 0 ? 'em_andamento' : 'pendente',
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        if (updateError) {
          result.errors.push(`Item ${item.id}: ${updateError.message}`);
        } else {
          result.takeoffUpdated++;

          await takeoffResourceService.updateAllocationFromTakeoff(item.id, novaQtdExecutada);
          result.resourcesUpdated++;
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  },

  async syncWorkflowProgressToTakeoff(
    _itemEtapaId: string,
    itemId: string,
    percentual: number
  ): Promise<boolean> {
    try {
      const { data: itemData, error: itemError } = await supabase
        .from('takeoff_itens')
        .select('id, qtd_prevista, qtd_takeoff, qtd_executada')
        .eq('id', itemId)
        .single();

      if (itemError || !itemData) return false;

      const qtdTotal = itemData.qtd_prevista || itemData.qtd_takeoff || 0;
      const qtdExecutada = qtdTotal * (percentual / 100);

      const { error: updateError } = await supabase
        .from('takeoff_itens')
        .update({
          qtd_executada: qtdExecutada,
          percentual_executado: percentual,
          status: percentual >= 100 ? 'concluido' : percentual > 0 ? 'em_andamento' : 'pendente',
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (updateError) {
        console.error('[progressSyncService] Error updating takeoff item:', updateError);
        return false;
      }

      await takeoffResourceService.updateAllocationFromTakeoff(itemId, qtdExecutada);

      return true;
    } catch (error) {
      console.error('[progressSyncService] Error syncing workflow progress:', error);
      return false;
    }
  },

  async recalculateTakeoffProgressFromCheckIns(
    atividadeId: string
  ): Promise<ProgressSyncResult> {
    const result: ProgressSyncResult = {
      success: true,
      takeoffUpdated: 0,
      resourcesUpdated: 0,
      errors: [],
    };

    try {
      const { data: programacaoAtividades, error: paError } = await supabase
        .from('programacao_atividades')
        .select('id')
        .eq('atividade_id', atividadeId);

      if (paError || !programacaoAtividades?.length) {
        return result;
      }

      const paIds = programacaoAtividades.map(pa => pa.id);

      const { data: checkIns, error: ciError } = await supabase
        .from('checkin_checkout')
        .select('*')
        .in('programacao_atividade_id', paIds)
        .eq('concluido', true);

      if (ciError) {
        result.errors.push(`Erro ao buscar check-ins: ${ciError.message}`);
        return result;
      }

      const { data: vinculos, error: vError } = await supabase
        .from('takeoff_vinculos')
        .select(`
          id,
          item_id,
          peso,
          takeoff_itens (
            id,
            qtd_prevista,
            qtd_takeoff
          )
        `)
        .eq('atividade_id', atividadeId);

      if (vError || !vinculos?.length) {
        return result;
      }

      const progressoPorItem: Record<string, { total: number; executado: number }> = {};

      for (const vinculo of vinculos) {
        const item = (vinculo as any).takeoff_itens;
        if (!item) continue;

        const qtdTotal = item.qtd_prevista || item.qtd_takeoff || 0;
        if (!progressoPorItem[item.id]) {
          progressoPorItem[item.id] = { total: qtdTotal, executado: 0 };
        }

        const contribuicao = (checkIns?.length || 0) / paIds.length * qtdTotal * (vinculo.peso / 100);
        progressoPorItem[item.id].executado += contribuicao;
      }

      for (const [itemId, progresso] of Object.entries(progressoPorItem)) {
        const percentual = progresso.total > 0 
          ? Math.min(100, (progresso.executado / progresso.total) * 100) 
          : 0;

        const { error: updateError } = await supabase
          .from('takeoff_itens')
          .update({
            qtd_executada: progresso.executado,
            percentual_executado: percentual,
            status: percentual >= 100 ? 'concluido' : percentual > 0 ? 'em_andamento' : 'pendente',
            updated_at: new Date().toISOString(),
          })
          .eq('id', itemId);

        if (updateError) {
          result.errors.push(`Item ${itemId}: ${updateError.message}`);
        } else {
          result.takeoffUpdated++;
        }
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      return result;
    }
  },

  async getProgressSummaryForActivity(atividadeId: string): Promise<{
    totalItems: number;
    completedItems: number;
    averageProgress: number;
    items: Array<{
      id: string;
      descricao: string;
      percentual: number;
      qtdExecutada: number;
      qtdTotal: number;
    }>;
  }> {
    try {
      const { data: vinculos, error } = await supabase
        .from('takeoff_vinculos')
        .select(`
          id,
          item_id,
          takeoff_itens (
            id,
            descricao,
            qtd_prevista,
            qtd_takeoff,
            qtd_executada,
            percentual_executado
          )
        `)
        .eq('atividade_id', atividadeId);

      if (error || !vinculos) {
        return { totalItems: 0, completedItems: 0, averageProgress: 0, items: [] };
      }

      const items = vinculos
        .map(v => {
          const item = (v as any).takeoff_itens;
          if (!item) return null;
          return {
            id: item.id,
            descricao: item.descricao || 'Sem descrição',
            percentual: item.percentual_executado || 0,
            qtdExecutada: item.qtd_executada || 0,
            qtdTotal: item.qtd_prevista || item.qtd_takeoff || 0,
          };
        })
        .filter((i): i is NonNullable<typeof i> => i !== null);

      const totalItems = items.length;
      const completedItems = items.filter(i => i.percentual >= 100).length;
      const averageProgress = totalItems > 0 
        ? items.reduce((sum, i) => sum + i.percentual, 0) / totalItems 
        : 0;

      return { totalItems, completedItems, averageProgress, items };
    } catch (error) {
      console.error('[progressSyncService] Error getting progress summary:', error);
      return { totalItems: 0, completedItems: 0, averageProgress: 0, items: [] };
    }
  },
};
