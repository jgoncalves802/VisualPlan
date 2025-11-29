
/**
 * GanttGrid - Left side grid displaying task information
 */



import React, { useState, useEffect } from 'react';
import type { Task, ColumnConfig, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { hasChildren } from '../utils';
import { useColumnResize } from '../hooks/use-column-resize';
import { EditableWBSCell } from './editable-wbs-cell';
import { EditableResourceCell } from './editable-resource-cell';

interface ResourceAssignment {
  resourceId: string;
  resourceName: string;
  units: number;
}

interface GanttGridProps {
  tasks: Task[];
  columns: ColumnConfig[];
  rowHeight: number;
  headerHeight?: number;
  onTaskClick?: (task: Task) => void;
  onToggleExpand?: (taskId: string) => void;
  selectedTaskId?: string;
  onColumnResize?: (columnIndex: number, newWidth: number) => void;
  onWBSUpdate?: (taskId: string, newWBS: string) => void;
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  onResourceUpdate?: (taskId: string, assignments: ResourceAssignment[]) => void;
}

export function GanttGrid({
  tasks,
  columns,
  rowHeight,
  headerHeight,
  onTaskClick,
  onToggleExpand,
  selectedTaskId,
  onColumnResize,
  onWBSUpdate,
  resources = [],
  allocations = [],
  onResourceUpdate
}: GanttGridProps) {
  const actualHeaderHeight = headerHeight ?? rowHeight;

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getColumnWidth
  } = useColumnResize({ columns, onColumnResize });

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleResizeMove(e.clientX);
    };

    const handleMouseUp = () => {
      handleResizeEnd();
    };

    if (resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizeState.isResizing, handleResizeMove, handleResizeEnd]);

  return (
    <div 
      className="gantt-grid overflow-hidden relative"
      style={{
        backgroundColor: 'var(--gantt-grid-background)',
        borderRight: '1px solid var(--gantt-grid-border)',
        cursor: resizeState.isResizing ? 'col-resize' : 'default'
      }}
    >
      {/* Overlay during resize */}
      {resizeState.isResizing && (
        <div 
          className="absolute inset-0 z-20"
          style={{ 
            backgroundColor: 'transparent',
            cursor: 'col-resize'
          }}
        />
      )}
      {/* Header */}
      <div
        className="gantt-grid-header flex sticky top-0 z-10"
        style={{ 
          height: actualHeaderHeight,
          backgroundColor: 'var(--gantt-grid-header-background)',
          borderBottom: '1px solid var(--gantt-grid-border)',
          fontSize: 'var(--gantt-font-size-base)',
          fontWeight: 'var(--gantt-font-weight-medium)',
          color: 'var(--gantt-text-base)'
        }}
      >
        {columns.map((column, index) => {
          const columnWidth = getColumnWidth(index);
          
          return (
            <div
              key={column?.field?.toString() ?? index}
              className="flex items-center transition-colors relative group"
              style={{ 
                width: columnWidth, 
                minWidth: column?.minWidth ?? 50,
                paddingLeft: 'var(--gantt-spacing-md)',
                paddingRight: 'var(--gantt-spacing-md)',
                borderRight: '1px solid var(--gantt-border-light)',
                cursor: column?.sortable ? 'pointer' : 'default'
              }}
            >
              <span className="truncate flex-1">{column?.header ?? ''}</span>
              
              {/* Resize Handle */}
              {column?.resizable !== false && (
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{
                    backgroundColor: resizeState.isResizing && resizeState.columnIndex === index 
                      ? 'rgba(59, 130, 246, 0.3)' 
                      : 'transparent'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResizeStart(index, e.clientX);
                  }}
                >
                  {/* Visual indicator */}
                  <div 
                    className="absolute right-0 top-0 h-full w-[2px] transition-colors"
                    style={{
                      backgroundColor: resizeState.isResizing && resizeState.columnIndex === index
                        ? 'rgb(59, 130, 246)'
                        : 'rgba(148, 163, 184, 0.5)'
                    }}
                  />
                  
                  {/* Grip icon */}
                  <div className="absolute right-[-3px] top-1/2 transform -translate-y-1/2 w-2 h-6 flex items-center justify-center bg-white/80 rounded-sm shadow-sm">
                    <GripVertical size={12} className="text-gray-500" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rows */}
      <div className="gantt-grid-body">
        {tasks.map((task, rowIndex) => {
          const isSelected = task?.id === selectedTaskId;
          const isEven = rowIndex % 2 === 0;
          const isGroup = task?.isGroup === true;
          
          // MS Project style: Groups have blue background
          const getRowBackgroundColor = () => {
            if (isGroup) return '#0078D4'; // MS Project blue
            if (isSelected) return 'var(--gantt-grid-row-selected)';
            return isEven ? 'var(--gantt-grid-background)' : 'var(--gantt-grid-row-alt)';
          };
          
          return (
            <div
              key={task?.id ?? `task-${rowIndex}`}
              className="gantt-grid-row flex cursor-pointer transition-all duration-150"
              style={{ 
                height: rowHeight,
                backgroundColor: getRowBackgroundColor(),
                borderBottom: '1px solid var(--gantt-border-light)',
                fontWeight: isGroup ? 600 : 400,
                color: isGroup ? 'white' : 'var(--gantt-text-base)'
              }}
              onClick={() => onTaskClick?.(task)}
              onMouseEnter={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = 'var(--gantt-grid-row-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = isEven 
                    ? 'var(--gantt-grid-background)' 
                    : 'var(--gantt-grid-row-alt)';
                }
              }}
            >
              {columns.map((column, colIndex) => {
                const isFirstColumn = colIndex === 0;
                const isNameColumn = column?.field === 'name';
                const level = task?.level ?? 0;
                // Indentation only in Task Name column
                const paddingLeft = isNameColumn ? level * 20 + 12 : 12;
                const columnWidth = getColumnWidth(colIndex);
                const isWBSColumn = column?.field === 'wbs';

                return (
                  <div
                    key={`${task?.id}-${column?.field?.toString()}` ?? `cell-${rowIndex}-${colIndex}`}
                    className="flex items-center"
                    style={{
                      width: columnWidth,
                      minWidth: column?.minWidth ?? 50,
                      paddingLeft: `${paddingLeft}px`,
                      paddingRight: 'var(--gantt-spacing-md)',
                      borderRight: '1px solid var(--gantt-border-light)',
                      fontSize: 'var(--gantt-font-size-base)',
                      fontWeight: hasChildren(task) && isNameColumn 
                        ? 'var(--gantt-font-weight-medium)' 
                        : 'var(--gantt-font-weight-normal)',
                      color: isGroup ? 'white' : 'var(--gantt-text-base)',
                      overflow: 'hidden' // Prevent text overflow
                    }}
                  >
                    {/* Expansion icon only in Task Name column */}
                    {isNameColumn && hasChildren(task) && !isGroup && (
                      <button
                        className="flex-shrink-0 transition-colors hover:opacity-70"
                        style={{ 
                          marginRight: 'var(--gantt-spacing-sm)',
                          color: isGroup ? 'white' : 'var(--gantt-icons)'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand?.(task.id);
                        }}
                        aria-label={task?.expanded ? 'Collapse' : 'Expand'}
                      >
                        {task?.expanded !== false ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    )}
                    {isWBSColumn ? (
                      <EditableWBSCell 
                        task={task}
                        value={(task as any)?.[column.field]}
                        onUpdate={onWBSUpdate}
                      />
                    ) : column?.field === 'resources' ? (
                      <EditableResourceCell 
                        task={task}
                        resources={resources}
                        allocations={allocations}
                        onUpdate={onResourceUpdate}
                      />
                    ) : (
                      <span className="truncate" style={{ flex: 1 }}>
                        {column?.renderer
                          ? column.renderer((task as any)?.[column.field], task)
                          : (task as any)?.[column.field]?.toString() ?? ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
