

/**
 * Calendar and Constraint Utilities
 * RF-L17 to RF-L19: Working Calendars and Complex Constraints
 */

import {
  addDays,
  addHours,
  differenceInDays,
  differenceInHours,
  eachDayOfInterval,
  isWithinInterval,
  startOfDay,
  endOfDay,
  format,
  parse,
  getDay
} from 'date-fns';
import type {
  WorkingCalendar,
  WorkingDay,
  WorkingHours,
  Holiday,
  CalendarException,
  TaskConstraint,
  TaskConstraintType,
  ConstraintViolation,
  WorkingTimeResult,
  DateRange
} from '../types/advanced-features';
import type { Task } from '../types';

/**
 * Check if a date is a working day according to calendar
 */
export function isWorkingDay(
  date: Date,
  calendar: WorkingCalendar
): boolean {
  const dayOfWeek = getDay(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  // Check exceptions first (they override normal working days)
  const exception = calendar.exceptions.find(ex =>
    isWithinInterval(date, { start: startOfDay(ex.startDate), end: endOfDay(ex.endDate) })
  );

  if (exception) {
    return exception.isWorking;
  }

  // Check holidays
  const holiday = calendar.holidays.find(h => {
    const holidayDate = startOfDay(h.date);
    const checkDate = startOfDay(date);
    return holidayDate.getTime() === checkDate.getTime();
  });

  if (holiday) {
    return false;
  }

  // Check normal working day configuration
  const workingDay = calendar.workingDays.find(wd => wd.dayOfWeek === dayOfWeek);
  return workingDay ? workingDay.isWorking : false;
}

/**
 * Get working hours for a specific date
 */
export function getWorkingHours(
  date: Date,
  calendar: WorkingCalendar
): WorkingHours[] {
  const dayOfWeek = getDay(date) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

  // Check exceptions first
  const exception = calendar.exceptions.find(ex =>
    isWithinInterval(date, { start: startOfDay(ex.startDate), end: endOfDay(ex.endDate) })
  );

  if (exception && exception.workingHours) {
    return exception.workingHours;
  }

  // Check normal working day configuration
  const workingDay = calendar.workingDays.find(wd => wd.dayOfWeek === dayOfWeek);
  
  if (workingDay && workingDay.workingHours && workingDay.workingHours.length > 0) {
    return workingDay.workingHours;
  }

  // Return default working hours
  return [{
    startTime: calendar.defaultStartTime,
    endTime: calendar.defaultEndTime
  }];
}

/**
 * Calculate total working hours in a date range
 */
export function calculateWorkingTime(
  startDate: Date,
  endDate: Date,
  calendar: WorkingCalendar
): WorkingTimeResult {
  const dates = eachDayOfInterval({ start: startDate, end: endDate });
  const workingDates: Date[] = [];
  const nonWorkingDates: Date[] = [];
  let totalHours = 0;

  dates.forEach(date => {
    if (isWorkingDay(date, calendar)) {
      workingDates.push(date);
      const hours = getWorkingHours(date, calendar);
      hours.forEach(period => {
        const start = parse(period.startTime, 'HH:mm', date);
        const end = parse(period.endTime, 'HH:mm', date);
        totalHours += differenceInHours(end, start);
      });
    } else {
      nonWorkingDates.push(date);
    }
  });

  return {
    totalHours,
    totalDays: workingDates.length,
    workingDates,
    nonWorkingDates
  };
}

/**
 * Add working days to a date (skipping non-working days)
 */
export function addWorkingDays(
  date: Date,
  days: number,
  calendar: WorkingCalendar
): Date {
  let currentDate = new Date(date);
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;

  while (remainingDays > 0) {
    currentDate = addDays(currentDate, direction);
    if (isWorkingDay(currentDate, calendar)) {
      remainingDays--;
    }
  }

  return currentDate;
}

/**
 * Get next working day
 */
export function getNextWorkingDay(
  date: Date,
  calendar: WorkingCalendar
): Date {
  let nextDate = addDays(date, 1);
  while (!isWorkingDay(nextDate, calendar)) {
    nextDate = addDays(nextDate, 1);
  }
  return nextDate;
}

/**
 * Get previous working day
 */
export function getPreviousWorkingDay(
  date: Date,
  calendar: WorkingCalendar
): Date {
  let prevDate = addDays(date, -1);
  while (!isWorkingDay(prevDate, calendar)) {
    prevDate = addDays(prevDate, -1);
  }
  return prevDate;
}

/**
 * Validate task constraint
 */
export function validateConstraint(
  task: Task,
  constraint: TaskConstraint,
  calendar?: WorkingCalendar
): ConstraintViolation | null {
  if (!constraint.date) {
    // Constraints like ASAP, ALAP don't have specific dates
    return null;
  }

  let violation = 0;
  let scheduledDate: Date;

  switch (constraint.type) {
    case 'SNET': // Start No Earlier Than
      scheduledDate = task.startDate;
      if (scheduledDate < constraint.date) {
        violation = differenceInDays(constraint.date, scheduledDate);
      }
      break;

    case 'SNLT': // Start No Later Than
      scheduledDate = task.startDate;
      if (scheduledDate > constraint.date) {
        violation = differenceInDays(scheduledDate, constraint.date);
      }
      break;

    case 'FNET': // Finish No Earlier Than
      scheduledDate = task.endDate;
      if (scheduledDate < constraint.date) {
        violation = differenceInDays(constraint.date, scheduledDate);
      }
      break;

    case 'FNLT': // Finish No Later Than
      scheduledDate = task.endDate;
      if (scheduledDate > constraint.date) {
        violation = differenceInDays(scheduledDate, constraint.date);
      }
      break;

    case 'MSO': // Must Start On
      scheduledDate = task.startDate;
      violation = Math.abs(differenceInDays(scheduledDate, constraint.date));
      break;

    case 'MFO': // Must Finish On
      scheduledDate = task.endDate;
      violation = Math.abs(differenceInDays(scheduledDate, constraint.date));
      break;

    default:
      return null;
  }

  if (violation > 0) {
    // Check if within tolerance
    if (constraint.violationTolerance && violation <= constraint.violationTolerance) {
      return null;
    }

    const severity: ConstraintViolation['severity'] =
      constraint.type === 'MSO' || constraint.type === 'MFO' ? 'critical' :
      violation > 7 ? 'error' : 'warning';

    return {
      id: `violation-${task.id}-${constraint.type}`,
      constraintType: constraint.type,
      taskId: task.id,
      taskName: task.name,
      scheduledDate: scheduledDate!,
      constraintDate: constraint.date,
      violation,
      severity,
      canAutoResolve: constraint.type !== 'MSO' && constraint.type !== 'MFO',
      suggestedFix: generateConstraintFix(constraint.type, violation)
    };
  }

  return null;
}

/**
 * Generate suggested fix for constraint violation
 */
function generateConstraintFix(
  constraintType: TaskConstraintType,
  violation: number
): string {
  switch (constraintType) {
    case 'SNET':
      return `Delay task start by ${violation} day(s)`;
    case 'SNLT':
      return `Move task start earlier by ${violation} day(s)`;
    case 'FNET':
      return `Delay task finish by ${violation} day(s) or reduce duration`;
    case 'FNLT':
      return `Move task finish earlier by ${violation} day(s) or reduce duration`;
    case 'MSO':
      return `Task must start exactly on the constraint date`;
    case 'MFO':
      return `Task must finish exactly on the constraint date`;
    default:
      return 'Adjust task dates to meet constraint';
  }
}

/**
 * Apply constraint to task (auto-resolution)
 */
export function applyConstraint(
  task: Task,
  constraint: TaskConstraint,
  calendar?: WorkingCalendar
): Task {
  if (!constraint.date) {
    return task;
  }

  const adjustedTask = { ...task };
  const duration = differenceInDays(task.endDate, task.startDate);

  switch (constraint.type) {
    case 'SNET': // Start No Earlier Than
      if (task.startDate < constraint.date) {
        adjustedTask.startDate = constraint.date;
        adjustedTask.endDate = addDays(constraint.date, duration);
      }
      break;

    case 'SNLT': // Start No Later Than
      if (task.startDate > constraint.date) {
        adjustedTask.startDate = constraint.date;
        adjustedTask.endDate = addDays(constraint.date, duration);
      }
      break;

    case 'FNET': // Finish No Earlier Than
      if (task.endDate < constraint.date) {
        adjustedTask.endDate = constraint.date;
        adjustedTask.startDate = addDays(constraint.date, -duration);
      }
      break;

    case 'FNLT': // Finish No Later Than
      if (task.endDate > constraint.date) {
        adjustedTask.endDate = constraint.date;
        adjustedTask.startDate = addDays(constraint.date, -duration);
      }
      break;

    case 'MSO': // Must Start On
      adjustedTask.startDate = constraint.date;
      adjustedTask.endDate = addDays(constraint.date, duration);
      break;

    case 'MFO': // Must Finish On
      adjustedTask.endDate = constraint.date;
      adjustedTask.startDate = addDays(constraint.date, -duration);
      break;
  }

  // Adjust for working days if calendar is provided
  if (calendar) {
    if (!isWorkingDay(adjustedTask.startDate, calendar)) {
      adjustedTask.startDate = getNextWorkingDay(adjustedTask.startDate, calendar);
    }
    if (!isWorkingDay(adjustedTask.endDate, calendar)) {
      adjustedTask.endDate = getPreviousWorkingDay(adjustedTask.endDate, calendar);
    }
  }

  return adjustedTask;
}

/**
 * Get default working calendar (Monday-Friday, 9-5)
 */
export function getDefaultCalendar(): WorkingCalendar {
  return {
    id: 'default',
    name: 'Standard Working Calendar',
    description: 'Monday to Friday, 9:00 AM to 5:00 PM',
    workingDays: [
      { dayOfWeek: 0, isWorking: false }, // Sunday
      { dayOfWeek: 1, isWorking: true },  // Monday
      { dayOfWeek: 2, isWorking: true },  // Tuesday
      { dayOfWeek: 3, isWorking: true },  // Wednesday
      { dayOfWeek: 4, isWorking: true },  // Thursday
      { dayOfWeek: 5, isWorking: true },  // Friday
      { dayOfWeek: 6, isWorking: false }, // Saturday
    ],
    holidays: [],
    exceptions: [],
    defaultStartTime: '09:00',
    defaultEndTime: '17:00'
  };
}

/**
 * Calculate end date from start date + working days duration
 * Uses inclusive model: duration of 1 day means start = end
 */
export function computeEndFromDuration(
  startDate: Date,
  durationWorkingDays: number,
  calendar: WorkingCalendar
): Date {
  if (durationWorkingDays <= 0) {
    return startDate;
  }
  
  // Snap start to a working day if needed
  let currentDate = isWorkingDay(startDate, calendar) 
    ? new Date(startDate)
    : getNextWorkingDay(startDate, calendar);
  
  // Add (duration - 1) working days (inclusive model)
  let remainingDays = durationWorkingDays - 1;
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, 1);
    if (isWorkingDay(currentDate, calendar)) {
      remainingDays--;
    }
  }
  
  return currentDate;
}

