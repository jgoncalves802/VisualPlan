
/**
 * Critical Path Analysis Utilities
 * Implements Critical Path Method (CPM) for project scheduling
 */

import type { Task, Dependency } from '../types';

export interface TaskSchedule {
  taskId: string;
  earlyStart: Date;
  earlyFinish: Date;
  lateStart: Date;
  lateFinish: Date;
  totalFloat: number; // Days
  isCritical: boolean;
}

/**
 * Calculate critical path using forward and backward pass
 */
export function calculateCriticalPath(
  tasks: Task[],
  dependencies: Dependency[]
): TaskSchedule[] {
  const schedules: Map<string, TaskSchedule> = new Map();
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Initialize schedules
  tasks.forEach(task => {
    // Ensure dates are valid Date objects
    const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    
    schedules.set(task.id, {
      taskId: task.id,
      earlyStart: startDate,
      earlyFinish: endDate,
      lateStart: startDate,
      lateFinish: endDate,
      totalFloat: 0,
      isCritical: false
    });
  });

  // Forward pass - calculate early start and early finish
  forwardPass(tasks, dependencies, taskMap, schedules);

  // Backward pass - calculate late start and late finish
  backwardPass(tasks, dependencies, taskMap, schedules);

  // Calculate total float and identify critical tasks
  schedules.forEach(schedule => {
    const floatDays = daysBetween(schedule.earlyStart, schedule.lateStart);
    schedule.totalFloat = floatDays;
    schedule.isCritical = floatDays === 0;
  });

  return Array.from(schedules.values());
}

function forwardPass(
  tasks: Task[],
  dependencies: Dependency[],
  taskMap: Map<string, Task>,
  schedules: Map<string, TaskSchedule>
) {
  // Topological sort to process tasks in dependency order
  const sorted = topologicalSort(tasks, dependencies);

  sorted.forEach(taskId => {
    const task = taskMap.get(taskId);
    const schedule = schedules.get(taskId);
    if (!task || !schedule) return;

    // Find all predecessors
    const predecessorDeps = dependencies.filter(d => d.toTaskId === taskId);
    
    if (predecessorDeps.length === 0) {
      // No predecessors - use task's start date
      const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
      schedule.earlyStart = startDate;
    } else {
      // Early start is the latest early finish of all predecessors
      let maxPredFinish = new Date(0);
      
      predecessorDeps.forEach(dep => {
        const predSchedule = schedules.get(dep.fromTaskId);
        if (predSchedule && predSchedule.earlyFinish > maxPredFinish) {
          maxPredFinish = predSchedule.earlyFinish;
        }
      });

      schedule.earlyStart = maxPredFinish;
    }

    // Early finish = early start + duration
    const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    const duration = daysBetween(startDate, endDate);
    schedule.earlyFinish = addDays(schedule.earlyStart, duration);
  });
}

function backwardPass(
  tasks: Task[],
  dependencies: Dependency[],
  taskMap: Map<string, Task>,
  schedules: Map<string, TaskSchedule>
) {
  // Reverse topological sort
  const sorted = topologicalSort(tasks, dependencies).reverse();

  // Find project end date (latest early finish)
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

    // Find all successors
    const successorDeps = dependencies.filter(d => d.fromTaskId === taskId);
    
    if (successorDeps.length === 0) {
      // No successors - use project end
      schedule.lateFinish = projectEnd;
    } else {
      // Late finish is the earliest late start of all successors
      let minSuccStart = new Date(8640000000000000); // Max date
      
      successorDeps.forEach(dep => {
        const succSchedule = schedules.get(dep.toTaskId);
        if (succSchedule && succSchedule.lateStart < minSuccStart) {
          minSuccStart = succSchedule.lateStart;
        }
      });

      schedule.lateFinish = minSuccStart;
    }

    // Late start = late finish - duration
    const startDate = task.startDate instanceof Date ? task.startDate : new Date(task.startDate);
    const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate);
    const duration = daysBetween(startDate, endDate);
    schedule.lateStart = addDays(schedule.lateFinish, -duration);
  });
}

function topologicalSort(tasks: Task[], dependencies: Dependency[]): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const visit = (taskId: string) => {
    if (visited.has(taskId)) return;
    if (visiting.has(taskId)) return; // Circular dependency

    visiting.add(taskId);

    // Visit all predecessors first
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

function daysBetween(start: Date, end: Date): number {
  // Ensure dates are valid Date objects
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);
  
  // Check if dates are valid
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0;
  }
  
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  // Ensure date is a valid Date object
  const validDate = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(validDate.getTime())) {
    return new Date(); // Return current date as fallback
  }
  
  const result = new Date(validDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get critical path as array of task IDs
 */
export function getCriticalPath(schedules: TaskSchedule[]): string[] {
  return schedules
    .filter(s => s.isCritical)
    .map(s => s.taskId);
}

/**
 * Get task float (slack)
 */
export function getTaskFloat(schedule: TaskSchedule): number {
  return schedule.totalFloat;
}

/**
 * Check if task is on critical path
 */
export function isTaskCritical(taskId: string, schedules: TaskSchedule[]): boolean {
  const schedule = schedules.find(s => s.taskId === taskId);
  return schedule?.isCritical ?? false;
}

