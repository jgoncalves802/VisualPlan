/**
 * Primavera P6 Column Configurations
 * Enterprise-grade columns based on Oracle Primavera P6 EPPM
 * 
 * Sections:
 * 1. Baseline Columns
 * 2. EVM (Earned Value Management) Columns
 * 3. Activity Codes Columns
 * 4. Resource Columns
 * 5. Critical Path Columns
 * 6. Schedule Analysis Columns
 */

import React from 'react';
import type { ColumnConfig, Task } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ============================================================================
// UTILITY RENDERERS
// ============================================================================

const formatCurrency = (value: number | undefined): string => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const renderDate = (value: Date | string | undefined) => {
  if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
  
  const date = new Date(value);
  return React.createElement(
    'span',
    { className: 'text-sm font-medium text-gray-700' },
    format(date, 'dd MMM yyyy', { locale: ptBR })
  );
};

// ============================================================================
// VARIANCE RENDERERS
// ============================================================================

const renderVariance = (value: number | undefined, unit: string = 'd') => {
  if (value === undefined || value === null) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1' },
    React.createElement(
      'span',
      {
        className: 'font-semibold',
        style: {
          color: isNegative ? '#059669' : isPositive ? '#DC2626' : '#6B7280'
        }
      },
      `${isPositive ? '+' : ''}${value}`
    ),
    React.createElement(
      'span',
      {
        className: 'text-xs px-1.5 py-0.5 rounded font-medium',
        style: {
          backgroundColor: isNegative ? '#D1FAE5' : isPositive ? '#FEE2E2' : '#F3F4F6',
          color: isNegative ? '#059669' : isPositive ? '#DC2626' : '#6B7280'
        }
      },
      unit
    )
  );
};

const renderCostVariance = (value: number | undefined) => {
  if (value === undefined || value === null) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const isPositive = value > 0;
  const isNegative = value < 0;
  
  return React.createElement(
    'span',
    {
      className: 'font-semibold text-sm',
      style: {
        color: isNegative ? '#DC2626' : isPositive ? '#059669' : '#6B7280'
      }
    },
    formatCurrency(value)
  );
};

// ============================================================================
// EVM RENDERERS
// ============================================================================

const renderEVMIndex = (value: number | undefined, thresholds = { good: 1.0, warning: 0.9 }) => {
  if (value === undefined || value === null) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const isGood = value >= thresholds.good;
  const isWarning = value >= thresholds.warning && value < thresholds.good;
  
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1' },
    React.createElement(
      'span',
      {
        className: 'font-bold',
        style: {
          color: isGood ? '#059669' : isWarning ? '#D97706' : '#DC2626'
        }
      },
      value.toFixed(2)
    ),
    React.createElement(
      'span',
      {
        className: 'text-xs w-2 h-2 rounded-full',
        style: {
          backgroundColor: isGood ? '#059669' : isWarning ? '#D97706' : '#DC2626'
        }
      }
    )
  );
};

const renderEVMValue = (value: number | undefined) => {
  if (value === undefined || value === null) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  return React.createElement(
    'span',
    { className: 'font-medium text-sm text-gray-800' },
    formatCurrency(value)
  );
};

// ============================================================================
// ACTIVITY CODE RENDERERS
// ============================================================================

const renderActivityCode = (value: string | undefined, colorMap?: Record<string, string>) => {
  if (!value) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const defaultColors: Record<string, string> = {
    'Civil': '#3B82F6',
    'Mecanica': '#10B981',
    'Eletrica': '#F59E0B',
    'Instrumentacao': '#8B5CF6',
    'Tubulacao': '#EC4899',
    'Pintura': '#6366F1',
    'Isolamento': '#14B8A6',
    ...colorMap
  };
  
  const color = defaultColors[value] || '#6B7280';
  
  return React.createElement(
    'span',
    {
      className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
      style: {
        backgroundColor: `${color}20`,
        color: color
      }
    },
    value
  );
};

