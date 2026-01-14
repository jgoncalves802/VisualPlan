import React, { useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface MiniKPICardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  color?: 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  tooltip?: string;
  formula?: string;
}

const colorClasses = {
  neutral: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
};

const MiniKPICard: React.FC<MiniKPICardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  trendValue,
  color = 'neutral',
  size = 'md',
  tooltip,
  formula,
}) => {
  const colors = colorClasses[color];
  const [showTooltip, setShowTooltip] = useState(false);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500';

  return (
    <div className={`${colors.bg} rounded-lg p-4 transition-all hover:shadow-sm relative`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
              {title}
            </p>
            {(tooltip || formula) && (
              <div className="relative">
                <button
                  type="button"
                  className="p-0.5 rounded hover:bg-gray-200 transition-colors"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                >
                  <Info size={12} className="text-gray-400" />
                </button>
                {showTooltip && (
                  <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                    {tooltip && <p className="mb-2">{tooltip}</p>}
                    {formula && (
                      <p className="font-mono text-[10px] bg-gray-800 p-1.5 rounded text-gray-300">
                        {formula}
                      </p>
                    )}
                    <div className="absolute left-3 bottom-0 transform translate-y-full">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <h3 className={`font-bold ${colors.text} ${size === 'sm' ? 'text-xl' : 'text-2xl'}`}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && trendValue !== undefined && (
            <div className="flex items-center mt-2">
              <TrendIcon size={14} className={trendColor} />
              <span className={`text-xs font-medium ml-1 ${trendColor}`}>
                {trendValue > 0 ? '+' : ''}{trendValue}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
            <Icon size={18} className={colors.icon} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniKPICard;
