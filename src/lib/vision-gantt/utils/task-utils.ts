
/**
 * Task calculation and manipulation utilities
 */

import type { Task } from '../types';
import { addDays, differenceInDays } from 'date-fns';

/**
 * Calculate task progress percentage
 */
export function calculateProgress(task: Task): number {
  if (task.children && task.children.length > 0) {
    // For parent tasks, calculate average progress of children
    const totalProgress = task.children.reduce((sum, child) => sum + calculateProgress(child), 0);
    return Math.round(totalProgress / task.children.length);
  }
  return task.progress || 0;
}

/**
 * Calculate task duration based on start and end dates
 */
export function calculateTaskDuration(startDate: Date, endDate: Date): number {
  return Math.max(1, differenceInDays(endDate, startDate) + 1);
}

/**
 * Update task end date based on duration
 */
export function updateEndDateFromDuration(startDate: Date, duration: number): Date {
  return addDays(startDate, Math.max(0, duration - 1));
}

/**
 * Update task duration based on dates
 */
export function updateDurationFromDates(startDate: Date, endDate: Date): number {
  return calculateTaskDuration(startDate, endDate);
}

/**
 * Get task color based on status
 */
export function getTaskColor(task: Task): { bg: string; border: string; text: string } {
  if (task.isMilestone) {
    return {
      bg: '#F59E0B',
      border: '#D97706',
      text: '#78350F'
    };
  }
  
  switch (task.status) {
    case 'completed':
      return {
        bg: '#10B981',
        border: '#059669',
        text: '#065F46'
      };
    case 'in_progress':
      return {
        bg: '#3B82F6',
        border: '#2563EB',
        text: '#1E3A8A'
      };
    case 'on_hold':
      return {
        bg: '#EF4444',
        border: '#DC2626',
        text: '#991B1B'
      };
    case 'not_started':
    default:
      return {
        bg: '#6B7280',
        border: '#4B5563',
        text: '#1F2937'
      };
  }
}

/**
 * Check if task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return task.endDate < today;
}

/**
 * Get task by ID from hierarchical structure
 */
export function findTaskById(tasks: Task[], taskId: string): Task | undefined {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }
    if (task.children) {
      const found = findTaskById(task.children, taskId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Update task in hierarchical structure
 */
export function updateTaskInTree(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    if (task.children) {
      return { ...task, children: updateTaskInTree(task.children, taskId, updates) };
    }
    return task;
  });
}
