/**
 * VisionGantt Theme Context
 * 
 * Provides theme configuration throughout the Gantt chart components.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { P6_CLASSIC_THEME, type GanttTheme, type ActivityCodeColor, DEFAULT_ACTIVITY_CODE_COLORS } from '../config/theme';

interface GanttThemeContextValue {
  theme: GanttTheme;
  setTheme: (theme: GanttTheme) => void;
  activityCodeColors: ActivityCodeColor[];
  setActivityCodeColors: (colors: ActivityCodeColor[]) => void;
  getActivityColor: (activityCode: string) => ActivityCodeColor | undefined;
}

const GanttThemeContext = createContext<GanttThemeContextValue | undefined>(undefined);

interface GanttThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: GanttTheme;
  initialActivityCodeColors?: ActivityCodeColor[];
}

export function GanttThemeProvider({
  children,
  initialTheme = P6_CLASSIC_THEME,
  initialActivityCodeColors = DEFAULT_ACTIVITY_CODE_COLORS
}: GanttThemeProviderProps) {
  const [theme, setTheme] = useState<GanttTheme>(initialTheme);
  const [activityCodeColors, setActivityCodeColors] = useState<ActivityCodeColor[]>(initialActivityCodeColors);

  const getActivityColor = useMemo(() => {
    const colorMap = new Map(activityCodeColors.map(c => [c.id.toLowerCase(), c]));
    return (activityCode: string) => colorMap.get(activityCode.toLowerCase());
  }, [activityCodeColors]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    activityCodeColors,
    setActivityCodeColors,
    getActivityColor
  }), [theme, activityCodeColors, getActivityColor]);

  return (
    <GanttThemeContext.Provider value={value}>
      {children}
    </GanttThemeContext.Provider>
  );
}

export function useGanttTheme(): GanttThemeContextValue {
  const context = useContext(GanttThemeContext);
  if (!context) {
    return {
      theme: P6_CLASSIC_THEME,
      setTheme: () => {},
      activityCodeColors: DEFAULT_ACTIVITY_CODE_COLORS,
      setActivityCodeColors: () => {},
      getActivityColor: () => undefined
    };
  }
  return context;
}
