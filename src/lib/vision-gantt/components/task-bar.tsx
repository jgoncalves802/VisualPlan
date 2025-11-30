/**
 * TaskBar - Primavera P6 Professional Style
 * Features:
 * - Critical path highlighting (red bars)
 * - Labels on bars (task name + duration)
 * - Progress bar with gradient
 * - Milestones as diamond shapes
 * - Summary tasks with bracket style
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
  showLabels?: boolean;
}

/**
 * P6-style color scheme based on task hierarchy and critical path
 * Project = Green bars, WBS = Yellow bars, Activities = Blue (normal) or Red (critical)
 */
function getTaskColors(task: Task, isCritical: boolean): { fill: string; stroke: string; progress: string; isProject: boolean; isWBS: boolean } {
  const level = (task as any)?.level ?? 0;
  const isParent = hasChildren(task);
  
  // Project level (level 0 parent) - Green like P6
  if (isParent && level === 0) {
    return {
      fill: '#16A34A',
      stroke: '#15803D',
      progress: '#86EFAC',
      isProject: true,
      isWBS: false
    };
  }
  
  // WBS level (level 1+ parent) - Dark gold/yellow like P6
  if (isParent) {
    return {
      fill: '#B45309', // Dark amber/gold for WBS bars like P6
      stroke: '#92400E',
      progress: '#FCD34D',
      isProject: false,
      isWBS: true
    };
  }

  // Critical path activities - Red
  if (isCritical) {
    return {
      fill: '#DC2626',
      stroke: '#B91C1C',
      progress: '#FCA5A5',
      isProject: false,
      isWBS: false
    };
  }

  const status = task?.status?.toLowerCase() ?? 'not_started';
  
  switch (status) {
    case 'completed':
      return {
        fill: '#059669',
        stroke: '#047857',
        progress: '#6EE7B7',
        isProject: false,
        isWBS: false
      };
    case 'in_progress':
    case 'in-progress':
      return {
        fill: '#2563EB',
        stroke: '#1D4ED8',
        progress: '#93C5FD',
        isProject: false,
        isWBS: false
      };
    case 'on_hold':
    case 'on-hold':
      return {
        fill: '#D97706',
        stroke: '#B45309',
        progress: '#FCD34D',
        isProject: false,
        isWBS: false
      };
    default:
      return {
        fill: '#2563EB', // Default blue for normal activities
        stroke: '#1D4ED8',
        progress: '#93C5FD',
        isProject: false,
        isWBS: false
      };
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
  isDependencyDragTarget = false,
  showLabels = true
}: TaskBarProps) {
  const [showHandles, setShowHandles] = useState(false);
  
  const colors = getTaskColors(task, isCritical);
  const opacity = isDragging ? 0.6 : 1;
  const progress = task?.progress ?? 0;
  const duration = (task as any)?.duration ?? 0;

  // Larger, more visible handles for better UX
  const HANDLE_WIDTH = 10;
  const HANDLE_HEIGHT = barHeight - 2;
  const DEPENDENCY_HANDLE_SIZE = 8;
  const DEPENDENCY_HANDLE_SIZE_HOVER = 10;

  // ===========================================
  // MILESTONE RENDERING (Diamond Shape P6 Style)
  // ===========================================
  if (task?.isMilestone || duration === 0) {
    const centerX = position.x;
    const centerY = position.y + barHeight / 2;
    const size = barHeight * 0.7;

    return (
      <g
        className="gantt-task-bar gantt-milestone"
        onClick={() => onClick?.(task)}
        style={{ opacity, cursor: 'pointer' }}
        onMouseEnter={() => setShowHandles(true)}
        onMouseLeave={() => setShowHandles(false)}
      >
        {/* Shadow */}
        <polygon
          points={`${centerX},${centerY - size / 2 + 2} ${centerX + size / 2 + 2},${centerY + 2} ${centerX},${centerY + size / 2 + 2} ${centerX - size / 2 - 2},${centerY + 2}`}
          fill="rgba(0,0,0,0.15)"
        />
        
        {/* Main diamond */}
        <polygon
          points={`${centerX},${centerY - size / 2} ${centerX + size / 2},${centerY} ${centerX},${centerY + size / 2} ${centerX - size / 2},${centerY}`}
          fill={isCritical ? '#DC2626' : '#D97706'}
          stroke={isSelected ? '#1E40AF' : (isCritical ? '#991B1B' : '#B45309')}
          strokeWidth={isSelected ? 3 : 2}
        />

        {/* Label */}
        {showLabels && position.width > 30 && (
          <text
            x={centerX + size / 2 + 8}
            y={centerY + 4}
            fontSize="11"
            fontWeight="600"
            fill="#374151"
            style={{ pointerEvents: 'none' }}
          >
            {task?.name?.substring(0, 25)}{(task?.name?.length ?? 0) > 25 ? '...' : ''}
          </text>
        )}

        {/* Dependency handles - larger and more visible */}
        {showHandles && (
          <>
            <g className="gantt-dependency-handle-group">
              {/* Left handle with glow effect */}
              <circle
                cx={centerX - size / 2}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE + 2}
                fill="rgba(30, 64, 175, 0.2)"
                className="gantt-handle-glow"
              />
              <circle
                cx={centerX - size / 2}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE}
                fill="#1E40AF"
                stroke="white"
                strokeWidth={2.5}
                style={{ cursor: 'crosshair', transition: 'r 0.15s ease' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onDependencyDragStart?.(task, 'start', e);
                }}
              />
            </g>
            <g className="gantt-dependency-handle-group">
              {/* Right handle with glow effect */}
              <circle
                cx={centerX + size / 2}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE + 2}
                fill="rgba(30, 64, 175, 0.2)"
                className="gantt-handle-glow"
              />
              <circle
                cx={centerX + size / 2}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE}
                fill="#1E40AF"
                stroke="white"
                strokeWidth={2.5}
                style={{ cursor: 'crosshair', transition: 'r 0.15s ease' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onDependencyDragStart?.(task, 'end', e);
                }}
              />
            </g>
          </>
        )}
      </g>
    );
  }

  // ===========================================
  // SUMMARY TASK (Parent with Children) - P6 Style with thin line and diamond endpoints
  // ===========================================
  if (hasChildren(task)) {
    const centerY = position.y + barHeight / 2;
    const diamondSize = 6;
    const lineHeight = 4;

    return (
      <g
        className="gantt-task-bar gantt-summary"
        style={{ opacity }}
        onMouseEnter={() => setShowHandles(true)}
        onMouseLeave={() => setShowHandles(false)}
      >
        {/* Hover area */}
        <rect
          x={position.x - 10}
          y={position.y - 5}
          width={position.width + 20}
          height={barHeight + 10}
          fill="transparent"
          pointerEvents="all"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(task);
          }}
          style={{ cursor: 'pointer' }}
        />

        {/* Main thin bar - P6 style */}
        <rect
          x={position.x + diamondSize}
          y={centerY - lineHeight / 2}
          width={Math.max(0, position.width - diamondSize * 2)}
          height={lineHeight}
          fill={colors.fill}
        />

        {/* Left diamond endpoint */}
        <polygon
          points={`
            ${position.x + diamondSize},${centerY - diamondSize}
            ${position.x + diamondSize * 2},${centerY}
            ${position.x + diamondSize},${centerY + diamondSize}
            ${position.x},${centerY}
          `}
          fill={colors.fill}
        />

        {/* Right diamond endpoint */}
        <polygon
          points={`
            ${position.x + position.width - diamondSize},${centerY - diamondSize}
            ${position.x + position.width},${centerY}
            ${position.x + position.width - diamondSize},${centerY + diamondSize}
            ${position.x + position.width - diamondSize * 2},${centerY}
          `}
          fill={colors.fill}
        />

        {/* Progress overlay */}
        {progress > 0 && (
          <rect
            x={position.x + diamondSize}
            y={centerY - lineHeight / 2}
            width={Math.max(0, (position.width - diamondSize * 2) * (progress / 100))}
            height={lineHeight}
            fill={colors.progress}
            pointerEvents="none"
          />
        )}

        {/* Label to the right */}
        {showLabels && (
          <text
            x={position.x + position.width + 8}
            y={centerY + 4}
            fontSize="11"
            fontWeight="600"
            fill="#374151"
            style={{ pointerEvents: 'none' }}
          >
            {task?.name?.substring(0, 25)}{(task?.name?.length ?? 0) > 25 ? '...' : ''}
          </text>
        )}

        {/* Dependency handles - larger with glow effect */}
        {showHandles && (
          <>
            <g className="gantt-dependency-handle-group">
              <circle
                cx={position.x}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE + 2}
                fill="rgba(30, 64, 175, 0.2)"
                className="gantt-handle-glow"
              />
              <circle
                cx={position.x}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE}
                fill="#1E40AF"
                stroke="white"
                strokeWidth={2.5}
                style={{ cursor: 'crosshair', transition: 'r 0.15s ease' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onDependencyDragStart?.(task, 'start', e);
                }}
              />
            </g>
            <g className="gantt-dependency-handle-group">
              <circle
                cx={position.x + position.width}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE + 2}
                fill="rgba(30, 64, 175, 0.2)"
                className="gantt-handle-glow"
              />
              <circle
                cx={position.x + position.width}
                cy={centerY}
                r={DEPENDENCY_HANDLE_SIZE}
                fill="#1E40AF"
                stroke="white"
                strokeWidth={2.5}
                style={{ cursor: 'crosshair', transition: 'r 0.15s ease' }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onDependencyDragStart?.(task, 'end', e);
                }}
              />
            </g>
          </>
        )}
      </g>
    );
  }

  // ===========================================
  // REGULAR TASK BAR - P6 Professional Style
  // ===========================================
  const labelText = showLabels && position.width > 80 
    ? `${task?.name?.substring(0, Math.floor(position.width / 8))}${(task?.name?.length ?? 0) > Math.floor(position.width / 8) ? '...' : ''}`
    : null;

  return (
    <g
      className="gantt-task-bar-wrapper"
      style={{ opacity }}
      onMouseEnter={() => setShowHandles(true)}
      onMouseLeave={() => setShowHandles(false)}
    >
      {/* Hover area */}
      <rect
        x={position.x - 10}
        y={position.y - 5}
        width={position.width + 20}
        height={barHeight + 10}
        fill="transparent"
        pointerEvents="all"
      />

      {/* Shadow for depth */}
      <rect
        x={position.x + 2}
        y={position.y + 2}
        width={position.width}
        height={barHeight}
        rx={barRadius}
        ry={barRadius}
        fill="rgba(0,0,0,0.15)"
        pointerEvents="none"
      />

      {/* Main task bar */}
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={barHeight}
        rx={barRadius}
        ry={barRadius}
        fill={colors.fill}
        stroke={isSelected ? '#1E40AF' : colors.stroke}
        strokeWidth={isSelected ? 3 : 1}
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

      {/* Progress bar (internal) */}
      {progress > 0 && (
        <rect
          x={position.x + 2}
          y={position.y + barHeight - 6}
          width={Math.max(0, (position.width - 4) * (progress / 100))}
          height={4}
          rx={2}
          ry={2}
          fill="rgba(255,255,255,0.6)"
          pointerEvents="none"
        />
      )}

      {/* Top shine effect */}
      <rect
        x={position.x}
        y={position.y}
        width={position.width}
        height={barHeight / 3}
        rx={barRadius}
        ry={barRadius}
        fill="rgba(255,255,255,0.2)"
        pointerEvents="none"
      />

      {/* Label inside bar */}
      {labelText && (
        <text
          x={position.x + 8}
          y={position.y + barHeight / 2 + 4}
          fontSize="11"
          fontWeight="600"
          fill="white"
          style={{ 
            pointerEvents: 'none',
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          {labelText}
        </text>
      )}

      {/* Duration label on right side of bar */}
      {showLabels && duration > 0 && (
        <text
          x={position.x + position.width + 6}
          y={position.y + barHeight / 2 + 4}
          fontSize="10"
          fontWeight="500"
          fill="#6B7280"
          style={{ pointerEvents: 'none' }}
        >
          {duration}d
        </text>
      )}

      {/* Critical path indicator */}
      {isCritical && (
        <rect
          x={position.x - 3}
          y={position.y}
          width={3}
          height={barHeight}
          fill="#DC2626"
          rx={1}
        />
      )}

      {/* Conflict indicator */}
      {hasConflicts && (
        <g>
          <circle
            cx={position.x + position.width - 8}
            cy={position.y - 4}
            r={6}
            fill="#EF4444"
            stroke="white"
            strokeWidth={1.5}
          />
          <text
            x={position.x + position.width - 8}
            y={position.y - 1}
            fontSize="9"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            !
          </text>
        </g>
      )}

      {/* Resize and dependency handles - improved visibility and interaction */}
      {showHandles && (
        <g className="gantt-handle-group">
          {/* Left resize handle - larger with gradient */}
          <rect
            x={position.x + 1}
            y={position.y + 1}
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            rx={3}
            fill="rgba(255,255,255,0.9)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1.5}
            style={{ cursor: 'ew-resize', transition: 'fill 0.15s ease' }}
            onMouseDown={(e) => {
              if (onResizeStart) {
                e.stopPropagation();
                onResizeStart(e, task, 'left');
              }
            }}
          />
          {/* Grip lines on left handle */}
          <line x1={position.x + 4} y1={position.y + barHeight * 0.35} x2={position.x + 4} y2={position.y + barHeight * 0.65} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          <line x1={position.x + 7} y1={position.y + barHeight * 0.35} x2={position.x + 7} y2={position.y + barHeight * 0.65} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />

          {/* Right resize handle - larger with gradient */}
          <rect
            x={position.x + position.width - HANDLE_WIDTH - 1}
            y={position.y + 1}
            width={HANDLE_WIDTH}
            height={HANDLE_HEIGHT}
            rx={3}
            fill="rgba(255,255,255,0.9)"
            stroke="rgba(0,0,0,0.25)"
            strokeWidth={1.5}
            style={{ cursor: 'ew-resize', transition: 'fill 0.15s ease' }}
            onMouseDown={(e) => {
              if (onResizeStart) {
                e.stopPropagation();
                onResizeStart(e, task, 'right');
              }
            }}
          />
          {/* Grip lines on right handle */}
          <line x1={position.x + position.width - 7} y1={position.y + barHeight * 0.35} x2={position.x + position.width - 7} y2={position.y + barHeight * 0.65} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
          <line x1={position.x + position.width - 4} y1={position.y + barHeight * 0.35} x2={position.x + position.width - 4} y2={position.y + barHeight * 0.65} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />

          {/* Left dependency handle with glow */}
          <g className="gantt-dependency-handle-group">
            <circle
              cx={position.x}
              cy={position.y + barHeight / 2}
              r={DEPENDENCY_HANDLE_SIZE + 3}
              fill="rgba(30, 64, 175, 0.15)"
              className="gantt-handle-glow"
            />
            <circle
              cx={position.x}
              cy={position.y + barHeight / 2}
              r={DEPENDENCY_HANDLE_SIZE}
              className={isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''}
              fill={isDependencyDragTarget ? '#10B981' : '#1E40AF'}
              stroke="white"
              strokeWidth={2.5}
              style={{ cursor: 'crosshair', transition: 'fill 0.15s ease, r 0.15s ease' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onDependencyDragStart?.(task, 'start', e);
              }}
              onMouseEnter={() => onDependencyDragEnter?.(task, 'start')}
              onMouseLeave={() => onDependencyDragLeave?.()}
            />
          </g>

          {/* Right dependency handle with glow */}
          <g className="gantt-dependency-handle-group">
            <circle
              cx={position.x + position.width}
              cy={position.y + barHeight / 2}
              r={DEPENDENCY_HANDLE_SIZE + 3}
              fill="rgba(30, 64, 175, 0.15)"
              className="gantt-handle-glow"
            />
            <circle
              cx={position.x + position.width}
              cy={position.y + barHeight / 2}
              r={DEPENDENCY_HANDLE_SIZE}
              className={isDependencyDragTarget ? 'gantt-dependency-handle-active' : ''}
              fill={isDependencyDragTarget ? '#10B981' : '#1E40AF'}
              stroke="white"
              strokeWidth={2.5}
              style={{ cursor: 'crosshair', transition: 'fill 0.15s ease, r 0.15s ease' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onDependencyDragStart?.(task, 'end', e);
              }}
              onMouseEnter={() => onDependencyDragEnter?.(task, 'end')}
              onMouseLeave={() => onDependencyDragLeave?.()}
            />
          </g>
        </g>
      )}
    </g>
  );
}
