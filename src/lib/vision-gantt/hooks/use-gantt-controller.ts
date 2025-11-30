/**
 * useGanttController - SINGLE SOURCE OF TRUTH for Gantt tasks
 * 
 * This controller owns all task state and hierarchy. External stores
 * (cronogramaStore) receive updates via one-way event emission.
 * 
 * Key principles:
 * 1. Tasks are initialized ONCE from props
 * 2. All mutations happen internally
 * 3. Changes emit to external store but NEVER read back from it
 * 4. Only task ID changes (add/remove) trigger re-initialization
 */

import { useReducer, useCallback, useRef, useEffect } from 'react';
import type { Task } from '../types';

type TaskAction =
  | { type: 'INIT_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'INDENT_TASK'; payload: { taskId: string } }
  | { type: 'OUTDENT_TASK'; payload: { taskId: string } }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_TASK'; payload: { task: Task; afterTaskId?: string } }
  | { type: 'TOGGLE_EXPANSION'; payload: { taskId: string } };

interface TaskState {
  tasks: Task[];
  version: number;
}

function generateWBSCodes(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const wbsMap = new Map<string, string>();
  const childCounters = new Map<string | null, number>();
  
  function resolveWbs(taskId: string): string {
    const cached = wbsMap.get(taskId);
    if (cached !== undefined) return cached;
    
    const task = taskMap.get(taskId);
    if (!task) return '1';
    
    const parentId = task.parentId ?? null;
    let parentWbs = '';
    if (parentId) {
      parentWbs = resolveWbs(parentId);
    }
    
    const count = (childCounters.get(parentId) ?? 0) + 1;
    childCounters.set(parentId, count);
    
    const wbs = parentWbs ? `${parentWbs}.${count}` : `${count}`;
    wbsMap.set(taskId, wbs);
    
    return wbs;
  }
  
  for (const task of tasks) {
    if (!wbsMap.has(task.id)) {
      resolveWbs(task.id);
    }
  }
  
  return tasks.map(task => ({
    ...task,
    wbs: wbsMap.get(task.id) ?? task.wbs ?? '1'
  }));
}

function getChildren(tasks: Task[], parentId: string): Task[] {
  return tasks.filter(t => t.parentId === parentId);
}

function getDescendants(tasks: Task[], taskId: string): Task[] {
  const descendants: Task[] = [];
  const children = getChildren(tasks, taskId);
  
  for (const child of children) {
    descendants.push(child);
    descendants.push(...getDescendants(tasks, child.id));
  }
  
  return descendants;
}

function getPrevSibling(tasks: Task[], taskId: string): Task | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  const parentId = task.parentId ?? null;
  const siblings = tasks.filter(t => (t.parentId ?? null) === parentId);
  const taskIndex = siblings.findIndex(t => t.id === taskId);
  
  if (taskIndex <= 0) return null;
  return siblings[taskIndex - 1];
}

function getParent(tasks: Task[], taskId: string): Task | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task?.parentId) return null;
  return tasks.find(t => t.id === task.parentId) ?? null;
}

function indentSingleTask(tasks: Task[], taskId: string): { tasks: Task[]; affected: Task[] } | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return null;
  
  const prevSibling = getPrevSibling(tasks, taskId);
  if (!prevSibling) return null;
  
  const descendants = getDescendants(tasks, taskId);
  const descendantIds = new Set(descendants.map(d => d.id));
  
  const affected: Task[] = [];
  
  let updatedTasks = tasks.map(t => {
    if (t.id === taskId) {
      const updated = {
        ...t,
        parentId: prevSibling.id,
        level: (prevSibling.level ?? 0) + 1
      };
      affected.push(updated);
      return updated;
    }
    if (descendantIds.has(t.id)) {
      const currentLevel = t.level ?? 0;
      const oldParentLevel = task.level ?? 0;
      const newParentLevel = (prevSibling.level ?? 0) + 1;
      const levelDiff = newParentLevel - oldParentLevel;
      const updated = {
        ...t,
        level: currentLevel + levelDiff
      };
      affected.push(updated);
      return updated;
    }
    return t;
  });
  
  // Mark new parent as group
  updatedTasks = updatedTasks.map(t => {
    if (t.id === prevSibling.id && !t.isGroup) {
      const updated = { ...t, isGroup: true, expanded: true };
      affected.push(updated);
      return updated;
    }
    return t;
  });
  
  // Check if old parent still has children
  const oldParentId = task.parentId;
  if (oldParentId) {
    const oldParentStillHasChildren = updatedTasks.some(
      t => t.parentId === oldParentId && t.id !== taskId
    );
    if (!oldParentStillHasChildren) {
      updatedTasks = updatedTasks.map(t => {
        if (t.id === oldParentId && t.isGroup) {
          const updated = { ...t, isGroup: false };
          affected.push(updated);
          return updated;
        }
        return t;
      });
    }
  }
  
  return { tasks: generateWBSCodes(updatedTasks), affected };
}

