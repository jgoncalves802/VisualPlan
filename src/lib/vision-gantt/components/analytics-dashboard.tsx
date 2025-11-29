
/**
 * AnalyticsDashboard - Project insights and metrics
 */



import React from 'react';
import type { Task, Dependency } from '../types';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';

interface AnalyticsDashboardProps {
  tasks: Task[];
  dependencies: Dependency[];
  criticalPathIds: string[];
}

export function AnalyticsDashboard({
  tasks,
  dependencies,
  criticalPathIds
}: AnalyticsDashboardProps) {
  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const onHoldTasks = tasks.filter(t => t.status === 'on_hold').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  
  const overallProgress = totalTasks > 0
    ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / totalTasks)
    : 0;

  const criticalTasks = criticalPathIds.length;
  const criticalProgress = criticalTasks > 0
    ? Math.round(
        tasks
          .filter(t => criticalPathIds.includes(t.id))
          .reduce((sum, t) => sum + t.progress, 0) / criticalTasks
      )
    : 0;

  // Calculate project dates
  const projectStart = tasks.length > 0
    ? new Date(Math.min(...tasks.map(t => t.startDate.getTime())))
    : new Date();
  
  const projectEnd = tasks.length > 0
    ? new Date(Math.max(...tasks.map(t => t.endDate.getTime())))
    : new Date();

  const projectDuration = Math.round(
    (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const today = new Date();
  const elapsed = Math.max(0, Math.round(
    (today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
  ));

  const scheduleProgress = projectDuration > 0
    ? Math.round((elapsed / projectDuration) * 100)
    : 0;

  // Status breakdown
  const statusBreakdown = [
    { status: 'Completed', count: completedTasks, color: 'bg-green-500' },
    { status: 'In Progress', count: inProgressTasks, color: 'bg-blue-500' },
    { status: 'On Hold', count: onHoldTasks, color: 'bg-yellow-500' },
    {
      status: 'Not Started',
      count: totalTasks - completedTasks - inProgressTasks - onHoldTasks,
      color: 'bg-gray-400'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Target className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Overall Progress</p>
              <p className="text-2xl font-bold text-gray-900">{overallProgress}%</p>
            </div>
          </div>
          <Progress value={overallProgress} className="mt-3" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="text-purple-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Schedule</p>
              <p className="text-2xl font-bold text-gray-900">{scheduleProgress}%</p>
            </div>
          </div>
          <Progress value={scheduleProgress} className="mt-3" />
          <p className="text-xs text-gray-600 mt-2">
            Day {elapsed} of {projectDuration}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-orange-600" size={24} />
            <div>
              <p className="text-sm text-gray-600">Critical Path</p>
              <p className="text-2xl font-bold text-gray-900">{criticalProgress}%</p>
            </div>
          </div>
          <Progress value={criticalProgress} className="mt-3" />
          <p className="text-xs text-gray-600 mt-2">
            {criticalTasks} critical tasks
          </p>
        </Card>
      </div>

      {/* Task Status */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-gray-600" size={20} />
          <h4 className="font-medium text-gray-900">Task Status Breakdown</h4>
        </div>

        <div className="space-y-3">
          {statusBreakdown.map((item) => (
            <div key={item.status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">{item.status}</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.count} ({Math.round((item.count / totalTasks) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${(item.count / totalTasks) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      {onHoldTasks > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-medium text-yellow-900 mb-1">
                Attention Required
              </h4>
              <p className="text-sm text-yellow-700">
                {onHoldTasks} {onHoldTasks === 1 ? 'task is' : 'tasks are'} on hold.
                Review and take action to resume.
              </p>
            </div>
          </div>
        </Card>
      )}

      {completedTasks === totalTasks && totalTasks > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
            <div>
              <h4 className="font-medium text-green-900 mb-1">
                Project Complete!
              </h4>
              <p className="text-sm text-green-700">
                All tasks have been completed successfully.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Dependencies */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Dependencies</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Links</p>
            <p className="text-xl font-bold text-gray-900">{dependencies.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Avg. per Task</p>
            <p className="text-xl font-bold text-gray-900">
              {totalTasks > 0 ? (dependencies.length / totalTasks).toFixed(1) : '0'}
            </p>
          </div>
        </div>
      </Card>

      {/* Project Timeline */}
      <Card className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Project Timeline</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Start Date</span>
            <span className="font-medium text-gray-900">
              {projectStart.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">End Date</span>
            <span className="font-medium text-gray-900">
              {projectEnd.toLocaleDateString('en-US', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration</span>
            <span className="font-medium text-gray-900">
              {projectDuration} days
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

