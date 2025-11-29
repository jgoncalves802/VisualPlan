
/**
 * Hook to access Gantt stores with React state synchronization
 */



import { useState, useEffect, useRef } from 'react';
import type { Task, Dependency, Resource } from '../types';
import { TaskStore, DependencyStore } from '../stores';

export function useGanttStores(
  initialTasks: Task[],
  initialDependencies: Dependency[],
  initialResources?: Resource[]
) {
  const taskStoreRef = useRef<TaskStore>();
  const dependencyStoreRef = useRef<DependencyStore>();

  // Initialize stores once
  if (!taskStoreRef.current) {
    taskStoreRef.current = new TaskStore(initialTasks);
    // Generate WBS codes on initialization
    taskStoreRef.current.generateWBSCodes();
  }
  if (!dependencyStoreRef.current) {
    dependencyStoreRef.current = new DependencyStore(initialDependencies);
  }

  const [tasks, setTasks] = useState<Task[]>(() => {
    // Get tasks with WBS codes generated
    return taskStoreRef.current?.getAll() ?? initialTasks;
  });
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);

  // Subscribe to store changes
  useEffect(() => {
    const taskUnsubscribe = taskStoreRef.current?.subscribe(setTasks);
    const depUnsubscribe = dependencyStoreRef.current?.subscribe(setDependencies);

    return () => {
      taskUnsubscribe?.();
      depUnsubscribe?.();
    };
  }, []);

  // Update stores when props change
  useEffect(() => {
    if (taskStoreRef.current) {
      taskStoreRef.current.setData(initialTasks);
      // Regenerate WBS codes when tasks change
      taskStoreRef.current.generateWBSCodes();
    }
  }, [initialTasks]);

  useEffect(() => {
    if (dependencyStoreRef.current) {
      dependencyStoreRef.current.setData(initialDependencies);
    }
  }, [initialDependencies]);

  return {
    taskStore: taskStoreRef.current!,
    dependencyStore: dependencyStoreRef.current!,
    tasks,
    dependencies
  };
}
