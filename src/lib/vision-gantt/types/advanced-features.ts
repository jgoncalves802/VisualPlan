

/**
 * Advanced Features Type Definitions
 * RF-L06 to RF-L19 requirements
 */

import type { Task, Resource } from './index';

// ============================================================================
// RF-L06 to RF-L10: ADVANCED RESOURCE ALLOCATION
// ============================================================================

/**
 * Resource allocation with time-based units
 */
export interface ResourceAllocation {
  id: string;
  taskId: string;
  resourceId: string;
  units: number; // Percentage (0-100) or hours per day
  startDate: Date;
  endDate: Date;
  type: 'percentage' | 'hours';
  cost?: number; // Cost per hour/day
}

/**
 * Resource availability periods
 */
export interface ResourceAvailability {
  resourceId: string;
  startDate: Date;
  endDate: Date;
  availableUnits: number; // Hours per day or percentage
  reason?: string; // e.g., "Vacation", "Training", "Other project"
}

/**
 * Resource conflict detection
 */
export interface ResourceConflict {
  id: string;
  resourceId: string;
  date: Date;
  allocatedUnits: number;
  availableUnits: number;
  overallocation: number; // Difference
  affectedTasks: string[]; // Task IDs
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Resource leveling options
 */
export interface ResourceLevelingOptions {
  mode: 'automatic' | 'manual';
  strategy: 'delay_tasks' | 'split_tasks' | 'reduce_allocation';
  priority: 'earliest_start' | 'critical_path' | 'task_priority';
  allowTaskSplitting: boolean;
  respectTaskConstraints: boolean;
  maxIterations?: number;
}

/**
 * Resource pool for sharing across projects
 */
export interface ResourcePool {
  id: string;
  name: string;
  resources: Resource[];
  projects: string[]; // Project IDs using this pool
  allocationRules?: {
    allowOverallocation: boolean;
    maxOverallocationPercentage?: number;
    priorityProjects?: string[];
  };
}

// ============================================================================
// RF-L14 to RF-L16: SCENARIO SIMULATION
// ============================================================================

/**
 * Project scenario for what-if analysis
 */
export interface Scenario {
  id: string;
  name: string;
  description?: string;
  baselineDate: Date;
  createdDate: Date;
  status: 'draft' | 'active' | 'archived';
  changes: ScenarioChange[];
  metrics: ScenarioMetrics;
}

/**
 * Changes applied in a scenario
 */
export interface ScenarioChange {
  id: string;
  type: 'task_duration' | 'task_date' | 'resource_allocation' | 'dependency' | 'constraint';
  entityId: string; // Task/Resource/Dependency ID
  field: string;
  originalValue: any;
  newValue: any;
  impact?: {
    affectedTasks: number;
    dateShift: number; // Days
    costDelta: number;
  };
}

/**
 * Scenario performance metrics
 */
export interface ScenarioMetrics {
  totalDuration: number; // Days
  projectEndDate: Date;
  totalCost: number;
  resourceUtilization: number; // Percentage
  criticalPathLength: number; // Days
  riskScore: number; // 0-100
  completionProbability: number; // Percentage
}

/**
 * Scenario comparison result
 */
export interface ScenarioComparison {
  scenarios: Scenario[];
  differences: {
    scenarioId: string;
    durationDelta: number;
    costDelta: number;
    endDateDelta: number; // Days difference
    criticalChanges: string[]; // Description of major changes
  }[];
  recommendations?: string[];
}

// ============================================================================
// RF-L17 to RF-L19: CALENDARS AND CONSTRAINTS
// ============================================================================

/**
 * Working calendar configuration
 */
export interface WorkingCalendar {
  id: string;
  name: string;
  description?: string;
  timeZone?: string;
  workingDays: WorkingDay[];
  holidays: Holiday[];
  exceptions: CalendarException[];
  defaultStartTime: string; // "09:00"
  defaultEndTime: string; // "17:00"
}

/**
 * Working day configuration
 */
export interface WorkingDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Sunday, 6=Saturday
  isWorking: boolean;
  workingHours?: WorkingHours[];
}

/**
 * Working hours in a day
 */
export interface WorkingHours {
  startTime: string; // "09:00"
  endTime: string; // "12:00"
}

/**
 * Holiday definition
 */
export interface Holiday {
  id: string;
  name: string;
  date: Date;
  recurring: boolean; // Annual recurrence
  type: 'public' | 'company' | 'project';
}

/**
 * Calendar exception (override normal working days)
 */
export interface CalendarException {
  id: string;
  startDate: Date;
  endDate: Date;
  isWorking: boolean;
  workingHours?: WorkingHours[];
  reason?: string;
}

/**
 * Task constraint types
 */
export type TaskConstraintType =
  | 'ASAP' // As Soon As Possible (default)
  | 'ALAP' // As Late As Possible
  | 'SNET' // Start No Earlier Than
  | 'SNLT' // Start No Later Than
  | 'FNET' // Finish No Earlier Than
  | 'FNLT' // Finish No Later Than
  | 'MSO'  // Must Start On
  | 'MFO'; // Must Finish On

/**
 * Task constraint
 */
export interface TaskConstraint {
  taskId: string;
  type: TaskConstraintType;
  date?: Date; // Required for date-specific constraints
  priority: number; // 1-10, higher = more important
  violationTolerance?: number; // Days allowed to violate
}

/**
 * Calendar assignment to task or resource
 */
export interface CalendarAssignment {
  entityId: string; // Task or Resource ID
  entityType: 'task' | 'resource';
  calendarId: string;
  effectiveDate?: Date; // When this assignment starts
  priority?: number; // For conflict resolution
}

/**
 * Constraint violation
 */
export interface ConstraintViolation {
  id: string;
  constraintType: TaskConstraintType;
  taskId: string;
  taskName: string;
  scheduledDate: Date;
  constraintDate: Date;
  violation: number; // Days
  severity: 'warning' | 'error' | 'critical';
  canAutoResolve: boolean;
  suggestedFix?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Date range
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Working time calculation result
 */
export interface WorkingTimeResult {
  totalHours: number;
  totalDays: number;
  workingDates: Date[];
  nonWorkingDates: Date[];
}

