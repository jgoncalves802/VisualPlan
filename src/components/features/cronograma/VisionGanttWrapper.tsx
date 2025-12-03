import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { GanttChartV2, useCriticalPath } from '../../../lib/vision-gantt';
import type { Task, Dependency, ViewPreset, ColumnConfig } from '../../../lib/vision-gantt/types';
import { 
  createGanttDataSync, 
  ganttTaskToAtividade,
  ganttDependencyToDependencia,
  convertCalendarsToGantt,
  atividadeToGanttTaskWithP6,
  type P6DataContext
} from '../../../lib/vision-gantt/adapters/visionplan-adapter';
import type { AtividadeMock, DependenciaAtividade, CalendarioProjeto, TipoDependencia } from '../../../types/cronograma';
import type { Resource, ResourceAllocation } from '../../../services/resourceService';
import { BarChart3, Calendar, Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { EditDependencyModal } from './EditDependencyModal';
import { useP6Data } from '../../../hooks/useP6Data';
import { ColumnSelector } from './ColumnSelector';
import { BaselineSelector } from './BaselineSelector';
import { SaveBaselineButton } from './SaveBaselineButton';
import { DEFAULT_COLUMNS } from '../../../lib/vision-gantt/config/default-columns';

interface VisionGanttWrapperProps {
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  projetoId: string;
  empresaId?: string;
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  calendarios?: CalendarioProjeto[];
  onAtividadeUpdate?: (atividade: AtividadeMock, changes: Partial<AtividadeMock>) => void;
  onDependenciaCreate?: (dep: DependenciaAtividade) => void;
  onDependenciaUpdate?: (depId: string, updates: { tipo: TipoDependencia; lag_dias: number }) => Promise<void>;
  onDependenciaDelete?: (depId: string) => void;
  onAtividadeClick?: (atividade: AtividadeMock) => void;
  onManageDependencies?: (atividadeId: string) => void;
  height?: number;
  gridWidth?: number;
  initialViewPreset?: ViewPreset;
  className?: string;
}

export function VisionGanttWrapper({
  atividades,
  dependencias,
  projetoId,
  empresaId,
  resources = [],
  allocations = [],
  calendarios = [],
  onAtividadeUpdate,
  onDependenciaCreate,
  onDependenciaUpdate,
  onDependenciaDelete,
  onAtividadeClick,
  onManageDependencies,
  height = 600,
  gridWidth = 500,
  initialViewPreset = 'month',
  className = '',
}: VisionGanttWrapperProps) {
  const [viewPreset, setViewPreset] = useState<ViewPreset>(initialViewPreset);
  const [selectedColumns, setSelectedColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  const [editDependencyModal, setEditDependencyModal] = useState<{
    open: boolean;
    dependency: Dependency | null;
    fromTask: Task | null;
    toTask: Task | null;
  }>({
    open: false,
    dependency: null,
    fromTask: null,
    toTask: null,
  });
  
  // Load P6 data (baselines, activity codes, EPS/OBS) when empresaId is available
  const p6Data = useP6Data(empresaId, projetoId, atividades);
  
  // Convert external data to gantt format with P6 enrichment
  const baseGanttData = useMemo(() => {
    // Get base gantt data
    const baseData = createGanttDataSync(atividades, dependencias, resources, allocations);
    
    // If we have P6 data, enrich tasks with baseline, activity codes, and EPS info
    if (empresaId && !p6Data.loading && (p6Data.currentBaseline || p6Data.activityCodeTypes.length > 0)) {
      const enrichedTasks = atividades.map(atividade => {
        const activityP6 = p6Data.getActivityP6Data(atividade.id);
        
        const p6Context: P6DataContext = {
          project: {
            id: projetoId,
            epsId: p6Data.projectContext.epsId,
            epsName: p6Data.projectContext.epsName,
            responsavel: p6Data.projectContext.projectManager,
          },
          baseline: p6Data.currentBaseline ? {
            id: p6Data.currentBaseline.id,
            numero: p6Data.currentBaseline.numero,
            task: activityP6.baselineTask,
            variance: activityP6.variance,
          } : undefined,
          activityCodes: activityP6.activityCodes,
        };
        
        return atividadeToGanttTaskWithP6(atividade, p6Context);
      });
      
      return {
        ...baseData,
        tasks: enrichedTasks,
      };
    }
    
    return baseData;
  }, [atividades, dependencias, resources, allocations, empresaId, projetoId, p6Data]);

  // LOCAL TASK CACHE - This is the SINGLE SOURCE OF TRUTH
  // It's initialized from baseGanttData but ONLY updated by controller callbacks
  // Never overwritten by external prop changes (except when task IDs change)
  const [localTasks, setLocalTasks] = useState<Task[]>(() => baseGanttData.tasks);
  const lastTaskIdsRef = useRef<string>(atividades.map(a => a.id).sort().join(','));
  
  // Only sync from external data when task IDs change (add/remove tasks)
  // NEVER sync when hierarchy changes - those are internal mutations
  useEffect(() => {
    const newIds = atividades.map(a => a.id).sort().join(',');
    if (newIds !== lastTaskIdsRef.current) {
      console.log('[VisionGanttWrapper] Task IDs changed, syncing from external source');
      setLocalTasks(baseGanttData.tasks);
      lastTaskIdsRef.current = newIds;
    }
  }, [atividades, baseGanttData.tasks]);

  const ganttCalendars = useMemo(() => {
    return convertCalendarsToGantt(calendarios);
  }, [calendarios]);

  // Critical path uses LOCAL tasks (the controller's source of truth)
  const criticalPath = useCriticalPath(localTasks, baseGanttData.dependencies, {
    nearCriticalThreshold: 5
  });

  const atividadeMap = useMemo(() => {
    return new Map(atividades.map(a => [a.id, a]));
  }, [atividades]);

  // Handle single task update from controller
  const handleTaskUpdate = useCallback((task: Task) => {
    console.log('[VisionGanttWrapper] handleTaskUpdate:', task.id, task.name, 'parentId:', task.parentId, 'level:', task.level);
    
    // CRITICAL: Update local cache FIRST to maintain source of truth
    setLocalTasks(prevTasks => prevTasks.map(t => t.id === task.id ? { ...t, ...task } : t));
    
    const originalAtividade = atividadeMap.get(task.id);
    if (!originalAtividade || !onAtividadeUpdate) return;

    // Build changes object manually
    const changes: Partial<AtividadeMock> = {};
    
    // Check text field changes
    if (task.name !== originalAtividade.nome) {
      changes.nome = task.name;
    }
    if (task.notes !== undefined && task.notes !== originalAtividade.notas) {
      changes.notas = task.notes;
    }
    if (task.description !== undefined && task.description !== originalAtividade.descricao) {
      changes.descricao = task.description;
    }
    
    // Check hierarchy changes
    if ((task.parentId ?? undefined) !== originalAtividade.parent_id) {
      changes.parent_id = task.parentId ?? undefined;
    }
    if (task.wbs !== originalAtividade.edt) {
      changes.edt = task.wbs;
    }
    if (Boolean(task.isGroup) !== (originalAtividade.tipo === 'Fase')) {
      changes.tipo = task.isGroup ? 'Fase' : (task.isMilestone ? 'Marco' : 'Tarefa');
    }
    
    // Check date changes
    if (task.startDate && task.startDate.getTime() !== new Date(originalAtividade.data_inicio).getTime()) {
      changes.data_inicio = task.startDate.toISOString().split('T')[0];
    }
    if (task.endDate && task.endDate.getTime() !== new Date(originalAtividade.data_fim).getTime()) {
      changes.data_fim = task.endDate.toISOString().split('T')[0];
    }
    
    // Check duration changes
    if (task.duration !== undefined && task.duration !== originalAtividade.duracao_dias) {
      changes.duracao_dias = task.duration;
    }
    
    // Check progress
    if (task.progress !== originalAtividade.progresso) {
      changes.progresso = task.progress ?? 0;
    }
    
    // Check cost fields
    if (task.cost !== undefined && task.cost !== originalAtividade.custo_previsto) {
      changes.custo_previsto = task.cost;
    }
    if (task.actualCost !== undefined && task.actualCost !== originalAtividade.custo_real) {
      changes.custo_real = task.actualCost;
    }

    if (Object.keys(changes).length > 0) {
      const updatedAtividade = ganttTaskToAtividade(task, projetoId, originalAtividade);
      console.log('[VisionGanttWrapper] Syncing changes to external store:', changes);
      onAtividadeUpdate(updatedAtividade, changes);
    }
  }, [atividadeMap, projetoId, onAtividadeUpdate]);

  // Handle batch task changes from controller (for hierarchy operations like indent/outdent)
  const handleTasksChange = useCallback((tasks: Task[]) => {
    console.log('[VisionGanttWrapper] ==================== handleTasksChange START ====================');
    console.log('[VisionGanttWrapper] Received tasks batch:', tasks.length);
    console.log('[VisionGanttWrapper] Current atividadeMap size:', atividadeMap.size);
    console.log('[VisionGanttWrapper] Task details:', tasks.map(t => ({
      id: t.id.substring(0, 8),
      name: t.name,
      level: t.level,
      parentId: t.parentId?.substring(0, 8),
      isGroup: t.isGroup,
      tipo: t.isMilestone ? 'Marco' : (t.isGroup ? 'Fase' : 'Tarefa')
    })));
    
    // ROLLUP: Calcular datas dos pais baseado nas filhas
    console.log('[VisionGanttWrapper] 📊 Iniciando rollup de datas para pais...');
    const parentsToUpdate = new Map<string, Task[]>();
    
    // Agrupar filhas por pai
    tasks.forEach(task => {
      if (task.parentId) {
        if (!parentsToUpdate.has(task.parentId)) {
          parentsToUpdate.set(task.parentId, []);
        }
        parentsToUpdate.get(task.parentId)!.push(task);
      }
    });
    
    // Calcular datas para cada pai com filhas
    parentsToUpdate.forEach((children, parentId) => {
      const parent = tasks.find(t => t.id === parentId);
      if (!parent || children.length === 0) return;
      
      // Data de início = menor data de início das filhas
      const minStartDate = children.reduce((min, child) => {
        return child.startDate < min ? child.startDate : min;
      }, children[0].startDate);
      
      // Data de término = maior data de término das filhas
      const maxEndDate = children.reduce((max, child) => {
        return child.endDate > max ? child.endDate : max;
      }, children[0].endDate);
      
      // Calcular duração
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
      
      console.log(`[VisionGanttWrapper] 📊 Rollup para "${parent.name}":`,
        `${minStartDate.toISOString().split('T')[0]} → ${maxEndDate.toISOString().split('T')[0]}`,
        `(${duration} dias, progresso: ${progress}%, ${children.length} filhas)`
      );
      
      // Atualizar o parent no array
      parent.startDate = minStartDate;
      parent.endDate = maxEndDate;
      parent.duration = duration;
      parent.progress = progress;
      parent.isGroup = true; // Garantir que é um grupo
    });
    
    // CRITICAL: Update local cache FIRST before syncing to external store
    // This ensures the controller always has the latest hierarchy data
    // We REPLACE the entire tasks array to ensure hierarchy changes are reflected
    setLocalTasks(tasks);
    console.log('[VisionGanttWrapper] ✅ Local tasks cache updated with', tasks.length, 'tasks');
    console.log('[VisionGanttWrapper] Local tasks now include:', tasks.filter(t => t.parentId).length, 'children tasks');
    
    if (!onAtividadeUpdate) {
      console.log('[VisionGanttWrapper] ⚠️  No onAtividadeUpdate callback, skipping sync');
      return;
    }
    
    // Sync each changed task to external store (one-way, won't cause reset)
    let syncedCount = 0;
    let notFoundCount = 0;
    for (const task of tasks) {
      const originalAtividade = atividadeMap.get(task.id);
      if (!originalAtividade) {
        console.log('[VisionGanttWrapper] ⚠️  Task NOT found in atividadeMap:', task.id.substring(0, 8), task.name);
        notFoundCount++;
        continue;
      }

      const changes: Partial<AtividadeMock> = {};
      
      // Detectar mudanças de parent
      if ((task.parentId ?? undefined) !== originalAtividade.parent_id) {
        console.log('[VisionGanttWrapper] 📝 Parent changed for', task.name);
        console.log('  FROM:', originalAtividade.parent_id || 'nenhum', '→ TO:', task.parentId?.substring(0, 8) || 'nenhum');
        changes.parent_id = task.parentId ?? undefined;
      }
      
      // Detectar mudanças de WBS
      if (task.wbs !== originalAtividade.edt) {
        console.log('[VisionGanttWrapper] 📝 WBS changed for', task.name);
        console.log('  FROM:', originalAtividade.edt, '→ TO:', task.wbs);
        changes.edt = task.wbs;
      }
      
      // Detectar mudanças de tipo
      if (Boolean(task.isGroup) !== (originalAtividade.tipo === 'Fase')) {
        const newTipo = task.isGroup ? 'Fase' : (task.isMilestone ? 'Marco' : 'Tarefa');
        console.log('[VisionGanttWrapper] 📝 Type changed for', task.name);
        console.log('  FROM:', originalAtividade.tipo, '→ TO:', newTipo);
        changes.tipo = newTipo;
      }
      
      // Detectar mudanças de datas (especialmente após rollup)
      const newStartDate = task.startDate.toISOString().split('T')[0];
      const newEndDate = task.endDate.toISOString().split('T')[0];
      
      if (originalAtividade.data_inicio !== newStartDate) {
        console.log('[VisionGanttWrapper] 📅 Start date changed for', task.name);
        console.log('  FROM:', originalAtividade.data_inicio, '→ TO:', newStartDate);
        changes.data_inicio = newStartDate;
      }
      
      if (originalAtividade.data_fim !== newEndDate) {
        console.log('[VisionGanttWrapper] 📅 End date changed for', task.name);
        console.log('  FROM:', originalAtividade.data_fim, '→ TO:', newEndDate);
        changes.data_fim = newEndDate;
      }
      
      if (task.duration && originalAtividade.duracao_dias !== task.duration) {
        console.log('[VisionGanttWrapper] ⏱️  Duration changed for', task.name);
        console.log('  FROM:', originalAtividade.duracao_dias, 'dias → TO:', task.duration, 'dias');
        changes.duracao_dias = task.duration;
      }
      
      if (originalAtividade.progresso !== task.progress) {
        console.log('[VisionGanttWrapper] 📈 Progress changed for', task.name);
        console.log('  FROM:', originalAtividade.progresso, '% → TO:', task.progress, '%');
        changes.progresso = task.progress;
      }

      if (Object.keys(changes).length > 0) {
        const updatedAtividade = ganttTaskToAtividade(task, projetoId, originalAtividade);
        console.log('[VisionGanttWrapper] 💾 Syncing changes for', task.name, ':', changes);
        onAtividadeUpdate(updatedAtividade, changes);
        syncedCount++;
      }
    }
    console.log('[VisionGanttWrapper] ✅ Synced', syncedCount, 'tasks to external store');
    if (notFoundCount > 0) {
      console.warn('[VisionGanttWrapper] ⚠️ ', notFoundCount, 'tasks were not found in atividadeMap');
    }
    console.log('[VisionGanttWrapper] ==================== handleTasksChange END ====================');
  }, [atividadeMap, projetoId, onAtividadeUpdate]);

  const handleTaskClick = useCallback((task: Task) => {
    const atividade = atividadeMap.get(task.id);
    if (atividade && onAtividadeClick) {
      onAtividadeClick(atividade);
    }
  }, [atividadeMap, onAtividadeClick]);

  const handleDependencyCreate = useCallback((dep: Dependency) => {
    if (!onDependenciaCreate) return;
    
    const dependencia = ganttDependencyToDependencia(dep);
    onDependenciaCreate(dependencia);
  }, [onDependenciaCreate]);

  const _handleDependencyDelete = useCallback((depId: string) => {
    if (!onDependenciaDelete) return;
    onDependenciaDelete(depId);
  }, [onDependenciaDelete]);

  const handleDependencyClick = useCallback((dependency: Dependency, fromTask: Task, toTask: Task) => {
    setEditDependencyModal({
      open: true,
      dependency,
      fromTask,
      toTask,
    });
  }, []);

  const handleEditDependencyClose = useCallback(() => {
    setEditDependencyModal({
      open: false,
      dependency: null,
      fromTask: null,
      toTask: null,
    });
  }, []);

  const handleEditDependencySave = useCallback(async (
    dependencyId: string, 
    updates: { tipo: TipoDependencia; lag_dias: number }
  ) => {
    if (!onDependenciaUpdate) {
      console.warn('onDependenciaUpdate não definido');
      return;
    }
    await onDependenciaUpdate(dependencyId, updates);
  }, [onDependenciaUpdate]);

  const handleEditDependencyDelete = useCallback(async (dependencyId: string) => {
    if (!onDependenciaDelete) return;
    await Promise.resolve(onDependenciaDelete(dependencyId));
  }, [onDependenciaDelete]);

  const handleCellDoubleClick = useCallback((task: Task, columnField: string) => {
    if ((columnField === 'predecessors' || columnField === 'successors') && onManageDependencies) {
      onManageDependencies(task.id);
    }
  }, [onManageDependencies]);

  const criticalCount = criticalPath.criticalPathIds.length;
  const nearCriticalCount = criticalPath.nearCriticalPathIds.length;
  const delayedCount = atividades.filter(a => {
    const endDate = new Date(a.data_fim);
    return endDate < new Date() && a.progresso < 100;
  }).length;
  const totalProgress = atividades.length > 0
    ? Math.round(atividades.reduce((sum, a) => sum + a.progresso, 0) / atividades.length)
    : 0;
  const violationCount = criticalPath.violations.length;

  return (
    <div className={`vision-gantt-wrapper ${className}`}>
      <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {atividades.length} Atividades
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              {totalProgress}% Completo
            </span>
          </div>
          
          {criticalCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-medium text-red-600">
                {criticalCount} Críticas
              </span>
            </div>
          )}
          
          {nearCriticalCount > 0 && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-600">
                {nearCriticalCount} Quase Críticas
              </span>
            </div>
          )}
          
          {delayedCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-600">
                {delayedCount} Atrasadas
              </span>
            </div>
          )}
          
          {violationCount > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-purple-600">
                {violationCount} Violações
              </span>
            </div>
          )}
          
          {resources.length > 0 && (
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">
                {resources.length} Recursos
              </span>
            </div>
          )}
          
          {ganttCalendars.length > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-gray-700">
                {ganttCalendars.length} {ganttCalendars.length === 1 ? 'Calendário' : 'Calendários'}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {empresaId && (
            <SaveBaselineButton
              empresaId={empresaId}
              projetoId={projetoId}
              atividades={atividades}
              dependencias={dependencias}
              onBaselineSaved={() => p6Data.refreshBaselines()}
            />
          )}
          
          <BaselineSelector
            baselines={p6Data.baselines.map(b => ({
              id: b.id,
              numero: b.numero,
              nome: b.nome,
              descricao: b.descricao,
              dataCaptura: b.dataBaseline,
              isPrimary: b.isAtual,
              taskCount: b.totalAtividades
            }))}
            selectedBaseline={p6Data.currentBaseline ? {
              id: p6Data.currentBaseline.id,
              numero: p6Data.currentBaseline.numero,
              nome: p6Data.currentBaseline.nome,
              descricao: p6Data.currentBaseline.descricao,
              dataCaptura: p6Data.currentBaseline.dataBaseline,
              isPrimary: p6Data.currentBaseline.isAtual
            } : null}
            onSelect={(baseline) => {
              p6Data.setCurrentBaselineById(baseline?.id || null);
            }}
            loading={p6Data.loading}
          />
          
          <ColumnSelector
            selectedColumns={selectedColumns}
            onColumnsChange={setSelectedColumns}
          />
        </div>
      </div>

      <GanttChartV2
        tasks={localTasks}
        dependencies={baseGanttData.dependencies}
        resources={baseGanttData.resources}
        calendars={ganttCalendars}
        columns={selectedColumns}
        viewPreset={viewPreset}
        gridWidth={gridWidth}
        height={height}
        rowHeight={50}
        barHeight={28}
        barRadius={4}
        enableDragDrop={true}
        enableResize={true}
        enableDependencyCreation={true}
        onTaskUpdate={handleTaskUpdate}
        onTasksChange={handleTasksChange}
        onTaskClick={handleTaskClick}
        onDependencyCreate={handleDependencyCreate}
        onDependencyClick={handleDependencyClick}
        onCellDoubleClick={handleCellDoubleClick}
        onViewPresetChange={setViewPreset}
        criticalPathIds={criticalPath.criticalPathIds}
        nearCriticalPathIds={criticalPath.nearCriticalPathIds}
        violationTaskIds={criticalPath.violations.map(v => v.toTaskId)}
        conflictTaskIds={baseGanttData.conflictTaskIds}
        className="rounded-lg shadow-sm"
      />
      
      <EditDependencyModal
        open={editDependencyModal.open}
        onClose={handleEditDependencyClose}
        dependency={editDependencyModal.dependency}
        fromTask={editDependencyModal.fromTask}
        toTask={editDependencyModal.toTask}
        onSave={handleEditDependencySave}
        onDelete={handleEditDependencyDelete}
      />
      
      <style>{`
        :root {
          --gantt-primary: #2563eb;
          --gantt-critical: #dc2626;
          --gantt-warning: #f59e0b;
          --gantt-danger: #ef4444;
          --gantt-status-not-started: #6b7280;
          --gantt-status-in-progress: #3b82f6;
          --gantt-status-completed: #10b981;
          --gantt-status-on-hold: #f59e0b;
          --gantt-status-cancelled: #ef4444;
          --gantt-task-milestone: #8b5cf6;
        }
        
        .gantt-chart .gantt-task-bar-bg:hover {
          filter: brightness(1.1);
        }
        
        .gantt-chart .gantt-dependency-handle:hover {
          transform: scale(1.3);
        }
        
        .gantt-chart .gantt-task-handle:hover {
          fill: #3b82f6;
        }
      `}</style>
    </div>
  );
}

export default VisionGanttWrapper;
