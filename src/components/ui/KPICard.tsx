import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTemaStore } from '../../stores/temaStore';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'primary',
  subtitle 
}) => {
  const { tema } = useTemaStore();

  const colorMap = {
    primary: tema.primary,
    success: tema.success,
    warning: tema.warning,
    danger: tema.danger,
    info: tema.info
  };

  const bgColorMap = {
    primary: `${tema.primary}15`,
    success: `${tema.success}15`,
    warning: `${tema.warning}15`,
    danger: `${tema.danger}15`,
    info: `${tema.info}15`
  };

  return (
    <div className="card card-hover animate-slide-in-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium theme-text-secondary mb-1">{title}</p>
          <h3 className="text-3xl font-bold theme-text mb-2">{value}</h3>
          {subtitle && (
            <p className="text-xs theme-text-secondary">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs theme-text-secondary ml-2">
                vs. semana anterior
              </span>
            </div>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ 
            backgroundColor: bgColorMap[color],
            color: colorMap[color]
          }}
        >
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
