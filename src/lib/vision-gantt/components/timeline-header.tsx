/**
 * TimelineHeader - Primavera P6 Professional Style with Theme Support
 */

import type { ViewPreset, TimelineRange } from '../types';
import { generateTimeScale } from '../utils';
import { getViewPreset } from '../config/view-presets';
import { format, isWeekend, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useGanttTheme } from '../context/theme-context';

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
  const { theme } = useGanttTheme();
  const headerColors = theme.colors.header;
  const timelineColors = theme.colors.timeline;
  
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

  const totalHeight = headerLevels.reduce((sum, layer) => sum + (layer.height ?? 28), 0);

  const isHoliday = (date: Date) => holidays.some(h => isSameDay(h, date));

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  return (
    <div 
      className="timeline-header sticky top-0 z-20"
      style={{
        height: totalHeight,
        fontFamily: theme.typography.fontFamily,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {scales.map((scale, levelIndex) => {
        const { layer, ticks } = scale;
        const layerHeight = layer.height ?? 28;
        const isBottomLevel = levelIndex === headerLevels.length - 1;
        const isTopLevel = levelIndex === 0;
        const bottomLevelTicks = scales[scales.length - 1].ticks;

        const getBackground = () => {
          if (isBottomLevel) return timelineColors.background;
          if (isTopLevel) return `linear-gradient(180deg, ${headerColors.background} 0%, ${headerColors.border} 100%)`;
          return `linear-gradient(180deg, ${headerColors.background}CC 0%, ${headerColors.border}CC 100%)`;
        };

        return (
          <div
            key={`level-${levelIndex}`}
            className="flex"
            style={{ 
              height: layerHeight,
              background: getBackground(),
              borderBottom: `1px solid ${isBottomLevel ? timelineColors.gridLine : 'rgba(0,0,0,0.1)'}`
            }}
          >
            {ticks.map((tick, tickIndex) => {
              let cellWidth: number;
              
              if (isBottomLevel) {
                cellWidth = baseColumnWidth;
              } else {
                const nextTick = ticks[tickIndex + 1];
                const cellsBetween = nextTick
                  ? bottomLevelTicks.filter(bt => bt.date >= tick.date && bt.date < nextTick.date).length
                  : bottomLevelTicks.filter(bt => bt.date >= tick.date).length;
                cellWidth = cellsBetween * baseColumnWidth;
              }

              const isTodayCell = isBottomLevel && tick?.date && isToday(tick.date);
              const isWeekendCell = isBottomLevel && tick?.date && isWeekend(tick.date);
              const isHolidayCell = isBottomLevel && tick?.date && isHoliday(tick.date);

              let cellBg = 'transparent';
              let textColor = isBottomLevel 
                ? (timelineColors.background === '#FFFFFF' ? '#374151' : '#E5E7EB')
                : headerColors.text;

              if (isBottomLevel) {
                if (isTodayCell) {
                  cellBg = timelineColors.today;
                  textColor = timelineColors.todayLine;
                } else if (isHolidayCell) {
                  cellBg = timelineColors.holiday;
                  textColor = theme.colors.criticalActivity.fill;
                } else if (isWeekendCell) {
                  cellBg = timelineColors.weekend;
                  textColor = timelineColors.background === '#FFFFFF' ? '#9CA3AF' : '#6B7280';
                }
              }

              const alignment = !isBottomLevel ? 'flex-start' :
                layer.align === 'left' ? 'flex-start' : 
                layer.align === 'right' ? 'flex-end' : 
                'center';

              return (
                <div
                  key={tick?.date?.getTime() ?? tickIndex}
                  className="flex items-center relative"
                  style={{ 
                    width: cellWidth, 
                    minWidth: cellWidth,
                    borderRight: `1px solid ${isBottomLevel ? timelineColors.gridLine : 'rgba(255,255,255,0.1)'}`,
                    backgroundColor: cellBg,
                    justifyContent: alignment,
                    paddingLeft: !isBottomLevel ? '8px' : '2px',
                    paddingRight: '2px'
                  }}
                >
                  {isTodayCell && (
                    <div
                      className="absolute bottom-0 left-1/2"
                      style={{
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '4px solid transparent',
                        borderRight: '4px solid transparent',
                        borderBottom: `4px solid ${timelineColors.todayLine}`
                      }}
                    />
                  )}
                  
                  <span 
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: !isBottomLevel ? 'visible' : 'hidden',
                      textOverflow: 'ellipsis',
                      position: !isBottomLevel ? 'sticky' : 'relative',
                      left: !isBottomLevel ? '0' : 'auto',
                      color: textColor,
                      fontSize: isTopLevel 
                        ? theme.typography.headerLabel.fontSize 
                        : theme.typography.taskLabel.fontSize,
                      fontWeight: isBottomLevel 
                        ? theme.typography.taskLabel.fontWeight 
                        : theme.typography.headerLabel.fontWeight,
                      letterSpacing: isTopLevel ? '0.02em' : 'normal',
                      textTransform: isTopLevel ? 'uppercase' : 'none'
                    }}
                    title={tick?.date ? format(tick.date, 'PPP', { locale: ptBR }) : ''}
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
