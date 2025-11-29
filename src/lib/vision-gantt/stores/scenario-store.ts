

/**
 * ScenarioStore - Manages project scenarios for what-if analysis
 */



import type { Task, Dependency } from '../types';
import type { Scenario, ScenarioChange, ScenarioComparison } from '../types/advanced-features';
import {
  createScenario,
  applyScenarioChanges,
  compareScenarios,
  calculateChangeImpact
} from '../utils/scenario-utils';

export class ScenarioStore {
  private scenarios: Scenario[] = [];
  private activeScenarioId: string | null = null;
  private listeners = new Set<() => void>();

  constructor(initialScenarios: Scenario[] = []) {
    this.scenarios = initialScenarios;
  }

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Scenario management
  getScenarios(): Scenario[] {
    return this.scenarios;
  }

  getScenarioById(id: string): Scenario | undefined {
    return this.scenarios.find(s => s.id === id);
  }

  getActiveScenario(): Scenario | null {
    if (!this.activeScenarioId) return null;
    return this.getScenarioById(this.activeScenarioId) ?? null;
  }

  setActiveScenario(id: string) {
    if (this.scenarios.find(s => s.id === id)) {
      this.activeScenarioId = id;
      this.notify();
    }
  }

  createNewScenario(
    name: string,
    description: string,
    baselineTasks: Task[],
    baselineDependencies: Dependency[]
  ): Scenario {
    const scenario = createScenario(name, description, baselineTasks, baselineDependencies);
    this.scenarios.push(scenario);
    this.notify();
    return scenario;
  }

  updateScenario(id: string, updates: Partial<Scenario>) {
    const index = this.scenarios.findIndex(s => s.id === id);
    if (index !== -1) {
      this.scenarios[index] = { ...this.scenarios[index], ...updates };
      this.notify();
    }
  }

  deleteScenario(id: string) {
    this.scenarios = this.scenarios.filter(s => s.id !== id);
    if (this.activeScenarioId === id) {
      this.activeScenarioId = null;
    }
    this.notify();
  }

  // Apply changes
  applyChanges(
    baseScenarioId: string,
    tasks: Task[],
    changes: ScenarioChange[]
  ): { scenario: Scenario; tasks: Task[] } | null {
    const baseScenario = this.getScenarioById(baseScenarioId);
    if (!baseScenario) return null;

    const result = applyScenarioChanges(baseScenario, tasks, changes);
    
    // Add as new scenario
    this.scenarios.push(result.scenario);
    this.notify();

    return result;
  }

  // Calculate impact
  calculateImpact(
    tasks: Task[],
    dependencies: Dependency[],
    change: Omit<ScenarioChange, 'id' | 'impact'>
  ): ScenarioChange {
    return calculateChangeImpact(tasks, dependencies, change);
  }

  // Compare scenarios
  compare(scenarioIds: string[]): ScenarioComparison | null {
    const scenarios = scenarioIds
      .map(id => this.getScenarioById(id))
      .filter(s => s !== undefined) as Scenario[];

    if (scenarios.length === 0) return null;

    return compareScenarios(scenarios);
  }

  // Clone scenario
  cloneScenario(id: string, newName: string): Scenario | null {
    const original = this.getScenarioById(id);
    if (!original) return null;

    const cloned: Scenario = {
      ...original,
      id: `scenario-${Date.now()}`,
      name: newName,
      createdDate: new Date(),
      status: 'draft'
    };

    this.scenarios.push(cloned);
    this.notify();

    return cloned;
  }

  // Statistics
  getStats() {
    const totalScenarios = this.scenarios.length;
    const draftScenarios = this.scenarios.filter(s => s.status === 'draft').length;
    const activeScenarios = this.scenarios.filter(s => s.status === 'active').length;

    // Find best scenario by completion probability
    const bestScenario = this.scenarios.reduce(
      (best, current) =>
        current.metrics.completionProbability > (best?.metrics.completionProbability ?? 0)
          ? current
          : best,
      null as Scenario | null
    );

    return {
      totalScenarios,
      draftScenarios,
      activeScenarios,
      bestScenario
    };
  }
}

