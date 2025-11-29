import { useState, useEffect, useCallback } from 'react';
import baselineService, { Baseline, BaselineTask, BaselineVariance, BaselineType } from '../services/baselineService';
import type { AtividadeMock, DependenciaAtividade } from '../types/cronograma';

export interface UseBaselinesReturn {
  baselines: Baseline[];
  currentBaseline: Baseline | null;
  baselineTasks: BaselineTask[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createBaseline: (
    nome: string,
    atividades: AtividadeMock[],
    dependencias: DependenciaAtividade[],
    options?: {
      descricao?: string;
      tipo?: BaselineType;
      createdBy?: string;
      setAsCurrentBaseline?: boolean;
    }
  ) => Promise<Baseline | null>;
  setActiveBaseline: (baselineId: string) => Promise<void>;
  deleteBaseline: (id: string) => Promise<void>;
  calculateVariance: (baselineTasks: BaselineTask[], currentAtividades: AtividadeMock[]) => BaselineVariance[];
  approveBaseline: (baselineId: string, userId: string) => Promise<Baseline | null>;
  getSummaryStats: (variances: BaselineVariance[]) => {
    atividadesAdiantadas: number;
    atividadesAtrasadas: number;
    atividadesNoPrazo: number;
    mediaVariacaoDias: number;
    totalVariacaoCusto: number;
    mediaVariacaoProgresso: number;
  };
}

export function useBaselines(empresaId: string, projetoId: string): UseBaselinesReturn {
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [currentBaseline, setCurrentBaseline] = useState<Baseline | null>(null);
  const [baselineTasks, setBaselineTasks] = useState<BaselineTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBaselines = useCallback(async () => {
    if (!empresaId || !projetoId) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const baselinesData = await baselineService.getBaselines(empresaId, projetoId);
      setBaselines(baselinesData);

      const activeBaseline = baselinesData.find((b: Baseline) => b.isAtual);
      if (activeBaseline) {
        setCurrentBaseline(activeBaseline);
        const tasks = await baselineService.getBaselineTasks(activeBaseline.id);
        setBaselineTasks(tasks);
      } else {
        setCurrentBaseline(null);
        setBaselineTasks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar baselines');
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, projetoId]);

  useEffect(() => {
    loadBaselines();
  }, [loadBaselines]);

  const createBaseline = useCallback(async (
    nome: string,
    atividades: AtividadeMock[],
    dependencias: DependenciaAtividade[],
    options?: {
      descricao?: string;
      tipo?: BaselineType;
      createdBy?: string;
      setAsCurrentBaseline?: boolean;
    }
  ): Promise<Baseline | null> => {
    try {
      const baseline = await baselineService.createBaseline(
        empresaId,
        projetoId,
        nome,
        atividades,
        dependencias,
        options
      );
      
      if (baseline) {
        await loadBaselines();
      }
      
      return baseline;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar baseline');
      return null;
    }
  }, [empresaId, projetoId, loadBaselines]);

  const setActiveBaseline = useCallback(async (baselineId: string): Promise<void> => {
    try {
      await baselineService.setCurrentBaseline(baselineId);
      await loadBaselines();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao ativar baseline');
    }
  }, [loadBaselines]);

  const deleteBaseline = useCallback(async (id: string): Promise<void> => {
    try {
      await baselineService.deleteBaseline(id);
      setBaselines(prev => prev.filter(b => b.id !== id));
      if (currentBaseline?.id === id) {
        setCurrentBaseline(null);
        setBaselineTasks([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar baseline');
    }
  }, [currentBaseline?.id]);

  const calculateVariance = useCallback((
    tasks: BaselineTask[],
    currentAtividades: AtividadeMock[]
  ): BaselineVariance[] => {
    return baselineService.calculateVariance(tasks, currentAtividades);
  }, []);

  const approveBaseline = useCallback(async (
    baselineId: string,
    userId: string
  ): Promise<Baseline | null> => {
    try {
      const approved = await baselineService.approveBaseline(baselineId, userId);
      if (approved) {
        await loadBaselines();
      }
      return approved;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao aprovar baseline');
      return null;
    }
  }, [loadBaselines]);

  const getSummaryStats = useCallback((variances: BaselineVariance[]) => {
    return baselineService.getSummaryStats(variances);
  }, []);

  return {
    baselines,
    currentBaseline,
    baselineTasks,
    isLoading,
    error,
    refresh: loadBaselines,
    createBaseline,
    setActiveBaseline,
    deleteBaseline,
    calculateVariance,
    approveBaseline,
    getSummaryStats,
  };
}
