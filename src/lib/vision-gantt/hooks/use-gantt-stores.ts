
/**
 * Hook to access Gantt stores with React state synchronization
 * 
 * IMPORTANT: This hook uses stable refs to prevent external props from
 * resetting internal modifications (like indent/outdent). The TaskStore
 * is only reset when a genuinely new dataset is loaded (different task IDs).
 */

import { useState, useEffect, useRef } from 'react';
import type { Task, Dependency, Resource } from '../types';
import type { WorkingCalendar } from '../types/advanced-features';
import { TaskStore, DependencyStore } from '../stores';
import { CalendarStore } from '../stores/calendar-store';

export function useGanttStores(
  initialTasks: Task[],
  initialDependencies: Dependency[],
  _initialResources?: Resource[],
  initialCalendars?: WorkingCalendar[]
) {
  const taskStoreRef = useRef<TaskStore | null>(null);
  const dependencyStoreRef = useRef<DependencyStore | null>(null);
  const calendarStoreRef = useRef<CalendarStore | null>(null);
  const initializedRef = useRef(false);
  const lastTaskIdsRef = useRef<string>('');

  if (!initializedRef.current) {
    taskStoreRef.current = new TaskStore(initialTasks);
    taskStoreRef.current.generateWBSCodes();
    dependencyStoreRef.current = new DependencyStore(initialDependencies);
    calendarStoreRef.current = new CalendarStore(initialCalendars);
    lastTaskIdsRef.current = initialTasks.map(t => t.id).sort().join(',');
    initializedRef.current = true;
  }

  const [tasks, setTasks] = useState<Task[]>(() => {
    return taskStoreRef.current?.getAll() ?? initialTasks;
  });
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  const [calendars, setCalendars] = useState<WorkingCalendar[]>(() => {
    return calendarStoreRef.current?.getCalendars() ?? [];
  });

  useEffect(() => {
    const taskUnsubscribe = taskStoreRef.current?.subscribe(setTasks);
    const depUnsubscribe = dependencyStoreRef.current?.subscribe(setDependencies);
    const calUnsubscribe = calendarStoreRef.current?.subscribe(() => {
      setCalendars(calendarStoreRef.current?.getCalendars() ?? []);
    });

    return () => {
      taskUnsubscribe?.();
      depUnsubscribe?.();
      calUnsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!taskStoreRef.current) return;
    
    const newTaskIds = initialTasks.map(t => t.id).sort().join(',');
    
    if (newTaskIds !== lastTaskIdsRef.current) {
      console.log('[useGanttStores] New dataset detected, resetting TaskStore');
      taskStoreRef.current.setData(initialTasks);
      taskStoreRef.current.generateWBSCodes();
      lastTaskIdsRef.current = newTaskIds;
    }
  }, [initialTasks]);

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

  return {
    taskStore: taskStoreRef.current!,
    dependencyStore: dependencyStoreRef.current!,
    calendarStore: calendarStoreRef.current!,
    tasks,
    dependencies,
    calendars
  };
}
