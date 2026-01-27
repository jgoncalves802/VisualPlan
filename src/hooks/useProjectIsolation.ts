/**
 * Hook for Project Isolation Logging and Debugging
 * Provides structured logging for project switching and data loading
 */

import { useEffect, useRef } from 'react';
import { useProjetoStore } from '../stores/projetoStore';
import { useCronogramaStore } from '../stores/cronogramaStore';

interface ProjectIsolationLog {
  timestamp: Date;
  action: 'PROJECT_SWITCH' | 'DATA_LOAD' | 'DATA_CLEAR' | 'VALIDATION' | 'AUTO_FIX';
  fromProjectId?: string;
  toProjectId?: string;
  details: Record<string, unknown>;
}

const LOG_PREFIX = '[ProjectIsolation]';
const logs: ProjectIsolationLog[] = [];
const MAX_LOGS = 100;

export function logProjectAction(
  action: ProjectIsolationLog['action'],
  details: Record<string, unknown>,
  fromProjectId?: string,
  toProjectId?: string
): void {
  const log: ProjectIsolationLog = {
    timestamp: new Date(),
    action,
    fromProjectId,
    toProjectId,
    details,
  };
  
  logs.push(log);
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  const emoji = {
    PROJECT_SWITCH: '🔄',
    DATA_LOAD: '📥',
    DATA_CLEAR: '🗑️',
    VALIDATION: '✅',
    AUTO_FIX: '🔧',
  }[action];
  
  console.log(`${LOG_PREFIX} ${emoji} ${action}:`, {
    from: fromProjectId || 'none',
    to: toProjectId || 'same',
    ...details,
  });
}

export function getProjectIsolationLogs(): ProjectIsolationLog[] {
  return [...logs];
}

export function clearProjectIsolationLogs(): void {
  logs.length = 0;
}

export function useProjectIsolation() {
  const { projetoSelecionado } = useProjetoStore();
  const { projetoAtualId, atividades, dependencias, isLoading } = useCronogramaStore();
  const previousProjectId = useRef<string | undefined>(undefined);
  const previousCronogramaProjectId = useRef<string | null>(null);

  useEffect(() => {
    const currentProjectId = projetoSelecionado.id;
    
    if (previousProjectId.current !== currentProjectId) {
      logProjectAction(
        'PROJECT_SWITCH',
        {
          projectName: projetoSelecionado.nome,
        },
        previousProjectId.current,
        currentProjectId
      );
      previousProjectId.current = currentProjectId;
    }
  }, [projetoSelecionado]);

  useEffect(() => {
    if (projetoAtualId !== previousCronogramaProjectId.current) {
      if (previousCronogramaProjectId.current !== null) {
        logProjectAction(
          'DATA_CLEAR',
          {
            clearedProject: previousCronogramaProjectId.current,
            newProject: projetoAtualId,
          },
          previousCronogramaProjectId.current || undefined,
          projetoAtualId || undefined
        );
      }
      previousCronogramaProjectId.current = projetoAtualId;
    }
  }, [projetoAtualId]);

  useEffect(() => {
    if (!isLoading && projetoAtualId && atividades.length > 0) {
      const projectActivities = atividades.filter(
        a => !a.id.startsWith('wbs-') && a.projeto_id === projetoAtualId
      );
      const wbsNodes = atividades.filter(a => a.id.startsWith('wbs-'));
      const crossProjectActivities = atividades.filter(
        a => !a.id.startsWith('wbs-') && a.projeto_id && a.projeto_id !== projetoAtualId
      );
      
      logProjectAction(
        'DATA_LOAD',
        {
          totalActivities: atividades.length,
          projectActivities: projectActivities.length,
          wbsNodes: wbsNodes.length,
          crossProjectActivities: crossProjectActivities.length,
          dependenciesCount: dependencias.length,
          hasDataContamination: crossProjectActivities.length > 0,
        },
        undefined,
        projetoAtualId
      );
      
      if (crossProjectActivities.length > 0) {
        console.error(`${LOG_PREFIX} ⚠️ DATA CONTAMINATION DETECTED!`, {
          expectedProject: projetoAtualId,
          contaminatedIds: crossProjectActivities.map(a => ({
            id: a.id,
            wrongProject: a.projeto_id,
          })),
        });
      }
    }
  }, [isLoading, projetoAtualId, atividades.length, dependencias.length]);

  return {
    currentProjectId: projetoSelecionado.id,
    cronogramaProjectId: projetoAtualId,
    isLoading,
    activityCount: atividades.length,
    dependencyCount: dependencias.length,
    logs: getProjectIsolationLogs,
    clearLogs: clearProjectIsolationLogs,
  };
}

export function useProjectIsolationGuard(expectedProjectId: string | undefined) {
  const { projetoAtualId, atividades } = useCronogramaStore();
  
  useEffect(() => {
    if (!expectedProjectId || !projetoAtualId) return;
    
    if (projetoAtualId !== expectedProjectId) {
      console.error(`${LOG_PREFIX} ❌ PROJECT MISMATCH!`, {
        expected: expectedProjectId,
        actual: projetoAtualId,
      });
    }
    
    const wrongProjectActivities = atividades.filter(
      a => !a.id.startsWith('wbs-') && a.projeto_id && a.projeto_id !== expectedProjectId
    );
    
    if (wrongProjectActivities.length > 0) {
      console.error(`${LOG_PREFIX} ❌ ACTIVITIES FROM WRONG PROJECT!`, {
        expected: expectedProjectId,
        wrongActivities: wrongProjectActivities.length,
      });
    }
  }, [expectedProjectId, projetoAtualId, atividades]);

  return {
    isValid: projetoAtualId === expectedProjectId,
    mismatchDetected: projetoAtualId !== expectedProjectId,
  };
}
