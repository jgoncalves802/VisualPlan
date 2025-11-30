
/**
 * VisionGantt Library - Main Entry Point
 * 
 * A high-performance React Gantt Chart library inspired by Bryntum Scheduler Pro
 * 
 * @example
 * ```tsx
 * import { GanttChart } from '@/lib/vision-gantt';
 * 
 * function App() {
 *   return (
 *     <GanttChart
 *       tasks={tasks}
 *       dependencies={dependencies}
 *       viewPreset="month"
 *       onTaskUpdate={(task) => console.log('Task updated:', task)}
 *     />
 *   );
 * }
 * ```
 */

// Main components
export { GanttChart } from './components/gantt-chart';
export type { GanttChartProps } from './components/gantt-chart';

// Sub-components (for advanced usage)
export {
  GanttGrid,
  GanttTimeline,
  TaskBar,
  DependencyLine,
  TimelineHeader,
  ZoomControl
} from './components';

// Types
export type {
  Task,
  Dependency,
  Resource,
  Assignment,
  ViewPreset,
  ColumnConfig,
  GanttConfig,
  TaskStatus,
  DependencyType,
  TimelineRange,
  TaskBarPosition
} from './types';

// Stores (for advanced state management)
export {
  TaskStore,
  DependencyStore,
  ResourceStore,
  ScenarioStore,
  CalendarStore,
  ConstraintStore
} from './stores';

// Utilities (for custom implementations)
export * from './utils';

// Hooks (for custom components)
export {
  useGanttStores,
  useDragDrop,
  useResize,
  useDependencyCreation,
  useVirtualScroll,
  useTimelineRange
} from './hooks';

// Configuration
export { VIEW_PRESETS, getViewPreset, getPixelsPerDay } from './config/view-presets';
export { DEFAULT_COLUMNS } from './config/default-columns';

// Theme System
export {
  P6_CLASSIC_THEME,
  DARK_THEME,
  CONSTRUCTION_THEME,
  AVAILABLE_THEMES,
  getThemeByName,
  DEFAULT_ACTIVITY_CODE_COLORS
} from './config/theme';
export type { GanttTheme, GanttThemeColors, ActivityCodeColor } from './config/theme';

// Theme Context
export { GanttThemeProvider, useGanttTheme } from './context/theme-context';
