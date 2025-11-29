
import { useState, useCallback, useRef, useEffect } from 'react';
import { Task, DependencyType } from '../types';

export interface DependencyDragState {
  isDragging: boolean;
  sourceTask: Task | null;
  sourceHandle: 'start' | 'end' | null;
  mousePosition: { x: number; y: number };
  targetTask: Task | null;
  targetHandle: 'start' | 'end' | null;
}

export interface UseDependencyDragOptions {
  onCreateDependency: (
    fromTaskId: string,
    toTaskId: string,
    type: DependencyType,
    lag?: number
  ) => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function useDependencyDrag({
  onCreateDependency,
  containerRef,
}: UseDependencyDragOptions) {
  const [dragState, setDragState] = useState<DependencyDragState>({
    isDragging: false,
    sourceTask: null,
    sourceHandle: null,
    mousePosition: { x: 0, y: 0 },
    targetTask: null,
    targetHandle: null,
  });

  const dragStateRef = useRef(dragState);
  
  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  // Inicia o drag de uma dependência
  const startDependencyDrag = useCallback(
    (task: Task, handle: 'start' | 'end', event: React.MouseEvent) => {
      event.stopPropagation();
      
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      setDragState({
        isDragging: true,
        sourceTask: task,
        sourceHandle: handle,
        mousePosition: {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        },
        targetTask: null,
        targetHandle: null,
      });
    },
    [containerRef]
  );

  // Atualiza a posição do mouse durante o drag
  const updateDragPosition = useCallback((event: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    
    setDragState((prev) => ({
      ...prev,
      mousePosition: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    }));
  }, [containerRef]);

  // Define o alvo do drag (hover sobre outra tarefa)
  const setDragTarget = useCallback(
    (task: Task | null, handle: 'start' | 'end' | null) => {
      // Só atualiza se estiver em drag ativo
      if (!dragStateRef.current.isDragging) return;
      
      setDragState((prev) => {
        // Evita atualização se o target não mudou
        if (prev.targetTask?.id === task?.id && prev.targetHandle === handle) {
          return prev;
        }
        return {
          ...prev,
          targetTask: task,
          targetHandle: handle,
        };
      });
    },
    []
  );

  // Finaliza o drag e cria a dependência
  const endDependencyDrag = useCallback(() => {
    const state = dragStateRef.current;
    
    if (
      state.isDragging &&
      state.sourceTask &&
      state.targetTask &&
      state.sourceTask.id !== state.targetTask.id
    ) {
      // Determina o tipo de dependência baseado nos handles
      let type: DependencyType = 'FS';
      
      if (state.sourceHandle === 'end' && state.targetHandle === 'start') {
        type = 'FS'; // Finish-to-Start (padrão)
      } else if (state.sourceHandle === 'start' && state.targetHandle === 'start') {
        type = 'SS'; // Start-to-Start
      } else if (state.sourceHandle === 'end' && state.targetHandle === 'end') {
        type = 'FF'; // Finish-to-Finish
      } else if (state.sourceHandle === 'start' && state.targetHandle === 'end') {
        type = 'SF'; // Start-to-Finish
      }

      onCreateDependency(state.sourceTask.id, state.targetTask.id, type, 0);
    }

    setDragState({
      isDragging: false,
      sourceTask: null,
      sourceHandle: null,
      mousePosition: { x: 0, y: 0 },
      targetTask: null,
      targetHandle: null,
    });
  }, [onCreateDependency]);

  // Cancela o drag
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      sourceTask: null,
      sourceHandle: null,
      mousePosition: { x: 0, y: 0 },
      targetTask: null,
      targetHandle: null,
    });
  }, []);

  // Event listeners para mouse move e mouse up
  useEffect(() => {
    if (!dragState.isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateDragPosition(e);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      endDependencyDrag();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancelDrag();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dragState.isDragging, updateDragPosition, endDependencyDrag, cancelDrag]);

  return {
    dragState,
    startDependencyDrag,
    setDragTarget,
    endDependencyDrag,
    cancelDrag,
  };
}
