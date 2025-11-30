/**
 * useCriticalPath Hook
 * 
 * Automatically recalculates the critical path whenever tasks or dependencies change.
 * Implements the Critical Path Method (CPM) with full PDM support.
 * 
 * Based on PMKB CPM methodology and Primavera P6 standards:
 * - Critical path is the longest path through the network
 * - Tasks on critical path have zero (or near-zero) total float
 * - Any delay in critical tasks delays the entire project
 * - Near-critical paths have total float ≤ 5 days (Primavera P6 default) and should be monitored
 */

import { useMemo, useCallback } from 'react';
import type { Task, Dependency } from '../types';
import { 
  calculateSchedule, 
  type TaskSchedule, 
  type ScheduleResult,
  type DependencyViolation 
} from '../utils/critical-path-utils';

export interface CriticalPathResult {
  schedules: TaskSchedule[];
  criticalPathIds: string[];
  nearCriticalPathIds: string[];
  violations: DependencyViolation[];
  projectDuration: number;
  projectStart: Date | null;
  projectEnd: Date | null;
  criticalDependencyIds: string[];
  getTaskSchedule: (taskId: string) => TaskSchedule | undefined;
  isTaskCritical: (taskId: string) => boolean;
  isTaskNearCritical: (taskId: string) => boolean;
  getTaskFloat: (taskId: string) => number;
  isDependencyCritical: (dependencyId: string) => boolean;
}

export interface UseCriticalPathOptions {
  nearCriticalThreshold?: number;
}

export function useCriticalPath(
  tasks: Task[],
  dependencies: Dependency[],
  options: UseCriticalPathOptions = {}
): CriticalPathResult {
  const { nearCriticalThreshold = 5 } = options;

  const scheduleResult = useMemo((): ScheduleResult => {
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

  const scheduleMap = useMemo(() => {
    return new Map(scheduleResult.schedules.map(s => [s.taskId, s]));
  }, [scheduleResult.schedules]);

  const nearCriticalPathIds = useMemo(() => {
    return scheduleResult.schedules
      .filter(s => !s.isCritical && s.totalFloat > 0 && s.totalFloat <= nearCriticalThreshold)
      .map(s => s.taskId);
  }, [scheduleResult.schedules, nearCriticalThreshold]);

  const criticalDependencyIds = useMemo(() => {
    const criticalSet = new Set(scheduleResult.criticalPathIds);
    
    return dependencies
      .filter(dep => criticalSet.has(dep.fromTaskId) && criticalSet.has(dep.toTaskId))
      .map(dep => dep.id);
  }, [dependencies, scheduleResult.criticalPathIds]);

  const projectDates = useMemo(() => {
    if (scheduleResult.schedules.length === 0) {
      return { start: null, end: null };
    }

    let start: Date | null = null;
    let end: Date | null = null;

    scheduleResult.schedules.forEach(schedule => {
      if (!start || schedule.earlyStart < start) {
        start = schedule.earlyStart;
      }
      if (!end || schedule.earlyFinish > end) {
        end = schedule.earlyFinish;
      }
    });

    return { start, end };
  }, [scheduleResult.schedules]);

  const getTaskSchedule = useCallback((taskId: string): TaskSchedule | undefined => {
    return scheduleMap.get(taskId);
  }, [scheduleMap]);

  const isTaskCritical = useCallback((taskId: string): boolean => {
    return scheduleResult.criticalPathIds.includes(taskId);
  }, [scheduleResult.criticalPathIds]);

  const isTaskNearCritical = useCallback((taskId: string): boolean => {
    return nearCriticalPathIds.includes(taskId);
  }, [nearCriticalPathIds]);

  const getTaskFloat = useCallback((taskId: string): number => {
    const schedule = scheduleMap.get(taskId);
    return schedule?.totalFloat ?? 0;
  }, [scheduleMap]);

  const isDependencyCritical = useCallback((dependencyId: string): boolean => {
    return criticalDependencyIds.includes(dependencyId);
  }, [criticalDependencyIds]);

  return {
    schedules: scheduleResult.schedules,
    criticalPathIds: scheduleResult.criticalPathIds,
    nearCriticalPathIds,
    violations: scheduleResult.violations,
    projectDuration: scheduleResult.projectDuration,
    projectStart: projectDates.start,
    projectEnd: projectDates.end,
    criticalDependencyIds,
    getTaskSchedule,
    isTaskCritical,
    isTaskNearCritical,
    getTaskFloat,
    isDependencyCritical
  };
}

export default useCriticalPath;
