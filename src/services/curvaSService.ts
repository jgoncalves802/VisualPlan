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

  async createBaseline(dto: BaselineDTO): Promise<Baseline> {
    const { data, error } = await supabase
      .from('baselines')
      .insert(dto)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
    
    if (error) throw error;
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
}

export const curvaSService = new CurvaSService();
