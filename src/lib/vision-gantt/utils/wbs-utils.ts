
/**
 * Work Breakdown Structure (WBS) utilities
 */

import type { Task } from '../types';

/**
 * Generate WBS code for tasks based on hierarchy
 */
export function generateWBS(tasks: Task[], parentWBS: string = ''): void {
  let counter = 1;
  
  tasks.forEach((task) => {
    task.wbs = parentWBS ? `${parentWBS}.${counter}` : `${counter}`;
    
    if (task.children && task.children.length > 0) {
      generateWBS(task.children, task.wbs);
    }
    
    counter++;
  });
}

/**
 * Flatten hierarchical task tree to flat array
 */
export function flattenTasks(tasks: Task[], level: number = 0): Task[] {
  const result: Task[] = [];
  
  tasks.forEach((task) => {
    const taskWithLevel = { ...task, level };
    result.push(taskWithLevel);
    
    if (task.children && task.children.length > 0 && task.expanded !== false) {
      result.push(...flattenTasks(task.children, level + 1));
    }
  });
  
  return result;
}

/**
 * Build hierarchical tree from flat array
 */
export function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task>();
  const rootTasks: Task[] = [];
  
  // First pass: create map
  tasks.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] });
  });
  
  // Second pass: build hierarchy
  tasks.forEach((task) => {
    const taskNode = taskMap.get(task.id);
    if (!taskNode) return;
    
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(taskNode);
      } else {
        rootTasks.push(taskNode);
      }
    } else {
      rootTasks.push(taskNode);
    }
  });
  
  return rootTasks;
}

/**
 * Get all descendant task IDs
 */
export function getDescendantIds(task: Task): string[] {
  const ids: string[] = [];
  
  if (task.children) {
    task.children.forEach((child) => {
      ids.push(child.id);
      ids.push(...getDescendantIds(child));
    });
  }
  
  return ids;
}

/**
 * Check if task has children
 */
export function hasChildren(task: Task): boolean {
  return !!task.children && task.children.length > 0;
}

/**
 * Toggle task expansion
 */
export function toggleTaskExpansion(tasks: Task[], taskId: string): Task[] {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, expanded: !task.expanded };
    }
    if (task.children) {
      return { ...task, children: toggleTaskExpansion(task.children, taskId) };
    }
    return task;
  });
}

/**
 * Count total tasks including children
 */
export function countTasks(tasks: Task[]): number {
  return tasks.reduce((count, task) => {
    let total = 1;
    if (task.children) {
      total += countTasks(task.children);
    }
    return count + total;
  }, 0);
}
