import { useState, useCallback, useEffect, useRef } from 'react';

interface UseSplitterProps {
  storageKey?: string;
  defaultGridWidth?: number;
  minGridWidth?: number;
  minTimelineWidth?: number;
}

interface SplitterState {
  isDragging: boolean;
  startX: number;
  startWidth: number;
}

const STORAGE_PREFIX = 'visiongantt-splitter';

export function useSplitter({
  storageKey = 'default',
  defaultGridWidth = 700,
  minGridWidth = 300,
  minTimelineWidth = 200
}: UseSplitterProps = {}) {
  const actualStorageKey = `${STORAGE_PREFIX}-${storageKey}`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [gridWidth, setGridWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return defaultGridWidth;
    
    try {
      const stored = localStorage.getItem(actualStorageKey);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= minGridWidth) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load splitter position from localStorage:', error);
    }
    
    return defaultGridWidth;
  });

  const [splitterState, setSplitterState] = useState<SplitterState>({
    isDragging: false,
    startX: 0,
    startWidth: 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(actualStorageKey, gridWidth.toString());
    } catch (error) {
      console.warn('Failed to save splitter position to localStorage:', error);
    }
  }, [gridWidth, actualStorageKey]);

  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setSplitterState({
      isDragging: true,
      startX: e.clientX,
      startWidth: gridWidth
    });
  }, [gridWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!splitterState.isDragging) return;

    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 1200;
    const delta = e.clientX - splitterState.startX;
    let newWidth = splitterState.startWidth + delta;

    newWidth = Math.max(minGridWidth, newWidth);
    newWidth = Math.min(containerWidth - minTimelineWidth, newWidth);

    setGridWidth(newWidth);
  }, [splitterState, minGridWidth, minTimelineWidth]);

  const handleMouseUp = useCallback(() => {
    setSplitterState(prev => ({
      ...prev,
      isDragging: false
    }));
  }, []);

  useEffect(() => {
    if (splitterState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [splitterState.isDragging, handleMouseMove, handleMouseUp]);

  const setGridWidthWithConstraints = useCallback((width: number) => {
    const containerWidth = containerRef.current?.getBoundingClientRect().width ?? 1200;
    let newWidth = Math.max(minGridWidth, width);
    newWidth = Math.min(containerWidth - minTimelineWidth, newWidth);
    setGridWidth(newWidth);
  }, [minGridWidth, minTimelineWidth]);

  const resetToDefault = useCallback(() => {
    setGridWidth(defaultGridWidth);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(actualStorageKey);
      } catch (error) {
        console.warn('Failed to remove splitter position from localStorage:', error);
      }
    }
  }, [defaultGridWidth, actualStorageKey]);

  return {
    containerRef,
    gridWidth,
    isDragging: splitterState.isDragging,
    handleSplitterMouseDown,
    setGridWidth: setGridWidthWithConstraints,
    resetToDefault
  };
}
