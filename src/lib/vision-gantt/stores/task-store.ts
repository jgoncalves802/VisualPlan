
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
   * Get siblings (tasks with same parent)
   */
  getSiblings(taskId: string): Task[] {
    const task = this.getById(taskId);
    if (!task) return [];
    const parentId = task.parentId ?? null;
    return this.data.filter(t => (t.parentId ?? null) === parentId && t.id !== taskId);
  }

  /**
   * Get previous sibling (DHTMLX-style: sibling at same level, before this task in order)
   * This is the KEY function for correct indent behavior
   */
  getPrevSibling(taskId: string): Task | null {
    const task = this.getById(taskId);
    if (!task) return null;
    
    const parentId = task.parentId ?? null;
    
    const siblings = this.data.filter(t => (t.parentId ?? null) === parentId);
    const taskIndexInSiblings = siblings.findIndex(t => t.id === taskId);
    
    if (taskIndexInSiblings <= 0) return null;
    
    return siblings[taskIndexInSiblings - 1];
  }

  /**
   * Get all descendants of a task (children, grandchildren, etc.)
   */
  getDescendants(taskId: string): Task[] {
    const descendants: Task[] = [];
    const children = this.getChildren(taskId);
    
    for (const child of children) {
      descendants.push(child);
      descendants.push(...this.getDescendants(child.id));
    }
    
    return descendants;
  }

  /**
   * Reorder data array to maintain hierarchical order (depth-first)
   * This ensures buildTaskTree produces consistent results
   */
  private reorderDataHierarchically(): void {
    const tree = this.getTaskTree();
    const orderedData = this.treeToFlatArray(tree);
    this.setData(orderedData);
  }

  /**
   * Indent task - DHTMLX/MS Project style
   * 
   * Key insight: Task becomes child of its PREVIOUS SIBLING (same level),
   * NOT the previous task in the visual list.
   * 
   * Example:
   * Before: A(0), B(0), C(0)
   * Indent B: B becomes child of A
   * Indent C: C becomes child of B (which is now C's previous sibling at level 0... wait, no!)
   * 
   * After indent B: A(0) -> B(1), C(0)
   * C's sibling at level 0 is A (not B, because B is now level 1)
   * So indent C: C becomes child of A, sibling of B
   * 
   * Returns true if successful, false if cannot indent
   */
  indentTask(taskId: string): boolean {
    const task = this.getById(taskId);
    if (!task) return false;
    
    const prevSibling = this.getPrevSibling(taskId);
    if (!prevSibling) return false;
    
    const newLevel = (prevSibling.level ?? 0) + 1;
    const maxLevel = 10;
    
    if (newLevel > maxLevel) return false;
    
    const taskWithDescendants = [taskId, ...this.getDescendants(taskId).map(d => d.id)];
    const levelDelta = newLevel - (task.level ?? 0);
    
    const dataWithoutTask = this.data.filter(t => !taskWithDescendants.includes(t.id));
    const taskItems = this.data.filter(t => taskWithDescendants.includes(t.id));
    
    const updatedTaskItems = taskItems.map(t => {
      if (t.id === taskId) {
        return { ...t, parentId: prevSibling.id, level: newLevel };
      }
      return { ...t, level: (t.level ?? 0) + levelDelta };
    });
    
    const prevSiblingIndex = dataWithoutTask.findIndex(t => t.id === prevSibling.id);
    const prevSiblingDescendants = this.getDescendants(prevSibling.id);
    const insertIndex = prevSiblingIndex + 1 + prevSiblingDescendants.length;
    
    const updatedDataWithoutTask = dataWithoutTask.map(t => {
      if (t.id === prevSibling.id && !t.isGroup) {
        return { ...t, isGroup: true, expanded: true };
      }
      return t;
    });
    
    const newData = [
      ...updatedDataWithoutTask.slice(0, insertIndex),
      ...updatedTaskItems,
      ...updatedDataWithoutTask.slice(insertIndex)
    ];
    
    this.setData(newData);
    this.generateWBSCodes();
    
    return true;
  }

  /**
   * Outdent task - Move it up one level (DHTMLX/MS Project style)
   * Task moves to become a sibling of its current parent, positioned right after parent
   * 
   * Returns true if successful, false if cannot outdent
   */
  outdentTask(taskId: string): boolean {
    const task = this.getById(taskId);
    if (!task) return false;
    
    if (!task.parentId) return false;
    
    const parent = this.getById(task.parentId);
    if (!parent) return false;
    
    const newParentId = parent.parentId ?? null;
    const newLevel = Math.max(0, (task.level ?? 1) - 1);
    
    const taskWithDescendants = [taskId, ...this.getDescendants(taskId).map(d => d.id)];
    const levelDelta = newLevel - (task.level ?? 0);
    
    const dataWithoutTask = this.data.filter(t => !taskWithDescendants.includes(t.id));
    const taskItems = this.data.filter(t => taskWithDescendants.includes(t.id));
    
    const updatedTaskItems = taskItems.map(t => {
      if (t.id === taskId) {
        return { ...t, parentId: newParentId, level: newLevel };
      }
      return { ...t, level: (t.level ?? 0) + levelDelta };
    });
    
    const parentIndex = dataWithoutTask.findIndex(t => t.id === parent.id);
    const parentDescendants = this.getDescendants(parent.id).filter(d => !taskWithDescendants.includes(d.id));
    const insertIndex = parentIndex + 1 + parentDescendants.length;
    
    const remainingChildren = this.getChildren(parent.id).filter(c => !taskWithDescendants.includes(c.id));
    const parentNeedsUpdate = remainingChildren.length === 0;
    
    const updatedDataWithoutTask = dataWithoutTask.map(t => {
      if (t.id === parent.id && parentNeedsUpdate) {
        return { ...t, isGroup: false };
      }
      return t;
    });
    
    const newData = [
      ...updatedDataWithoutTask.slice(0, insertIndex),
      ...updatedTaskItems,
      ...updatedDataWithoutTask.slice(insertIndex)
    ];
    
    this.setData(newData);
    this.generateWBSCodes();
    
    return true;
  }

  /**
   * Indent multiple tasks - processes in visual order
   */
  indentTasks(taskIds: string[]): boolean {
    if (taskIds.length === 0) return false;
    
    let success = true;
    for (const taskId of taskIds) {
      if (!this.indentTask(taskId)) {
        success = false;
      }
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
    
    for (const taskId of reversedIds) {
      if (!this.outdentTask(taskId)) {
        success = false;
      }
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
