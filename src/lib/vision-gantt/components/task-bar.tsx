/**
 * TaskBar - Renders individual task bars on canvas/SVG
 * CSS-only hover approach (inspired by gantt-task-react)
 * NO React state for hover - eliminates re-render loops!
 */



import React, { useState } from 'react';
import type { Task, TaskBarPosition } from '../types';
import { hasChildren } from '../utils';

interface TaskBarProps {
  task: Task;
  position: TaskBarPosition;
  barHeight: number;
  barRadius: number;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
  isCritical?: boolean;
  hasViolations?: boolean;
  hasConflicts?: boolean;
  onDragStart?: (e: React.MouseEvent, task: Task) => void;
  onResizeStart?: (e: React.MouseEvent, task: Task, edge: 'left' | 'right') => void;
  onClick?: (task: Task) => void;
  onDependencyConnect?: (task: Task, point: { x: number; y: number }) => void;
  onDependencyDragStart?: (task: Task, handle: 'start' | 'end', e: React.MouseEvent) => void;
  onDependencyDragEnter?: (task: Task, handle: 'start' | 'end') => void;
  onDependencyDragLeave?: () => void;
  isDependencyDragTarget?: boolean;
}

/**
 * Get task color based on status - using CSS variables
 */
function getTaskColorByStatus(task: Task): string {
  // Parent tasks (summary tasks) have their own distinct color
  if (hasChildren(task)) {
    return '#2c5aa0'; // Dark blue for parent/summary tasks
  }
  
  const status = task?.status?.toLowerCase() ?? 'not-started';
  
  switch (status) {
    case 'completed':
      return 'var(--gantt-status-completed)';
    case 'in-progress':
    case 'in progress':
      return 'var(--gantt-status-in-progress)';
    case 'on-hold':
    case 'on hold':
      return 'var(--gantt-status-on-hold)';
    case 'cancelled':
      return 'var(--gantt-status-cancelled)';
    case 'not-started':
    case 'not started':
    default:
      return 'var(--gantt-status-not-started)';
  }
}

