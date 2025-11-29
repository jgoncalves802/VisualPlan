

/**
 * ResourcePanel - Advanced resource management interface
 */



import React, { useState, useMemo } from 'react';
import type { Task } from '../types';
import type { ResourceStore } from '../stores/resource-store';
import type { DateRange } from '../types/advanced-features';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Users, AlertTriangle, Activity, TrendingUp, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Alert, AlertDescription } from '../../../components/ui/alert';

interface ResourcePanelProps {
  resourceStore: ResourceStore;
  tasks: Task[];
  onTasksUpdate?: (tasks: Task[]) => void;
}

export function ResourcePanel({ resourceStore, tasks, onTasksUpdate }: ResourcePanelProps) {
  const [isLeveling, setIsLeveling] = useState(false);
  const [levelingResult, setLevelingResult] = useState<string | null>(null);

  const resources = resourceStore.getResources();
  const allocations = resourceStore.getAllocations();
  const conflicts = resourceStore.getConflicts();
  const stats = resourceStore.getStats();

  // Calculate date range from tasks
  const dateRange = useMemo<DateRange>(() => {
    if (tasks.length === 0) {
      return {
        startDate: new Date(),
        endDate: new Date()
      };
    }

    return {
      startDate: new Date(Math.min(...tasks.map(t => t.startDate.getTime()))),
      endDate: new Date(Math.max(...tasks.map(t => t.endDate.getTime())))
    };
  }, [tasks]);

  // Calculate utilization data for chart
  const utilizationData = useMemo(() => {
    return resources.map(resource => {
      const utilization = resourceStore.getResourceUtilization(resource.id, dateRange);
      const resourceConflicts = resourceStore.getConflictsByResource(resource.id);
      
      return {
        name: resource.name,
        utilization: Math.round(utilization),
        capacity: 100,
        conflicts: resourceConflicts.length
      };
    });
  }, [resources, resourceStore, dateRange]);

  // Handle automatic leveling
  const handleAutoLevel = async () => {
    setIsLeveling(true);
    setLevelingResult(null);

    try {
      const result = await resourceStore.levelResources(tasks, {
        mode: 'automatic',
        strategy: 'delay_tasks',
        priority: 'critical_path'
      });

      const resolved = conflicts.length - result.conflicts.length;
      setLevelingResult(
        `Leveling complete! Resolved ${resolved} conflicts. ${result.conflicts.length} conflicts remaining.`
      );

      // Update tasks in parent
      onTasksUpdate?.(result.tasks);
    } catch (error) {
      setLevelingResult('Error during leveling. Please try again.');
    } finally {
      setIsLeveling(false);
    }
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

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return '#ef4444'; // red
    if (utilization > 80) return '#f59e0b'; // orange
    if (utilization > 60) return '#10b981'; // green
    return '#3b82f6'; // blue
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Resource Management</h2>
              <p className="text-sm text-gray-600">
                {stats.totalResources} resources · {stats.totalAllocations} allocations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {stats.totalAllocations} allocations
            </Badge>
            <Badge variant={conflicts.length > 0 ? "destructive" : "secondary"}>
              {stats.totalConflicts} conflicts
            </Badge>
            <Button
              onClick={handleAutoLevel}
              disabled={isLeveling || conflicts.length === 0}
              size="sm"
              className="flex items-center gap-2"
            >
              <Zap size={14} />
              {isLeveling ? 'Leveling...' : 'Auto-Level'}
            </Button>
          </div>
        </div>

        {/* Leveling Result */}
        {levelingResult && (
          <Alert className="mt-3">
            <AlertDescription>{levelingResult}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="utilization" className="h-full">
          <TabsList className="px-6 pt-4">
            <TabsTrigger value="utilization">Utilization</TabsTrigger>
            <TabsTrigger value="conflicts">
              Conflicts {conflicts.length > 0 && `(${conflicts.length})`}
            </TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Utilization Tab */}
          <TabsContent value="utilization" className="px-6 pb-6 h-[calc(100%-60px)]">
            <div className="h-full">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Resource Utilization</h3>
              
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={utilizationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Utilization (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="utilization" name="Utilization %">
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getUtilizationColor(entry.utilization)} />
                    ))}
                  </Bar>
                  <Bar dataKey="capacity" name="Capacity" fill="#e5e7eb" />
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span>Under 60%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span>60-80%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>80-100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Over 100%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Conflicts Tab */}
          <TabsContent value="conflicts" className="px-6 pb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Overallocation Conflicts
              </h3>

              {conflicts.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No resource conflicts detected. All resources are properly allocated.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {conflicts.slice(0, 20).map((conflict) => {
                    const resource = resources.find(r => r.id === conflict.resourceId);
                    return (
                      <Card key={conflict.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {resource?.name ?? conflict.resourceId}
                              </h4>
                              <Badge className={getSeverityColor(conflict.severity)}>
                                {conflict.severity}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Date: {conflict.date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}</p>
                              <p>
                                Allocated: {conflict.allocatedUnits}h / Available: {conflict.availableUnits}h
                              </p>
                              <p className="text-red-600 font-medium">
                                Overallocation: {conflict.overallocation.toFixed(1)}h
                              </p>
                              <p>Affected tasks: {conflict.affectedTasks.length}</p>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}

                  {conflicts.length > 20 && (
                    <p className="text-sm text-gray-500 text-center mt-4">
                      Showing 20 of {conflicts.length} conflicts
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="px-6 pb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">Resource List</h3>

              {resources.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No resources defined. Add resources to track allocation and utilization.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {resources.map((resource) => {
                    const resourceAllocations = resourceStore.getAllocationsByResource(resource.id);
                    const utilization = resourceStore.getResourceUtilization(resource.id, dateRange);
                    const resourceConflicts = resourceStore.getConflictsByResource(resource.id);

                    return (
                      <Card key={resource.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{resource.name}</h4>
                            <p className="text-sm text-gray-600">{resource.role ?? 'No role specified'}</p>
                            
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span>Capacity: {resource.capacity ?? 8}h/day</span>
                              <span>Allocations: {resourceAllocations.length}</span>
                              <span>Utilization: {utilization.toFixed(1)}%</span>
                              {resourceConflicts.length > 0 && (
                                <Badge variant="destructive">
                                  {resourceConflicts.length} conflicts
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

