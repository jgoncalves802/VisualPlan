

/**
 * ConstraintManager - Manage task constraints and violations
 */



import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import type { ConstraintStore } from '../stores/constraint-store';
import type { CalendarStore } from '../stores/calendar-store';
import type { TaskConstraint } from '../types/advanced-features';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle,
  XCircle,
  Zap,
  Calendar,
  Info
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';

interface ConstraintManagerProps {
  constraintStore: ConstraintStore;
  calendarStore: CalendarStore;
  tasks: Task[];
  onTasksUpdate?: (tasks: Task[]) => void;
}

export function ConstraintManager({
  constraintStore,
  calendarStore,
  tasks,
  onTasksUpdate
}: ConstraintManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  
  const [newConstraintTaskId, setNewConstraintTaskId] = useState('');
  const [newConstraintType, setNewConstraintType] = useState('');
  const [newConstraintDate, setNewConstraintDate] = useState('');
  const [newConstraintPriority, setNewConstraintPriority] = useState('5');

  const constraints = constraintStore.getConstraints();
  const violations = constraintStore.getViolations();
  const stats = constraintStore.getStats();
  const activeCalendar = calendarStore.getActiveCalendar();

  // Validate constraints when tasks or constraints change
  useEffect(() => {
    constraintStore.validateAllConstraints(tasks, activeCalendar ?? undefined);
  }, [tasks, constraints.length, activeCalendar, constraintStore]);

  // Constraint types
  const constraintTypes = [
    { value: 'as_soon_as_possible', label: 'As Soon As Possible' },
    { value: 'as_late_as_possible', label: 'As Late As Possible' },
    { value: 'must_start_on', label: 'Must Start On' },
    { value: 'must_finish_on', label: 'Must Finish On' },
    { value: 'start_no_earlier_than', label: 'Start No Earlier Than' },
    { value: 'start_no_later_than', label: 'Start No Later Than' },
    { value: 'finish_no_earlier_than', label: 'Finish No Earlier Than' },
    { value: 'finish_no_later_than', label: 'Finish No Later Than' }
  ];

  // Add constraint
  const handleAddConstraint = () => {
    if (!newConstraintTaskId || !newConstraintType) return;

    const constraint: TaskConstraint = {
      taskId: newConstraintTaskId,
      type: newConstraintType as any,
      date: newConstraintDate ? new Date(newConstraintDate) : undefined,
      priority: parseInt(newConstraintPriority)
    };

    constraintStore.addConstraint(constraint);

    setNewConstraintTaskId('');
    setNewConstraintType('');
    setNewConstraintDate('');
    setNewConstraintPriority('5');
    setIsAddDialogOpen(false);
  };

  // Remove constraint
  const handleRemoveConstraint = (taskId: string, type: string) => {
    constraintStore.removeConstraint(taskId, type);
  };

  // Apply constraints
  const handleApplyConstraints = () => {
    const result = constraintStore.applyConstraints(tasks, activeCalendar ?? undefined);
    
    setApplyResult(
      `Applied automatic fixes. Resolved ${result.resolved} violations. ${result.remaining} violations remaining.`
    );

    if (result.resolved > 0 && onTasksUpdate) {
      onTasksUpdate(result.tasks);
    }
  };

  // Get priority label
  const getPriorityLabel = (priority: number) => {
    if (priority >= 9) return 'Critical';
    if (priority >= 7) return 'High';
    if (priority >= 4) return 'Medium';
    return 'Low';
  };

  // Get priority variant
  const getPriorityVariant = (priority: number): "default" | "destructive" | "secondary" => {
    if (priority >= 9) return 'destructive';
    if (priority >= 7) return 'default';
    return 'secondary';
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Constraint Manager</h2>
              <p className="text-sm text-gray-600">
                {stats.totalConstraints} constraints · {stats.totalViolations} violations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleApplyConstraints}
              disabled={stats.autoResolvable === 0}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap size={16} />
              Auto-Fix ({stats.autoResolvable})
            </Button>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Constraint
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConstraints}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-orange-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Violations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViolations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="text-red-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">{stats.criticalViolations}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Auto-Fix</p>
                <p className="text-2xl font-bold text-gray-900">{stats.autoResolvable}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Apply Result */}
        {applyResult && (
          <Alert className="mt-4">
            <AlertDescription>{applyResult}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="constraints" className="h-full">
          <TabsList className="px-6 pt-4">
            <TabsTrigger value="constraints">
              Constraints ({stats.totalConstraints})
            </TabsTrigger>
            <TabsTrigger value="violations">
              Violations ({stats.totalViolations})
            </TabsTrigger>
            <TabsTrigger value="by-type">By Type</TabsTrigger>
          </TabsList>

          {/* Constraints Tab */}
          <TabsContent value="constraints" className="px-6 pb-6">
            {constraints.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">No constraints defined</p>
                <p className="text-sm text-gray-500 mt-1">
                  Add constraints to control task scheduling
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {constraints.map((constraint) => {
                  const task = tasks.find(t => t.id === constraint.taskId);
                  const taskViolations = constraintStore.getViolationsByTask(constraint.taskId);
                  const hasViolation = taskViolations.length > 0;

                  return (
                    <Card
                      key={`${constraint.taskId}-${constraint.type}`}
                      className={`p-4 ${hasViolation ? 'border-orange-300 bg-orange-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {task?.name ?? constraint.taskId}
                            </h4>
                            <Badge variant={getPriorityVariant(constraint.priority)}>
                              {getPriorityLabel(constraint.priority)}
                            </Badge>
                            {hasViolation && (
                              <Badge variant="destructive">
                                <AlertTriangle size={12} className="mr-1" />
                                Violated
                              </Badge>
                            )}
                          </div>

                          <div className="text-sm space-y-1">
                            <p className="text-gray-700">
                              <strong>Type:</strong>{' '}
                              {constraintTypes.find(ct => ct.value === constraint.type)?.label ??
                                constraint.type}
                            </p>
                            {constraint.date && (
                              <p className="text-gray-700">
                                <strong>Date:</strong>{' '}
                                {constraint.date.toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            )}
                            <p className="text-gray-700">
                              <strong>Priority:</strong> {constraint.priority}/10
                            </p>
                          </div>

                          {/* Violations */}
                          {taskViolations.length > 0 && (
                            <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                              {taskViolations.map((violation, idx) => (
                                <div key={idx} className="text-sm">
                                  <p className="text-orange-700 font-medium">
                                    Violation: {violation.violation} days difference
                                  </p>
                                  <p className="text-gray-600 text-xs">
                                    Scheduled: {violation.scheduledDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })} · 
                                    Constraint: {violation.constraintDate.toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    })}
                                  </p>
                                  {violation.canAutoResolve && (
                                    <p className="text-green-600 text-xs mt-1">
                                      ✓ Can be auto-resolved
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveConstraint(constraint.taskId, constraint.type)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Violations Tab */}
          <TabsContent value="violations" className="px-6 pb-6">
            {violations.length === 0 ? (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  No constraint violations detected. All constraints are satisfied.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {violations.map((violation, idx) => {
                  const task = tasks.find(t => t.id === violation.taskId);
                  
                  return (
                    <Card key={idx} className="p-4 border-orange-300 bg-orange-50">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getSeverityColor(violation.severity)}`} />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">
                              {task?.name ?? violation.taskId}
                            </h4>
                            <Badge variant="destructive">{violation.severity}</Badge>
                            {violation.canAutoResolve && (
                              <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700">
                                <CheckCircle size={12} className="mr-1" />
                                Auto-fixable
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            Task scheduled for {violation.scheduledDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}, 
                            but constraint requires {violation.constraintDate.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}.
                            Difference: {Math.abs(violation.violation)} days.
                          </p>

                          {violation.suggestedFix && (
                            <div className="text-sm p-2 bg-white rounded border border-green-200">
                              <p className="text-green-700">
                                <strong>Suggested Fix:</strong> {violation.suggestedFix}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* By Type Tab */}
          <TabsContent value="by-type" className="px-6 pb-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                Constraints by Type
              </h3>

              {Object.entries(stats.byType).length === 0 ? (
                <Card className="p-8 text-center">
                  <Info className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600">No constraints to display</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <Card key={type} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {constraintTypes.find(ct => ct.value === type)?.label ?? type}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {count} constraint{count !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Constraint Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task Constraint</DialogTitle>
            <DialogDescription>
              Add a scheduling constraint to a task
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="task">Task</Label>
              <Select value={newConstraintTaskId} onValueChange={setNewConstraintTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a task" />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Constraint Type</Label>
              <Select value={newConstraintType} onValueChange={setNewConstraintType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select constraint type" />
                </SelectTrigger>
                <SelectContent>
                  {constraintTypes.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newConstraintType &&
              !['as_soon_as_possible', 'as_late_as_possible'].includes(newConstraintType) && (
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newConstraintDate}
                    onChange={(e) => setNewConstraintDate(e.target.value)}
                  />
                </div>
              )}

            <div>
              <Label htmlFor="priority">Priority (1-10)</Label>
              <Input
                id="priority"
                type="number"
                min="1"
                max="10"
                value={newConstraintPriority}
                onChange={(e) => setNewConstraintPriority(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddConstraint}
              disabled={!newConstraintTaskId || !newConstraintType}
            >
              Add Constraint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