const renderPhase = (value: string | undefined) => {
  if (!value) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const phaseColors: Record<string, { bg: string; text: string }> = {
    'Planejamento': { bg: '#DBEAFE', text: '#1D4ED8' },
    'Engenharia': { bg: '#E0E7FF', text: '#4338CA' },
    'Suprimentos': { bg: '#FEF3C7', text: '#D97706' },
    'Construcao': { bg: '#D1FAE5', text: '#059669' },
    'Comissionamento': { bg: '#FCE7F3', text: '#DB2777' },
    'Entrega': { bg: '#ECFDF5', text: '#047857' }
  };
  
  const colors = phaseColors[value] || { bg: '#F3F4F6', text: '#4B5563' };
  
  return React.createElement(
    'span',
    {
      className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold',
      style: { backgroundColor: colors.bg, color: colors.text }
    },
    value
  );
};

// ============================================================================
// RESOURCE RENDERERS
// ============================================================================

const renderResourceType = (value: string | undefined) => {
  if (!value) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    'labor': { icon: '👷', color: '#2563EB', bg: '#DBEAFE' },
    'nonlabor': { icon: '🔧', color: '#7C3AED', bg: '#EDE9FE' },
    'material': { icon: '📦', color: '#059669', bg: '#D1FAE5' }
  };
  
  const config = typeConfig[value] || { icon: '?', color: '#6B7280', bg: '#F3F4F6' };
  
  return React.createElement(
    'span',
    {
      className: 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold',
      style: { backgroundColor: config.bg, color: config.color }
    },
    React.createElement('span', null, config.icon),
    React.createElement('span', null, value.charAt(0).toUpperCase() + value.slice(1))
  );
};

const renderResourceUnits = (value: number | undefined) => {
  if (value === undefined || value === null) {
    return React.createElement('span', { className: 'text-gray-400' }, '-');
  }
  
  const isOverallocated = value > 100;
  
  return React.createElement(
    'div',
    { className: 'flex items-center gap-1' },
    React.createElement(
      'span',
      {
        className: 'font-semibold',
        style: { color: isOverallocated ? '#DC2626' : '#374151' }
      },
      `${value}%`
    ),
    isOverallocated && React.createElement(
      'span',
      {
        className: 'text-xs',
        title: 'Over-allocated'
      },
      '⚠️'
    )
  );
};

// ============================================================================
// BASELINE COLUMNS
// ============================================================================

