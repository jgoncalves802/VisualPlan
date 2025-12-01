
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
  wbsLevel?: number; // Level in WBS hierarchy
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
  
  // ============================================================================
  // PRIMAVERA P6 FIELDS
  // ============================================================================
  
  // Baseline Fields (Section 2)
  blStartDate?: Date; // Baseline Start Date
  blFinishDate?: Date; // Baseline Finish Date
  blDuration?: number; // Baseline Duration (days)
  blCost?: number; // Baseline Cost
  blWork?: number; // Baseline Work (hours)
  startVariance?: number; // Start Variance (days) = actualStart - blStart
  finishVariance?: number; // Finish Variance (days) = actualFinish - blFinish
  durationVariance?: number; // Duration Variance (days)
  costVariance?: number; // Cost Variance
  workVariance?: number; // Work Variance
  
  // Activity Codes (Section 7)
  activityCode?: string; // Primary activity code value
  activityCodeType?: string; // Activity code type (Discipline, Area, Phase)
  discipline?: string; // Discipline code (Civil, Mechanical, Electrical)
  area?: string; // Area/Location code
  phase?: string; // Phase code
  responsibleContractor?: string; // Responsible contractor
  workType?: string; // Type of work (Fabrication, Assembly, Test)
  
  // Resource Fields (Section 3)
  resourceName?: string; // Primary resource name
  resourceRole?: string; // Resource role
  resourceUnits?: number; // Resource units (%)
  resourceType?: 'labor' | 'nonlabor' | 'material'; // Resource type
  
  // EVM Fields (Section 4)
  bcws?: number; // Budget Cost Work Scheduled (PV - Planned Value)
  bcwp?: number; // Budget Cost Work Performed (EV - Earned Value)
  acwp?: number; // Actual Cost Work Performed (AC - Actual Cost)
  bac?: number; // Budget at Completion
  eac?: number; // Estimate at Completion = BAC / CPI
  etc?: number; // Estimate to Complete = EAC - ACWP
  vac?: number; // Variance at Completion = BAC - EAC
  cpi?: number; // Cost Performance Index = BCWP / ACWP
  spi?: number; // Schedule Performance Index = BCWP / BCWS
  tcpi?: number; // To-Complete Performance Index
  csi?: number; // Cost Schedule Index = CPI * SPI
  evTechnique?: 'percent' | '0_100' | '50_50' | 'milestone' | 'duration' | 'physical' | 'weighted';
  performancePctComplete?: number; // Performance % Complete based on EVM
  
  // Critical Path Fields
  totalFloat?: number; // Total Float (days)
  freeFloat?: number; // Free Float (days)
  isCritical?: boolean; // Is on critical path
  isNearCritical?: boolean; // Is near-critical (TF <= 5 days)
  earlyStart?: Date; // Early Start Date
  earlyFinish?: Date; // Early Finish Date
  lateStart?: Date; // Late Start Date
  lateFinish?: Date; // Late Finish Date
  
  // Constraint Fields
  constraintType?: 'asap' | 'alap' | 'mso' | 'mfo' | 'snet' | 'snlt' | 'fnet' | 'fnlt';
  constraintDate?: Date;
  deadline?: Date;
  
  // Additional P6 Fields
  calendarId?: string; // Calendar ID
  cwpCode?: string; // Construction Work Package
  iwpCode?: string; // Installation Work Package
  actualStart?: Date; // Actual Start Date
  actualFinish?: Date; // Actual Finish Date
  remainingDuration?: number; // Remaining Duration
  remainingWork?: number; // Remaining Work (hours)
  actualWork?: number; // Actual Work (hours)
  plannedWork?: number; // Planned Work (hours)
  
  // EPS (Enterprise Project Structure) Fields - Section 1
  epsId?: string; // EPS Node ID
  epsName?: string; // EPS Node Name
  projectId?: string; // Project ID
  projectName?: string; // Project Name
  projectCode?: string; // Project Code (Codigo)
  projectManager?: string; // Responsible Manager
  
  // Baseline Management (extended)
  baselineId?: string; // Current baseline ID
  baselineNumber?: number; // Baseline number (1, 2, 3...)
  baselineType?: 'project' | 'user' | 'initial' | 'current';
  
  // Cost Fields
  plannedCost?: number; // Custo Planejado
  actualCost?: number; // Custo Real
  plannedValue?: number; // Valor Planejado
  actualValue?: number; // Valor Real
  unitCost?: number; // Custo Unitário
  plannedQuantity?: number; // Quantidade Planejada
  actualQuantity?: number; // Quantidade Real
  unitOfMeasure?: string; // Unidade de Medida (m², m³, un)
  
  // Duration fields
  durationHours?: number; // Duração em horas
  durationUnit?: 'hours' | 'days'; // Unidade de tempo
  
  // Sector/Department
  sectorId?: string; // ID do Setor
  sectorName?: string; // Nome do Setor
}

// ============================================================================
// EPS (Enterprise Project Structure) TYPES
// ============================================================================

export interface EPSNode {
  id: string;
  name: string;
  code?: string;
  parentId?: string | null;
  level: number;
  ownerId?: string; // Responsible OBS node
  children?: EPSNode[];
}

// ============================================================================
// BASELINE TYPES
// ============================================================================

export interface Baseline {
  id: string;
  projectId: string;
  name: string;
  number: number; // Baseline number (1, 2, 3...)
  type: 'project' | 'user' | 'initial' | 'current';
  createdAt: Date;
  createdBy?: string;
  description?: string;
  isActive: boolean;
}

export interface BaselineTask {
  id: string;
  baselineId: string;
  taskId: string;
  startDate: Date;
  finishDate: Date;
  duration: number;
  cost?: number;
  work?: number;
}

// ============================================================================
// ACTIVITY CODE TYPES
// ============================================================================

export interface ActivityCodeType {
  id: string;
  name: string;
  description?: string;
  scope: 'global' | 'project' | 'eps';
  scopeId?: string; // Project or EPS ID if scoped
  maxLength?: number;
  isSecure?: boolean;
}

export interface ActivityCodeValue {
  id: string;
  typeId: string;
  value: string;
  description?: string;
  parentId?: string | null;
  color?: string;
  sortOrder?: number;
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
  // P6 Additional Fields
  lagType?: 'fixed' | 'variable'; // Lag type
  driving?: boolean; // Is this dependency on the critical path
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
  
  // P6 Resource Fields (Section 3)
  resourceType?: 'labor' | 'nonlabor' | 'material'; // Resource type
  calendarId?: string; // Calendar ID for this resource
  maxUnits?: number; // Maximum available units (%)
  unitOfMeasure?: string; // Unit of measure (m3, Ton, Hr, Un)
  unitAbbreviation?: string; // Unit abbreviation
  
  // Role Fields (Section 3.3)
  roleId?: string; // Role identifier
  roleName?: string; // Role name
  roleRate?: number; // Standard cost rate for role
  roleMaxUnits?: number; // Max units available for role
  skills?: string[]; // Required competencies
  
  // Resource Curve (Section 3.2)
  curveType?: 'uniform' | 'triangular' | 'bell' | 'front_loaded' | 'back_loaded';
  curveData?: number[]; // Custom curve data points
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
