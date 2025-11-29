import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ 
  id, 
  checked, 
  defaultChecked, 
  onCheckedChange, 
  disabled = false,
  className = '' 
}: CheckboxProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked || false);
  
  const isChecked = checked !== undefined ? checked : internalChecked;
  
  const handleChange = () => {
    if (disabled) return;
    const newValue = !isChecked;
    if (onCheckedChange) {
      onCheckedChange(newValue);
    } else {
      setInternalChecked(newValue);
    }
  };

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      disabled={disabled}
      className={`
        h-4 w-4 shrink-0 rounded-sm border border-gray-300 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-50
        ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white'}
        ${className}
      `}
      onClick={handleChange}
    >
      {isChecked && <Check className="h-3 w-3" />}
    </button>
  );
}
