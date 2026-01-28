import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  actions,
  children
}) => {
  return (
    <div className="flex-shrink-0 theme-surface border-b theme-divide px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 theme-text-secondary" />}
          <div>
            <h1 className="text-xl font-semibold theme-text">{title}</h1>
            {subtitle && (
              <p className="text-sm theme-text-secondary">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, className = '' }) => {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {children}
    </div>
  );
};

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const PageContent: React.FC<PageContentProps> = ({ 
  children, 
  className = '',
  noPadding = false 
}) => {
  return (
    <div className={`flex-1 flex overflow-hidden ${noPadding ? '' : 'p-6'} ${className}`}>
      {children}
    </div>
  );
};

interface SidePanelProps {
  children: React.ReactNode;
  width?: string;
  className?: string;
}

export const SidePanel: React.FC<SidePanelProps> = ({ 
  children, 
  width = 'w-72',
  className = '' 
}) => {
  return (
    <div className={`${width} flex-shrink-0 border-r theme-divide theme-surface overflow-y-auto ${className}`}>
      {children}
    </div>
  );
};

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const ContentCard: React.FC<ContentCardProps> = ({ 
  children, 
  className = '',
  noPadding = false 
}) => {
  return (
    <div 
      className={`rounded-lg border theme-divide ${noPadding ? '' : 'p-4'} ${className}`}
      style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
    >
      {children}
    </div>
  );
};

interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

interface PageTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const PageTabs: React.FC<PageTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div className={`flex gap-1 border-b theme-divide ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'theme-text'
                : 'border-transparent theme-text-secondary hover:theme-text'
            }`}
            style={{ borderBottomColor: activeTab === tab.id ? 'var(--color-text)' : 'transparent' }}
          >
            {Icon && <Icon className="w-4 h-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium theme-text-secondary whitespace-nowrap">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-1.5 text-sm border rounded-lg theme-text min-w-[160px]"
        style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  title?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className = '',
  title
}) => {
  const baseStyles = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };
  
  const variantStyles = {
    primary: 'text-white hover:opacity-90',
    secondary: 'theme-text hover:opacity-80',
    ghost: 'theme-text-secondary hover:theme-text',
    danger: 'text-white hover:opacity-90'
  };

  const getBackgroundStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: 'var(--color-primary)' };
      case 'secondary':
        return { backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: 'var(--color-danger)' };
      default:
        return {};
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      style={getBackgroundStyle()}
      title={title}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      {children}
    </button>
  );
};

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  onClear,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <svg 
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg theme-text"
        style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-text"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center ${className}`}>
      {Icon && <Icon className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-50" />}
      <p className="text-sm font-medium theme-text-secondary mb-1">{title}</p>
      {description && (
        <p className="text-xs theme-text-muted mb-4">{description}</p>
      )}
      {action}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg 
        className={`${sizeClasses[size]} theme-text-secondary animate-spin`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
};

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  isOpen,
  onClose,
  align = 'right',
  className = ''
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {trigger}
      {isOpen && (
        <div 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-56 rounded-lg shadow-lg border z-50 py-1`}
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  children,
  icon: Icon,
  onClick,
  disabled = false,
  danger = false,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? 'text-red-500' : 'theme-text'
      } ${className}`}
      style={{ backgroundColor: 'transparent' }}
    >
      {Icon && <Icon className={`w-4 h-4 ${danger ? '' : 'theme-text-secondary'}`} />}
      {children}
    </button>
  );
};

interface DropdownDividerProps {
  className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className = '' }) => {
  return (
    <div 
      className={`border-t my-1 ${className}`} 
      style={{ borderColor: 'var(--color-border)' }} 
    />
  );
};
