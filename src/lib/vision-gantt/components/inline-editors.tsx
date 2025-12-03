/**
 * Inline Editors for GanttGrid
 * Provides editable cells for text, dates, numbers, duration, progress, and dependencies
 * 
 * Editors validate values before committing:
 * - Invalid values (NaN, null) are rejected and trigger cancel
 * - Escape key cancels - grid blocks any subsequent blur commits via cancelledRef
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Task } from '../types';

const parseFiniteNumber = (val: string | number | null | undefined): number | undefined => {
  if (val === null || val === undefined || val === '') return undefined;
  const num = typeof val === 'number' ? val : parseFloat(val.toString());
  return Number.isFinite(num) ? num : undefined;
};

const parseValidDate = (val: string | null | undefined): Date | undefined => {
  if (!val || val === '') return undefined;
  const date = new Date(val + 'T00:00:00');
  return isNaN(date.getTime()) ? undefined : date;
};

// Duration unit types and utilities
export type DurationUnit = 'm' | 'h' | 'd' | 'w';

export interface ParsedDuration {
  value: number;
  unit: DurationUnit;
}

// Conversion factors to days
const UNIT_TO_DAYS: Record<DurationUnit, number> = {
  'm': 1 / (8 * 60),  // 1 minute = 1/(8*60) of a work day (8 hour day)
  'h': 1 / 8,         // 1 hour = 1/8 of a work day
  'd': 1,             // 1 day = 1 day
  'w': 5,             // 1 week = 5 work days
};

const UNIT_LABELS: Record<DurationUnit, string> = {
  'm': 'min',
  'h': 'h',
  'd': 'd',
  'w': 'sem',
};

const UNIT_FULL_LABELS: Record<DurationUnit, string> = {
  'm': 'minutos',
  'h': 'horas',
  'd': 'dias',
  'w': 'semanas',
};

/**
 * Parse a duration string with unit (e.g., "7d", "4h", "2w", "30m")
 * If no unit is specified, defaults to days
 */
export function parseDurationString(input: string): ParsedDuration | null {
  if (!input || input.trim() === '') return null;
  
  const normalized = input.trim().toLowerCase().replace(/\s+/g, '');
  
  // Match number followed by optional unit
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([mhdwsem]*)$/);
  if (!match) return null;
  
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  
  let unit: DurationUnit = 'd'; // default to days
  
  const unitStr = match[2];
  if (unitStr) {
    // Handle various unit formats
    if (unitStr === 'm' || unitStr === 'min') {
      unit = 'm';
    } else if (unitStr === 'h') {
      unit = 'h';
    } else if (unitStr === 'd') {
      unit = 'd';
    } else if (unitStr === 'w' || unitStr === 's' || unitStr === 'sem') {
      unit = 'w';
    }
  }
  
  return { value, unit };
}

/**
 * Convert duration with unit to days
 */
export function durationToDays(duration: ParsedDuration): number {
  return duration.value * UNIT_TO_DAYS[duration.unit];
}

/**
 * Format duration for display
 */
