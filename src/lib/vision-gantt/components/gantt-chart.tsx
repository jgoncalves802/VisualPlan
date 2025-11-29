
/**
 * GanttChart - Main component that orchestrates everything
 */



import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Dependency, Resource, ViewPreset, ColumnConfig, GanttConfig, ViewPresetConfig } from '../types';
import { GanttGrid } from './gantt-grid';
import { GanttTimeline } from './gantt-timeline';
import { ZoomControl } from './zoom-control';
import { TimeScaleConfigDialog } from './time-scale-config-dialog';
import { useGanttStores } from '../hooks/use-gantt-stores';
import { useDragDrop } from '../hooks/use-drag-drop';
import { useResize } from '../hooks/use-resize';
import { useDependencyCreation } from '../hooks/use-dependency-creation';
import { useTimelineRange } from '../hooks/use-timeline-range';
import { getPixelsPerDay, getViewPreset, VIEW_PRESETS } from '../config/view-presets';
import { DEFAULT_COLUMNS } from '../config/default-columns';
import { flattenTasks } from '../utils';
import { Settings2 } from 'lucide-react';

export interface GanttChartProps extends GanttConfig {
  className?: string;
  gridWidth?: number;
  height?: number;
  criticalPathIds?: string[];
  violationTaskIds?: string[];
  conflictTaskIds?: string[];
}

