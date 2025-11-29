
/**
 * ResourceCostSummary - Cost tracking per resource
 * Primavera P6 style cost analysis
 */



import React, { useMemo } from 'react';
import type { Resource } from '../types';
import type { ResourceAllocation } from '../types/advanced-features';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { DollarSign, TrendingUp, AlertCircle, User } from 'lucide-react';
import { differenceInHours, differenceInDays } from 'date-fns';
import { formatCurrency, formatNumber } from '../utils/format-utils';

interface ResourceCostData {
  resourceId: string;
  resourceName: string;
  role: string;
  totalHours: number;
  totalDays: number;
  costRate: number;
  costType: string;
  totalCost: number;
  allocations: number;
}

interface ResourceCostSummaryProps {
  resources: Resource[];
  allocations: ResourceAllocation[];
}

export function ResourceCostSummary({
  resources,
  allocations
}: ResourceCostSummaryProps) {
  // Calculate cost per resource
  const resourceCosts = useMemo<ResourceCostData[]>(() => {
    return resources.map(resource => {
      const resourceAllocations = allocations.filter(a => a.resourceId === resource.id);
      
      // Calculate total hours/days
      let totalHours = 0;
      let totalDays = 0;
      
      resourceAllocations.forEach(alloc => {
        const hours = differenceInHours(alloc.endDate, alloc.startDate);
        const days = differenceInDays(alloc.endDate, alloc.startDate);
        totalHours += hours;
        totalDays += days;
      });

      // Calculate cost
      const costRate = resource.costRate ?? 0;
      const costType = resource.costType ?? 'hour';
      let totalCost = 0;

      if (costType === 'hour') {
        totalCost = totalHours * costRate;
      } else if (costType === 'day') {
        totalCost = totalDays * costRate;
      } else if (costType === 'fixed') {
        totalCost = costRate * resourceAllocations.length;
      }

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        role: resource.role ?? 'N/A',
        totalHours,
        totalDays,
        costRate,
        costType,
        totalCost: Math.round(totalCost * 100) / 100,
        allocations: resourceAllocations.length
      };
    });
  }, [resources, allocations]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalCost = resourceCosts.reduce((sum, r) => sum + r.totalCost, 0);
    const totalHours = resourceCosts.reduce((sum, r) => sum + r.totalHours, 0);
    const totalAllocations = resourceCosts.reduce((sum, r) => sum + r.allocations, 0);
    
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      totalHours,
      totalAllocations,
      avgCostPerResource: resourceCosts.length > 0 
        ? Math.round((totalCost / resourceCosts.length) * 100) / 100 
        : 0
    };
  }, [resourceCosts]);

  // Sort by total cost (descending)
  const sortedResources = [...resourceCosts].sort((a, b) => b.totalCost - a.totalCost);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign size={20} className="text-green-500" />
          <h3 className="text-sm font-semibold">
            Resource Cost Analysis
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Primavera P6 Style
        </Badge>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-green-50 p-2 rounded">
          <div className="text-xs text-gray-600">Total Cost</div>
          <div className="text-lg font-semibold text-green-700">
            {formatCurrency(totals.totalCost)}
          </div>
        </div>
        <div className="bg-blue-50 p-2 rounded">
          <div className="text-xs text-gray-600">Total Hours</div>
          <div className="text-lg font-semibold text-blue-700">
            {formatNumber(totals.totalHours)}h
          </div>
        </div>
        <div className="bg-purple-50 p-2 rounded">
          <div className="text-xs text-gray-600">Allocations</div>
          <div className="text-lg font-semibold text-purple-700">
            {totals.totalAllocations}
          </div>
        </div>
        <div className="bg-orange-50 p-2 rounded">
          <div className="text-xs text-gray-600">Avg/Resource</div>
          <div className="text-lg font-semibold text-orange-700">
            {formatCurrency(totals.avgCostPerResource)}
          </div>
        </div>
      </div>

      {/* Resource List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedResources.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
            No resources with cost data
          </div>
        ) : (
          sortedResources.map((resource) => (
            <div
              key={resource.resourceId}
              className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <User size={16} className="text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">
                      {resource.resourceName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {resource.role}
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-bold text-green-600">
                    {formatCurrency(resource.totalCost)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {resource.allocations} tasks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <span>Rate:</span>
                  <span className="font-semibold">
                    ${resource.costRate}/{resource.costType}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Hours:</span>
                  <span className="font-semibold">
                    {formatNumber(resource.totalHours)}h
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Days:</span>
                  <span className="font-semibold">
                    {resource.totalDays}d
                  </span>
                </div>
              </div>

              {/* Cost breakdown bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (resource.totalCost / totals.totalCost) * 100)}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((resource.totalCost / totals.totalCost) * 100)}% of total budget
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Budget Health Indicator */}
      {totals.totalCost > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="font-semibold text-blue-900">Budget Insights</span>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            Top 3 resources account for {
              Math.round(
                (sortedResources.slice(0, 3).reduce((sum, r) => sum + r.totalCost, 0) / totals.totalCost) * 100
              )
            }% of total cost
          </div>
        </div>
      )}
    </Card>
  );
}
