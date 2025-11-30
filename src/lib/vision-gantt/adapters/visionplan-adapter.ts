import type { Task, Dependency, Resource, Assignment, TaskStatus, DependencyType } from '../types';
import type { WorkingCalendar, WorkingDay, Holiday, CalendarException } from '../types/advanced-features';
import type { AtividadeMock, DependenciaAtividade, TipoDependencia, CalendarioProjeto, DiaTrabalho } from '../../../types/cronograma';
import type { Resource as VPResource, ResourceAllocation } from '../../../services/resourceService';

const STATUS_MAP_TO_GANTT: Record<string, TaskStatus> = {
  'A Fazer': 'not_started',
  'Em Andamento': 'in_progress',
  'Concluída': 'completed',
  'Bloqueada': 'on_hold',
  'Não Iniciada': 'not_started',
  'Em Progresso': 'in_progress',
  'Pausada': 'on_hold',
  'Cancelada': 'on_hold',
  'not_started': 'not_started',
  'in_progress': 'in_progress',
  'completed': 'completed',
  'on_hold': 'on_hold',
};

const STATUS_MAP_TO_VP: Record<TaskStatus, string> = {
  'not_started': 'A Fazer',
  'in_progress': 'Em Andamento',
  'completed': 'Concluída',
  'on_hold': 'Bloqueada',
};

const PRIORITY_MAP: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  'Baixa': 'low',
  'Média': 'medium',
  'Alta': 'high',
  'Crítica': 'critical',
};

export function atividadeToGanttTask(atividade: AtividadeMock): Task {
  return {
    id: atividade.id,
    name: atividade.nome,
    startDate: new Date(atividade.data_inicio),
    endDate: new Date(atividade.data_fim),
    duration: atividade.duracao_dias,
    progress: atividade.progresso,
    status: STATUS_MAP_TO_GANTT[atividade.status] || 'not_started',
    parentId: atividade.parent_id || null,
    wbs: atividade.edt,
    isGroup: atividade.tipo === 'Fase',
    isMilestone: atividade.tipo === 'Marco',
    description: atividade.descricao,
    priority: atividade.prioridade ? PRIORITY_MAP[atividade.prioridade] : undefined,
    expanded: true,
  };
}