/**
 * Calculate working days duration between two dates (inclusive)
 */
export function computeWorkingDuration(
  startDate: Date,
  endDate: Date,
  calendar: WorkingCalendar
): number {
  if (endDate < startDate) {
    return 0;
  }
  
  let count = 0;
  let current = new Date(startDate);
  
  while (current <= endDate) {
    if (isWorkingDay(current, calendar)) {
      count++;
    }
    current = addDays(current, 1);
  }
  
  return Math.max(1, count);
}

/**
 * Snap a date to the nearest working day
 * direction: 'next' finds next working day, 'prev' finds previous, 'nearest' finds closest
 */
export function snapToWorkingDay(
  date: Date,
  calendar: WorkingCalendar,
  direction: 'next' | 'prev' | 'nearest' = 'next'
): Date {
  if (isWorkingDay(date, calendar)) {
    return date;
  }
  
  if (direction === 'next') {
    return getNextWorkingDay(date, calendar);
  } else if (direction === 'prev') {
    return getPreviousWorkingDay(date, calendar);
  } else {
    // Find nearest
    const next = getNextWorkingDay(date, calendar);
    const prev = getPreviousWorkingDay(date, calendar);
    const diffToNext = differenceInDays(next, date);
    const diffToPrev = differenceInDays(date, prev);
    return diffToNext <= diffToPrev ? next : prev;
  }
}

/**
 * Compute start date from end date - working days duration (backward scheduling)
 * Uses inclusive model: duration of 1 day means start = end
 */
export function computeStartFromDuration(
  endDate: Date,
  durationWorkingDays: number,
  calendar: WorkingCalendar
): Date {
  if (durationWorkingDays <= 0) {
    return endDate;
  }
  
  // Snap end to a working day if needed
  let currentDate = isWorkingDay(endDate, calendar)
    ? new Date(endDate)
    : getPreviousWorkingDay(endDate, calendar);
  
  // Subtract (duration - 1) working days (inclusive model)
  let remainingDays = durationWorkingDays - 1;
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, -1);
    if (isWorkingDay(currentDate, calendar)) {
      remainingDays--;
    }
  }
  
  return currentDate;
}

