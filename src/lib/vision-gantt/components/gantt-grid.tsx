
/**
 * GanttGrid - Left side grid displaying task information
 * Primavera P6 Professional Style
 */

import { useEffect } from 'react';
import type { Task, ColumnConfig, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { ChevronRight, ChevronDown, GripVertical, Flag } from 'lucide-react';
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
  criticalPathIds?: string[];
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
  onResourceUpdate,
  criticalPathIds = []
}: GanttGridProps) {
  const actualHeaderHeight = headerHeight ?? rowHeight;

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getColumnWidth
  } = useColumnResize({ columns, onColumnResize });

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
        backgroundColor: '#FFFFFF',
        borderRight: '2px solid #E5E7EB',
        cursor: resizeState.isResizing ? 'col-resize' : 'default',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {resizeState.isResizing && (
        <div 
          className="absolute inset-0 z-20"
          style={{ backgroundColor: 'transparent', cursor: 'col-resize' }}
        />
      )}

      {/* P6-Style Header - Gray like Primavera P6 */}
      <div
        className="gantt-grid-header flex sticky top-0 z-10"
        style={{ 
          height: actualHeaderHeight,
          background: 'linear-gradient(180deg, #6B7280 0%, #4B5563 100%)',
          borderBottom: '2px solid #4B5563',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {columns.map((column, index) => {
          const columnWidth = getColumnWidth(index);
          const isLastColumn = index === columns.length - 1;
          
          return (
            <div
              key={column?.field?.toString() ?? index}
              className="flex items-center transition-colors relative group"
              style={{ 
                width: columnWidth, 
                minWidth: column?.minWidth ?? 50,
                paddingLeft: '12px',
                paddingRight: '12px',
                borderRight: isLastColumn ? 'none' : '1px solid rgba(255,255,255,0.15)',
                cursor: column?.sortable ? 'pointer' : 'default'
              }}
            >
              <span 
                className="truncate flex-1 text-white font-semibold text-sm uppercase tracking-wide"
                style={{ letterSpacing: '0.05em' }}
              >
                {column?.header ?? ''}
              </span>
              
              {column?.resizable !== false && (
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{
                    backgroundColor: resizeState.isResizing && resizeState.columnIndex === index 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'transparent'
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResizeStart(index, e.clientX);
                  }}
                >
                  <div 
                    className="absolute right-0 top-0 h-full w-[2px] transition-colors"
                    style={{
                      backgroundColor: resizeState.isResizing && resizeState.columnIndex === index
                        ? 'rgba(255, 255, 255, 0.8)'
                        : 'rgba(255, 255, 255, 0.3)'
                    }}
                  />
                  <div className="absolute right-[-3px] top-1/2 transform -translate-y-1/2 w-2 h-6 flex items-center justify-center bg-white/20 rounded-sm">
                    <GripVertical size={12} className="text-white/70" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* P6-Style Rows */}
      <div className="gantt-grid-body">
        {tasks.map((task, rowIndex) => {
          const isSelected = task?.id === selectedTaskId;
          const isEven = rowIndex % 2 === 0;
          const isGroup = task?.isGroup === true || hasChildren(task);
          const isMilestone = (task as any)?.isMilestone === true || (task as any)?.duration === 0;
          const isCritical = criticalPathIds.includes(task?.id ?? '');
          const level = task?.level ?? 0;
          
          // P6-style row backgrounds - Project (green), WBS (yellow), Activity (white/gray)
          const getRowBackgroundColor = () => {
            // Check if it's a Project level (level 0 group)
            if (isGroup && level === 0) return '#16A34A'; // Project - green like P6
            // Check if it's a WBS level (level 1+ group)
            if (isGroup) return '#FACC15'; // WBS - yellow like P6
            if (isSelected) return '#DBEAFE'; // Selected row
            if (isCritical) return '#FEF2F2'; // Critical path - light red
            return isEven ? '#FFFFFF' : '#F8FAFC';
          };

          const getTextColor = () => {
            if (isGroup && level === 0) return '#FFFFFF'; // White for Project
            if (isGroup) return '#1F2937'; // Dark for WBS (yellow bg)
            return '#1F2937';
          };

          const getBorderColor = () => {
            if (isCritical && !isGroup) return '#FCA5A5';
            if (isGroup && level === 0) return '#15803D'; // Darker green for project
            if (isGroup) return '#EAB308'; // Darker yellow for WBS
            return '#E5E7EB';
          };
          
          return (
            <div
              key={task?.id ?? `task-${rowIndex}`}
              className="gantt-grid-row flex cursor-pointer transition-all duration-150"
              style={{ 
                height: rowHeight,
                backgroundColor: getRowBackgroundColor(),
                borderBottom: `1px solid ${getBorderColor()}`,
                borderLeft: isCritical && !isGroup ? '3px solid #DC2626' : 'none',
              }}
              onClick={() => onTaskClick?.(task)}
              onMouseEnter={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = isCritical ? '#FEE2E2' : '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = getRowBackgroundColor();
                }
              }}
            >
              {columns.map((column, colIndex) => {
                const isNameColumn = column?.field === 'name';
                const paddingLeft = isNameColumn ? level * 24 + 12 : 12;
                const columnWidth = getColumnWidth(colIndex);
                const isWBSColumn = column?.field === 'wbs';
                const isLastColumn = colIndex === columns.length - 1;

                return (
                  <div
                    key={`${task?.id}-${column?.field?.toString()}` ?? `cell-${rowIndex}-${colIndex}`}
                    className="flex items-center"
                    style={{
                      width: columnWidth,
                      minWidth: column?.minWidth ?? 50,
                      paddingLeft: `${paddingLeft}px`,
                      paddingRight: '12px',
                      borderRight: isLastColumn ? 'none' : `1px solid ${isGroup ? 'rgba(255,255,255,0.15)' : '#E5E7EB'}`,
                      fontSize: '13px',
                      fontWeight: isGroup ? 600 : 400,
                      color: getTextColor(),
                      overflow: 'hidden'
                    }}
                  >
                    {/* Expansion icon for Task Name column */}
                    {isNameColumn && hasChildren(task) && (
                      <button
                        className="flex-shrink-0 transition-all duration-200 mr-2 p-0.5 rounded hover:bg-white/20"
                        style={{ 
                          color: isGroup ? '#FFFFFF' : '#6B7280'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand?.(task.id);
                        }}
                        aria-label={task?.expanded ? 'Collapse' : 'Expand'}
                      >
                        {task?.expanded !== false ? (
                          <ChevronDown size={16} strokeWidth={2.5} />
                        ) : (
                          <ChevronRight size={16} strokeWidth={2.5} />
                        )}
                      </button>
                    )}

                    {/* Icons for milestones and critical tasks */}
                    {isNameColumn && !hasChildren(task) && (
                      <div className="flex items-center mr-2">
                        {isMilestone && (
                          <span 
                            className="text-amber-500 mr-1" 
                            title="Milestone"
                            style={{ fontSize: '14px' }}
                          >
                            ◆
                          </span>
                        )}
                        {isCritical && !isMilestone && (
                          <Flag 
                            size={14} 
                            className="text-red-500 mr-1" 
                            fill="#DC2626"
                          />
                        )}
                      </div>
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
                      <span className="truncate flex-1" style={{ lineHeight: '1.4' }}>
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
