
/**
 * TodayMarker - Visual indicator for current date
 */



import React from 'react';

interface TodayMarkerProps {
  position: number; // X position in pixels
  height: number;
  visible: boolean;
}

export function TodayMarker({ position, height, visible }: TodayMarkerProps) {
  if (!visible) return null;

  return (
    <g className="today-marker">
      {/* Vertical line */}
      <line
        x1={position}
        y1={0}
        x2={position}
        y2={height}
        stroke="#EF4444"
        strokeWidth={2}
        strokeDasharray="4,4"
        opacity={0.6}
      />
      
      {/* Top marker */}
      <polygon
        points={`${position},0 ${position - 6},10 ${position + 6},10`}
        fill="#EF4444"
        opacity={0.8}
      />
      
      {/* Label */}
      <g transform={`translate(${position + 8}, 8)`}>
        <rect
          x={0}
          y={0}
          width={50}
          height={20}
          fill="#EF4444"
          rx={4}
          opacity={0.9}
        />
        <text
          x={25}
          y={14}
          textAnchor="middle"
          fill="white"
          fontSize={11}
          fontWeight="600"
        >
          TODAY
        </text>
      </g>
    </g>
  );
}

