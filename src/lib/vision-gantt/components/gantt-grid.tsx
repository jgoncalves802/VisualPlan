/**
 * GanttGrid - Primavera P6 Professional Style with Theme Support
 */

import { useEffect } from 'react';
import type { Task, ColumnConfig, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useColumnResize } from '../hooks/use-column-resize';
import { EditableWBSCell } from './editable-wbs-cell';
import { EditableResourceCell } from './editable-resource-cell';
import { useGanttTheme } from '../context/theme-context';

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
  onTaskSelect?: (task: Task, event?: React.MouseEvent) => void;
  onTaskContextMenu?: (task: Task, event: React.MouseEvent) => void;
  onToggleExpand?: (taskId: string) => void;
  onCellDoubleClick?: (task: Task, columnField: string) => void;
  selectedTaskId?: string;
  selectedTaskIds?: string[];
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
  onTaskSelect,
  onTaskContextMenu,
  onToggleExpand,
  onCellDoubleClick,
  selectedTaskId,
  selectedTaskIds = [],
  onColumnResize,
  onWBSUpdate,
  resources = [],
  allocations = [],
  onResourceUpdate,
  criticalPathIds = []
}: GanttGridProps) {
  const actualHeaderHeight = headerHeight ?? rowHeight;
  const { theme } = useGanttTheme();
  const colors = theme.colors;
  const gridColors = colors.grid;
  const headerColors = colors.header;

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getColumnWidth
  } = useColumnResize({ columns, onColumnResize });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleResizeMove(e.clientX);
    const handleMouseUp = () => handleResizeEnd();

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
      className="gantt-grid"
      style={{
        backgroundColor: gridColors.rowEven,
        borderRight: `1px solid ${gridColors.border}`,
        cursor: resizeState.isResizing ? 'col-resize' : 'default',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.gridLabel.fontSize
      }}
    >
      {resizeState.isResizing && (
        <div className="absolute inset-0 z-20" style={{ cursor: 'col-resize' }} />
      )}

      <div
        className="gantt-grid-header flex sticky top-0 z-10"
        style={{ 
          height: actualHeaderHeight,
          background: `linear-gradient(180deg, ${headerColors.background} 0%, ${headerColors.border} 100%)`,
          borderBottom: `1px solid ${headerColors.border}`
        }}
      >
        {columns.map((column, index) => {
          const columnWidth = getColumnWidth(index);
          const isLastColumn = index === columns.length - 1;
          
          return (
            <div
              key={column?.field?.toString() ?? index}
              className="flex items-center relative group"
              style={{ 
                width: columnWidth, 
                minWidth: column?.minWidth ?? 50,
                paddingLeft: '10px',
                paddingRight: '10px',
                borderRight: isLastColumn ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: column?.sortable ? 'pointer' : 'default'
              }}
            >
              <span 
                className="truncate flex-1"
                style={{
                  color: headerColors.text,
                  fontWeight: theme.typography.headerLabel.fontWeight,
                  fontSize: theme.typography.headerLabel.fontSize,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em'
                }}
              >
                {column?.header ?? ''}
              </span>
              
              {column?.resizable !== false && (
                <div
                  className="absolute right-0 top-0 h-full w-2 cursor-col-resize opacity-0 group-hover:opacity-100"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResizeStart(index, e.clientX);
                  }}
                >
                  <div 
                    className="absolute right-0 top-0 h-full w-px"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="gantt-grid-body">
        {tasks.map((task, rowIndex) => {
          const isSelected = task?.id === selectedTaskId || selectedTaskIds.includes(task?.id ?? '');
          const isEven = rowIndex % 2 === 0;
          const isGroup = task?.isGroup === true;
          const isMilestone = (task as any)?.isMilestone === true || (task as any)?.duration === 0;
          const isCritical = criticalPathIds.includes(task?.id ?? '');
          const level = task?.level ?? 0;
          const isProject = isGroup && level === 0;
          const isWBS = isGroup && level > 0;
          
          const getRowStyle = () => {
            if (isProject) {
              return {
                backgroundColor: colors.summaryProject.fill,
                color: colors.summaryProject.text,
                borderBottom: `1px solid ${colors.summaryProject.stroke}`
              };
            }
            if (isWBS) {
              return {
                backgroundColor: colors.summaryWBS.fill,
                color: colors.summaryWBS.text,
                borderBottom: `1px solid ${colors.summaryWBS.stroke}`
              };
            }
            if (isSelected) {
              return {
                backgroundColor: gridColors.selected,
                color: gridColors.rowEven === '#FFFFFF' ? '#1F2937' : '#E5E7EB',
                borderBottom: `1px solid ${gridColors.border}`,
                borderLeft: `2px solid ${gridColors.selectedBorder}`
              };
            }
            if (isCritical) {
              return {
                backgroundColor: colors.timeline.holiday,
                color: gridColors.rowEven === '#FFFFFF' ? '#1F2937' : '#E5E7EB',
                borderBottom: `1px solid ${colors.criticalActivity.stroke}`,
                borderLeft: `2px solid ${colors.criticalActivity.fill}`
              };
            }
            return {
              backgroundColor: isEven ? gridColors.rowEven : gridColors.rowOdd,
              color: gridColors.rowEven === '#FFFFFF' ? '#1F2937' : '#E5E7EB',
              borderBottom: `1px solid ${gridColors.border}`
            };
          };

          const rowStyle = getRowStyle();
          
          return (
            <div
              key={task?.id ?? `task-${rowIndex}`}
              className="gantt-grid-row flex cursor-pointer select-none"
              tabIndex={0}
              data-task-id={task?.id}
              data-row-index={rowIndex}
              style={{ 
                height: rowHeight,
                ...rowStyle,
                transition: 'background-color 0.1s ease',
                outline: 'none'
              }}
              onClick={(e) => {
                if (onTaskSelect) {
                  onTaskSelect(task, e);
                } else {
                  onTaskClick?.(task);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (onTaskContextMenu) {
                  onTaskContextMenu(task, e);
                } else {
                  onTaskClick?.(task);
                }
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = gridColors.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isGroup) {
                  e.currentTarget.style.backgroundColor = rowStyle.backgroundColor as string;
                }
              }}
            >
              {columns.map((column, colIndex) => {
                const isNameColumn = column?.field === 'name';
                const indent = isNameColumn ? level * 20 + 10 : 10;
                const columnWidth = getColumnWidth(colIndex);
                const isWBSColumn = column?.field === 'wbs';
                const isLastColumn = colIndex === columns.length - 1;
                const isDependencyColumn = column?.field === 'predecessors' || column?.field === 'successors';

                return (
                  <div
                    key={`${task?.id}-${column?.field?.toString()}` ?? `cell-${rowIndex}-${colIndex}`}
                    className="flex items-center"
                    style={{
                      width: columnWidth,
                      minWidth: column?.minWidth ?? 50,
                      paddingLeft: `${indent}px`,
                      paddingRight: '10px',
                      borderRight: isLastColumn ? 'none' : `1px solid ${isGroup ? 'rgba(255,255,255,0.15)' : gridColors.border}`,
                      fontWeight: isGroup ? 600 : theme.typography.gridLabel.fontWeight,
                      fontSize: isGroup ? '11px' : theme.typography.gridLabel.fontSize,
                      cursor: isDependencyColumn && !isGroup ? 'pointer' : 'inherit'
                    }}
                    onDoubleClick={(e) => {
                      if (isDependencyColumn && !isGroup && onCellDoubleClick) {
                        e.stopPropagation();
                        onCellDoubleClick(task, column.field as string);
                      }
                    }}
                    title={isDependencyColumn && !isGroup ? 'Duplo clique para gerenciar dependências' : undefined}
                  >
                    {isNameColumn && isGroup && (
                      <button
                        className="flex-shrink-0 mr-1.5 p-0.5 rounded hover:bg-white/10"
                        style={{ 
                          color: 'rgba(255,255,255,0.9)',
                          transition: 'transform 0.15s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand?.(task.id);
                        }}
                      >
                        {task?.expanded !== false ? (
                          <ChevronDown size={14} strokeWidth={2} />
                        ) : (
                          <ChevronRight size={14} strokeWidth={2} />
                        )}
                      </button>
                    )}

                    {isNameColumn && !isGroup && isMilestone && (
                      <span 
                        style={{ 
                          color: isCritical ? colors.milestone.fillCritical : colors.summaryWBS.fill,
                          fontSize: '10px',
                          marginRight: '4px'
                        }}
                      >
                        ◆
                      </span>
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
                      <span className="truncate flex-1" style={{ lineHeight: '1.5' }}>
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
