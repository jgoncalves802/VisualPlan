
/**
 * Dependency calculation and path generation utilities
 * Enhanced with SVAR-inspired orthogonal routing
 */

import type { Dependency, DependencyType, Point } from '../types';

/**
 * Calculate dependency end points based on dependency type
 */
export function calculateDependencyPoints(
  _fromTask: unknown,
  _toTask: unknown,
  type: DependencyType,
  fromRect: { x: number; y: number; width: number; height: number },
  toRect: { x: number; y: number; width: number; height: number }
): { start: Point; end: Point } {
  const centerY = fromRect.height / 2;
  const HANDLE_OFFSET = 8;
  
  switch (type) {
    case 'FS': // Finish to Start
      return {
        start: { x: fromRect.x + fromRect.width + HANDLE_OFFSET, y: fromRect.y + centerY },
        end: { x: toRect.x - HANDLE_OFFSET, y: toRect.y + centerY }
      };
    case 'SS': // Start to Start
      return {
        start: { x: fromRect.x - HANDLE_OFFSET, y: fromRect.y + centerY },
        end: { x: toRect.x - HANDLE_OFFSET, y: toRect.y + centerY }
      };
    case 'FF': // Finish to Finish
      return {
        start: { x: fromRect.x + fromRect.width + HANDLE_OFFSET, y: fromRect.y + centerY },
        end: { x: toRect.x + toRect.width + HANDLE_OFFSET, y: toRect.y + centerY }
      };
    case 'SF': // Start to Finish
      return {
        start: { x: fromRect.x - HANDLE_OFFSET, y: fromRect.y + centerY },
        end: { x: toRect.x + toRect.width + HANDLE_OFFSET, y: toRect.y + centerY }
      };
    default:
      return {
        start: { x: fromRect.x + fromRect.width + HANDLE_OFFSET, y: fromRect.y + centerY },
        end: { x: toRect.x - HANDLE_OFFSET, y: toRect.y + centerY }
      };
  }
}

/**
 * Generate SVG path for dependency line with SVAR-style orthogonal routing
 * Uses smooth corners with rounded bends for professional appearance
 */
export function generateDependencyPath(start: Point, end: Point): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  const horizontalGap = 12;
  const cornerRadius = 6;
  
  if (Math.abs(dy) < 3) {
    return `M ${start.x},${start.y} L ${end.x},${end.y}`;
  }
  
  if (dx > horizontalGap * 2) {
    const midX = start.x + dx / 2;
    const r = Math.min(cornerRadius, Math.abs(dy) / 2, Math.abs(dx) / 4);
    
    if (dy > 0) {
      return `M ${start.x},${start.y} 
              L ${midX - r},${start.y} 
              Q ${midX},${start.y} ${midX},${start.y + r}
              L ${midX},${end.y - r}
              Q ${midX},${end.y} ${midX + r},${end.y}
              L ${end.x},${end.y}`;
    } else {
      return `M ${start.x},${start.y} 
              L ${midX - r},${start.y} 
              Q ${midX},${start.y} ${midX},${start.y - r}
              L ${midX},${end.y + r}
              Q ${midX},${end.y} ${midX + r},${end.y}
              L ${end.x},${end.y}`;
    }
  } else {
    const rightExtend = start.x + horizontalGap;
    const leftExtend = end.x - horizontalGap;
    const r = Math.min(cornerRadius, Math.abs(dy) / 4);
    
    if (dy > 0) {
      const midY = (start.y + end.y) / 2;
      
      return `M ${start.x},${start.y} 
              L ${rightExtend - r},${start.y} 
              Q ${rightExtend},${start.y} ${rightExtend},${start.y + r}
              L ${rightExtend},${midY - r}
              Q ${rightExtend},${midY} ${rightExtend - r},${midY}
              L ${leftExtend + r},${midY}
              Q ${leftExtend},${midY} ${leftExtend},${midY + r}
              L ${leftExtend},${end.y - r}
              Q ${leftExtend},${end.y} ${leftExtend + r},${end.y}
              L ${end.x},${end.y}`;
    } else {
      const midY = (start.y + end.y) / 2;
      
      return `M ${start.x},${start.y} 
              L ${rightExtend - r},${start.y} 
              Q ${rightExtend},${start.y} ${rightExtend},${start.y - r}
              L ${rightExtend},${midY + r}
              Q ${rightExtend},${midY} ${rightExtend - r},${midY}
              L ${leftExtend + r},${midY}
              Q ${leftExtend},${midY} ${leftExtend},${midY - r}
              L ${leftExtend},${end.y + r}
              Q ${leftExtend},${end.y} ${leftExtend + r},${end.y}
              L ${end.x},${end.y}`;
    }
  }
}

/**
 * Generate polyline points for SVAR-style dependency arrows
 * Returns points string for use with SVG polyline element
 */
export function generateDependencyPolyline(start: Point, end: Point): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  const horizontalGap = 12;
  
  if (Math.abs(dy) < 3) {
    return `${start.x},${start.y} ${end.x},${end.y}`;
  }
  
  if (dx > horizontalGap * 2) {
    const midX = start.x + dx / 2;
    return `${start.x},${start.y} ${midX},${start.y} ${midX},${end.y} ${end.x},${end.y}`;
  } else {
    const rightExtend = start.x + horizontalGap;
    const leftExtend = end.x - horizontalGap;
    const midY = (start.y + end.y) / 2;
    
    return `${start.x},${start.y} ${rightExtend},${start.y} ${rightExtend},${midY} ${leftExtend},${midY} ${leftExtend},${end.y} ${end.x},${end.y}`;
  }
}

/**
 * Check if dependency creates a circular reference
 */
export function hasCircularDependency(
  fromTaskId: string,
  toTaskId: string,
  dependencies: Dependency[]
): boolean {
  const visited = new Set<string>();
  const stack = [toTaskId];
  
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) continue;
    
    if (currentId === fromTaskId) {
      return true; // Found circular dependency
    }
    
    if (visited.has(currentId)) continue;
    visited.add(currentId);
    
    // Find all tasks that depend on current task
    const dependentTasks = dependencies
      .filter(dep => dep.fromTaskId === currentId)
      .map(dep => dep.toTaskId);
    
    stack.push(...dependentTasks);
  }
  
  return false;
}

/**
 * Get all predecessors of a task
 */
export function getPredecessors(taskId: string, dependencies: Dependency[]): Dependency[] {
  return dependencies.filter(dep => dep.toTaskId === taskId);
}

/**
 * Get all successors of a task
 */
export function getSuccessors(taskId: string, dependencies: Dependency[]): Dependency[] {
  return dependencies.filter(dep => dep.fromTaskId === taskId);
}
