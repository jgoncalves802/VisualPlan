
/**
 * ResourceHistogram - Visual workload distribution chart
 * Primavera P6 style resource histogram
 */



import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { format, eachDayOfInterval, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';

interface ResourceHistogramProps {
  resources: Resource[];
  allocations: ResourceAllocation[];
  startDate: Date;
  endDate: Date;
  selectedResourceId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

interface HistogramDataPoint {
  date: string;
  allocated: number;
  capacity: number;
  utilization: number;
  isOverallocated: boolean;
}

export function ResourceHistogram({
  resources,
  allocations,
  startDate,
  endDate,
  selectedResourceId,
  groupBy = 'week'
}: ResourceHistogramProps) {
  // Calculate histogram data
  const histogramData = useMemo<HistogramDataPoint[]>(() => {
    const targetResource = selectedResourceId 
      ? resources.find(r => r.id === selectedResourceId)
      : null;

    const targetAllocations = selectedResourceId
      ? allocations.filter(a => a.resourceId === selectedResourceId)
      : allocations;

    const capacity = targetResource?.capacity ?? 8; // Default 8 hours/day

    // Get date range
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Group by period
    const periodData: Record<string, { allocated: number; days: number }> = {};

    days.forEach(day => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      // Calculate period key
      let periodKey: string;
      if (groupBy === 'day') {
        periodKey = format(day, 'MMM dd');
      } else if (groupBy === 'week') {
        const weekStart = new Date(day);
        weekStart.setDate(day.getDate() - day.getDay()); // Start of week
        periodKey = format(weekStart, 'MMM dd');
      } else {
        periodKey = format(day, 'MMM yyyy');
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = { allocated: 0, days: 0 };
      }

      // Sum allocations for this day
      let dayAllocated = 0;
      targetAllocations.forEach(alloc => {
        if (
          isWithinInterval(day, { start: alloc.startDate, end: alloc.endDate })
        ) {
          dayAllocated += alloc.units || 0;
        }
      });

      periodData[periodKey].allocated += dayAllocated;
      periodData[periodKey].days += 1;
    });

    // Convert to array
    return Object.entries(periodData).map(([date, data]) => {
      const avgAllocated = data.allocated / data.days;
      const utilization = (avgAllocated / capacity) * 100;
      return {
        date,
        allocated: Math.round(avgAllocated * 10) / 10,
        capacity,
        utilization: Math.round(utilization),
        isOverallocated: avgAllocated > capacity
      };
    });
  }, [resources, allocations, startDate, endDate, selectedResourceId, groupBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const avgUtilization = histogramData.reduce((sum, d) => sum + d.utilization, 0) / histogramData.length;
    const overallocatedPeriods = histogramData.filter(d => d.isOverallocated).length;
    const peakAllocation = Math.max(...histogramData.map(d => d.allocated));
    
    return {
      avgUtilization: Math.round(avgUtilization),
      overallocatedPeriods,
      peakAllocation: Math.round(peakAllocation * 10) / 10,
      totalPeriods: histogramData.length
    };
  }, [histogramData]);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-500" />
          <h3 className="text-sm font-semibold">
            Resource Workload Distribution
          </h3>
        </div>
        {selectedResourceId && (
          <Badge variant="outline" className="text-xs">
            {resources.find(r => r.id === selectedResourceId)?.name}
          </Badge>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Avg Utilization</div>
          <div className="text-lg font-semibold flex items-center gap-1">
            {stats.avgUtilization}%
            <TrendingUp 
              size={14} 
              className={stats.avgUtilization > 100 ? 'text-red-500' : 'text-green-500'}
            />
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Peak Load</div>
          <div className="text-lg font-semibold">
            {stats.peakAllocation}h
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-xs text-gray-500">Overallocated</div>
          <div className="text-lg font-semibold flex items-center gap-1">
            {stats.overallocatedPeriods}
            {stats.overallocatedPeriods > 0 && (
              <AlertTriangle size={14} className="text-orange-500" />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={histogramData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11 }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const data = payload[0].payload as HistogramDataPoint;
                return (
                  <div className="bg-white border border-gray-300 rounded p-2 shadow-lg text-xs">
                    <div className="font-semibold mb-1">{data.date}</div>
                    <div className="flex items-center gap-2">
                      <span>Allocated:</span>
                      <span className="font-semibold">{data.allocated}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Capacity:</span>
                      <span className="font-semibold">{data.capacity}h</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Utilization:</span>
                      <span 
                        className={`font-semibold ${
                          data.utilization > 100 ? 'text-red-500' : 'text-green-500'
                        }`}
                      >
                        {data.utilization}%
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 11 }}
              iconSize={10}
            />
            <Bar dataKey="capacity" fill="#94a3b8" name="Capacity" />
            <Bar dataKey="allocated" name="Allocated">
              {histogramData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isOverallocated ? '#ef4444' : '#3b82f6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Normal Load</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Overallocated</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-400 rounded" />
          <span>Capacity</span>
        </div>
      </div>
    </Card>
  );
}
