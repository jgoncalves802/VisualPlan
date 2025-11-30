/**
 * DependencyArrow - Professional Primavera P6 Style
 * Features:
 * - Clean orthogonal routing with proper offsets
 * - Smart path calculation to avoid overlaps
 * - Larger, clearer arrowheads
 * - Hover effects for interactivity
 * - Support for all dependency types (FS, SS, FF, SF)
 */

import React, { useState } from 'react';
import type { Dependency, Task } from '../types';

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
  onClick?: (dependency: Dependency) => void;
}

// Arrow styling constants - P6 professional look (solid, thin, high visibility)
const ARROW_CONFIG = {
  strokeWidth: 1.5,           // Thin but visible solid line
  strokeWidthHover: 2,        // Slightly thicker on hover
  arrowSize: 5,               // Compact arrowhead
  arrowSizeHover: 6,          // Slightly larger on hover
  defaultColor: '#374151',    // Dark gray - high visibility on white background
  criticalColor: '#DC2626',   // Red for critical path
  highlightColor: '#1D4ED8',  // Darker blue for selected/hover
  minOffset: 12,              // Minimum horizontal offset from task bars
  verticalGap: 8,             // Gap when routing around tasks
};

/**
 * Calculate optimized orthogonal path for FS (Finish-to-Start) dependency
 * Uses smart routing to avoid overlapping with task bars
 * Ensures the path always approaches the successor from outside
 * 
 * Strategy: All paths must satisfy:
 * 1. Exit the predecessor from the right (from.x)
 * 2. Never cross through any task bar
 * 3. Approach the successor from the left (to.x)
 */
function calculateFSPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number,
  rowHeight?: number
): { path: string; arrowPoints: string; arrowAngle: number } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const effectiveRowHeight = rowHeight || taskHeight * 1.5;
  
  // Calculate safe exit and approach points
  const exitX = from.x + indent; // Point to the right of predecessor
  const approachX = to.x - indent; // Point to the left of successor
  
  // Determine if tasks share the same row
  const sameRow = Math.abs(from.y - to.y) < taskHeight * 0.5;
  
  // Determine routing direction for detours
  const goBelow = from.y <= to.y;
  
  let path: string;
  
  // Case 1: Successor is to the right with enough gap (standard FS)
  // Simple route: exit right, go vertical, approach left
  if (approachX > exitX && !sameRow) {
    // Standard dogleg - exit, vertical, approach
    path = [
      `M ${from.x} ${fromCenterY}`,
      `H ${exitX}`,
      `V ${toCenterY}`,
      `H ${to.x}`
    ].join(' ');
  }
  // Case 2: Successor is to the right but on same row
  // Need to route around to avoid crossing the gap visually
  else if (approachX > exitX && sameRow) {
    // Route above or below the row
    const routeY = goBelow
      ? Math.max(from.y + taskHeight, to.y + taskHeight) + ARROW_CONFIG.verticalGap + 10
      : Math.min(from.y, to.y) - ARROW_CONFIG.verticalGap - 10;
    
    path = [
      `M ${from.x} ${fromCenterY}`,
      `H ${exitX}`,
      `V ${routeY}`,
      `H ${approachX}`,
      `V ${toCenterY}`,
      `H ${to.x}`
    ].join(' ');
  }
  // Case 3: Successor is to the left or overlapping (complex routing)
  // Need to route completely around - go above/below both tasks
  else {
    // Calculate routing Y - must clear BOTH task bars
    const routeY = goBelow
      ? Math.max(from.y + taskHeight, to.y + taskHeight) + ARROW_CONFIG.verticalGap + 12
      : Math.min(from.y, to.y) - ARROW_CONFIG.verticalGap - 12;
    
    // For overlapping tasks, we need to go further out
    // Exit to the right of predecessor, route around, approach from left of successor
    const safeApproachX = Math.min(approachX, to.x - indent);
    
    path = [
      `M ${from.x} ${fromCenterY}`,
      `H ${exitX}`,
      `V ${routeY}`,
      `H ${safeApproachX}`,
      `V ${toCenterY}`,
      `H ${to.x}`
    ].join(' ');
  }
  
  // Arrow points to the left (entering task from left)
  const arrowPoints = createArrowHead(to.x, toCenterY, 'left', ARROW_CONFIG.arrowSize);
  
  return { path, arrowPoints, arrowAngle: 180 };
}

/**
 * Calculate path for SS (Start-to-Start) dependency
 */
function calculateSSPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string; arrowAngle: number } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  
  // Both connections from left side
  const leftMost = Math.min(from.x, to.x) - indent;
  
  const path = [
    `M ${from.x} ${fromCenterY}`,
    `H ${leftMost}`,
    `V ${toCenterY}`,
    `H ${to.x}`
  ].join(' ');
  
  // Arrow points to the left
  const arrowPoints = createArrowHead(to.x, toCenterY, 'left', ARROW_CONFIG.arrowSize);
  
  return { path, arrowPoints, arrowAngle: 180 };
}

/**
 * Calculate path for FF (Finish-to-Finish) dependency
 */
function calculateFFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string; arrowAngle: number } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  
  // Both connections from right side
  const rightMost = Math.max(from.x, to.x) + indent;
  
  const path = [
    `M ${from.x} ${fromCenterY}`,
    `H ${rightMost}`,
    `V ${toCenterY}`,
    `H ${to.x}`
  ].join(' ');
  
  // Arrow points to the right
  const arrowPoints = createArrowHead(to.x, toCenterY, 'right', ARROW_CONFIG.arrowSize);
  
  return { path, arrowPoints, arrowAngle: 0 };
}

/**
 * Calculate path for SF (Start-to-Finish) dependency
 */
function calculateSFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  taskHeight: number,
  indent: number
): { path: string; arrowPoints: string; arrowAngle: number } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  
  // From left side to right side
  const leftX = from.x - indent;
  const rightX = to.x + indent;
  
  // Determine vertical routing
  const midY = fromCenterY > toCenterY
    ? Math.min(from.y, to.y) - ARROW_CONFIG.verticalGap
    : Math.max(from.y + taskHeight, to.y + taskHeight) + ARROW_CONFIG.verticalGap;
  
  const path = [
    `M ${from.x} ${fromCenterY}`,
    `H ${leftX}`,
    `V ${midY}`,
    `H ${rightX}`,
    `V ${toCenterY}`,
    `H ${to.x}`
  ].join(' ');
  
  // Arrow points to the right
  const arrowPoints = createArrowHead(to.x, toCenterY, 'right', ARROW_CONFIG.arrowSize);
  
  return { path, arrowPoints, arrowAngle: 0 };
}

/**
 * Create arrowhead points for different directions
 */
function createArrowHead(
  x: number, 
  y: number, 
  direction: 'left' | 'right' | 'up' | 'down',
  size: number
): string {
  switch (direction) {
    case 'left':
      return `${x},${y} ${x - size},${y - size} ${x - size},${y + size}`;
    case 'right':
      return `${x},${y} ${x + size},${y - size} ${x + size},${y + size}`;
    case 'up':
      return `${x},${y} ${x - size},${y - size} ${x + size},${y - size}`;
    case 'down':
      return `${x},${y} ${x - size},${y + size} ${x + size},${y + size}`;
    default:
      return `${x},${y} ${x - size},${y - size} ${x - size},${y + size}`;
  }
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
  arrowIndent = ARROW_CONFIG.minOffset,
  color,
  isHighlighted = false,
  onClick,
}: DependencyArrowProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const from = { x: fromX, y: fromY };
  const to = { x: toX, y: toY };
  
  // Determine color based on state and critical path
  const isCritical = (fromTask as any)?.isCritical || (toTask as any)?.isCritical;
  const baseColor = color || (isCritical ? ARROW_CONFIG.criticalColor : ARROW_CONFIG.defaultColor);
  const activeColor = isHovered || isHighlighted ? ARROW_CONFIG.highlightColor : baseColor;
  
  // Calculate path based on dependency type
  let pathData: { path: string; arrowPoints: string; arrowAngle: number };
  
  switch (dependency.type) {
    case 'SS':
      pathData = calculateSSPath(from, to, taskHeight, arrowIndent);
      break;
    case 'FF':
      pathData = calculateFFPath(from, to, taskHeight, arrowIndent);
      break;
    case 'SF':
      pathData = calculateSFPath(from, to, taskHeight, arrowIndent);
      break;
    case 'FS':
    default:
      pathData = calculateFSPath(from, to, taskHeight, arrowIndent, rowHeight);
      break;
  }
  
  const strokeWidth = isHovered ? ARROW_CONFIG.strokeWidthHover : ARROW_CONFIG.strokeWidth;
  
  return (
    <g 
      className="gantt-dependency-arrow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick?.(dependency)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Invisible wider path for easier hover/click */}
      <path
        d={pathData.path}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        pointerEvents="stroke"
      />
      
      {/* Visible orthogonal path */}
      <path
        d={pathData.path}
        stroke={activeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="gantt-dependency-path"
        style={{
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
        }}
      />
      
      {/* Arrowhead */}
      <polygon
        points={pathData.arrowPoints}
        fill={activeColor}
        className="gantt-dependency-arrowhead"
        style={{
          transition: 'fill 0.15s ease',
        }}
      />
      
      {/* Lag indicator (if lag > 0) */}
      {dependency.lag && dependency.lag > 0 && isHovered && (
        <g className="gantt-dependency-lag">
          <rect
            x={(fromX + toX) / 2 - 12}
            y={(fromY + toY) / 2 + taskHeight / 2 - 8}
            width={24}
            height={16}
            rx={3}
            fill="white"
            stroke={activeColor}
            strokeWidth={1}
          />
          <text
            x={(fromX + toX) / 2}
            y={(fromY + toY) / 2 + taskHeight / 2 + 4}
            fontSize="10"
            fontWeight="500"
            fill={activeColor}
            textAnchor="middle"
          >
            +{dependency.lag}d
          </text>
        </g>
      )}
    </g>
  );
}