export function formatDuration(value: number, unit: DurationUnit = 'd'): string {
  // Round to reasonable precision
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}${unit}`;
}

/**
 * Get full label for a duration unit
 */
export function getDurationUnitLabel(unit: DurationUnit, full: boolean = false): string {
  return full ? UNIT_FULL_LABELS[unit] : UNIT_LABELS[unit];
}

interface BaseEditorProps {
  task: Task;
  value: any;
  onCommit: (taskId: string, field: string, value: any) => void;
  onCancel: () => void;
  field: string;
}

interface InlineEditorCellProps {
  task: Task;
  value: any;
  field: string;
  type: 'text' | 'number' | 'date' | 'duration' | 'percent' | 'predecessor' | 'successor';
  onUpdate?: (taskId: string, field: string, value: any) => void;
  isEditable?: boolean;
  renderer?: (value: any, task: Task) => React.ReactNode;
}

export function EditableTextCell({ task, value, onCommit, onCancel, field }: BaseEditorProps) {
  const originalValue = value?.toString() ?? '';
  const [editValue, setEditValue] = useState(originalValue);
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    if (editValue !== originalValue) {
      onCommit(task.id, field, editValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      className="w-full h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontSize: '12px'
      }}
    />
  );
}

export function EditableNumberCell({ task, value, onCommit, onCancel, field }: BaseEditorProps) {
  const originalValue = parseFiniteNumber(value) ?? 0;
  const [editValue, setEditValue] = useState(originalValue.toString());
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    const parsed = parseFiniteNumber(editValue);
    if (parsed === undefined) {
      onCancel();
      return;
    }
    if (parsed !== originalValue) {
      onCommit(task.id, field, parsed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="number"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      className="w-full h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontSize: '12px'
      }}
    />
  );
}

export function EditableDateCell({ task, value, onCommit, onCancel, field }: BaseEditorProps) {
  const formatDateForInput = (date: Date | string | null): string => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const originalValue = formatDateForInput(value);
  const [editValue, setEditValue] = useState(originalValue);
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    if (editValue !== originalValue) {
      const dateValue = parseValidDate(editValue);
      if (dateValue === undefined) {
        onCancel();
        return;
      }
      onCommit(task.id, field, dateValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="date"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      className="w-full h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontSize: '12px'
      }}
    />
  );
}

export function EditableDurationCell({ task, value, onCommit, onCancel, field }: BaseEditorProps) {
  // Get existing duration value and unit from task
  const taskDuration = parseFiniteNumber(value) ?? parseFiniteNumber((task as any).duration) ?? 1;
  const taskUnit: DurationUnit = (task as any).durationUnit || 'd';
  const originalValue = Math.max(0.01, taskDuration);
  
  // Format initial display value with unit
  const [editValue, setEditValue] = useState(formatDuration(originalValue, taskUnit));
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    
    // Parse the input string with unit
    const parsed = parseDurationString(editValue);
    if (!parsed) {
      // Try parsing as plain number (defaults to current unit or days)
      const numValue = parseFiniteNumber(editValue);
      if (numValue !== undefined && numValue > 0) {
        const durationInDays = numValue * UNIT_TO_DAYS[taskUnit];
        if (Math.abs(durationInDays - durationToDays({ value: originalValue, unit: taskUnit })) > 0.001) {
          onCommit(task.id, field, { value: numValue, unit: taskUnit, days: durationInDays });
        } else {
          onCancel();
        }
        return;
      }
      onCancel();
      return;
    }
    
    const durationInDays = durationToDays(parsed);
    const originalInDays = durationToDays({ value: originalValue, unit: taskUnit });
    
    // Check if value actually changed
    if (Math.abs(durationInDays - originalInDays) > 0.001 || parsed.unit !== taskUnit) {
      // Commit the duration with unit info
      onCommit(task.id, field, { value: parsed.value, unit: parsed.unit, days: durationInDays });
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCommit}
        placeholder="7d, 4h, 2w, 30m"
        className="flex-1 h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          fontSize: '12px',
          width: '70px'
        }}
      />
    </div>
  );
}

export function EditablePercentCell({ task, value, onCommit, onCancel, field }: BaseEditorProps) {
  const parsed = parseFiniteNumber(value);
  const originalValue = Math.max(0, Math.min(100, Math.round(parsed ?? 0)));
  const [editValue, setEditValue] = useState(originalValue.toString());
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    const parsedValue = parseFiniteNumber(editValue);
    if (parsedValue === undefined) {
      onCancel();
      return;
    }
    const percent = Math.max(0, Math.min(100, Math.round(parsedValue)));
    if (percent !== originalValue) {
      onCommit(task.id, field, percent);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <input
        ref={inputRef}
        type="number"
        min="0"
        max="100"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCommit}
        className="flex-1 h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          fontSize: '12px',
          width: '50px'
        }}
      />
      <span className="text-xs text-gray-500">%</span>
    </div>
  );
}

interface DependencyEditorProps extends BaseEditorProps {
  allTasks?: Task[];
  depType?: 'predecessor' | 'successor';
}

export function EditableDependencyCell({ 
  task, 
  value, 
  onCommit, 
  onCancel, 
  field,
  allTasks: _allTasks,
  depType: _depType
}: DependencyEditorProps) {
  const originalValue = value?.toString() ?? '';
  const [editValue, setEditValue] = useState(originalValue);
  const cancelledRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommit = () => {
    if (cancelledRef.current) return;
    if (editValue !== originalValue) {
      onCommit(task.id, field, editValue);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      placeholder={`Ex: 1FS, 2SS+5d`}
      className="w-full h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontSize: '12px'
      }}
    />
  );
}

interface CalendarOption {
  id: string;
  name: string;
}

interface CalendarEditorProps extends BaseEditorProps {
  calendars?: CalendarOption[];
}

export function EditableCalendarCell({ 
  task, 
  value, 
  onCommit, 
  onCancel, 
  field,
  calendars = []
}: CalendarEditorProps) {
  const originalValue = value?.toString() ?? '';
  const [editValue, setEditValue] = useState(originalValue);
  const cancelledRef = useRef(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    selectRef.current?.focus();
  }, []);

  const handleCommit = useCallback(() => {
    if (cancelledRef.current) return;
    if (editValue !== originalValue) {
      onCommit(task.id, field, editValue);
    } else {
      onCancel();
    }
  }, [editValue, originalValue, task.id, field, onCommit, onCancel]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setEditValue(newValue);
    // Auto-commit on selection change
    if (newValue !== originalValue) {
      onCommit(task.id, field, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelledRef.current = true;
      onCancel();
    }
  };

  return (
    <select
      ref={selectRef}
      value={editValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleCommit}
      className="w-full h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#1F2937',
        fontSize: '12px'
      }}
    >
      <option value="">Calendário Padrão</option>
      {calendars.map(cal => (
        <option key={cal.id} value={cal.id}>
          {cal.name}
        </option>
      ))}
    </select>
  );
}

export function InlineEditorCell({
  task,
  value,
  field,
  type,
  onUpdate,
  isEditable = true,
  renderer
}: InlineEditorCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = useCallback(() => {
    if (isEditable && !task.isGroup) {
      setIsEditing(true);
    }
  }, [isEditable, task.isGroup]);

  const handleCommit = useCallback((taskId: string, fieldName: string, newValue: any) => {
    setIsEditing(false);
    if (onUpdate) {
      onUpdate(taskId, fieldName, newValue);
    }
  }, [onUpdate]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (isEditing) {
    switch (type) {
      case 'text':
        return (
          <EditableTextCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      case 'number':
        return (
          <EditableNumberCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      case 'date':
        return (
          <EditableDateCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      case 'duration':
        return (
          <EditableDurationCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      case 'percent':
        return (
          <EditablePercentCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
          />
        );
      case 'predecessor':
      case 'successor':
        return (
          <EditableDependencyCell
            task={task}
            value={value}
            field={field}
            onCommit={handleCommit}
            onCancel={handleCancel}
            allTasks={[]}
            depType={type}
          />
        );
      default:
        return null;
    }
  }

  const displayValue = renderer ? renderer(value, task) : (value?.toString() ?? '');

  return (
    <div
      ref={cellRef}
      className="truncate flex-1 cursor-text"
      style={{ lineHeight: '1.5' }}
      onDoubleClick={handleDoubleClick}
      title={isEditable && !task.isGroup ? 'Duplo clique para editar' : undefined}
    >
      {displayValue}
    </div>
  );
}

export type ColumnEditorType = 'text' | 'number' | 'date' | 'duration' | 'percent' | 'predecessor' | 'successor' | 'calendar' | 'readonly';

interface InlineEditCellProps {
  task: Task;
  field: string;
  value: any;
  editorType: ColumnEditorType;
  onCommit: (taskId: string, field: string, value: any) => void;
  onCancel: () => void;
  calendars?: CalendarOption[];
}

export function InlineEditCell({
  task,
  field,
  value,
  editorType,
  onCommit,
  onCancel,
  calendars = []
}: InlineEditCellProps) {
  switch (editorType) {
    case 'text':
      return (
        <EditableTextCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      );
    case 'number':
      return (
        <EditableNumberCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      );
    case 'date':
      return (
        <EditableDateCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      );
    case 'duration':
      return (
        <EditableDurationCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      );
    case 'percent':
      return (
        <EditablePercentCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      );
    case 'predecessor':
    case 'successor':
      return (
        <EditableDependencyCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
          depType={editorType}
        />
      );
    case 'calendar':
      return (
        <EditableCalendarCell
          task={task}
          value={value}
          field={field}
          onCommit={onCommit}
          onCancel={onCancel}
          calendars={calendars}
        />
      );
    default:
      return (
        <span className="truncate flex-1" style={{ lineHeight: '1.5' }}>
          {value?.toString() ?? ''}
        </span>
      );
  }
}

export function getColumnEditorType(field: string): ColumnEditorType {
  switch (field) {
    case 'name':
    case 'notes':
    case 'description':
      return 'text';
    case 'startDate':
    case 'endDate':
    case 'actualStart':
    case 'actualEnd':
      return 'date';
    case 'duration':
    case 'remainingDuration':
    case 'actualDuration':
      return 'duration';
    case 'progress':
    case 'percentComplete':
      return 'percent';
    case 'cost':
    case 'actualCost':
    case 'budgetedCost':
    case 'laborUnits':
    case 'nonLaborUnits':
      return 'number';
    case 'predecessors':
      return 'predecessor';
    case 'successors':
      return 'successor';
    case 'calendarId':
    case 'calendar':
      return 'calendar';
    case 'wbs':
    case 'id':
    case 'rowNumber':
    case 'edt':
      return 'readonly';
    default:
      return 'text';
  }
}
