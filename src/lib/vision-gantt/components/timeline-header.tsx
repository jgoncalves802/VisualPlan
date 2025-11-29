
/**
 * TimelineHeader - Displays time scale at the top of timeline
 * Enhanced with configurable layers, separators, and column width control
 */



import React from 'react';
import type { ViewPreset, TimelineRange, TimeScaleLayer } from '../types';
import { generateTimeScale } from '../utils';
import { getViewPreset } from '../config/view-presets';
import { format } from 'date-fns';

interface TimelineHeaderProps {
  timelineRange: TimelineRange;
  viewPreset: ViewPreset;
  rowHeight: number;
  width: number;
}

// No longer needed - removed calculateLayerColumnWidth function

export function TimelineHeader({
  timelineRange,
  viewPreset,
  rowHeight,
  width
}: TimelineHeaderProps) {
  const presetConfig = getViewPreset(viewPreset);
  const { headerLevels, columnWidth } = presetConfig;

  // Use columnWidth as the base width for the bottom-most layer
  const baseColumnWidth = columnWidth ?? 60;

  // Generate scales for each header level
  // The bottom layer uses baseColumnWidth, upper layers span multiple base units
  const scales = headerLevels.map((layer, index) => {
    const isBottomLayer = index === headerLevels.length - 1;
    
    // For the bottom layer, use the preset's columnWidth directly
    // For upper layers, we'll calculate width based on date spans later
    const layerTickWidth = isBottomLayer ? baseColumnWidth : baseColumnWidth;
    
    return {
      layer,
      ticks: generateTimeScale(
        timelineRange.startDate,
        timelineRange.endDate,
        layer.unit,
        layerTickWidth
      )
    };
  });

  // Calculate total header height
  const totalHeight = headerLevels.reduce((sum, layer) => sum + (layer.height ?? 32), 0);

  return (
    <div 
      className="timeline-header sticky top-0 z-20"
      style={{
        backgroundColor: 'var(--gantt-timeline-header-background)',
        borderBottom: '2px solid var(--gantt-grid-border)',
        height: totalHeight
      }}
    >
      {scales.map((scale, levelIndex) => {
        const { layer, ticks } = scale;
        const layerHeight = layer.height ?? 32;
        const isBottomLevel = levelIndex === headerLevels.length - 1;
        
        // Get bottom level ticks to calculate upper level widths
        const bottomLevelTicks = scales[scales.length - 1].ticks;

        return (
          <div
            key={`level-${levelIndex}`}
            className="flex"
            style={{ 
              height: layerHeight,
              borderBottom: !isBottomLevel ? '1px solid var(--gantt-border-light)' : 'none',
              fontSize: levelIndex === 0 ? 'var(--gantt-font-size-sm)' : 'var(--gantt-font-size-xs)',
              fontWeight: levelIndex === 0 ? 'var(--gantt-font-weight-medium)' : 'var(--gantt-font-weight-normal)',
              color: levelIndex === 0 ? 'var(--gantt-text-base)' : 'var(--gantt-text-light)'
            }}
          >
            {ticks.map((tick, tickIndex) => {
              // Calculate column width for this tick
              let columnTickWidth: number;
              
              if (isBottomLevel) {
                // Bottom level: use the preset's columnWidth directly
                columnTickWidth = baseColumnWidth;
              } else {
                // Upper levels: calculate width by counting how many bottom-level cells this spans
                const nextTick = ticks[tickIndex + 1];
                
                if (nextTick) {
                  // Count bottom level cells between this tick and next tick
                  const cellsBetween = bottomLevelTicks.filter(
                    (bt) => bt.date >= tick.date && bt.date < nextTick.date
                  ).length;
                  columnTickWidth = cellsBetween * baseColumnWidth;
                } else {
                  // Last cell: count remaining bottom level cells
                  const cellsBetween = bottomLevelTicks.filter(
                    (bt) => bt.date >= tick.date
                  ).length;
                  columnTickWidth = cellsBetween * baseColumnWidth;
                }
              }

              // Check if this is today (for bottom level only)
              const today = new Date();
              const isToday = isBottomLevel && tick?.date && 
                tick.date.getDate() === today.getDate() &&
                tick.date.getMonth() === today.getMonth() &&
                tick.date.getFullYear() === today.getFullYear();

              // Determine text alignment
              // Upper layers use left alignment for better visibility during horizontal scroll
              const justifyContent = !isBottomLevel ? 'flex-start' :
                layer.align === 'left' ? 'flex-start' : 
                layer.align === 'right' ? 'flex-end' : 
                'center';

              return (
                <div
                  key={tick?.date?.getTime() ?? tickIndex}
                  className="flex items-center px-1 relative"
                  style={{ 
                    width: columnTickWidth, 
                    minWidth: columnTickWidth,
                    borderRight: layer.showSeparators !== false ? '1px solid var(--gantt-border-light)' : 'none',
                    backgroundColor: isToday ? 'var(--gantt-timeline-today)' : 'transparent',
                    fontWeight: isToday ? 'var(--gantt-font-weight-semibold)' : 'inherit',
                    color: isToday ? 'var(--gantt-text-base)' : 'inherit',
                    justifyContent,
                    overflow: 'visible',
                  }}
                >
                  <span 
                    className={!isBottomLevel ? "font-medium" : "truncate"}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: !isBottomLevel ? 'visible' : 'hidden',
                      textOverflow: !isBottomLevel ? 'clip' : 'ellipsis',
                      position: !isBottomLevel ? 'sticky' : 'relative',
                      left: !isBottomLevel ? '8px' : 'auto',
                      zIndex: !isBottomLevel ? 5 : 'auto'
                    }}
                    title={format(tick?.date ?? new Date(), layer.format)}
                  >
                    {format(tick?.date ?? new Date(), layer.format)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
