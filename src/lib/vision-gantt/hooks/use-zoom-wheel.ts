import { useCallback, useEffect, useRef } from 'react';
import type { ViewPreset } from '../types';

interface UseZoomWheelProps {
  containerRef: React.RefObject<HTMLElement>;
  currentPreset: ViewPreset;
  onPresetChange: (preset: ViewPreset) => void;
  enabled?: boolean;
}

const ZOOM_PRESETS: ViewPreset[] = ['year', 'quarter', 'month', 'week', 'day'];

export function useZoomWheel({
  containerRef,
  currentPreset,
  onPresetChange,
  enabled = true
}: UseZoomWheelProps) {
  const lastWheelTime = useRef<number>(0);
  const debounceMs = 150;

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!enabled || !e.altKey) return;

    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastWheelTime.current < debounceMs) return;
    lastWheelTime.current = now;

    const currentIndex = ZOOM_PRESETS.indexOf(currentPreset);
    if (currentIndex === -1) return;

    let newIndex: number;
    if (e.deltaY < 0) {
      newIndex = Math.min(currentIndex + 1, ZOOM_PRESETS.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    if (newIndex !== currentIndex) {
      onPresetChange(ZOOM_PRESETS[newIndex]);
    }
  }, [enabled, currentPreset, onPresetChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [containerRef, handleWheel, enabled]);

  return {
    zoomPresets: ZOOM_PRESETS,
    currentZoomLevel: ZOOM_PRESETS.indexOf(currentPreset),
    minZoomLevel: 0,
    maxZoomLevel: ZOOM_PRESETS.length - 1
  };
}
