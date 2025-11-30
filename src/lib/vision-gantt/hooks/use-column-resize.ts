

/**
 * Hook for column resizing functionality with localStorage persistence
 */



import { useState, useCallback, useEffect, useMemo } from 'react';
import type { ColumnConfig } from '../types';

interface UseColumnResizeProps {
  columns: ColumnConfig[];
  storageKey?: string;
  onColumnResize?: (columnIndex: number, newWidth: number) => void;
}

interface ResizeState {
  isResizing: boolean;
  columnIndex: number | null;
  startX: number;
  startWidth: number;
}

const STORAGE_PREFIX = 'visiongantt-column-widths';

export function useColumnResize({ columns, storageKey, onColumnResize }: UseColumnResizeProps) {
  // Generate storage key based on column fields
  const actualStorageKey = useMemo(() => {
    if (storageKey) return `${STORAGE_PREFIX}-${storageKey}`;
    const fields = columns.map(c => c.field).join('-');
    return `${STORAGE_PREFIX}-${fields}`;
  }, [storageKey, columns]);

  // Initialize column widths from localStorage or defaults
  const [columnWidths, setColumnWidths] = useState<Record<number, number>>(() => {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(actualStorageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load column widths from localStorage:', error);
    }
    
    return {};
  });

  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    columnIndex: null,
    startX: 0,
    startWidth: 0
  });

  // Save to localStorage whenever widths change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(actualStorageKey, JSON.stringify(columnWidths));
    } catch (error) {
      console.warn('Failed to save column widths to localStorage:', error);
    }
  }, [columnWidths, actualStorageKey]);

  const handleResizeStart = useCallback(
    (columnIndex: number, startX: number) => {
      const currentWidth = columnWidths[columnIndex] ?? columns[columnIndex]?.width ?? 100;
      setResizeState({
        isResizing: true,
        columnIndex,
        startX,
        startWidth: currentWidth
      });
    },
    [columnWidths, columns]
  );

  const handleResizeMove = useCallback(
    (currentX: number) => {
      if (!resizeState.isResizing || resizeState.columnIndex === null) return;

      const column = columns[resizeState.columnIndex];
      const delta = currentX - resizeState.startX;
      const minWidth = column?.minWidth ?? 50;
      const maxWidth = column?.maxWidth ?? 1000;
      
      // Calculate new width with constraints
      const newWidth = Math.min(
        Math.max(minWidth, resizeState.startWidth + delta),
        maxWidth
      );

      setColumnWidths(prev => ({
        ...prev,
        [resizeState.columnIndex!]: newWidth
      }));

      onColumnResize?.(resizeState.columnIndex, newWidth);
    },
    [resizeState, onColumnResize, columns]
  );

  const handleResizeEnd = useCallback(() => {
    setResizeState({
      isResizing: false,
      columnIndex: null,
      startX: 0,
      startWidth: 0
    });
  }, []);

  const getColumnWidth = useCallback(
    (columnIndex: number): number => {
      return columnWidths[columnIndex] ?? columns[columnIndex]?.width ?? 100;
    },
    [columnWidths, columns]
  );

  const resetColumnWidths = useCallback(() => {
    setColumnWidths({});
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(actualStorageKey);
      } catch (error) {
        console.warn('Failed to remove column widths from localStorage:', error);
      }
    }
  }, [actualStorageKey]);

  const setColumnWidth = useCallback(
    (columnIndex: number, width: number) => {
      const column = columns[columnIndex];
      const minWidth = column?.minWidth ?? 50;
      const maxWidth = column?.maxWidth ?? 1000;
      const constrainedWidth = Math.min(Math.max(minWidth, width), maxWidth);
      
      setColumnWidths(prev => ({
        ...prev,
        [columnIndex]: constrainedWidth
      }));
      
      onColumnResize?.(columnIndex, constrainedWidth);
    },
    [columns, onColumnResize]
  );

  const getTotalColumnsWidth = useCallback((): number => {
    return columns.reduce((sum, col, index) => {
      return sum + (columnWidths[index] ?? col.width ?? 100);
    }, 0);
  }, [columns, columnWidths]);

  return {
    resizeState,
    columnWidths,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getColumnWidth,
    setColumnWidth,
    resetColumnWidths,
    getTotalColumnsWidth
  };
}
