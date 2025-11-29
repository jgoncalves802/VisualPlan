
/**
 * Hook to access Gantt stores with React state synchronization
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
  const taskStoreRef = useRef<TaskStore>();
  const dependencyStoreRef = useRef<DependencyStore>();
  const calendarStoreRef = useRef<CalendarStore>();

  // Initialize stores once
  if (!taskStoreRef.current) {
    taskStoreRef.current = new TaskStore(initialTasks);
    taskStoreRef.current.generateWBSCodes();
  }
  if (!dependencyStoreRef.current) {
    dependencyStoreRef.current = new DependencyStore(initialDependencies);
  }
  if (!calendarStoreRef.current) {
    calendarStoreRef.current = new CalendarStore(initialCalendars);
  }

  const [tasks, setTasks] = useState<Task[]>(() => {
    return taskStoreRef.current?.getAll() ?? initialTasks;
  });
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  const [calendars, setCalendars] = useState<WorkingCalendar[]>(() => {
    return calendarStoreRef.current?.getCalendars() ?? [];
  });

  // Subscribe to store changes
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

  // Update stores when props change
  useEffect(() => {
    if (taskStoreRef.current) {
      taskStoreRef.current.setData(initialTasks);
      taskStoreRef.current.generateWBSCodes();
    }
  }, [initialTasks]);

  useEffect(() => {
    if (dependencyStoreRef.current) {
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
