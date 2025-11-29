
/**
 * EditableResourceCell - Inline resource allocation editor
 * Similar to MS Project resource assignment
 */



import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, User } from 'lucide-react';
import type { Task, Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';

interface ResourceAssignment {
  resourceId: string;
  resourceName: string;
  units: number; // Percentage (25, 50, 75, 100)
}

interface EditableResourceCellProps {
  task: Task;
  resources: Resource[];
  allocations: ResourceAllocation[];
  onUpdate?: (taskId: string, assignments: ResourceAssignment[]) => void;
}

export function EditableResourceCell({
  task,
  resources,
  allocations,
  onUpdate
}: EditableResourceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [assignments, setAssignments] = useState<ResourceAssignment[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load current assignments
  useEffect(() => {
    const taskAllocations = allocations.filter(a => a.taskId === task.id);
    const currentAssignments = taskAllocations.map(alloc => {
      const resource = resources.find(r => r.id === alloc.resourceId);
      return {
        resourceId: alloc.resourceId,
        resourceName: resource?.name || 'Unknown',
        units: alloc.units || 100
      };
    });
    setAssignments(currentAssignments);
  }, [task.id, allocations, resources]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false);
      }
    };

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing]);

  const handleAddResource = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    if (!resource) return;

    // Check if already assigned
    if (assignments.some(a => a.resourceId === resourceId)) return;

    const newAssignment: ResourceAssignment = {
      resourceId,
      resourceName: resource.name,
      units: 100
    };

    const updatedAssignments = [...assignments, newAssignment];
    setAssignments(updatedAssignments);
    onUpdate?.(task.id, updatedAssignments);
  };

  const handleRemoveResource = (resourceId: string) => {
    const updatedAssignments = assignments.filter(a => a.resourceId !== resourceId);
    setAssignments(updatedAssignments);
    onUpdate?.(task.id, updatedAssignments);
  };

  const handleUnitsChange = (resourceId: string, units: number) => {
    const updatedAssignments = assignments.map(a =>
      a.resourceId === resourceId ? { ...a, units } : a
    );
    setAssignments(updatedAssignments);
    onUpdate?.(task.id, updatedAssignments);
  };

  const availableResources = resources.filter(
    r => !assignments.some(a => a.resourceId === r.id)
  );

  // Display text
  const displayText = assignments.length === 0
    ? '-'
    : assignments
        .map(a => `${a.resourceName}${a.units !== 100 ? ` [${a.units}%]` : ''}`)
        .join(', ');

  return (
    <div className="relative w-full h-full">
      {/* Display Mode */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className="w-full h-full flex items-center cursor-pointer hover:bg-gray-50 px-1"
        style={{
          fontSize: '0.875rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
        title={displayText}
      >
        {assignments.length > 0 && (
          <User size={14} className="mr-1 flex-shrink-0 text-blue-500" />
        )}
        <span className="truncate">{displayText}</span>
      </div>

      {/* Edit Dropdown */}
      {isEditing && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50"
          style={{
            minWidth: '320px',
            maxHeight: '400px',
            overflow: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Current Assignments */}
          <div className="p-2 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Assigned Resources
            </div>
            {assignments.length === 0 ? (
              <div className="text-xs text-gray-500 italic py-2">
                No resources assigned
              </div>
            ) : (
              <div className="space-y-1">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.resourceId}
                    className="flex items-center justify-between gap-2 p-1.5 hover:bg-gray-50 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User size={14} className="flex-shrink-0 text-blue-500" />
                      <span className="text-xs truncate">
                        {assignment.resourceName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={assignment.units}
                        onChange={(e) =>
                          handleUnitsChange(assignment.resourceId, Number(e.target.value))
                        }
                        className="text-xs border border-gray-300 rounded px-1 py-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value={25}>25%</option>
                        <option value={50}>50%</option>
                        <option value={75}>75%</option>
                        <option value={100}>100%</option>
                        <option value={150}>150%</option>
                        <option value={200}>200%</option>
                      </select>
                      <button
                        onClick={() => handleRemoveResource(assignment.resourceId)}
                        className="text-red-500 hover:text-red-700 p-0.5"
                        title="Remove resource"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Resources */}
          {availableResources.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Available Resources
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableResources.map((resource) => (
                  <button
                    key={resource.id}
                    onClick={() => handleAddResource(resource.id)}
                    className="w-full flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded text-left transition-colors"
                  >
                    <Plus size={14} className="flex-shrink-0 text-green-500" />
                    <span className="text-xs truncate">{resource.name}</span>
                    <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                      {resource.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="p-2 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
