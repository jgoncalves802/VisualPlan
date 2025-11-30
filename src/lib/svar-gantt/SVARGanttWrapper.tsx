/**
 * SVARGanttWrapper - Integration of SVAR Gantt with VisionPlan
 * 
 * Uses SVAR's stable hierarchy management (indent/outdent, expand/collapse)
 * while preserving VisionPlan's layout, themes, and extra features.
 */

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { Gantt } from 'wx-react-gantt';
import 'wx-react-gantt/dist/gantt.css';
import type { AtividadeMock, DependenciaAtividade } from '../../types/cronograma';
import { TipoDependencia } from '../../types/cronograma';

interface SVARTask {
  id: number | string;
  text: string;
  start: Date;
  end?: Date;
  duration: number;
  progress: number;
  parent?: number | string;
  type?: 'task' | 'summary' | 'milestone';
  open?: boolean;
  lazy?: boolean;
}

interface SVARLink {
  id: number | string;
  source: number | string;
  target: number | string;
  type: 'e2s' | 's2s' | 'e2e' | 's2e';
}

interface SVARScale {
  unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';
  step: number;
  format: string;
}

interface SVARGanttWrapperProps {
  atividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  projetoId: string;
  onAtividadeUpdate?: (atividade: AtividadeMock, changes: Partial<AtividadeMock>) => void;
  onDependenciaCreate?: (dep: DependenciaAtividade) => void;
  onDependenciaUpdate?: (depId: string, updates: { tipo: TipoDependencia; lag_dias: number }) => Promise<void>;
  onDependenciaDelete?: (depId: string) => void;
  onAtividadeClick?: (atividade: AtividadeMock) => void;
  height?: number;
  className?: string;
}

const DEPENDENCY_TYPE_MAP: Record<string, 'e2s' | 's2s' | 'e2e' | 's2e'> = {
  [TipoDependencia.FS]: 'e2s',
  [TipoDependencia.SS]: 's2s',
  [TipoDependencia.FF]: 'e2e',
  [TipoDependencia.SF]: 's2e',
};

const DEPENDENCY_TYPE_REVERSE: Record<string, TipoDependencia> = {
  'e2s': TipoDependencia.FS,
  's2s': TipoDependencia.SS,
  'e2e': TipoDependencia.FF,
  's2e': TipoDependencia.SF,
};

function atividadeToSVARTask(atividade: AtividadeMock): SVARTask {
  return {
    id: atividade.id,
    text: atividade.nome,
    start: new Date(atividade.data_inicio),
    end: new Date(atividade.data_fim),
    duration: atividade.duracao_dias,
    progress: atividade.progresso,
    parent: atividade.parent_id || undefined,
    type: atividade.tipo === 'Marco' ? 'milestone' : 
          atividade.tipo === 'Fase' ? 'summary' : 'task',
    open: true,
  };
}

function dependenciaToSVARLink(dep: DependenciaAtividade): SVARLink {
  return {
    id: dep.id,
    source: dep.atividade_origem_id,
    target: dep.atividade_destino_id,
    type: DEPENDENCY_TYPE_MAP[dep.tipo] || 'e2s',
  };
}

function svarTaskToAtividade(
  task: SVARTask, 
  projetoId: string, 
  original?: AtividadeMock
): AtividadeMock {
  const now = new Date().toISOString();
  
  return {
    id: String(task.id),
    projeto_id: projetoId,
    codigo: original?.codigo,
    edt: original?.edt,
    nome: task.text,
    descricao: original?.descricao,
    tipo: task.type === 'milestone' ? 'Marco' : 
          task.type === 'summary' ? 'Fase' : 'Tarefa',
    parent_id: task.parent ? String(task.parent) : undefined,
    data_inicio: task.start.toISOString().split('T')[0],
    data_fim: task.end ? task.end.toISOString().split('T')[0] : 
              task.start.toISOString().split('T')[0],
    duracao_dias: task.duration,
    progresso: task.progress,
    status: original?.status || 'A Fazer',
    responsavel_id: original?.responsavel_id,
    responsavel_nome: original?.responsavel_nome,
    setor_id: original?.setor_id,
    prioridade: original?.prioridade,
    e_critica: original?.e_critica,
    folga_total: original?.folga_total,
    calendario_id: original?.calendario_id,
    custo_planejado: original?.custo_planejado,
    custo_real: original?.custo_real,
    valor_planejado: original?.valor_planejado,
    valor_real: original?.valor_real,
    created_at: original?.created_at || now,
    updated_at: now,
  };
}