export function GanttChart({
  tasks: initialTasks,
  dependencies: initialDependencies,
  resources: initialResources,
  viewPreset: initialViewPreset = 'month',
  columns = DEFAULT_COLUMNS,
  rowHeight = 50, // Aumentado de 40 para 50 para dar mais espaço às linhas de dependência
  barHeight = 28,
  barRadius = 4,
  gridWidth = 600,
  height = 600,
  enableDragDrop = true,
  enableResize = true,
  enableDependencyCreation = false,
  onTaskUpdate,
  onTaskClick,
  onTaskDoubleClick,
  onDependencyCreate,
  onDependencyDelete,
  onViewPresetChange,
  className = '',
  criticalPathIds = [],
  violationTaskIds = [],
  conflictTaskIds = []
}: GanttChartProps) {
  const [viewPreset, setViewPreset] = useState<ViewPreset>(initialViewPreset);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>();
  const [dependencyMode, setDependencyMode] = useState(enableDependencyCreation);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [customPresetConfig, setCustomPresetConfig] = useState<ViewPresetConfig | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);

  // Initialize stores
  const { taskStore, dependencyStore, tasks, dependencies } = useGanttStores(
    initialTasks,
    initialDependencies,
    initialResources
  );

  // Flatten tasks for display
  const flatTasks = flattenTasks(taskStore.getTaskTree());

  // Calculate timeline range
  const timelineRange = useTimelineRange(flatTasks);
  const pixelsPerDay = getPixelsPerDay(viewPreset);

  // Handle task update
  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      taskStore.updateTask(taskId, updates);
      onTaskUpdate?.(taskStore.getTaskById(taskId)!);
    },
    [taskStore, onTaskUpdate]
  );

  // Drag and drop
  const {
    dragState,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  } = useDragDrop({
    pixelsPerDay,
    timelineStart: timelineRange.startDate,
    onTaskUpdate: handleTaskUpdate,
    enabled: enableDragDrop
  });

  // Resize
  const {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd
  } = useResize({
    pixelsPerDay,
    timelineStart: timelineRange.startDate,
    onTaskUpdate: handleTaskUpdate,
    enabled: enableResize
  });

  // Dependency creation
  const {
    creationState,
    startCreation,
    completeCreation,
    cancelCreation
  } = useDependencyCreation({
    onDependencyCreate: (fromId, toId, type) => {
      const success = dependencyStore.createDependency(fromId, toId, type);
      if (success) {
        const dep = dependencyStore.findDependency(fromId, toId);
        if (dep) {
          onDependencyCreate?.(dep);
        }
      }
    },
    enabled: dependencyMode
  });

  // Handle dependency creation via drag & drop
  const handleCreateDependency = useCallback(
    (fromTaskId: string, toTaskId: string, type: any, lag: number = 0) => {
      const success = dependencyStore.createDependency(fromTaskId, toTaskId, type, lag);
      if (success) {
        const dep = dependencyStore.findDependency(fromTaskId, toTaskId);
        if (dep) {
          onDependencyCreate?.(dep);
        }
      }
    },
    [dependencyStore, onDependencyCreate]
  );

  // Mouse event handlers
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

  // Synchronized scrolling
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

  // Handle task click
  const handleTaskClick = useCallback(
    (task: Task) => {
      setSelectedTaskId(task?.id);
      onTaskClick?.(task);
    },
    [onTaskClick]
  );

  // Handle toggle expansion
  const handleToggleExpand = useCallback(
    (taskId: string) => {
      taskStore.toggleExpansion(taskId);
    },
    [taskStore]
  );

  // Handle WBS update
  const handleWBSUpdate = useCallback(
    (taskId: string, newWBS: string) => {
      taskStore.update(taskId, { wbs: newWBS });
      onTaskUpdate?.(taskStore.getById(taskId)!);
    },
    [taskStore, onTaskUpdate]
  );

  // Handle view preset change
  const handleViewPresetChange = useCallback(
    (preset: ViewPreset) => {
      setViewPreset(preset);
      onViewPresetChange?.(preset);
    },
    [onViewPresetChange]
  );

  // Handle time scale configuration save
  const handleTimeScaleConfigSave = useCallback(
    (config: ViewPresetConfig) => {
      // Update the VIEW_PRESETS with the custom configuration
      VIEW_PRESETS[viewPreset] = config;
      setCustomPresetConfig(config);
      // Force re-render by toggling the preset
      setViewPreset(viewPreset);
    },
    [viewPreset]
  );

  // Get current preset configuration
  const currentPresetConfig = customPresetConfig ?? getViewPreset(viewPreset);

  // Calculate total header height based on all layers
  const headerHeight = currentPresetConfig.headerLevels.reduce(
    (sum, layer) => sum + (layer.height ?? 32), 
    0
  );

  return (
    <div
      ref={containerRef}
      className={`gantt-chart flex flex-col bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    >
      {/* Toolbar */}
      <div className="gantt-toolbar flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Project Timeline</h3>
          <div className="text-sm text-gray-600">
            {flatTasks.length} tasks
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ZoomControl currentPreset={viewPreset} onPresetChange={handleViewPresetChange} />
          <button
            onClick={() => setConfigDialogOpen(true)}
            className="p-2 rounded hover:bg-gray-100 transition-colors border border-gray-200"
            aria-label="Configure Time Scale"
            title="Configure Time Scale"
          >
            <Settings2 size={18} className="text-gray-700" />
          </button>
        </div>
      </div>

      {/* Time Scale Configuration Dialog */}
      <TimeScaleConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        currentConfig={currentPresetConfig}
        onSave={handleTimeScaleConfigSave}
      />

      {/* Main content area */}
      <div className="gantt-content flex flex-1 overflow-hidden">
        {/* Grid (left side) */}
        <div
          ref={gridScrollRef}
          className="gantt-grid-container overflow-auto"
          style={{ width: gridWidth, minWidth: gridWidth }}
        >
          <GanttGrid
            tasks={flatTasks}
            columns={columns}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            onTaskClick={handleTaskClick}
            onToggleExpand={handleToggleExpand}
            selectedTaskId={selectedTaskId}
            onWBSUpdate={handleWBSUpdate}
          />
        </div>

        {/* Timeline (right side) */}
        <div
          ref={timelineScrollRef}
          className="gantt-timeline-container flex-1 overflow-auto"
        >
          <GanttTimeline
            tasks={flatTasks}
            dependencies={dependencies}
            viewPreset={viewPreset}
            timelineRange={timelineRange}
            rowHeight={rowHeight}
            barHeight={barHeight}
            barRadius={barRadius}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onResizeStart={handleResizeStart}
            onCreateDependency={handleCreateDependency}
            selectedTaskId={selectedTaskId}
            criticalPathIds={criticalPathIds}
            violationTaskIds={violationTaskIds}
            conflictTaskIds={conflictTaskIds}
          />
        </div>
      </div>
    </div>
  );
}