function outdentSingleTask(tasks: Task[], taskId: string): { tasks: Task[]; affected: Task[] } | null {
  const task = tasks.find(t => t.id === taskId);
  if (!task?.parentId) return null;
  
  const parent = getParent(tasks, taskId);
  if (!parent) return null;
  
  const descendants = getDescendants(tasks, taskId);
  const descendantIds = new Set(descendants.map(d => d.id));
  
  const affected: Task[] = [];
  const newParentId = parent.parentId ?? null;
  const newLevel = parent.level ?? 0;
  
  let updatedTasks = tasks.map(t => {
    if (t.id === taskId) {
      const updated = {
        ...t,
        parentId: newParentId,
        level: newLevel
      };
      affected.push(updated);
      return updated;
    }
    if (descendantIds.has(t.id)) {
      const currentLevel = t.level ?? 0;
      const oldLevel = task.level ?? 0;
      const levelDiff = newLevel - oldLevel;
      const updated = {
        ...t,
        level: currentLevel + levelDiff
      };
      affected.push(updated);
      return updated;
    }
    return t;
  });
  
  // Check if old parent still has children
  const oldParentStillHasChildren = updatedTasks.some(
    t => t.parentId === task.parentId && t.id !== taskId
  );
  if (!oldParentStillHasChildren) {
    updatedTasks = updatedTasks.map(t => {
      if (t.id === task.parentId && t.isGroup) {
        const updated = { ...t, isGroup: false };
        affected.push(updated);
        return updated;
      }
      return t;
    });
  }
  
  // Mark new parent as group if needed
  if (newParentId) {
    updatedTasks = updatedTasks.map(t => {
      if (t.id === newParentId && !t.isGroup) {
        const updated = { ...t, isGroup: true, expanded: true };
        affected.push(updated);
        return updated;
      }
      return t;
    });
  }
  
  return { tasks: generateWBSCodes(updatedTasks), affected };
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'INIT_TASKS': {
      return {
        tasks: generateWBSCodes(action.payload),
        version: 0
      };
    }
    
    case 'UPDATE_TASK': {
      const { taskId, updates } = action.payload;
      const newTasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      );
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'INDENT_TASK': {
      const result = indentSingleTask(state.tasks, action.payload.taskId);
      if (!result) return state;
      
      console.log('[CONTROLLER] INDENT success:', action.payload.taskId, 
        'affected:', result.affected.map(t => ({ id: t.id, parentId: t.parentId, level: t.level })));
      
      return {
        tasks: result.tasks,
        version: state.version + 1
      };
    }
    
    case 'OUTDENT_TASK': {
      const result = outdentSingleTask(state.tasks, action.payload.taskId);
      if (!result) return state;
      
      console.log('[CONTROLLER] OUTDENT success:', action.payload.taskId,
        'affected:', result.affected.map(t => ({ id: t.id, parentId: t.parentId, level: t.level })));
      
      return {
        tasks: result.tasks,
        version: state.version + 1
      };
    }
    
    case 'TOGGLE_EXPANSION': {
      const { taskId } = action.payload;
      const newTasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, expanded: t.expanded === false ? true : false } : t
      );
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'DELETE_TASK': {
      const { taskId } = action.payload;
      const descendants = getDescendants(state.tasks, taskId);
      const idsToRemove = new Set([taskId, ...descendants.map(d => d.id)]);
      const newTasks = state.tasks.filter(t => !idsToRemove.has(t.id));
      return {
        tasks: generateWBSCodes(newTasks),
        version: state.version + 1
      };
    }
    
    case 'ADD_TASK': {
      const { task, afterTaskId } = action.payload;
      let newTasks: Task[];
      
      if (afterTaskId) {
        const index = state.tasks.findIndex(t => t.id === afterTaskId);
        if (index >= 0) {
          newTasks = [...state.tasks.slice(0, index + 1), task, ...state.tasks.slice(index + 1)];
        } else {
          newTasks = [...state.tasks, task];
        }
      } else {
        newTasks = [...state.tasks, task];
      }
      
      return {
        tasks: generateWBSCodes(newTasks),
        version: state.version + 1
      };
    }
    
    default:
      return state;
  }
}

export interface GanttControllerResult {
  tasks: Task[];
  version: number;
  
  // Actions
  indentTask: (taskId: string) => boolean;
  outdentTask: (taskId: string) => boolean;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addTask: (task: Task, afterTaskId?: string) => void;
  toggleExpansion: (taskId: string) => void;
  