export function TaskBar({
  task,
  position,
  barHeight,
  barRadius,
  isDragging = false,
  isResizing = false,
  isSelected = false,
  isCritical = false,
  hasViolations = false,
  hasConflicts = false,
  onDragStart,
  onResizeStart,
  onClick,
  onDependencyConnect,
  onDependencyDragStart,
  onDependencyDragEnter,
  onDependencyDragLeave,
  isDependencyDragTarget = false
}: TaskBarProps) {
  // State to control handle visibility on hover
  const [showHandles, setShowHandles] = useState(false);
  
  // Get color based on task status
  const taskColor = getTaskColorByStatus(task);
  const opacity = isDragging ? 0.6 : 1;
  const progress = task?.progress ?? 0;

  const HANDLE_WIDTH = 8;
  const HANDLE_HEIGHT = barHeight - 2;

  // Milestone rendering (diamond shape)
  if (task?.isMilestone) {
    const centerX = position.x + position.width / 2;
    const centerY = position.y + barHeight / 2;
    const size = barHeight * 0.8;

    return (
      <g
        className="gantt-task-bar gantt-milestone"
        onClick={() => onClick?.(task)}
        style={{ opacity, cursor: 'pointer' }}
      >
        {/* Shadow for depth */}
        <polygon
          points={`${centerX},${centerY - size / 2 + 2} ${centerX + size / 2 + 2},${centerY + 2} ${centerX},${centerY + size / 2 + 2} ${centerX - size / 2 - 2},${centerY + 2}`}
          fill="rgba(0,0,0,0.1)"
          filter="blur(2px)"
        />
        
        {/* Main milestone diamond */}
        <polygon
          points={`${centerX},${centerY - size / 2} ${centerX + size / 2},${centerY} ${centerX},${centerY + size / 2} ${centerX - size / 2},${centerY}`}
          fill="var(--gantt-task-milestone)"
          stroke={isSelected ? 'var(--gantt-primary)' : 'rgba(0,0,0,0.2)'}
          strokeWidth={isSelected ? 3 : 2}
        />
        
        {/* Connection point */}
        <circle
          cx={centerX}
          cy={centerY}
          r={3}
          fill="white"
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={1}
        />
      </g>
    );
  }

  // Project task rendering (parent tasks with children) - gantt-task-react style
  if (hasChildren(task)) {
    const projectWidth = position.width;
    const triangleWidth = 15; // Width of the triangular caps
    
    // Parent tasks use darker colors (defined in getTaskColorByStatus)
    const projectColor = taskColor; // taskColor already returns '#2c5aa0' for parent tasks
    
    // Left triangle points (pointing down)
    const leftTriangle = `${position.x},${position.y + barHeight / 2 - 1} ${position.x},${position.y + barHeight} ${position.x + triangleWidth},${position.y + barHeight / 2 - 1}`;
    
    // Right triangle points (pointing down)
    const rightTriangle = `${position.x + projectWidth},${position.y + barHeight / 2 - 1} ${position.x + projectWidth},${position.y + barHeight} ${position.x + projectWidth - triangleWidth},${position.y + barHeight / 2 - 1}`;
    
    return (
      <g
        className="gantt-task-bar gantt-project"
        style={{ opacity }}
        onMouseEnter={() => setShowHandles(true)}
        onMouseLeave={() => setShowHandles(false)}
      >
        {/* Invisible hover area */}
        <rect
          x={position.x - 10}
          y={position.y - 5}
          width={projectWidth + 20}
          height={barHeight + 10}
          fill="transparent"
          pointerEvents="all"
          className="gantt-task-hover-area"
        />

        {/* Main project bar background - NOT DRAGGABLE */}
        <rect
          x={position.x}
          y={position.y}
          width={projectWidth}
          height={barHeight}
          rx={barRadius}
          ry={barRadius}
          fill={projectColor}
          stroke={
            isSelected
              ? 'var(--gantt-primary)'
              : isCritical
              ? 'var(--gantt-critical)'
              : hasViolations
              ? 'var(--gantt-danger)'
              : hasConflicts
              ? 'var(--gantt-warning)'
              : 'transparent'
          }
          strokeWidth={isSelected || isCritical || hasViolations || hasConflicts ? 2.5 : 0}
          style={{ cursor: 'default' }}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(task);
          }}
        />

        {/* Progress bar */}
        {progress > 0 && (
          <rect
            x={position.x}
            y={position.y}
            width={Math.max(0, projectWidth * (progress / 100))}
            height={barHeight}
            rx={barRadius}
            ry={barRadius}
            fill="rgba(255, 255, 255, 0.3)"
            pointerEvents="none"
          />
        )}

        {/* Top half overlay (creates the project bar effect) */}
        <rect
          x={position.x}
          y={position.y}
          width={projectWidth}
          height={barHeight / 2}
          rx={barRadius}
          ry={barRadius}
          fill={projectColor}
          pointerEvents="none"
          opacity={0.8}
        />

        {/* Left triangle cap */}
        <polygon
          points={leftTriangle}
          fill={projectColor}
          pointerEvents="none"
        />

        {/* Right triangle cap */}
        <polygon
          points={rightTriangle}
          fill={projectColor}
          pointerEvents="none"
        />

        {/* Resource Conflict Indicator */}
        {hasConflicts && (
          <g>
            <rect
              x={position.x + projectWidth - 20}
              y={position.y - 3}
              width={18}
              height={6}
              rx={3}
              fill="#ef4444"
              opacity={0.9}
            />
            <title>Resource Overallocation</title>
          </g>
        )}

        {/* Handles for dependency creation only (NO RESIZE for parent tasks) */}
        {showHandles && (
          <g className="gantt-handle-group">

            {/* LEFT DEPENDENCY HANDLE */}
            <circle
              cx={position.x}
              cy={position.y + barHeight / 2}
              r={5}
              className={`gantt-dependency-handle gantt-dependency-handle-start ${
                isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''
              }`}
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => {
                if (onDependencyDragStart) {
                  e.stopPropagation();
                  onDependencyDragStart(task, 'start', e);
                }
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onDependencyDragEnter?.(task, 'start');
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onDependencyDragLeave?.();
              }}
            />

            {/* RIGHT DEPENDENCY HANDLE */}
            <circle
              cx={position.x + projectWidth}
              cy={position.y + barHeight / 2}
              r={5}
              className={`gantt-dependency-handle gantt-dependency-handle-end ${
                isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''
              }`}
              fill="hsl(var(--primary))"
              stroke="white"
              strokeWidth={2}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => {
                if (onDependencyDragStart) {
                  e.stopPropagation();
                  onDependencyDragStart(task, 'end', e);
                }
              }}
              onMouseEnter={(e) => {
                e.stopPropagation();
                onDependencyDragEnter?.(task, 'end');
              }}
              onMouseLeave={(e) => {
                e.stopPropagation();
                onDependencyDragLeave?.();
              }}
            />
          </g>
        )}
      </g>
    );
  }

  // Regular task bar rendering
  return (
    <g
      className="gantt-task-bar-wrapper"
      style={{ opacity }}
      onMouseEnter={() => setShowHandles(true)}
      onMouseLeave={() => setShowHandles(false)}
    >
      {/* Invisible hover area to trigger handle display */}
      <rect
        x={position.x - 10}
        y={position.y - 5}
        width={position.width + 20}
        height={barHeight + 10}
        fill="transparent"
        pointerEvents="all"
        className="gantt-task-hover-area"
      />

      {/* Main task bar background */}
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={barHeight}
        rx={barRadius}
        ry={barRadius}
        fill={taskColor}
        stroke={
          isSelected
            ? 'var(--gantt-primary)'
            : isCritical
            ? 'var(--gantt-critical)'
            : hasViolations
            ? 'var(--gantt-danger)'
            : hasConflicts
            ? 'var(--gantt-warning)'
            : 'transparent'
        }
        strokeWidth={isSelected || isCritical || hasViolations || hasConflicts ? 2.5 : 0}
        className="gantt-task-bar-bg"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={(e) => {
          if (onDragStart) {
            e.stopPropagation();
            onDragStart(e, task);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(task);
        }}
      />

      {/* Progress bar */}
      {progress > 0 && (
        <rect
          x={position.x}
          y={position.y}
          width={Math.max(0, position.width * (progress / 100))}
          height={barHeight}
          rx={barRadius}
          ry={barRadius}
          fill="rgba(255, 255, 255, 0.3)"
          className="gantt-task-bar-progress"
          pointerEvents="none"
        />
      )}

      {/* Subtle shine effect */}
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={barHeight / 3}
        rx={barRadius}
        ry={barRadius}
        fill="url(#taskShineGradient)"
        pointerEvents="none"
        opacity={0.4}
      />

      {/* Resource Conflict Indicator */}
      {hasConflicts && (
        <g>
          <rect
            x={position.x + position.width - 20}
            y={position.y - 3}
            width={18}
            height={6}
            rx={3}
            fill="#ef4444"
            opacity={0.9}
          />
          <title>Resource Overallocation</title>
        </g>
      )}

      {/* ===== HANDLES GROUP (Controlled by React state) ===== */}
      {showHandles && (
        <g className="gantt-handle-group">
          {/* LEFT RESIZE HANDLE */}
          <rect
            x={position.x + 1}
            y={position.y + 1}
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            rx={barRadius}
            ry={barRadius}
            className="gantt-task-handle gantt-task-handle-left"
            fill="#ddd"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              if (onResizeStart) {
                e.stopPropagation();
                onResizeStart(e, task, 'left');
              }
            }}
          />

          {/* RIGHT RESIZE HANDLE */}
          <rect
            x={position.x + position.width - HANDLE_WIDTH - 1}
            y={position.y + 1}
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            rx={barRadius}
            ry={barRadius}
            className="gantt-task-handle gantt-task-handle-right"
            fill="#ddd"
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              if (onResizeStart) {
                e.stopPropagation();
                onResizeStart(e, task, 'right');
              }
            }}
          />

          {/* LEFT DEPENDENCY HANDLE (Circle - Start) */}
          <circle
            cx={position.x}
            cy={position.y + barHeight / 2}
            r={5}
            className={`gantt-dependency-handle gantt-dependency-handle-start ${
              isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''
            }`}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              if (onDependencyDragStart) {
                e.stopPropagation();
                onDependencyDragStart(task, 'start', e);
              }
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              onDependencyDragEnter?.(task, 'start');
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              onDependencyDragLeave?.();
            }}
          />

          {/* RIGHT DEPENDENCY HANDLE (Circle - End) */}
          <circle
            cx={position.x + position.width}
            cy={position.y + barHeight / 2}
            r={5}
            className={`gantt-dependency-handle gantt-dependency-handle-end ${
              isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''
            }`}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={2}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => {
              if (onDependencyDragStart) {
                e.stopPropagation();
                onDependencyDragStart(task, 'end', e);
              }
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              onDependencyDragEnter?.(task, 'end');
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              onDependencyDragLeave?.();
            }}
          />
        </g>
      )}

      {/* Define gradient for shine effect (only once in SVG defs) */}
      <defs>
        <linearGradient id="taskShineGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.8" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </g>
  );
}
