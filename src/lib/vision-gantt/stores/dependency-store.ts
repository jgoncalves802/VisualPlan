
/**
 * DependencyStore - Manages task dependencies
 */

import { BaseStore } from './base-store';
import type { Dependency, DependencyType } from '../types';
import { hasCircularDependency, getPredecessors, getSuccessors } from '../utils';

export class DependencyStore extends BaseStore<Dependency> {
  /**
   * Create a new dependency with validation
   */
  createDependency(
    fromTaskId: string,
    toTaskId: string,
    type: DependencyType = 'FS',
    lag: number = 0
  ): boolean {
    // Validate: cannot link task to itself
    if (fromTaskId === toTaskId) {
      console.warn('Cannot create dependency from task to itself');
      return false;
    }

    // Validate: check for circular dependencies
    if (hasCircularDependency(fromTaskId, toTaskId, this.data)) {
      console.warn('Cannot create dependency: would create circular reference');
      return false;
    }

    // Check if dependency already exists
    const exists = this.data.some(
      (dep) =>
        dep?.fromTaskId === fromTaskId &&
        dep?.toTaskId === toTaskId &&
        dep?.type === type
    );

    if (exists) {
      console.warn('Dependency already exists');
      return false;
    }

    // Create dependency
    const dependency: Dependency = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromTaskId,
      toTaskId,
      type,
      lag
    };

    this.add(dependency);
    return true;
  }

  /**
   * Get dependencies for a task (both predecessors and successors)
   */
  getTaskDependencies(taskId: string): {
    predecessors: Dependency[];
    successors: Dependency[];
  } {
    return {
      predecessors: getPredecessors(taskId, this.data),
      successors: getSuccessors(taskId, this.data)
    };
  }

  /**
   * Get all predecessors of a task
   */
  getPredecessors(taskId: string): Dependency[] {
    return getPredecessors(taskId, this.data);
  }

  /**
   * Get all successors of a task
   */
  getSuccessors(taskId: string): Dependency[] {
    return getSuccessors(taskId, this.data);
  }

  /**
   * Remove all dependencies for a task
   */
  removeTaskDependencies(taskId: string): void {
    this.data = this.data.filter(
      (dep) => dep?.fromTaskId !== taskId && dep?.toTaskId !== taskId
    );
    this.notify();
  }

  /**
   * Update dependency type
   */
  updateDependencyType(dependencyId: string, type: DependencyType): void {
    this.update(dependencyId, { type });
  }

  /**
   * Update dependency lag
   */
  updateDependencyLag(dependencyId: string, lag: number): void {
    this.update(dependencyId, { lag });
  }

  /**
   * Find dependency between two tasks
   */
  findDependency(fromTaskId: string, toTaskId: string): Dependency | undefined {
    return this.data.find(
      (dep) => dep?.fromTaskId === fromTaskId && dep?.toTaskId === toTaskId
    );
  }

  /**
   * Check if two tasks are connected
   */
  areTasksConnected(taskId1: string, taskId2: string): boolean {
    return this.data.some(
      (dep) =>
        (dep?.fromTaskId === taskId1 && dep?.toTaskId === taskId2) ||
        (dep?.fromTaskId === taskId2 && dep?.toTaskId === taskId1)
    );
  }
}
