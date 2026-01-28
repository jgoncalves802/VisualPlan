export const designTokens = {
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
  },
  
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const professionalTheme = {
  light: {
    primary: '#3B82F6',
    primaryHover: '#2563EB',
    primaryLight: '#EFF6FF',
    secondary: '#6B7280',
    secondaryHover: '#4B5563',
    accent: '#8B5CF6',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    info: '#3B82F6',
    infoLight: '#EFF6FF',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceSecondary: '#F3F4F6',
    surfaceTertiary: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
  },
  
  dark: {
    primary: '#60A5FA',
    primaryHover: '#93C5FD',
    primaryLight: '#1E3A5F',
    secondary: '#9CA3AF',
    secondaryHover: '#D1D5DB',
    accent: '#A78BFA',
    success: '#34D399',
    successLight: '#064E3B',
    warning: '#FBBF24',
    warningLight: '#78350F',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    info: '#60A5FA',
    infoLight: '#1E3A8A',
    background: '#111827',
    surface: '#1F2937',
    surfaceSecondary: '#374151',
    surfaceTertiary: '#4B5563',
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    border: '#374151',
    borderLight: '#1F2937',
  }
};

export const componentStyles = {
  button: {
    base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5',
      md: 'px-3 py-2 text-sm gap-2',
      lg: 'px-4 py-2.5 text-base gap-2',
    },
  },
  
  input: {
    base: 'w-full px-3 py-2 text-sm border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
  },
  
  card: {
    base: 'rounded-lg border bg-white shadow-sm',
  },
  
  modal: {
    overlay: 'fixed inset-0 bg-black/40 backdrop-blur-sm z-50',
    container: 'fixed inset-0 flex items-center justify-center z-50 p-4',
    content: 'w-full max-w-lg bg-white rounded-xl shadow-xl',
  },
  
  table: {
    header: 'text-xs font-medium text-gray-500 uppercase tracking-wider',
    cell: 'px-4 py-3 text-sm text-gray-900',
    row: 'border-b border-gray-100 hover:bg-gray-50 transition-colors',
  },
};
