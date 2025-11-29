
/**
 * FiltersPanel - Advanced filtering for tasks
 */



import React, { useState } from 'react';
import type { Task } from '../types';
import { 
  Filter, 
  X, 
  ChevronDown,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible';

export interface TaskFilters {
  searchTerm: string;
  statuses: string[];
  dateRange: {
    start?: Date;
    end?: Date;
  };
  progressRange: {
    min: number;
    max: number;
  };
  showCriticalOnly: boolean;
  showMilestones: boolean;
}

interface FiltersPanelProps {
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  tasks: Task[];
}

export function FiltersPanel({ filters, onFiltersChange, tasks }: FiltersPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statuses = ['not_started', 'in_progress', 'completed', 'on_hold', 'delayed'];
  
  const activeFiltersCount = [
    filters.searchTerm.length > 0,
    filters.statuses.length > 0,
    filters.dateRange.start !== undefined,
    filters.dateRange.end !== undefined,
    filters.progressRange.min > 0 || filters.progressRange.max < 100,
    filters.showCriticalOnly,
    filters.showMilestones
  ].filter(Boolean).length;

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const handleClearAll = () => {
    onFiltersChange({
      searchTerm: '',
      statuses: [],
      dateRange: {},
      progressRange: { min: 0, max: 100 },
      showCriticalOnly: false,
      showMilestones: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={14} />;
      case 'delayed': return <AlertCircle size={14} />;
      case 'on_hold': return <Clock size={14} />;
      default: return <Calendar size={14} />;
    }
  };

  return (
    <Card className="border-gray-200">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="p-4 border-b border-gray-200">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="text-gray-600" size={20} />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Filters</h3>
                  <p className="text-xs text-gray-600">
                    {activeFiltersCount} active {activeFiltersCount === 1 ? 'filter' : 'filters'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearAll();
                    }}
                  >
                    <X size={14} className="mr-1" />
                    Clear All
                  </Button>
                )}
                <ChevronDown
                  className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  size={20}
                />
              </div>
            </div>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className="p-4 space-y-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium mb-2">
                Search Tasks
              </Label>
              <Input
                id="search"
                placeholder="Search by name or WBS..."
                value={filters.searchTerm}
                onChange={(e) =>
                  onFiltersChange({ ...filters, searchTerm: e.target.value })
                }
              />
            </div>

            {/* Status Filter */}
            <div>
              <Label className="text-sm font-medium mb-2">Status</Label>
              <div className="space-y-2">
                {statuses.map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => handleStatusToggle(status)}
                    />
                    <Label
                      htmlFor={`status-${status}`}
                      className="cursor-pointer flex items-center gap-2 flex-1"
                    >
                      <div className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${getStatusColor(status)}`}>
                        {getStatusIcon(status)}
                        {status.replace(/_/g, ' ').toUpperCase()}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2">Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="date-start" className="text-xs text-gray-600">
                    From
                  </Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] ?? ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          start: e.target.value ? new Date(e.target.value) : undefined
                        }
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="date-end" className="text-xs text-gray-600">
                    To
                  </Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] ?? ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          ...filters.dateRange,
                          end: e.target.value ? new Date(e.target.value) : undefined
                        }
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Progress Range */}
            <div>
              <Label className="text-sm font-medium mb-2">
                Progress Range: {filters.progressRange.min}% - {filters.progressRange.max}%
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progressRange.min}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      progressRange: {
                        ...filters.progressRange,
                        min: parseInt(e.target.value) || 0
                      }
                    })
                  }
                />
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={filters.progressRange.max}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      progressRange: {
                        ...filters.progressRange,
                        max: parseInt(e.target.value) || 100
                      }
                    })
                  }
                />
              </div>
            </div>

            {/* Special Filters */}
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="critical-only"
                  checked={filters.showCriticalOnly}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, showCriticalOnly: checked as boolean })
                  }
                />
                <Label htmlFor="critical-only" className="cursor-pointer">
                  Show Critical Path Only
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="milestones"
                  checked={filters.showMilestones}
                  onCheckedChange={(checked) =>
                    onFiltersChange({ ...filters, showMilestones: checked as boolean })
                  }
                />
                <Label htmlFor="milestones" className="cursor-pointer">
                  Show Milestones Only
                </Label>
              </div>
            </div>

            {/* Results Summary */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center">
                Showing {applyFilters(tasks, filters).length} of {tasks.length} tasks
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

/**
 * Apply filters to tasks
 */
export function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  let filtered = [...tasks];

  // Search term
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      t =>
        t.name.toLowerCase().includes(term) ||
        t.wbs?.toLowerCase().includes(term)
    );
  }

  // Status
  if (filters.statuses.length > 0) {
    filtered = filtered.filter(t => filters.statuses.includes(t.status));
  }

  // Date range
  if (filters.dateRange.start) {
    filtered = filtered.filter(t => t.startDate >= filters.dateRange.start!);
  }
  if (filters.dateRange.end) {
    filtered = filtered.filter(t => t.endDate <= filters.dateRange.end!);
  }

  // Progress range
  filtered = filtered.filter(
    t =>
      t.progress >= filters.progressRange.min &&
      t.progress <= filters.progressRange.max
  );

  return filtered;
}

