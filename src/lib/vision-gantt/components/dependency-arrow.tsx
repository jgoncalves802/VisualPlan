/**
 * DependencyArrow - Improved orthogonal arrows with triangles
 * Inspired by gantt-task-react implementation
 * Creates professional-looking dependency connectors
 */



import React from 'react';
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
}

/**
 * Calculate orthogonal path and triangle for FS (Finish-to-Start) dependency
 */
function calculateOrthogonalPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
): { path: string; trianglePoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  
  // Determine vertical direction
  const verticalDirection = from.y > to.y ? -1 : 1;
  const horizontalOffset = arrowIndent;
  
  // Calculate intermediate points for orthogonal path
  const midPoint1X = from.x + horizontalOffset;
  const midPoint2X = to.x - horizontalOffset;
  
  // Check if we need horizontal offset
  const needsHorizontalOffset = from.x + horizontalOffset * 2 >= to.x;
  
  let path: string;
  if (needsHorizontalOffset) {
    // Complex path when tasks overlap or are close
    path = `
      M ${from.x} ${fromCenterY}
      H ${midPoint1X}
      V ${fromCenterY + (verticalDirection * rowHeight) / 2}
      H ${to.x - horizontalOffset}
      V ${toCenterY}
      H ${to.x}
    `.trim().replace(/\s+/g, ' ');
  } else {
    // Simple path when tasks are far apart
    path = `
      M ${from.x} ${fromCenterY}
      H ${midPoint1X}
      V ${fromCenterY + (verticalDirection * rowHeight) / 2}
      V ${toCenterY}
      H ${to.x}
    `.trim().replace(/\s+/g, ' ');
  }
  
  // Triangle pointing to the left (pointing at task start)
  const triangleSize = 5;
  const trianglePoints = `
    ${to.x},${toCenterY}
    ${to.x - triangleSize},${toCenterY - triangleSize}
    ${to.x - triangleSize},${toCenterY + triangleSize}
  `.trim().replace(/\s+/g, ' ');
  
  return { path, trianglePoints };
}

/**
 * Calculate path for SS (Start-to-Start) dependency
 */
function calculateSSPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
): { path: string; trianglePoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const verticalDirection = from.y > to.y ? -1 : 1;
  
  // Connect from start to start (left to left)
  const leftOffset = arrowIndent;
  
  const path = `
    M ${from.x} ${fromCenterY}
    H ${from.x - leftOffset}
    V ${fromCenterY + (verticalDirection * rowHeight) / 2}
    V ${toCenterY}
    H ${to.x}
  `.trim().replace(/\s+/g, ' ');
  
  const triangleSize = 5;
  const trianglePoints = `
    ${to.x},${toCenterY}
    ${to.x - triangleSize},${toCenterY - triangleSize}
    ${to.x - triangleSize},${toCenterY + triangleSize}
  `.trim().replace(/\s+/g, ' ');
  
  return { path, trianglePoints };
}

/**
 * Calculate path for FF (Finish-to-Finish) dependency
 */
function calculateFFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
): { path: string; trianglePoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const verticalDirection = from.y > to.y ? -1 : 1;
  
  // Connect from end to end (right to right)
  const rightOffset = arrowIndent;
  
  const path = `
    M ${from.x} ${fromCenterY}
    H ${from.x + rightOffset}
    V ${fromCenterY + (verticalDirection * rowHeight) / 2}
    V ${toCenterY}
    H ${to.x}
  `.trim().replace(/\s+/g, ' ');
  
  const triangleSize = 5;
  const trianglePoints = `
    ${to.x},${toCenterY}
    ${to.x + triangleSize},${toCenterY - triangleSize}
    ${to.x + triangleSize},${toCenterY + triangleSize}
  `.trim().replace(/\s+/g, ' ');
  
  return { path, trianglePoints };
}

/**
 * Calculate path for SF (Start-to-Finish) dependency
 */
function calculateSFPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
): { path: string; trianglePoints: string } {
  const fromCenterY = from.y + taskHeight / 2;
  const toCenterY = to.y + taskHeight / 2;
  const verticalDirection = from.y > to.y ? -1 : 1;
  
  // Connect from start to finish (left to right)
  const path = `
    M ${from.x} ${fromCenterY}
    H ${from.x - arrowIndent}
    V ${fromCenterY + (verticalDirection * rowHeight) / 2}
    V ${toCenterY}
    H ${to.x}
  `.trim().replace(/\s+/g, ' ');
  
  const triangleSize = 5;
  const trianglePoints = `
    ${to.x},${toCenterY}
    ${to.x + triangleSize},${toCenterY - triangleSize}
    ${to.x + triangleSize},${toCenterY + triangleSize}
  `.trim().replace(/\s+/g, ' ');
  
  return { path, trianglePoints };
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
  arrowIndent = 10,
  color = 'hsl(var(--primary))',
}: DependencyArrowProps) {
  const from = { x: fromX, y: fromY };
  const to = { x: toX, y: toY };
  
  // Calculate path based on dependency type
  let pathData: { path: string; trianglePoints: string };
  
  switch (dependency.type) {
    case 'SS':
      pathData = calculateSSPath(from, to, rowHeight, taskHeight, arrowIndent);
      break;
    case 'FF':
      pathData = calculateFFPath(from, to, rowHeight, taskHeight, arrowIndent);
      break;
    case 'SF':
      pathData = calculateSFPath(from, to, rowHeight, taskHeight, arrowIndent);
      break;
    case 'FS':
    default:
      pathData = calculateOrthogonalPath(from, to, rowHeight, taskHeight, arrowIndent);
      break;
  }
  
  return (
    <g className="gantt-dependency-arrow">
      {/* Orthogonal path */}
      <path
        d={pathData.path}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        className="gantt-dependency-path"
      />
      
      {/* Triangle arrowhead */}
      <polygon
        points={pathData.trianglePoints}
        fill={color}
        className="gantt-dependency-triangle"
      />
    </g>
  );
}
