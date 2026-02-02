import { supabase } from './supabase';
import { 
  Baseline, 
  BaselineDTO, 
  CurvaSItem, 
  CurvaSDTO, 
  SnapshotEVM, 
  SnapshotEVMDTO,
  IndicadorLPS,
  IndicadorQualidade,
  CurvaSChartData,
  TipoCurvaS
} from '../types/curvaS.types';

class CurvaSService {
  // =====================================================
  // BASELINES
  // =====================================================
  
  async getBaselines(projetoId: string): Promise<Baseline[]> {
    const { data, error } = await supabase
      .from('baselines')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('numero', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('Tabela baselines não existe ainda');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getBaselineAtiva(projetoId: string): Promise<Baseline | null> {
    const { data, error } = await supabase
      .from('baselines')
      .select('*')
      .eq('projeto_id', projetoId)
      .eq('ativa', true)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      if (error.code === '42P01') return null;
      throw error;
    }
    return data;
  }

  async createBaseline(dto: BaselineDTO): Promise<Baseline | null> {
    try {
      const { data, error } = await supabase
        .from('baselines')
        .insert(dto)
        .select()
        .single();
      
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.warn('Tabela baselines não existe ainda');
          return null;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Erro ao criar baseline:', err);
      throw err;
    }
  }

  async updateBaseline(id: string, updates: Partial<BaselineDTO>): Promise<Baseline> {
    const { data, error } = await supabase
      .from('baselines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async ativarBaseline(id: string): Promise<Baseline> {
    return this.updateBaseline(id, { ativa: true });
  }

  async deleteBaseline(id: string): Promise<void> {
    const { error } = await supabase
      .from('baselines')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  async getNextBaselineNumber(projetoId: string): Promise<number> {
    const baselines = await this.getBaselines(projetoId);
    if (baselines.length === 0) return 1;
    return Math.max(...baselines.map(b => b.numero)) + 1;
  }

  // =====================================================
  // CURVA S
  // =====================================================

  async getCurvaS(projetoId: string, tipoCurva?: TipoCurvaS): Promise<CurvaSItem[]> {
    let query = supabase
      .from('curva_s')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('periodo_ordem', { ascending: true });
    
    if (tipoCurva) {
      query = query.eq('tipo_curva', tipoCurva);
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('Tabela curva_s não existe ainda');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getCurvaSByBaseline(projetoId: string, baselineId: string): Promise<CurvaSItem[]> {
    const { data, error } = await supabase
      .from('curva_s')
      .select('*')
      .eq('projeto_id', projetoId)
      .eq('baseline_id', baselineId)
      .order('periodo_ordem', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01' || error.code === 'PGRST205') {
        console.warn('Tabela curva_s não existe ou está vazia');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getCurvaSChartData(projetoId: string, includeBaselines: number[] = []): Promise<CurvaSChartData[]> {
    const curvas = await this.getCurvaS(projetoId);
    
    const periodoMap = new Map<string, CurvaSChartData>();
    
    for (const item of curvas) {
      const key = item.periodo_label || item.data_referencia;
      
      if (!periodoMap.has(key)) {
        periodoMap.set(key, {
          periodo: key,
          ordem: item.periodo_ordem,
        });
      }
      
      const chartItem = periodoMap.get(key)!;
      
      if (item.tipo_curva === 'planejado') {
        chartItem.planejado = item.percentual_acumulado;
      } else if (item.tipo_curva === 'previsto') {
        chartItem.previsto = item.percentual_acumulado;
      } else if (item.tipo_curva === 'realizado') {
        chartItem.realizado = item.percentual_acumulado;
      } else if (item.tipo_curva.startsWith('baseline_')) {
        const baselineNum = parseInt(item.tipo_curva.replace('baseline_', ''));
        if (includeBaselines.length === 0 || includeBaselines.includes(baselineNum)) {
          (chartItem as any)[item.tipo_curva] = item.percentual_acumulado;
        }
      }
    }
    
    return Array.from(periodoMap.values()).sort((a, b) => a.ordem - b.ordem);
  }

  async createCurvaSItem(dto: CurvaSDTO): Promise<CurvaSItem> {
    const { data, error } = await supabase
      .from('curva_s')
      .insert(dto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createCurvaSBatch(items: CurvaSDTO[]): Promise<CurvaSItem[]> {
    if (items.length === 0) return [];
    
    const { data, error } = await supabase
      .from('curva_s')
      .insert(items)
      .select();
    
    if (error) throw error;
    return data || [];
  }

  async updateCurvaSItem(id: string, updates: Partial<CurvaSDTO>): Promise<CurvaSItem> {
    const { data, error } = await supabase
      .from('curva_s')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteCurvaSByTipo(projetoId: string, tipoCurva: TipoCurvaS): Promise<void> {
    const { error } = await supabase
      .from('curva_s')
      .delete()
      .eq('projeto_id', projetoId)
      .eq('tipo_curva', tipoCurva);
    
    if (error) throw error;
  }

  async deleteCurvaSByBaseline(baselineId: string): Promise<void> {
    const { error } = await supabase
      .from('curva_s')
      .delete()
      .eq('baseline_id', baselineId);
    
    if (error) throw error;
  }

  // =====================================================
  // SNAPSHOTS EVM
  // =====================================================

  async getSnapshotsEVM(projetoId: string): Promise<SnapshotEVM[]> {
    const { data, error } = await supabase
      .from('snapshots_evm')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_status', { ascending: true });
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.warn('Tabela snapshots_evm não existe ainda');
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getLatestSnapshotEVM(projetoId: string): Promise<SnapshotEVM | null> {
    const { data, error } = await supabase
      .from('snapshots_evm')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_status', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      if (error.code === '42P01') return null;
      throw error;
    }
    return data;
  }

  async createSnapshotEVM(dto: SnapshotEVMDTO): Promise<SnapshotEVM> {
    const calculatedDto = {
      ...dto,
      cv: (dto.ev_acumulado || 0) - (dto.ac_acumulado || 0),
      sv: (dto.ev_acumulado || 0) - (dto.pv_acumulado || 0),
      cpi: dto.ac_acumulado && dto.ac_acumulado > 0 
        ? (dto.ev_acumulado || 0) / dto.ac_acumulado 
        : 1,
      spi: dto.pv_acumulado && dto.pv_acumulado > 0 
        ? (dto.ev_acumulado || 0) / dto.pv_acumulado 
        : 1,
    };
    
    const { data, error } = await supabase
      .from('snapshots_evm')
      .insert(calculatedDto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateSnapshotEVM(id: string, updates: Partial<SnapshotEVMDTO>): Promise<SnapshotEVM> {
    const { data, error } = await supabase
      .from('snapshots_evm')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteSnapshotEVM(id: string): Promise<void> {
    const { error } = await supabase
      .from('snapshots_evm')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // =====================================================
  // INDICADORES LPS
  // =====================================================

  async getIndicadoresLPS(projetoId: string): Promise<IndicadorLPS[]> {
    const { data, error } = await supabase
      .from('indicadores_lps')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_inicio', { ascending: false });
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getLatestIndicadorLPS(projetoId: string): Promise<IndicadorLPS | null> {
    const { data, error } = await supabase
      .from('indicadores_lps')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_inicio', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      if (error.code === '42P01') return null;
      throw error;
    }
    return data;
  }

  // =====================================================
  // INDICADORES QUALIDADE
  // =====================================================

  async getIndicadoresQualidade(projetoId: string): Promise<IndicadorQualidade[]> {
    const { data, error } = await supabase
      .from('indicadores_qualidade')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_referencia', { ascending: false });
    
    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        return [];
      }
      throw error;
    }
    return data || [];
  }

  async getLatestIndicadorQualidade(projetoId: string): Promise<IndicadorQualidade | null> {
    const { data, error } = await supabase
      .from('indicadores_qualidade')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('data_referencia', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      if (error.code === '42P01') return null;
      throw error;
    }
    return data;
  }

  async getTakeoffProgressForCurvaS(projetoId: string): Promise<{
    totalItems: number;
    totalPeso: number;
    pesoExecutado: number;
    percentualGeral: number;
    byStatus: Record<string, { count: number; peso: number }>;
    timeline: Array<{ data: string; percentual: number; pesoAcumulado: number }>;
  }> {
    try {
      const { data: vinculos, error: vinculosError } = await supabase
        .from('takeoff_vinculos')
        .select(`
          id,
          peso,
          takeoff_itens (
            id,
            peso_total,
            qtd_executada,
            qtd_prevista,
            percentual_executado,
            status
          )
        `)
        .eq('projeto_id', projetoId);

      if (vinculosError) {
        console.warn('[CurvaSService] Error fetching takeoff vinculos:', vinculosError);
        return {
          totalItems: 0,
          totalPeso: 0,
          pesoExecutado: 0,
          percentualGeral: 0,
          byStatus: {},
          timeline: [],
        };
      }

      if (!vinculos || vinculos.length === 0) {
        return {
          totalItems: 0,
          totalPeso: 0,
          pesoExecutado: 0,
          percentualGeral: 0,
          byStatus: {},
          timeline: [],
        };
      }

      const validVinculos = vinculos.filter((v: any) => v.takeoff_itens);
      const totalItems = validVinculos.length;
      
      const totalPeso = validVinculos.reduce((sum: number, v: any) => {
        return sum + (v.peso || v.takeoff_itens?.peso_total || 0);
      }, 0);
      
      const pesoExecutado = validVinculos.reduce((sum: number, v: any) => {
        const pesoVinculo = v.peso || v.takeoff_itens?.peso_total || 0;
        const percentual = v.takeoff_itens?.percentual_executado || 0;
        return sum + (pesoVinculo * percentual / 100);
      }, 0);
      
      const percentualGeral = totalPeso > 0 ? (pesoExecutado / totalPeso) * 100 : 0;

      const byStatus: Record<string, { count: number; peso: number }> = {};
      validVinculos.forEach((v: any) => {
        const status = v.takeoff_itens?.status || 'pendente';
        if (!byStatus[status]) {
          byStatus[status] = { count: 0, peso: 0 };
        }
        byStatus[status].count++;
        byStatus[status].peso += v.peso || v.takeoff_itens?.peso_total || 0;
      });

      const itemIds = validVinculos.map((v: any) => v.takeoff_itens?.id).filter(Boolean);
      
      let timeline: Array<{ data: string; percentual: number; pesoAcumulado: number }> = [];
      
      const itemPesoMap = new Map<string, number>();
      validVinculos.forEach((v: any) => {
        if (v.takeoff_itens?.id) {
          itemPesoMap.set(v.takeoff_itens.id, v.peso || v.takeoff_itens.peso_total || 0);
        }
      });
      
      if (itemIds.length > 0) {
        const { data: historyData } = await supabase
          .from('takeoff_item_workflow_history')
          .select('item_id, data_execucao, percentual_fisico')
          .in('item_id', itemIds)
          .in('acao', ['registrar_avanco', 'aprovar_fiscalizacao', 'terminar_producao'])
          .order('data_execucao', { ascending: true });

        const itemCurrentPercent = new Map<string, number>();
        validVinculos.forEach((v: any) => {
          if (v.takeoff_itens?.id) {
            const pct = Math.max(0, Math.min(100, v.takeoff_itens.percentual_executado || 0));
            itemCurrentPercent.set(v.takeoff_itens.id, pct);
          }
        });

        if (historyData && historyData.length > 0) {
          const itemLatestPerDate = new Map<string, Map<string, number>>();
          const itemsWithHistory = new Set<string>();
          
          historyData.forEach((h: any) => {
            const date = new Date(h.data_execucao).toISOString().split('T')[0];
            const itemId = h.item_id;
            const percentual = Math.max(0, Math.min(100, h.percentual_fisico || 0));
            
            itemsWithHistory.add(itemId);
            
            if (!itemLatestPerDate.has(date)) {
              itemLatestPerDate.set(date, new Map());
            }
            itemLatestPerDate.get(date)!.set(itemId, percentual);
          });

          const sortedDates = Array.from(itemLatestPerDate.keys()).sort();
          const itemCumulativePercent = new Map<string, number>();
          
          itemCurrentPercent.forEach((pct, itemId) => {
            if (!itemsWithHistory.has(itemId) && pct > 0) {
              itemCumulativePercent.set(itemId, pct);
            }
          });
          
          timeline = sortedDates.map(date => {
            const itemsOnDate = itemLatestPerDate.get(date)!;
            itemsOnDate.forEach((pct, itemId) => {
              itemCumulativePercent.set(itemId, pct);
            });
            
            let totalPesoExecutado = 0;
            itemCumulativePercent.forEach((pct, itemId) => {
              const peso = itemPesoMap.get(itemId) || 0;
              totalPesoExecutado += peso * pct / 100;
            });
            
            itemCurrentPercent.forEach((pct, itemId) => {
              if (!itemCumulativePercent.has(itemId) && pct > 0) {
                const peso = itemPesoMap.get(itemId) || 0;
                totalPesoExecutado += peso * pct / 100;
              }
            });
            
            return {
              data: date,
              percentual: totalPeso > 0 ? Math.min(100, (totalPesoExecutado / totalPeso) * 100) : 0,
              pesoAcumulado: Math.min(totalPeso, totalPesoExecutado),
            };
          });
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (pesoExecutado > 0) {
            timeline = [{
              data: today,
              percentual: Math.min(100, percentualGeral),
              pesoAcumulado: Math.min(totalPeso, pesoExecutado),
            }];
          }
        }
      }

      return {
        totalItems,
        totalPeso,
        pesoExecutado,
        percentualGeral,
        byStatus,
        timeline,
      };
    } catch (err) {
      console.error('[CurvaSService] Error in getTakeoffProgressForCurvaS:', err);
      return {
        totalItems: 0,
        totalPeso: 0,
        pesoExecutado: 0,
        percentualGeral: 0,
        byStatus: {},
        timeline: [],
      };
    }
  }
}

export const curvaSService = new CurvaSService();
