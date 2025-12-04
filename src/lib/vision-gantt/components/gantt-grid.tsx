/**
 * GanttGrid - Primavera P6 Professional Style with Theme Support
 * Supports inline editing for text, dates, numbers, duration, progress, and dependencies
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Task, ColumnConfig, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useColumnResize } from '../hooks/use-column-resize';
import { EditableWBSCell } from './editable-wbs-cell';
import { EditableResourceCell } from './editable-resource-cell';
import { useGanttTheme } from '../context/theme-context';
import { getColumnEditorType, InlineEditCell, type ColumnEditorType } from './inline-editors';

interface ResourceAssignment {
  resourceId: string;
  resourceName: string;
  units: number;
}

interface EditingCell {
  taskId: string;
  field: string;
}

interface CalendarOption {
  id: string;
  name: string;
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
  onCellEdit?: (taskId: string, field: string, value: any) => void;
  selectedTaskId?: string;
  selectedTaskIds?: string[];
  onColumnResize?: (columnIndex: number, newWidth: number) => void;
  onWBSUpdate?: (taskId: string, newWBS: string) => void;
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  onResourceUpdate?: (taskId: string, assignments: ResourceAssignment[]) => void;
  criticalPathIds?: string[];
  enableInlineEdit?: boolean;
  calendars?: CalendarOption[];
  onKeyDown?: (e: React.KeyboardEvent) => void;
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
  onCellEdit,
  selectedTaskId,
  selectedTaskIds = [],
  onColumnResize,
  onWBSUpdate,
  resources = [],
  allocations = [],
  onResourceUpdate,
  criticalPathIds = [],
  enableInlineEdit = true,
  calendars = [],
  onKeyDown
}: GanttGridProps) {
  const actualHeaderHeight = headerHeight ?? rowHeight;
  const { theme } = useGanttTheme();
  const colors = theme.colors;
  const gridColors = colors.grid;
  const headerColors = colors.header;
  
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const cancelledRef = useRef(false);

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    getColumnWidth
  } = useColumnResize({ columns, onColumnResize });
  
  const handleStartEdit = useCallback((taskId: string, field: string, editorType: ColumnEditorType) => {
    if (!enableInlineEdit || editorType === 'readonly') return;
    cancelledRef.current = false;
    setEditingCell({ taskId, field });
  }, [enableInlineEdit]);
  
  const handleCommitEdit = useCallback((taskId: string, field: string, value: any) => {
    if (cancelledRef.current) {
      setEditingCell(null);
      return;
    }
    setEditingCell(null);
    if (onCellEdit && value !== null && value !== undefined) {
      onCellEdit(taskId, field, value);
    }
  }, [onCellEdit]);
  
  const handleCancelEdit = useCallback(() => {
    cancelledRef.current = true;
    setEditingCell(null);
  }, []);

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
              onMouseDownCapture={(e) => {
                // Capture phase: Focus the row BEFORE any cell stopPropagation
                // This ensures keyboard events work for Shift+Arrow indent/outdent
                // BUT skip if clicking on an inline editor (input, select, etc)
                const target = e.target as HTMLElement;
                const isInteractiveElement = target.closest('input, select, textarea, button, [contenteditable="true"]');
                if (isInteractiveElement) return;
                
                const row = e.currentTarget;
                requestAnimationFrame(() => row.focus());
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
              onKeyDown={(e) => {
                // Forward keyboard events to parent for Shift+Arrow indent/outdent
                if (onKeyDown) {
                  onKeyDown(e);
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
                const fieldName = column?.field as string;
                const editorType = getColumnEditorType(fieldName);
                const isEditing = editingCell?.taskId === task?.id && editingCell?.field === fieldName;
                const canEdit = enableInlineEdit && !isGroup && editorType !== 'readonly';

                return (
                  <div
                    key={`${task?.id}-${fieldName}`}
                    className="flex items-center"
                    style={{
                      width: columnWidth,
                      minWidth: column?.minWidth ?? 50,
                      paddingLeft: `${indent}px`,
                      paddingRight: '10px',
                      borderRight: isLastColumn ? 'none' : `1px solid ${isGroup ? 'rgba(255,255,255,0.15)' : gridColors.border}`,
                      fontWeight: isGroup ? 600 : theme.typography.gridLabel.fontWeight,
                      fontSize: isGroup ? '11px' : theme.typography.gridLabel.fontSize,
                      cursor: canEdit ? 'text' : (isDependencyColumn && !isGroup ? 'pointer' : 'inherit')
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Single click on dependency columns starts inline editing
                      if (isDependencyColumn && !isGroup && enableInlineEdit) {
                        handleStartEdit(task.id, fieldName, editorType);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      // Double click on dependency columns opens modal
                      if (isDependencyColumn && !isGroup && onCellDoubleClick) {
                        // Cancel any inline editing first
                        handleCancelEdit();
                        onCellDoubleClick(task, fieldName);
                      } else if (canEdit && !isDependencyColumn) {
                        handleStartEdit(task.id, fieldName, editorType);
                      }
                    }}
                    title={isDependencyColumn && !isGroup ? 'Clique para editar, duplo clique para gerenciar dependências' : (canEdit ? 'Duplo clique para editar' : undefined)}
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

                    {isEditing ? (
                      <InlineEditCell
                        task={task}
                        field={fieldName}
                        value={(task as any)?.[fieldName]}
                        editorType={editorType}
                        onCommit={handleCommitEdit}
                        onCancel={handleCancelEdit}
                        calendars={calendars}
                      />
                    ) : isWBSColumn ? (
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
