
/**
 * Dependency calculation and path generation utilities
 */

import type { Task, Dependency, DependencyType, Point } from '../types';

/**
 * Calculate dependency end points based on dependency type
 */
export function calculateDependencyPoints(
  fromTask: Task,
  toTask: Task,
  type: DependencyType,
  fromRect: { x: number; y: number; width: number; height: number },
  toRect: { x: number; y: number; width: number; height: number }
): { start: Point; end: Point } {
  const centerY = fromRect.height / 2;
  const HANDLE_OFFSET = 8; // Offset dos handles para fora da barra (mesmo valor usado no task-bar.tsx)
  
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
 * Generate SVG path for dependency line with orthogonal routing (Bryntum/DHTMLX style)
 * Creates clear, defined paths with right-angle corners
 */
export function generateDependencyPath(start: Point, end: Point): string {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  
  // Horizontal spacing for routing
  const horizontalGap = 15; // Minimum gap before turning
  const verticalOffset = 30; // Offset for routing around tasks
  
  if (dx > horizontalGap) {
    // Target is to the right - simple orthogonal path
    const midX = start.x + dx / 2;
    
    if (Math.abs(dy) < 5) {
      // Same row - straight line
      return `M ${start.x},${start.y} L ${end.x},${end.y}`;
    } else {
      // Different rows - orthogonal routing with sharp corners
      return `M ${start.x},${start.y} L ${midX},${start.y} L ${midX},${end.y} L ${end.x},${end.y}`;
    }
  } else {
    // Target is to the left or very close - route around
    // This creates the "S" or "Z" shaped path seen in professional Gantt charts
    const rightExtend = start.x + horizontalGap;
    const leftExtend = end.x - horizontalGap;
    
    if (dy > 0) {
      // Target is below - route downward
      const midY1 = start.y + verticalOffset;
      const midY2 = end.y - verticalOffset;
      
      return `M ${start.x},${start.y} 
              L ${rightExtend},${start.y} 
              L ${rightExtend},${midY1} 
              L ${leftExtend},${midY2} 
              L ${leftExtend},${end.y} 
              L ${end.x},${end.y}`;
    } else {
      // Target is above - route upward
      const midY1 = start.y - verticalOffset;
      const midY2 = end.y + verticalOffset;
      
      return `M ${start.x},${start.y} 
              L ${rightExtend},${start.y} 
              L ${rightExtend},${midY1} 
              L ${leftExtend},${midY2} 
              L ${leftExtend},${end.y} 
              L ${end.x},${end.y}`;
    }
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
