/**
 * GanttTimeline - Primavera P6 Professional Style with Theme Support
 */

import { useRef } from 'react';
import type { Task, Dependency, ViewPreset, TaskBarPosition, TimelineRange, DependencyType } from '../types';
import { TaskBar } from './task-bar';
import { DependencyArrow } from './dependency-arrow';
import { DependencyDragLine } from './dependency-drag-line';
import { TimelineHeader } from './timeline-header';
import { dateToX } from '../utils';
import { getPixelsPerDay } from '../config/view-presets';
import { useDependencyDrag } from '../hooks/use-dependency-drag';
import { useGanttTheme } from '../context/theme-context';

interface GanttTimelineProps {
  tasks: Task[];
  dependencies: Dependency[];
  viewPreset: ViewPreset;
  timelineRange: TimelineRange;
  rowHeight: number;
  barHeight: number;
  barRadius: number;
  onTaskClick?: (task: Task) => void;
  onDragStart?: (e: React.MouseEvent, task: Task) => void;
  onResizeStart?: (e: React.MouseEvent, task: Task, edge: 'left' | 'right') => void;
  onDependencyClick?: (dependency: Dependency) => void;
  onDependencyConnect?: (task: Task, point: { x: number; y: number }) => void;
  onCreateDependency?: (fromTaskId: string, toTaskId: string, type: DependencyType, lag?: number) => void;
  selectedTaskId?: string;
  criticalPathIds?: string[];
  nearCriticalPathIds?: string[];
  violationTaskIds?: string[];
  conflictTaskIds?: string[];
}

