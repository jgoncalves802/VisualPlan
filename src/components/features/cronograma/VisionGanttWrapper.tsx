import { useMemo, useCallback, useState } from 'react';
import { GanttChart, useCriticalPath } from '../../../lib/vision-gantt';
import type { Task, Dependency, ViewPreset } from '../../../lib/vision-gantt/types';
import { 
  createGanttDataSync, 
  ganttTaskToAtividade,
  ganttDependencyToDependencia,
  detectTaskChanges,
  convertCalendarsToGantt
} from '../../../lib/vision-gantt/adapters/visionplan-adapter';
import type { AtividadeMock, DependenciaAtividade, CalendarioProjeto, TipoDependencia } from '../../../types/cronograma';
import type { Resource, ResourceAllocation } from '../../../services/resourceService';
import { BarChart3, Calendar, Users, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { EditDependencyModal } from './EditDependencyModal';

interface VisionGanttWrapperProps {
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  projetoId: string;
  resources?: Resource[];
  allocations?: ResourceAllocation[];
  calendarios?: CalendarioProjeto[];
  onAtividadeUpdate?: (atividade: AtividadeMock, changes: Partial<AtividadeMock>) => void;
  onDependenciaCreate?: (dep: DependenciaAtividade) => void;
  onDependenciaUpdate?: (depId: string, updates: { tipo: TipoDependencia; lag_dias: number }) => Promise<void>;
  onDependenciaDelete?: (depId: string) => void;
  onAtividadeClick?: (atividade: AtividadeMock) => void;
  height?: number;
  gridWidth?: number;
  initialViewPreset?: ViewPreset;
  className?: string;
}

export function VisionGanttWrapper({
  atividades,
  dependencias,
  projetoId,
  resources = [],
  allocations = [],
  calendarios = [],
  onAtividadeUpdate,
  onDependenciaCreate,
  onDependenciaUpdate,
  onDependenciaDelete,
  onAtividadeClick,
  height = 600,
  gridWidth = 500,
  initialViewPreset = 'month',
  className = '',
}: VisionGanttWrapperProps) {
  const [viewPreset, setViewPreset] = useState<ViewPreset>(initialViewPreset);
  
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
  
  const ganttData = useMemo(() => {
    return createGanttDataSync(atividades, dependencias, resources, allocations);
  }, [atividades, dependencias, resources, allocations]);

  const ganttCalendars = useMemo(() => {
    return convertCalendarsToGantt(calendarios);
  }, [calendarios]);

  const criticalPath = useCriticalPath(ganttData.tasks, ganttData.dependencies, {
    nearCriticalThreshold: 5
  });

  const atividadeMap = useMemo(() => {
    return new Map(atividades.map(a => [a.id, a]));
  }, [atividades]);

  const _dependenciaMap = useMemo(() => {
    return new Map(dependencias.map(d => [d.id, d]));
  }, [dependencias]);

  const handleTaskUpdate = useCallback((task: Task) => {
    const originalAtividade = atividadeMap.get(task.id);
    if (!originalAtividade || !onAtividadeUpdate) return;

    const changes = detectTaskChanges(originalAtividade, task);
    if (Object.keys(changes).length > 0) {
      const updatedAtividade = ganttTaskToAtividade(task, projetoId, originalAtividade);
      onAtividadeUpdate(updatedAtividade, changes);
    }
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

  const handleDependencyDelete = useCallback((depId: string) => {
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
      </div>

      <GanttChart
        tasks={ganttData.tasks}
        dependencies={ganttData.dependencies}
        resources={ganttData.resources}
        calendars={ganttCalendars}
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
        onTaskClick={handleTaskClick}
        onDependencyCreate={handleDependencyCreate}
        onDependencyDelete={handleDependencyDelete}
        onDependencyClick={handleDependencyClick}
        onViewPresetChange={setViewPreset}
        criticalPathIds={criticalPath.criticalPathIds}
        nearCriticalPathIds={criticalPath.nearCriticalPathIds}
        violationTaskIds={criticalPath.violations.map(v => v.toTaskId)}
        conflictTaskIds={ganttData.conflictTaskIds}
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
