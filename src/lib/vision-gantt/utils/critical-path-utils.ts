/**
 * Critical Path Analysis Utilities
 * Implements Critical Path Method (CPM) with full PDM (Precedence Diagram Method) support
 * 
 * Dependency Types (conforme PMBOK/PDM):
 * - FS (Finish-to-Start): Successor starts after predecessor finishes (most common)
 * - SS (Start-to-Start): Successor starts when predecessor starts
 * - FF (Finish-to-Finish): Successor finishes when predecessor finishes
 * - SF (Start-to-Finish): Successor finishes when predecessor starts (rare)
 * 
 * All dependency types support LAG (positive delays or negative overlaps)
 */

import type { Task, Dependency, DependencyType } from '../types';

export interface TaskSchedule {
  taskId: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloat: number;
  freeFloat: number;
  isCritical: boolean;
}

export interface DependencyViolation {
  dependencyId: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  expectedDate: Date;
  actualDate: Date;
  violationDays: number;
  message: string;
}

export interface ScheduleResult {
  schedules: TaskSchedule[];
  violations: DependencyViolation[];
  criticalPathIds: string[];
  projectDuration: number;
}

/**
 * Calculate critical path using forward and backward pass with full PDM support
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: Dependency[]
): TaskSchedule[] {
  const result = calculateSchedule(tasks, dependencies);
  return result.schedules;
}

/**
 * Full schedule calculation with violation detection
 */
export function calculateSchedule(
  tasks: Task[],
  dependencies: Dependency[]
): ScheduleResult {
  const schedules: Map<string, TaskSchedule> = new Map();
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const violations: DependencyViolation[] = [];

  tasks.forEach(task => {
    const startDate = toDate(task.startDate);
    const endDate = toDate(task.endDate);
    
    schedules.set(task.id, {
      taskId: task.id,
      earlyStart: startDate,
      earlyFinish: endDate,
      lateStart: startDate,
      lateFinish: endDate,
      totalFloat: 0,
      freeFloat: 0,
      isCritical: false
    });
  });

  forwardPass(tasks, dependencies, taskMap, schedules);
  backwardPass(tasks, dependencies, taskMap, schedules);
  calculateFloats(dependencies, schedules);
  const depViolations = validateDependencies(dependencies, taskMap, schedules);
  violations.push(...depViolations);

  let projectEnd = new Date(0);
  let projectStart = new Date(8640000000000000);
  schedules.forEach(schedule => {
    if (schedule.earlyFinish > projectEnd) projectEnd = schedule.earlyFinish;
    if (schedule.earlyStart < projectStart) projectStart = schedule.earlyStart;
  });

  const criticalPathIds = Array.from(schedules.values())
    .filter(s => s.isCritical)
    .map(s => s.taskId);

  return {
    schedules: Array.from(schedules.values()),
    violations,
    criticalPathIds,
    projectDuration: daysBetween(projectStart, projectEnd)
  };
}

/**
 * Forward Pass - Calculate Early Start (ES) and Early Finish (EF)
 * Uses null sentinel pattern to correctly handle all lag values
 */