export function ganttTaskToAtividade(
  task: Task, 
  projetoId: string, 
  originalAtividade?: AtividadeMock
): AtividadeMock {
  const now = new Date().toISOString();
  
  return {
    id: task.id,
    projeto_id: projetoId,
    codigo: originalAtividade?.codigo,
    edt: task.wbs,
    nome: task.name,
    descricao: task.description,
    tipo: task.isMilestone ? 'Marco' : (task.isGroup ? 'Fase' : 'Tarefa'),
    parent_id: task.parentId || undefined,
    data_inicio: task.startDate.toISOString().split('T')[0],
    data_fim: task.endDate.toISOString().split('T')[0],
    duracao_dias: task.duration || Math.ceil(
      (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
    progresso: task.progress,
    status: STATUS_MAP_TO_VP[task.status] || originalAtividade?.status || 'A Fazer',
    responsavel_id: originalAtividade?.responsavel_id,
    responsavel_nome: originalAtividade?.responsavel_nome,
    setor_id: originalAtividade?.setor_id,
    prioridade: originalAtividade?.prioridade,
    e_critica: originalAtividade?.e_critica,
    folga_total: originalAtividade?.folga_total,
    calendario_id: originalAtividade?.calendario_id,
    custo_planejado: originalAtividade?.custo_planejado,
    custo_real: originalAtividade?.custo_real,
    valor_planejado: originalAtividade?.valor_planejado,
    valor_real: originalAtividade?.valor_real,
    created_at: originalAtividade?.created_at || now,
    updated_at: now,
  };
}

export function dependenciaToGanttDependency(dep: DependenciaAtividade): Dependency {
  return {
    id: dep.id,
    fromTaskId: dep.atividade_origem_id,
    toTaskId: dep.atividade_destino_id,
    type: dep.tipo as DependencyType,
    lag: dep.lag_dias,
  };
}

export function ganttDependencyToDependencia(
  dep: Dependency,
  originalDep?: DependenciaAtividade
): DependenciaAtividade {
  return {
    id: dep.id,
    atividade_origem_id: dep.fromTaskId,
    atividade_destino_id: dep.toTaskId,
    tipo: dep.type as unknown as TipoDependencia,
    lag_dias: dep.lag,
    created_at: originalDep?.created_at,
  };
}

export function vpResourceToGanttResource(resource: VPResource): Resource {
  return {
    id: resource.id,
    name: resource.nome,
    role: resource.cargo,
    email: resource.email,
    avatar: resource.avatarUrl,
    capacity: resource.capacidadeDiaria,
    costRate: resource.custoPorHora,
    costType: 'hour',
    totalCost: resource.custoFixo,
  };
}

export function vpAllocationToGanttAssignment(allocation: ResourceAllocation): Assignment {
  return {
    id: allocation.id,
    taskId: allocation.atividadeId,
    resourceId: allocation.resourceId,
    units: allocation.unidades,
  };
}

export function convertAtividadesToTasks(atividades: AtividadeMock[]): Task[] {
  const taskMap = new Map<string, Task>();
  
  atividades.forEach(atividade => {
    const task = atividadeToGanttTask(atividade);
    taskMap.set(task.id, task);
  });

  atividades.forEach(atividade => {
    if (atividade.parent_id && taskMap.has(atividade.parent_id)) {
      const parent = taskMap.get(atividade.parent_id)!;
      const child = taskMap.get(atividade.id)!;
      
      if (!parent.children) parent.children = [];
      parent.children.push(child);
      child.level = (parent.level || 0) + 1;
    }
  });

  return Array.from(taskMap.values()).filter(task => !task.parentId);
}

export function flattenTasksToAtividades(
  tasks: Task[], 
  projetoId: string,
  originalAtividades: AtividadeMock[]
): AtividadeMock[] {
  const originalMap = new Map(originalAtividades.map(a => [a.id, a]));
  const result: AtividadeMock[] = [];

  function flatten(taskList: Task[], parentId?: string) {
    taskList.forEach(task => {
      const atividade = ganttTaskToAtividade(
        { ...task, parentId: parentId || task.parentId },
        projetoId,
        originalMap.get(task.id)
      );
      result.push(atividade);

      if (task.children && task.children.length > 0) {
        flatten(task.children, task.id);
      }
    });
  }

  flatten(tasks);
  return result;
}

export function convertDependenciesToGantt(deps: DependenciaAtividade[]): Dependency[] {
  return deps.map(dependenciaToGanttDependency);
}

export function convertResourcesAndAllocations(
  resources: VPResource[],
  allocations: ResourceAllocation[]
): { resources: Resource[]; assignments: Assignment[] } {
  return {
    resources: resources.map(vpResourceToGanttResource),
    assignments: allocations.map(vpAllocationToGanttAssignment),
  };
}

export function detectTaskChanges(
  original: AtividadeMock,
  updated: Task
): Partial<AtividadeMock> {
  const changes: Partial<AtividadeMock> = {};
  
  const newStartDate = updated.startDate.toISOString().split('T')[0];
  const newEndDate = updated.endDate.toISOString().split('T')[0];
  
  if (original.data_inicio !== newStartDate) {
    changes.data_inicio = newStartDate;
  }
  
  if (original.data_fim !== newEndDate) {
    changes.data_fim = newEndDate;
  }
  
  const newDuration = Math.ceil(
    (updated.endDate.getTime() - updated.startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (original.duracao_dias !== newDuration) {
    changes.duracao_dias = newDuration;
  }
  
  if (original.progresso !== updated.progress) {
    changes.progresso = updated.progress;
  }
  
  if (original.nome !== updated.name) {
    changes.nome = updated.name;
  }
  
  const newStatus = STATUS_MAP_TO_VP[updated.status];
  if (newStatus && original.status !== newStatus) {
    changes.status = newStatus;
  }
  
  if (original.edt !== updated.wbs) {
    changes.edt = updated.wbs;
  }
  
  const originalParentId = original.parent_id ?? null;
  const updatedParentId = updated.parentId ?? null;
  if (originalParentId !== updatedParentId) {
    changes.parent_id = updatedParentId ?? undefined;
  }
  
  const originalTipo = original.tipo;
  let newTipo: 'Marco' | 'Fase' | 'Tarefa';
  if (updated.isMilestone) {
    newTipo = 'Marco';
  } else if (updated.isGroup) {
    newTipo = 'Fase';
  } else {
    newTipo = 'Tarefa';
  }
  if (originalTipo !== newTipo) {
    changes.tipo = newTipo;
  }
  
  return changes;
}

export interface GanttDataSync {
  tasks: Task[];
  dependencies: Dependency[];
  resources: Resource[];
  assignments: Assignment[];
  criticalPathIds: string[];
  conflictTaskIds: string[];
}

export function createGanttDataSync(
  atividades: AtividadeMock[],
  dependencias: DependenciaAtividade[],
  resources: VPResource[] = [],
  allocations: ResourceAllocation[] = []
): GanttDataSync {
  const tasks = convertAtividadesToTasks(atividades);
  const dependencies = convertDependenciesToGantt(dependencias);
  const { resources: ganttResources, assignments } = convertResourcesAndAllocations(resources, allocations);
  
  const criticalPathIds = atividades
    .filter(a => a.e_critica)
    .map(a => a.id);
  
  const conflictTaskIds: string[] = [];

  return {
    tasks,
    dependencies,
    resources: ganttResources,
    assignments,
    criticalPathIds,
    conflictTaskIds,
  };
}

const DAY_OF_WEEK_MAP: Record<DiaTrabalho, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
  'DOMINGO': 0,
  'SEGUNDA': 1,
  'TERCA': 2,
  'QUARTA': 3,
  'QUINTA': 4,
  'SEXTA': 5,
  'SABADO': 6,
};

export function vpCalendarToGanttCalendar(calendar: CalendarioProjeto): WorkingCalendar {
  const workingDays: WorkingDay[] = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
    dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    isWorking: calendar.dias_trabalho.some(
      (d) => DAY_OF_WEEK_MAP[d] === day
    ),
    workingHours: calendar.dias_trabalho.some((d) => DAY_OF_WEEK_MAP[d] === day)
      ? [
          { startTime: calendar.horario_inicio, endTime: calendar.horario_almoco_inicio || calendar.horario_fim },
          ...(calendar.horario_almoco_fim
            ? [{ startTime: calendar.horario_almoco_fim, endTime: calendar.horario_fim }]
            : []),
        ]
      : undefined,
  }));

  const holidays: Holiday[] = calendar.excecoes
    .filter((exc) => !exc.trabalhando)
    .map((exc) => ({
      id: exc.id,
      name: exc.nome,
      date: new Date(exc.data_inicio),
      recurring: exc.recorrencia === 'ANUALMENTE',
      type: 'company' as const,
    }));

  const exceptions: CalendarException[] = calendar.excecoes
    .filter((exc) => exc.trabalhando)
    .map((exc) => ({
      id: exc.id,
      startDate: new Date(exc.data_inicio),
      endDate: exc.data_fim ? new Date(exc.data_fim) : new Date(exc.data_inicio),
      isWorking: true,
      workingHours: exc.periodos?.map((p) => ({
        startTime: p.inicio,
        endTime: p.fim,
      })),
      reason: exc.nome,
    }));

  return {
    id: calendar.id,
    name: calendar.nome,
    description: calendar.descricao,
    workingDays,
    holidays,
    exceptions,
    defaultStartTime: calendar.horario_inicio,
    defaultEndTime: calendar.horario_fim,
  };
}

export function convertCalendarsToGantt(calendars: CalendarioProjeto[]): WorkingCalendar[] {
  return calendars.map(vpCalendarToGanttCalendar);
}
