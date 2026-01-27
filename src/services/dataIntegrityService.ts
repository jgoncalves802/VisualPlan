/**
 * Data Integrity Service
 * Validates and ensures data isolation between projects
 * Detects and auto-corrects data contamination issues
 */

import { AtividadeMock, DependenciaAtividade } from '../types/cronograma';

export interface DataIntegrityIssue {
  type: 'CROSS_PROJECT_ACTIVITY' | 'CROSS_PROJECT_DEPENDENCY' | 'ORPHAN_ACTIVITY' | 'INVALID_PARENT' | 'STALE_CACHE';
  severity: 'error' | 'warning';
  message: string;
  affectedIds: string[];
  projetoId?: string;
  expectedProjetoId?: string;
  autoFixable: boolean;
}

export interface DataIntegrityReport {
  isValid: boolean;
  issues: DataIntegrityIssue[];
  timestamp: Date;
  projetoId: string;
  stats: {
    totalActivities: number;
    totalDependencies: number;
    validActivities: number;
    validDependencies: number;
  };
}

export interface AutoFixResult {
  fixed: boolean;
  issuesFixed: number;
  issuesRemaining: number;
  removedActivityIds: string[];
  removedDependencyIds: string[];
}

class DataIntegrityService {
  /**
   * Validates that all activities belong to the specified project
   */
  validateActivityProjectIsolation(
    activities: AtividadeMock[],
    expectedProjetoId: string
  ): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    
    const invalidActivities = activities.filter(
      a => a.projeto_id && a.projeto_id !== expectedProjetoId && !a.id.startsWith('wbs-')
    );
    
    if (invalidActivities.length > 0) {
      issues.push({
        type: 'CROSS_PROJECT_ACTIVITY',
        severity: 'error',
        message: `Detected ${invalidActivities.length} activities from different projects`,
        affectedIds: invalidActivities.map(a => a.id),
        projetoId: invalidActivities[0]?.projeto_id,
        expectedProjetoId,
        autoFixable: true,
      });
    }
    
