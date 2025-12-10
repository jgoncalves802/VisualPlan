/**
 * GanttGrid - Primavera P6 Professional Style with Theme Support
 * Supports inline editing for text, dates, numbers, duration, progress, and dependencies
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import type { Task, ColumnConfig, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { ChevronRight, ChevronDown, Plus, GripVertical } from 'lucide-react';
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
  onColumnReorder?: (columns: ColumnConfig[]) => void;
  onWBSUpdate?: (taskId: string, newWBS: string) => void;
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  onResourceUpdate?: (taskId: string, assignments: ResourceAssignment[]) => void;
  criticalPathIds?: string[];
  enableInlineEdit?: boolean;
  calendars?: CalendarOption[];
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onRowMove?: (taskId: string, newParentId: string | null, newIndex: number) => void;
  onInsertRow?: (afterTaskId: string | null) => void;
  enableRowDragDrop?: boolean;
  showInsertButtons?: boolean;
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
  onColumnReorder,
  onWBSUpdate,
  resources = [],
  allocations = [],
  onResourceUpdate,
  criticalPathIds = [],
  enableInlineEdit = true,
  calendars = [],
  onKeyDown,
  onRowMove,
  onInsertRow,
  enableRowDragDrop = false,
  showInsertButtons = false
}: GanttGridProps) {
  const actualHeaderHeight = headerHeight ?? rowHeight;
  const { theme } = useGanttTheme();
  const colors = theme.colors;
  const gridColors = colors.grid;
  const headerColors = colors.header;
  
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const cancelledRef = useRef(false);
  
  const [dragColumnIndex, setDragColumnIndex] = useState<number | null>(null);
  const [dropColumnIndex, setDropColumnIndex] = useState<number | null>(null);
  
  const [dragRowTaskId, setDragRowTaskId] = useState<string | null>(null);
  const [dropRowIndex, setDropRowIndex] = useState<number | null>(null);
  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);
  
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set());
  const prevTaskIdsRef = useRef<Set<string>>(new Set(tasks.map(t => t.id)));
  
  useEffect(() => {
    const currentIds = new Set(tasks.map(t => t.id));
    const prevIds = prevTaskIdsRef.current;
    
    const added = [...currentIds].filter(id => !prevIds.has(id));
    if (added.length > 0) {
      setNewlyAddedIds(new Set(added));
      setTimeout(() => setNewlyAddedIds(new Set()), 500);
    }
    
    prevTaskIdsRef.current = currentIds;
  }, [tasks]);

  const handleRowDragStart = useCallback((e: React.DragEvent, task: Task) => {
    if (task.isGroup || task.id.startsWith('wbs-')) {
      e.preventDefault();
      return;
    }
    setDragRowTaskId(task.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-blue-500 text-white px-3 py-2 rounded shadow-lg text-sm';
    dragImage.textContent = task.name;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragRowTaskId === null) return;
    e.dataTransfer.dropEffect = 'move';
    setDropRowIndex(index);
  }, [dragRowTaskId]);

  const handleRowDragEnd = useCallback(() => {
    setDragRowTaskId(null);
    setDropRowIndex(null);
  }, []);

  const handleRowDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragRowTaskId || !onRowMove) {
      handleRowDragEnd();
      return;
    }
    
    const targetTask = tasks[targetIndex];
    let newParentId: string | null = null;
    
    if (targetTask?.isGroup || targetTask?.id.startsWith('wbs-')) {
      newParentId = targetTask.id;
    } else if (targetTask?.parentId) {
      newParentId = targetTask.parentId;
    }
    
    onRowMove(dragRowTaskId, newParentId, targetIndex);
    handleRowDragEnd();
  }, [dragRowTaskId, onRowMove, tasks, handleRowDragEnd]);

  const handleInsertRow = useCallback((afterTaskId: string | null) => {
    if (onInsertRow) {
      onInsertRow(afterTaskId);
    }
  }, [onInsertRow]);
  
  const handleColumnDragStart = useCallback((e: React.DragEvent, index: number) => {
    const column = columns[index];
    if (column.field === 'wbs') {
      e.preventDefault();
      return;
    }
    setDragColumnIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, [columns]);
  
  const handleColumnDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragColumnIndex === null) return;
    const column = columns[index];
    if (column.field === 'wbs') return;
    setDropColumnIndex(index);
  }, [dragColumnIndex, columns]);
  
  const handleColumnDragEnd = useCallback(() => {
    setDragColumnIndex(null);
    setDropColumnIndex(null);
  }, []);
  
  const handleColumnDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragColumnIndex === null || !onColumnReorder) return;
    
    const targetColumn = columns[targetIndex];
    if (targetColumn.field === 'wbs') {
      handleColumnDragEnd();
      return;
    }
    
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(dragColumnIndex, 1);
    
    let insertIndex = targetIndex;
    if (dragColumnIndex < targetIndex) {
      insertIndex = targetIndex;
    }
    
    const wbsIndex = newColumns.findIndex(c => c.field === 'wbs');
    if (insertIndex <= wbsIndex && wbsIndex >= 0) {
      insertIndex = wbsIndex + 1;
    }
    
    newColumns.splice(insertIndex, 0, movedColumn);
    onColumnReorder(newColumns);
    handleColumnDragEnd();
  }, [dragColumnIndex, columns, onColumnReorder, handleColumnDragEnd]);

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
        {/* Placeholder to match row drag handle width for column alignment */}
        {enableRowDragDrop && (
          <div className="flex-shrink-0" style={{ width: 20 }} />
        )}
        {columns.map((column, index) => {
          const columnWidth = getColumnWidth(index);
          const isLastColumn = index === columns.length - 1;
          const isWbsColumn = column?.field === 'wbs';
          const isDragging = dragColumnIndex === index;
          const isDropTarget = dropColumnIndex === index && dragColumnIndex !== index;
          
          return (
            <div
              key={column?.field?.toString() ?? index}
              draggable={!isWbsColumn && !!onColumnReorder}
              onDragStart={(e) => handleColumnDragStart(e, index)}
              onDragOver={(e) => handleColumnDragOver(e, index)}
              onDragEnd={handleColumnDragEnd}
              onDrop={(e) => handleColumnDrop(e, index)}
              className={`flex items-center relative group ${isDragging ? 'opacity-50' : ''}`}
              style={{ 
                width: columnWidth, 
                minWidth: column?.minWidth ?? 50,
                paddingLeft: '10px',
                paddingRight: '10px',
                borderRight: isLastColumn ? 'none' : '1px solid rgba(255,255,255,0.1)',
                cursor: isWbsColumn ? 'default' : onColumnReorder ? 'grab' : column?.sortable ? 'pointer' : 'default',
                borderLeft: isDropTarget ? '3px solid #3B82F6' : 'none',
                transition: 'border-left 0.15s ease'
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
          const isMilestone = !isGroup && ((task as any)?.isMilestone === true || ((task as any)?.duration === 0 && !(task as any)?.isGroup));
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
          const isRowDragging = dragRowTaskId === task?.id;
          const isRowDropTarget = dropRowIndex === rowIndex && dragRowTaskId !== task?.id;
          const canDragRow = enableRowDragDrop && !isGroup && !task?.id.startsWith('wbs-');
          const isHovered = hoveredRowIndex === rowIndex;
          const isNewlyAdded = task?.id ? newlyAddedIds.has(task.id) : false;
          
          return (
            <div
              key={task?.id ?? `task-${rowIndex}`}
              className={`gantt-grid-row flex cursor-pointer select-none relative group/row ${isNewlyAdded ? 'gantt-row-fade-in' : ''}`}
              tabIndex={0}
              data-task-id={task?.id}
              data-row-index={rowIndex}
              draggable={canDragRow}
              onDragStart={(e) => canDragRow && handleRowDragStart(e, task)}
              onDragOver={(e) => enableRowDragDrop && handleRowDragOver(e, rowIndex)}
              onDragEnd={handleRowDragEnd}
              onDrop={(e) => enableRowDragDrop && handleRowDrop(e, rowIndex)}
              onMouseEnter={() => setHoveredRowIndex(rowIndex)}
              onMouseLeave={() => setHoveredRowIndex(null)}
              style={{ 
                height: rowHeight,
                ...rowStyle,
                transition: 'background-color 0.15s ease, opacity 0.3s ease, transform 0.3s ease',
                outline: 'none',
                opacity: isRowDragging ? 0.5 : 1,
                borderTop: isRowDropTarget ? '2px solid #3B82F6' : 'none',
                ...(isNewlyAdded && {
                  animation: 'rowFadeIn 0.3s ease-out',
                  backgroundColor: `${gridColors.selectedBorder}20`
                })
              }}
              onMouseDownCapture={(e) => {
                // Capture phase: Select task and focus row BEFORE any cell stopPropagation
                // This ensures keyboard events work for Shift+Arrow indent/outdent
                // BUT skip if clicking on an inline editor (input, select, etc)
                const target = e.target as HTMLElement;
                const isInteractiveElement = target.closest('input, select, textarea, button, [contenteditable="true"]');
                if (isInteractiveElement) return;
                
                // Select task during capture phase so selectedTaskId is set for keyboard events
                // Pass the event so modifier keys (shift/ctrl) work for multi-selection
                if (onTaskSelect) {
                  onTaskSelect(task, e);
                } else {
                  onTaskClick?.(task);
                }
                
                const row = e.currentTarget;
                requestAnimationFrame(() => row.focus());
              }}
              onClick={() => {
                // Selection now happens in onMouseDownCapture, but keep this for backwards compat
                // Don't re-select if already handled
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (onTaskContextMenu) {
                  onTaskContextMenu(task, e);
                } else {
                  onTaskClick?.(task);
                }
              }}
              onKeyDown={(e) => {
                if (onKeyDown) {
                  onKeyDown(e);
                }
                if (e.shiftKey && (e.key === '+' || e.key === '=') && onInsertRow) {
                  e.preventDefault();
                  onInsertRow(task?.id ?? null);
                }
              }}
            >
              {/* Placeholder/drag handle to maintain column alignment */}
              {enableRowDragDrop && (
                <div
                  className={`flex-shrink-0 flex items-center justify-center transition-opacity ${canDragRow ? 'opacity-0 group-hover/row:opacity-100 cursor-grab' : ''}`}
                  style={{ width: 20, height: rowHeight }}
                  title={canDragRow ? "Arraste para mover" : undefined}
                >
                  {canDragRow && <GripVertical size={14} className="text-gray-400" />}
                </div>
              )}
              
              {showInsertButtons && isHovered && !isGroup && (
                <button
                  className="absolute left-0 -bottom-2 z-10 w-full h-4 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  style={{ transform: 'translateY(50%)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInsertRow(task?.id ?? null);
                  }}
                  title="Inserir linha abaixo (Shift++)"
                >
                  <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs shadow-lg">
                    <Plus size={12} />
                    <span>Nova linha</span>
                  </div>
                </button>
              )}
              
              {columns.map((column, colIndex) => {
                const isNameColumn = column?.field === 'name';
                // ONLY apply indent to name column - other columns stay aligned
                const indent = isNameColumn ? (level * 20 + 10) : 10;
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
