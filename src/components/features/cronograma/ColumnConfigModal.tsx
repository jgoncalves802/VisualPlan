import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  X, 
  GripVertical, 
  Search,
  Check,
  RotateCcw,
  Columns,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ColumnConfig } from '../../../lib/vision-gantt/types';
import { 
  P6_COLUMN_PRESETS, 
  ALL_P6_COLUMNS 
} from '../../../lib/vision-gantt/config/p6-columns';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeColumns: ColumnConfig[];
  availableColumns: ColumnConfig[];
  onSave: (columns: ColumnConfig[]) => void;
}

interface DragItem {
  column: ColumnConfig;
  sourceArea: 'active' | 'available';
  index: number;
}

interface ColumnCategory {
  id: string;
  name: string;
  icon: string;
  columns: ColumnConfig[];
}

const COLUMN_CATEGORIES: ColumnCategory[] = [
  { id: 'general', name: 'Geral', icon: '📋', columns: [] },
  { id: 'schedule', name: 'Cronograma', icon: '📅', columns: P6_COLUMN_PRESETS.schedule },
  { id: 'baseline', name: 'Baseline', icon: '📊', columns: P6_COLUMN_PRESETS.baseline },
  { id: 'evm', name: 'EVM', icon: '💰', columns: P6_COLUMN_PRESETS.evm },
  { id: 'criticalPath', name: 'Caminho Crítico', icon: '🔴', columns: P6_COLUMN_PRESETS.criticalPath },
  { id: 'dependencies', name: 'Dependências', icon: '🔗', columns: P6_COLUMN_PRESETS.dependencies },
  { id: 'resources', name: 'Recursos', icon: '👥', columns: P6_COLUMN_PRESETS.resources },
  { id: 'activityCodes', name: 'Códigos', icon: '🏷️', columns: P6_COLUMN_PRESETS.activityCodes },
  { id: 'errorLink', name: 'Validação', icon: '⚠️', columns: P6_COLUMN_PRESETS.errorLink },
];