    return issues;
  }

  /**
   * Validates that all dependencies reference valid activities within the project
   */
  validateDependencyIsolation(
    dependencies: DependenciaAtividade[],
    activities: AtividadeMock[],
    expectedProjetoId: string
  ): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const activityIds = new Set(activities.map(a => a.id));
    
    const orphanDependencies = dependencies.filter(
      d => !activityIds.has(d.atividade_origem_id) || !activityIds.has(d.atividade_destino_id)
    );
    
    if (orphanDependencies.length > 0) {
      issues.push({
        type: 'CROSS_PROJECT_DEPENDENCY',
        severity: 'error',
        message: `Detected ${orphanDependencies.length} dependencies referencing activities from other projects`,
        affectedIds: orphanDependencies.map(d => d.id),
        expectedProjetoId,
        autoFixable: true,
      });
    }
    
    return issues;
  }

  /**
   * Validates parent-child relationships are within the same project
   */
  validateParentChildRelationships(
    activities: AtividadeMock[],
    expectedProjetoId: string
  ): DataIntegrityIssue[] {
    const issues: DataIntegrityIssue[] = [];
    const activityMap = new Map(activities.map(a => [a.id, a]));
    
    const invalidParents = activities.filter(a => {
      if (!a.parent_id) return false;
      const parent = activityMap.get(a.parent_id);
      return parent && parent.projeto_id !== a.projeto_id;
    });
    
    if (invalidParents.length > 0) {
      issues.push({
        type: 'INVALID_PARENT',
        severity: 'error',
        message: `Detected ${invalidParents.length} activities with parents from different projects`,
        affectedIds: invalidParents.map(a => a.id),
        expectedProjetoId,
        autoFixable: false,
      });
    }
    
    const orphanActivities = activities.filter(a => {
      if (!a.parent_id || a.parent_id.startsWith('wbs-')) return false;
      return !activityMap.has(a.parent_id);
    });
    
    if (orphanActivities.length > 0) {
      issues.push({
        type: 'ORPHAN_ACTIVITY',
        severity: 'warning',
        message: `Detected ${orphanActivities.length} activities with missing parent references`,
        affectedIds: orphanActivities.map(a => a.id),
        expectedProjetoId,
        autoFixable: true,
      });
    }
    
    return issues;
  }

  /**
   * Full validation of data integrity for a project
   */
  validateProject(
    projetoId: string,
    activities: AtividadeMock[],
    dependencies: DependenciaAtividade[]
  ): DataIntegrityReport {
    const allIssues: DataIntegrityIssue[] = [];
    
    allIssues.push(...this.validateActivityProjectIsolation(activities, projetoId));
    allIssues.push(...this.validateDependencyIsolation(dependencies, activities, projetoId));
    allIssues.push(...this.validateParentChildRelationships(activities, projetoId));
    
    const validActivities = activities.filter(
      a => !a.projeto_id || a.projeto_id === projetoId || a.id.startsWith('wbs-')
    );
    
    const activityIds = new Set(validActivities.map(a => a.id));
    const validDependencies = dependencies.filter(
      d => activityIds.has(d.atividade_origem_id) && activityIds.has(d.atividade_destino_id)
    );
    
    return {
      isValid: allIssues.length === 0,
      issues: allIssues,
      timestamp: new Date(),
      projetoId,
      stats: {
        totalActivities: activities.length,
        totalDependencies: dependencies.length,
        validActivities: validActivities.length,
        validDependencies: validDependencies.length,
      },
    };
  }

  /**
   * Auto-fix data integrity issues by removing contaminated data
   * Returns the cleaned arrays
   */
  autoFixIssues(
    projetoId: string,
    activities: AtividadeMock[],
    dependencies: DependenciaAtividade[]
  ): { 
    activities: AtividadeMock[]; 
    dependencies: DependenciaAtividade[];
    result: AutoFixResult;
  } {
    const removedActivityIds: string[] = [];
    const removedDependencyIds: string[] = [];
    
    const cleanedActivities = activities.filter(a => {
      if (a.id.startsWith('wbs-') || a.id.startsWith('eps-')) return true;
      
      if (a.projeto_id && a.projeto_id !== projetoId) {
        removedActivityIds.push(a.id);
        console.warn(`[DataIntegrity] Removed cross-project activity: ${a.id} (belongs to ${a.projeto_id}, expected ${projetoId})`);
        return false;
      }
      return true;
    });
    
    const cleanedActivityIds = new Set(cleanedActivities.map(a => a.id));
    
    const cleanedDependencies = dependencies.filter(d => {
      if (!cleanedActivityIds.has(d.atividade_origem_id) || !cleanedActivityIds.has(d.atividade_destino_id)) {
        removedDependencyIds.push(d.id);
        console.warn(`[DataIntegrity] Removed orphan dependency: ${d.id}`);
        return false;
      }
      return true;
    });
    
    const cleanedActivitiesWithParents = cleanedActivities.map(a => {
      if (a.parent_id && !a.parent_id.startsWith('wbs-') && !cleanedActivityIds.has(a.parent_id)) {
        console.warn(`[DataIntegrity] Cleared invalid parent_id for activity: ${a.id}`);
        return { ...a, parent_id: undefined };
      }
      return a;
    });
    
    return {
      activities: cleanedActivitiesWithParents,
      dependencies: cleanedDependencies,
      result: {
        fixed: removedActivityIds.length > 0 || removedDependencyIds.length > 0,
        issuesFixed: removedActivityIds.length + removedDependencyIds.length,
        issuesRemaining: 0,
        removedActivityIds,
        removedDependencyIds,
      },
    };
  }

  /**
   * Log data integrity report to console for debugging
   */
  logReport(report: DataIntegrityReport): void {
    if (report.isValid) {
      console.log(`[DataIntegrity] ✓ Project ${report.projetoId} data is valid:`, report.stats);
    } else {
      console.error(`[DataIntegrity] ✗ Project ${report.projetoId} has ${report.issues.length} issues:`);
      report.issues.forEach(issue => {
        const icon = issue.severity === 'error' ? '❌' : '⚠️';
        console.error(`  ${icon} ${issue.type}: ${issue.message}`);
        console.error(`     Affected IDs: ${issue.affectedIds.slice(0, 5).join(', ')}${issue.affectedIds.length > 5 ? '...' : ''}`);
      });
    }
  }
}

export const dataIntegrityService = new DataIntegrityService();
