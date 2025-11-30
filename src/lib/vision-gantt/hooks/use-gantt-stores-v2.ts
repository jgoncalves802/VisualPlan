/**
 * useGanttStoresV2 - Immutable state version using useTaskReducer
 * 
 * This is a SPIKE to test if the reducer pattern resolves indent/outdent issues.
 * Key differences from v1:
 * 1. Uses useTaskReducer instead of TaskStore class
 * 2. No refs - state is fully managed by React
 * 3. Transactional updates - all changes are atomic
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Task, Dependency, Resource } from '../types';
import type { WorkingCalendar } from '../types/advanced-features';
import { useTaskReducer } from './use-task-reducer';
import { DependencyStore } from '../stores';
import { CalendarStore } from '../stores/calendar-store';

export interface TaskStoreCompat {
  // Core data access
  getAll: () => Task[];
  getById: (id: string) => Task | undefined;
  getTaskById: (id: string) => Task | undefined;
  getTaskTree: () => Task[];
  getFlatTasks: () => Task[];
  
  // Hierarchy
  getChildren: (parentId: string) => Task[];
  getParent: (taskId: string) => Task | null;
  getDescendants: (taskId: string) => Task[];
  
  // Mutations
  update: (taskId: string, updates: Partial<Task>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setData: (tasks: Task[]) => void;
  
  // Hierarchy operations
  indentTask: (taskId: string) => boolean;
  outdentTask: (taskId: string) => boolean;
  indentTasks: (taskIds: string[]) => boolean;
  outdentTasks: (taskIds: string[]) => boolean;
  
  // Tree operations
  toggleExpansion: (taskId: string) => void;
  generateWBSCodes: () => void;
}

function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task & { children: Task[] }>();
  const rootTasks: Task[] = [];
  
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });
  
  tasks.forEach(task => {
    const node = taskMap.get(task.id)!;
    if (task.parentId) {
      const parent = taskMap.get(task.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        rootTasks.push(node);
      }
    } else {
      rootTasks.push(node);
    }
  });
  
  return rootTasks;
}

export function useGanttStoresV2(
  initialTasks: Task[],
  initialDependencies: Dependency[],
  _initialResources?: Resource[],
  initialCalendars?: WorkingCalendar[]
) {
  const taskReducer = useTaskReducer(initialTasks);
  
  // All hooks must be called unconditionally in the same order every render
  const dependencyStoreRef = useRef<DependencyStore | null>(null);
  const calendarStoreRef = useRef<CalendarStore | null>(null);
  // Use a stable hash that only changes when the dataset truly changes (new/removed tasks)
  // NOT when hierarchy changes (parentId/level) since those are internal mutations
  const lastTaskSetHashRef = useRef<string>(initialTasks.map(t => t.id).sort().join(','));
  // Track if we've already initialized to prevent re-sync on first render
  const hasInitializedTasksRef = useRef(true);

  // Lazy initialization - runs only once
  if (dependencyStoreRef.current === null) {
    dependencyStoreRef.current = new DependencyStore(initialDependencies);
  }
  if (calendarStoreRef.current === null) {
    calendarStoreRef.current = new CalendarStore(initialCalendars);
  }

  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  const [calendars, setCalendars] = useState<WorkingCalendar[]>(() => {
    return calendarStoreRef.current?.getCalendars() ?? [];
  });

  useEffect(() => {
    const depUnsubscribe = dependencyStoreRef.current?.subscribe(setDependencies);
    const calUnsubscribe = calendarStoreRef.current?.subscribe(() => {
      setCalendars(calendarStoreRef.current?.getCalendars() ?? []);
    });

    return () => {
      depUnsubscribe?.();
      calUnsubscribe?.();
    };
  }, []);

  // Sync external tasks ONLY when the dataset truly changes (tasks added/removed)
  // NOT when hierarchy changes (parentId/level) since those are internal mutations
  useEffect(() => {
    // Skip if already initialized - we already have the data
    if (hasInitializedTasksRef.current) {
      // Only sync if the set of task IDs changed (new tasks added or removed)
      const newTaskSetHash = initialTasks.map(t => t.id).sort().join(',');
      
      if (newTaskSetHash !== lastTaskSetHashRef.current) {
        console.log('[useGanttStoresV2] New dataset detected (IDs changed), syncing tasks');
        console.log('[useGanttStoresV2] Old hash:', lastTaskSetHashRef.current);
        console.log('[useGanttStoresV2] New hash:', newTaskSetHash);
        taskReducer.setTasks(initialTasks);
        lastTaskSetHashRef.current = newTaskSetHash;
      }
      // If IDs are the same, DON'T reset - hierarchy changes are internal
    }
  }, [initialTasks, taskReducer]);

  useEffect(() => {
    if (!dependencyStoreRef.current) return;
    
    const currentIds = dependencyStoreRef.current.getAll().map(d => d.id).sort().join(',');
    const newIds = initialDependencies.map(d => d.id).sort().join(',');
    
    if (newIds !== currentIds) {
      dependencyStoreRef.current.setData(initialDependencies);
    }
  }, [initialDependencies]);

  useEffect(() => {
    if (calendarStoreRef.current && initialCalendars) {
      calendarStoreRef.current.setCalendars(initialCalendars);
    }
  }, [initialCalendars]);

  // Create TaskStore-compatible interface
  // Methods that read state derive from taskReducer.tasks (immutable)
  // Methods that write state are stable dispatchers from useTaskReducer
  const taskStore: TaskStoreCompat = useMemo(() => ({
    // Read methods - derive from current immutable state
    getAll: () => taskReducer.tasks,
    getById: (id: string) => taskReducer.tasks.find(t => t.id === id),
    getTaskById: (id: string) => taskReducer.tasks.find(t => t.id === id),
    getTaskTree: () => buildTaskTree(taskReducer.tasks),
    getFlatTasks: () => {
      // Compute flat tasks respecting expand/collapse
      const result: Task[] = [];
      const collapsedParents = new Set<string>();
      
      taskReducer.tasks.forEach(t => {
        if (t.isGroup && t.expanded === false) {
          collapsedParents.add(t.id);
        }
      });
      
      taskReducer.tasks.forEach(task => {
        let isHidden = false;
        let currentParentId = task.parentId;
        
        while (currentParentId) {
          if (collapsedParents.has(currentParentId)) {
            isHidden = true;
            break;
          }
          const parent = taskReducer.tasks.find(t => t.id === currentParentId);
          currentParentId = parent?.parentId;
        }
        
        if (!isHidden) {
          result.push(task);
        }
      });
      
      return result;
    },
    
    getChildren: (parentId: string) => taskReducer.tasks.filter(t => t.parentId === parentId),
    getParent: (taskId: string) => {
      const task = taskReducer.tasks.find(t => t.id === taskId);
      if (!task?.parentId) return null;
      return taskReducer.tasks.find(t => t.id === task.parentId) ?? null;
    },
    getDescendants: (taskId: string) => {
      const descendants: Task[] = [];
      const children = taskReducer.tasks.filter(t => t.parentId === taskId);
      const getChildDescendants = (pid: string): Task[] => {
        const result: Task[] = [];
        const kids = taskReducer.tasks.filter(t => t.parentId === pid);
        for (const child of kids) {
          result.push(child);
          result.push(...getChildDescendants(child.id));
        }
        return result;
      };
      for (const child of children) {
        descendants.push(child);
        descendants.push(...getChildDescendants(child.id));
      }
      return descendants;
    },
    
    // Write methods - use stable dispatchers from reducer
    update: taskReducer.updateTask,
    updateTask: taskReducer.updateTask,
    setData: taskReducer.setTasks,
    
    indentTask: taskReducer.indentTask,
    outdentTask: taskReducer.outdentTask,
    indentTasks: taskReducer.indentTasks,
    outdentTasks: taskReducer.outdentTasks,
    
    toggleExpansion: taskReducer.toggleExpansion,
    generateWBSCodes: () => {
      // WBS codes are auto-generated in the reducer
    }
  }), [taskReducer.tasks, taskReducer.updateTask, taskReducer.setTasks, taskReducer.indentTask, taskReducer.outdentTask, taskReducer.indentTasks, taskReducer.outdentTasks, taskReducer.toggleExpansion]);

  return {
    taskStore,
    dependencyStore: dependencyStoreRef.current!,
    calendarStore: calendarStoreRef.current!,
    tasks: taskReducer.tasks,
    dependencies,
    calendars,
    // Expose version for debugging
    taskVersion: taskReducer.version
  };
}