  // Queries
  getById: (taskId: string) => Task | undefined;
  getChildren: (parentId: string) => Task[];
  getParent: (taskId: string) => Task | null;
  getDescendants: (taskId: string) => Task[];
  getTaskTree: () => Task[];
  getFlatTasks: () => Task[];
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

export interface UseGanttControllerOptions {
  onTaskChange?: (task: Task) => void;
  onTasksChange?: (tasks: Task[]) => void;
}

export function useGanttController(
  initialTasks: Task[],
  options: UseGanttControllerOptions = {}
): GanttControllerResult {
  const { onTaskChange, onTasksChange } = options;
  
  // Use lazy initialization - runs ONCE
  const [state, dispatch] = useReducer(
    taskReducer,
    initialTasks,
    (tasks) => ({
      tasks: generateWBSCodes(tasks),
      version: 0
    })
  );
  
  // Track which task IDs we have - only reinitialize if this changes
  const lastTaskIdsRef = useRef<string>(initialTasks.map(t => t.id).sort().join(','));
  
  // Check if we need to reinitialize (only when task IDs change - add/remove)
  useEffect(() => {
    const newIds = initialTasks.map(t => t.id).sort().join(',');
    if (newIds !== lastTaskIdsRef.current) {
      console.log('[GanttController] Task IDs changed, reinitializing');
      dispatch({ type: 'INIT_TASKS', payload: initialTasks });
      lastTaskIdsRef.current = newIds;
    }
  }, [initialTasks]);
  
  // Emit changes to external store (one-way)
  const prevVersionRef = useRef(state.version);
  useEffect(() => {
    if (state.version > prevVersionRef.current && state.version > 0) {
      console.log('[GanttController] Emitting changes, version:', state.version);
      if (onTasksChange) {
        onTasksChange(state.tasks);
      }
    }
    prevVersionRef.current = state.version;
  }, [state.version, state.tasks, onTasksChange]);
  
  // Stable action dispatchers
  const indentTask = useCallback((taskId: string): boolean => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      console.log('[GanttController] indentTask: task not found:', taskId);
      return false;
    }
    
    const prevSibling = getPrevSibling(state.tasks, taskId);
    if (!prevSibling) {
      console.log('[GanttController] indentTask: no prev sibling for:', taskId);
      return false;
    }
    
    console.log('[GanttController] indentTask:', task.name, '→ child of', prevSibling.name);
    dispatch({ type: 'INDENT_TASK', payload: { taskId } });
    return true;
  }, [state.tasks]);
  
  const outdentTask = useCallback((taskId: string): boolean => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task?.parentId) {
      console.log('[GanttController] outdentTask: task has no parent:', taskId);
      return false;
    }
    
    console.log('[GanttController] outdentTask:', task.name);
    dispatch({ type: 'OUTDENT_TASK', payload: { taskId } });
    return true;
  }, [state.tasks]);
  
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
    
    // Emit individual task change
    if (onTaskChange) {
      const task = state.tasks.find(t => t.id === taskId);
      if (task) {
        onTaskChange({ ...task, ...updates });
      }
    }
  }, [state.tasks, onTaskChange]);
  
  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { taskId } });
  }, []);
  
  const addTask = useCallback((task: Task, afterTaskId?: string) => {
    dispatch({ type: 'ADD_TASK', payload: { task, afterTaskId } });
  }, []);
  
  const toggleExpansion = useCallback((taskId: string) => {
    dispatch({ type: 'TOGGLE_EXPANSION', payload: { taskId } });
  }, []);
  
  // Query methods
  const getById = useCallback((taskId: string) => {
    return state.tasks.find(t => t.id === taskId);
  }, [state.tasks]);
  
  const getChildrenFn = useCallback((parentId: string) => {
    return state.tasks.filter(t => t.parentId === parentId);
  }, [state.tasks]);
  
  const getParentFn = useCallback((taskId: string) => {
    return getParent(state.tasks, taskId);
  }, [state.tasks]);
  
  const getDescendantsFn = useCallback((taskId: string) => {
    return getDescendants(state.tasks, taskId);
  }, [state.tasks]);
  
  const getTaskTree = useCallback(() => {
    return buildTaskTree(state.tasks);
  }, [state.tasks]);
  
  const getFlatTasks = useCallback(() => {
    const collapsedParents = new Set<string>();
    state.tasks.forEach(t => {
      if (t.isGroup && t.expanded === false) {
        collapsedParents.add(t.id);
      }
    });
    
    return state.tasks.filter(task => {
      let currentParentId = task.parentId;
      while (currentParentId) {
        if (collapsedParents.has(currentParentId)) {
          return false;
        }
        const parent = state.tasks.find(t => t.id === currentParentId);
        currentParentId = parent?.parentId;
      }
      return true;
    });
  }, [state.tasks]);
  
  return {
    tasks: state.tasks,
    version: state.version,
    indentTask,
    outdentTask,
    updateTask,
    deleteTask,
    addTask,
    toggleExpansion,
    getById,
    getChildren: getChildrenFn,
    getParent: getParentFn,
    getDescendants: getDescendantsFn,
    getTaskTree,
    getFlatTasks
  };
}
