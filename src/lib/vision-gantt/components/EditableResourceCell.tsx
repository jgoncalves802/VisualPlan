import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, Search, ChevronDown } from 'lucide-react';

export interface ResourceOption {
  id: string;
  nome: string;
  cor: string;
  tipo?: string;
  custoPorHora?: number;
}

export interface ResourceAssignment {
  resourceId: string;
  unidades: number;
  resource?: ResourceOption;
}

interface EditableResourceCellProps {
  value: ResourceAssignment[];
  resources: ResourceOption[];
  onChange: (assignments: ResourceAssignment[]) => void;
  onOpenModal?: () => void;
  readOnly?: boolean;
  maxVisibleBadges?: number;
}

export function EditableResourceCell({
  value = [],
  resources,
  onChange,
  onOpenModal,
  readOnly = false,
  maxVisibleBadges = 3,
}: EditableResourceCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const assignedIds = new Set(value.map(v => v.resourceId));
  
  const filteredResources = resources.filter(r => 
    !assignedIds.has(r.id) && 
    r.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
        setSearchTerm('');
      }
    };
    
    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredResources.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredResources.length > 0) {
      e.preventDefault();
      addResource(filteredResources[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setSearchTerm('');
    }
  }, [filteredResources, selectedIndex]);

  const addResource = (resource: ResourceOption) => {
    const newAssignment: ResourceAssignment = {
      resourceId: resource.id,
      unidades: 100,
      resource,
    };
    onChange([...value, newAssignment]);
    setSearchTerm('');
    setSelectedIndex(0);
  };

  const removeResource = (resourceId: string) => {
    onChange(value.filter(v => v.resourceId !== resourceId));
  };

  const visibleAssignments = value.slice(0, maxVisibleBadges);
  const hiddenCount = Math.max(0, value.length - maxVisibleBadges);

  if (readOnly) {
    return (
      <div className="flex items-center gap-1 flex-wrap py-1">
        {value.length === 0 ? (
          <span className="text-gray-400 text-xs">-</span>
        ) : (
          <>
            {visibleAssignments.map(assignment => (
              <span
                key={assignment.resourceId}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: assignment.resource?.cor || '#6B7280' }}
                title={`${assignment.resource?.nome || 'Recurso'} - ${assignment.unidades}%`}
              >
                {assignment.resource?.nome.slice(0, 8) || 'R'}
                {assignment.unidades !== 100 && (
                  <span className="ml-1 opacity-75">{assignment.unidades}%</span>
                )}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span className="text-xs text-gray-500 font-medium">+{hiddenCount}</span>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div 
        className="flex items-center gap-1 flex-wrap min-h-[28px] cursor-pointer group"
        onClick={() => setIsEditing(true)}
      >
        {value.length === 0 ? (
          <span className="text-gray-400 text-xs group-hover:text-gray-600">
            Clique para adicionar
          </span>
        ) : (
          <>
            {visibleAssignments.map(assignment => (
              <span
                key={assignment.resourceId}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white gap-1"
                style={{ backgroundColor: assignment.resource?.cor || '#6B7280' }}
              >
                {assignment.resource?.nome.slice(0, 6) || 'R'}
                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeResource(assignment.resourceId);
                    }}
                    className="hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            {hiddenCount > 0 && (
              <span 
                className="text-xs text-gray-500 font-medium cursor-pointer hover:text-blue-600"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal?.();
                }}
              >
                +{hiddenCount}
              </span>
            )}
          </>
        )}
        
        {!isEditing && value.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal?.();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded"
            title="Detalhes da alocação"
          >
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>
        )}
      </div>

      {isEditing && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border rounded-lg shadow-xl w-64">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Buscar recurso..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="max-h-48 overflow-auto">
            {filteredResources.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {searchTerm ? 'Nenhum recurso encontrado' : 'Todos os recursos já foram alocados'}
              </div>
            ) : (
              filteredResources.map((resource, index) => (
                <button
                  key={resource.id}
                  onClick={() => addResource(resource)}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm ${
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0"
                    style={{ backgroundColor: resource.cor || '#6B7280' }}
                  >
                    {resource.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{resource.nome}</div>
                    {resource.tipo && (
                      <div className="text-xs text-gray-500">{resource.tipo}</div>
                    )}
                  </div>
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              ))
            )}
          </div>
          
          {onOpenModal && (
            <div className="p-2 border-t">
              <button
                onClick={() => {
                  setIsEditing(false);
                  onOpenModal();
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 py-1"
              >
                Alocação detalhada...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default EditableResourceCell;
