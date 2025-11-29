
/**
 * Default column configurations for Gantt Grid
 */

import React from 'react';
import type { ColumnConfig, Task } from '../types';
import { format } from 'date-fns';

export const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    field: 'wbs',
    header: 'WBS',
    width: 80,
    minWidth: 60,
    maxWidth: 120,
    // No custom renderer - EditableWBSCell handles rendering
    sortable: true,
    resizable: true
  },
  {
    field: 'name',
    header: 'Task Name',
    width: 250,
    minWidth: 150,
    sortable: true,
    resizable: true
  },
  {
    field: 'predecessors',
    header: 'Predecessors',
    width: 100,
    minWidth: 80,
    renderer: (value: any, task: Task) => {
      // Get predecessor task IDs from dependencies
      const predecessorIds = (task as any).predecessors || [];
      if (!predecessorIds || predecessorIds.length === 0) return '-';
      
      return React.createElement(
        'div',
        {
          className: 'text-xs text-gray-600',
          title: `Predecessors: ${predecessorIds.join(', ')}`
        },
        predecessorIds.join(', ')
      );
    },
    sortable: false,
    resizable: true
  },
  {
    field: 'successors',
    header: 'Successors',
    width: 100,
    minWidth: 80,
    renderer: (value: any, task: Task) => {
      // Get successor task IDs from dependencies
      const successorIds = (task as any).successors || [];
      if (!successorIds || successorIds.length === 0) return '-';
      
      return React.createElement(
        'div',
        {
          className: 'text-xs text-gray-600',
          title: `Successors: ${successorIds.join(', ')}`
        },
        successorIds.join(', ')
      );
    },
    sortable: false,
    resizable: true
  },
  {
    field: 'startDate',
    header: 'Start Date',
    width: 100,
    minWidth: 90,
    renderer: (value: Date) => (value ? format(new Date(value), 'MMM d, yyyy') : '-'),
    sortable: true,
    resizable: true
  },
  {
    field: 'endDate',
    header: 'End Date',
    width: 100,
    minWidth: 90,
    renderer: (value: Date) => (value ? format(new Date(value), 'MMM d, yyyy') : '-'),
    sortable: true,
    resizable: true
  },
  {
    field: 'duration',
    header: 'Duration',
    width: 80,
    minWidth: 70,
    renderer: (value: number) => (value ? `${value}d` : '-'),
    sortable: true,
    resizable: true
  },
  {
    field: 'progress',
    header: 'Progress',
    width: 80,
    minWidth: 70,
    renderer: (value: number) => `${value ?? 0}%`,
    sortable: true,
    resizable: true
  },
  {
    field: 'status',
    header: 'Status',
    width: 100,
    minWidth: 90,
    renderer: (value: string) => {
      const statusLabels: Record<string, string> = {
        not_started: 'Not Started',
        in_progress: 'In Progress',
        completed: 'Completed',
        on_hold: 'On Hold'
      };
      return statusLabels[value] ?? value;
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'resources',
    header: 'Resources',
    width: 180,
    minWidth: 120,
    maxWidth: 300,
    sortable: false,
    resizable: true
  }
];
