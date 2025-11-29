
/**
 * Hook to calculate timeline date range based on tasks
 */



import { useMemo } from 'react';
import type { Task, TimelineRange } from '../types';
import { addDays, subDays, startOfMonth, endOfMonth } from 'date-fns';

export function useTimelineRange(tasks: Task[]): TimelineRange {
  return useMemo(() => {
    if (!tasks || tasks.length === 0) {
      const today = new Date();
      return {
        startDate: startOfMonth(subDays(today, 30)),
        endDate: endOfMonth(addDays(today, 90))
      };
    }

    let minDate = new Date();
    let maxDate = new Date();

    tasks.forEach((task) => {
      if (task?.startDate) {
        const taskStart = new Date(task.startDate);
        if (!minDate || taskStart < minDate) {
          minDate = taskStart;
        }
      }
      if (task?.endDate) {
        const taskEnd = new Date(task.endDate);
        if (!maxDate || taskEnd > maxDate) {
          maxDate = taskEnd;
        }
      }
    });

    // Add padding: 1 month before and 1 month after
    const startDate = startOfMonth(subDays(minDate, 30));
    const endDate = endOfMonth(addDays(maxDate, 30));

    return { startDate, endDate };
  }, [tasks]);
}
