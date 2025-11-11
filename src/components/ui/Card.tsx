import React from 'react';
import classNames from 'classnames';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  headerAction,
  className,
  padding = 'md',
  hover = false,
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={classNames(
        'card transition-theme',
        {
          'hover:shadow-lg': hover,
        },
        className
      )}
    >
      {(title || headerAction) && (
        <div className={classNames(
          'flex items-center justify-between border-b border-secondary-200 pb-4',
          paddingClasses[padding]
        )}>
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={classNames(
        { [paddingClasses[padding]]: !title && !headerAction },
        { 'pt-4': title || headerAction },
        paddingClasses[padding]
      )}>
        {children}
      </div>
    </div>
  );
};
