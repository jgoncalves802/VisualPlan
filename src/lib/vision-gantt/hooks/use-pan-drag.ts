/**
 * usePanDrag - Hook for pan/drag navigation in Gantt chart
 * Allows user to click and drag to pan the timeline view
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface PanDragState {
  isPanning: boolean;
  startX: number;
  startY: number;
  startScrollLeft: number;
  startScrollTop: number;
}

interface UsePanDragOptions {
  enabled?: boolean;
  gridScrollRef: React.RefObject<HTMLDivElement>;
  timelineScrollRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function usePanDrag({
  enabled = true,
  gridScrollRef,
  timelineScrollRef,
  containerRef
}: UsePanDragOptions) {
  const [isPanning, setIsPanning] = useState(false);
  const panStateRef = useRef<PanDragState>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0
  });

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (!enabled) return;
    
    // Only start panning with middle mouse button or space+left click
    // Or if target is the timeline background (not a task bar)
    const target = e.target as HTMLElement;
    const isTimelineBackground = 
      target.classList.contains('timeline-content') ||
      target.classList.contains('gantt-timeline') ||
      target.tagName === 'svg' ||
      target.tagName === 'rect';
    
    // Middle mouse button (button 1) for pan
    if (e.button === 1 || (e.button === 0 && isTimelineBackground && e.shiftKey)) {
      e.preventDefault();
      
      const timelineEl = timelineScrollRef.current;
      
      if (!timelineEl) return;
      
      panStateRef.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startScrollLeft: timelineEl.scrollLeft,
        startScrollTop: timelineEl.scrollTop
      };
      
      setIsPanning(true);
      
      // Change cursor
      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  }, [enabled, timelineScrollRef, gridScrollRef, containerRef]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panStateRef.current.isPanning) return;
    
    const deltaX = e.clientX - panStateRef.current.startX;
    const deltaY = e.clientY - panStateRef.current.startY;
    
    const timelineEl = timelineScrollRef.current;
    const gridEl = gridScrollRef.current;
    
    if (timelineEl) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        timelineEl.scrollLeft = panStateRef.current.startScrollLeft - deltaX;
        timelineEl.scrollTop = panStateRef.current.startScrollTop - deltaY;
        
        // Sync grid scroll
        if (gridEl) {
          gridEl.scrollTop = panStateRef.current.startScrollTop - deltaY;
        }
      });
    }
  }, [timelineScrollRef, gridScrollRef]);

  const handleMouseUp = useCallback(() => {
    if (!panStateRef.current.isPanning) return;
    
    panStateRef.current.isPanning = false;
    setIsPanning(false);
    
    // Reset cursor
    if (containerRef.current) {
      containerRef.current.style.cursor = '';
    }
  }, [containerRef]);

  // Attach event listeners
  useEffect(() => {
    if (!enabled) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    // Prevent default middle-click scroll
    const preventMiddleClick = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
      }
    };
    container.addEventListener('auxclick', preventMiddleClick);
    
    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('auxclick', preventMiddleClick);
    };
  }, [enabled, handleMouseDown, handleMouseMove, handleMouseUp, containerRef]);

  return {
    isPanning,
    panProps: {
      style: {
        cursor: isPanning ? 'grabbing' : 'default'
      }
    }
  };
}