export const BASELINE_COLUMNS: ColumnConfig[] = [
  {
    field: 'blStartDate',
    header: 'BL Start',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'blFinishDate',
    header: 'BL Finish',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'blDuration',
    header: 'BL Dur',
    width: 70,
    minWidth: 60,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-gray-700' },
        `${value}d`
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'startVariance',
    header: 'Start Var',
    width: 85,
    minWidth: 75,
    renderer: (value: number) => renderVariance(value, 'd'),
    sortable: true,
    resizable: true
  },
  {
    field: 'finishVariance',
    header: 'Finish Var',
    width: 85,
    minWidth: 75,
    renderer: (value: number) => renderVariance(value, 'd'),
    sortable: true,
    resizable: true
  },
  {
    field: 'durationVariance',
    header: 'Dur Var',
    width: 80,
    minWidth: 70,
    renderer: (value: number) => renderVariance(value, 'd'),
    sortable: true,
    resizable: true
  },
  {
    field: 'blCost',
    header: 'BL Cost',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'costVariance',
    header: 'Cost Var',
    width: 100,
    minWidth: 85,
    renderer: renderCostVariance,
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// EVM COLUMNS
// ============================================================================

export const EVM_COLUMNS: ColumnConfig[] = [
  {
    field: 'bcws',
    header: 'PV (BCWS)',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'bcwp',
    header: 'EV (BCWP)',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'acwp',
    header: 'AC (ACWP)',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'bac',
    header: 'BAC',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'eac',
    header: 'EAC',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'etc',
    header: 'ETC',
    width: 100,
    minWidth: 85,
    renderer: renderEVMValue,
    sortable: true,
    resizable: true
  },
  {
    field: 'vac',
    header: 'VAC',
    width: 100,
    minWidth: 85,
    renderer: renderCostVariance,
    sortable: true,
    resizable: true
  },
  {
    field: 'cpi',
    header: 'CPI',
    width: 70,
    minWidth: 60,
    renderer: (value: number) => renderEVMIndex(value),
    sortable: true,
    resizable: true
  },
  {
    field: 'spi',
    header: 'SPI',
    width: 70,
    minWidth: 60,
    renderer: (value: number) => renderEVMIndex(value),
    sortable: true,
    resizable: true
  },
  {
    field: 'tcpi',
    header: 'TCPI',
    width: 70,
    minWidth: 60,
    renderer: (value: number) => renderEVMIndex(value, { good: 1.0, warning: 1.1 }),
    sortable: true,
    resizable: true
  },
  {
    field: 'csi',
    header: 'CSI',
    width: 70,
    minWidth: 60,
    renderer: (value: number) => renderEVMIndex(value),
    sortable: true,
    resizable: true
  },
  {
    field: 'performancePctComplete',
    header: 'Perf %',
    width: 80,
    minWidth: 70,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-semibold text-sm text-blue-600' },
        `${value.toFixed(1)}%`
      );
    },
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// ACTIVITY CODE COLUMNS
// ============================================================================

export const ACTIVITY_CODE_COLUMNS: ColumnConfig[] = [
  {
    field: 'activityCode',
    header: 'Activity Code',
    width: 110,
    minWidth: 90,
    renderer: (value: string) => renderActivityCode(value),
    sortable: true,
    resizable: true
  },
  {
    field: 'discipline',
    header: 'Discipline',
    width: 110,
    minWidth: 90,
    renderer: (value: string) => renderActivityCode(value),
    sortable: true,
    resizable: true
  },
  {
    field: 'area',
    header: 'Area',
    width: 100,
    minWidth: 80,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { className: 'text-sm font-medium text-gray-700' },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'phase',
    header: 'Phase',
    width: 120,
    minWidth: 100,
    renderer: renderPhase,
    sortable: true,
    resizable: true
  },
  {
    field: 'responsibleContractor',
    header: 'Contractor',
    width: 120,
    minWidth: 100,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { className: 'text-sm font-medium text-gray-700 truncate', title: value },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'workType',
    header: 'Work Type',
    width: 110,
    minWidth: 90,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { 
          className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          style: { backgroundColor: '#F3F4F6', color: '#374151' }
        },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'cwpCode',
    header: 'CWP',
    width: 90,
    minWidth: 75,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { className: 'text-sm font-mono text-blue-600' },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'iwpCode',
    header: 'IWP',
    width: 90,
    minWidth: 75,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { className: 'text-sm font-mono text-purple-600' },
        value
      );
    },
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// RESOURCE COLUMNS
// ============================================================================

export const RESOURCE_COLUMNS: ColumnConfig[] = [
  {
    field: 'resourceName',
    header: 'Resource',
    width: 130,
    minWidth: 100,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { className: 'text-sm font-medium text-gray-800 truncate', title: value },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'resourceRole',
    header: 'Role',
    width: 120,
    minWidth: 90,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      return React.createElement(
        'span',
        { 
          className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
          style: { backgroundColor: '#E0E7FF', color: '#4338CA' }
        },
        value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'resourceType',
    header: 'Type',
    width: 100,
    minWidth: 85,
    renderer: renderResourceType,
    sortable: true,
    resizable: true
  },
  {
    field: 'resourceUnits',
    header: 'Units',
    width: 70,
    minWidth: 60,
    renderer: renderResourceUnits,
    sortable: true,
    resizable: true
  },
  {
    field: 'plannedWork',
    header: 'Plan Work',
    width: 90,
    minWidth: 75,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-sm text-gray-700' },
        `${value}h`
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'actualWork',
    header: 'Act Work',
    width: 90,
    minWidth: 75,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-sm text-blue-600' },
        `${value}h`
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'remainingWork',
    header: 'Rem Work',
    width: 90,
    minWidth: 75,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-sm text-orange-600' },
        `${value}h`
      );
    },
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// CRITICAL PATH COLUMNS
// ============================================================================

export const CRITICAL_PATH_COLUMNS: ColumnConfig[] = [
  {
    field: 'totalFloat',
    header: 'Total Float',
    width: 90,
    minWidth: 75,
    renderer: (value: number, _task: Task) => {
      const floatValue = value ?? 0;
      const isCritical = floatValue <= 0;
      const isNearCritical = floatValue > 0 && floatValue <= 5;
      
      return React.createElement(
        'div',
        { 
          className: 'flex items-center gap-1',
          title: isCritical ? 'Critical Path' : isNearCritical ? 'Near Critical' : `${floatValue} days of float`
        },
        React.createElement(
          'span',
          { 
            className: 'font-semibold',
            style: { 
              color: isCritical ? '#DC2626' : isNearCritical ? '#D97706' : '#059669'
            }
          },
          floatValue
        ),
        React.createElement(
          'span',
          { 
            className: 'text-xs px-1.5 py-0.5 rounded font-medium',
            style: { 
              backgroundColor: isCritical ? '#FEE2E2' : isNearCritical ? '#FEF3C7' : '#D1FAE5',
              color: isCritical ? '#DC2626' : isNearCritical ? '#D97706' : '#059669'
            }
          },
          isCritical ? 'CRIT' : 'd'
        )
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'freeFloat',
    header: 'Free Float',
    width: 85,
    minWidth: 70,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-sm text-gray-700' },
        `${value}d`
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'earlyStart',
    header: 'Early Start',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'earlyFinish',
    header: 'Early Finish',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'lateStart',
    header: 'Late Start',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'lateFinish',
    header: 'Late Finish',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// SCHEDULE ANALYSIS COLUMNS
// ============================================================================

export const SCHEDULE_COLUMNS: ColumnConfig[] = [
  {
    field: 'actualStart',
    header: 'Actual Start',
    width: 105,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'actualFinish',
    header: 'Actual Finish',
    width: 105,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'remainingDuration',
    header: 'Rem Dur',
    width: 80,
    minWidth: 70,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { className: 'font-medium text-sm text-orange-600' },
        `${value}d`
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'constraintType',
    header: 'Constraint',
    width: 90,
    minWidth: 80,
    renderer: (value: string) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      
      const constraintLabels: Record<string, string> = {
        'asap': 'ASAP',
        'alap': 'ALAP',
        'mso': 'MSO',
        'mfo': 'MFO',
        'snet': 'SNET',
        'snlt': 'SNLT',
        'fnet': 'FNET',
        'fnlt': 'FNLT'
      };
      
      return React.createElement(
        'span',
        { 
          className: 'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold',
          style: { backgroundColor: '#FEF3C7', color: '#D97706' }
        },
        constraintLabels[value] || value
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'constraintDate',
    header: 'Const Date',
    width: 100,
    minWidth: 90,
    renderer: renderDate,
    sortable: true,
    resizable: true
  },
  {
    field: 'deadline',
    header: 'Deadline',
    width: 100,
    minWidth: 90,
    renderer: (value: Date | string | undefined, task: Task) => {
      if (!value) return React.createElement('span', { className: 'text-gray-400' }, '-');
      
      const deadline = new Date(value);
      const endDate = task.endDate;
      const isPastDeadline = endDate && endDate > deadline;
      
      return React.createElement(
        'span',
        { 
          className: 'text-sm font-medium',
          style: { color: isPastDeadline ? '#DC2626' : '#374151' }
        },
        format(deadline, 'dd MMM yyyy', { locale: ptBR }),
        isPastDeadline && React.createElement('span', { className: 'ml-1' }, '⚠️')
      );
    },
    sortable: true,
    resizable: true
  },
  {
    field: 'wbsLevel',
    header: 'WBS Level',
    width: 80,
    minWidth: 65,
    renderer: (value: number) => {
      if (value === undefined || value === null) {
        return React.createElement('span', { className: 'text-gray-400' }, '-');
      }
      return React.createElement(
        'span',
        { 
          className: 'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
          style: { backgroundColor: '#E5E7EB', color: '#374151' }
        },
        value
      );
    },
    sortable: true,
    resizable: true
  }
];

// ============================================================================
// COLUMN PRESETS
// ============================================================================

export const P6_COLUMN_PRESETS = {
  baseline: BASELINE_COLUMNS,
  evm: EVM_COLUMNS,
  activityCodes: ACTIVITY_CODE_COLUMNS,
  resources: RESOURCE_COLUMNS,
  criticalPath: CRITICAL_PATH_COLUMNS,
  schedule: SCHEDULE_COLUMNS
};

export const ALL_P6_COLUMNS: ColumnConfig[] = [
  ...BASELINE_COLUMNS,
  ...EVM_COLUMNS,
  ...ACTIVITY_CODE_COLUMNS,
  ...RESOURCE_COLUMNS,
  ...CRITICAL_PATH_COLUMNS,
  ...SCHEDULE_COLUMNS
];
