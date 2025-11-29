import React from 'react';

interface ProgressProps {
  value?: number;
  max?: number;
  className?: string;
  indicatorClassName?: string;
}

export function Progress({ 
  value = 0, 
  max = 100, 
  className = '',
  indicatorClassName = ''
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={`relative h-4 w-full overflow-hidden rounded-full bg-gray-200 ${className}`}
    >
      <div
        className={`h-full bg-blue-600 transition-all ${indicatorClassName}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
