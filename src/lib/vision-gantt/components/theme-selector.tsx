/**
 * GanttThemeSelector - Theme selection dropdown for VisionGantt
 * Allows users to switch between available themes including company theme
 */

import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, Building2 } from 'lucide-react';
import { useGanttTheme, type GanttThemeName } from '../context/theme-context';

interface ThemeSelectorProps {
  className?: string;
  compact?: boolean;
}

const THEME_ICONS: Record<GanttThemeName, React.ReactNode> = {
  'Empresa': <Building2 className="w-4 h-4" />,
  'P6 Classic': <div className="w-4 h-4 rounded-full bg-blue-500" />,
  'Dark': <div className="w-4 h-4 rounded-full bg-gray-800" />,
  'Construction': <div className="w-4 h-4 rounded-full bg-amber-500" />
};

const THEME_DESCRIPTIONS: Record<GanttThemeName, string> = {
  'Empresa': 'Cores da sua empresa',
  'P6 Classic': 'Estilo Primavera P6',
  'Dark': 'Tema escuro',
  'Construction': 'Tema construção'
};

export function GanttThemeSelector({ className = '', compact = false }: ThemeSelectorProps) {
  const { themeName, availableThemes, setThemeByName, isTransitioning, theme } = useGanttTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (name: GanttThemeName) => {
    setThemeByName(name);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          border transition-all duration-200
          hover:bg-opacity-80
          ${isTransitioning ? 'opacity-70' : ''}
        `}
        style={{
          backgroundColor: theme.colors.grid.rowEven,
          borderColor: theme.colors.grid.border,
          color: theme.colors.header.text === '#FFFFFF' ? theme.colors.grid.selectedBorder : theme.colors.header.background
        }}
        title="Selecionar tema do cronograma"
      >
        <Palette className="w-4 h-4" />
        {!compact && (
          <>
            <span className="text-sm font-medium">{themeName}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 z-50 min-w-[200px] rounded-lg shadow-lg border overflow-hidden"
          style={{
            backgroundColor: theme.colors.grid.rowEven,
            borderColor: theme.colors.grid.border
          }}
        >
          <div 
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider border-b"
            style={{ 
              color: theme.colors.header.text === '#FFFFFF' ? theme.colors.grid.selectedBorder : theme.colors.header.background,
              borderColor: theme.colors.grid.border,
              backgroundColor: theme.colors.grid.rowOdd
            }}
          >
            Tema do Cronograma
          </div>
          
          {availableThemes.map((name) => (
            <button
              key={name}
              onClick={() => handleSelectTheme(name)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 text-left
                transition-colors duration-150
              `}
              style={{
                backgroundColor: themeName === name ? theme.colors.grid.selected : 'transparent',
                color: theme.colors.header.text === '#FFFFFF' ? theme.colors.grid.selectedBorder : theme.colors.header.background
              }}
              onMouseEnter={(e) => {
                if (themeName !== name) {
                  e.currentTarget.style.backgroundColor = theme.colors.grid.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = themeName === name ? theme.colors.grid.selected : 'transparent';
              }}
            >
              <div className="flex-shrink-0">
                {THEME_ICONS[name]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{name}</div>
                <div 
                  className="text-xs truncate"
                  style={{ color: theme.colors.dependency.normal }}
                >
                  {THEME_DESCRIPTIONS[name]}
                </div>
              </div>
              {themeName === name && (
                <Check className="w-4 h-4 flex-shrink-0" style={{ color: theme.colors.completedActivity.fill }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default GanttThemeSelector;
