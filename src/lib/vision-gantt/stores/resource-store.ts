

/**
 * ResourceStore - Manages resources, allocations, and conflicts
 */



import type { Resource } from '../types';
import type {
  ResourceAllocation,
  ResourceAvailability,
  ResourceConflict,
  DateRange
} from '../types/advanced-features';
import {
  detectResourceConflicts,
  levelResources,
  calculateResourceUtilization
} from '../utils/resource-utils';
import type { Task } from '../types';

export class ResourceStore {
  private resources: Resource[] = [];
  private allocations: ResourceAllocation[] = [];
  private availabilities: ResourceAvailability[] = [];
  private conflicts: ResourceConflict[] = [];
  private listeners = new Set<() => void>();

  constructor(
    initialResources: Resource[] = [],
    initialAllocations: ResourceAllocation[] = [],
    initialAvailabilities: ResourceAvailability[] = []
  ) {
    this.resources = initialResources;
    this.allocations = initialAllocations;
    this.availabilities = initialAvailabilities;
    this.updateConflicts();
  }

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Resource management
  getResources(): Resource[] {
    return this.resources;
  }

  getResourceById(id: string): Resource | undefined {
    return this.resources.find(r => r.id === id);
  }

  addResource(resource: Resource) {
    this.resources.push(resource);
    this.notify();
  }

  updateResource(id: string, updates: Partial<Resource>) {
    const index = this.resources.findIndex(r => r.id === id);
    if (index !== -1) {
      this.resources[index] = { ...this.resources[index], ...updates };
      this.notify();
    }
  }

  removeResource(id: string) {
    this.resources = this.resources.filter(r => r.id !== id);
    this.allocations = this.allocations.filter(a => a.resourceId !== id);
    this.updateConflicts();
    this.notify();
  }

  // Allocation management
  getAllocations(): ResourceAllocation[] {
    return this.allocations;
  }

  getAllocationsByResource(resourceId: string): ResourceAllocation[] {
    return this.allocations.filter(a => a.resourceId === resourceId);
  }

  getAllocationsByTask(taskId: string): ResourceAllocation[] {
    return this.allocations.filter(a => a.taskId === taskId);
  }

  addAllocation(allocation: ResourceAllocation) {
    this.allocations.push(allocation);
    this.updateConflicts();
    this.notify();
  }

  updateAllocation(id: string, updates: Partial<ResourceAllocation>) {
    const index = this.allocations.findIndex(a => a.id === id);
    if (index !== -1) {
      this.allocations[index] = { ...this.allocations[index], ...updates };
      this.updateConflicts();
      this.notify();
    }
  }

  removeAllocation(id: string) {
    this.allocations = this.allocations.filter(a => a.id !== id);
    this.updateConflicts();
    this.notify();
  }

  // Availability management
  getAvailabilities(): ResourceAvailability[] {
    return this.availabilities;
  }

  addAvailability(availability: ResourceAvailability) {
    this.availabilities.push(availability);
    this.updateConflicts();
    this.notify();
  }

  removeAvailability(resourceId: string, startDate: Date) {
    this.availabilities = this.availabilities.filter(
      a => !(a.resourceId === resourceId && a.startDate.getTime() === startDate.getTime())
    );
    this.updateConflicts();
    this.notify();
  }

  // Conflict detection
  getConflicts(): ResourceConflict[] {
    return this.conflicts;
  }

  getConflictsByResource(resourceId: string): ResourceConflict[] {
    return this.conflicts.filter(c => c.resourceId === resourceId);
  }

  private updateConflicts() {
    if (this.resources.length === 0 || this.allocations.length === 0) {
      this.conflicts = [];
      return;
    }

    // Calculate date range from allocations
    const startDates = this.allocations.map(a => a.startDate.getTime());
    const endDates = this.allocations.map(a => a.endDate.getTime());
    
    if (startDates.length === 0 || endDates.length === 0) {
      this.conflicts = [];
      return;
    }

    const dateRange: DateRange = {
      startDate: new Date(Math.min(...startDates)),
      endDate: new Date(Math.max(...endDates))
    };

    this.conflicts = detectResourceConflicts(
      this.allocations,
      this.availabilities,
      dateRange,
      this.resources
    );
  }

  // Resource leveling
  async levelResources(
    tasks: Task[],
    options: {
      mode: 'automatic' | 'manual';
      strategy: 'delay_tasks' | 'split_tasks' | 'reduce_allocation';
      priority: 'earliest_start' | 'critical_path' | 'task_priority';
    }
  ): Promise<{ tasks: Task[]; allocations: ResourceAllocation[]; conflicts: ResourceConflict[] }> {
    const result = levelResources(
      tasks,
      this.allocations,
      this.availabilities,
      this.resources,
      {
        ...options,
        allowTaskSplitting: options.strategy === 'split_tasks',
        respectTaskConstraints: true
      }
    );

    // Update internal state
    this.allocations = result.allocations;
    this.conflicts = result.conflicts;
    this.notify();

    return result;
  }

  // Utilization
  getResourceUtilization(resourceId: string, dateRange: DateRange): number {
    const resource = this.getResourceById(resourceId);
    if (!resource) return 0;

    return calculateResourceUtilization(
      resourceId,
      this.allocations,
      this.availabilities,
      dateRange,
      resource.capacity ?? 8
    );
  }

  // Statistics
  getStats() {
    const totalResources = this.resources.length;
    const totalAllocations = this.allocations.length;
    const totalConflicts = this.conflicts.length;
    const criticalConflicts = this.conflicts.filter(c => c.severity === 'critical').length;

    return {
      totalResources,
      totalAllocations,
      totalConflicts,
      criticalConflicts
    };
  }
}

