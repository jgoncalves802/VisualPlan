/**
 * SkeletonLoader - Loading skeleton for Gantt Chart
 * Inspired by Google Sheets, ClickUp, and Excel Online loading states
 */

import { useGanttTheme } from '../context/theme-context';

interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
  rowHeight?: number;
  showHeader?: boolean;
}

export function SkeletonLoader({ 
  rows = 8, 
  columns = 5,
  rowHeight = 36,
  showHeader = true
}: SkeletonLoaderProps) {
  const { theme } = useGanttTheme();
  const colors = theme.colors;
  
  const columnWidths = [40, 200, 100, 100, 80];
  
  return (
    <div className="w-full animate-pulse">
      {showHeader && (
        <div 
          className="flex border-b"
          style={{ 
            backgroundColor: colors.header.background,
            borderColor: colors.grid.border,
            height: rowHeight
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex}
              className="flex items-center px-2"
              style={{ 
                width: columnWidths[colIndex] || 100,
                borderRight: `1px solid ${colors.grid.border}`
              }}
            >
              <div 
                className="h-3 rounded"
                style={{ 
                  width: '80%',
                  backgroundColor: colors.grid.border
                }}
              />
            </div>
          ))}
          <div className="flex-1" />
        </div>
      )}
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex}
          className="flex border-b"
          style={{ 
            backgroundColor: rowIndex % 2 === 0 ? colors.grid.rowEven : colors.grid.rowOdd,
            borderColor: colors.grid.border,
            height: rowHeight
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex}
              className="flex items-center px-2"
              style={{ 
                width: columnWidths[colIndex] || 100,
                borderRight: `1px solid ${colors.grid.border}`
              }}
            >
              <div 
                className="h-3 rounded skeleton-shimmer"
                style={{ 
                  width: colIndex === 0 ? '50%' : colIndex === 1 ? '70%' : '60%',
                  backgroundColor: colors.grid.border,
                  opacity: 0.5
                }}
              />
            </div>
          ))}
          
          <div 
            className="flex-1 flex items-center px-4"
            style={{ minWidth: 400 }}
          >
            <div 
              className="h-5 rounded skeleton-shimmer"
              style={{ 
                width: `${30 + (rowIndex % 5) * 15}%`,
                backgroundColor: colors.grid.border,
                opacity: 0.3,
                marginLeft: (rowIndex % 3) * 20
              }}
            />
          </div>
        </div>
      ))}
      
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
        .skeleton-shimmer {
          animation: shimmer 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export function RowSkeleton({ rowHeight = 36, columnCount = 5 }: { rowHeight?: number; columnCount?: number }) {
  const { theme } = useGanttTheme();
  const colors = theme.colors;
  const columnWidths = [40, 200, 100, 100, 80];
  
  return (
    <div 
      className="flex border-b animate-pulse"
      style={{ 
        backgroundColor: colors.grid.rowEven,
        borderColor: colors.grid.border,
        height: rowHeight
      }}
    >
      {Array.from({ length: columnCount }).map((_, colIndex) => (
        <div 
          key={colIndex}
          className="flex items-center px-2"
          style={{ 
            width: columnWidths[colIndex] || 100,
            borderRight: `1px solid ${colors.grid.border}`
          }}
        >
          <div 
            className="h-3 rounded skeleton-shimmer"
            style={{ 
              width: '60%',
              backgroundColor: colors.grid.border,
              opacity: 0.5
            }}
          />
        </div>
      ))}
    </div>
  );
}
