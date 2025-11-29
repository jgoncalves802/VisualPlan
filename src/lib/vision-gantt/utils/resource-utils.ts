

/**
 * Resource Management Utilities
 * RF-L06 to RF-L10: Advanced Resource Allocation
 */

import { differenceInDays, eachDayOfInterval, isWithinInterval } from 'date-fns';
import type {
  ResourceAllocation,
  ResourceAvailability,
  ResourceConflict,
  ResourceLevelingOptions,
  DateRange
} from '../types/advanced-features';
import type { Task, Resource } from '../types';

/**
 * Calculate resource allocation for a specific date
 */
export function calculateResourceAllocation(
  resourceId: string,
  date: Date,
  allocations: ResourceAllocation[]
): number {
  return allocations
    .filter(alloc =>
      alloc.resourceId === resourceId &&
      isWithinInterval(date, { start: alloc.startDate, end: alloc.endDate })
    )
    .reduce((total, alloc) => total + alloc.units, 0);
}

/**
 * Get resource availability for a specific date
 */
export function getResourceAvailability(
  resourceId: string,
  date: Date,
  availabilities: ResourceAvailability[],
  defaultCapacity: number = 8 // 8 hours per day
): number {
  const availability = availabilities.find(avail =>
    avail.resourceId === resourceId &&
    isWithinInterval(date, { start: avail.startDate, end: avail.endDate })
  );

  return availability ? availability.availableUnits : defaultCapacity;
}

/**
 * Detect resource conflicts (overallocation)
 */
