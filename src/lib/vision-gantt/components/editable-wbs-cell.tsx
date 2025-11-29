
/**
 * Editable WBS Cell - MS Project Style
 * Allows inline editing of WBS codes
 */



import React, { useState, useRef, useEffect } from 'react';
import type { Task } from '../types';

interface EditableWBSCellProps {
  task: Task;
  value: string | undefined;
  onUpdate?: (taskId: string, newWBS: string) => void;
}

export function EditableWBSCell({ task, value, onUpdate }: EditableWBSCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from reaching parent row
    if (!task.isGroup) {
      setIsEditing(true);
      setEditValue(value || '');
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value && onUpdate) {
      onUpdate(task.id, editValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full h-full px-2 py-1 border border-blue-500 rounded outline-none"
        style={{
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          backgroundColor: 'white'
        }}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="w-full h-full flex items-center cursor-text hover:bg-gray-50"
      style={{
        fontFamily: 'monospace',
        fontSize: '0.875rem',
        userSelect: 'none',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {value || '-'}
    </div>
  );
}
