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
  nearCriticalActivity: {
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
    nearCritical: string;
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
    nearCriticalActivity: {
      fill: '#F97316',
      fillLight: '#FB923C',
      stroke: '#EA580C',
      progress: '#C2410C',
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
      nearCritical: '#F97316',
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
    nearCriticalActivity: {
      fill: '#FB923C',
      fillLight: '#FDBA74',
      stroke: '#F97316',
      progress: '#EA580C',
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
      nearCritical: '#FB923C',
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
    nearCriticalActivity: {
      fill: '#EA580C',
      fillLight: '#F97316',
      stroke: '#C2410C',
      progress: '#9A3412',
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
      nearCritical: '#EA580C',
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

// Modern Theme - Inspired by ClickUp, Trello, Notion
// Soft pastel colors with excellent contrast and readability
export const MODERN_THEME: GanttTheme = {
  name: 'Modern',
  colors: {
    normalActivity: {
      fill: '#7C3AED',      // Soft purple (ClickUp primary)
      fillLight: '#A78BFA',
      stroke: '#6D28D9',
      progress: '#5B21B6',
      text: '#FFFFFF'
    },
    criticalActivity: {
      fill: '#F43F5E',      // Soft rose red
      fillLight: '#FB7185',
      stroke: '#E11D48',
      progress: '#BE123C',
      text: '#FFFFFF'
    },
    nearCriticalActivity: {
      fill: '#F59E0B',      // Warm amber
      fillLight: '#FBBF24',
      stroke: '#D97706',
      progress: '#B45309',
      text: '#1F2937'
    },
    completedActivity: {
      fill: '#10B981',      // Soft emerald
      fillLight: '#34D399',
      stroke: '#059669',
      progress: '#047857',
      text: '#FFFFFF'
    },
    summaryProject: {
      fill: '#6366F1',      // Soft indigo
      stroke: '#4F46E5',
      text: '#FFFFFF'
    },
    summaryWBS: {
      fill: '#8B5CF6',      // Violet
      stroke: '#7C3AED',
      text: '#FFFFFF'
    },
    milestone: {
      fill: '#EC4899',      // Pink
      fillCritical: '#F43F5E',
      stroke: '#DB2777'
    },
    baseline: {
      fill: '#A1A1AA',      // Soft zinc
      stroke: '#71717A'
    },
    dependency: {
      normal: '#A1A1AA',
      critical: '#F43F5E',
      nearCritical: '#F59E0B',
      hover: '#7C3AED'
    },
    grid: {
      rowEven: '#FFFFFF',
      rowOdd: '#FAFAFA',
      border: '#E5E5E5',
      selected: '#F3E8FF',   // Soft purple tint
      selectedBorder: '#7C3AED',
      hover: '#F5F5F5'
    },
    header: {
      background: '#FAFAFA',
      text: '#374151',
      border: '#E5E5E5'
    },
    timeline: {
      background: '#FFFFFF',
      gridLine: '#E5E5E5',
      sightLine: '#FAFAFA',
      weekend: '#F9FAFB',
      holiday: '#FEF2F2',
      today: '#F0FDF4',      // Soft green tint for today
      todayLine: '#10B981'
    },
    selection: '#7C3AED',
    handle: '#7C3AED',
    handleHover: '#10B981'
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    taskLabel: {
      fontSize: '11px',
      fontWeight: 500
    },
    headerLabel: {
      fontSize: '12px',
      fontWeight: 600
    },
    gridLabel: {
      fontSize: '13px',
      fontWeight: 400
    }
  },
  spacing: {
    barHeight: 22,
    rowHeight: 36,
    barRadius: 6,
    handleSize: 6
  }
};

// Clean Theme - Minimalist with subtle colors (Notion-inspired)
export const CLEAN_THEME: GanttTheme = {
  name: 'Clean',
  colors: {
    normalActivity: {
      fill: '#3B82F6',      // Calm blue
      fillLight: '#93C5FD',
      stroke: '#2563EB',
      progress: '#1D4ED8',
      text: '#FFFFFF'
    },
    criticalActivity: {
      fill: '#EF4444',      // Clear red
      fillLight: '#FCA5A5',
      stroke: '#DC2626',
      progress: '#B91C1C',
      text: '#FFFFFF'
    },
    nearCriticalActivity: {
      fill: '#F97316',      // Bright orange
      fillLight: '#FDBA74',
      stroke: '#EA580C',
      progress: '#C2410C',
      text: '#FFFFFF'
    },
    completedActivity: {
      fill: '#22C55E',      // Bright green
      fillLight: '#86EFAC',
      stroke: '#16A34A',
      progress: '#15803D',
      text: '#FFFFFF'
    },
    summaryProject: {
      fill: '#64748B',      // Slate
      stroke: '#475569',
      text: '#FFFFFF'
    },
    summaryWBS: {
      fill: '#0EA5E9',      // Sky blue
      stroke: '#0284C7',
      text: '#FFFFFF'
    },
    milestone: {
      fill: '#1F2937',
      fillCritical: '#EF4444',
      stroke: '#111827'
    },
    baseline: {
      fill: '#CBD5E1',
      stroke: '#94A3B8'
    },
    dependency: {
      normal: '#94A3B8',
      critical: '#EF4444',
      nearCritical: '#F97316',
      hover: '#3B82F6'
    },
    grid: {
      rowEven: '#FFFFFF',
      rowOdd: '#F8FAFC',
      border: '#E2E8F0',
      selected: '#EFF6FF',
      selectedBorder: '#3B82F6',
      hover: '#F1F5F9'
    },
    header: {
      background: '#F8FAFC',
      text: '#334155',
      border: '#E2E8F0'
    },
    timeline: {
      background: '#FFFFFF',
      gridLine: '#E2E8F0',
      sightLine: '#F8FAFC',
      weekend: '#F8FAFC',
      holiday: '#FEF2F2',
      today: '#FFFBEB',
      todayLine: '#EF4444'
    },
    selection: '#3B82F6',
    handle: '#3B82F6',
    handleHover: '#22C55E'
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    taskLabel: {
      fontSize: '11px',
      fontWeight: 500
    },
    headerLabel: {
      fontSize: '12px',
      fontWeight: 500
    },
    gridLabel: {
      fontSize: '13px',
      fontWeight: 400
    }
  },
  spacing: {
    barHeight: 20,
    rowHeight: 34,
    barRadius: 4,
    handleSize: 5
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
  MODERN_THEME,
  CLEAN_THEME,
  P6_CLASSIC_THEME,
  DARK_THEME,
  CONSTRUCTION_THEME
];

export function getThemeByName(name: string): GanttTheme {
  return AVAILABLE_THEMES.find(t => t.name === name) || P6_CLASSIC_THEME;
}

export interface CompanyColors {
  primary: string;
  secondary: string;
  accent?: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

function adjustColor(hex: string, amount: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const num = parseInt(hex.replace('#', ''), 16);
  const r = clamp(((num >> 16) & 0xff) + amount);
  const g = clamp(((num >> 8) & 0xff) + amount);
  const b = clamp((num & 0xff) + amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function getContrastText(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1F2937' : '#FFFFFF';
}

export function createCompanyTheme(colors: CompanyColors): GanttTheme {
  const primaryLight = adjustColor(colors.primary, 40);
  const primaryDark = adjustColor(colors.primary, -30);
  const secondaryDark = adjustColor(colors.secondary, -30);
  const dangerLight = adjustColor(colors.danger, 40);
  const dangerDark = adjustColor(colors.danger, -30);
  const warningLight = adjustColor(colors.warning, 40);
  const warningDark = adjustColor(colors.warning, -30);
  const successLight = adjustColor(colors.success, 40);
  const successDark = adjustColor(colors.success, -30);
  
  const isDarkMode = parseInt(colors.background.replace('#', ''), 16) < 0x808080;
  
  return {
    name: 'Empresa',
    colors: {
      normalActivity: {
        fill: colors.primary,
        fillLight: primaryLight,
        stroke: primaryDark,
        progress: adjustColor(colors.primary, -50),
        text: getContrastText(colors.primary)
      },
      criticalActivity: {
        fill: colors.danger,
        fillLight: dangerLight,
        stroke: dangerDark,
        progress: adjustColor(colors.danger, -50),
        text: getContrastText(colors.danger)
      },
      nearCriticalActivity: {
        fill: colors.warning,
        fillLight: warningLight,
        stroke: warningDark,
        progress: adjustColor(colors.warning, -50),
        text: getContrastText(colors.warning)
      },
      completedActivity: {
        fill: colors.success,
        fillLight: successLight,
        stroke: successDark,
        progress: adjustColor(colors.success, -50),
        text: getContrastText(colors.success)
      },
      summaryProject: {
        fill: colors.secondary,
        stroke: secondaryDark,
        text: getContrastText(colors.secondary)
      },
      summaryWBS: {
        fill: colors.accent || colors.warning,
        stroke: adjustColor(colors.accent || colors.warning, -30),
        text: getContrastText(colors.accent || colors.warning)
      },
      milestone: {
        fill: colors.text,
        fillCritical: colors.danger,
        stroke: adjustColor(colors.text, -20)
      },
      baseline: {
        fill: colors.textSecondary,
        stroke: adjustColor(colors.textSecondary, -20)
      },
      dependency: {
        normal: colors.textSecondary,
        critical: colors.danger,
        nearCritical: colors.warning,
        hover: colors.primary
      },
      grid: {
        rowEven: colors.surface,
        rowOdd: isDarkMode ? adjustColor(colors.surface, -10) : adjustColor(colors.surface, -5),
        border: colors.border,
        selected: adjustColor(colors.primary, isDarkMode ? -60 : 80),
        selectedBorder: colors.primary,
        hover: isDarkMode ? adjustColor(colors.surface, 10) : adjustColor(colors.surface, -10)
      },
      header: {
        background: isDarkMode ? adjustColor(colors.surface, -20) : adjustColor(colors.text, 40),
        text: isDarkMode ? colors.text : '#FFFFFF',
        border: colors.border
      },
      timeline: {
        background: colors.surface,
        gridLine: colors.border,
        sightLine: isDarkMode ? adjustColor(colors.surface, 10) : adjustColor(colors.surface, -5),
        weekend: isDarkMode ? adjustColor(colors.surface, -5) : adjustColor(colors.surface, -3),
        holiday: adjustColor(colors.danger, isDarkMode ? -70 : 80),
        today: adjustColor(colors.warning, isDarkMode ? -60 : 80),
        todayLine: colors.danger
      },
      selection: colors.primary,
      handle: colors.primary,
      handleHover: colors.success
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
      barRadius: 3,
      handleSize: 5
    }
  };
}