export function detectResourceConflicts(
  allocations: ResourceAllocation[],
  availabilities: ResourceAvailability[],
  dateRange: DateRange,
  resources: Resource[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const dates = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

  resources.forEach(resource => {
    dates.forEach(date => {
      const allocated = calculateResourceAllocation(resource.id, date, allocations);
      const available = getResourceAvailability(resource.id, date, availabilities, resource.capacity);

      if (allocated > available) {
        const overallocation = allocated - available;
        const affectedTasks = allocations
          .filter(alloc =>
            alloc.resourceId === resource.id &&
            isWithinInterval(date, { start: alloc.startDate, end: alloc.endDate })
          )
          .map(alloc => alloc.taskId);

        const severity: ResourceConflict['severity'] =
          overallocation > available * 0.5 ? 'critical' :
          overallocation > available * 0.3 ? 'high' :
          overallocation > available * 0.1 ? 'medium' : 'low';

        conflicts.push({
          id: `conflict-${resource.id}-${date.getTime()}`,
          resourceId: resource.id,
          date,
          allocatedUnits: allocated,
          availableUnits: available,
          overallocation,
          affectedTasks,
          severity
        });
      }
    });
  });

  return conflicts;
}

/**
 * Level resources by adjusting task dates
 */
export function levelResources(
  tasks: Task[],
  allocations: ResourceAllocation[],
  availabilities: ResourceAvailability[],
  resources: Resource[],
  options: ResourceLevelingOptions
): { tasks: Task[]; allocations: ResourceAllocation[]; conflicts: ResourceConflict[] } {
  // Clone data to avoid mutation
  let adjustedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  let adjustedAllocations = JSON.parse(JSON.stringify(allocations)) as ResourceAllocation[];

  if (options.mode === 'automatic') {
    // Detect initial conflicts
    const dateRange = {
      startDate: new Date(Math.min(...tasks.map(t => t.startDate.getTime()))),
      endDate: new Date(Math.max(...tasks.map(t => t.endDate.getTime())))
    };

    let conflicts = detectResourceConflicts(adjustedAllocations, availabilities, dateRange, resources);
    let iterations = 0;
    const maxIterations = options.maxIterations ?? 100;

    // Iteratively resolve conflicts
    while (conflicts.length > 0 && iterations < maxIterations) {
      // Sort conflicts by severity
      conflicts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      // Handle the most severe conflict
      const conflict = conflicts[0];
      
      if (options.strategy === 'delay_tasks') {
        // Delay one of the affected tasks
        const taskToDelay = adjustedTasks.find(t => conflict.affectedTasks.includes(t.id));
        if (taskToDelay) {
          const delay = Math.ceil(conflict.overallocation / conflict.availableUnits);
          const newStartDate = new Date(taskToDelay.startDate);
          newStartDate.setDate(newStartDate.getDate() + delay);
          const newEndDate = new Date(taskToDelay.endDate);
          newEndDate.setDate(newEndDate.getDate() + delay);

          taskToDelay.startDate = newStartDate;
          taskToDelay.endDate = newEndDate;

          // Update allocations
          adjustedAllocations = adjustedAllocations.map(alloc => {
            if (alloc.taskId === taskToDelay.id) {
              return {
                ...alloc,
                startDate: newStartDate,
                endDate: newEndDate
              };
            }
            return alloc;
          });
        }
      } else if (options.strategy === 'reduce_allocation') {
        // Reduce allocation percentage
        const reduction = conflict.overallocation / conflict.affectedTasks.length;
        adjustedAllocations = adjustedAllocations.map(alloc => {
          if (conflict.affectedTasks.includes(alloc.taskId)) {
            return {
              ...alloc,
              units: Math.max(0, alloc.units - reduction)
            };
          }
          return alloc;
        });
      }

      // Recalculate conflicts
      conflicts = detectResourceConflicts(adjustedAllocations, availabilities, dateRange, resources);
      iterations++;
    }

    return {
      tasks: adjustedTasks,
      allocations: adjustedAllocations,
      conflicts
    };
  }

  // Manual mode: just return conflicts without auto-resolution
  const dateRange = {
    startDate: new Date(Math.min(...tasks.map(t => t.startDate.getTime()))),
    endDate: new Date(Math.max(...tasks.map(t => t.endDate.getTime())))
  };

  const conflicts = detectResourceConflicts(adjustedAllocations, availabilities, dateRange, resources);

  return {
    tasks: adjustedTasks,
    allocations: adjustedAllocations,
    conflicts
  };
}

/**
 * Calculate resource utilization percentage
 */
export function calculateResourceUtilization(
  resourceId: string,
  allocations: ResourceAllocation[],
  availabilities: ResourceAvailability[],
  dateRange: DateRange,
  capacity: number = 8
): number {
  const dates = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });
  
  let totalAllocated = 0;
  let totalAvailable = 0;

  dates.forEach(date => {
    const allocated = calculateResourceAllocation(resourceId, date, allocations);
    const available = getResourceAvailability(resourceId, date, availabilities, capacity);
    
    totalAllocated += allocated;
    totalAvailable += available;
  });

  return totalAvailable > 0 ? (totalAllocated / totalAvailable) * 100 : 0;
}

/**
 * Get resource workload by date
 */
export function getResourceWorkload(
  resourceId: string,
  allocations: ResourceAllocation[],
  dateRange: DateRange
): Map<string, number> {
  const workload = new Map<string, number>();
  const dates = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

  dates.forEach(date => {
    const allocated = calculateResourceAllocation(resourceId, date, allocations);
    workload.set(date.toISOString().split('T')[0], allocated);
  });

  return workload;
}

/**
 * Find available resources for a task
 */
export function findAvailableResources(
  task: Task,
  resources: Resource[],
  allocations: ResourceAllocation[],
  availabilities: ResourceAvailability[],
  requiredUnits: number = 8
): Resource[] {
  const dates = eachDayOfInterval({ start: task.startDate, end: task.endDate });

  return resources.filter(resource => {
    // Check if resource is available for all days of the task
    return dates.every(date => {
      const allocated = calculateResourceAllocation(resource.id, date, allocations);
      const available = getResourceAvailability(resource.id, date, availabilities, resource.capacity);
      return (available - allocated) >= requiredUnits;
    });
  });
}

