

/**
 * CalendarStore - Manages working calendars
 */



import type {
  WorkingCalendar,
  Holiday,
  CalendarException,
  CalendarAssignment
} from '../types/advanced-features';
import { getDefaultCalendar } from '../utils/calendar-utils';

export class CalendarStore {
  private calendars: WorkingCalendar[] = [];
  private assignments: CalendarAssignment[] = [];
  private activeCalendarId: string | null = null;
  private listeners = new Set<() => void>();

  constructor(initialCalendars: WorkingCalendar[] = []) {
    this.calendars = initialCalendars.length > 0 ? initialCalendars : [getDefaultCalendar()];
    this.activeCalendarId = this.calendars[0]?.id ?? null;
  }

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Calendar management
  getCalendars(): WorkingCalendar[] {
    return this.calendars;
  }

  getCalendarById(id: string): WorkingCalendar | undefined {
    return this.calendars.find(c => c.id === id);
  }

  getActiveCalendar(): WorkingCalendar | null {
    if (!this.activeCalendarId) return null;
    return this.getCalendarById(this.activeCalendarId) ?? null;
  }

  setActiveCalendar(id: string) {
    if (this.calendars.find(c => c.id === id)) {
      this.activeCalendarId = id;
      this.notify();
    }
  }

  addCalendar(calendar: WorkingCalendar) {
    this.calendars.push(calendar);
    this.notify();
  }

  updateCalendar(id: string, updates: Partial<WorkingCalendar>) {
    const index = this.calendars.findIndex(c => c.id === id);
    if (index !== -1) {
      this.calendars[index] = { ...this.calendars[index], ...updates };
      this.notify();
    }
  }

  deleteCalendar(id: string) {
    // Don't delete if it's the only calendar or active calendar
    if (this.calendars.length === 1 || id === this.activeCalendarId) {
      return;
    }
    this.calendars = this.calendars.filter(c => c.id !== id);
    this.notify();
  }

  // Holiday management
  addHoliday(calendarId: string, holiday: Holiday) {
    const calendar = this.getCalendarById(calendarId);
    if (calendar) {
      calendar.holidays.push(holiday);
      this.notify();
    }
  }

  updateHoliday(calendarId: string, holidayId: string, updates: Partial<Holiday>) {
    const calendar = this.getCalendarById(calendarId);
    if (calendar) {
      const index = calendar.holidays.findIndex(h => h.id === holidayId);
      if (index !== -1) {
        calendar.holidays[index] = { ...calendar.holidays[index], ...updates };
        this.notify();
      }
    }
  }

  removeHoliday(calendarId: string, holidayId: string) {
    const calendar = this.getCalendarById(calendarId);
    if (calendar) {
      calendar.holidays = calendar.holidays.filter(h => h.id !== holidayId);
      this.notify();
    }
  }

  // Exception management
  addException(calendarId: string, exception: CalendarException) {
    const calendar = this.getCalendarById(calendarId);
    if (calendar) {
      calendar.exceptions.push(exception);
      this.notify();
    }
  }

  removeException(calendarId: string, exceptionId: string) {
    const calendar = this.getCalendarById(calendarId);
    if (calendar) {
      calendar.exceptions = calendar.exceptions.filter(e => e.id !== exceptionId);
      this.notify();
    }
  }

  // Assignment management
  assignCalendar(assignment: CalendarAssignment) {
    // Remove existing assignment for this entity
    this.assignments = this.assignments.filter(
      a => !(a.entityId === assignment.entityId && a.entityType === assignment.entityType)
    );
    this.assignments.push(assignment);
    this.notify();
  }

  getCalendarForEntity(entityId: string, entityType: 'task' | 'resource'): WorkingCalendar | null {
    const assignment = this.assignments.find(
      a => a.entityId === entityId && a.entityType === entityType
    );

    if (assignment) {
      return this.getCalendarById(assignment.calendarId) ?? this.getActiveCalendar();
    }

    return this.getActiveCalendar();
  }

  // Clone calendar
  cloneCalendar(id: string, newName: string): WorkingCalendar | null {
    const original = this.getCalendarById(id);
    if (!original) return null;

    const cloned: WorkingCalendar = {
      ...JSON.parse(JSON.stringify(original)),
      id: `calendar-${Date.now()}`,
      name: newName
    };

    this.calendars.push(cloned);
    this.notify();

    return cloned;
  }
}

