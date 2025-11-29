
/**
 * Hook for virtual scrolling to improve performance with large datasets
 */



import { useState, useCallback, useEffect, useRef } from 'react';
import type { VirtualScrollState } from '../types';

interface UseVirtualScrollOptions {
  totalItems: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  totalItems,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualScrollOptions) {
  const [scrollState, setScrollState] = useState<VirtualScrollState>({
    scrollTop: 0,
    scrollLeft: 0,
    visibleStartIndex: 0,
    visibleEndIndex: Math.ceil(containerHeight / itemHeight) + overscan,
    overscan
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const scrollLeft = e.currentTarget.scrollLeft;

      const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleEndIndex = Math.min(
        totalItems,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
      );

      setScrollState({
        scrollTop,
        scrollLeft,
        visibleStartIndex,
        visibleEndIndex,
        overscan
      });
    },
    [itemHeight, containerHeight, overscan, totalItems]
  );

  // Update visible range when props change
  useEffect(() => {
    const visibleEndIndex = Math.min(
      totalItems,
      Math.ceil((scrollState.scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    setScrollState((prev) => ({
      ...prev,
      visibleEndIndex
    }));
  }, [totalItems, containerHeight, itemHeight, overscan, scrollState.scrollTop]);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (scrollContainerRef.current) {
        const scrollTop = Math.max(0, index * itemHeight - containerHeight / 2);
        scrollContainerRef.current.scrollTop = scrollTop;
      }
    },
    [itemHeight, containerHeight]
  );

  const visibleItems = {
    start: scrollState.visibleStartIndex,
    end: scrollState.visibleEndIndex,
    count: scrollState.visibleEndIndex - scrollState.visibleStartIndex
  };

  const totalHeight = totalItems * itemHeight;
  const offsetY = scrollState.visibleStartIndex * itemHeight;

  return {
    scrollState,
    scrollContainerRef,
    handleScroll,
    scrollToIndex,
    visibleItems,
    totalHeight,
    offsetY
  };
}
