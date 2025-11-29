
/**
 * ZoomControl - Controls for changing view preset (zoom level)
 */



import React from 'react';
import type { ViewPreset } from '../types';
import { ZoomIn, ZoomOut, Calendar } from 'lucide-react';

interface ZoomControlProps {
  currentPreset: ViewPreset;
  onPresetChange: (preset: ViewPreset) => void;
}

const presets: { value: ViewPreset; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' }
];

export function ZoomControl({ currentPreset, onPresetChange }: ZoomControlProps) {
  const currentIndex = presets.findIndex((p) => p?.value === currentPreset);

  const handleZoomIn = () => {
    if (currentIndex > 0) {
      onPresetChange(presets[currentIndex - 1].value);
    }
  };

  const handleZoomOut = () => {
    if (currentIndex < presets.length - 1) {
      onPresetChange(presets[currentIndex + 1].value);
    }
  };

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
      {/* Zoom In */}
      <button
        onClick={handleZoomIn}
        disabled={currentIndex === 0}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom In"
        title="Zoom In"
      >
        <ZoomIn size={18} className="text-gray-700" />
      </button>

      {/* Current Preset Dropdown */}
      <div className="flex items-center gap-2 px-2 border-x border-gray-200">
        <Calendar size={16} className="text-gray-500" />
        <select
          value={currentPreset}
          onChange={(e) => onPresetChange(e.target.value as ViewPreset)}
          className="text-sm font-medium text-gray-700 bg-transparent border-none outline-none cursor-pointer"
        >
          {presets.map((preset) => (
            <option key={preset?.value ?? ''} value={preset?.value ?? ''}>
              {preset?.label ?? ''}
            </option>
          ))}
        </select>
      </div>

      {/* Zoom Out */}
      <button
        onClick={handleZoomOut}
        disabled={currentIndex === presets.length - 1}
        className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        aria-label="Zoom Out"
        title="Zoom Out"
      >
        <ZoomOut size={18} className="text-gray-700" />
      </button>
    </div>
  );
}
