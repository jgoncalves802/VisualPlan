

/**
 * ScenarioComparator - Compare project scenarios
 */



import React, { useState } from 'react';
import type { Task, Dependency } from '../types';
import type { ScenarioStore } from '../stores/scenario-store';
import type { Scenario } from '../types/advanced-features';
import { 
  Layers, 
  Plus, 
  Copy, 
  Trash2, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Target
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/Label';
import { Textarea } from '../../../components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';

interface ScenarioComparatorProps {
  scenarioStore: ScenarioStore;
  tasks: Task[];
  dependencies: Dependency[];
  onTasksUpdate?: (tasks: Task[]) => void;
}

export function ScenarioComparator({
  scenarioStore,
  tasks,
  dependencies,
  onTasksUpdate
}: ScenarioComparatorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [compareScenarioIds, setCompareScenarioIds] = useState<string[]>([]);

  const scenarios = scenarioStore.getScenarios();
  const activeScenario = scenarioStore.getActiveScenario();
  const stats = scenarioStore.getStats();

  // Create new scenario
  const handleCreateScenario = () => {
    if (!newScenarioName.trim()) return;

    scenarioStore.createNewScenario(
      newScenarioName,
      newScenarioDesc,
      tasks,
      dependencies
    );

    setNewScenarioName('');
    setNewScenarioDesc('');
    setIsCreateDialogOpen(false);
  };

  // Clone scenario
  const handleCloneScenario = (id: string) => {
    const original = scenarios.find(s => s.id === id);
    if (original) {
      scenarioStore.cloneScenario(id, `${original.name} (Copy)`);
    }
  };

  // Delete scenario
  const handleDeleteScenario = (id: string) => {
    if (scenarios.length <= 1) return; // Keep at least one
    scenarioStore.deleteScenario(id);
  };

  // Set active scenario
  const handleSetActive = (id: string) => {
    scenarioStore.setActiveScenario(id);
  };

  // Toggle scenario for comparison
  const handleToggleCompare = (id: string) => {
    if (compareScenarioIds.includes(id)) {
      setCompareScenarioIds(compareScenarioIds.filter(sid => sid !== id));
    } else {
      if (compareScenarioIds.length < 3) {
        setCompareScenarioIds([...compareScenarioIds, id]);
      }
    }
  };

  // Get comparison data
  const comparison = compareScenarioIds.length > 0 
    ? scenarioStore.compare(compareScenarioIds)
    : null;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="text-purple-600" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Scenario Comparator</h2>
              <p className="text-sm text-gray-600">
                {stats.totalScenarios} scenarios · {stats.activeScenarios} active
              </p>
            </div>
          </div>

          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Scenario
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="text-purple-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Total Scenarios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScenarios}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Target className="text-green-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeScenarios}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Best Scenario</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.bestScenario?.name.slice(0, 12) ?? 'None'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="list" className="h-full">
          <TabsList className="px-6 pt-4">
            <TabsTrigger value="list">Scenarios</TabsTrigger>
            <TabsTrigger value="compare">
              Compare {compareScenarioIds.length > 0 && `(${compareScenarioIds.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Scenarios List */}
          <TabsContent value="list" className="px-6 pb-6">
            <div className="space-y-3">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">{scenario.name}</h4>
                        {scenario.id === activeScenario?.id && (
                          <Badge variant="default">Active</Badge>
                        )}
                        <Badge variant={scenario.status === 'active' ? 'default' : 'secondary'}>
                          {scenario.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{scenario.description}</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCloneScenario(scenario.id)}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteScenario(scenario.id)}
                        disabled={scenarios.length <= 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-400" size={14} />
                      <div>
                        <p className="text-xs text-gray-600">Duration</p>
                        <p className="font-medium">{scenario.metrics?.totalDuration ?? 0}d</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="text-gray-400" size={14} />
                      <div>
                        <p className="text-xs text-gray-600">Cost</p>
                        <p className="font-medium">
                          ${((scenario.metrics?.totalCost ?? 0) / 1000).toFixed(0)}k
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <BarChart3 className="text-gray-400" size={14} />
                      <div>
                        <p className="text-xs text-gray-600">Utilization</p>
                        <p className="font-medium">{scenario.metrics?.resourceUtilization ?? 0}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-gray-400" size={14} />
                      <div>
                        <p className="text-xs text-gray-600">Probability</p>
                        <p className="font-medium">{scenario.metrics?.completionProbability ?? 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {scenario.id !== activeScenario?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(scenario.id)}
                      >
                        Set as Active
                      </Button>
                    )}
                    <Button
                      variant={compareScenarioIds.includes(scenario.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleToggleCompare(scenario.id)}
                      disabled={!compareScenarioIds.includes(scenario.id) && compareScenarioIds.length >= 3}
                    >
                      {compareScenarioIds.includes(scenario.id) ? 'Remove from Compare' : 'Add to Compare'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comparison View */}
          <TabsContent value="compare" className="px-6 pb-6">
            {comparison ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Comparing {comparison.scenarios.length} scenarios
                  </h3>
                </div>

                {/* Comparison Table */}
                <div className="space-y-4">
                  {/* Duration */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="text-gray-600" size={18} />
                      <h4 className="font-medium">Duration Comparison</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {comparison.scenarios.map((s) => (
                        <div key={s.id} className="text-center">
                          <p className="text-sm text-gray-600 mb-1">{s.name}</p>
                          <p className="text-2xl font-bold">{s.metrics?.totalDuration ?? 0}d</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Cost */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="text-gray-600" size={18} />
                      <h4 className="font-medium">Cost Comparison</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {comparison.scenarios.map((s) => (
                        <div key={s.id} className="text-center">
                          <p className="text-sm text-gray-600 mb-1">{s.name}</p>
                          <p className="text-2xl font-bold">
                            ${((s.metrics?.totalCost ?? 0) / 1000).toFixed(0)}k
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Probability */}
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="text-gray-600" size={18} />
                      <h4 className="font-medium">Success Probability</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {comparison.scenarios.map((s) => (
                        <div key={s.id} className="text-center">
                          <p className="text-sm text-gray-600 mb-1">{s.name}</p>
                          <p className="text-2xl font-bold">
                            {s.metrics?.completionProbability ?? 0}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Summary */}
                  {comparison.recommendations && comparison.recommendations.length > 0 && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="text-sm text-gray-700 list-disc list-inside">
                        {comparison.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Layers className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">
                  Select 1-3 scenarios to compare
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Scenario</DialogTitle>
            <DialogDescription>
              Create a new scenario based on the current project state
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={newScenarioName}
                onChange={(e) => setNewScenarioName(e.target.value)}
                placeholder="e.g., Optimistic, Pessimistic, Best Case"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newScenarioDesc}
                onChange={(e) => setNewScenarioDesc(e.target.value)}
                placeholder="Describe this scenario..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateScenario} disabled={!newScenarioName.trim()}>
              Create Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

