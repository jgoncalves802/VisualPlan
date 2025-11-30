/**
 * GanttChart - Primavera P6 Professional Style
 * Main component with professional toolbar and legend
 * Features: Resizable splitter, Alt+Scroll zoom, adjustable columns
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, Dependency, ViewPreset, GanttConfig, ViewPresetConfig } from '../types';
import { GanttGrid } from './gantt-grid';
import { GanttTimeline } from './gantt-timeline';
import { ZoomControl } from './zoom-control';
import { TimeScaleConfigDialog } from './time-scale-config-dialog';
import { useGanttStores } from '../hooks/use-gantt-stores';
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

export interface GanttChartProps extends GanttConfig {
  className?: string;
  gridWidth?: number;
  height?: number;
  criticalPathIds?: string[];
  nearCriticalPathIds?: string[];
  violationTaskIds?: string[];
  conflictTaskIds?: string[];
  projectName?: string;
  onDependencyClick?: (dependency: Dependency, fromTask: Task, toTask: Task) => void;
}

export function GanttChart({
  tasks: initialTasks,
  dependencies: initialDependencies,
  resources: initialResources,
  calendars: initialCalendars,
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
  className = '',
  criticalPathIds = [],
  nearCriticalPathIds = [],
  violationTaskIds = [],
  conflictTaskIds = [],
  projectName = 'Project Schedule'
}: GanttChartProps) {
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

  const { taskStore, dependencyStore, calendarStore: _calendarStore, tasks: _tasks, dependencies, calendars: _calendars } = useGanttStores(
    initialTasks,
    initialDependencies,
    initialResources,
    initialCalendars
  );

  const flatTasks = flattenTasks(taskStore.getTaskTree());
  const timelineRange = useTimelineRange(flatTasks);
  const pixelsPerDay = getPixelsPerDay(viewPreset);

  const handleTaskUpdate = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      taskStore.updateTask(taskId, updates);
      onTaskUpdate?.(taskStore.getTaskById(taskId)!);
    },
    [taskStore, onTaskUpdate]
  );

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

  const {
    creationState: _creationState,
    startCreation: _startCreation,
    completeCreation: _completeCreation,
    cancelCreation: _cancelCreation
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

  const handleTaskSelect = useCallback(
    (task: Task, event?: React.MouseEvent) => {
      if (!task?.id) return;
      
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

  const handleIndentTask = useCallback(() => {
    const taskIds = selectedTaskIds.length > 0 ? selectedTaskIds : (selectedTaskId ? [selectedTaskId] : []);
    if (taskIds.length === 0) return;
    
    const success = taskIds.length > 1 
      ? taskStore.indentTasks(taskIds)
      : taskStore.indentTask(taskIds[0]);
      
    if (success) {
      taskIds.forEach(id => {
        const updatedTask = taskStore.getTaskById(id);
        if (updatedTask) {
          onTaskUpdate?.(updatedTask);
        }
      });
    }
  }, [selectedTaskId, selectedTaskIds, taskStore, onTaskUpdate]);

  const handleOutdentTask = useCallback(() => {
    const taskIds = selectedTaskIds.length > 0 ? selectedTaskIds : (selectedTaskId ? [selectedTaskId] : []);
    if (taskIds.length === 0) return;
    
    const success = taskIds.length > 1 
      ? taskStore.outdentTasks(taskIds)
      : taskStore.outdentTask(taskIds[0]);
      
    if (success) {
      taskIds.forEach(id => {
        const updatedTask = taskStore.getTaskById(id);
        if (updatedTask) {
          onTaskUpdate?.(updatedTask);
        }
      });
    }
  }, [selectedTaskId, selectedTaskIds, taskStore, onTaskUpdate]);

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
      taskStore.toggleExpansion(taskId);
    },
    [taskStore]
  );

  const handleWBSUpdate = useCallback(
    (taskId: string, newWBS: string) => {
      taskStore.update(taskId, { wbs: newWBS });
      onTaskUpdate?.(taskStore.getById(taskId)!);
    },
    [taskStore, onTaskUpdate]
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
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className={`gantt-chart flex flex-col overflow-hidden ${className}`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ 
        height,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        outline: 'none'
      }}
    >
      {/* P6-Style Professional Toolbar */}
      <div 
        className="gantt-toolbar flex items-center justify-between px-4 py-2"
        style={{
          background: 'linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)',
          borderBottom: '2px solid #1E3A8A'
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Layers size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{projectName}</h3>
              <div className="text-blue-200 text-xs">
                {totalTasks} atividades | {completionPercentage}% concluído
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Statistics badges */}
          <div className="flex items-center gap-2 mr-4">
            {criticalCount > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: 'rgba(220, 38, 38, 0.2)', color: '#FCA5A5' }}
              >
                <Flag size={12} />
                {criticalCount} críticas
              </div>
            )}
            {conflictTaskIds.length > 0 && (
              <div 
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D' }}
              >
                <AlertTriangle size={12} />
                {conflictTaskIds.length} conflitos
              </div>
            )}
          </div>

          <ZoomControl currentPreset={viewPreset} onPresetChange={handleViewPresetChange} />
          
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="p-2 rounded transition-colors"
            style={{ 
              backgroundColor: showLegend ? 'rgba(255,255,255,0.2)' : 'transparent',
              color: 'white'
            }}
            title="Mostrar/Ocultar Legenda"
          >
            <ChevronDown size={18} className={`transform transition-transform ${showLegend ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={() => setConfigDialogOpen(true)}
            className="p-2 rounded hover:bg-white/10 transition-colors"
            style={{ color: 'white' }}
            title="Configurar Escala de Tempo"
          >
            <Settings2 size={18} />
          </button>
        </div>
      </div>

      {/* Legend Bar (Collapsible) */}
      {showLegend && (
        <div 
          className="gantt-legend flex items-center gap-6 px-4 py-2"
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB'
          }}
        >
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Legenda:</span>
          
          <div className="flex items-center gap-4">
            {/* Normal Task */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#2563EB' }} />
              <span className="text-xs text-gray-600">Normal</span>
            </div>
            
            {/* Critical Task */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#DC2626' }} />
              <span className="text-xs text-gray-600">Crítica</span>
            </div>
            
            {/* Near-Critical Task */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#F97316' }} />
              <span className="text-xs text-gray-600">Quase Crítica</span>
            </div>
            
            {/* Completed Task */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: '#059669' }} />
              <span className="text-xs text-gray-600">Concluída</span>
            </div>
            
            {/* Summary Task */}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-2 rounded-sm" style={{ backgroundColor: '#1E40AF' }} />
              <span className="text-xs text-gray-600">Resumo</span>
            </div>
            
            {/* Milestone */}
            <div className="flex items-center gap-1.5">
              <span style={{ color: '#D97706', fontSize: '12px' }}>◆</span>
              <span className="text-xs text-gray-600">Marco</span>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-1.5">
              <div 
                className="w-4 h-3 rounded-sm relative overflow-hidden" 
                style={{ backgroundColor: '#2563EB' }}
              >
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: 'rgba(255,255,255,0.6)' }} 
                />
              </div>
              <span className="text-xs text-gray-600">Progresso</span>
            </div>
          </div>

          {/* Keyboard shortcut hints */}
          <div 
            className="flex items-center gap-3 ml-auto pl-4 border-l border-gray-200"
          >
            <div 
              className="flex items-center gap-1"
              title="Shift+↑↓ para selecionar múltiplas atividades"
            >
              <span className="text-xs text-gray-400 font-mono px-1 py-0.5 bg-gray-100 rounded">Shift</span>
              <span className="text-xs text-gray-400">+</span>
              <span className="text-xs text-gray-400 font-mono px-1 py-0.5 bg-gray-100 rounded">↑↓</span>
              <span className="text-xs text-gray-500 ml-1">Selecionar</span>
            </div>
            <div 
              className="flex items-center gap-1"
              title="Shift+←→ para recuar/avançar hierarquia"
            >
              <span className="text-xs text-gray-400 font-mono px-1 py-0.5 bg-gray-100 rounded">Shift</span>
              <span className="text-xs text-gray-400">+</span>
              <span className="text-xs text-gray-400 font-mono px-1 py-0.5 bg-gray-100 rounded">←→</span>
              <span className="text-xs text-gray-500 ml-1">Hierarquia</span>
            </div>
          </div>
        </div>
      )}

      <TimeScaleConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        currentConfig={currentPresetConfig}
        onSave={handleTimeScaleConfigSave}
      />

      {/* Main content area with resizable splitter */}
      <div className="gantt-content flex flex-1 overflow-hidden relative">
        {/* Grid (left side) */}
        <div
          ref={gridScrollRef}
          className="gantt-grid-container overflow-auto flex-shrink-0"
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
            onTaskClick={handleTaskClick}
            onTaskSelect={handleTaskSelect}
            onTaskContextMenu={handleTaskContextMenu}
            onToggleExpand={handleToggleExpand}
            selectedTaskId={selectedTaskId}
            selectedTaskIds={selectedTaskIds}
            onWBSUpdate={handleWBSUpdate}
            criticalPathIds={criticalPathIds}
          />
        </div>

        {/* Invisible Resizable Splitter - only visible on hover */}
        <div
          className="gantt-splitter flex-shrink-0 flex items-center justify-center cursor-col-resize group"
          style={{
            width: 4,
            backgroundColor: isSplitterDragging ? '#2563EB' : 'transparent',
            transition: isSplitterDragging ? 'none' : 'background-color 0.15s ease',
          }}
          onMouseDown={handleSplitterMouseDown}
          title="Arraste para redimensionar"
        >
          <div 
            className="absolute inset-y-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ 
              width: 4,
              backgroundColor: '#94A3B8',
              pointerEvents: 'none' 
            }}
          />
        </div>

        {/* Timeline (right side) - with Alt+Scroll zoom hint */}
        <div
          ref={timelineContainerRef}
          className="gantt-timeline-wrapper flex-1 overflow-hidden relative"
        >
          <div
            ref={timelineScrollRef}
            className="gantt-timeline-container h-full overflow-auto"
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
              onDependencyClick={onDependencyClick}
              selectedTaskId={selectedTaskId}
              criticalPathIds={criticalPathIds}
              nearCriticalPathIds={nearCriticalPathIds}
              violationTaskIds={violationTaskIds}
              conflictTaskIds={conflictTaskIds}
            />
          </div>
          {/* Alt+Scroll zoom hint tooltip */}
          <div 
            className="absolute bottom-2 right-2 px-2 py-1 rounded text-xs bg-gray-800/70 text-white opacity-0 hover:opacity-100 transition-opacity pointer-events-none"
            style={{ backdropFilter: 'blur(4px)' }}
          >
            Alt + Scroll para zoom
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div 
        className="gantt-statusbar flex items-center justify-between px-4 py-1.5"
        style={{
          backgroundColor: '#F1F5F9',
          borderTop: '1px solid #E5E7EB',
          fontSize: '11px',
          color: '#64748B'
        }}
      >
        <div className="flex items-center gap-4">
          <span>Total: {totalTasks} atividades</span>
          <span>|</span>
          <span>Concluídas: {completedTasks}</span>
          <span>|</span>
          <span>Críticas: {criticalCount}</span>
        </div>
        <div>
          VisionGantt v2.0 | Primavera P6 Style
        </div>
      </div>
    </div>
  );
}
