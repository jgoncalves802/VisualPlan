
/**
 * Default column configurations for Gantt Grid - Primavera P6 Style
 * Based on Oracle Primavera P6 best practices:
 * - Essential columns first (5-6 columns for clarity)
 * - Professional formatting with icons
 * - Total Float for critical path analysis
 */

import React from 'react';
import type { ColumnConfig, Task } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Status icon renderer with P6-style colors
const renderStatusIcon = (status: string) => {
  const statusConfig: Record<string, { color: string; bgColor: string; label: string; icon: string }> = {
    not_started: { 
      color: '#6B7280', 
      bgColor: '#F3F4F6', 
      label: 'Not Started',
      icon: '○'
    },
    in_progress: { 
      color: '#2563EB', 
      bgColor: '#DBEAFE', 
      label: 'In Progress',
      icon: '◐'
    },
    completed: { 
      color: '#059669', 
      bgColor: '#D1FAE5', 
      label: 'Completed',
      icon: '●'
    },
    on_hold: { 
      color: '#D97706', 
      bgColor: '#FEF3C7', 
      label: 'On Hold',
      icon: '◉'
    }
  };

  const config = statusConfig[status] || statusConfig.not_started;
  
  return React.createElement(
    'div',
    {
      className: 'flex items-center gap-1.5',
      title: config.label
    },
    React.createElement(
      'span',
      {
        className: 'inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold',
        style: { 
          color: config.color, 
          backgroundColor: config.bgColor,
        }
      },
      config.icon
    ),
    React.createElement(
      'span',
      { className: 'text-xs font-medium truncate', style: { color: config.color } },
      config.label
    )
  );
};

// Progress bar renderer P6-style
const renderProgress = (value: number, task: Task) => {
  const progress = value ?? 0;
  const isCritical = (task as any).isCritical === true;
  
  return React.createElement(
    'div',
    { className: 'flex items-center gap-2 w-full' },
    React.createElement(
      'div',
      { 
        className: 'flex-1 h-2.5 rounded-full overflow-hidden',
        style: { backgroundColor: '#E5E7EB' }
      },
      React.createElement(
        'div',
        {
          className: 'h-full rounded-full transition-all duration-300',
          style: { 
            width: `${progress}%`,
            backgroundColor: progress === 100 
              ? '#059669' 
              : isCritical 
                ? '#DC2626' 
                : '#3B82F6'
          }
        }
      )
    ),
    React.createElement(
      'span',
      { 
        className: 'text-xs font-semibold min-w-[36px] text-right',
        style: { 
          color: progress === 100 
            ? '#059669' 
            : progress > 0 
              ? '#3B82F6' 
              : '#9CA3AF'
        }
      },
      `${progress}%`
    )
  );
};

// Duration renderer with unit badge
const renderDuration = (value: number, task: Task) => {
  if (!value && value !== 0) return React.createElement('span', { className: 'text-gray-400' }, '-');
  
  const isMilestone = (task as any).isMilestone === true || value === 0;
  
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1' },
    isMilestone
      ? React.createElement(
          'span',
          { 
            className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
            style: { backgroundColor: '#FEF3C7', color: '#D97706' }
          },
          '◆ Milestone'
        )
      : React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'span',
            { className: 'font-semibold text-gray-800' },
            value
          ),
          React.createElement(
            'span',
            { 
              className: 'text-xs px-1.5 py-0.5 rounded font-medium',
              style: { backgroundColor: '#E5E7EB', color: '#4B5563' }
            },
            'd'
          )
        )
  );
};

// Total Float renderer with critical path indicator
const renderTotalFloat = (value: number, task: Task) => {
  const floatValue = value ?? 0;
  const isCritical = floatValue <= 0;
  
  return React.createElement(
    'div',
    { 
      className: 'flex items-center gap-1',
      title: isCritical ? 'Critical Path - No float available' : `${floatValue} days of float`
    },
    React.createElement(
      'span',
      { 
        className: 'font-semibold',
        style: { 
          color: isCritical ? '#DC2626' : floatValue <= 3 ? '#D97706' : '#059669'
        }
      },
      floatValue
    ),
    React.createElement(
      'span',
      { 
        className: 'text-xs px-1.5 py-0.5 rounded font-medium',
        style: { 
          backgroundColor: isCritical ? '#FEE2E2' : floatValue <= 3 ? '#FEF3C7' : '#D1FAE5',
          color: isCritical ? '#DC2626' : floatValue <= 3 ? '#D97706' : '#059669'
        }
      },
      isCritical ? 'CRIT' : 'd'
    )
  );
};

