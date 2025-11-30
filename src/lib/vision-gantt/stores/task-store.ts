
/**
 * TaskStore - Manages tasks and hierarchical structure
 */

import { BaseStore } from './base-store';
import type { Task } from '../types';
import { 
  buildTaskTree, 
  flattenTasks, 
  toggleTaskExpansion, 
  updateTaskInTree,
  findTaskById,
  generateWBS
} from '../utils';

export class TaskStore extends BaseStore<Task> {
  /**
   * Get flattened task list (respecting expand/collapse)
   */
  getFlatTasks(): Task[] {
    const tree = this.getTaskTree();
    return flattenTasks(tree);
  }

  /**
   * Get hierarchical task tree
   */
  getTaskTree(): Task[] {
    return buildTaskTree(this.data);
  }

  /**
   * Toggle task expansion
   */
  toggleExpansion(taskId: string): void {
    const tree = this.getTaskTree();
    const updatedTree = toggleTaskExpansion(tree, taskId);
    this.setData(this.treeToFlatArray(updatedTree));
  }

  /**
   * Update task and notify
   */
  updateTask(taskId: string, updates: Partial<Task>): void {
    const tree = this.getTaskTree();
    const updatedTree = updateTaskInTree(tree, taskId, updates);
    this.setData(this.treeToFlatArray(updatedTree));
  }

  /**
   * Get task by ID (searches in hierarchy)
   */
  getTaskById(taskId: string): Task | undefined {
    const tree = this.getTaskTree();
    return findTaskById(tree, taskId);
  }

  /**
   * Get children of a task
   */
  getChildren(parentId: string): Task[] {
    return this.data.filter((task) => task?.parentId === parentId);
  }

  /**
   * Get parent of a task
   */
  getParent(taskId: string): Task | undefined {
    const task = this.getById(taskId);
    if (task?.parentId) {
      return this.getById(task.parentId);
    }
    return undefined;
  }

  /**
   * Move task to new parent
   */
  moveTask(taskId: string, newParentId: string | null): void {
    this.update(taskId, { parentId: newParentId });
  }

  /**
   * Indent task - Make it a child of the task above (MS Project style: Alt+Shift+Right)
   * Returns true if successful, false if cannot indent
   */
  indentTask(taskId: string): boolean {
    const flatList = this.getFlatTasks();
    const taskIndex = flatList.findIndex(t => t.id === taskId);
    
    if (taskIndex <= 0) return false;
    
    const task = flatList[taskIndex];
    const previousTask = flatList[taskIndex - 1];
    
    if (!task || !previousTask) return false;
    
    const newLevel = (task.level ?? 0) + 1;
    const maxLevel = 10;
    if (newLevel > maxLevel) return false;
    
    this.updateTask(taskId, {
      parentId: previousTask.id,
      level: newLevel
    });
    
    this.updateTask(previousTask.id, {
      isGroup: true
    });
    
    this.generateWBSCodes();
    
    return true;
  }

  /**
   * Outdent task - Move it up one level (MS Project style: Alt+Shift+Left)
   * Returns true if successful, false if cannot outdent
   */
  outdentTask(taskId: string): boolean {
    const task = this.getTaskById(taskId);
    if (!task) return false;
    
    if (!task.parentId) return false;
    
    const parent = this.getParent(taskId);
    if (!parent) return false;
    
    const newParentId = parent.parentId ?? null;
    const newLevel = Math.max(0, (task.level ?? 1) - 1);
    
    this.updateTask(taskId, {
      parentId: newParentId,
      level: newLevel
    });
    
    const remainingChildren = this.getChildren(parent.id);
    if (remainingChildren.length === 0) {
      this.updateTask(parent.id, {
        isGroup: false
      });
    }
    
    this.generateWBSCodes();
    
    return true;
  }

  /**
   * Indent multiple tasks - processes in order, refreshing flat list after each
   */
  indentTasks(taskIds: string[]): boolean {
    if (taskIds.length === 0) return false;
    
    let success = true;
    const processedIds = new Set<string>();
    
    for (const taskId of taskIds) {
      if (processedIds.has(taskId)) continue;
      
      if (!this.indentTask(taskId)) {
        success = false;
      }
      processedIds.add(taskId);
    }
    
    return success;
  }

  /**
   * Outdent multiple tasks - processes in reverse order to maintain hierarchy
   */
  outdentTasks(taskIds: string[]): boolean {
    if (taskIds.length === 0) return false;
    
    let success = true;
    const reversedIds = [...taskIds].reverse();
    const processedIds = new Set<string>();
    
    for (const taskId of reversedIds) {
      if (processedIds.has(taskId)) continue;
      
      if (!this.outdentTask(taskId)) {
        success = false;
      }
      processedIds.add(taskId);
    }
    
    return success;
  }

  /**
   * Generate WBS codes for all tasks
   */
  generateWBSCodes(): void {
    const tree = this.getTaskTree();
    generateWBS(tree);
    this.setData(this.treeToFlatArray(tree));
  }

  /**
   * Helper: Convert tree back to flat array
   */
  private treeToFlatArray(tree: Task[]): Task[] {
    const result: Task[] = [];
    const flatten = (tasks: Task[]) => {
      tasks.forEach((task) => {
        const { children, ...taskWithoutChildren } = task;
        result.push(taskWithoutChildren as Task);
        if (children && children.length > 0) {
          flatten(children);
        }
      });
    };
    flatten(tree);
    return result;
  }

  /**
   * Get root tasks (tasks without parent)
   */
  getRootTasks(): Task[] {
    return this.data.filter((task) => !task?.parentId);
  }

  /**
   * Filter tasks by criteria
   */
  filterTasks(predicate: (task: Task) => boolean): Task[] {
    return this.data.filter(predicate);
  }

  /**
   * Get tasks in date range
   */
  getTasksInRange(startDate: Date, endDate: Date): Task[] {
    return this.data.filter((task) => {
      if (!task?.startDate || !task?.endDate) return false;
      return task.startDate <= endDate && task.endDate >= startDate;
    });
  }
}
