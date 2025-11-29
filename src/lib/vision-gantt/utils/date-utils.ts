
/**
 * Date utility functions for VisionGantt
 */

import { addDays, addHours, differenceInDays, differenceInHours, startOfDay, startOfHour, startOfWeek, startOfMonth, startOfQuarter, endOfDay, format } from 'date-fns';

/**
 * Calculate duration in days between two dates
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  return Math.max(1, differenceInDays(endOfDay(endDate), startOfDay(startDate)) + 1);
}

/**
 * Add business days to a date (excluding weekends)
 */
export function addBusinessDays(date: Date, days: number): Date {
  let currentDate = new Date(date);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, direction);
    const dayOfWeek = currentDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays--;
    }
  }

  return currentDate;
}

/**
 * Get the start of a time period based on unit
 */
export function getStartOfPeriod(date: Date, unit: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): Date {
  switch (unit) {
    case 'hour':
      return startOfHour(date);
    case 'day':
      return startOfDay(date);
    case 'week':
      return startOfWeek(date, { weekStartsOn: 1 }); // Monday
    case 'month':
      return startOfMonth(date);
    case 'quarter':
      return startOfQuarter(date);
    case 'year':
      return new Date(date.getFullYear(), 0, 1);
    default:
      return startOfDay(date);
  }
}

/**
 * Format date for display based on zoom level
 */
export function formatDateForZoom(date: Date, zoomLevel: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'): string {
  switch (zoomLevel) {
    case 'hour':
      return format(date, 'HH:mm');
    case 'day':
      return format(date, 'MMM d');
    case 'week':
      return format(date, 'MMM d');
    case 'month':
      return format(date, 'MMM yyyy');
    case 'quarter':
      return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
    case 'year':
      return format(date, 'yyyy');
    default:
      return format(date, 'MMM d, yyyy');
  }
}

/**
 * Generate time scale ticks for timeline header
 */
export function generateTimeScale(
  startDate: Date,
  endDate: Date,
  unit: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
  tickWidth: number
): Array<{ date: Date; label: string; x: number }> {
  const ticks: Array<{ date: Date; label: string; x: number }> = [];
  let currentDate = getStartOfPeriod(startDate, unit === 'year' ? 'year' : unit);
  let position = 0;

  while (currentDate <= endDate) {
    ticks.push({
      date: new Date(currentDate),
      label: formatDateForZoom(currentDate, unit),
      x: position
    });

    // Increment based on unit
    switch (unit) {
      case 'hour':
        currentDate = addHours(currentDate, 1);
        position += tickWidth;
        break;
      case 'day':
        currentDate = addDays(currentDate, 1);
        position += tickWidth;
        break;
      case 'week':
        currentDate = addDays(currentDate, 7);
        position += tickWidth;
        break;
      case 'month':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        position += tickWidth;
        break;
      case 'quarter':
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 3, 1);
        position += tickWidth;
        break;
      case 'year':
        currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
        position += tickWidth;
        break;
    }
  }

  return ticks;
}

/**
 * Convert date to X position on timeline
 */
export function dateToX(date: Date, timelineStart: Date, pixelsPerDay: number): number {
  const days = differenceInDays(startOfDay(date), startOfDay(timelineStart));
  return days * pixelsPerDay;
}

/**
 * Convert X position to date on timeline
 */
export function xToDate(x: number, timelineStart: Date, pixelsPerDay: number): Date {
  const days = Math.round(x / pixelsPerDay);
  return addDays(timelineStart, days);
}

/**
 * Snap date to grid (e.g., to nearest hour/day/week)
 */
export function snapToGrid(date: Date, unit: 'hour' | 'day' | 'week' | 'month'): Date {
  return getStartOfPeriod(date, unit);
}
