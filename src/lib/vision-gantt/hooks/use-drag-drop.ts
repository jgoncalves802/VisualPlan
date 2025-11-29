
/**
 * Hook for drag and drop functionality
 */



import { useState, useCallback, useRef } from 'react';
import type { Task, DragState } from '../types';
import { xToDate, snapToGrid, calculateTaskDuration } from '../utils';
import { addDays } from 'date-fns';

interface UseDragDropOptions {
  pixelsPerDay: number;
  timelineStart: Date;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  enabled?: boolean;
}

export function useDragDrop({
  pixelsPerDay,
  timelineStart,
  onTaskUpdate,
  enabled = true
}: UseDragDropOptions) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false
  });

  const dragStartRef = useRef<{ x: number; originalStartDate: Date; originalEndDate: Date } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent, task: Task) => {
      if (!enabled) return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      dragStartRef.current = {
        x: e.clientX,
        originalStartDate: new Date(task.startDate),
        originalEndDate: new Date(task.endDate)
      };

      setDragState({
        isDragging: true,
        taskId: task.id,
        startX: e.clientX,
        offsetX
      });

      e.preventDefault();
      e.stopPropagation();
    },
    [enabled]
  );

  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging || !dragStartRef.current || !dragState.taskId) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaDays = Math.round(deltaX / pixelsPerDay);

      if (deltaDays !== 0) {
        const newStartDate = addDays(dragStartRef.current.originalStartDate, deltaDays);
        const newEndDate = addDays(dragStartRef.current.originalEndDate, deltaDays);

        // Snap to grid
        const snappedStart = snapToGrid(newStartDate, 'day');
        const duration = calculateTaskDuration(dragStartRef.current.originalStartDate, dragStartRef.current.originalEndDate);
        const snappedEnd = addDays(snappedStart, duration - 1);

        setDragState((prev) => ({
          ...prev,
          offsetDate: snappedStart
        }));
      }
    },
    [dragState.isDragging, dragState.taskId, pixelsPerDay]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || !dragState.taskId || !dragStartRef.current) {
      setDragState({ isDragging: false });
      dragStartRef.current = null;
      return;
    }

    if (dragState.offsetDate) {
      const duration = calculateTaskDuration(
        dragStartRef.current.originalStartDate,
        dragStartRef.current.originalEndDate
      );
      const newEndDate = addDays(dragState.offsetDate, duration - 1);

      onTaskUpdate(dragState.taskId, {
        startDate: dragState.offsetDate,
        endDate: newEndDate
      });
    }

    setDragState({ isDragging: false });
    dragStartRef.current = null;
  }, [dragState, onTaskUpdate]);

  return {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  };
}
