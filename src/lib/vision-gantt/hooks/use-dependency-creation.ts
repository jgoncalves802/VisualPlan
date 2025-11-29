
/**
 * Hook for creating dependencies interactively
 */



import { useState, useCallback } from 'react';
import type { DependencyCreationState, DependencyType } from '../types';

interface UseDependencyCreationOptions {
  onDependencyCreate: (fromTaskId: string, toTaskId: string, type: DependencyType) => void;
  enabled?: boolean;
}

export function useDependencyCreation({
  onDependencyCreate,
  enabled = false
}: UseDependencyCreationOptions) {
  const [creationState, setCreationState] = useState<DependencyCreationState>({
    isCreating: false
  });

  const [dependencyType, setDependencyType] = useState<DependencyType>('FS');

  const startCreation = useCallback(
    (taskId: string, point: { x: number; y: number }) => {
      if (!enabled) return;

      setCreationState({
        isCreating: true,
        fromTaskId: taskId,
        tempPath: { x1: point.x, y1: point.y, x2: point.x, y2: point.y }
      });
    },
    [enabled]
  );

  const updateTempPath = useCallback(
    (point: { x: number; y: number }) => {
      if (!creationState.isCreating || !creationState.tempPath) return;

      setCreationState((prev) => ({
        ...prev,
        tempPath: prev.tempPath
          ? { ...prev.tempPath, x2: point.x, y2: point.y }
          : undefined
      }));
    },
    [creationState.isCreating, creationState.tempPath]
  );

  const completeCreation = useCallback(
    (toTaskId: string) => {
      if (!creationState.isCreating || !creationState.fromTaskId) {
        setCreationState({ isCreating: false });
        return;
      }

      if (creationState.fromTaskId !== toTaskId) {
        onDependencyCreate(creationState.fromTaskId, toTaskId, dependencyType);
      }

      setCreationState({ isCreating: false });
    },
    [creationState, dependencyType, onDependencyCreate]
  );

  const cancelCreation = useCallback(() => {
    setCreationState({ isCreating: false });
  }, []);

  return {
    creationState,
    dependencyType,
    setDependencyType,
    startCreation,
    updateTempPath,
    completeCreation,
    cancelCreation
  };
}