export function GanttTimeline({
  tasks,
  dependencies,
  viewPreset,
  timelineRange,
  rowHeight,
  barHeight,
  barRadius,
  onTaskClick,
  onDragStart,
  onResizeStart,
  onCreateDependency,
  selectedTaskId,
  criticalPathIds = [],
  nearCriticalPathIds = [],
  violationTaskIds = [],
  conflictTaskIds = []
}: GanttTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const pixelsPerDay = getPixelsPerDay(viewPreset);
  const { theme } = useGanttTheme();
  const timelineColors = theme.colors.timeline;
  const gridColors = theme.colors.grid;

  const { dragState, startDependencyDrag, setDragTarget } = useDependencyDrag({
    onCreateDependency: (fromTaskId, toTaskId, type, lag) => {
      onCreateDependency?.(fromTaskId, toTaskId, type, lag);
    },
    containerRef: timelineRef,
  });

  const timelineWidth = Math.ceil(
    dateToX(timelineRange.endDate, timelineRange.startDate, pixelsPerDay)
  ) + 200;
  const timelineHeight = tasks.length * rowHeight;

  const taskPositions = new Map<string, TaskBarPosition>();
  tasks.forEach((task, index) => {
    if (!task?.startDate || !task?.endDate) return;

    const x = dateToX(new Date(task.startDate), timelineRange.startDate, pixelsPerDay);
    const width = dateToX(new Date(task.endDate), new Date(task.startDate), pixelsPerDay);
    const y = index * rowHeight + (rowHeight - barHeight) / 2;

    taskPositions.set(task.id, { x, y, width: Math.max(width, 10), height: barHeight });
  });

  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((t) => t?.id === id);
  };

  const getTaskPosition = (taskId: string) => {
    return taskPositions.get(taskId) || null;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isTodayVisible = today >= timelineRange.startDate && today <= timelineRange.endDate;
  const todayX = isTodayVisible ? dateToX(today, timelineRange.startDate, pixelsPerDay) : 0;

  return (
    <div 
      ref={timelineRef}
      className="gantt-timeline relative"
      style={{ 
        backgroundColor: timelineColors.background,
        fontFamily: theme.typography.fontFamily
      }}
    >
      <TimelineHeader
        timelineRange={timelineRange}
        viewPreset={viewPreset}
        rowHeight={rowHeight}
        width={timelineWidth}
      />

      <div className="timeline-content relative" style={{ height: timelineHeight }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width={timelineWidth}
          height={timelineHeight}
          style={{ zIndex: 1 }}
        >
          {tasks.map((_, index) => {
            const isEven = index % 2 === 0;
            return (
              <g key={`row-${index}`}>
                <rect
                  x={0}
                  y={index * rowHeight}
                  width={timelineWidth}
                  height={rowHeight}
                  fill={isEven ? gridColors.rowEven : gridColors.rowOdd}
                />
                <line
                  x1={0}
                  y1={(index + 1) * rowHeight}
                  x2={timelineWidth}
                  y2={(index + 1) * rowHeight}
                  stroke={timelineColors.gridLine}
                  strokeWidth={0.5}
                />
              </g>
            );
          })}
        </svg>

        {isTodayVisible && (
          <>
            <div
              className="absolute top-0 pointer-events-none"
              style={{ 
                left: todayX - 20,
                width: 40,
                height: timelineHeight,
                background: `${timelineColors.todayLine}08`,
                zIndex: 2
              }}
            />
            <div
              className="absolute top-0 pointer-events-none gantt-today-line"
              style={{ 
                left: todayX,
                height: timelineHeight,
                width: 1,
                backgroundColor: timelineColors.todayLine,
                zIndex: 10
              }}
            />
          </>
        )}

        <svg
          ref={svgRef}
          className="absolute inset-0"
          width={timelineWidth}
          height={timelineHeight}
          style={{ zIndex: 5 }}
        >
          <g className="gantt-dependencies">
            {dependencies.map((dep) => {
              const fromTask = getTaskById(dep?.fromTaskId ?? '');
              const toTask = getTaskById(dep?.toTaskId ?? '');
              const fromPos = taskPositions.get(dep?.fromTaskId ?? '');
              const toPos = taskPositions.get(dep?.toTaskId ?? '');

              if (!fromTask || !toTask || !fromPos || !toPos) return null;

              let fromX: number, toX: number;
              const fromY = fromPos.y;
              const toY = toPos.y;

              switch (dep.type) {
                case 'SS':
                  fromX = fromPos.x;
                  toX = toPos.x;
                  break;
                case 'FF':
                  fromX = fromPos.x + fromPos.width;
                  toX = toPos.x + toPos.width;
                  break;
                case 'SF':
                  fromX = fromPos.x;
                  toX = toPos.x + toPos.width;
                  break;
                case 'FS':
                default:
                  fromX = fromPos.x + fromPos.width;
                  toX = toPos.x;
                  break;
              }

              const isCriticalDep = criticalPathIds.includes(fromTask.id) && criticalPathIds.includes(toTask.id);
              const isNearCriticalDep = !isCriticalDep && (
                nearCriticalPathIds.includes(fromTask.id) || nearCriticalPathIds.includes(toTask.id)
              );

              return (
                <DependencyArrow
                  key={dep?.id ?? ''}
                  dependency={dep}
                  fromTask={fromTask}
                  toTask={toTask}
                  fromX={fromX}
                  fromY={fromY}
                  toX={toX}
                  toY={toY}
                  rowHeight={rowHeight}
                  taskHeight={barHeight}
                  arrowIndent={10}
                  isCritical={isCriticalDep}
                  isNearCritical={isNearCriticalDep}
                />
              );
            })}
          </g>

          <g className="gantt-task-bars">
            {tasks.map((task) => {
              const position = taskPositions.get(task?.id ?? '');
              if (!position) return null;

              const isDragTarget = dragState.targetTask?.id === task.id;

              return (
                <TaskBar
                  key={task?.id ?? ''}
                  task={task}
                  position={position}
                  barHeight={barHeight}
                  barRadius={barRadius}
                  isSelected={task.id === selectedTaskId}
                  isCritical={criticalPathIds.includes(task.id)}
                  isNearCritical={nearCriticalPathIds.includes(task.id)}
                  hasViolations={violationTaskIds.includes(task.id)}
                  hasConflicts={conflictTaskIds.includes(task.id)}
                  onDragStart={onDragStart}
                  onResizeStart={onResizeStart}
                  onClick={onTaskClick}
                  onDependencyDragStart={(task, handle, e) => {
                    startDependencyDrag(task, handle, e);
                  }}
                  onDependencyDragEnter={(task, handle) => {
                    setDragTarget(task, handle);
                  }}
                  onDependencyDragLeave={() => {
                    setDragTarget(null, null);
                  }}
                  isDependencyDragTarget={isDragTarget}
                />
              );
            })}
          </g>

          <DependencyDragLine 
            dragState={dragState} 
            getTaskPosition={getTaskPosition}
          />
        </svg>
      </div>
    </div>
  );
}
