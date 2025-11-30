/**
 * useTaskReducer - Immutable state management for tasks
 * 
 * This is a SPIKE to test if React's useReducer pattern resolves
 * the indent/outdent synchronization issues in VisionGantt.
 * 
 * Key differences from TaskStore class:
 * 1. Immutable state - every action returns a new state object
 * 2. Transactional updates - all changes happen atomically
 * 3. No external refs - state is managed by React directly
 * 4. Automatic re-renders - React handles reconciliation
 */

import { useReducer, useCallback, useMemo, useRef } from 'react';
import type { Task } from '../types';

// Action types
type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'INDENT_TASK'; payload: { taskId: string } }
  | { type: 'OUTDENT_TASK'; payload: { taskId: string } }
  | { type: 'INDENT_TASKS'; payload: { taskIds: string[] } }
  | { type: 'OUTDENT_TASKS'; payload: { taskIds: string[] } }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_TASK'; payload: { task: Task; afterTaskId?: string } }
  | { type: 'MOVE_TASK'; payload: { taskId: string; newParentId: string | null } }
  | { type: 'TOGGLE_EXPANSION'; payload: { taskId: string } };

interface TaskState {
  tasks: Task[];
  version: number; // Increment on every change to force re-renders
}

// Pure helper functions (no side effects)

/**
 * Generates WBS codes while PRESERVING original array order.
 * Handles arbitrary order where parents may appear after children.
 * Uses recursive resolution for missing ancestor WBS codes.
 */
