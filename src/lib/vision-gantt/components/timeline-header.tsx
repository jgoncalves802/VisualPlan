/**
 * TimelineHeader - Primavera P6 Professional Style
 * Multi-level time scale with weekend/holiday highlighting
 */

import type { ViewPreset, TimelineRange } from '../types';
import { generateTimeScale } from '../utils';
import { getViewPreset } from '../config/view-presets';
import { format, isWeekend, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineHeaderProps {
  timelineRange: TimelineRange;
  viewPreset: ViewPreset;
  rowHeight: number;
  width: number;
  holidays?: Date[];
}

export function TimelineHeader({
  timelineRange,
  viewPreset,
  rowHeight,
  width,
  holidays = []
}: TimelineHeaderProps) {
  const presetConfig = getViewPreset(viewPreset);
  const { headerLevels, columnWidth } = presetConfig;
  const baseColumnWidth = columnWidth ?? 60;

  const scales = headerLevels.map((layer, index) => {
    const isBottomLayer = index === headerLevels.length - 1;
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

  const totalHeight = headerLevels.reduce((sum, layer) => sum + (layer.height ?? 32), 0);

  const isHoliday = (date: Date) => {
    return holidays.some(h => isSameDay(h, date));
  };

  return (
    <div 
      className="timeline-header sticky top-0 z-20"
      style={{
        height: totalHeight,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      {scales.map((scale, levelIndex) => {
        const { layer, ticks } = scale;
        const layerHeight = layer.height ?? 32;
        const isBottomLevel = levelIndex === headerLevels.length - 1;
        const isTopLevel = levelIndex === 0;
        const bottomLevelTicks = scales[scales.length - 1].ticks;

        // P6-style gradient backgrounds
        const getLayerBackground = () => {
          if (isTopLevel) {
            return 'linear-gradient(180deg, #1E40AF 0%, #1E3A8A 100%)';
          }
          if (isBottomLevel) {
            return 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)';
          }
          return 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)';
        };

        return (
          <div
            key={`level-${levelIndex}`}
            className="flex"
            style={{ 
              height: layerHeight,
              background: getLayerBackground(),
              borderBottom: isBottomLevel 
                ? '2px solid #1E3A8A' 
                : '1px solid rgba(255,255,255,0.2)',
              boxShadow: isBottomLevel ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {ticks.map((tick, tickIndex) => {
              let columnTickWidth: number;
              
              if (isBottomLevel) {
                columnTickWidth = baseColumnWidth;
              } else {
                const nextTick = ticks[tickIndex + 1];
                
                if (nextTick) {
                  const cellsBetween = bottomLevelTicks.filter(
                    (bt) => bt.date >= tick.date && bt.date < nextTick.date
                  ).length;
                  columnTickWidth = cellsBetween * baseColumnWidth;
                } else {
                  const cellsBetween = bottomLevelTicks.filter(
                    (bt) => bt.date >= tick.date
                  ).length;
                  columnTickWidth = cellsBetween * baseColumnWidth;
                }
              }

              const today = new Date();
              const isToday = isBottomLevel && tick?.date && 
                tick.date.getDate() === today.getDate() &&
                tick.date.getMonth() === today.getMonth() &&
                tick.date.getFullYear() === today.getFullYear();

              const isWeekendDay = isBottomLevel && tick?.date && isWeekend(tick.date);
              const isHolidayDay = isBottomLevel && tick?.date && isHoliday(tick.date);

              // P6-style cell backgrounds
              const getCellBackground = () => {
                if (isToday) return '#FEF3C7'; // Yellow for today
                if (isHolidayDay) return '#FEE2E2'; // Light red for holidays
                if (isWeekendDay) return '#F3F4F6'; // Light gray for weekends
                return 'transparent';
              };

              const getTextColor = () => {
                if (isTopLevel || (!isBottomLevel)) return '#FFFFFF';
                if (isToday) return '#D97706';
                if (isHolidayDay) return '#DC2626';
                if (isWeekendDay) return '#9CA3AF';
                return '#374151';
              };

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
                    borderRight: `1px solid ${isBottomLevel ? '#E5E7EB' : 'rgba(255,255,255,0.15)'}`,
                    backgroundColor: getCellBackground(),
                    justifyContent,
                    overflow: 'visible',
                  }}
                >
                  {/* Today indicator line */}
                  {isToday && (
                    <div
                      className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                      style={{
                        width: '0',
                        height: '0',
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderBottom: '6px solid #D97706'
                      }}
                    />
                  )}
                  
                  <span 
                    className={!isBottomLevel ? "font-semibold" : "font-medium"}
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: !isBottomLevel ? 'visible' : 'hidden',
                      textOverflow: !isBottomLevel ? 'clip' : 'ellipsis',
                      position: !isBottomLevel ? 'sticky' : 'relative',
                      left: !isBottomLevel ? '8px' : 'auto',
                      zIndex: !isBottomLevel ? 5 : 'auto',
                      color: getTextColor(),
                      fontSize: isTopLevel ? '13px' : isBottomLevel ? '11px' : '12px',
                      letterSpacing: isTopLevel ? '0.05em' : 'normal',
                      textTransform: isTopLevel ? 'uppercase' : 'none'
                    }}
                    title={format(tick?.date ?? new Date(), 'PPP', { locale: ptBR })}
                  >
                    {format(tick?.date ?? new Date(), layer.format, { locale: ptBR })}
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
