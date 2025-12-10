import type { Task, Dependency, Resource, Assignment, TaskStatus, DependencyType, DependencyInfo } from '../types';
import type { WorkingCalendar, WorkingDay, Holiday, CalendarException } from '../types/advanced-features';
import type { AtividadeMock, DependenciaAtividade, TipoDependencia, CalendarioProjeto, DiaTrabalho } from '../../../types/cronograma';
import type { Resource as VPResource, ResourceAllocation } from '../../../services/resourceService';
import type { BaselineTask, BaselineVariance } from '../../../services/baselineService';
import type { ActivityTaskCode } from '../../../services/activityCodeService';

export interface P6DataContext {
  project?: {
    id?: string;
    nome?: string;
    codigo?: string;
    epsId?: string;
    epsName?: string;
    responsavel?: string;
  };
  baseline?: {
    id?: string;
    numero?: number;
    task?: BaselineTask;
    variance?: BaselineVariance;
  };
  activityCodes?: ActivityTaskCode[];
}

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

/**
 * Parse a date string as a local date, avoiding timezone issues.
 * Accepts YYYY-MM-DD format and creates a Date at noon local time.
 */
function parseLocalDate(dateStr: string | Date | null | undefined): Date {
  if (!dateStr) return new Date();
  if (dateStr instanceof Date) return dateStr;
  
  // If it's a YYYY-MM-DD string, parse as local
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Noon to avoid DST issues
  }
  
  // For ISO strings or other formats, try standard parsing but adjust to local noon
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    // Extract the date components and recreate at noon local time
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const day = parsed.getDate();
    return new Date(year, month, day, 12, 0, 0);
  }
  
  return new Date();
}

export function atividadeToGanttTask(atividade: AtividadeMock, projectContext?: { 
  id?: string; 
  nome?: string; 
  codigo?: string;
  epsId?: string;
  epsName?: string;
  responsavel?: string;
}): Task {
  const wbsLevel = atividade.edt ? atividade.edt.split('.').length - 1 : 0;
  
  // Handle WBS/EPS nodes - they are read-only summary tasks
  const isWbsOrEps = atividade.is_wbs_node || atividade.is_eps_node || atividade.tipo === 'WBS';
  
  // Calculate variances if baseline data is present
  // Use parseLocalDate to avoid timezone issues
  const startDate = parseLocalDate(atividade.data_inicio);
  const endDate = parseLocalDate(atividade.data_fim);
  
  // Calculate EVM metrics
  const bcws = atividade.valor_planejado; // Planned Value
  const acwp = atividade.custo_real; // Actual Cost
  const bcwp = bcws ? (bcws * (atividade.progresso / 100)) : undefined; // Earned Value = PV * %Complete
  const bac = atividade.custo_planejado; // Budget at Completion
  
  // Calculate performance indices if we have values
  let cpi: number | undefined;
  let spi: number | undefined;
  let eac: number | undefined;
  let etc: number | undefined;
  let vac: number | undefined;
  
  if (bcwp !== undefined && acwp !== undefined && acwp > 0) {
    cpi = bcwp / acwp; // Cost Performance Index
  }
  if (bcwp !== undefined && bcws !== undefined && bcws > 0) {
    spi = bcwp / bcws; // Schedule Performance Index
  }
  if (cpi !== undefined && bac !== undefined && cpi > 0) {
    eac = bac / cpi; // Estimate at Completion
    vac = bac - eac; // Variance at Completion
    etc = acwp !== undefined ? eac - acwp : undefined; // Estimate to Complete
  }
  
  return {
    id: atividade.id,
    name: atividade.nome,
    startDate: startDate,
    endDate: endDate,
    duration: atividade.duracao_dias,
    progress: atividade.progresso,
    status: STATUS_MAP_TO_GANTT[atividade.status] || 'not_started',
    parentId: atividade.parent_id || null,
    wbs: atividade.edt,
    wbsLevel: isWbsOrEps ? (atividade.wbs_nivel ?? wbsLevel) : wbsLevel,
    isGroup: isWbsOrEps || atividade.tipo === 'Fase',
    isMilestone: atividade.tipo === 'Marco',
    description: atividade.descricao,
    priority: atividade.prioridade ? PRIORITY_MAP[atividade.prioridade] : undefined,
    expanded: true,
    
    // WBS/EPS read-only flags
    isReadOnly: isWbsOrEps,
    isWbsNode: atividade.is_wbs_node,
    isEpsNode: atividade.is_eps_node,
    wbsColor: atividade.wbs_cor,
    
    // EPS/Project Fields (from context)
    projectId: projectContext?.id || atividade.projeto_id,
    projectName: projectContext?.nome,
    projectCode: projectContext?.codigo || atividade.codigo,
    projectManager: projectContext?.responsavel,
    epsId: projectContext?.epsId,
    epsName: projectContext?.epsName,
    
    // Critical Path Fields
    isCritical: atividade.e_critica,
    totalFloat: atividade.folga_total,
    
    // Calendar
    calendarId: atividade.calendario_id,
    
    // Resource assignment from responsavel
    resourceName: atividade.responsavel_nome,
    
    // Sector
    sectorId: atividade.setor_id,
    
    // P6 Baseline Fields - Empty when no baseline is set
    blStartDate: undefined,
    blFinishDate: undefined,
    blDuration: undefined,
    blCost: undefined,
    startVariance: undefined,
    finishVariance: undefined,
    durationVariance: undefined,
    costVariance: undefined,
    
    // Cost Fields
    plannedCost: atividade.custo_planejado,
    actualCost: atividade.custo_real,
    plannedValue: atividade.valor_planejado,
    actualValue: atividade.valor_real,
    unitCost: atividade.custo_unitario,
    plannedQuantity: atividade.quantidade_planejada,
    actualQuantity: atividade.quantidade_real,
    unitOfMeasure: atividade.unidade_medida,
    
    // Duration fields
    durationHours: atividade.duracao_horas,
    durationUnit: atividade.unidade_tempo === 'HORAS' ? 'h' : 'd',
    
    // EVM Fields - Calculated values
    bcws: bcws, // Planned Value
    acwp: acwp, // Actual Cost
    bcwp: bcwp, // Earned Value
    bac: bac, // Budget at Completion
    eac: eac, // Estimate at Completion
    etc: etc, // Estimate to Complete
    vac: vac, // Variance at Completion
    cpi: cpi, // Cost Performance Index
    spi: spi, // Schedule Performance Index
    csi: (cpi !== undefined && spi !== undefined) ? cpi * spi : undefined, // Cost Schedule Index
  };
}

