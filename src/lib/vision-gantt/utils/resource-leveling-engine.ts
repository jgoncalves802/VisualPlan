import { Resource } from '@/services/resourceService';

export interface LevelingTask {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  totalFloat: number;
  isCritical: boolean;
  priority: number;
  predecessors: string[];
  successors: string[];
  allocations: LevelingAllocation[];
  originalStartDate: Date;
  originalEndDate: Date;
  isLeveled: boolean;
}

export interface LevelingAllocation {
  resourceId: string;
  resource: Resource;
  unidades: number;
  unitsPerTime: number;
}

export interface LevelingResult {
  tasks: LevelingTask[];
  conflicts: ResourceConflict[];
  summary: LevelingSummary;
  levelingLog: LevelingLogEntry[];
}

export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  date: Date;
  requiredHours: number;
  availableHours: number;
  overallocation: number;
  affectedTasks: string[];
}

export interface LevelingSummary {
  totalTasksLeveled: number;
  totalDaysAdded: number;
  originalDuration: number;
  leveledDuration: number;
  conflictsResolved: number;
  conflictsRemaining: number;
}

export interface LevelingLogEntry {
  timestamp: Date;
  action: 'delay' | 'split' | 'reduce' | 'resolve';
  taskId: string;
  taskName: string;
  reason: string;
  daysDelayed?: number;
  newStartDate?: Date;
  newEndDate?: Date;
}

export interface LevelingOptions {
  levelingPriority: 'total_float' | 'priority' | 'start_date' | 'resource_id';
  levelingMethod: 'delay_only' | 'split_tasks' | 'reduce_units';
  respectPredecessors: boolean;
  levelCriticalPath: boolean;
  maxIterations: number;
  projectEndDate?: Date;
}

const DEFAULT_OPTIONS: LevelingOptions = {
  levelingPriority: 'total_float',
  levelingMethod: 'delay_only',
  respectPredecessors: true,
  levelCriticalPath: false,
  maxIterations: 1000,
};

function getWorkingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return result;
}

function isWorkingDay(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6;
}

