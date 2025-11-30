
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
  // All refs must be declared at the top, before any conditional code
  const taskStoreRef = useRef<TaskStore>();
  const dependencyStoreRef = useRef<DependencyStore>();
  const calendarStoreRef = useRef<CalendarStore>();
  const initialTaskIdsRef = useRef<Set<string>>(new Set(initialTasks.map(t => t.id)));
  const initialDepIdsRef = useRef<Set<string>>(new Set(initialDependencies.map(d => d.id)));

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

  // Update stores when props change ONLY if task IDs have actually changed (new dataset)
  useEffect(() => {
    if (taskStoreRef.current) {
      const newIds = new Set(initialTasks.map(t => t.id));
      const prevIds = initialTaskIdsRef.current;
      
      // Only update if the set of task IDs changed (new project loaded)
      const idsChanged = newIds.size !== prevIds.size || 
        ![...newIds].every(id => prevIds.has(id));
      
      if (idsChanged) {
        taskStoreRef.current.setData(initialTasks);
        taskStoreRef.current.generateWBSCodes();
        initialTaskIdsRef.current = newIds;
      }
    }
  }, [initialTasks]);

  useEffect(() => {
    if (dependencyStoreRef.current) {
      const newIds = new Set(initialDependencies.map(d => d.id));
      const prevIds = initialDepIdsRef.current;
      
      const idsChanged = newIds.size !== prevIds.size || 
        ![...newIds].every(id => prevIds.has(id));
      
      if (idsChanged) {
        dependencyStoreRef.current.setData(initialDependencies);
        initialDepIdsRef.current = newIds;
      }
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