export function SVARGanttWrapper({
  atividades,
  dependencias,
  projetoId,
  onAtividadeUpdate,
  onDependenciaCreate,
  onDependenciaUpdate,
  onDependenciaDelete,
  onAtividadeClick,
  height = 600,
  className = '',
}: SVARGanttWrapperProps) {
  const apiRef = useRef<any>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const tasks = useMemo(() => {
    return atividades.map(atividadeToSVARTask);
  }, [atividades]);

  const links = useMemo(() => {
    return dependencias.map(dependenciaToSVARLink);
  }, [dependencias]);

  const atividadeMap = useMemo(() => {
    return new Map(atividades.map(a => [a.id, a]));
  }, [atividades]);

  const scales: SVARScale[] = useMemo(() => [
    { unit: 'month', step: 1, format: 'MMMM yyyy' },
    { unit: 'week', step: 1, format: 'w' },
  ], []);

  const columns = useMemo(() => [
    { id: 'text', header: 'Nome da Atividade', flexgrow: 3 },
    { id: 'start', header: 'Início', flexgrow: 1, align: 'center' as const },
    { id: 'duration', header: 'Duração', align: 'center' as const, flexgrow: 1 },
    { id: 'add-task', header: '', width: 50, align: 'center' as const },
  ], []);

  const handleInit = useCallback((api: any) => {
    apiRef.current = api;
    
    api.on('update-task', (ev: any) => {
      if (!onAtividadeUpdate) return;
      
      const { id, task } = ev;
      const original = atividadeMap.get(String(id));
      if (!original) return;
      
      const changes: Partial<AtividadeMock> = {};
      
      if (task.text !== original.nome) {
        changes.nome = task.text;
      }
      if (task.start) {
        const newStart = task.start.toISOString().split('T')[0];
        if (newStart !== original.data_inicio) {
          changes.data_inicio = newStart;
        }
      }
      if (task.end) {
        const newEnd = task.end.toISOString().split('T')[0];
        if (newEnd !== original.data_fim) {
          changes.data_fim = newEnd;
        }
      }
      if (task.duration !== undefined && task.duration !== original.duracao_dias) {
        changes.duracao_dias = task.duration;
      }
      if (task.progress !== undefined && task.progress !== original.progresso) {
        changes.progresso = task.progress;
      }
      
      const newParentId = task.parent ? String(task.parent) : undefined;
      const oldParentId = original.parent_id || undefined;
      if (newParentId !== oldParentId) {
        changes.parent_id = newParentId;
      }
      
      const newTipo = task.type === 'milestone' ? 'Marco' : 
                      task.type === 'summary' ? 'Fase' : 'Tarefa';
      if (newTipo !== original.tipo) {
        changes.tipo = newTipo;
      }
      
      if (Object.keys(changes).length > 0) {
        const updated = svarTaskToAtividade(task, projetoId, original);
        onAtividadeUpdate(updated, changes);
      }
    });

    api.on('add-link', (ev: any) => {
      if (!onDependenciaCreate) return;
      
      const { link } = ev;
      const dep: DependenciaAtividade = {
        id: `dep-${Date.now()}`,
        atividade_origem_id: String(link.source),
        atividade_destino_id: String(link.target),
        tipo: DEPENDENCY_TYPE_REVERSE[link.type] || 'FS',
        lag_dias: 0,
      };
      onDependenciaCreate(dep);
    });

    api.on('update-link', (ev: any) => {
      if (!onDependenciaUpdate) return;
      
      const { id, link } = ev;
      onDependenciaUpdate(String(id), {
        tipo: DEPENDENCY_TYPE_REVERSE[link.type] || 'FS',
        lag_dias: link.lag || 0,
      });
    });

    api.on('delete-link', (ev: any) => {
      if (!onDependenciaDelete) return;
      onDependenciaDelete(String(ev.id));
    });

    api.on('select-task', (ev: any) => {
      setSelectedTaskId(ev.id ? String(ev.id) : null);
      
      if (ev.id && onAtividadeClick) {
        const atividade = atividadeMap.get(String(ev.id));
        if (atividade) {
          onAtividadeClick(atividade);
        }
      }
    });
  }, [atividadeMap, projetoId, onAtividadeUpdate, onDependenciaCreate, onDependenciaUpdate, onDependenciaDelete, onAtividadeClick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!apiRef.current || !selectedTaskId) return;
      
      if (e.shiftKey && e.key === 'ArrowRight') {
        e.preventDefault();
        apiRef.current.exec('indent-task', { id: selectedTaskId });
      }
      
      if (e.shiftKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        apiRef.current.exec('outdent-task', { id: selectedTaskId });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskId]);

  const totalProgress = atividades.length > 0
    ? Math.round(atividades.reduce((sum, a) => sum + a.progresso, 0) / atividades.length)
    : 0;

  return (
    <div className={`svar-gantt-wrapper ${className}`}>
      <div className="flex items-center justify-between mb-4 px-4 py-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {atividades.length} Atividades
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              {totalProgress}% Completo
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span className="font-mono px-1 py-0.5 bg-gray-100 rounded">Shift</span>
            <span>+</span>
            <span className="font-mono px-1 py-0.5 bg-gray-100 rounded">←→</span>
            <span className="ml-1">Hierarquia</span>
          </div>
        </div>
      </div>

      <div style={{ height }} className="border border-gray-200 rounded-lg overflow-hidden">
        <Gantt
          tasks={tasks}
          links={links}
          scales={scales}
          columns={columns}
          init={handleInit}
        />
      </div>
      
      <style>{`
        .svar-gantt-wrapper .wx-gantt {
          --wx-gantt-bar-fill: #3b82f6;
          --wx-gantt-bar-stroke: #2563eb;
          --wx-gantt-milestone-fill: #8b5cf6;
          --wx-gantt-summary-fill: #10b981;
        }
      `}</style>
    </div>
  );
}

export default SVARGanttWrapper;
