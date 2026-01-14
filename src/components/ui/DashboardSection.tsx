import React, { useState } from 'react';
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react';

interface DashboardSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon: Icon,
  iconColor = '#374151',
  iconBgColor = '#F3F4F6',
  children,
  defaultExpanded = true,
  collapsible = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        disabled={!collapsible}
        className={`w-full flex items-center justify-between p-4 transition-colors ${
          collapsible ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'
        }`}
        style={{ backgroundColor: iconBgColor }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: iconColor }}
          >
            <Icon size={20} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-800">
            {title}
          </h2>
        </div>
        {collapsible && (
          <div className="text-gray-500">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </div>
        )}
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4 animate-slide-in-up bg-white">
          {children}
        </div>
      )}
    </div>
  );
};

export default DashboardSection;
