/**
 * DependencyArrow - Primavera P6 Professional Style with Theme Support
 */

import React, { useState, useMemo } from 'react';
import type { Dependency, Task } from '../types';
import { useGanttTheme } from '../context/theme-context';

interface DependencyArrowProps {
  dependency: Dependency;
  fromTask: Task;
  toTask: Task;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  rowHeight: number;
  taskHeight: number;
  arrowIndent?: number;
  color?: string;
  isHighlighted?: boolean;
  isCritical?: boolean;
  onClick?: (dependency: Dependency) => void;
}

const DEFAULT_ARROW_STYLE = {
  strokeWidth: 1,
  strokeWidthHover: 1.5,
  arrowSize: 4,
  indent: 10,
  verticalGap: 6
};

function createArrowHead(x: number, y: number, direction: 'left' | 'right', size: number): string {
  if (direction === 'left') {
    return `${x},${y} ${x - size},${y - size * 0.8} ${x - size},${y + size * 0.8}`;
  }
  return `${x},${y} ${x + size},${y - size * 0.8} ${x + size},${y + size * 0.8}`;
}

function calculateFSPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  
  const exitX = from.x + indent;
  const approachX = to.x - indent;
  const sameRow = Math.abs(from.y - to.y) < taskHeight * 0.5;
  const goBelow = from.y <= to.y;
  
  let path: string;
  
  if (approachX > exitX && !sameRow) {
    path = `M ${from.x} ${fromCenterY} H ${exitX} V ${toCenterY} H ${to.x}`;
  } else if (approachX > exitX && sameRow) {
    const routeY = goBelow
      ? Math.max(from.y + taskHeight, to.y + taskHeight) + DEFAULT_ARROW_STYLE.verticalGap + 8
      : Math.min(from.y, to.y) - DEFAULT_ARROW_STYLE.verticalGap - 8;
    
    path = `M ${from.x} ${fromCenterY} H ${exitX} V ${routeY} H ${approachX} V ${toCenterY} H ${to.x}`;
  } else {
    const routeY = goBelow
      ? Math.max(from.y + taskHeight, to.y + taskHeight) + DEFAULT_ARROW_STYLE.verticalGap + 10
      : Math.min(from.y, to.y) - DEFAULT_ARROW_STYLE.verticalGap - 10;
    
    path = `M ${from.x} ${fromCenterY} H ${exitX} V ${routeY} H ${approachX} V ${toCenterY} H ${to.x}`;
  }
  
  const arrowPoints = createArrowHead(to.x, toCenterY, 'left', DEFAULT_ARROW_STYLE.arrowSize);
  return { path, arrowPoints };
}

function calculateSSPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const leftMost = Math.min(from.x, to.x) - indent;
  
  const path = `M ${from.x} ${fromCenterY} H ${leftMost} V ${toCenterY} H ${to.x}`;
  const arrowPoints = createArrowHead(to.x, toCenterY, 'left', DEFAULT_ARROW_STYLE.arrowSize);
  
  return { path, arrowPoints };
}

function calculateFFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const rightMost = Math.max(from.x, to.x) + indent;
  
  const path = `M ${from.x} ${fromCenterY} H ${rightMost} V ${toCenterY} H ${to.x}`;
  const arrowPoints = createArrowHead(to.x, toCenterY, 'right', DEFAULT_ARROW_STYLE.arrowSize);
  
  return { path, arrowPoints };
}

function calculateSFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const leftX = from.x - indent;
  const rightX = to.x + indent;
  
  const midY = fromCenterY > toCenterY
    ? Math.min(from.y, to.y) - DEFAULT_ARROW_STYLE.verticalGap
    : Math.max(from.y + taskHeight, to.y + taskHeight) + DEFAULT_ARROW_STYLE.verticalGap;
  
  const path = `M ${from.x} ${fromCenterY} H ${leftX} V ${midY} H ${rightX} V ${toCenterY} H ${to.x}`;
  const arrowPoints = createArrowHead(to.x, toCenterY, 'right', DEFAULT_ARROW_STYLE.arrowSize);
  
  return { path, arrowPoints };
}

export function DependencyArrow({
  dependency,
  fromTask,
  toTask,
  fromX,
  fromY,
  toX,
  toY,
  rowHeight,
  taskHeight,
  arrowIndent = DEFAULT_ARROW_STYLE.indent,
  color,
  isHighlighted = false,
  isCritical = false,
  onClick
}: DependencyArrowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useGanttTheme();
  const depColors = theme.colors.dependency;
  
  const from = { x: fromX, y: fromY };
  const to = { x: toX, y: toY };
  
  const baseColor = color || (isCritical ? depColors.critical : depColors.normal);
  const activeColor = isHovered || isHighlighted ? depColors.hover : baseColor;
  
  const pathData = useMemo(() => {
    switch (dependency.type) {
      case 'SS':
        return calculateSSPath(from, to, taskHeight, arrowIndent);
      case 'FF':
        return calculateFFPath(from, to, taskHeight, arrowIndent);
      case 'SF':
        return calculateSFPath(from, to, taskHeight, arrowIndent);
      case 'FS':
      default:
        return calculateFSPath(from, to, taskHeight, arrowIndent);
    }
  }, [dependency.type, from.x, from.y, to.x, to.y, taskHeight, arrowIndent]);
  
  const strokeWidth = isHovered ? DEFAULT_ARROW_STYLE.strokeWidthHover : DEFAULT_ARROW_STYLE.strokeWidth;
  
  return (
    <g 
      className="gantt-dependency-arrow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(dependency)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <path
        d={pathData.path}
        stroke="transparent"
        strokeWidth={10}
        fill="none"
        pointerEvents="stroke"
      />
      
      <path
        d={pathData.path}
        stroke={activeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
        style={{ transition: 'stroke 0.15s ease, stroke-width 0.15s ease' }}
      />
      
      <polygon
        points={pathData.arrowPoints}
        fill={activeColor}
        style={{ transition: 'fill 0.15s ease' }}
      />
      
      {dependency.lag && dependency.lag !== 0 && isHovered && (
        <g className="gantt-dependency-lag">
          <rect
            x={(fromX + toX) / 2 - 14}
            y={(fromY + toY) / 2 + taskHeight / 2 - 8}
            width={28}
            height={16}
            rx={3}
            fill="#1F2937"
            fillOpacity={0.9}
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 + taskHeight / 2 + 4}
            fontSize="9"
            fontWeight="500"
            fill="white"
            textAnchor="middle"
            fontFamily="system-ui"
          >
            {dependency.lag > 0 ? '+' : ''}{dependency.lag}d
          </text>
        </g>
      )}
    </g>
  );
}
