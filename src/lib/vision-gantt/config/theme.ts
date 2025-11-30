/**
 * VisionGantt Theme Configuration - Primavera P6 Style
 * 
 * Professional color palettes and visual configuration
 * inspired by Oracle Primavera P6 scheduling software.
 */

export interface GanttThemeColors {
  normalActivity: {
    fill: string;
    fillLight: string;
    stroke: string;
    progress: string;
    text: string;
  };
  criticalActivity: {
    fill: string;
    fillLight: string;
    stroke: string;
    progress: string;
    text: string;
  };
  completedActivity: {
    fill: string;
    fillLight: string;
    stroke: string;
    progress: string;
    text: string;
  };
  summaryProject: {
    fill: string;
    stroke: string;
    text: string;
  };
  summaryWBS: {
    fill: string;
    stroke: string;
    text: string;
  };
  milestone: {
    fill: string;
    fillCritical: string;
    stroke: string;
  };
  baseline: {
    fill: string;
    stroke: string;
  };
  dependency: {
    normal: string;
    critical: string;
    hover: string;
  };
  grid: {
    rowEven: string;
    rowOdd: string;
    border: string;
    selected: string;
    selectedBorder: string;
    hover: string;
  };
  header: {
    background: string;
    text: string;
    border: string;
  };
  timeline: {
    background: string;
    gridLine: string;
    sightLine: string;
    weekend: string;
    holiday: string;
    today: string;
    todayLine: string;
  };
  selection: string;
  handle: string;
  handleHover: string;
}

export interface GanttTheme {
  name: string;
  colors: GanttThemeColors;
  typography: {
    fontFamily: string;
    taskLabel: {
      fontSize: string;
      fontWeight: number;
    };
    headerLabel: {
      fontSize: string;
      fontWeight: number;
    };
    gridLabel: {
      fontSize: string;
      fontWeight: number;
    };
  };
  spacing: {
    barHeight: number;
    rowHeight: number;
    barRadius: number;
    handleSize: number;
  };
}

export const P6_CLASSIC_THEME: GanttTheme = {
  name: 'P6 Classic',
  colors: {
    normalActivity: {
      fill: '#3B82F6',
      fillLight: '#60A5FA',
      stroke: '#2563EB',
      progress: '#1D4ED8',
      text: '#FFFFFF'
    },
    criticalActivity: {
      fill: '#EF4444',
      fillLight: '#F87171',
      stroke: '#DC2626',
      progress: '#B91C1C',
      text: '#FFFFFF'
    },
    completedActivity: {
      fill: '#10B981',
      fillLight: '#34D399',
      stroke: '#059669',
      progress: '#047857',
      text: '#FFFFFF'
    },
    summaryProject: {
      fill: '#059669',
      stroke: '#047857',
      text: '#FFFFFF'
    },
    summaryWBS: {
      fill: '#D97706',
      stroke: '#B45309',
      text: '#FFFFFF'
    },
    milestone: {
      fill: '#1F2937',
      fillCritical: '#DC2626',
      stroke: '#111827'
    },
    baseline: {
      fill: '#9CA3AF',
      stroke: '#6B7280'
    },
    dependency: {
      normal: '#6B7280',
      critical: '#DC2626',
      hover: '#1D4ED8'
    },
    grid: {
      rowEven: '#FFFFFF',
      rowOdd: '#F9FAFB',
      border: '#E5E7EB',
      selected: '#EFF6FF',
      selectedBorder: '#3B82F6',
      hover: '#F3F4F6'
    },
    header: {
      background: '#4B5563',
      text: '#FFFFFF',
      border: '#374151'
    },
    timeline: {
      background: '#FFFFFF',
      gridLine: '#E5E7EB',
      sightLine: '#F3F4F6',
      weekend: '#F9FAFB',
      holiday: '#FEF2F2',
      today: '#FEF3C7',
      todayLine: '#DC2626'
    },
    selection: '#1E40AF',
    handle: '#1E40AF',
    handleHover: '#10B981'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    taskLabel: {
      fontSize: '10px',
      fontWeight: 500
    },
    headerLabel: {
      fontSize: '11px',
      fontWeight: 600
    },
    gridLabel: {
      fontSize: '12px',
      fontWeight: 400
    }
  },
  spacing: {
    barHeight: 18,
    rowHeight: 32,
    barRadius: 2,
    handleSize: 5
  }
};

