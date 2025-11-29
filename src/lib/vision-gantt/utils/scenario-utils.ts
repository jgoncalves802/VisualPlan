

/**
 * Scenario Simulation Utilities
 * RF-L14 to RF-L16: What-If Analysis and Scenario Comparison
 */

import { differenceInDays } from 'date-fns';
import type {
  Scenario,
  ScenarioChange,
  ScenarioMetrics,
  ScenarioComparison
} from '../types/advanced-features';
import type { Task, Dependency } from '../types';

/**
 * Create a new scenario from baseline
 */
export function createScenario(
  name: string,
  description: string,
  baselineTasks: Task[],
  baselineDependencies: Dependency[]
): Scenario {
  const metrics = calculateScenarioMetrics(baselineTasks, baselineDependencies);

  return {
    id: `scenario-${Date.now()}`,
    name,
    description,
    baselineDate: new Date(),
    createdDate: new Date(),
    status: 'draft',
    changes: [],
    metrics
  };
}

/**
 * Apply changes to tasks and create new scenario
 */
export function applyScenarioChanges(
  baseScenario: Scenario,
  tasks: Task[],
  changes: ScenarioChange[]
): { scenario: Scenario; tasks: Task[] } {
  // Clone tasks to avoid mutation
  let modifiedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];

  // Apply each change
  changes.forEach(change => {
    if (change.type === 'task_duration') {
      const task = modifiedTasks.find(t => t.id === change.entityId);
      if (task) {
        task.duration = change.newValue;
        // Recalculate end date based on new duration
        const newEndDate = new Date(task.startDate);
        newEndDate.setDate(newEndDate.getDate() + change.newValue);
        task.endDate = newEndDate;
      }
    } else if (change.type === 'task_date') {
      const task = modifiedTasks.find(t => t.id === change.entityId);
      if (task && change.field === 'startDate') {
        const duration = differenceInDays(task.endDate, task.startDate);
        task.startDate = new Date(change.newValue);
        task.endDate = new Date(task.startDate);
        task.endDate.setDate(task.endDate.getDate() + duration);
      } else if (task && change.field === 'endDate') {
        task.endDate = new Date(change.newValue);
        task.duration = differenceInDays(task.endDate, task.startDate);
      }
    }
  });

  // Calculate new metrics
  const metrics = calculateScenarioMetrics(modifiedTasks, []);

  const newScenario: Scenario = {
    ...baseScenario,
    id: `scenario-${Date.now()}`,
    changes,
    metrics,
    status: 'draft'
  };

  return {
    scenario: newScenario,
    tasks: modifiedTasks
  };
}

/**
 * Calculate scenario performance metrics
 */
export function calculateScenarioMetrics(
  tasks: Task[],
  dependencies: Dependency[]
): ScenarioMetrics {
  if (tasks.length === 0) {
    return {
      totalDuration: 0,
      projectEndDate: new Date(),
      totalCost: 0,
      resourceUtilization: 0,
      criticalPathLength: 0,
      riskScore: 0,
      completionProbability: 100
    };
  }

  // Find project start and end dates
  const startDates = tasks.map(t => t.startDate.getTime());
  const endDates = tasks.map(t => t.endDate.getTime());
  const projectStartDate = new Date(Math.min(...startDates));
  const projectEndDate = new Date(Math.max(...endDates));
  const totalDuration = differenceInDays(projectEndDate, projectStartDate);

  // Calculate critical path length (simplified)
  const criticalPathLength = calculateCriticalPath(tasks, dependencies);

  // Calculate total cost (simplified - based on duration and task count)
  const totalCost = tasks.reduce((sum, task) => {
    const duration = task.duration ?? differenceInDays(task.endDate, task.startDate);
    return sum + (duration * 100); // Assuming $100 per day per task
  }, 0);

  // Calculate resource utilization (simplified)
  const resourceUtilization = 75; // Placeholder

  // Calculate risk score based on various factors
  const riskScore = calculateRiskScore(tasks, dependencies);

  // Calculate completion probability based on risk
  const completionProbability = Math.max(0, 100 - riskScore);

  return {
    totalDuration,
    projectEndDate,
    totalCost,
    resourceUtilization,
    criticalPathLength,
    riskScore,
    completionProbability
  };
}

/**
 * Calculate critical path length (simplified)
 */
function calculateCriticalPath(
  tasks: Task[],
  dependencies: Dependency[]
): number {
  // Simplified critical path calculation
  // In a real implementation, this would use network diagram analysis
  const taskDurations = tasks.map(t => 
    t.duration ?? differenceInDays(t.endDate, t.startDate)
  );

  return Math.max(...taskDurations, 0);
}

/**
 * Calculate risk score (0-100)
 */
function calculateRiskScore(
  tasks: Task[],
  dependencies: Dependency[]
): number {
  let riskScore = 0;

  // Factor 1: Task duration variance (longer tasks = higher risk)
  const avgDuration = tasks.reduce((sum, t) => 
    sum + (t.duration ?? differenceInDays(t.endDate, t.startDate)), 0
  ) / tasks.length;

  if (avgDuration > 30) riskScore += 20;
  else if (avgDuration > 14) riskScore += 10;

  // Factor 2: Dependency complexity (more dependencies = higher risk)
  const dependencyRatio = dependencies.length / tasks.length;
  if (dependencyRatio > 2) riskScore += 30;
  else if (dependencyRatio > 1) riskScore += 15;

  // Factor 3: Task status (not started or on hold = higher risk)
  const problemTasks = tasks.filter(t => 
    t.status === 'not_started' || t.status === 'on_hold'
  ).length;

  riskScore += (problemTasks / tasks.length) * 20;

  // Factor 4: Overdue tasks
  const now = new Date();
  const overdueTasks = tasks.filter(t => 
    t.endDate < now && t.status !== 'completed'
  ).length;

  riskScore += (overdueTasks / tasks.length) * 30;

  return Math.min(100, riskScore);
}

