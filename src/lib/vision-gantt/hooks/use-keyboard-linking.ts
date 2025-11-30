/**
 * Hook for keyboard-based task linking (MS Project style)
 * Shift + ArrowDown/ArrowUp creates FS dependency between adjacent tasks
 * 
 * IMPORTANT: This hook only activates when focus is NOT on editable elements
 * to avoid breaking normal text input navigation.
 */

import { useEffect, useCallback } from 'react';
import type { Task, DependencyType } from '../types';

interface UseKeyboardLinkingOptions {
  tasks: Task[];
  selectedTaskId?: string;
  onCreateDependency: (fromTaskId: string, toTaskId: string, type: DependencyType, lag?: number) => void;
  onSelectTask?: (taskId: string) => void;
  enabled?: boolean;
}

/**
 * Check if the active element is an editable control where arrow keys
 * should perform normal navigation (text cursor movement)
 */
function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  
  if ((element as HTMLElement).isContentEditable) {
    return true;
  }
  
  if (element.getAttribute('role') === 'textbox') {
    return true;
  }
  
  if (element.closest('[role="dialog"]') || element.closest('[role="modal"]')) {
    return true;
  }
  
  return false;
}

export function useKeyboardLinking({
  tasks,
  selectedTaskId,
  onCreateDependency,
  onSelectTask,
  enabled = true
}: UseKeyboardLinkingOptions) {
  
  const getAdjacentTask = useCallback((direction: 'up' | 'down'): Task | null => {
    if (!selectedTaskId) return null;
    
    const currentIndex = tasks.findIndex(t => t.id === selectedTaskId);
    if (currentIndex === -1) return null;
    
    const targetIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1;
    
    if (targetIndex < 0 || targetIndex >= tasks.length) return null;
    
    return tasks[targetIndex];
  }, [tasks, selectedTaskId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || !selectedTaskId) return;
    
    if (isEditableElement(document.activeElement)) {
      return;
    }
    
    const isShiftHeld = e.shiftKey;
    const isArrowDown = e.key === 'ArrowDown';
    const isArrowUp = e.key === 'ArrowUp';
    
    if (!isArrowDown && !isArrowUp) return;
    
    if (isShiftHeld) {
      e.preventDefault();
      e.stopPropagation();
      
      const direction = isArrowDown ? 'down' : 'up';
      const adjacentTask = getAdjacentTask(direction);
      
      if (!adjacentTask) return;
      
      const currentTask = tasks.find(t => t.id === selectedTaskId);
      if (!currentTask) return;
      
      const isGroupTask = (task: Task) => task.isGroup === true || (task.children && task.children.length > 0);
      if (isGroupTask(currentTask) || isGroupTask(adjacentTask)) {
        return;
      }
      
      if (isArrowDown) {
        onCreateDependency(selectedTaskId, adjacentTask.id, 'FS', 0);
      } else {
        onCreateDependency(adjacentTask.id, selectedTaskId, 'FS', 0);
      }
      
      onSelectTask?.(adjacentTask.id);
    } else {
      e.preventDefault();
      const direction = isArrowDown ? 'down' : 'up';
      const adjacentTask = getAdjacentTask(direction);
      
      if (adjacentTask) {
        onSelectTask?.(adjacentTask.id);
      }
    }
  }, [enabled, selectedTaskId, tasks, getAdjacentTask, onCreateDependency, onSelectTask]);

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  return {
    getAdjacentTask
  };
}