function forwardPass(
  tasks: Task[],
  dependencies: Dependency[],
  taskMap: Map<string, Task>,
  schedules: Map<string, TaskSchedule>
) {
  const sorted = topologicalSort(tasks, dependencies);

  sorted.forEach(taskId => {
    const task = taskMap.get(taskId);
    const schedule = schedules.get(taskId);
    if (!task || !schedule) return;

    const predecessorDeps = dependencies.filter(d => d.toTaskId === taskId);
    const duration = getTaskDuration(task);
    
    if (predecessorDeps.length === 0) {
      schedule.earlyStart = toDate(task.startDate);
      schedule.earlyFinish = addDays(schedule.earlyStart, duration);
      return;
    }

    const MIN_DATE = new Date(-8640000000000000);
    let hasStartConstraint = false;
    let hasFinishConstraint = false;
    let calculatedEarlyStart = MIN_DATE;
    let calculatedEarlyFinish = MIN_DATE;

    predecessorDeps.forEach(dep => {
      const predSchedule = schedules.get(dep.fromTaskId);
      if (!predSchedule) return;

      const lag = dep.lag ?? 0;
      const type = dep.type ?? 'FS';

      switch (type) {
        case 'FS': {
          const constrainedStart = addDays(predSchedule.earlyFinish, lag);
          if (constrainedStart > calculatedEarlyStart) {
            calculatedEarlyStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
        case 'SS': {
          const constrainedStart = addDays(predSchedule.earlyStart, lag);
          if (constrainedStart > calculatedEarlyStart) {
            calculatedEarlyStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
        case 'FF': {
          const constrainedFinish = addDays(predSchedule.earlyFinish, lag);
          if (constrainedFinish > calculatedEarlyFinish) {
            calculatedEarlyFinish = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
        case 'SF': {
          const constrainedFinish = addDays(predSchedule.earlyStart, lag);
          if (constrainedFinish > calculatedEarlyFinish) {
            calculatedEarlyFinish = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
      }
    });

    if (hasFinishConstraint) {
      const finishBasedStart = addDays(calculatedEarlyFinish, -duration);
      if (finishBasedStart > calculatedEarlyStart) {
        calculatedEarlyStart = finishBasedStart;
        hasStartConstraint = true;
      }
    }

    if (hasStartConstraint) {
      schedule.earlyStart = calculatedEarlyStart;
    } else {
      schedule.earlyStart = toDate(task.startDate);
    }
    
    schedule.earlyFinish = addDays(schedule.earlyStart, duration);

    if (hasFinishConstraint && schedule.earlyFinish < calculatedEarlyFinish) {
      schedule.earlyFinish = calculatedEarlyFinish;
    }
  });
}

/**
 * Backward Pass - Calculate Late Start (LS) and Late Finish (LF)
 * Uses null sentinel pattern to correctly handle all lag values
 */
function backwardPass(
  tasks: Task[],
  dependencies: Dependency[],
  taskMap: Map<string, Task>,
  schedules: Map<string, TaskSchedule>
) {
  const sorted = topologicalSort(tasks, dependencies).reverse();

  let projectEnd = new Date(0);
  schedules.forEach(schedule => {
    if (schedule.earlyFinish > projectEnd) {
      projectEnd = schedule.earlyFinish;
    }
  });

  sorted.forEach(taskId => {
    const task = taskMap.get(taskId);
    const schedule = schedules.get(taskId);
    if (!task || !schedule) return;

    const successorDeps = dependencies.filter(d => d.fromTaskId === taskId);
    const duration = getTaskDuration(task);
    
    if (successorDeps.length === 0) {
      schedule.lateFinish = projectEnd;
      schedule.lateStart = addDays(schedule.lateFinish, -duration);
      return;
    }

    const MAX_DATE = new Date(8640000000000000);
    let hasFinishConstraint = false;
    let hasStartConstraint = false;
    let calculatedLateFinish = MAX_DATE;
    let calculatedLateStart = MAX_DATE;

    successorDeps.forEach(dep => {
      const succSchedule = schedules.get(dep.toTaskId);
      if (!succSchedule) return;

      const lag = dep.lag ?? 0;
      const type = dep.type ?? 'FS';

      switch (type) {
        case 'FS': {
          const constrainedFinish = addDays(succSchedule.lateStart, -lag);
          if (constrainedFinish < calculatedLateFinish) {
            calculatedLateFinish = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
        case 'SS': {
          const constrainedStart = addDays(succSchedule.lateStart, -lag);
          if (constrainedStart < calculatedLateStart) {
            calculatedLateStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
        case 'FF': {
          const constrainedFinish = addDays(succSchedule.lateFinish, -lag);
          if (constrainedFinish < calculatedLateFinish) {
            calculatedLateFinish = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
        case 'SF': {
          const constrainedStart = addDays(succSchedule.lateFinish, -lag);
          if (constrainedStart < calculatedLateStart) {
            calculatedLateStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
      }
    });

    if (hasStartConstraint) {
      const startBasedFinish = addDays(calculatedLateStart, duration);
      if (startBasedFinish < calculatedLateFinish) {
        calculatedLateFinish = startBasedFinish;
        hasFinishConstraint = true;
      }
    }

    if (hasFinishConstraint) {
      schedule.lateFinish = calculatedLateFinish;
    } else {
      schedule.lateFinish = projectEnd;
    }
    
    schedule.lateStart = addDays(schedule.lateFinish, -duration);

    if (hasStartConstraint && schedule.lateStart > calculatedLateStart) {
      schedule.lateStart = calculatedLateStart;
    }
  });
}

/**
 * Calculate Total Float and Free Float for each task
 */
function calculateFloats(
  dependencies: Dependency[],
  schedules: Map<string, TaskSchedule>
) {
  schedules.forEach((schedule, taskId) => {
    schedule.totalFloat = daysBetween(schedule.earlyStart, schedule.lateStart);
    schedule.isCritical = Math.abs(schedule.totalFloat) < 1;

    const successorDeps = dependencies.filter(d => d.fromTaskId === taskId);
    
    if (successorDeps.length === 0) {
      schedule.freeFloat = schedule.totalFloat;
    } else {
      let minSlack = Infinity;
      
      successorDeps.forEach(dep => {
        const succSchedule = schedules.get(dep.toTaskId);
        if (!succSchedule) return;

        const lag = dep.lag ?? 0;
        const type = dep.type ?? 'FS';
        let slack = 0;

        switch (type) {
          case 'FS':
            slack = daysBetween(schedule.earlyFinish, succSchedule.earlyStart) - lag;
            break;
          case 'SS':
            slack = daysBetween(schedule.earlyStart, succSchedule.earlyStart) - lag;
            break;
          case 'FF':
            slack = daysBetween(schedule.earlyFinish, succSchedule.earlyFinish) - lag;
            break;
          case 'SF':
            slack = daysBetween(schedule.earlyStart, succSchedule.earlyFinish) - lag;
            break;
        }

        if (slack < minSlack) {
          minSlack = slack;
        }
      });

      schedule.freeFloat = Math.max(0, minSlack);
    }
  });
}

/**
 * Validate dependency constraints using calculated schedule dates
 * Detects violations where the computed schedule violates predecessor relationships
 */
function validateDependencies(
  dependencies: Dependency[],
  taskMap: Map<string, Task>,
  schedules: Map<string, TaskSchedule>
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];

  dependencies.forEach(dep => {
    const fromTask = taskMap.get(dep.fromTaskId);
    const toTask = taskMap.get(dep.toTaskId);
    const fromSchedule = schedules.get(dep.fromTaskId);
    const toSchedule = schedules.get(dep.toTaskId);

    if (!fromTask || !toTask || !fromSchedule || !toSchedule) return;

    const lag = dep.lag ?? 0;
    const type = dep.type ?? 'FS';
    let expectedDate: Date;
    let actualDate: Date;
    let violationDays = 0;
    let isViolation = false;

    switch (type) {
      case 'FS': {
        expectedDate = addDays(fromSchedule.earlyFinish, lag);
        actualDate = toSchedule.earlyStart;
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'SS': {
        expectedDate = addDays(fromSchedule.earlyStart, lag);
        actualDate = toSchedule.earlyStart;
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'FF': {
        expectedDate = addDays(fromSchedule.earlyFinish, lag);
        actualDate = toSchedule.earlyFinish;
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'SF': {
        expectedDate = addDays(fromSchedule.earlyStart, lag);
        actualDate = toSchedule.earlyFinish;
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
    }

    if (isViolation) {
      const typeNames: Record<DependencyType, string> = {
        'FS': 'Término-Início',
        'SS': 'Início-Início',
        'FF': 'Término-Término',
        'SF': 'Início-Término'
      };

      violations.push({
        dependencyId: dep.id,
        fromTaskId: dep.fromTaskId,
        toTaskId: dep.toTaskId,
        type,
        expectedDate,
        actualDate,
        violationDays,
        message: `Violação ${typeNames[type]}: tarefa "${toTask.name}" deveria ${type.endsWith('S') ? 'iniciar' : 'terminar'} após ${formatDate(expectedDate)}, mas está em ${formatDate(actualDate)} (${violationDays} dias antes)`
      });
    }
  });

  return violations;
}

/**
 * Validate dependency constraints using ORIGINAL task dates (not calculated)
 * Use this to detect if user-placed tasks violate constraints before auto-scheduling
 */
export function validateOriginalDates(
  tasks: Task[],
  dependencies: Dependency[]
): DependencyViolation[] {
  const violations: DependencyViolation[] = [];
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  dependencies.forEach(dep => {
    const fromTask = taskMap.get(dep.fromTaskId);
    const toTask = taskMap.get(dep.toTaskId);

    if (!fromTask || !toTask) return;

    const lag = dep.lag ?? 0;
    const type = dep.type ?? 'FS';
    let expectedDate: Date;
    let actualDate: Date;
    let violationDays = 0;
    let isViolation = false;

    switch (type) {
      case 'FS': {
        expectedDate = addDays(toDate(fromTask.endDate), lag);
        actualDate = toDate(toTask.startDate);
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'SS': {
        expectedDate = addDays(toDate(fromTask.startDate), lag);
        actualDate = toDate(toTask.startDate);
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'FF': {
        expectedDate = addDays(toDate(fromTask.endDate), lag);
        actualDate = toDate(toTask.endDate);
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
      case 'SF': {
        expectedDate = addDays(toDate(fromTask.startDate), lag);
        actualDate = toDate(toTask.endDate);
        violationDays = daysBetween(actualDate, expectedDate);
        isViolation = violationDays > 0;
        break;
      }
    }

    if (isViolation) {
      const typeNames: Record<DependencyType, string> = {
        'FS': 'Término-Início',
        'SS': 'Início-Início',
        'FF': 'Término-Término',
        'SF': 'Início-Término'
      };

      violations.push({
        dependencyId: dep.id,
        fromTaskId: dep.fromTaskId,
        toTaskId: dep.toTaskId,
        type,
        expectedDate,
        actualDate,
        violationDays,
        message: `Violação ${typeNames[type]}: tarefa "${toTask.name}" deveria ${type.endsWith('S') ? 'iniciar' : 'terminar'} após ${formatDate(expectedDate)}, mas está em ${formatDate(actualDate)} (${violationDays} dias antes)`
      });
    }
  });

  return violations;
}

/**
 * Calculate suggested dates for a task based on its dependencies
 * Returns the earliest possible start/end dates considering all predecessors
 */
export function calculateSuggestedDates(
  taskId: string,
  tasks: Task[],
  dependencies: Dependency[]
): { suggestedStart: Date; suggestedEnd: Date } | null {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const task = taskMap.get(taskId);
  if (!task) return null;

  const predecessorDeps = dependencies.filter(d => d.toTaskId === taskId);
  const duration = getTaskDuration(task);

  if (predecessorDeps.length === 0) {
    return {
      suggestedStart: toDate(task.startDate),
      suggestedEnd: toDate(task.endDate)
    };
  }

  const MIN_DATE = new Date(-8640000000000000);
  let hasStartConstraint = false;
  let hasFinishConstraint = false;
  let suggestedStart = MIN_DATE;
  let suggestedEnd = MIN_DATE;

  predecessorDeps.forEach(dep => {
    const predTask = taskMap.get(dep.fromTaskId);
    if (!predTask) return;

    const lag = dep.lag ?? 0;
    const type = dep.type ?? 'FS';

    switch (type) {
      case 'FS': {
        const constrainedStart = addDays(toDate(predTask.endDate), lag);
        if (constrainedStart > suggestedStart) {
          suggestedStart = constrainedStart;
          hasStartConstraint = true;
        }
        break;
      }
      case 'SS': {
        const constrainedStart = addDays(toDate(predTask.startDate), lag);
        if (constrainedStart > suggestedStart) {
          suggestedStart = constrainedStart;
          hasStartConstraint = true;
        }
        break;
      }
      case 'FF': {
        const constrainedFinish = addDays(toDate(predTask.endDate), lag);
        if (constrainedFinish > suggestedEnd) {
          suggestedEnd = constrainedFinish;
          hasFinishConstraint = true;
        }
        break;
      }
      case 'SF': {
        const constrainedFinish = addDays(toDate(predTask.startDate), lag);
        if (constrainedFinish > suggestedEnd) {
          suggestedEnd = constrainedFinish;
          hasFinishConstraint = true;
        }
        break;
      }
    }
  });

  if (hasFinishConstraint) {
    const finishBasedStart = addDays(suggestedEnd, -duration);
    if (finishBasedStart > suggestedStart) {
      suggestedStart = finishBasedStart;
      hasStartConstraint = true;
    }
  }

  if (!hasStartConstraint) {
    suggestedStart = toDate(task.startDate);
  }

  suggestedEnd = addDays(suggestedStart, duration);

  return { suggestedStart, suggestedEnd };
}

/**
 * Auto-schedule tasks: reposition tasks based on their dependencies
 * Returns updated tasks with corrected dates
 */
export function autoScheduleTasks(
  tasks: Task[],
  dependencies: Dependency[]
): Task[] {
  const sorted = topologicalSort(tasks, dependencies);
  const taskMap = new Map(tasks.map(t => [t.id, { ...t }]));

  sorted.forEach(taskId => {
    const task = taskMap.get(taskId);
    if (!task) return;

    const predecessorDeps = dependencies.filter(d => d.toTaskId === taskId);
    
    if (predecessorDeps.length === 0) return;

    const duration = getTaskDuration(task);
    const MIN_DATE = new Date(-8640000000000000);
    let hasStartConstraint = false;
    let hasFinishConstraint = false;
    let suggestedStart = MIN_DATE;
    let suggestedEnd = MIN_DATE;

    predecessorDeps.forEach(dep => {
      const predTask = taskMap.get(dep.fromTaskId);
      if (!predTask) return;

      const lag = dep.lag ?? 0;
      const type = dep.type ?? 'FS';

      switch (type) {
        case 'FS': {
          const constrainedStart = addDays(toDate(predTask.endDate), lag);
          if (constrainedStart > suggestedStart) {
            suggestedStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
        case 'SS': {
          const constrainedStart = addDays(toDate(predTask.startDate), lag);
          if (constrainedStart > suggestedStart) {
            suggestedStart = constrainedStart;
            hasStartConstraint = true;
          }
          break;
        }
        case 'FF': {
          const constrainedFinish = addDays(toDate(predTask.endDate), lag);
          if (constrainedFinish > suggestedEnd) {
            suggestedEnd = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
        case 'SF': {
          const constrainedFinish = addDays(toDate(predTask.startDate), lag);
          if (constrainedFinish > suggestedEnd) {
            suggestedEnd = constrainedFinish;
            hasFinishConstraint = true;
          }
          break;
        }
      }
    });

    if (hasFinishConstraint) {
      const finishBasedStart = addDays(suggestedEnd, -duration);
      if (finishBasedStart > suggestedStart) {
        suggestedStart = finishBasedStart;
        hasStartConstraint = true;
      }
    }

    if (hasStartConstraint) {
      task.startDate = suggestedStart;
      task.endDate = addDays(suggestedStart, duration);
    }
  });

  return Array.from(taskMap.values());
}

function topologicalSort(tasks: Task[], dependencies: Dependency[]): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (taskId: string) => {
    if (visited.has(taskId)) return;
    if (visiting.has(taskId)) return;

    visiting.add(taskId);

    const predecessors = dependencies
      .filter(d => d.toTaskId === taskId)
      .map(d => d.fromTaskId);
    
    predecessors.forEach(visit);

    visiting.delete(taskId);
    visited.add(taskId);
    result.push(taskId);
  };

  tasks.forEach(task => visit(task.id));

  return result;
}

function toDate(date: Date | string): Date {
  if (date instanceof Date) return date;
  return new Date(date);
}

function daysBetween(start: Date, end: Date): number {
  const startDate = toDate(start);
  const endDate = toDate(end);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const validDate = toDate(date);
  
  if (isNaN(validDate.getTime())) {
    return new Date();
  }
  
  const result = new Date(validDate);
  result.setDate(result.getDate() + days);
  return result;
}

function getTaskDuration(task: Task): number {
  const start = toDate(task.startDate);
  const end = toDate(task.endDate);
  return Math.max(0, daysBetween(start, end));
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export function getCriticalPath(schedules: TaskSchedule[]): string[] {
  return schedules
    .filter(s => s.isCritical)
    .map(s => s.taskId);
}

export function getTaskFloat(schedule: TaskSchedule): number {
  return schedule.totalFloat;
}

export function isTaskCritical(taskId: string, schedules: TaskSchedule[]): boolean {
  const schedule = schedules.find(s => s.taskId === taskId);
  return schedule?.isCritical ?? false;
}

export function getViolatingTasks(violations: DependencyViolation[]): string[] {
  return [...new Set(violations.map(v => v.toTaskId))];
}
