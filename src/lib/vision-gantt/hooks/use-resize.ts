
/**
 * Hook for task bar resizing functionality
 */



import { useState, useCallback, useRef } from 'react';
import type { Task, ResizeState } from '../types';
import { xToDate, snapToGrid, calculateTaskDuration } from '../utils';
import { addDays } from 'date-fns';

interface UseResizeOptions {
  pixelsPerDay: number;
  timelineStart: Date;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  enabled?: boolean;
}

export function useResize({
  pixelsPerDay,
  timelineStart,
  onTaskUpdate,
  enabled = true
}: UseResizeOptions) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false
  });

  const resizeStartRef = useRef<{ x: number; originalStartDate: Date; originalEndDate: Date } | null>(null);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, task: Task, edge: 'left' | 'right') => {
      if (!enabled) return;

      resizeStartRef.current = {
        x: e.clientX,
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate)
      };

      setResizeState({
        isResizing: true,
        taskId: task.id,
        edge,
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate)
      });

      e.preventDefault();
      e.stopPropagation();
    },
    [enabled]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizeState.isResizing || !resizeStartRef.current || !resizeState.taskId) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (deltaDays !== 0) {
        let newStartDate = resizeStartRef.current.originalStartDate;
        let newEndDate = resizeStartRef.current.originalEndDate;

        if (resizeState.edge === 'left') {
          newStartDate = addDays(resizeStartRef.current.originalStartDate, deltaDays);
          // Ensure minimum duration of 1 day
          if (newStartDate >= newEndDate) {
            newStartDate = addDays(newEndDate, -1);
          }
        } else {
          newEndDate = addDays(resizeStartRef.current.originalEndDate, deltaDays);
          // Ensure minimum duration of 1 day
          if (newEndDate <= newStartDate) {
            newEndDate = addDays(newStartDate, 1);
          }
        }

        setResizeState((prev) => ({
          ...prev,
          originalStartDate: newStartDate,
          originalEndDate: newEndDate
        }));
      }
    },
    [resizeState.isResizing, resizeState.taskId, resizeState.edge, pixelsPerDay]
  );

  const handleResizeEnd = useCallback(() => {
    if (!resizeState.isResizing || !resizeState.taskId || !resizeState.originalStartDate || !resizeState.originalEndDate) {
      setResizeState({ isResizing: false });
      resizeStartRef.current = null;
      return;
    }

    const snappedStart = snapToGrid(resizeState.originalStartDate, 'day');
    const snappedEnd = snapToGrid(resizeState.originalEndDate, 'day');
    const duration = calculateTaskDuration(snappedStart, snappedEnd);

    onTaskUpdate(resizeState.taskId, {
      startDate: snappedStart,
      endDate: snappedEnd,
      duration
    });

    setResizeState({ isResizing: false });
    resizeStartRef.current = null;
  }, [resizeState, onTaskUpdate]);

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd
  };
}
