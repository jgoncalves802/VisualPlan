
/**
 * VisionGantt Library - Core Type Definitions
 * Based on Bryntum Scheduler Pro design patterns
 */

// ============================================================================
// TASK TYPES
// ============================================================================

export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'on_hold';

export interface Task {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  duration?: number; // in days
  progress: number; // 0-100
  status: TaskStatus;
  parentId?: string | null;
  children?: Task[];
  expanded?: boolean;
  level?: number;
  // WBS properties
  wbs?: string; // Work Breakdown Structure code (e.g., "1.2.3")
  isGroup?: boolean; // MS Project style group header (MARCOS, EXECUÇÃO, etc.)
  // Resource assignment
  assignedResources?: string[]; // Array of resource IDs
  // Additional metadata
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  isMilestone?: boolean;
  // UI state
  isSelected?: boolean;
  isDragging?: boolean;
}

// ============================================================================
// DEPENDENCY TYPES
// ============================================================================

export type DependencyType = 'FS' | 'SS' | 'FF' | 'SF';
// FS: Finish-to-Start (default)
// SS: Start-to-Start
// FF: Finish-to-Finish
// SF: Start-to-Finish

export interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
  lag?: number; // Lag in days (can be negative for lead time)
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export interface Resource {
  id: string;
  name: string;
  role?: string;
  email?: string;
  avatar?: string;
  capacity?: number; // Hours per day
  costRate?: number; // Cost per hour
  costType?: 'hour' | 'day' | 'fixed'; // Cost calculation type
  totalCost?: number; // Total cost for resource
}

export interface Assignment {
  id: string;
  taskId: string;
  resourceId: string;
  units?: number; // Percentage of resource allocation (0-100)
}

// ============================================================================
// STORE TYPES
// ============================================================================

export type StoreListener<T> = (data: T[]) => void;

export interface Store<T> {
  data: T[];
  listeners: Set<StoreListener<T>>;
  subscribe: (listener: StoreListener<T>) => () => void;
  notify: () => void;
  getById: (id: string) => T | undefined;
  add: (item: T) => void;
  update: (id: string, updates: Partial<T>) => void;
  remove: (id: string) => void;
  getAll: () => T[];
}

// ============================================================================
// COLUMN CONFIGURATION
// ============================================================================

export interface ColumnConfig {
  field: keyof Task | string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  renderer?: (value: any, task: Task) => React.ReactNode;
  editable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
}

// ============================================================================
// VIEW PRESET (ZOOM LEVELS)
// ============================================================================

export type ViewPreset = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export type TimeUnit = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TimeScaleLayer {
  unit: TimeUnit;
  format: string; // date-fns format string
  increment?: number; // Number of units per tick (default: 1)
  align?: 'left' | 'center' | 'right'; // Text alignment in header
  showSeparators?: boolean; // Show vertical separators
  height?: number; // Layer height in pixels (default: 32)
}

export interface ViewPresetConfig {
  name: ViewPreset;
  tickWidth: number; // pixels per time unit
  timeUnit: TimeUnit;
  headerLevels: TimeScaleLayer[];
  shiftIncrement: number; // how many units to shift on pan
  columnWidth?: number; // Override default column width
}

// ============================================================================
// GANTT CHART CONFIGURATION
// ============================================================================

import type { WorkingCalendar } from './advanced-features';

export interface GanttConfig {
  // Data
  tasks: Task[];
  dependencies: Dependency[];
  resources?: Resource[];
  calendars?: WorkingCalendar[];
  
  // View settings
  viewPreset?: ViewPreset;
  columns?: ColumnConfig[];
  
  // Appearance
  rowHeight?: number;
  barHeight?: number;
  barRadius?: number;
  gridWidth?: number;
  
  // Features
  enableDragDrop?: boolean;
  enableResize?: boolean;
  enableDependencyCreation?: boolean;
  enableZoom?: boolean;
  
  // Callbacks
  onTaskUpdate?: (task: Task) => void;
  onTaskClick?: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
  onDependencyCreate?: (dependency: Dependency) => void;
  onDependencyDelete?: (dependencyId: string) => void;
  onViewPresetChange?: (preset: ViewPreset) => void;
}

// ============================================================================
// TIMELINE RENDERING TYPES
// ============================================================================

export interface TimelineRange {
  startDate: Date;
  endDate: Date;
}

export interface TaskBarPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DependencyPath {
  id: string;
  fromTask: Task;
  toTask: Task;
  type: DependencyType;
  path: string; // SVG path data
}

// ============================================================================
// DRAG & DROP TYPES
// ============================================================================

export interface DragState {
  isDragging: boolean;
  taskId?: string;
  startX?: number;
  startY?: number;
  offsetX?: number;
  offsetDate?: Date;
}

export interface ResizeState {
  isResizing: boolean;
  taskId?: string;
  edge?: 'left' | 'right';
  originalStartDate?: Date;
  originalEndDate?: Date;
}

// ============================================================================
// DEPENDENCY CREATION TYPES
// ============================================================================

export interface DependencyCreationState {
  isCreating: boolean;
  fromTaskId?: string;
  tempPath?: { x1: number; y1: number; x2: number; y2: number };
}

// ============================================================================
// VIRTUAL SCROLLING TYPES
// ============================================================================

export interface VirtualScrollState {
  scrollTop: number;
  scrollLeft: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
  overscan: number; // number of items to render outside viewport
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