/**
 * Compare multiple scenarios
 */
export function compareScenarios(
  scenarios: Scenario[]
): ScenarioComparison {
  if (scenarios.length === 0) {
    return {
      scenarios: [],
      differences: [],
      recommendations: []
    };
  }

  // Use first scenario as baseline
  const baseline = scenarios[0];
  const differences = scenarios.slice(1).map(scenario => {
    const durationDelta = scenario.metrics.totalDuration - baseline.metrics.totalDuration;
    const costDelta = scenario.metrics.totalCost - baseline.metrics.totalCost;
    const endDateDelta = differenceInDays(
      scenario.metrics.projectEndDate,
      baseline.metrics.projectEndDate
    );

    // Identify critical changes
    const criticalChanges: string[] = [];

    if (Math.abs(durationDelta) > 7) {
      criticalChanges.push(
        `Project duration ${durationDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(durationDelta)} days`
      );
    }

    if (Math.abs(costDelta) > 10000) {
      criticalChanges.push(
        `Total cost ${costDelta > 0 ? 'increased' : 'decreased'} by $${Math.abs(costDelta).toFixed(2)}`
      );
    }

    if (scenario.metrics.riskScore > baseline.metrics.riskScore + 10) {
      criticalChanges.push('Risk score significantly increased');
    }

    return {
      scenarioId: scenario.id,
      durationDelta,
      costDelta,
      endDateDelta,
      criticalChanges
    };
  });

  // Generate recommendations
  const recommendations = generateRecommendations(scenarios, differences);

  return {
    scenarios,
    differences,
    recommendations
  };
}

/**
 * Generate recommendations based on scenario comparison
 */
function generateRecommendations(
  scenarios: Scenario[],
  differences: ScenarioComparison['differences']
): string[] {
  const recommendations: string[] = [];

  // Find scenario with best completion probability
  const bestScenario = scenarios.reduce((best, current) =>
    current.metrics.completionProbability > best.metrics.completionProbability ? current : best
  );

  recommendations.push(
    `Scenario "${bestScenario.name}" has the highest completion probability (${bestScenario.metrics.completionProbability.toFixed(1)}%)`
  );

  // Find scenario with lowest cost
  const cheapestScenario = scenarios.reduce((best, current) =>
    current.metrics.totalCost < best.metrics.totalCost ? current : best
  );

  if (cheapestScenario.id !== bestScenario.id) {
    recommendations.push(
      `Scenario "${cheapestScenario.name}" offers the lowest cost ($${cheapestScenario.metrics.totalCost.toFixed(2)})`
    );
  }

  // Find scenario with shortest duration
  const fastestScenario = scenarios.reduce((best, current) =>
    current.metrics.totalDuration < best.metrics.totalDuration ? current : best
  );

  if (fastestScenario.id !== bestScenario.id && fastestScenario.id !== cheapestScenario.id) {
    recommendations.push(
      `Scenario "${fastestScenario.name}" completes ${fastestScenario.metrics.totalDuration} days faster`
    );
  }

  // Risk warnings
  const highRiskScenarios = scenarios.filter(s => s.metrics.riskScore > 60);
  if (highRiskScenarios.length > 0) {
    recommendations.push(
      `Warning: ${highRiskScenarios.length} scenario(s) have high risk scores (>60)`
    );
  }

  return recommendations;
}

/**
 * Calculate impact of a change
 */
export function calculateChangeImpact(
  tasks: Task[],
  dependencies: Dependency[],
  change: Omit<ScenarioChange, 'id' | 'impact'>
): ScenarioChange {
  // Apply change temporarily to calculate impact
  const modifiedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
  
  const task = modifiedTasks.find(t => t.id === change.entityId);
  if (!task) {
    return {
      ...change,
      id: `change-${Date.now()}`,
      impact: {
        affectedTasks: 0,
        dateShift: 0,
        costDelta: 0
      }
    };
  }

  // Calculate before metrics
  const beforeMetrics = calculateScenarioMetrics(tasks, dependencies);

  // Apply change
  if (change.type === 'task_duration' && change.field === 'duration') {
    task.duration = change.newValue;
    const newEndDate = new Date(task.startDate);
    newEndDate.setDate(newEndDate.getDate() + change.newValue);
    task.endDate = newEndDate;
  }

  // Calculate after metrics
  const afterMetrics = calculateScenarioMetrics(modifiedTasks, dependencies);

  // Calculate impact
  const dateShift = differenceInDays(
    afterMetrics.projectEndDate,
    beforeMetrics.projectEndDate
  );

  const costDelta = afterMetrics.totalCost - beforeMetrics.totalCost;

  // Find affected tasks (simplified - tasks that depend on this one)
  const affectedTasks = dependencies
    .filter(dep => dep.fromTaskId === change.entityId)
    .map(dep => dep.toTaskId).length;

  return {
    ...change,
    id: `change-${Date.now()}`,
    impact: {
      affectedTasks,
      dateShift,
      costDelta
    }
  };
}

