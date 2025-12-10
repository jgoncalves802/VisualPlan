import { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, ChevronDown, ChevronRight, 
  User, Wrench, Package, DollarSign, Clock, Plus, Minus,
  GripVertical, Calendar, AlertTriangle, Check, Boxes
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resourceService, Resource, ResourceCategory, ResourceAllocation } from '@/services/resourceService';
import type { Task } from '@/lib/vision-gantt/types';

interface ResourceWorkspaceProps {
  empresaId: string;
  selectedTask: Task | null;
  onAssignResource: (resourceId: string, taskId: string) => void;
  onUnassignResource: (allocationId: string) => void;
}

const CATEGORY_CONFIG: Record<ResourceCategory, { label: string; icon: React.ElementType; color: string }> = {
  WORK: { label: 'Mao de Obra', icon: User, color: 'bg-blue-100 text-blue-700' },
  MATERIAL: { label: 'Material', icon: Package, color: 'bg-amber-100 text-amber-700' },
  COST: { label: 'Custo', icon: DollarSign, color: 'bg-green-100 text-green-700' },
  GENERIC: { label: 'Generico', icon: Boxes, color: 'bg-purple-100 text-purple-700' },
  BUDGET: { label: 'Orcamento', icon: Wrench, color: 'bg-gray-100 text-gray-700' },
};

