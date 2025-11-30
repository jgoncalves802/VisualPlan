/**
 * TaskBar - Primavera P6 Professional Design with Theme Support
 */

import React, { useState, useMemo } from 'react';
import type { Task, TaskBarPosition } from '../types';
import { hasChildren } from '../utils';
import { format, differenceInDays } from 'date-fns';
import { useGanttTheme } from '../context/theme-context';

interface TaskBarProps {
  task: Task;
  position: TaskBarPosition;
  barHeight: number;
  barRadius: number;
  isDragging?: boolean;
  isResizing?: boolean;
  isSelected?: boolean;
  isCritical?: boolean;
  isNearCritical?: boolean;
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
  showTooltip?: boolean;
}

export function TaskBar({
  task,
  position,
  barHeight,
  barRadius: _barRadius,
  isDragging = false,
  isResizing = false,
  isSelected = false,
  isCritical = false,
  isNearCritical = false,
  hasViolations = false,
  hasConflicts = false,
  onDragStart,
  onResizeStart,
  onClick,
  onDependencyDragStart,
  onDependencyDragEnter,
  onDependencyDragLeave,
  isDependencyDragTarget = false,
  showLabels = true,
  showTooltip = true
}: TaskBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showHandles, setShowHandles] = useState(false);
  const { theme } = useGanttTheme();
  const themeColors = theme.colors;
  
  const level = (task as any)?.level ?? 0;
  const isParent = hasChildren(task);
  const progress = task?.progress ?? 0;
  const status = task?.status?.toLowerCase() ?? 'not_started';
  const duration = (task as any)?.duration ?? differenceInDays(task.endDate, task.startDate);
  const opacity = isDragging ? 0.7 : 1;

  const colors = useMemo(() => {
    if (isParent && level === 0) {
      return { ...themeColors.summaryProject, isProject: true, isWBS: false };
    }
    if (isParent) {
      return { ...themeColors.summaryWBS, isProject: false, isWBS: true };
    }
    if (progress === 100 || status === 'completed') {
      return { ...themeColors.completedActivity, isProject: false, isWBS: false };
    }
    if (isCritical) {
      return { ...themeColors.criticalActivity, isProject: false, isWBS: false };
    }
    if (isNearCritical) {
      return { ...themeColors.nearCriticalActivity, isProject: false, isWBS: false };
    }
    return { ...themeColors.normalActivity, isProject: false, isWBS: false };
  }, [themeColors, isParent, level, isCritical, isNearCritical, progress, status]);

  const RESIZE_HANDLE_WIDTH = theme.spacing.handleSize + 1;
  const DEPENDENCY_HANDLE_SIZE = theme.spacing.handleSize;

  const tooltipContent = useMemo(() => {
    if (!showTooltip) return null;
    return {
      name: task.name,
      start: format(task.startDate, 'dd/MM/yyyy'),
      end: format(task.endDate, 'dd/MM/yyyy'),
      duration: `${duration}d`,
      progress: `${progress}%`
    };
  }, [task, duration, progress, showTooltip]);

  if (task?.isMilestone || duration === 0) {
    const centerX = position.x;
    const centerY = position.y + barHeight / 2;
    const size = Math.min(barHeight * 0.5, 10);

    return (
      <g
        className="gantt-milestone"
        onClick={() => onClick?.(task)}
        style={{ opacity, cursor: 'pointer' }}
        onMouseEnter={() => { setIsHovered(true); setShowHandles(true); }}
        onMouseLeave={() => { setIsHovered(false); setShowHandles(false); }}
      >
        <polygon
          points={`${centerX},${centerY - size} ${centerX + size},${centerY} ${centerX},${centerY + size} ${centerX - size},${centerY}`}
          fill={isCritical ? themeColors.milestone.fillCritical : themeColors.milestone.fill}
          stroke={isSelected ? themeColors.selection : themeColors.milestone.stroke}
          strokeWidth={isSelected ? 2 : 1}
          style={{ transition: 'all 0.15s ease' }}
        />

        {showLabels && (
          <text
            x={centerX + size + 6}
            y={centerY + 3}
            fontSize={theme.typography.taskLabel.fontSize}
            fontWeight={theme.typography.taskLabel.fontWeight}
            fill={themeColors.grid.rowEven === '#FFFFFF' ? '#374151' : '#E5E7EB'}
            fontFamily={theme.typography.fontFamily}
          >
            {task.name}
          </text>
        )}

        {showHandles && (
          <>
            <circle
              cx={centerX - size - 3}
              cy={centerY}
              r={DEPENDENCY_HANDLE_SIZE}
              fill={isDependencyDragTarget ? themeColors.handleHover : themeColors.handle}
              stroke="white"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'start', e); }}
            />
            <circle
              cx={centerX + size + 3}
              cy={centerY}
              r={DEPENDENCY_HANDLE_SIZE}
              fill={isDependencyDragTarget ? themeColors.handleHover : themeColors.handle}
              stroke="white"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'end', e); }}
            />
          </>
        )}

        {isHovered && tooltipContent && (
          <g className="gantt-tooltip" style={{ pointerEvents: 'none' }}>
            <rect
              x={centerX - 60}
              y={centerY - size - 35}
              width={120}
              height={28}
              rx={4}
              fill="#1F2937"
              fillOpacity={0.95}
            />
            <text x={centerX} y={centerY - size - 17} fontSize="10" fill="white" textAnchor="middle" fontFamily={theme.typography.fontFamily}>
              {tooltipContent.name} • {tooltipContent.start}
            </text>
          </g>
        )}
      </g>
    );
  }

  if (hasChildren(task)) {
    const centerY = position.y + barHeight / 2;
    const lineHeight = 3;
    const endCapSize = 4;

    return (
      <g
        className="gantt-summary-bar"
        style={{ opacity }}
        onMouseEnter={() => { setIsHovered(true); setShowHandles(true); }}
        onMouseLeave={() => { setIsHovered(false); setShowHandles(false); }}
      >
        <rect
          x={position.x - 5}
          y={position.y}
          width={position.width + 10}
          height={barHeight}
          fill="transparent"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onClick?.(task); }}
        />

        <rect
          x={position.x}
          y={centerY - lineHeight / 2}
          width={position.width}
          height={lineHeight}
          fill={colors.fill}
        />

        <polygon
          points={`
            ${position.x},${centerY - endCapSize}
            ${position.x + endCapSize},${centerY}
            ${position.x},${centerY + endCapSize}
          `}
          fill={colors.fill}
        />
        <polygon
          points={`
            ${position.x + position.width},${centerY - endCapSize}
            ${position.x + position.width - endCapSize},${centerY}
            ${position.x + position.width},${centerY + endCapSize}
          `}
          fill={colors.fill}
        />

        {progress > 0 && (
          <rect
            x={position.x}
            y={centerY + lineHeight / 2 + 1}
            width={(position.width * progress) / 100}
            height={2}
            fill={colors.isProject ? themeColors.completedActivity.fill : themeColors.baseline.fill}
          />
        )}

        {showLabels && (
          <text
            x={position.x + position.width + 8}
            y={centerY + 3}
            fontSize={theme.typography.taskLabel.fontSize}
            fontWeight={600}
            fill={colors.isProject ? themeColors.summaryProject.fill : (themeColors.grid.rowEven === '#FFFFFF' ? '#374151' : '#E5E7EB')}
            fontFamily={theme.typography.fontFamily}
          >
            {task.name}
          </text>
        )}

        {showHandles && (
          <>
            <circle
              cx={position.x - 3}
              cy={centerY}
              r={DEPENDENCY_HANDLE_SIZE}
              fill={themeColors.handle}
              stroke="white"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'start', e); }}
            />
            <circle
              cx={position.x + position.width + 3}
              cy={centerY}
              r={DEPENDENCY_HANDLE_SIZE}
              fill={themeColors.handle}
              stroke="white"
              strokeWidth={1.5}
              style={{ cursor: 'crosshair' }}
              onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'end', e); }}
            />
          </>
        )}
      </g>
    );
  }

  const activityBarHeight = barHeight * 0.65;
  const activityBarY = position.y + (barHeight - activityBarHeight) / 2;
  const progressBarHeight = 3;
  const progressBarY = activityBarY + activityBarHeight + 2;

  return (
    <g
      className="gantt-activity-bar"
      style={{ opacity }}
      onMouseEnter={() => { setIsHovered(true); setShowHandles(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowHandles(false); }}
    >
      <rect
        x={position.x - 5}
        y={position.y - 5}
        width={position.width + 10}
        height={barHeight + 10}
        fill="transparent"
      />

      <defs>
        <linearGradient id={`bar-gradient-${task.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={(colors as any).fillLight || colors.fill} />
          <stop offset="100%" stopColor={colors.fill} />
        </linearGradient>
      </defs>

      <rect
        x={position.x}
        y={activityBarY}
        width={position.width}
        height={activityBarHeight}
        rx={theme.spacing.barRadius}
        ry={theme.spacing.barRadius}
        fill={`url(#bar-gradient-${task.id})`}
        stroke={isSelected ? themeColors.selection : (colors as any).stroke || colors.fill}
        strokeWidth={isSelected ? 2 : 0.5}
        style={{ 
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: 'stroke-width 0.15s ease'
        }}
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

      {progress > 0 && (
        <rect
          x={position.x}
          y={progressBarY}
          width={(position.width * progress) / 100}
          height={progressBarHeight}
          rx={1}
          fill={(colors as any).progress || themeColors.normalActivity.progress}
        />
      )}

      {progress > 0 && position.width > 40 && (
        <text
          x={position.x + position.width - 4}
          y={activityBarY + activityBarHeight / 2 + 3}
          fontSize="9"
          fontWeight="600"
          fill={(colors as any).text || 'white'}
          textAnchor="end"
          fontFamily={theme.typography.fontFamily}
          style={{ opacity: 0.9 }}
        >
          {progress}%
        </text>
      )}

      {showLabels && (
        <text
          x={position.x + position.width + 6}
          y={activityBarY + activityBarHeight / 2 + 3}
          fontSize={theme.typography.taskLabel.fontSize}
          fontWeight={theme.typography.taskLabel.fontWeight}
          fill={themeColors.grid.rowEven === '#FFFFFF' ? '#374151' : '#E5E7EB'}
          fontFamily={theme.typography.fontFamily}
        >
          {task.name}
        </text>
      )}

      {hasViolations && (
        <g className="gantt-violation-indicator">
          <polygon
            points={`${position.x - 8},${activityBarY - 2} ${position.x - 2},${activityBarY - 2} ${position.x - 5},${activityBarY - 8}`}
            fill="#F59E0B"
            stroke="white"
            strokeWidth={0.5}
          />
          <text
            x={position.x - 5}
            y={activityBarY - 4}
            fontSize="6"
            fontWeight="bold"
            fill="white"
            textAnchor="middle"
          >
            !
          </text>
        </g>
      )}

      {hasConflicts && (
        <circle
          cx={position.x + position.width + 2}
          cy={activityBarY - 2}
          r={4}
          fill={themeColors.criticalActivity.fill}
          stroke="white"
          strokeWidth={1}
        />
      )}

      {showHandles && (
        <>
          <rect
            x={position.x}
            y={activityBarY}
            width={RESIZE_HANDLE_WIDTH}
            height={activityBarHeight}
            fill="rgba(255,255,255,0.5)"
            rx={1}
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(e, task, 'left');
            }}
          />
          <rect
            x={position.x + position.width - RESIZE_HANDLE_WIDTH}
            y={activityBarY}
            width={RESIZE_HANDLE_WIDTH}
            height={activityBarHeight}
            fill="rgba(255,255,255,0.5)"
            rx={1}
            style={{ cursor: 'ew-resize' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(e, task, 'right');
            }}
          />

          <circle
            cx={position.x - 3}
            cy={activityBarY + activityBarHeight / 2}
            r={DEPENDENCY_HANDLE_SIZE}
            fill={isDependencyDragTarget ? themeColors.handleHover : themeColors.handle}
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'start', e); }}
            onMouseEnter={() => onDependencyDragEnter?.(task, 'start')}
            onMouseLeave={() => onDependencyDragLeave?.()}
          />
          <circle
            cx={position.x + position.width + 3}
            cy={activityBarY + activityBarHeight / 2}
            r={DEPENDENCY_HANDLE_SIZE}
            fill={isDependencyDragTarget ? themeColors.handleHover : themeColors.handle}
            stroke="white"
            strokeWidth={1.5}
            style={{ cursor: 'crosshair' }}
            onMouseDown={(e) => { e.stopPropagation(); onDependencyDragStart?.(task, 'end', e); }}
            onMouseEnter={() => onDependencyDragEnter?.(task, 'end')}
            onMouseLeave={() => onDependencyDragLeave?.()}
          />
        </>
      )}

      {isHovered && tooltipContent && !isDragging && !isResizing && (
        <g className="gantt-tooltip" style={{ pointerEvents: 'none' }}>
          <rect
            x={position.x + position.width / 2 - 80}
            y={position.y - 40}
            width={160}
            height={32}
            rx={4}
            fill="#1F2937"
            fillOpacity={0.95}
          />
          <text
            x={position.x + position.width / 2}
            y={position.y - 27}
            fontSize="9"
            fill="#9CA3AF"
            textAnchor="middle"
            fontFamily={theme.typography.fontFamily}
          >
            {tooltipContent.start} → {tooltipContent.end}
          </text>
          <text
            x={position.x + position.width / 2}
            y={position.y - 15}
            fontSize="10"
            fill="white"
            textAnchor="middle"
            fontWeight="500"
            fontFamily={theme.typography.fontFamily}
          >
            {tooltipContent.duration} • {tooltipContent.progress} completo
          </text>
        </g>
      )}
    </g>
  );
}
