/**
 * Modal P6-style para gerenciar dependências (predecessoras e sucessoras) de uma atividade
 * Permite adicionar, editar e remover dependências com pesquisa de atividades
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Trash2, Link2, ArrowRight, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import { TipoDependencia } from '../../../types/cronograma';
import type { Task, Dependency, DependencyType } from '../../../lib/vision-gantt/types';

interface ManageDependenciesModalProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  allTasks: Task[];
  dependencies: Dependency[];
  onAddDependency: (fromTaskId: string, toTaskId: string, type: DependencyType, lag: number) => Promise<void>;
  onUpdateDependency: (dependencyId: string, updates: { tipo: TipoDependencia; lag_dias: number }) => Promise<void>;
  onDeleteDependency: (dependencyId: string) => Promise<void>;
}

type TabType = 'predecessors' | 'successors';

interface DependencyFormData {
  taskId: string;
  type: DependencyType;
  lag: number;
  lagUnit: 'd' | 'h';
}

const DEPENDENCY_TYPES: { value: DependencyType; label: string; labelPT: string; description: string; icon: string }[] = [
  { 
    value: 'FS', 
    label: 'Finish-to-Start', 
    labelPT: 'Término-Início (TI)',
    description: 'A atividade só pode começar após a predecessora terminar',
    icon: '→'
  },
  { 
    value: 'SS', 
    label: 'Start-to-Start', 
    labelPT: 'Início-Início (II)',
    description: 'A atividade só pode começar quando a predecessora começar',
    icon: '⇉'
  },
  { 
    value: 'FF', 
    label: 'Finish-to-Finish', 
    labelPT: 'Término-Término (TT)',
    description: 'A atividade só pode terminar quando a predecessora terminar',
    icon: '⇇'
  },
  { 
    value: 'SF', 
    label: 'Start-to-Finish', 
    labelPT: 'Início-Término (IT)',
    description: 'A atividade só pode terminar quando a predecessora começar',
    icon: '←'
  },
];

const TYPE_COLORS: Record<DependencyType, { bg: string; text: string; border: string }> = {
  'FS': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'SS': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'FF': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'SF': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
};

export const ManageDependenciesModal: React.FC<ManageDependenciesModalProps> = ({
  open,
  onClose,
  task,
  allTasks,
  dependencies,
  onAddDependency,
  onUpdateDependency,
  onDeleteDependency,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('predecessors');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DependencyFormData>({
    taskId: '',
    type: 'FS',
    lag: 0,
    lagUnit: 'd'
  });

  // Reset state when modal opens/closes or task changes
  useEffect(() => {
    if (open && task) {
      setSearchTerm('');
      setError(null);
      setSelectedTaskId(null);
      setFormData({ taskId: '', type: 'FS', lag: 0, lagUnit: 'd' });
    }
  }, [open, task]);

  // Get current predecessors and successors
  const currentPredecessors = useMemo(() => {
    if (!task) return [];
    return dependencies.filter(d => d.toTaskId === task.id);
  }, [dependencies, task]);

  const currentSuccessors = useMemo(() => {
    if (!task) return [];
    return dependencies.filter(d => d.fromTaskId === task.id);
  }, [dependencies, task]);

  // Get available tasks (exclude current task, parent tasks, and already linked tasks)
  const availableTasks = useMemo(() => {
    if (!task) return [];
    
    const linkedTaskIds = new Set<string>();
    
    if (activeTab === 'predecessors') {
      currentPredecessors.forEach(d => linkedTaskIds.add(d.fromTaskId));
    } else {
      currentSuccessors.forEach(d => linkedTaskIds.add(d.toTaskId));
    }
    
    return allTasks.filter(t => {
      // Exclude current task
      if (t.id === task.id) return false;
      // Exclude parent tasks (Fase)
      if (t.isGroup) return false;
      // Exclude already linked tasks
      if (linkedTaskIds.has(t.id)) return false;
      return true;
    });
  }, [allTasks, task, activeTab, currentPredecessors, currentSuccessors]);

  // Filter tasks by search term
  const filteredTasks = useMemo(() => {
    if (!searchTerm.trim()) return availableTasks;
    
    const term = searchTerm.toLowerCase();
    return availableTasks.filter(t => {
      const code = (t.wbs || t.projectCode || t.id).toLowerCase();
      const name = t.name.toLowerCase();
      return code.includes(term) || name.includes(term);
    });
  }, [availableTasks, searchTerm]);

  const getTaskById = (taskId: string) => allTasks.find(t => t.id === taskId);

  const getTaskDisplayCode = (t: Task) => t.wbs || t.projectCode || t.id;

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setFormData(prev => ({ ...prev, taskId }));
  };

  const handleAddDependency = async () => {
    if (!task || !selectedTaskId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (activeTab === 'predecessors') {
        // Adding a predecessor: fromTask = selected, toTask = current
        await onAddDependency(selectedTaskId, task.id, formData.type, formData.lag);
      } else {
        // Adding a successor: fromTask = current, toTask = selected
        await onAddDependency(task.id, selectedTaskId, formData.type, formData.lag);
      }
      
      // Reset form
      setSelectedTaskId(null);
      setFormData({ taskId: '', type: 'FS', lag: 0, lagUnit: 'd' });
      setSearchTerm('');
    } catch (err) {
      console.error('Erro ao adicionar dependência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao adicionar dependência');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDependency = async (depId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta dependência?')) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onDeleteDependency(depId);
    } catch (err) {
      console.error('Erro ao excluir dependência:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir dependência');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDependencyType = async (depId: string, newType: DependencyType) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const dep = dependencies.find(d => d.id === depId);
      await onUpdateDependency(depId, { 
        tipo: newType as TipoDependencia, 
        lag_dias: dep?.lag || 0 
      });
    } catch (err) {
      console.error('Erro ao atualizar tipo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tipo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDependencyLag = async (depId: string, newLag: number) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const dep = dependencies.find(d => d.id === depId);
      await onUpdateDependency(depId, { 
        tipo: (dep?.type || 'FS') as TipoDependencia, 
        lag_dias: newLag 
      });
    } catch (err) {
      console.error('Erro ao atualizar lag:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar lag');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open || !task) return null;

  const currentDeps = activeTab === 'predecessors' ? currentPredecessors : currentSuccessors;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Gerenciar Dependências</h2>
                <p className="text-indigo-200 text-sm">
                  {getTaskDisplayCode(task)} - {task.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => setActiveTab('predecessors')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'predecessors'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Predecessoras ({currentPredecessors.length})
          </button>
          <button
            onClick={() => setActiveTab('successors')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'successors'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Sucessoras ({currentSuccessors.length})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel - Search and Add */}
          <div className="w-full md:w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {activeTab === 'predecessors' ? 'Adicionar Predecessora' : 'Adicionar Sucessora'}
              </h3>
              
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por código ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Available Tasks List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {searchTerm ? 'Nenhuma atividade encontrada' : 'Todas as atividades já estão vinculadas'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTask(t.id)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedTaskId === t.id
                          ? 'bg-indigo-100 border-2 border-indigo-400'
                          : 'bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          selectedTaskId === t.id ? 'bg-indigo-200 text-indigo-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getTaskDisplayCode(t)}
                        </span>
                        {t.isCritical && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            Crítica
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-800 mt-1 truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.startDate?.toLocaleDateString('pt-BR')} - {t.endDate?.toLocaleDateString('pt-BR')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Form */}
            {selectedTaskId && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Dependency Type */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tipo de Dependência
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as DependencyType }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    >
                      {DEPENDENCY_TYPES.map(dt => (
                        <option key={dt.value} value={dt.value}>
                          {dt.icon} {dt.labelPT}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Lag */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Lag (dias)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={formData.lag}
                        onChange={(e) => setFormData(prev => ({ ...prev, lag: parseInt(e.target.value) || 0 }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                        min="-365"
                        max="365"
                      />
                      <span className="flex items-center px-3 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-600">
                        dias
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleAddDependency}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Adicionando...' : 'Adicionar Dependência'}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Current Dependencies */}
          <div className="w-full md:w-1/2 flex flex-col bg-gray-50">
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">
                {activeTab === 'predecessors' ? 'Predecessoras Atuais' : 'Sucessoras Atuais'}
                <span className="ml-2 text-gray-400 font-normal">({currentDeps.length})</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {currentDeps.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhuma {activeTab === 'predecessors' ? 'predecessora' : 'sucessora'} definida
                </div>
              ) : (
                <div className="space-y-2">
                  {currentDeps.map((dep) => {
                    const linkedTask = getTaskById(
                      activeTab === 'predecessors' ? dep.fromTaskId : dep.toTaskId
                    );
                    if (!linkedTask) return null;
                    
                    const typeColors = TYPE_COLORS[dep.type as DependencyType] || TYPE_COLORS['FS'];
                    
                    return (
                      <div
                        key={dep.id}
                        className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                      >
                        {/* Task Info */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                                {getTaskDisplayCode(linkedTask)}
                              </span>
                              {linkedTask.isCritical && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                                  Crítica
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 mt-1 truncate">{linkedTask.name}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteDependency(dep.id)}
                            disabled={isSubmitting}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Excluir dependência"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {/* Type and Lag */}
                        <div className="flex items-center gap-2">
                          <select
                            value={dep.type}
                            onChange={(e) => handleUpdateDependencyType(dep.id, e.target.value as DependencyType)}
                            disabled={isSubmitting}
                            className={`px-2 py-1 rounded text-xs font-medium border ${typeColors.bg} ${typeColors.text} ${typeColors.border}`}
                          >
                            {DEPENDENCY_TYPES.map(dt => (
                              <option key={dt.value} value={dt.value}>
                                {dt.icon} {dt.value}
                              </option>
                            ))}
                          </select>
                          
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <input
                              type="number"
                              value={dep.lag || 0}
                              onChange={(e) => handleUpdateDependencyLag(dep.id, parseInt(e.target.value) || 0)}
                              disabled={isSubmitting}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center"
                              min="-365"
                              max="365"
                            />
                            <span className="text-xs text-gray-500">dias</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageDependenciesModal;
