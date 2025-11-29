
/**
 * View Preset Configurations for different zoom levels
 */

import type { ViewPreset, ViewPresetConfig } from '../types';

export const VIEW_PRESETS: Record<ViewPreset, ViewPresetConfig> = {
  hour: {
    name: 'hour',
    tickWidth: 60, // pixels per hour
    timeUnit: 'hour',
    columnWidth: 60,
    headerLevels: [
      { 
        unit: 'day', 
        format: 'EEE, MMM d',
        align: 'center',
        showSeparators: true,
        height: 36
      },
      { 
        unit: 'hour', 
        format: 'HH:mm',
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 32
      }
    ],
    shiftIncrement: 12 // shift by 12 hours
  },
  day: {
    name: 'day',
    tickWidth: 60, // pixels per day
    timeUnit: 'day',
    columnWidth: 60,
    headerLevels: [
      { 
        unit: 'month', 
        format: 'MMMM yyyy',
        align: 'center',
        showSeparators: true,
        height: 36
      },
      { 
        unit: 'day', 
        format: 'd',
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 32
      }
    ],
    shiftIncrement: 7 // shift by 7 days
  },
  week: {
    name: 'week',
    tickWidth: 80, // pixels per week
    timeUnit: 'week',
    columnWidth: 80,
    headerLevels: [
      { 
        unit: 'month', 
        format: 'MMMM yyyy',
        align: 'center',
        showSeparators: true,
        height: 36
      },
      { 
        unit: 'week', 
        format: "'W'w",
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 32
      }
    ],
    shiftIncrement: 4 // shift by 4 weeks
  },
  month: {
    name: 'month',
    tickWidth: 100, // pixels per month
    timeUnit: 'month',
    columnWidth: 100,
    headerLevels: [
      { 
        unit: 'year', 
        format: 'yyyy',
        align: 'center',
        showSeparators: true,
        height: 36
      },
      { 
        unit: 'month', 
        format: 'MMM',
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 32
      }
    ],
    shiftIncrement: 3 // shift by 3 months
  },
  quarter: {
    name: 'quarter',
    tickWidth: 120, // pixels per quarter
    timeUnit: 'quarter',
    columnWidth: 120,
    headerLevels: [
      { 
        unit: 'year', 
        format: 'yyyy',
        align: 'center',
        showSeparators: true,
        height: 36
      },
      { 
        unit: 'quarter', 
        format: "'Q'Q",
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 32
      }
    ],
    shiftIncrement: 2 // shift by 2 quarters
  },
  year: {
    name: 'year',
    tickWidth: 150, // pixels per year
    timeUnit: 'year',
    columnWidth: 150,
    headerLevels: [
      { 
        unit: 'year', 
        format: 'yyyy',
        increment: 1,
        align: 'center',
        showSeparators: true,
        height: 36
      }
    ],
    shiftIncrement: 1 // shift by 1 year
  }
};

/**
 * Get view preset configuration
 */
export function getViewPreset(preset: ViewPreset): ViewPresetConfig {
  return VIEW_PRESETS[preset] ?? VIEW_PRESETS.month;
}

/**
 * Calculate pixels per day for a view preset
 */
export function getPixelsPerDay(preset: ViewPreset): number {
  const config = getViewPreset(preset);
  switch (preset) {
    case 'hour':
      return config.tickWidth * 24; // 24 hours per day
    case 'day':
      return config.tickWidth;
    case 'week':
      return config.tickWidth / 7;
    case 'month':
      return config.tickWidth / 30; // approximate
    case 'quarter':
      return config.tickWidth / 90; // approximate
    case 'year':
      return config.tickWidth / 365; // approximate
    default:
      return 3; // fallback
  }
}