export const ColumnConfigModal: React.FC<ColumnConfigModalProps> = ({
  isOpen,
  onClose,
  activeColumns,
  availableColumns,
  onSave
}) => {
  const [localActiveColumns, setLocalActiveColumns] = useState<ColumnConfig[]>([]);
  const [localAvailableColumns, setLocalAvailableColumns] = useState<ColumnConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<{ area: 'active' | 'available'; index: number } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general', 'schedule']));
  const [selectedAvailableColumns, setSelectedAvailableColumns] = useState<Set<string>>(new Set());
  const [selectedActiveColumns, setSelectedActiveColumns] = useState<Set<string>>(new Set());
  
  const activeListRef = useRef<HTMLDivElement>(null);
  const availableListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const wbsColumn = activeColumns.find(c => c.field === 'wbs');
      const otherActiveColumns = activeColumns.filter(c => c.field !== 'wbs');
      const sortedActive = wbsColumn ? [wbsColumn, ...otherActiveColumns] : otherActiveColumns;
      setLocalActiveColumns(sortedActive);
      
      const activeFields = new Set(activeColumns.map(c => c.field));
      const allAvailable = [...availableColumns, ...ALL_P6_COLUMNS];
      const uniqueAvailable = allAvailable.filter((col, index, arr) => 
        arr.findIndex(c => c.field === col.field) === index && 
        !activeFields.has(col.field) && 
        col.field !== 'wbs'
      );
      setLocalAvailableColumns(uniqueAvailable);
      setSearchTerm('');
      setSelectedAvailableColumns(new Set());
      setSelectedActiveColumns(new Set());
    }
  }, [isOpen, activeColumns, availableColumns]);

  const handleDragStart = useCallback((e: React.DragEvent, column: ColumnConfig, area: 'active' | 'available', index: number) => {
    if (column.field === 'wbs') return;
    
    setDragItem({ column, sourceArea: area, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', column.field);
    
    const dragImage = document.createElement('div');
    dragImage.className = 'bg-primary text-white px-3 py-2 rounded shadow-lg';
    dragImage.textContent = column.header;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, area: 'active' | 'available', index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ area, index });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetArea: 'active' | 'available', targetIndex: number) => {
    e.preventDefault();
    
    if (!dragItem) return;

    const { column, sourceArea, index: sourceIndex } = dragItem;
    
    if (column.field === 'wbs') {
      setDragItem(null);
      setDropTarget(null);
      return;
    }

    let newActiveColumns = [...localActiveColumns];
    let newAvailableColumns = [...localAvailableColumns];

    if (sourceArea === 'active') {
      newActiveColumns.splice(sourceIndex, 1);
    } else {
      newAvailableColumns.splice(sourceIndex, 1);
    }

    if (targetArea === 'active') {
      let insertIndex = targetIndex;
      if (sourceArea === 'active' && sourceIndex < targetIndex) {
        insertIndex = targetIndex;
      }
      const wbsIndex = newActiveColumns.findIndex(c => c.field === 'wbs');
      if (insertIndex <= wbsIndex && wbsIndex >= 0) {
        insertIndex = wbsIndex + 1;
      }
      newActiveColumns.splice(insertIndex, 0, column);
    } else {
      newAvailableColumns.push(column);
    }

    setLocalActiveColumns(newActiveColumns);
    setLocalAvailableColumns(newAvailableColumns);
    setDragItem(null);
    setDropTarget(null);
  }, [dragItem, localActiveColumns, localAvailableColumns]);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDropTarget(null);
  }, []);

  const moveToActive = useCallback((column: ColumnConfig) => {
    if (column.field === 'wbs') return;
    
    const newAvailable = localAvailableColumns.filter(c => c.field !== column.field);
    const newActive = [...localActiveColumns, column];
    
    setLocalAvailableColumns(newAvailable);
    setLocalActiveColumns(newActive);
    setSelectedAvailableColumns(prev => {
      const next = new Set(prev);
      next.delete(column.field);
      return next;
    });
  }, [localActiveColumns, localAvailableColumns]);

  const moveToAvailable = useCallback((column: ColumnConfig) => {
    if (column.field === 'wbs') return;
    
    const newActive = localActiveColumns.filter(c => c.field !== column.field);
    const newAvailable = [...localAvailableColumns, column];
    
    setLocalActiveColumns(newActive);
    setLocalAvailableColumns(newAvailable);
    setSelectedActiveColumns(prev => {
      const next = new Set(prev);
      next.delete(column.field);
      return next;
    });
  }, [localActiveColumns, localAvailableColumns]);

  const moveSelectedToActive = useCallback(() => {
    const columnsToMove = localAvailableColumns.filter(c => selectedAvailableColumns.has(c.field));
    const newAvailable = localAvailableColumns.filter(c => !selectedAvailableColumns.has(c.field));
    const newActive = [...localActiveColumns, ...columnsToMove];
    
    setLocalAvailableColumns(newAvailable);
    setLocalActiveColumns(newActive);
    setSelectedAvailableColumns(new Set());
  }, [localActiveColumns, localAvailableColumns, selectedAvailableColumns]);

  const moveSelectedToAvailable = useCallback(() => {
    const columnsToMove = localActiveColumns.filter(c => selectedActiveColumns.has(c.field) && c.field !== 'wbs');
    const newActive = localActiveColumns.filter(c => !selectedActiveColumns.has(c.field) || c.field === 'wbs');
    const newAvailable = [...localAvailableColumns, ...columnsToMove];
    
    setLocalActiveColumns(newActive);
    setLocalAvailableColumns(newAvailable);
    setSelectedActiveColumns(new Set());
  }, [localActiveColumns, localAvailableColumns, selectedActiveColumns]);

  const moveActiveUp = useCallback(() => {
    if (selectedActiveColumns.size !== 1) return;
    const field = Array.from(selectedActiveColumns)[0];
    const index = localActiveColumns.findIndex(c => c.field === field);
    if (index <= 1) return;
    
    const newColumns = [...localActiveColumns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    setLocalActiveColumns(newColumns);
  }, [localActiveColumns, selectedActiveColumns]);

  const moveActiveDown = useCallback(() => {
    if (selectedActiveColumns.size !== 1) return;
    const field = Array.from(selectedActiveColumns)[0];
    const index = localActiveColumns.findIndex(c => c.field === field);
    if (index === 0 || index >= localActiveColumns.length - 1) return;
    
    const newColumns = [...localActiveColumns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    setLocalActiveColumns(newColumns);
  }, [localActiveColumns, selectedActiveColumns]);

  const handleReset = useCallback(() => {
    const wbsColumn = activeColumns.find(c => c.field === 'wbs');
    const otherActiveColumns = activeColumns.filter(c => c.field !== 'wbs');
    const sortedActive = wbsColumn ? [wbsColumn, ...otherActiveColumns] : otherActiveColumns;
    setLocalActiveColumns(sortedActive);
    
    const activeFields = new Set(activeColumns.map(c => c.field));
    const allAvailable = [...availableColumns, ...ALL_P6_COLUMNS];
    const uniqueAvailable = allAvailable.filter((col, index, arr) => 
      arr.findIndex(c => c.field === col.field) === index && 
      !activeFields.has(col.field) && 
      col.field !== 'wbs'
    );
    setLocalAvailableColumns(uniqueAvailable);
    setSelectedAvailableColumns(new Set());
    setSelectedActiveColumns(new Set());
  }, [activeColumns, availableColumns]);

  const handleSave = useCallback(() => {
    const wbsColumn = localActiveColumns.find(c => c.field === 'wbs');
    const otherColumns = localActiveColumns.filter(c => c.field !== 'wbs');
    const finalColumns = wbsColumn ? [wbsColumn, ...otherColumns] : localActiveColumns;
    onSave(finalColumns);
    onClose();
  }, [localActiveColumns, onSave, onClose]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const toggleAvailableSelection = useCallback((field: string) => {
    setSelectedAvailableColumns(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const toggleActiveSelection = useCallback((field: string) => {
    if (field === 'wbs') return;
    setSelectedActiveColumns(prev => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const getColumnsByCategory = useCallback((categoryId: string): ColumnConfig[] => {
    const category = COLUMN_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return [];
    
    if (categoryId === 'general') {
      const p6Fields = new Set(ALL_P6_COLUMNS.map(c => c.field));
      return localAvailableColumns.filter(c => !p6Fields.has(c.field));
    }
    
    return category.columns.filter(c => 
      localAvailableColumns.some(ac => ac.field === c.field)
    );
  }, [localAvailableColumns]);

  const filteredCategories = COLUMN_CATEGORIES.map(cat => ({
    ...cat,
    columns: getColumnsByCategory(cat.id).filter(col =>
      searchTerm === '' ||
      col.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
      col.field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.columns.length > 0 || (searchTerm === '' && cat.id === 'general'));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-w-[95vw] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary to-primary-dark rounded-t-xl">
          <div className="flex items-center gap-3">
            <Columns className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Configurar Colunas</h2>
              <p className="text-sm text-white/80">Selecione e organize as colunas do cronograma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-[45%] border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Colunas Disponíveis
              </h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar coluna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900"
                />
              </div>
            </div>
            
            <div 
              ref={availableListRef}
              className="flex-1 overflow-y-auto"
              onDragOver={(e) => handleDragOver(e, 'available', localAvailableColumns.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'available', localAvailableColumns.length)}
            >
              {filteredCategories.map((category) => (
                <div key={category.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="flex-1 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 mr-2">{category.columns.length}</span>
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedCategories.has(category.id) && category.columns.length > 0 && (
                    <div className="py-1 px-2 space-y-0.5">
                      {category.columns.map((column) => {
                        const isSelected = selectedAvailableColumns.has(column.field);
                        const isDragging = dragItem?.column.field === column.field;
                        const realIndex = localAvailableColumns.findIndex(c => c.field === column.field);
                        
                        return (
                          <div
                            key={column.field}
                            draggable
                            onDragStart={(e) => handleDragStart(e, column, 'available', realIndex)}
                            onDragEnd={handleDragEnd}
                            onClick={() => toggleAvailableSelection(column.field)}
                            onDoubleClick={() => moveToActive(column)}
                            className={`
                              flex items-center gap-2 px-3 py-2 rounded-md border transition-all cursor-pointer
                              ${isSelected
                                ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                                : isDragging
                                  ? 'bg-blue-100 border-blue-300 opacity-50'
                                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50'
                              }
                            `}
                          >
                            <GripVertical className="w-3 h-3 text-gray-400 flex-shrink-0 cursor-grab" />
                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                              {column.header}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              
              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma coluna encontrada</p>
                </div>
              )}
            </div>
          </div>

          <div className="w-[10%] flex flex-col items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-800">
            <button
              onClick={moveSelectedToActive}
              disabled={selectedAvailableColumns.size === 0}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${selectedAvailableColumns.size > 0
                  ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Adicionar selecionadas"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={moveSelectedToAvailable}
              disabled={selectedActiveColumns.size === 0}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${selectedActiveColumns.size > 0
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Remover selecionadas"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="h-4" />
            
            <button
              onClick={moveActiveUp}
              disabled={selectedActiveColumns.size !== 1}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${selectedActiveColumns.size === 1
                  ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Mover para cima"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            
            <button
              onClick={moveActiveDown}
              disabled={selectedActiveColumns.size !== 1}
              className={`
                p-2 rounded-lg border-2 transition-all
                ${selectedActiveColumns.size === 1
                  ? 'bg-blue-500 border-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                }
              `}
              title="Mover para baixo"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="w-[45%] flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Colunas Ativas ({localActiveColumns.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">Arraste para reordenar ou clique para selecionar</p>
            </div>
            
            <div 
              ref={activeListRef}
              className="flex-1 overflow-y-auto p-2 space-y-1"
              onDragOver={(e) => handleDragOver(e, 'active', localActiveColumns.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'active', localActiveColumns.length)}
            >
              {localActiveColumns.map((column, index) => {
                const isWbs = column.field === 'wbs';
                const isSelected = selectedActiveColumns.has(column.field);
                const isDragging = dragItem?.column.field === column.field;
                const isDropTarget = dropTarget?.area === 'active' && dropTarget.index === index;
                
                return (
                  <div key={column.field}>
                    {isDropTarget && (
                      <div className="h-1 bg-primary rounded-full mb-1 mx-2" />
                    )}
                    <div
                      draggable={!isWbs}
                      onDragStart={(e) => handleDragStart(e, column, 'active', index)}
                      onDragOver={(e) => handleDragOver(e, 'active', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => toggleActiveSelection(column.field)}
                      onDoubleClick={() => !isWbs && moveToAvailable(column)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all
                        ${isWbs 
                          ? 'bg-amber-50 border-amber-200 cursor-not-allowed' 
                          : isSelected
                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                            : isDragging
                              ? 'bg-blue-100 border-blue-300 opacity-50'
                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                        }
                      `}
                    >
                      {isWbs ? (
                        <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab" />
                      )}
                      <span className={`flex-1 text-sm font-medium ${isWbs ? 'text-amber-700' : 'text-gray-700 dark:text-gray-300'}`}>
                        {column.header}
                      </span>
                      {isWbs && (
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">
                          Fixo
                        </span>
                      )}
                      {isSelected && !isWbs && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                );
              })}
              
              {localActiveColumns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Columns className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Arraste colunas aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl flex-shrink-0">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrão
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