export function atividadeToGanttTaskWithP6(
  atividade: AtividadeMock,
  p6Context?: P6DataContext
): Task {
  const baseTask = atividadeToGanttTask(atividade, p6Context?.project);
  
  if (!p6Context) return baseTask;
  
  const { baseline, activityCodes } = p6Context;
  
  if (baseline?.task) {
    const blTask = baseline.task;
    baseTask.blStartDate = new Date(blTask.dataInicioPlanejada);
    baseTask.blFinishDate = new Date(blTask.dataFimPlanejada);
    baseTask.blDuration = blTask.duracaoPlanejada;
    baseTask.blCost = blTask.custoPlanejado;
    baseTask.blWork = blTask.trabalhoPlanejado;
    baseTask.baselineId = baseline.id;
    baseTask.baselineNumber = baseline.numero;
    
    baseTask.earlyStart = blTask.earlyStart ? new Date(blTask.earlyStart) : undefined;
    baseTask.earlyFinish = blTask.earlyFinish ? new Date(blTask.earlyFinish) : undefined;
    baseTask.lateStart = blTask.lateStart ? new Date(blTask.lateStart) : undefined;
    baseTask.lateFinish = blTask.lateFinish ? new Date(blTask.lateFinish) : undefined;
    baseTask.freeFloat = blTask.folgaLivre;
  }
  
  if (baseline?.variance) {
    const variance = baseline.variance;
    baseTask.startVariance = variance.variacaoDiasInicio;
    baseTask.finishVariance = variance.variacaoDiasFim;
    baseTask.durationVariance = variance.variacaoDuracao;
    baseTask.costVariance = variance.variacaoCusto;
    baseTask.workVariance = variance.variacaoProgresso;
  }
  
  if (activityCodes && activityCodes.length > 0) {
    for (const code of activityCodes) {
      if (!code.codeType || !code.codeValue) continue;
      
      const typeCodigo = code.codeType.codigo?.toUpperCase();
      const value = code.codeValue.valor;
      const desc = code.codeValue.descricao || value;
      
      if (!baseTask.activityCode) {
        baseTask.activityCode = value;
        baseTask.activityCodeType = code.codeType.nome;
      }
      
      switch (typeCodigo) {
        case 'DISC':
          baseTask.discipline = desc;
          break;
        case 'AREA':
          baseTask.area = desc;
          break;
        case 'FASE':
          baseTask.phase = desc;
          break;
        case 'RESP':
          baseTask.responsibleContractor = desc;
          break;
        case 'TIPO':
          baseTask.workType = desc;
          break;
      }
    }
  }
  
  return baseTask;
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

/**
 * Calcula as datas de uma tarefa pai com base em suas filhas (rollup)
 * Data início = menor data de início das filhas
 * Data fim = maior data de término das filhas
 * Duração = diferença em dias entre início e fim
 * Progresso = média ponderada pelo tempo de duração das filhas
 */
function calculateParentDates(parent: Task, children: Task[]): void {
  if (!children || children.length === 0) return;
  
  // Encontrar a data de início mais antiga
  const minStartDate = children.reduce((min, child) => {
    return child.startDate < min ? child.startDate : min;
  }, children[0].startDate);
  
  // Encontrar a data de término mais recente
  const maxEndDate = children.reduce((max, child) => {
    return child.endDate > max ? child.endDate : max;
  }, children[0].endDate);
  
  // Calcular duração em dias
  const duration = Math.ceil(
    (maxEndDate.getTime() - minStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Calcular progresso ponderado pela duração das filhas
  const totalDuration = children.reduce((sum, child) => sum + (child.duration || 1), 0);
  const weightedProgress = children.reduce((sum, child) => {
    const childDuration = child.duration || 1;
    return sum + (child.progress * childDuration);
  }, 0);
  const progress = totalDuration > 0 ? Math.round(weightedProgress / totalDuration) : 0;
  
  // Atualizar parent
  parent.startDate = minStartDate;
  parent.endDate = maxEndDate;
  parent.duration = duration;
  parent.progress = progress;
  
  console.log(`[calculateParentDates] 📊 Rollup calculado para "${parent.name}":`,
    `Início: ${minStartDate.toISOString().split('T')[0]},`,
    `Fim: ${maxEndDate.toISOString().split('T')[0]},`,
    `Duração: ${duration} dias,`,
    `Progresso: ${progress}% (${children.length} filhas)`
  );
}

export function convertAtividadesToTasks(atividades: AtividadeMock[]): Task[] {
  console.log('[convertAtividadesToTasks] ========== CONVERSÃO DE ATIVIDADES PARA TASKS ==========');
  console.log('[convertAtividadesToTasks] Total de atividades recebidas:', atividades.length);
  console.log('[convertAtividadesToTasks] Atividades com parent_id:', atividades.filter(a => a.parent_id).length);
  
  // Criar todas as tasks primeiro
  const taskMap = new Map<string, Task>();
  
  atividades.forEach(atividade => {
    const task = atividadeToGanttTask(atividade);
    taskMap.set(task.id, task);
    console.log(`[convertAtividadesToTasks] Task criada: ${task.name} (ID: ${task.id.substring(0, 8)}, parent: ${task.parentId?.substring(0, 8) || 'nenhum'})`);
  });

  // Construir hierarquia (parent.children)
  const parentsWithChildren = new Map<string, Task[]>();
  
  atividades.forEach(atividade => {
    if (atividade.parent_id && taskMap.has(atividade.parent_id)) {
      const parent = taskMap.get(atividade.parent_id)!;
      const child = taskMap.get(atividade.id)!;
      
      if (!parent.children) parent.children = [];
      parent.children.push(child);
      child.level = (parent.level || 0) + 1;
      
      // Rastrear pais que têm filhos
      if (!parentsWithChildren.has(parent.id)) {
        parentsWithChildren.set(parent.id, []);
      }
      parentsWithChildren.get(parent.id)!.push(child);
      
      console.log(`[convertAtividadesToTasks] Hierarquia: ${child.name} (${child.id.substring(0, 8)}) é filho de ${parent.name} (${parent.id.substring(0, 8)})`);
    }
  });

  // 📊 ROLLUP: Calcular datas dos pais baseado nas filhas
  console.log('[convertAtividadesToTasks] 📊 Calculando rollup de datas para', parentsWithChildren.size, 'pais...');
  parentsWithChildren.forEach((children, parentId) => {
    const parent = taskMap.get(parentId);
    if (parent && children.length > 0) {
      calculateParentDates(parent, children);
    }
  });

  // CORREÇÃO: Retornar TODAS as tasks, não apenas as raiz
  // O VisionGantt Controller precisa de todas as tasks em um array plano
  const allTasks = Array.from(taskMap.values());
  console.log('[convertAtividadesToTasks] Total de tasks retornadas:', allTasks.length);
  console.log('[convertAtividadesToTasks] Tasks raiz:', allTasks.filter(t => !t.parentId).length);
  console.log('[convertAtividadesToTasks] Tasks filhas:', allTasks.filter(t => t.parentId).length);
  console.log('[convertAtividadesToTasks] ========== FIM DA CONVERSÃO ==========');
  
  return allTasks;
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

// Helper to convert dependency type to DependencyInfo type format
function convertDependencyType(tipo: TipoDependencia | string): 'FS' | 'SS' | 'FF' | 'SF' {
  const typeMap: Record<string, 'FS' | 'SS' | 'FF' | 'SF'> = {
    'TI': 'FS',  // Término-Início (Finish-Start)
    'II': 'SS',  // Início-Início (Start-Start)
    'TT': 'FF',  // Término-Término (Finish-Finish)
    'IT': 'SF',  // Início-Término (Start-Finish)
    'FS': 'FS',
    'SS': 'SS',
    'FF': 'FF',
    'SF': 'SF',
  };
  return typeMap[tipo] || 'FS';
}

// Helper to determine lag unit based on value (default to days)
function determineLagUnit(_lagDias: number): 'mi' | 'h' | 'd' | 'mo' | 'y' {
  // For now, all lags are in days since that's what the database stores
  // In future, could expand to support other units based on _lagDias magnitude
  return 'd';
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
  
  // Create lookup maps for tasks
  const taskById = new Map<string, AtividadeMock>();
  atividades.forEach(a => taskById.set(a.id, a));
  
  // Build predecessors and successors for each task
  const predecessorsMap = new Map<string, DependencyInfo[]>();
  const successorsMap = new Map<string, DependencyInfo[]>();
  
  // Identify parent tasks (Fase/summary tasks) - they cannot have predecessors or successors
  const parentTaskIds = new Set<string>();
  atividades.forEach(a => {
    if (a.tipo === 'Fase') {
      parentTaskIds.add(a.id);
    }
  });
  
  // Sort tasks by date to identify first and last leaf tasks
  const leafTasks = atividades.filter(a => a.tipo !== 'Fase');
  const sortedLeafTasks = [...leafTasks].sort((a, b) => 
    new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
  );
  const firstTaskId = sortedLeafTasks.length > 0 ? sortedLeafTasks[0].id : null;
  
  const sortedByEndDate = [...leafTasks].sort((a, b) => 
    new Date(b.data_fim).getTime() - new Date(a.data_fim).getTime()
  );
  const lastTaskId = sortedByEndDate.length > 0 ? sortedByEndDate[0].id : null;
  
  for (const dep of dependencias) {
    const fromTask = taskById.get(dep.atividade_origem_id);
    const toTask = taskById.get(dep.atividade_destino_id);
    
    if (fromTask && toTask) {
      // Skip if either task is a parent task (Fase)
      const fromIsParent = parentTaskIds.has(dep.atividade_origem_id);
      const toIsParent = parentTaskIds.has(dep.atividade_destino_id);
      
      // Add predecessor to the destination task (toTask has fromTask as predecessor)
      // Skip if destination is a parent task or is the first task
      if (!toIsParent && dep.atividade_destino_id !== firstTaskId) {
        const predecessorInfo: DependencyInfo = {
          taskId: dep.atividade_origem_id,
          taskCode: fromTask.codigo || fromTask.edt || dep.atividade_origem_id,
          taskName: fromTask.nome,
          type: convertDependencyType(dep.tipo),
          lag: dep.lag_dias || 0,
          lagUnit: determineLagUnit(dep.lag_dias || 0),
        };
        
        if (!predecessorsMap.has(dep.atividade_destino_id)) {
          predecessorsMap.set(dep.atividade_destino_id, []);
        }
        predecessorsMap.get(dep.atividade_destino_id)!.push(predecessorInfo);
      }
      
      // Add successor to the origin task (fromTask has toTask as successor)
      // Skip if origin is a parent task or is the last task
      if (!fromIsParent && dep.atividade_origem_id !== lastTaskId) {
        const successorInfo: DependencyInfo = {
          taskId: dep.atividade_destino_id,
          taskCode: toTask.codigo || toTask.edt || dep.atividade_destino_id,
          taskName: toTask.nome,
          type: convertDependencyType(dep.tipo),
          lag: dep.lag_dias || 0,
          lagUnit: determineLagUnit(dep.lag_dias || 0),
        };
        
        if (!successorsMap.has(dep.atividade_origem_id)) {
          successorsMap.set(dep.atividade_origem_id, []);
        }
        successorsMap.get(dep.atividade_origem_id)!.push(successorInfo);
      }
    }
  }
  
  // Add predecessors and successors to tasks
  // Parent tasks always get empty arrays
  const tasksWithDependencies = tasks.map(task => {
    const isParent = parentTaskIds.has(task.id);
    return {
      ...task,
      predecessors: isParent ? [] : (predecessorsMap.get(task.id) || []),
      successors: isParent ? [] : (successorsMap.get(task.id) || []),
    };
  });
  
  const criticalPathIds = atividades
    .filter(a => a.e_critica)
    .map(a => a.id);
  
  const conflictTaskIds: string[] = [];

  return {
    tasks: tasksWithDependencies,
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
