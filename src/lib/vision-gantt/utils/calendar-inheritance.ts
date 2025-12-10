import type { WorkingCalendar } from '../types/advanced-features';
import type { Task } from '../types';
import type { CalendarStore } from '../stores/calendar-store';

export interface CalendarInheritanceContext {
  resourceCalendarId?: string | null;
  activityCalendarId?: string | null;
  projectCalendarId?: string | null;
}

export interface ResolvedCalendar {
  calendar: WorkingCalendar;
  source: 'resource' | 'activity' | 'project' | 'default';
  sourceId?: string;
}

export function resolveEffectiveCalendar(
  context: CalendarInheritanceContext,
  calendarStore: CalendarStore
): ResolvedCalendar {
  if (context.resourceCalendarId) {
    const resourceCal = calendarStore.getCalendarById(context.resourceCalendarId);
    if (resourceCal) {
      return {
        calendar: resourceCal,
        source: 'resource',
        sourceId: context.resourceCalendarId
      };
    }
  }

  if (context.activityCalendarId) {
    const activityCal = calendarStore.getCalendarById(context.activityCalendarId);
    if (activityCal) {
      return {
        calendar: activityCal,
        source: 'activity',
        sourceId: context.activityCalendarId
      };
    }
  }

  if (context.projectCalendarId) {
    const projectCal = calendarStore.getCalendarById(context.projectCalendarId);
    if (projectCal) {
      return {
        calendar: projectCal,
        source: 'project',
        sourceId: context.projectCalendarId
      };
    }
  }

  const defaultCalendar = calendarStore.getActiveCalendar();
  if (defaultCalendar) {
    return {
      calendar: defaultCalendar,
      source: 'default',
      sourceId: defaultCalendar.id
    };
  }

  throw new Error('No calendar available');
}

export function getCalendarForResourceAllocation(
  resourceCalendarId: string | undefined | null,
  task: Task | { calendarId?: string },
  calendarStore: CalendarStore,
  projectCalendarId?: string
): ResolvedCalendar {
  return resolveEffectiveCalendar(
    {
      resourceCalendarId,
      activityCalendarId: task.calendarId,
      projectCalendarId
    },
    calendarStore
  );
}

export function getCalendarInheritanceLabel(source: ResolvedCalendar['source']): string {
  switch (source) {
    case 'resource':
      return 'Calendário do Recurso';
    case 'activity':
      return 'Herdado da Atividade';
    case 'project':
      return 'Herdado do Projeto';
    case 'default':
      return 'Calendário Padrão';
  }
}

export function getCalendarInheritanceBadgeColor(source: ResolvedCalendar['source']): string {
  switch (source) {
    case 'resource':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'activity':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'project':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'default':
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}
