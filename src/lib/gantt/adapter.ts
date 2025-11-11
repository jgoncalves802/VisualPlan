/**
 * VisionPlan Gantt - Adapter
 * Converte dados entre VisionPlan e Frappe Gantt
 */

import { AtividadeMock } from '../../types/cronograma';
import { VPGanttTask, VPGanttAdapter } from './types';

/**
 * Adapter padrão para Frappe Gantt
 */
export class FrappeGanttAdapter implements VPGanttAdapter {
  /**
   * Converte atividades do VisionPlan para tasks do Frappe Gantt
   */
  toGanttTasks(atividades: AtividadeMock[]): VPGanttTask[] {
    return atividades.map((atividade) => {
      // Determina classe CSS baseada em status e criticidade
      let customClass = '';
      
      if (atividade.e_critica) {
        customClass = 'vp-critical';
      } else if (atividade.progresso === 100) {
        customClass = 'vp-completed';
      } else if (atividade.status === 'Atrasada') {
        customClass = 'vp-delayed';
      } else if (atividade.tipo === 'Fase') {
        customClass = 'vp-phase';
      } else if (atividade.tipo === 'Marco') {
        customClass = 'vp-milestone';
      }

      return {
        id: atividade.id,
        name: atividade.codigo 
          ? `${atividade.codigo} - ${atividade.nome}` 
          : atividade.nome,
        start: new Date(atividade.data_inicio),
        end: new Date(atividade.data_fim),
        progress: atividade.progresso,
        custom_class: customClass,
        parent: atividade.parent_id,
        
        // Dados customizados (para tooltips e callbacks)
        tipo: atividade.tipo,
        status: atividade.status,
        responsavel: atividade.responsavel_nome,
        e_critica: atividade.e_critica,
        duracao_horas: atividade.duracao_horas,
        codigo: atividade.codigo,
      };
    });
  }

  /**
   * Converte task do Gantt de volta para atividade
   */
  fromGanttTask(task: VPGanttTask): Partial<AtividadeMock> {
    return {
      id: task.id,
      nome: task.name.includes(' - ') 
        ? task.name.split(' - ').slice(1).join(' - ') 
        : task.name,
      data_inicio: task.start.toISOString(),
      data_fim: task.end.toISOString(),
      progresso: task.progress,
      parent_id: task.parent,
    };
  }

  /**
   * Aplica dependências às tasks
   */
  applyDependencies(
    tasks: VPGanttTask[],
    atividades: AtividadeMock[],
    dependencias: Array<{ atividade_origem_id: string; atividade_destino_id: string }>
  ): VPGanttTask[] {
    return tasks.map((task) => {
      // Encontra dependências para esta task
      const deps = dependencias
        .filter((dep) => dep.atividade_destino_id === task.id)
        .map((dep) => dep.atividade_origem_id);

      // Adiciona parent_id como dependência implícita (para hierarquia)
      if (task.parent && !deps.includes(task.parent)) {
        deps.push(task.parent);
      }

      return {
        ...task,
        dependencies: deps.length > 0 ? deps : undefined,
      };
    });
  }
}

/**
 * Função helper para criar adapter
 */
export function createGanttAdapter(): VPGanttAdapter {
  return new FrappeGanttAdapter();
}

