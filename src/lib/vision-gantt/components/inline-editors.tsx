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
  const parsed = parseFiniteNumber(value);
  const originalValue = Math.max(1, Math.round(parsed ?? 1));
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
    const duration = Math.max(1, Math.round(parsedValue));
    if (duration !== originalValue) {
      onCommit(task.id, field, duration);
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
        min="1"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleCommit}
        className="flex-1 h-full px-2 py-1 text-sm border border-blue-500 rounded outline-none"
        style={{
          backgroundColor: '#FFFFFF',
          color: '#1F2937',
          fontSize: '12px',
          width: '60px'
        }}
      />
      <span className="text-xs text-gray-500">dias</span>
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

export type ColumnEditorType = 'text' | 'number' | 'date' | 'duration' | 'percent' | 'predecessor' | 'successor' | 'readonly';

interface InlineEditCellProps {
  task: Task;
  field: string;
  value: any;
  editorType: ColumnEditorType;
  onCommit: (taskId: string, field: string, value: any) => void;
  onCancel: () => void;
}

export function InlineEditCell({
  task,
  field,
  value,
  editorType,
  onCommit,
  onCancel
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
    case 'wbs':
    case 'id':
    case 'rowNumber':
      return 'readonly';
    default:
      return 'text';
  }
}
