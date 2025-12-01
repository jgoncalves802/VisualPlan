import { useState, useEffect, useCallback } from 'react';
import { baselineService, type Baseline, type BaselineTask, type BaselineVariance } from '../services/baselineService';
import { activityCodeService, type ActivityCodeType, type ActivityTaskCode } from '../services/activityCodeService';
import { epsService, type EpsNode } from '../services/epsService';
import { obsService, type ObsNode } from '../services/obsService';
import type { AtividadeMock } from '../types/cronograma';

export interface P6ProjectContext {
  epsId?: string;
  epsName?: string;
  epsCode?: string;
  projectManager?: string;
  obsNodeId?: string;
  obsNodeName?: string;
}

export interface P6ActivityData {
  baselineTask?: BaselineTask;
  variance?: BaselineVariance;
  activityCodes?: ActivityTaskCode[];
}

export interface P6Data {
  currentBaseline: Baseline | null;
  baselines: Baseline[];
  baselineTasks: Map<string, BaselineTask>;
  variances: Map<string, BaselineVariance>;
  activityCodeTypes: ActivityCodeType[];
  activityCodes: Map<string, ActivityTaskCode[]>;
  epsTree: EpsNode[];
  obsTree: ObsNode[];
  projectContext: P6ProjectContext;
  loading: boolean;
  error: Error | null;
  getActivityP6Data: (atividadeId: string) => P6ActivityData;
  refreshBaselines: () => Promise<void>;
  refreshActivityCodes: () => Promise<void>;
}

export function useP6Data(
  empresaId: string | undefined,
  projetoId: string | undefined,
  atividades: AtividadeMock[]
): P6Data {
  const [currentBaseline, setCurrentBaseline] = useState<Baseline | null>(null);
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [baselineTasks, setBaselineTasks] = useState<Map<string, BaselineTask>>(new Map());
  const [variances, setVariances] = useState<Map<string, BaselineVariance>>(new Map());
  const [activityCodeTypes, setActivityCodeTypes] = useState<ActivityCodeType[]>([]);
  const [activityCodes, setActivityCodes] = useState<Map<string, ActivityTaskCode[]>>(new Map());
  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [obsTree, setObsTree] = useState<ObsNode[]>([]);
  const [projectContext, setProjectContext] = useState<P6ProjectContext>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshBaselines = useCallback(async () => {
    if (!empresaId || !projetoId) return;

    try {
      const [allBaselines, current] = await Promise.all([
        baselineService.getBaselines(empresaId, projetoId),
        baselineService.getCurrentBaseline(empresaId, projetoId),
      ]);

      setBaselines(allBaselines);
      setCurrentBaseline(current);

      if (current) {
        const tasks = await baselineService.getBaselineTasks(current.id);
        const tasksMap = new Map<string, BaselineTask>();
        tasks.forEach(task => {
          tasksMap.set(task.atividadeId, task);
        });
        setBaselineTasks(tasksMap);

        const calculatedVariances = baselineService.calculateVariance(tasks, atividades);
        const varianceMap = new Map<string, BaselineVariance>();
        calculatedVariances.forEach(v => {
          varianceMap.set(v.atividadeId, v);
        });
        setVariances(varianceMap);
      }
    } catch (err) {
      console.error('Error loading baselines:', err);
      setError(err as Error);
    }
  }, [empresaId, projetoId, atividades]);

  const refreshActivityCodes = useCallback(async () => {
    if (!empresaId) return;

    try {
      const types = await activityCodeService.getTypes(empresaId, { 
        projetoId: projetoId || undefined,
        includeGlobal: true 
      });
      setActivityCodeTypes(types);

      if (projetoId) {
        const codesMap = await activityCodeService.getTaskCodesForProject(projetoId);
        setActivityCodes(codesMap);
      }
    } catch (err) {
      console.error('Error loading activity codes:', err);
    }
  }, [empresaId, projetoId]);

  const refreshEpsObs = useCallback(async () => {
    if (!empresaId) return;

    try {
      const [eps, obs] = await Promise.all([
        epsService.getTree(empresaId),
        obsService.getTree(empresaId),
      ]);

      setEpsTree(eps);
      setObsTree(obs);

      if (projetoId && eps.length > 0) {
        const findEpsForProject = (nodes: EpsNode[], targetId: string): EpsNode | null => {
          for (const node of nodes) {
            if (node.id === targetId) return node;
            if (node.children) {
              const found = findEpsForProject(node.children, targetId);
              if (found) return found;
            }
          }
          return null;
        };

        const projectEps = findEpsForProject(eps, projetoId);
        if (projectEps) {
          setProjectContext(prev => ({
            ...prev,
            epsId: projectEps.id,
            epsName: projectEps.nome,
            epsCode: projectEps.codigo,
            projectManager: projectEps.responsibleManager?.nome,
            obsNodeId: projectEps.responsibleManagerId || undefined,
          }));
        }
      }
    } catch (err) {
      console.error('Error loading EPS/OBS:', err);
    }
  }, [empresaId, projetoId]);

  useEffect(() => {
    const loadData = async () => {
      if (!empresaId) return;

      setLoading(true);
      setError(null);

      try {
        await Promise.all([
          refreshBaselines(),
          refreshActivityCodes(),
          refreshEpsObs(),
        ]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [empresaId, projetoId, refreshBaselines, refreshActivityCodes, refreshEpsObs]);

  const getActivityP6Data = useCallback((atividadeId: string): P6ActivityData => {
    return {
      baselineTask: baselineTasks.get(atividadeId),
      variance: variances.get(atividadeId),
      activityCodes: activityCodes.get(atividadeId) || [],
    };
  }, [baselineTasks, variances, activityCodes]);

  return {
    currentBaseline,
    baselines,
    baselineTasks,
    variances,
    activityCodeTypes,
    activityCodes,
    epsTree,
    obsTree,
    projectContext,
    loading,
    error,
    getActivityP6Data,
    refreshBaselines,
    refreshActivityCodes,
  };
}

export default useP6Data;
