
/**
 * DependencyLine - Renders dependency connections between tasks
 * Enhanced with DHTMLX-inspired design system
 */



import { useState } from 'react';
import type { Dependency, Task, TaskBarPosition } from '../types';
import { calculateDependencyPoints, generateDependencyPath } from '../utils';

interface DependencyLineProps {
  dependency: Dependency;
  fromTask: Task;
  toTask: Task;
  fromPosition: TaskBarPosition;
  toPosition: TaskBarPosition;
  isSelected?: boolean;
  onClick?: (dependency: Dependency) => void;
}

export function DependencyLine({
  dependency,
  fromTask,
  toTask,
  fromPosition,
  toPosition,
  isSelected = false,
  onClick
}: DependencyLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const points = calculateDependencyPoints(
    fromTask,
    toTask,
    dependency?.type ?? 'FS',
    fromPosition,
    toPosition
  );

  const path = generateDependencyPath(points.start, points.end);

  // Arrow head points (Bryntum style - larger and more visible)
  const arrowSize = 10; // Increased from 8 to 10 for better visibility
  const angle = Math.atan2(points.end.y - points.start.y, points.end.x - points.start.x);
  const arrowPoint1 = {
    x: points.end.x - arrowSize * Math.cos(angle - Math.PI / 6),
    y: points.end.y - arrowSize * Math.sin(angle - Math.PI / 6)
  };
  const arrowPoint2 = {
    x: points.end.x - arrowSize * Math.cos(angle + Math.PI / 6),
    y: points.end.y - arrowSize * Math.sin(angle + Math.PI / 6)
  };

  // Determine color based on state
  const getLineColor = () => {
    if (isSelected) return 'var(--gantt-link-selected)';
    if (isHovered) return 'var(--gantt-link-hover)';
    return 'var(--gantt-link-default)';
  };

  const lineColor = getLineColor();
  const strokeWidth = isHovered || isSelected ? 3 : 2.5; // Increased from 2.5/2 to 3/2.5

  return (
    <g
      className="dependency-line group cursor-pointer transition-all"
      onClick={() => onClick?.(dependency)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shadow for depth (subtle) */}
      <path
        d={path}
        stroke="rgba(0,0,0,0.1)"
        strokeWidth={strokeWidth + 1}
        fill="none"
        pointerEvents="none"
        transform="translate(1, 1)"
      />

      {/* Main path - DHTMLX style */}
      <path
        d={path}
        stroke={lineColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="transition-all duration-200"
        style={{
          filter: isHovered ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
        }}
      />

      {/* Arrow head */}
      <polygon
        points={`${points.end.x},${points.end.y} ${arrowPoint1.x},${arrowPoint1.y} ${arrowPoint2.x},${arrowPoint2.y}`}
        fill={lineColor}
        className="transition-all duration-200"
      />

      {/* Invisible wider path for easier hover/click */}
      <path
        d={path}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
      />

      {/* Dependency type badge (shown on hover) - DHTMLX style */}
      {(isHovered || isSelected) && (
        <g>
          {/* Badge background */}
          <rect
            x={(points.start.x + points.end.x) / 2 - 20}
            y={(points.start.y + points.end.y) / 2 - 12}
            width={40}
            height={20}
            rx={10}
            ry={10}
            fill={lineColor}
            className="transition-opacity duration-200"
          />
          {/* Badge text */}
          <text
            x={(points.start.x + points.end.x) / 2}
            y={(points.start.y + points.end.y) / 2}
            fontSize={11}
            fontWeight={600}
            fill="white"
            className="transition-opacity duration-200 pointer-events-none"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {dependency?.type ?? 'FS'}
            {dependency?.lag ? (dependency.lag > 0 ? `+${dependency.lag}` : dependency.lag) : ''}
          </text>
        </g>
      )}
    </g>
  );
}
