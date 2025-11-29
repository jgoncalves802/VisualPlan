

/**
 * ConstraintStore - Manages task constraints and violations
 */



import type { Task } from '../types';
import type {
  TaskConstraint,
  ConstraintViolation,
  WorkingCalendar
} from '../types/advanced-features';
import { validateConstraint, applyConstraint } from '../utils/calendar-utils';

export class ConstraintStore {
  private constraints: TaskConstraint[] = [];
  private violations: ConstraintViolation[] = [];
  private listeners = new Set<() => void>();

  constructor(initialConstraints: TaskConstraint[] = []) {
    this.constraints = initialConstraints;
  }

  // Subscribe to changes
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Constraint management
  getConstraints(): TaskConstraint[] {
    return this.constraints;
  }

  getConstraintsByTask(taskId: string): TaskConstraint[] {
    return this.constraints.filter(c => c.taskId === taskId);
  }

  addConstraint(constraint: TaskConstraint) {
    // Remove existing constraint of same type for this task
    this.constraints = this.constraints.filter(
      c => !(c.taskId === constraint.taskId && c.type === constraint.type)
    );
    this.constraints.push(constraint);
    this.notify();
  }

  updateConstraint(taskId: string, type: string, updates: Partial<TaskConstraint>) {
    const index = this.constraints.findIndex(
      c => c.taskId === taskId && c.type === type
    );
    if (index !== -1) {
      this.constraints[index] = { ...this.constraints[index], ...updates };
      this.notify();
    }
  }

  removeConstraint(taskId: string, type?: string) {
    if (type) {
      this.constraints = this.constraints.filter(
        c => !(c.taskId === taskId && c.type === type)
      );
    } else {
      this.constraints = this.constraints.filter(c => c.taskId !== taskId);
    }
    this.notify();
  }

  // Violation detection
  getViolations(): ConstraintViolation[] {
    return this.violations;
  }

  getViolationsByTask(taskId: string): ConstraintViolation[] {
    return this.violations.filter(v => v.taskId === taskId);
  }

  validateAllConstraints(tasks: Task[], calendar?: WorkingCalendar) {
    this.violations = [];

    this.constraints.forEach(constraint => {
      const task = tasks.find(t => t.id === constraint.taskId);
      if (task) {
        const violation = validateConstraint(task, constraint, calendar);
        if (violation) {
          this.violations.push(violation);
        }
      }
    });

    this.notify();
  }

  // Auto-resolve violations
  applyConstraints(
    tasks: Task[],
    calendar?: WorkingCalendar
  ): { tasks: Task[]; resolved: number; remaining: number } {
    let adjustedTasks = JSON.parse(JSON.stringify(tasks)) as Task[];
    let resolved = 0;

    this.constraints.forEach(constraint => {
      const task = adjustedTasks.find(t => t.id === constraint.taskId);
      if (task) {
        const violation = validateConstraint(task, constraint, calendar);
        if (violation && violation.canAutoResolve) {
          const adjusted = applyConstraint(task, constraint, calendar);
          const index = adjustedTasks.findIndex(t => t.id === task.id);
          if (index !== -1) {
            adjustedTasks[index] = adjusted;
            resolved++;
          }
        }
      }
    });

    // Re-validate to get remaining violations
    this.validateAllConstraints(adjustedTasks, calendar);
    const remaining = this.violations.length;

    return {
      tasks: adjustedTasks,
      resolved,
      remaining
    };
  }

  // Statistics
  getStats() {
    const totalConstraints = this.constraints.length;
    const totalViolations = this.violations.length;
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length;
    const autoResolvable = this.violations.filter(v => v.canAutoResolve).length;

    // Group by constraint type
    const byType: Record<string, number> = {};
    this.constraints.forEach(c => {
      byType[c.type] = (byType[c.type] ?? 0) + 1;
    });

    return {
      totalConstraints,
      totalViolations,
      criticalViolations,
      autoResolvable,
      byType
    };
  }
}