// Date renderer with professional formatting
const renderDate = (value: Date | string) => {
  if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
  
  const date = new Date(value);
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  return React.createElement(
    'span',
    { 
      className: 'text-sm font-medium',
      style: { 
        color: isWeekend ? '#9CA3AF' : '#374151'
      }
    },
    format(date, 'dd MMM yyyy', { locale: ptBR })
  );
};

// P6-style columns - Essential 6 columns for clarity
export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    field: 'wbs',
    header: 'WBS',
    width: 90,
    minWidth: 70,
    maxWidth: 140,
    sortable: true,
    resizable: true
  },
  {
    field: 'name',
    header: 'Activity Name',
    width: 280,
    minWidth: 180,
    sortable: true,
    resizable: true
  },
  {
    field: 'startDate',
    header: 'Start',
    width: 110,
    minWidth: 100,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'endDate',
    header: 'Finish',
    width: 110,
    minWidth: 100,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'duration',
    header: 'Dur.',
    width: 100,
    minWidth: 80,
    renderer: renderDuration,
    sortable: true,
    resizable: true
  },
  {
    field: 'totalFloat',
    header: 'TF',
    width: 75,
    minWidth: 65,
    renderer: renderTotalFloat,
    sortable: true,
    resizable: true
  },
  {
    field: 'progress',
    header: '% Complete',
    width: 130,
    minWidth: 100,
    renderer: renderProgress,
    sortable: true,
    resizable: true
  },
  {
    field: 'status',
    header: 'Status',
    width: 120,
    minWidth: 100,
    renderer: renderStatusIcon,
    sortable: true,
    resizable: true
  }
];

// Extended columns for detailed views
export const EXTENDED_COLUMNS: ColumnConfig[] = [
  ...DEFAULT_COLUMNS,
  {
    field: 'predecessors',
    header: 'Pred.',
    width: 90,
    minWidth: 70,
    renderer: (value: any, task: Task) => {
      const predecessorIds = (task as any).predecessors || [];
      if (!predecessorIds || predecessorIds.length === 0) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { 
          className: 'text-xs font-medium text-blue-600',
          title: `Predecessors: ${predecessorIds.join(', ')}`
        },
        predecessorIds.length > 2 
          ? `${predecessorIds.slice(0, 2).join(', ')}...` 
          : predecessorIds.join(', ')
      );
    },
    sortable: false,
    resizable: true
  },
  {
    field: 'successors',
    header: 'Succ.',
    width: 90,
    minWidth: 70,
    renderer: (value: any, task: Task) => {
      const successorIds = (task as any).successors || [];
      if (!successorIds || successorIds.length === 0) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { 
          className: 'text-xs font-medium text-purple-600',
          title: `Successors: ${successorIds.join(', ')}`
        },
        successorIds.length > 2 
          ? `${successorIds.slice(0, 2).join(', ')}...` 
          : successorIds.join(', ')
      );
    },
    sortable: false,
    resizable: true
  },
  {
    field: 'resources',
    header: 'Resources',
    width: 150,
    minWidth: 100,
    maxWidth: 250,
    sortable: false,
    resizable: true
  }
];

// Compact columns for print-friendly views (5 columns as P6 recommends)
export const COMPACT_COLUMNS: ColumnConfig[] = [
  {
    field: 'wbs',
    header: 'WBS',
    width: 80,
    minWidth: 60,
    sortable: true,
    resizable: true
  },
  {
    field: 'name',
    header: 'Activity Name',
    width: 300,
    minWidth: 200,
    sortable: true,
    resizable: true
  },
  {
    field: 'startDate',
    header: 'Start',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'endDate',
    header: 'Finish',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'totalFloat',
    header: 'TF',
    width: 70,
    minWidth: 60,
    renderer: renderTotalFloat,
    sortable: true,
    resizable: true
  }
];