export function ResourceWorkspace({
  empresaId,
  selectedTask,
  onAssignResource,
  onUnassignResource,
}: ResourceWorkspaceProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'ALL'>('ALL');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['WORK', 'MATERIAL', 'COST', 'GENERIC', 'BUDGET']));
  const [draggedResource, setDraggedResource] = useState<Resource | null>(null);

  useEffect(() => {
    if (empresaId) {
      loadResources();
    }
  }, [empresaId]);

  useEffect(() => {
    if (selectedTask && !selectedTask.id.startsWith('wbs-') && !selectedTask.id.startsWith('eps-')) {
      loadTaskAllocations(selectedTask.id);
    } else {
      setAllocations([]);
    }
  }, [selectedTask?.id]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await resourceService.getResources(empresaId);
      setResources(data);
    } catch (err) {
      console.error('Error loading resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTaskAllocations = async (taskId: string) => {
    try {
      const data = await resourceService.getAllocations(empresaId, taskId);
      setAllocations(data);
    } catch (err) {
      console.error('Error loading allocations:', err);
      setAllocations([]);
    }
  };

  const filteredResources = useMemo(() => {
    let result = resources;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.nome.toLowerCase().includes(query) ||
        r.codigo.toLowerCase().includes(query)
      );
    }
    
    if (selectedCategory !== 'ALL') {
      result = result.filter(r => r.resourceType?.categoria === selectedCategory);
    }
    
    return result;
  }, [resources, searchQuery, selectedCategory]);

  const resourcesByCategory = useMemo(() => {
    const grouped: Record<ResourceCategory, Resource[]> = {
      WORK: [],
      MATERIAL: [],
      COST: [],
      GENERIC: [],
      BUDGET: [],
    };
    
    filteredResources.forEach(r => {
      const cat = r.resourceType?.categoria || 'WORK';
      if (grouped[cat]) {
        grouped[cat].push(r);
      }
    });
    
    return grouped;
  }, [filteredResources]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, resource: Resource) => {
    setDraggedResource(resource);
    e.dataTransfer.setData('text/plain', resource.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedResource(null);
  };

  const handleQuickAssign = async (resource: Resource) => {
    if (!selectedTask || selectedTask.id.startsWith('wbs-') || selectedTask.id.startsWith('eps-')) {
      return;
    }
    
    const isAssigned = allocations.some(a => a.resourceId === resource.id);
    if (isAssigned) return;
    
    onAssignResource(resource.id, selectedTask.id);
    
    setTimeout(() => loadTaskAllocations(selectedTask.id), 300);
  };

  const handleUnassign = async (allocation: ResourceAllocation) => {
    onUnassignResource(allocation.id);
    
    if (selectedTask) {
      setTimeout(() => loadTaskAllocations(selectedTask.id), 300);
    }
  };

  const isResourceAssigned = (resourceId: string) => {
    return allocations.some(a => a.resourceId === resourceId);
  };

  const isValidDropTarget = selectedTask && 
    !selectedTask.id.startsWith('wbs-') && 
    !selectedTask.id.startsWith('eps-') &&
    !selectedTask.isGroup;

  return (
    <div className="h-full flex flex-col bg-white border-l">
      {/* Header */}
      <div className="p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Recursos</h3>
          <Badge variant="default" className="ml-auto">
            {resources.length}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recursos..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-1 mt-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ResourceCategory[]).map(cat => {
            const config = CATEGORY_CONFIG[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Selected Task Info */}
      {selectedTask && (
        <div className={`p-3 border-b ${isValidDropTarget ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 text-sm">
            {isValidDropTarget ? (
              <Check className="w-4 h-4 text-blue-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-medium truncate">{selectedTask.name}</span>
          </div>
          {isValidDropTarget ? (
            <p className="text-xs text-gray-500 mt-1">
              Clique em + para alocar recursos
            </p>
          ) : (
            <p className="text-xs text-amber-600 mt-1">
              Selecione uma atividade (nao WBS) para alocar
            </p>
          )}
          
          {/* Current Allocations */}
          {allocations.length > 0 && (
            <div className="mt-2 space-y-1">
              <span className="text-xs font-medium text-gray-600">Alocados:</span>
              {allocations.map(alloc => (
                <div 
                  key={alloc.id}
                  className="flex items-center justify-between bg-white px-2 py-1 rounded border"
                >
                  <span className="text-xs truncate">{alloc.resource?.nome || 'Recurso'}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="default" className="text-xs">
                      {alloc.unidades}%
                    </Badge>
                    <button
                      onClick={() => handleUnassign(alloc)}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Resource List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : resources.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum recurso cadastrado</p>
            <p className="text-xs mt-1">Crie recursos na pagina de Recursos</p>
          </div>
        ) : (
          <div className="py-2">
            {(Object.keys(CATEGORY_CONFIG) as ResourceCategory[]).map(cat => {
              const config = CATEGORY_CONFIG[cat];
              const catResources = resourcesByCategory[cat];
              const isExpanded = expandedCategories.has(cat);
              const Icon = config.icon;
              
              if (catResources.length === 0 && selectedCategory === 'ALL') return null;
              if (selectedCategory !== 'ALL' && selectedCategory !== cat) return null;
              
              return (
                <div key={cat} className="mb-1">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                    <Icon className={`w-4 h-4 ${config.color.split(' ')[1]}`} />
                    <span className="text-sm font-medium text-gray-700">{config.label}</span>
                    <Badge variant="default" className="ml-auto text-xs">
                      {catResources.length}
                    </Badge>
                  </button>
                  
                  {isExpanded && (
                    <div className="pl-4">
                      {catResources.map(resource => {
                        const assigned = isResourceAssigned(resource.id);
                        
                        return (
                          <div
                            key={resource.id}
                            draggable={isValidDropTarget && !assigned ? true : false}
                            onDragStart={(e) => handleDragStart(e, resource)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-2 px-3 py-2 border-l-2 hover:bg-gray-50 cursor-pointer group ${
                              assigned 
                                ? 'border-l-green-500 bg-green-50' 
                                : 'border-l-transparent'
                            } ${
                              draggedResource?.id === resource.id ? 'opacity-50' : ''
                            }`}
                          >
                            <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-800 truncate">
                                  {resource.nome}
                                </span>
                                {assigned && (
                                  <Check className="w-3 h-3 text-green-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{resource.codigo}</span>
                                {resource.capacidadeDiaria && (
                                  <>
                                    <span>-</span>
                                    <Clock className="w-3 h-3" />
                                    <span>{resource.capacidadeDiaria}h/dia</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {isValidDropTarget && !assigned && (
                              <button
                                onClick={() => handleQuickAssign(resource)}
                                className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Alocar recurso"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                            
                            {resource.calendarioId && (
                              <span title="Possui calendario proprio">
                                <Calendar className="w-3 h-3 text-amber-500" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer with quick stats */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>{filteredResources.length} recursos</span>
          <span>{allocations.length} alocados</span>
        </div>
      </div>
    </div>
  );
}
