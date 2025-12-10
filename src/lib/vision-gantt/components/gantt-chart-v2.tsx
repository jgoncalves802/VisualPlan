/**
 * GanttChartV2 - New architecture with internal controller
 * 
 * Key differences from v1:
 * 1. Uses useGanttController internally - single source of truth
 * 2. No bidirectional data flow - props only initialize
 * 3. All hierarchy changes are internal, emitted to parent via callbacks
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import type { Task, Dependency, ViewPreset, GanttConfig, ViewPresetConfig, ColumnConfig } from '../types';
import { GanttGrid } from './gantt-grid';
import { GanttTimeline } from './gantt-timeline';
import { ZoomControl } from './zoom-control';
import { TimeScaleConfigDialog } from './time-scale-config-dialog';
import { useGanttController } from '../hooks/use-gantt-controller';
import { DependencyStore } from '../stores';
import { useDragDrop } from '../hooks/use-drag-drop';
import { useResize } from '../hooks/use-resize';
import { useDependencyCreation } from '../hooks/use-dependency-creation';
import { useKeyboardLinking } from '../hooks/use-keyboard-linking';
import { useTimelineRange } from '../hooks/use-timeline-range';
import { useSplitter } from '../hooks/use-splitter';
import { useZoomWheel } from '../hooks/use-zoom-wheel';
import { useColumnResize } from '../hooks/use-column-resize';
import { getPixelsPerDay, getViewPreset, VIEW_PRESETS } from '../config/view-presets';
import { DEFAULT_COLUMNS } from '../config/default-columns';
import { flattenTasks } from '../utils';
import { Settings2, Layers, ChevronDown, Flag, AlertTriangle } from 'lucide-react';

export interface GanttChartV2Props extends GanttConfig {
  className?: string;
  gridWidth?: number;
  height?: number;
  criticalPathIds?: string[];
  nearCriticalPathIds?: string[];
  violationTaskIds?: string[];
  conflictTaskIds?: string[];
  projectName?: string;
  onDependencyClick?: (dependency: Dependency, fromTask: Task, toTask: Task) => void;
  onTasksChange?: (tasks: Task[]) => void;
  onCellDoubleClick?: (task: Task, columnField: string) => void;
  onColumnReorder?: (columns: ColumnConfig[]) => void;
  onTaskSelect?: (task: Task) => void;
  onRowMove?: (taskId: string, newParentId: string | null, newIndex: number) => void;
  onInsertRow?: (afterTaskId: string | null) => void;
  enableRowDragDrop?: boolean;
  showInsertButtons?: boolean;
}

export function GanttChartV2({
  tasks: initialTasks,
  dependencies: initialDependencies,
  resources: _initialResources,
  calendars: _initialCalendars,
  viewPreset: initialViewPreset = 'month',
  columns = DEFAULT_COLUMNS,
  rowHeight = 44,
  barHeight = 24,
  barRadius = 4,
  gridWidth = 700,
  height = 600,
  enableDragDrop = true,
  enableResize = true,
  enableDependencyCreation = false,
  onTaskUpdate,
  onTaskClick,
  onTaskDoubleClick: _onTaskDoubleClick,
  onDependencyCreate,
  onDependencyDelete: _onDependencyDelete,
  onViewPresetChange,
  onDependencyClick,
  onTasksChange,
  onCellDoubleClick,
  onColumnReorder,
  onTaskSelect,
  onRowMove,
  onInsertRow,
  enableRowDragDrop = false,
  showInsertButtons = false,
  className = '',
  criticalPathIds = [],
  nearCriticalPathIds = [],
  violationTaskIds = [],
  conflictTaskIds = [],
  projectName = 'Project Schedule'
}: GanttChartV2Props) {
  const [viewPreset, setViewPreset] = useState<ViewPreset>(initialViewPreset);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [dependencyMode, _setDependencyMode] = useState(enableDependencyCreation);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [customPresetConfig, setCustomPresetConfig] = useState<ViewPresetConfig | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  const gridScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const dependencyStoreRef = useRef<DependencyStore | null>(null);

  const {
    getTotalColumnsWidth
  } = useColumnResize({ columns, storageKey: 'gantt-main' });

  const persistedColumnsWidth = getTotalColumnsWidth();

  const {
    containerRef,
    gridWidth: splitterGridWidth,
    isDragging: isSplitterDragging,
    handleSplitterMouseDown
  } = useSplitter({
    storageKey: 'gantt-main',
    defaultGridWidth: Math.max(gridWidth, persistedColumnsWidth),
    minGridWidth: Math.max(300, persistedColumnsWidth * 0.7),
    minTimelineWidth: 200
  });

  // Initialize dependency store once
  if (dependencyStoreRef.current === null) {
    dependencyStoreRef.current = new DependencyStore(initialDependencies);
  }
  
  const [dependencies, setDependencies] = useState<Dependency[]>(initialDependencies);
  
  useEffect(() => {
    const unsubscribe = dependencyStoreRef.current?.subscribe(setDependencies);
    return () => unsubscribe?.();
  }, []);

  // Sync dependency changes
  useEffect(() => {
    if (!dependencyStoreRef.current) return;
    const currentIds = dependencyStoreRef.current.getAll().map(d => d.id).sort().join(',');
    const newIds = initialDependencies.map(d => d.id).sort().join(',');
    if (newIds !== currentIds) {
      dependencyStoreRef.current.setData(initialDependencies);
    }
  }, [initialDependencies]);

  // THE CONTROLLER - Single source of truth for tasks
  const controller = useGanttController(initialTasks, {
    onTaskChange: (task) => {
      console.log('[GanttChartV2] Task changed:', task.id, task.name, 'parentId:', task.parentId);
      onTaskUpdate?.(task);
    },
    onTasksChange: (tasks) => {
      console.log('[GanttChartV2] Tasks batch changed, count:', tasks.length);
      onTasksChange?.(tasks);
    }
  });

  // Use controller's tasks and methods
  const taskTree = controller.getTaskTree();
  const flatTasks = flattenTasks(taskTree);
  
  // SCROLL PRESERVATION - Save scroll position before task updates, restore after
  const scrollPositionRef = useRef<{ grid: number; timeline: number }>({ grid: 0, timeline: 0 });
  const previousTaskCountRef = useRef(flatTasks.length);
  
  // Save scroll position whenever tasks are about to change
  useLayoutEffect(() => {
    // Only restore if we have a saved position and task count hasn't changed dramatically
    // (dramatic change = structural change like collapse/expand)
    const taskCountDelta = Math.abs(flatTasks.length - previousTaskCountRef.current);
    const isIncrementalUpdate = taskCountDelta <= 1;
    
    if (isIncrementalUpdate && scrollPositionRef.current.grid > 0) {
      // Restore scroll position after render
      if (gridScrollRef.current) {
        gridScrollRef.current.scrollTop = scrollPositionRef.current.grid;
      }
      if (timelineScrollRef.current) {
        timelineScrollRef.current.scrollTop = scrollPositionRef.current.timeline;
      }
    }
    
    previousTaskCountRef.current = flatTasks.length;
  }, [flatTasks]);
  
  // Capture scroll position periodically (on scroll events)
  useEffect(() => {
    const captureScroll = () => {
      if (gridScrollRef.current) {
        scrollPositionRef.current.grid = gridScrollRef.current.scrollTop;
      }
      if (timelineScrollRef.current) {
        scrollPositionRef.current.timeline = timelineScrollRef.current.scrollTop;
      }
    };
    
    const gridEl = gridScrollRef.current;
    const timelineEl = timelineScrollRef.current;
    
    gridEl?.addEventListener('scroll', captureScroll, { passive: true });
    timelineEl?.addEventListener('scroll', captureScroll, { passive: true });
    
    return () => {
      gridEl?.removeEventListener('scroll', captureScroll);
      timelineEl?.removeEventListener('scroll', captureScroll);
    };
  }, []);
  
  console.log('[GanttChartV2] Tasks from controller:', controller.tasks.slice(0, 3).map(t => ({ id: t.id, name: t.name, level: t.level, parentId: t.parentId, isGroup: t.isGroup })));
  console.log('[GanttChartV2] TaskTree root count:', taskTree.length, 'first:', taskTree[0]?.name, 'children:', taskTree[0]?.children?.length);
  console.log('[GanttChartV2] FlatTasks levels:', flatTasks.slice(0, 5).map(t => ({ name: t.name, level: t.level, parentId: t.parentId })));

  const timelineRange = useTimelineRange(flatTasks);
  const pixelsPerDay = getPixelsPerDay(viewPreset);

  const handleTaskUpdateInternal = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      controller.updateTask(taskId, updates);
    },
    [controller]
  );

  const {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  } = useDragDrop({
    pixelsPerDay,
    timelineStart: timelineRange.startDate,
    onTaskUpdate: handleTaskUpdateInternal,
    enabled: enableDragDrop
  });

  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd
  } = useResize({
    pixelsPerDay,
    timelineStart: timelineRange.startDate,
    onTaskUpdate: handleTaskUpdateInternal,
    enabled: enableResize
  });

  const {
    creationState: _creationState,
    startCreation: _startCreation,
    completeCreation: _completeCreation,
    cancelCreation: _cancelCreation
  } = useDependencyCreation({
    onDependencyCreate: (fromId, toId, type) => {
      const success = dependencyStoreRef.current?.createDependency(fromId, toId, type);
      if (success) {
        const dep = dependencyStoreRef.current?.findDependency(fromId, toId);
        if (dep) {
          onDependencyCreate?.(dep);
        }
      }
    },
    enabled: dependencyMode
  });

  const handleCreateDependency = useCallback(
    (fromTaskId: string, toTaskId: string, type: any, lag: number = 0) => {
      const success = dependencyStoreRef.current?.createDependency(fromTaskId, toTaskId, type, lag);
      if (success) {
        const dep = dependencyStoreRef.current?.findDependency(fromTaskId, toTaskId);
        if (dep) {
          onDependencyCreate?.(dep);
        }
      }
    },
    [onDependencyCreate]
  );

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedTaskIds([taskId]);
  }, []);

  useKeyboardLinking({
    tasks: flatTasks,
    selectedTaskId,
    onCreateDependency: handleCreateDependency,
    onSelectTask: handleSelectTask,
    enabled: dependencyMode
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e);
      handleResizeMove(e);
    };

    const handleMouseUp = () => {
      handleDragEnd();
      handleResizeEnd();
    };

    if (dragState.isDragging || resizeState.isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, resizeState.isResizing, handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);

  useEffect(() => {
    const handleGridScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (timelineScrollRef.current) {
        timelineScrollRef.current.scrollTop = target.scrollTop;
      }
    };

    const handleTimelineScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (gridScrollRef.current) {
        gridScrollRef.current.scrollTop = target.scrollTop;
      }
    };

    const gridEl = gridScrollRef.current;
    const timelineEl = timelineScrollRef.current;

    gridEl?.addEventListener('scroll', handleGridScroll);
    timelineEl?.addEventListener('scroll', handleTimelineScroll);

    return () => {
      gridEl?.removeEventListener('scroll', handleGridScroll);
      timelineEl?.removeEventListener('scroll', handleTimelineScroll);
    };
  }, []);

  const handleTaskClick = useCallback(
    (task: Task) => {
      setSelectedTaskId(task?.id);
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  const handleTaskSelectInternal = useCallback(
    (task: Task, event?: React.MouseEvent) => {
      if (!task?.id) return;
      
      onTaskSelect?.(task);
      
      if (event?.shiftKey && selectedTaskId) {
        const startIndex = flatTasks.findIndex(t => t.id === selectedTaskId);
        const endIndex = flatTasks.findIndex(t => t.id === task.id);
        
        if (startIndex !== -1 && endIndex !== -1) {
          const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
          const range = flatTasks.slice(from, to + 1).map(t => t.id);
          setSelectedTaskIds(range);
        }
      } else if (event?.ctrlKey || event?.metaKey) {
        setSelectedTaskIds(prev => 
          prev.includes(task.id) 
            ? prev.filter(id => id !== task.id)
            : [...prev, task.id]
        );
      } else {
        setSelectedTaskId(task.id);
        setSelectedTaskIds([task.id]);
      }
    },
    [flatTasks, selectedTaskId]
  );

  const handleTaskContextMenu = useCallback(
    (task: Task, event: React.MouseEvent) => {
      event.preventDefault();
      if (!selectedTaskIds.includes(task?.id ?? '')) {
        setSelectedTaskId(task?.id);
        setSelectedTaskIds([task?.id ?? '']);
      }
      onTaskClick?.(task);
    },
    [selectedTaskIds, onTaskClick]
  );

  // INDENT/OUTDENT using controller
  const handleIndentTask = useCallback(() => {
    const taskIds = selectedTaskIds.length > 0 ? selectedTaskIds : (selectedTaskId ? [selectedTaskId] : []);
    console.log('[GanttChartV2] handleIndentTask called, taskIds:', taskIds);
    if (taskIds.length === 0) {
      console.log('[GanttChartV2] No tasks selected for indent');
      return;
    }
    
    // Use controller - it handles everything internally
    for (const taskId of taskIds) {
      const result = controller.indentTask(taskId);
      console.log('[GanttChartV2] indentTask result for', taskId, ':', result);
    }
  }, [selectedTaskId, selectedTaskIds, controller]);

  const handleOutdentTask = useCallback(() => {
    const taskIds = selectedTaskIds.length > 0 ? selectedTaskIds : (selectedTaskId ? [selectedTaskId] : []);
    console.log('[GanttChartV2] handleOutdentTask called, taskIds:', taskIds);
    if (taskIds.length === 0) {
      console.log('[GanttChartV2] No tasks selected for outdent');
      return;
    }
    
    // Use controller - it handles everything internally
    for (const taskId of taskIds) {
      const result = controller.outdentTask(taskId);
      console.log('[GanttChartV2] outdentTask result for', taskId, ':', result);
    }
  }, [selectedTaskId, selectedTaskIds, controller]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedTaskId) return;
      
      if (e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleIndentTask();
          return;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handleOutdentTask();
          return;
        }
      }
      
      const currentIndex = flatTasks.findIndex(t => t.id === selectedTaskId);
      if (currentIndex === -1) return;
      
      let newIndex = currentIndex;
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = Math.min(flatTasks.length - 1, currentIndex + 1);
      } else {
        return;
      }
      
      const newTask = flatTasks[newIndex];
      if (!newTask) return;
      
      if (e.shiftKey) {
        const anchorIndex = flatTasks.findIndex(t => selectedTaskIds[0] === t.id);
        const anchor = anchorIndex !== -1 ? anchorIndex : currentIndex;
        const [from, to] = anchor < newIndex ? [anchor, newIndex] : [newIndex, anchor];
        const range = flatTasks.slice(from, to + 1).map(t => t.id);
        setSelectedTaskIds(range);
        setSelectedTaskId(newTask.id);
      } else {
        setSelectedTaskId(newTask.id);
        setSelectedTaskIds([newTask.id]);
      }
    },
    [flatTasks, selectedTaskId, selectedTaskIds, handleIndentTask, handleOutdentTask]
  );

  const handleToggleExpand = useCallback(
    (taskId: string) => {
      controller.toggleExpansion(taskId);
    },
    [controller]
  );

  const handleWBSUpdate = useCallback(
    (taskId: string, newWBS: string) => {
      controller.updateTask(taskId, { wbs: newWBS });
    },
    [controller]
  );

  const handleViewPresetChange = useCallback(
    (preset: ViewPreset) => {
      setViewPreset(preset);
      onViewPresetChange?.(preset);
    },
    [onViewPresetChange]
  );

  useZoomWheel({
    containerRef: timelineContainerRef,
    currentPreset: viewPreset,
    onPresetChange: handleViewPresetChange,
    enabled: true
  });

  const handleTimeScaleConfigSave = useCallback(
    (config: ViewPresetConfig) => {
      VIEW_PRESETS[viewPreset] = config;
      setCustomPresetConfig(config);
      setViewPreset(viewPreset);
    },
    [viewPreset]
  );

  const currentPresetConfig = customPresetConfig ?? getViewPreset(viewPreset);

  const headerHeight = currentPresetConfig.headerLevels.reduce(
    (sum, layer) => sum + (layer.height ?? 32), 
    0
  );

  // Calculate statistics
  const totalTasks = flatTasks.length;
  const criticalCount = criticalPathIds.length;
  const completedTasks = flatTasks.filter(t => t.progress === 100).length;
  const completionPercentage = totalTasks > 0 
    ? Math.round((completedTasks / totalTasks) * 100) 
    : 0;

  return (
    <div 
      ref={containerRef}
      className={`gantt-chart bg-white rounded-lg border border-gray-200 flex flex-col ${className}`}
      style={{ height }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-gray-700">{projectName}</h2>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{totalTasks} tarefas</span>
            <span>•</span>
            <span>{completionPercentage}% concluído</span>
            {criticalCount > 0 && (
              <>
                <span>•</span>
                <span className="text-red-600 font-medium">{criticalCount} críticas</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <ZoomControl
            currentPreset={viewPreset}
            onPresetChange={handleViewPresetChange}
          />
          
          <button
            onClick={() => setConfigDialogOpen(true)}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Configurar Escala de Tempo"
          >
            <Settings2 className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`p-1.5 rounded flex items-center gap-1 text-xs ${
              showLegend 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Legenda"
          >
            <Layers className="w-4 h-4" />
            <ChevronDown className={`w-3 h-3 transition-transform ${showLegend ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-blue-500 rounded-sm" />
            <span className="text-gray-600">Normal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-red-500 rounded-sm" />
            <span className="text-gray-600">Crítica</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-orange-500 rounded-sm" />
            <span className="text-gray-600">Quase Crítica</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-2 bg-green-500 rounded-sm" />
            <span className="text-gray-600">100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Flag className="w-3 h-3 text-purple-500" />
            <span className="text-gray-600">Marco</span>
          </div>
          {violationTaskIds.length > 0 && (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-purple-500" />
              <span className="text-gray-600">Violação</span>
            </div>
          )}
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Grid */}
        <div 
          ref={gridScrollRef}
          className="overflow-y-auto overflow-x-hidden border-r border-gray-200"
          style={{ 
            width: splitterGridWidth,
            minWidth: Math.max(300, persistedColumnsWidth * 0.7)
          }}
        >
          <GanttGrid
            tasks={flatTasks}
            columns={columns}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            selectedTaskId={selectedTaskId}
            selectedTaskIds={selectedTaskIds}
            criticalPathIds={criticalPathIds}
            onTaskClick={handleTaskClick}
            onTaskSelect={handleTaskSelectInternal}
            onTaskContextMenu={handleTaskContextMenu}
            onToggleExpand={handleToggleExpand}
            onWBSUpdate={handleWBSUpdate}
            onCellDoubleClick={onCellDoubleClick}
            onColumnReorder={onColumnReorder}
            onRowMove={onRowMove}
            onInsertRow={onInsertRow}
            enableRowDragDrop={enableRowDragDrop}
            showInsertButtons={showInsertButtons}
          />
        </div>
        
        {/* Splitter */}
        <div
          className="relative flex-shrink-0 cursor-col-resize group"
          style={{ width: 4 }}
          onMouseDown={handleSplitterMouseDown}
        >
          <div 
            className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 transition-all ${
              isSplitterDragging 
                ? 'bg-blue-500' 
                : 'bg-transparent group-hover:bg-blue-300'
            }`}
          />
        </div>
        
        {/* Timeline */}
        <div 
          ref={timelineContainerRef}
          className="flex-1 min-w-0"
        >
          <div
            ref={timelineScrollRef}
            className="h-full overflow-auto"
          >
            <GanttTimeline
              tasks={flatTasks}
              dependencies={dependencies}
              timelineRange={timelineRange}
              viewPreset={viewPreset}
              rowHeight={rowHeight}
              barHeight={barHeight}
              barRadius={barRadius}
              selectedTaskId={selectedTaskId}
              criticalPathIds={criticalPathIds}
              nearCriticalPathIds={nearCriticalPathIds}
              violationTaskIds={violationTaskIds}
              conflictTaskIds={conflictTaskIds}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onTaskClick={handleTaskClick}
              onDependencyClick={onDependencyClick}
            />
          </div>
        </div>
      </div>
      
      {/* Config Dialog */}
      {configDialogOpen && (
        <TimeScaleConfigDialog
          open={configDialogOpen}
          onOpenChange={(open) => !open && setConfigDialogOpen(false)}
          currentConfig={currentPresetConfig}
          onSave={handleTimeScaleConfigSave}
        />
      )}
    </div>
  );
}