export const DARK_THEME: GanttTheme = {
  name: 'Dark',
  colors: {
    normalActivity: {
      fill: '#60A5FA',
      fillLight: '#93C5FD',
      stroke: '#3B82F6',
      progress: '#2563EB',
      text: '#FFFFFF'
    },
    criticalActivity: {
      fill: '#F87171',
      fillLight: '#FCA5A5',
      stroke: '#EF4444',
      progress: '#DC2626',
      text: '#FFFFFF'
    },
    completedActivity: {
      fill: '#34D399',
      fillLight: '#6EE7B7',
      stroke: '#10B981',
      progress: '#059669',
      text: '#FFFFFF'
    },
    summaryProject: {
      fill: '#10B981',
      stroke: '#059669',
      text: '#FFFFFF'
    },
    summaryWBS: {
      fill: '#F59E0B',
      stroke: '#D97706',
      text: '#1F2937'
    },
    milestone: {
      fill: '#F3F4F6',
      fillCritical: '#F87171',
      stroke: '#E5E7EB'
    },
    baseline: {
      fill: '#6B7280',
      stroke: '#4B5563'
    },
    dependency: {
      normal: '#9CA3AF',
      critical: '#F87171',
      hover: '#60A5FA'
    },
    grid: {
      rowEven: '#1F2937',
      rowOdd: '#111827',
      border: '#374151',
      selected: '#1E3A5F',
      selectedBorder: '#3B82F6',
      hover: '#374151'
    },
    header: {
      background: '#111827',
      text: '#F9FAFB',
      border: '#374151'
    },
    timeline: {
      background: '#1F2937',
      gridLine: '#374151',
      sightLine: '#374151',
      weekend: '#111827',
      holiday: '#451A03',
      today: '#422006',
      todayLine: '#F87171'
    },
    selection: '#3B82F6',
    handle: '#3B82F6',
    handleHover: '#10B981'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    taskLabel: {
      fontSize: '10px',
      fontWeight: 500
    },
    headerLabel: {
      fontSize: '11px',
      fontWeight: 600
    },
    gridLabel: {
      fontSize: '12px',
      fontWeight: 400
    }
  },
  spacing: {
    barHeight: 18,
    rowHeight: 32,
    barRadius: 2,
    handleSize: 5
  }
};

export const CONSTRUCTION_THEME: GanttTheme = {
  name: 'Construction',
  colors: {
    normalActivity: {
      fill: '#F59E0B',
      fillLight: '#FBBF24',
      stroke: '#D97706',
      progress: '#B45309',
      text: '#1F2937'
    },
    criticalActivity: {
      fill: '#DC2626',
      fillLight: '#EF4444',
      stroke: '#B91C1C',
      progress: '#991B1B',
      text: '#FFFFFF'
    },
    completedActivity: {
      fill: '#059669',
      fillLight: '#10B981',
      stroke: '#047857',
      progress: '#065F46',
      text: '#FFFFFF'
    },
    summaryProject: {
      fill: '#0284C7',
      stroke: '#0369A1',
      text: '#FFFFFF'
    },
    summaryWBS: {
      fill: '#7C3AED',
      stroke: '#6D28D9',
      text: '#FFFFFF'
    },
    milestone: {
      fill: '#DC2626',
      fillCritical: '#991B1B',
      stroke: '#B91C1C'
    },
    baseline: {
      fill: '#6B7280',
      stroke: '#4B5563'
    },
    dependency: {
      normal: '#78716C',
      critical: '#DC2626',
      hover: '#0284C7'
    },
    grid: {
      rowEven: '#FFFBEB',
      rowOdd: '#FEF3C7',
      border: '#FCD34D',
      selected: '#FEF08A',
      selectedBorder: '#F59E0B',
      hover: '#FEF9C3'
    },
    header: {
      background: '#78350F',
      text: '#FFFFFF',
      border: '#92400E'
    },
    timeline: {
      background: '#FFFBEB',
      gridLine: '#FDE68A',
      sightLine: '#FEF3C7',
      weekend: '#FEF9C3',
      holiday: '#FEE2E2',
      today: '#FECACA',
      todayLine: '#DC2626'
    },
    selection: '#D97706',
    handle: '#D97706',
    handleHover: '#059669'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    taskLabel: {
      fontSize: '10px',
      fontWeight: 600
    },
    headerLabel: {
      fontSize: '11px',
      fontWeight: 700
    },
    gridLabel: {
      fontSize: '12px',
      fontWeight: 500
    }
  },
  spacing: {
    barHeight: 20,
    rowHeight: 34,
    barRadius: 3,
    handleSize: 6
  }
};

export type ActivityCodeColor = {
  id: string;
  name: string;
  color: string;
  textColor: string;
};

export const DEFAULT_ACTIVITY_CODE_COLORS: ActivityCodeColor[] = [
  { id: 'design', name: 'Design', color: '#8B5CF6', textColor: '#FFFFFF' },
  { id: 'procurement', name: 'Procurement', color: '#06B6D4', textColor: '#FFFFFF' },
  { id: 'construction', name: 'Construction', color: '#F59E0B', textColor: '#1F2937' },
  { id: 'inspection', name: 'Inspection', color: '#10B981', textColor: '#FFFFFF' },
  { id: 'testing', name: 'Testing', color: '#EC4899', textColor: '#FFFFFF' },
  { id: 'handover', name: 'Handover', color: '#6366F1', textColor: '#FFFFFF' },
  { id: 'maintenance', name: 'Maintenance', color: '#78716C', textColor: '#FFFFFF' },
  { id: 'planning', name: 'Planning', color: '#0EA5E9', textColor: '#FFFFFF' },
  { id: 'mobilization', name: 'Mobilization', color: '#84CC16', textColor: '#1F2937' },
  { id: 'demobilization', name: 'Demobilization', color: '#A855F7', textColor: '#FFFFFF' }
];

export const AVAILABLE_THEMES: GanttTheme[] = [
  P6_CLASSIC_THEME,
  DARK_THEME,
  CONSTRUCTION_THEME
];

export function getThemeByName(name: string): GanttTheme {
  return AVAILABLE_THEMES.find(t => t.name === name) || P6_CLASSIC_THEME;
}