function generateWBSCodes(tasks: Task[]): Task[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const wbsMap = new Map<string, string>();
  const childCounters = new Map<string | null, number>();
  
  // Recursive function to resolve WBS for a task
  function resolveWbs(taskId: string): string {
    // If already resolved, return it
    const cached = wbsMap.get(taskId);
    if (cached !== undefined) return cached;
    
    const task = taskMap.get(taskId);
    if (!task) return '1';
    
    const parentId = task.parentId ?? null;
    
    // Get parent WBS (recursively if needed)
    let parentWbs = '';
    if (parentId) {
      parentWbs = resolveWbs(parentId);
    }
    
    // Increment counter for this parent
    const count = (childCounters.get(parentId) ?? 0) + 1;
    childCounters.set(parentId, count);
    
    // Generate WBS code
    const wbs = parentWbs ? `${parentWbs}.${count}` : `${count}`;
    wbsMap.set(taskId, wbs);
    
    return wbs;
  }
  
  // Process tasks in original order to maintain sibling numbering
  // But resolve ancestor WBS recursively when needed
  for (const task of tasks) {
    if (!wbsMap.has(task.id)) {
      resolveWbs(task.id);
    }
  }
  
  // Apply WBS codes while preserving original array order
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

/**
 * Indent a single task - ATOMIC TRANSACTION
 * Returns new task array with all changes applied at once
 */
function indentTaskAtomic(tasks: Task[], taskId: string): Task[] {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return tasks;
  
  const prevSibling = getPrevSibling(tasks, taskId);
  if (!prevSibling) return tasks; // Can't indent - no previous sibling
  
  const newLevel = (prevSibling.level ?? 0) + 1;
  const maxLevel = 10;
  if (newLevel > maxLevel) return tasks;
  
  // Get all descendants that will move with this task
  const descendantIds = new Set([taskId, ...getDescendants(tasks, taskId).map(d => d.id)]);
  const levelDelta = newLevel - (task.level ?? 0);
  
  // Create new array with all changes applied atomically
  const newTasks = tasks.map(t => {
    if (t.id === taskId) {
      // The task being indented
      return { 
        ...t, 
        parentId: prevSibling.id, 
        level: newLevel 
      };
    }
    if (descendantIds.has(t.id) && t.id !== taskId) {
      // Descendants - adjust level
      return { 
        ...t, 
        level: (t.level ?? 0) + levelDelta 
      };
    }
    if (t.id === prevSibling.id && !t.isGroup) {
      // Previous sibling becomes a group
      return { 
        ...t, 
        isGroup: true, 
        expanded: true 
      };
    }
    return t;
  });
  
  // Regenerate WBS codes
  return generateWBSCodes(newTasks);
}

/**
 * Outdent a single task - ATOMIC TRANSACTION
 */
function outdentTaskAtomic(tasks: Task[], taskId: string): Task[] {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return tasks;
  if (!task.parentId) return tasks; // Can't outdent - already at root
  
  const parent = getParent(tasks, taskId);
  if (!parent) return tasks;
  
  const newParentId = parent.parentId ?? null;
  const newLevel = Math.max(0, (task.level ?? 1) - 1);
  
  // Get all descendants that will move with this task
  const descendantIds = new Set([taskId, ...getDescendants(tasks, taskId).map(d => d.id)]);
  const levelDelta = newLevel - (task.level ?? 0);
  
  // Check if parent will still have children after this outdent
  const remainingChildren = getChildren(tasks, parent.id).filter(c => !descendantIds.has(c.id));
  const parentNeedsUpdate = remainingChildren.length === 0;
  
  // Create new array with all changes applied atomically
  const newTasks = tasks.map(t => {
    if (t.id === taskId) {
      // The task being outdented
      return { 
        ...t, 
        parentId: newParentId, 
        level: newLevel 
      };
    }
    if (descendantIds.has(t.id) && t.id !== taskId) {
      // Descendants - adjust level
      return { 
        ...t, 
        level: (t.level ?? 0) + levelDelta 
      };
    }
    if (t.id === parent.id && parentNeedsUpdate) {
      // Parent no longer has children - remove group status
      return { 
        ...t, 
        isGroup: false 
      };
    }
    return t;
  });
  
  // Regenerate WBS codes
  return generateWBSCodes(newTasks);
}

/**
 * The reducer function - pure, immutable state transitions
 */
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS': {
      return {
        tasks: generateWBSCodes(action.payload),
        version: state.version + 1
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
      const newTasks = indentTaskAtomic(state.tasks, action.payload.taskId);
      // Only increment version if tasks actually changed
      if (newTasks === state.tasks) return state;
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'OUTDENT_TASK': {
      const newTasks = outdentTaskAtomic(state.tasks, action.payload.taskId);
      if (newTasks === state.tasks) return state;
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'INDENT_TASKS': {
      let newTasks = state.tasks;
      const processedIds = new Set<string>();
      
      // Sort taskIds by their index in the original array (top-to-bottom)
      // This ensures parents are processed before their descendants
      const taskIndexMap = new Map(state.tasks.map((t, i) => [t.id, i]));
      const sortedTaskIds = [...action.payload.taskIds].sort((a, b) => 
        (taskIndexMap.get(a) ?? 0) - (taskIndexMap.get(b) ?? 0)
      );
      
      for (const taskId of sortedTaskIds) {
        // Skip if this task is a descendant of an already-processed task
        if (processedIds.has(taskId)) continue;
        
        // Mark this task and all its descendants as processed
        processedIds.add(taskId);
        getDescendants(newTasks, taskId).forEach(d => processedIds.add(d.id));
        
        newTasks = indentTaskAtomic(newTasks, taskId);
      }
      if (newTasks === state.tasks) return state;
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'OUTDENT_TASKS': {
      let newTasks = state.tasks;
      const processedIds = new Set<string>();
      
      // Sort taskIds by their index in the original array (top-to-bottom)
      // This ensures parents are processed before their descendants
      const taskIndexMap = new Map(state.tasks.map((t, i) => [t.id, i]));
      const sortedTaskIds = [...action.payload.taskIds].sort((a, b) => 
        (taskIndexMap.get(a) ?? 0) - (taskIndexMap.get(b) ?? 0)
      );
      
      for (const taskId of sortedTaskIds) {
        // Skip if this task is a descendant of an already-processed task
        if (processedIds.has(taskId)) continue;
        
        // Mark this task and all its descendants as processed
        processedIds.add(taskId);
        getDescendants(newTasks, taskId).forEach(d => processedIds.add(d.id));
        
        newTasks = outdentTaskAtomic(newTasks, taskId);
      }
      if (newTasks === state.tasks) return state;
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    case 'DELETE_TASK': {
      const descendantIds = new Set([
        action.payload.taskId,
        ...getDescendants(state.tasks, action.payload.taskId).map(d => d.id)
      ]);
      const newTasks = state.tasks.filter(t => !descendantIds.has(t.id));
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
          newTasks = [
            ...state.tasks.slice(0, index + 1),
            task,
            ...state.tasks.slice(index + 1)
          ];
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
    
    case 'MOVE_TASK': {
      const { taskId, newParentId } = action.payload;
      const newTasks = state.tasks.map(t => 
        t.id === taskId ? { ...t, parentId: newParentId } : t
      );
      return {
        tasks: generateWBSCodes(newTasks),
        version: state.version + 1
      };
    }
    
    case 'TOGGLE_EXPANSION': {
      const { taskId } = action.payload;
      const newTasks = state.tasks.map(t => 
        t.id === taskId ? { ...t, expanded: !t.expanded } : t
      );
      return {
        tasks: newTasks,
        version: state.version + 1
      };
    }
    
    default:
      return state;
  }
}

/**
 * Hook interface - provides same API as TaskStore for easy integration
 */
export interface UseTaskReducerResult {
  tasks: Task[];
  version: number;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  indentTask: (taskId: string) => boolean;
  outdentTask: (taskId: string) => boolean;
  indentTasks: (taskIds: string[]) => boolean;
  outdentTasks: (taskIds: string[]) => boolean;
  deleteTask: (taskId: string) => void;
  addTask: (task: Task, afterTaskId?: string) => void;
  moveTask: (taskId: string, newParentId: string | null) => void;
  toggleExpansion: (taskId: string) => void;
  
  // Queries
  getById: (taskId: string) => Task | undefined;
  getChildren: (parentId: string) => Task[];
  getParent: (taskId: string) => Task | null;
  getDescendants: (taskId: string) => Task[];
  getFlatTasks: () => Task[];
}

export function useTaskReducer(initialTasks: Task[] = []): UseTaskReducerResult {
  const [state, dispatch] = useReducer(taskReducer, {
    tasks: generateWBSCodes(initialTasks),
    version: 0
  });
  
  // Keep a ref to current state for synchronous validation in callbacks
  // This is updated immediately after each render, so it's always current
  const stateRef = useRef(state);
  stateRef.current = state;
  
  // Stable action dispatchers - use stateRef for synchronous validation
  const setTasks = useCallback((tasks: Task[]) => {
    dispatch({ type: 'SET_TASKS', payload: tasks });
  }, []);
  
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
  }, []);
  
  // Indent/outdent with proper validation using current state ref
  const indentTask = useCallback((taskId: string): boolean => {
    const currentTasks = stateRef.current.tasks;
    const task = currentTasks.find((t: Task) => t.id === taskId);
    console.log('[useTaskReducer] indentTask called:', taskId, 'task:', task?.name, 'level:', task?.level, 'parentId:', task?.parentId);
    if (!task) {
      console.log('[useTaskReducer] indentTask: task not found');
      return false;
    }
    
    const prevSibling = getPrevSibling(currentTasks, taskId);
    console.log('[useTaskReducer] indentTask: prevSibling:', prevSibling?.name, prevSibling?.id);
    if (!prevSibling) {
      console.log('[useTaskReducer] indentTask: no prev sibling, cannot indent');
      return false;
    }
    
    console.log('[useTaskReducer] dispatching INDENT_TASK');
    dispatch({ type: 'INDENT_TASK', payload: { taskId } });
    return true;
  }, []);
  
  const outdentTask = useCallback((taskId: string): boolean => {
    const currentTasks = stateRef.current.tasks;
    const task = currentTasks.find((t: Task) => t.id === taskId);
    console.log('[useTaskReducer] outdentTask called:', taskId, 'task:', task?.name, 'parentId:', task?.parentId);
    if (!task?.parentId) {
      console.log('[useTaskReducer] outdentTask: task has no parent, cannot outdent');
      return false;
    }
    
    console.log('[useTaskReducer] dispatching OUTDENT_TASK');
    dispatch({ type: 'OUTDENT_TASK', payload: { taskId } });
    return true;
  }, []);
  
  const indentTasks = useCallback((taskIds: string[]): boolean => {
    if (taskIds.length === 0) return false;
    dispatch({ type: 'INDENT_TASKS', payload: { taskIds } });
    return true;
  }, []);
  
  const outdentTasks = useCallback((taskIds: string[]): boolean => {
    if (taskIds.length === 0) return false;
    dispatch({ type: 'OUTDENT_TASKS', payload: { taskIds } });
    return true;
  }, []);
  
  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { taskId } });
  }, []);
  
  const addTask = useCallback((task: Task, afterTaskId?: string) => {
    dispatch({ type: 'ADD_TASK', payload: { task, afterTaskId } });
  }, []);
  
  const moveTask = useCallback((taskId: string, newParentId: string | null) => {
    dispatch({ type: 'MOVE_TASK', payload: { taskId, newParentId } });
  }, []);
  
  const toggleExpansion = useCallback((taskId: string) => {
    dispatch({ type: 'TOGGLE_EXPANSION', payload: { taskId } });
  }, []);
  
  // Memoized queries
  const getById = useCallback((taskId: string) => {
    return state.tasks.find(t => t.id === taskId);
  }, [state.tasks]);
  
  const getChildrenFn = useCallback((parentId: string) => {
    return getChildren(state.tasks, parentId);
  }, [state.tasks]);
  
  const getParentFn = useCallback((taskId: string) => {
    return getParent(state.tasks, taskId);
  }, [state.tasks]);
  
  const getDescendantsFn = useCallback((taskId: string) => {
    return getDescendants(state.tasks, taskId);
  }, [state.tasks]);
  
  // Get visible tasks (respecting expanded/collapsed state)
  const getFlatTasks = useCallback(() => {
    const result: Task[] = [];
    const collapsedParents = new Set<string>();
    
    // First pass - identify collapsed parents
    state.tasks.forEach(t => {
      if (t.isGroup && t.expanded === false) {
        collapsedParents.add(t.id);
      }
    });
    
    // Second pass - filter out children of collapsed parents
    state.tasks.forEach(task => {
      let isHidden = false;
      let currentParentId = task.parentId;
      
      while (currentParentId) {
        if (collapsedParents.has(currentParentId)) {
          isHidden = true;
          break;
        }
        const parent = state.tasks.find(t => t.id === currentParentId);
        currentParentId = parent?.parentId;
      }
      
      if (!isHidden) {
        result.push(task);
      }
    });
    
    return result;
  }, [state.tasks]);
  
  return useMemo(() => ({
    tasks: state.tasks,
    version: state.version,
    setTasks,
    updateTask,
    indentTask,
    outdentTask,
    indentTasks,
    outdentTasks,
    deleteTask,
    addTask,
    moveTask,
    toggleExpansion,
    getById,
    getChildren: getChildrenFn,
    getParent: getParentFn,
    getDescendants: getDescendantsFn,
    getFlatTasks
  }), [
    state.tasks,
    state.version,
    setTasks,
    updateTask,
    indentTask,
    outdentTask,
    indentTasks,
    outdentTasks,
    deleteTask,
    addTask,
    moveTask,
    toggleExpansion,
    getById,
    getChildrenFn,
    getParentFn,
    getDescendantsFn,
    getFlatTasks
  ]);
}

export default useTaskReducer;
