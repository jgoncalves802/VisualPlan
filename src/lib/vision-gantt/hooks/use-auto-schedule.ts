/**
 * useAutoSchedule - Hook for automatic task scheduling based on dependencies
 * 
 * Implements the Precedence Diagram Method (PDM) for repositioning tasks
 * when dependencies are created, modified, or when tasks are moved.
 */

import { useCallback, useMemo } from 'react';
import type { Task, Dependency } from '../types';
import { 
  calculateSchedule, 
  calculateSuggestedDates, 
  autoScheduleTasks,
  type DependencyViolation 
} from '../utils/critical-path-utils';

interface UseAutoScheduleOptions {
  tasks: Task[];
  dependencies: Dependency[];
  onTasksUpdate?: (tasks: Task[]) => void;
  autoReschedule?: boolean;
}

interface UseAutoScheduleResult {
  violations: DependencyViolation[];
  violatingTaskIds: string[];
  criticalPathIds: string[];
  projectDuration: number;
  rescheduleTask: (taskId: string) => Task | null;
  rescheduleAll: () => Task[];
  getSuggestedDates: (taskId: string) => { suggestedStart: Date; suggestedEnd: Date } | null;
  validateTask: (taskId: string) => DependencyViolation[];
  hasViolations: (taskId: string) => boolean;
}

export function useAutoSchedule({
  tasks,
  dependencies,
  onTasksUpdate,
  autoReschedule: _autoReschedule = false
}: UseAutoScheduleOptions): UseAutoScheduleResult {

  const scheduleResult = useMemo(() => {
    if (tasks.length === 0) {
      return {
        schedules: [],
        violations: [],
        criticalPathIds: [],
        projectDuration: 0
      };
    }
    return calculateSchedule(tasks, dependencies);
  }, [tasks, dependencies]);

  const violations = scheduleResult.violations;
  const criticalPathIds = scheduleResult.criticalPathIds;
  const projectDuration = scheduleResult.projectDuration;

  const violatingTaskIds = useMemo(() => {
    return [...new Set(violations.map(v => v.toTaskId))];
  }, [violations]);

  const getSuggestedDates = useCallback((taskId: string) => {
    return calculateSuggestedDates(taskId, tasks, dependencies);
  }, [tasks, dependencies]);

  const rescheduleTask = useCallback((taskId: string): Task | null => {
    const suggested = getSuggestedDates(taskId);
    if (!suggested) return null;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;

    const updatedTask: Task = {
      ...task,
      startDate: suggested.suggestedStart,
      endDate: suggested.suggestedEnd
    };

    if (onTasksUpdate) {
      const newTasks = tasks.map(t => 
        t.id === taskId ? updatedTask : t
      );
      onTasksUpdate(newTasks);
    }

    return updatedTask;
  }, [tasks, dependencies, getSuggestedDates, onTasksUpdate]);

  const rescheduleAll = useCallback((): Task[] => {
    const rescheduledTasks = autoScheduleTasks(tasks, dependencies);
    
    if (onTasksUpdate) {
      onTasksUpdate(rescheduledTasks);
    }

    return rescheduledTasks;
  }, [tasks, dependencies, onTasksUpdate]);

  const validateTask = useCallback((taskId: string): DependencyViolation[] => {
    return violations.filter(v => v.toTaskId === taskId);
  }, [violations]);

  const hasViolations = useCallback((taskId: string): boolean => {
    return violations.some(v => v.toTaskId === taskId);
  }, [violations]);

  return {
    violations,
    violatingTaskIds,
    criticalPathIds,
    projectDuration,
    rescheduleTask,
    rescheduleAll,
    getSuggestedDates,
    validateTask,
    hasViolations
  };
}

/**
 * Get dependency type description in Portuguese
 */
export function getDependencyTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'FS': 'Término-Início (a sucessora inicia após o término da predecessora)',
    'SS': 'Início-Início (a sucessora inicia quando a predecessora inicia)',
    'FF': 'Término-Término (a sucessora termina quando a predecessora termina)',
    'SF': 'Início-Término (a sucessora termina quando a predecessora inicia)'
  };
  return descriptions[type] || type;
}

/**
 * Get short dependency type name in Portuguese
 */
export function getDependencyTypeName(type: string): string {
  const names: Record<string, string> = {
    'FS': 'Término-Início',
    'SS': 'Início-Início', 
    'FF': 'Término-Término',
    'SF': 'Início-Término'
  };
  return names[type] || type;
}
