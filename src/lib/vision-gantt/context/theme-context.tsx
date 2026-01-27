/**
 * VisionGantt Theme Context
 * 
 * Provides theme configuration throughout the Gantt chart components.
 * Supports company theme inheritance and multiple preset themes.
 */

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { 
  P6_CLASSIC_THEME, 
  AVAILABLE_THEMES,
  createCompanyTheme,
  type GanttTheme, 
  type ActivityCodeColor, 
  type CompanyColors,
  DEFAULT_ACTIVITY_CODE_COLORS 
} from '../config/theme';

export type GanttThemeName = 'Modern' | 'Clean' | 'P6 Classic' | 'Dark' | 'Construction' | 'Empresa';

interface GanttThemeContextValue {
  theme: GanttTheme;
  themeName: GanttThemeName;
  availableThemes: GanttThemeName[];
  setTheme: (theme: GanttTheme) => void;
  setThemeByName: (name: GanttThemeName) => void;
  setCompanyColors: (colors: CompanyColors) => void;
  activityCodeColors: ActivityCodeColor[];
  setActivityCodeColors: (colors: ActivityCodeColor[]) => void;
  getActivityColor: (activityCode: string) => ActivityCodeColor | undefined;
  isTransitioning: boolean;
}

const GanttThemeContext = createContext<GanttThemeContextValue | undefined>(undefined);

interface GanttThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: GanttTheme;
  initialThemeName?: GanttThemeName;
  initialActivityCodeColors?: ActivityCodeColor[];
  companyColors?: CompanyColors;
}

const THEME_STORAGE_KEY = 'visiongantt-theme-name';

export function GanttThemeProvider({
  children,
  initialTheme,
  initialThemeName,
  initialActivityCodeColors = DEFAULT_ACTIVITY_CODE_COLORS,
  companyColors
}: GanttThemeProviderProps) {
  const [companyTheme, setCompanyTheme] = useState<GanttTheme | null>(
    companyColors ? createCompanyTheme(companyColors) : null
  );
  
  const getInitialTheme = useCallback((): { theme: GanttTheme; name: GanttThemeName } => {
    const savedName = localStorage.getItem(THEME_STORAGE_KEY) as GanttThemeName | null;
    
    if (savedName === 'Empresa' && companyTheme) {
      return { theme: companyTheme, name: 'Empresa' };
    }
    
    if (savedName) {
      const found = AVAILABLE_THEMES.find(t => t.name === savedName);
      if (found) return { theme: found, name: savedName };
    }
    
    if (initialThemeName === 'Empresa' && companyTheme) {
      return { theme: companyTheme, name: 'Empresa' };
    }
    
    if (initialTheme) {
      return { theme: initialTheme, name: initialTheme.name as GanttThemeName };
    }
    
    if (companyTheme) {
      return { theme: companyTheme, name: 'Empresa' };
    }
    
    return { theme: P6_CLASSIC_THEME, name: 'P6 Classic' };
  }, [companyTheme, initialTheme, initialThemeName]);
  
  const initial = getInitialTheme();
  const [theme, setThemeState] = useState<GanttTheme>(initial.theme);
  const [themeName, setThemeName] = useState<GanttThemeName>(initial.name);
  const [activityCodeColors, setActivityCodeColors] = useState<ActivityCodeColor[]>(initialActivityCodeColors);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const availableThemes: GanttThemeName[] = useMemo(() => {
    const themes: GanttThemeName[] = ['Modern', 'Clean', 'P6 Classic', 'Dark', 'Construction'];
    if (companyTheme) {
      themes.unshift('Empresa');
    }
    return themes;
  }, [companyTheme]);

  const setCompanyColors = useCallback((colors: CompanyColors) => {
    const newTheme = createCompanyTheme(colors);
    setCompanyTheme(newTheme);
    if (themeName === 'Empresa') {
      setIsTransitioning(true);
      setThemeState(newTheme);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [themeName]);

  const setTheme = useCallback((newTheme: GanttTheme) => {
    setIsTransitioning(true);
    setThemeState(newTheme);
    setThemeName(newTheme.name as GanttThemeName);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme.name);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  const setThemeByName = useCallback((name: GanttThemeName) => {
    setIsTransitioning(true);
    
    let newTheme: GanttTheme;
    if (name === 'Empresa' && companyTheme) {
      newTheme = companyTheme;
    } else {
      newTheme = AVAILABLE_THEMES.find(t => t.name === name) || P6_CLASSIC_THEME;
    }
    
    setThemeState(newTheme);
    setThemeName(name);
    localStorage.setItem(THEME_STORAGE_KEY, name);
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [companyTheme]);

  useEffect(() => {
    if (companyColors) {
      setCompanyColors(companyColors);
    }
  }, [companyColors, setCompanyColors]);

  const getActivityColor = useMemo(() => {
    const colorMap = new Map(activityCodeColors.map(c => [c.id.toLowerCase(), c]));
    return (activityCode: string) => colorMap.get(activityCode.toLowerCase());
  }, [activityCodeColors]);

  const value = useMemo(() => ({
    theme,
    themeName,
    availableThemes,
    setTheme,
    setThemeByName,
    setCompanyColors,
    activityCodeColors,
    setActivityCodeColors,
    getActivityColor,
    isTransitioning
  }), [theme, themeName, availableThemes, setTheme, setThemeByName, setCompanyColors, activityCodeColors, getActivityColor, isTransitioning]);

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
      themeName: 'P6 Classic',
      availableThemes: ['Modern', 'Clean', 'P6 Classic', 'Dark', 'Construction'],
      setTheme: () => {},
      setThemeByName: () => {},
      setCompanyColors: () => {},
      activityCodeColors: DEFAULT_ACTIVITY_CODE_COLORS,
      setActivityCodeColors: () => {},
      getActivityColor: () => undefined,
      isTransitioning: false
    };
  }
  return context;
}
