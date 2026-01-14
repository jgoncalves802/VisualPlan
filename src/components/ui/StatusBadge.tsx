import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  text: string;
  size?: 'sm' | 'md';
}

const statusClasses = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-gray-100 text-gray-700 border-gray-200',
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  text,
  size = 'sm',
}) => {
  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${statusClasses[status]} ${sizeClasses[size]}`}
    >
      {text}
    </span>
  );
};

export default StatusBadge;
