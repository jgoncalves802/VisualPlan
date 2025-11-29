
/**
 * GanttTimeline - Main timeline area with task bars and dependencies
 */



import React, { useRef, useEffect } from 'react';
import type { Task, Dependency, ViewPreset, TaskBarPosition, TimelineRange, DependencyType } from '../types';
import { TaskBar } from './task-bar';
import { DependencyLine } from './dependency-line';
import { DependencyArrow } from './dependency-arrow';
import { DependencyDragLine } from './dependency-drag-line';
import { TimelineHeader } from './timeline-header';
import { dateToX } from '../utils';
import { getPixelsPerDay } from '../config/view-presets';
import { useDependencyDrag } from '../hooks/use-dependency-drag';

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
  onDependencyClick,
  onDependencyConnect,
  onCreateDependency,
  selectedTaskId,
  criticalPathIds = [],
  violationTaskIds = [],
  conflictTaskIds = []
}: GanttTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const pixelsPerDay = getPixelsPerDay(viewPreset);

  // Dependency drag functionality
  const { dragState, startDependencyDrag, setDragTarget } = useDependencyDrag({
    onCreateDependency: (fromTaskId, toTaskId, type, lag) => {
      onCreateDependency?.(fromTaskId, toTaskId, type, lag);
    },
    containerRef: timelineRef,
  });

  // Calculate timeline width
  const timelineWidth = Math.ceil(
    dateToX(timelineRange.endDate, timelineRange.startDate, pixelsPerDay)
  );
  const timelineHeight = tasks.length * rowHeight;

  // Calculate task bar positions
  const taskPositions = new Map<string, TaskBarPosition>();
  tasks.forEach((task, index) => {
    if (!task?.startDate || !task?.endDate) return;

    const x = dateToX(new Date(task.startDate), timelineRange.startDate, pixelsPerDay);
    const width = dateToX(new Date(task.endDate), new Date(task.startDate), pixelsPerDay);
    const y = index * rowHeight + (rowHeight - barHeight) / 2;

    taskPositions.set(task.id, { x, y, width: Math.max(width, 20), height: barHeight });
  });

  // Get task by ID helper
  const getTaskById = (id: string): Task | undefined => {
    return tasks.find((t) => t?.id === id);
  };

  // Helper to get task position for dependency drag line
  const getTaskPosition = (taskId: string) => {
    const pos = taskPositions.get(taskId);
    if (!pos) return null;
    return pos;
  };

  return (
    <div 
      ref={timelineRef}
      className="gantt-timeline relative overflow-hidden"
      style={{ backgroundColor: 'var(--gantt-timeline-background)' }}
    >
      {/* Timeline Header */}
      <TimelineHeader
        timelineRange={timelineRange}
        viewPreset={viewPreset}
        rowHeight={rowHeight}
        width={timelineWidth}
      />

      {/* Main Timeline Content */}
      <div className="timeline-content relative" style={{ height: timelineHeight }}>
        {/* Background grid lines */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={timelineWidth}
          height={timelineHeight}
        >
          {tasks.map((task, index) => {
            // Check if this row corresponds to today's date
            const isEven = index % 2 === 0;
            
            return (
              <g key={`grid-line-${index}`}>
                {/* Row background */}
                <rect
                  x={0}
                  y={index * rowHeight}
                  width={timelineWidth}
                  height={rowHeight}
                  fill={isEven ? 'transparent' : 'var(--gantt-grid-row-alt)'}
                />
                {/* Row border */}
                <line
                  x1={0}
                  y1={index * rowHeight}
                  x2={timelineWidth}
                  y2={index * rowHeight}
                  stroke="var(--gantt-border-light)"
                  strokeWidth={1}
                />
              </g>
            );
          })}
        </svg>

        {/* Today line - DHTMLX style */}
        {(() => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (today >= timelineRange.startDate && today <= timelineRange.endDate) {
            const todayX = dateToX(today, timelineRange.startDate, pixelsPerDay);
            return (
              <div
                className="absolute top-0 pointer-events-none z-10"
                style={{ 
                  left: todayX,
                  height: timelineHeight,
                  width: '2px',
                  backgroundColor: 'var(--gantt-error)',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.5)'
                }}
              >
                {/* Today marker circle at top */}
                <div 
                  className="absolute -left-2"
                  style={{
                    top: -2,
                    width: '6px',
                    height: '6px',
                    backgroundColor: 'var(--gantt-error)',
                    borderRadius: '50%',
                    border: '2px solid white',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
                {/* Today label */}
                <div 
                  className="absolute -left-8 text-xs font-semibold whitespace-nowrap"
                  style={{
                    top: 8,
                    color: 'var(--gantt-error)',
                    textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                  }}
                >
                  Today
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Main SVG for task bars and dependencies */}
        <svg
          ref={svgRef}
          className="absolute inset-0"
          width={timelineWidth}
          height={timelineHeight}
        >
          {/* Render dependencies first (behind task bars) - gantt-task-react style */}
          <g className="gantt-arrows" fill="hsl(var(--primary))" stroke="hsl(var(--primary))">
            {dependencies.map((dep) => {
              const fromTask = getTaskById(dep?.fromTaskId ?? '');
              const toTask = getTaskById(dep?.toTaskId ?? '');
              const fromPos = taskPositions.get(dep?.fromTaskId ?? '');
              const toPos = taskPositions.get(dep?.toTaskId ?? '');

              if (!fromTask || !toTask || !fromPos || !toPos) return null;

              // Calculate arrow endpoints based on dependency type (gantt-task-react style)
              let fromX: number, fromY: number, toX: number, toY: number;
              
              const fromCenterY = fromPos.y + barHeight / 2;
              const toCenterY = toPos.y + barHeight / 2;

              switch (dep.type) {
                case 'SS': // Start-to-Start
                  fromX = fromPos.x;
                  fromY = fromCenterY;
                  toX = toPos.x;
                  toY = toCenterY;
                  break;
                case 'FF': // Finish-to-Finish
                  fromX = fromPos.x + fromPos.width;
                  fromY = fromCenterY;
                  toX = toPos.x + toPos.width;
                  toY = toCenterY;
                  break;
                case 'SF': // Start-to-Finish
                  fromX = fromPos.x;
                  fromY = fromCenterY;
                  toX = toPos.x + toPos.width;
                  toY = toCenterY;
                  break;
                case 'FS': // Finish-to-Start (default)
                default:
                  fromX = fromPos.x + fromPos.width;
                  fromY = fromCenterY;
                  toX = toPos.x;
                  toY = toCenterY;
                  break;
              }

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
                  color="hsl(var(--primary))"
                />
              );
            })}
          </g>

          {/* Render task bars */}
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
                hasViolations={violationTaskIds.includes(task.id)}
                hasConflicts={conflictTaskIds.includes(task.id)}
                onDragStart={onDragStart}
                onResizeStart={onResizeStart}
                onClick={onTaskClick}
                onDependencyConnect={onDependencyConnect}
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

          {/* Render dependency drag line (temporary line during drag) */}
          <DependencyDragLine 
            dragState={dragState} 
            getTaskPosition={getTaskPosition}
          />
        </svg>
      </div>
    </div>
  );
}
