
/**
 * Resource Usage View - Primavera P6 Style
 * Displays resource allocation, usage histograms, and assignments
 */



import React, { useState, useMemo } from 'react';
import type { Task } from '../types';
import type { ResourceStore } from '../stores/resource-store';
import type { ResourceAllocation } from '../types/advanced-features';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Clock,
  DollarSign 
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/Table";

interface ResourceUsageViewProps {
  resourceStore: ResourceStore;
  tasks: Task[];
}

export function ResourceUsageView({ resourceStore, tasks }: ResourceUsageViewProps) {
  const resources = resourceStore.getResources();
  const allocations = resourceStore.getAllocations();
  const conflicts = resourceStore.getConflicts();
  const stats = resourceStore.getStats();

  // Calculate resource usage over time
  const resourceUsageTimeline = useMemo(() => {
    const timelineMap = new Map<string, Map<string, number>>();
    
    allocations.forEach(allocation => {
      const task = tasks.find(t => t.id === allocation.taskId);
      const resource = resources.find(r => r.id === allocation.resourceId);
      
      if (task && resource) {
        const taskStart = task.startDate;
        const taskEnd = task.endDate;
        
        // Generate weekly buckets
        let currentDate = new Date(taskStart);
        while (currentDate <= taskEnd) {
          const weekKey = `Week ${Math.floor((currentDate.getTime() - taskStart.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`;
          
          if (!timelineMap.has(weekKey)) {
            timelineMap.set(weekKey, new Map());
          }
          
          const weekData = timelineMap.get(weekKey)!;
          weekData.set(resource.id, (weekData.get(resource.id) || 0) + allocation.units);
          
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    });
    
    return Array.from(timelineMap.entries()).map(([week, resourceMap]) => ({
      week,
      ...Object.fromEntries(
        resources.map(r => [r.name, resourceMap.get(r.id) || 0])
      )
    }));
  }, [allocations, tasks, resources]);

  // Calculate resource assignments
  const resourceAssignments = useMemo(() => {
    return allocations.map(allocation => {
      const task = tasks.find(t => t.id === allocation.taskId);
      const resource = resources.find(r => r.id === allocation.resourceId);
      
      if (!task || !resource) return null;
      
      const duration = Math.ceil(
        (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // Use allocation cost or default calculation
      const cost = allocation.cost 
        ? allocation.cost * duration 
        : allocation.units * (resource.capacity || 8) * 50 * duration / 100; // Default: $50/hour
      
      return {
        id: allocation.id,
        taskName: task.name,
        taskId: task.id,
        resourceName: resource.name,
        resourceId: resource.id,
        units: allocation.units,
        duration,
        startDate: task.startDate,
        endDate: task.endDate,
        cost,
        status: task.status
      };
    }).filter(Boolean);
  }, [allocations, tasks, resources]);

  // Calculate critical conflicts
  const criticalConflicts = useMemo(() => {
    return conflicts.filter(c => c.severity === 'critical').length;
  }, [conflicts]);

  // Resource colors for chart
  const RESOURCE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Allocations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAllocations}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Conflicts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalConflicts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Conflicts</p>
              <p className="text-2xl font-bold text-gray-900">{criticalConflicts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Resource Usage Tabs */}
      <Card>
        <Tabs defaultValue="histogram" className="w-full">
          <div className="border-b px-4 pt-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="histogram">
                <BarChart className="w-4 h-4 mr-2" />
                Usage Histogram
              </TabsTrigger>
              <TabsTrigger value="assignments">
                <Users className="w-4 h-4 mr-2" />
                Assignments
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="histogram" className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Resource Usage Profile</h3>
              <Badge variant="outline">Weekly View</Badge>
            </div>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceUsageTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    label={{ value: 'Units', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {resources.map((resource, index) => (
                    <Bar 
                      key={resource.id}
                      dataKey={resource.name}
                      stackId="a"
                      fill={RESOURCE_COLORS[index % RESOURCE_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Resource Assignments</h3>
                <Badge variant="secondary">{resourceAssignments.length} Assignments</Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Task</TableHead>
                      <TableHead className="font-semibold">Resource</TableHead>
                      <TableHead className="font-semibold text-right">Units</TableHead>
                      <TableHead className="font-semibold text-right">Duration</TableHead>
                      <TableHead className="font-semibold">Start Date</TableHead>
                      <TableHead className="font-semibold">End Date</TableHead>
                      <TableHead className="font-semibold text-right">Cost</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resourceAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No resource assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      resourceAssignments.map((assignment: any) => (
                        <TableRow key={assignment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{assignment.taskName}</TableCell>
                          <TableCell>{assignment.resourceName}</TableCell>
                          <TableCell className="text-right">{assignment.units}</TableCell>
                          <TableCell className="text-right">{assignment.duration}d</TableCell>
                          <TableCell>
                            {assignment.startDate.toLocaleDateString('en-US', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                          <TableCell>
                            {assignment.endDate.toLocaleDateString('en-US', { 
                              month: '2-digit', 
                              day: '2-digit', 
                              year: 'numeric' 
                            })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${assignment.cost.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                assignment.status === 'completed' ? 'default' : 
                                assignment.status === 'in_progress' ? 'secondary' : 
                                'outline'
                              }
                              className="capitalize"
                            >
                              {assignment.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-800">Resource Conflicts</h3>
              <Badge variant="destructive">{conflicts.length}</Badge>
            </div>

            <div className="space-y-2">
              {conflicts.slice(0, 5).map((conflict) => {
                const resource = resources.find(r => r.id === conflict.resourceId);
                return (
                  <div 
                    key={conflict.id}
                    className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{resource?.name}</p>
                      <p className="text-sm text-gray-600">
                        Overallocated by {conflict.overallocation.toFixed(0)} units 
                        ({conflict.affectedTasks.length} tasks affected)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={conflict.severity === 'critical' ? 'destructive' : 'default'}
                        className="capitalize"
                      >
                        {conflict.severity}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {conflict.date.toLocaleDateString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {conflicts.length > 5 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{conflicts.length - 5} more conflicts
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