export function calculateResourceUsage(
  tasks: LevelingTask[],
  resources: Resource[],
  startDate: Date,
  endDate: Date
): Map<string, Map<string, number>> {
  const usage = new Map<string, Map<string, number>>();
  
  resources.forEach(resource => {
    usage.set(resource.id, new Map());
  });
  
  const current = new Date(startDate);
  while (current <= endDate) {
    if (isWorkingDay(current)) {
      const dateKey = current.toISOString().split('T')[0];
      
      tasks.forEach(task => {
        if (current >= task.startDate && current <= task.endDate) {
          task.allocations.forEach(alloc => {
            const resourceUsage = usage.get(alloc.resourceId);
            if (resourceUsage) {
              const currentUsage = resourceUsage.get(dateKey) || 0;
              const dailyHours = (alloc.unidades / 100) * alloc.unitsPerTime;
              resourceUsage.set(dateKey, currentUsage + dailyHours);
            }
          });
        }
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return usage;
}

export function findResourceConflicts(
  tasks: LevelingTask[],
  resources: Resource[],
  startDate: Date,
  endDate: Date
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const usage = calculateResourceUsage(tasks, resources, startDate, endDate);
  
  resources.forEach(resource => {
    const resourceUsage = usage.get(resource.id);
    if (!resourceUsage) return;
    
    resourceUsage.forEach((hours, dateKey) => {
      if (hours > resource.capacidadeDiaria) {
        const affectedTasks = tasks
          .filter(task => {
            const taskDate = new Date(dateKey);
            return taskDate >= task.startDate && 
                   taskDate <= task.endDate && 
                   task.allocations.some(a => a.resourceId === resource.id);
          })
          .map(t => t.id);
        
        conflicts.push({
          resourceId: resource.id,
          resourceName: resource.nome,
          date: new Date(dateKey),
          requiredHours: hours,
          availableHours: resource.capacidadeDiaria,
          overallocation: hours - resource.capacidadeDiaria,
          affectedTasks,
        });
      }
    });
  });
  
  return conflicts.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function updateSuccessors(tasks: LevelingTask[], predecessorId: string, predecessorEndDate: Date): void {
  const successorTasks = tasks.filter(t => t.predecessors.includes(predecessorId));
  
  for (const successor of successorTasks) {
    const earliestStart = addWorkingDays(predecessorEndDate, 1);
    
    if (earliestStart > successor.startDate) {
      const taskIndex = tasks.findIndex(t => t.id === successor.id);
      if (taskIndex !== -1) {
        const taskDuration = successor.duration;
        const newEndDate = addWorkingDays(earliestStart, taskDuration - 1);
        
        tasks[taskIndex].startDate = earliestStart;
        tasks[taskIndex].endDate = newEndDate;
        tasks[taskIndex].isLeveled = true;
        
        updateSuccessors(tasks, successor.id, newEndDate);
      }
    }
  }
}

function sortTasksForLeveling(tasks: LevelingTask[], priority: LevelingOptions['levelingPriority']): LevelingTask[] {
  return [...tasks].sort((a, b) => {
    switch (priority) {
      case 'total_float':
        return a.totalFloat - b.totalFloat;
      case 'priority':
        return b.priority - a.priority;
      case 'start_date':
        return a.startDate.getTime() - b.startDate.getTime();
      case 'resource_id':
        const aResource = a.allocations[0]?.resourceId || '';
        const bResource = b.allocations[0]?.resourceId || '';
        return aResource.localeCompare(bResource);
      default:
        return a.totalFloat - b.totalFloat;
    }
  });
}

export function findEarliestStartDate(
  task: LevelingTask,
  allTasks: LevelingTask[],
  respectPredecessors: boolean
): Date {
  if (!respectPredecessors || task.predecessors.length === 0) {
    return task.originalStartDate;
  }
  
  let latestPredecessorEnd = task.originalStartDate;
  
  task.predecessors.forEach(predId => {
    const predecessor = allTasks.find(t => t.id === predId);
    if (predecessor && predecessor.endDate > latestPredecessorEnd) {
      latestPredecessorEnd = predecessor.endDate;
    }
  });
  
  return addWorkingDays(latestPredecessorEnd, 1);
}

export function levelResources(
  inputTasks: LevelingTask[],
  resources: Resource[],
  options: Partial<LevelingOptions> = {}
): LevelingResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const tasks = inputTasks.map(t => ({ 
    ...t, 
    startDate: new Date(t.startDate),
    endDate: new Date(t.endDate),
    originalStartDate: new Date(t.originalStartDate),
    originalEndDate: new Date(t.originalEndDate),
  }));
  
  const levelingLog: LevelingLogEntry[] = [];
  let iteration = 0;
  
  const getProjectDates = () => {
    const starts = tasks.map(t => t.startDate.getTime());
    const ends = tasks.map(t => t.endDate.getTime());
    return {
      start: new Date(Math.min(...starts)),
      end: new Date(Math.max(...ends)),
    };
  };
  
  let { start: projectStart, end: projectEnd } = getProjectDates();
  const originalDuration = getWorkingDaysBetween(projectStart, projectEnd);
  
  let conflicts = findResourceConflicts(tasks, resources, projectStart, projectEnd);
  const initialConflictCount = conflicts.length;
  
  while (conflicts.length > 0 && iteration < opts.maxIterations) {
    iteration++;
    
    const conflict = conflicts[0];
    
    const affectedTasks = tasks.filter(t => conflict.affectedTasks.includes(t.id));
    
    const sortedTasks = sortTasksForLeveling(affectedTasks, opts.levelingPriority);
    
    const taskToDelay = sortedTasks.find(t => {
      if (!opts.levelCriticalPath && t.isCritical) return false;
      return true;
    }) || sortedTasks[sortedTasks.length - 1];
    
    if (!taskToDelay) break;
    
    const taskIndex = tasks.findIndex(t => t.id === taskToDelay.id);
    if (taskIndex === -1) break;
    
    if (opts.levelingMethod === 'delay_only') {
      const daysToDelay = 1;
      const newStartDate = addWorkingDays(tasks[taskIndex].startDate, daysToDelay);
      const newEndDate = addWorkingDays(tasks[taskIndex].endDate, daysToDelay);
      
      tasks[taskIndex].startDate = newStartDate;
      tasks[taskIndex].endDate = newEndDate;
      tasks[taskIndex].isLeveled = true;
      
      if (opts.respectPredecessors) {
        updateSuccessors(tasks, taskToDelay.id, newEndDate);
      }
      
      levelingLog.push({
        timestamp: new Date(),
        action: 'delay',
        taskId: taskToDelay.id,
        taskName: taskToDelay.name,
        reason: `Conflito de recurso: ${conflict.resourceName} em ${conflict.date.toISOString().split('T')[0]}`,
        daysDelayed: daysToDelay,
        newStartDate,
        newEndDate,
      });
    } else if (opts.levelingMethod === 'reduce_units') {
      const allocation = tasks[taskIndex].allocations.find(a => a.resourceId === conflict.resourceId);
      if (allocation) {
        const resource = resources.find(r => r.id === conflict.resourceId);
        if (resource) {
          const maxUnits = (resource.capacidadeDiaria / allocation.unitsPerTime) * 100 * 0.9;
          allocation.unidades = Math.min(allocation.unidades, maxUnits);
          
          levelingLog.push({
            timestamp: new Date(),
            action: 'reduce',
            taskId: taskToDelay.id,
            taskName: taskToDelay.name,
            reason: `Redução de unidades para evitar sobre-alocação de ${conflict.resourceName}`,
          });
        }
      }
    }
    
    const newDates = getProjectDates();
    projectStart = newDates.start;
    projectEnd = newDates.end;
    
    conflicts = findResourceConflicts(tasks, resources, projectStart, projectEnd);
  }
  
  const finalDuration = getWorkingDaysBetween(projectStart, projectEnd);
  const conflictsRemaining = conflicts.length;
  
  return {
    tasks,
    conflicts,
    summary: {
      totalTasksLeveled: tasks.filter(t => t.isLeveled).length,
      totalDaysAdded: finalDuration - originalDuration,
      originalDuration,
      leveledDuration: finalDuration,
      conflictsResolved: initialConflictCount - conflictsRemaining,
      conflictsRemaining,
    },
    levelingLog,
  };
}

export function simulateLeveling(
  tasks: LevelingTask[],
  resources: Resource[],
  options: Partial<LevelingOptions> = {}
): LevelingSummary {
  const result = levelResources(tasks, resources, options);
  return result.summary;
}

export function getResourceUtilization(
  tasks: LevelingTask[],
  resources: Resource[],
  startDate: Date,
  endDate: Date
): Map<string, { total: number; used: number; utilization: number }> {
  const utilization = new Map<string, { total: number; used: number; utilization: number }>();
  const usage = calculateResourceUsage(tasks, resources, startDate, endDate);
  const workingDays = getWorkingDaysBetween(startDate, endDate);
  
  resources.forEach(resource => {
    const resourceUsage = usage.get(resource.id);
    let usedHours = 0;
    
    if (resourceUsage) {
      resourceUsage.forEach(hours => {
        usedHours += hours;
      });
    }
    
    const totalCapacity = resource.capacidadeDiaria * workingDays;
    
    utilization.set(resource.id, {
      total: totalCapacity,
      used: usedHours,
      utilization: totalCapacity > 0 ? (usedHours / totalCapacity) * 100 : 0,
    });
  });
  
  return utilization;
}

export default {
  levelResources,
  simulateLeveling,
  findResourceConflicts,
  calculateResourceUsage,
  getResourceUtilization,
};
