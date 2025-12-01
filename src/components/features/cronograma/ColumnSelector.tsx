import { useState, useRef, useEffect } from 'react';
import { Columns, Check, ChevronDown, ChevronRight, Plus, X, RotateCcw } from 'lucide-react';
import type { ColumnConfig } from '../../../lib/vision-gantt/types';
import { DEFAULT_COLUMNS } from '../../../lib/vision-gantt/config/default-columns';
import { 
  BASELINE_COLUMNS,
  EVM_COLUMNS,
  ACTIVITY_CODE_COLUMNS,
  RESOURCE_COLUMNS,
  CRITICAL_PATH_COLUMNS,
  SCHEDULE_COLUMNS
} from '../../../lib/vision-gantt/config/p6-columns';

interface ColumnCategory {
  id: string;
  label: string;
  icon: string;
  columns: ColumnConfig[];
  color: string;
}

const COLUMN_CATEGORIES: ColumnCategory[] = [
  {
    id: 'default',
    label: 'Colunas Padrão',
    icon: '📋',
    columns: DEFAULT_COLUMNS,
    color: '#3B82F6'
  },
  {
    id: 'baseline',
    label: 'Baseline',
    icon: '📊',
    columns: BASELINE_COLUMNS,
    color: '#8B5CF6'
  },
  {
    id: 'evm',
    label: 'EVM (Valor Agregado)',
    icon: '💰',
    columns: EVM_COLUMNS,
    color: '#059669'
  },
  {
    id: 'activityCodes',
    label: 'Códigos de Atividade',
    icon: '🏷️',
    columns: ACTIVITY_CODE_COLUMNS,
    color: '#F59E0B'
  },
  {
    id: 'resources',
    label: 'Recursos',
    icon: '👥',
    columns: RESOURCE_COLUMNS,
    color: '#EC4899'
  },
  {
    id: 'criticalPath',
    label: 'Caminho Crítico',
    icon: '🔴',
    columns: CRITICAL_PATH_COLUMNS,
    color: '#DC2626'
  },
  {
    id: 'schedule',
    label: 'Análise de Cronograma',
    icon: '📅',
    columns: SCHEDULE_COLUMNS,
    color: '#0891B2'
  }
];

interface ColumnSelectorProps {
  selectedColumns: ColumnConfig[];
  onColumnsChange: (columns: ColumnConfig[]) => void;
  className?: string;
}

const STORAGE_KEY = 'visionplan-selected-columns';

export function ColumnSelector({
  selectedColumns,
  onColumnsChange,
  className = ''
}: ColumnSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['default']));
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedFields = JSON.parse(stored) as string[];
        const allColumns = COLUMN_CATEGORIES.flatMap(cat => cat.columns);
        const restoredColumns = storedFields
          .map(field => allColumns.find(col => col.field === field))
          .filter((col): col is ColumnConfig => col !== undefined);
        
        if (restoredColumns.length > 0) {
          onColumnsChange(restoredColumns);
        }
      }
    } catch (error) {
      console.warn('Failed to restore column preferences:', error);
    }
  }, []);

  const saveColumnPreferences = (columns: ColumnConfig[]) => {
    try {
      const fields = columns.map(col => col.field);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fields));
    } catch (error) {
      console.warn('Failed to save column preferences:', error);
    }
  };

  const isColumnSelected = (column: ColumnConfig) => {
    return selectedColumns.some(col => col.field === column.field);
  };

  const toggleColumn = (column: ColumnConfig) => {
    let newColumns: ColumnConfig[];
    
    if (isColumnSelected(column)) {
      newColumns = selectedColumns.filter(col => col.field !== column.field);
    } else {
      newColumns = [...selectedColumns, column];
    }
    
    onColumnsChange(newColumns);
    saveColumnPreferences(newColumns);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const addAllFromCategory = (category: ColumnCategory) => {
    const newColumns = [...selectedColumns];
    category.columns.forEach(col => {
      if (!isColumnSelected(col)) {
        newColumns.push(col);
      }
    });
    onColumnsChange(newColumns);
    saveColumnPreferences(newColumns);
  };

  const removeAllFromCategory = (category: ColumnCategory) => {
    const categoryFields = new Set(category.columns.map(col => col.field));
    const newColumns = selectedColumns.filter(col => !categoryFields.has(col.field));
    onColumnsChange(newColumns);
    saveColumnPreferences(newColumns);
  };

  const resetToDefault = () => {
    onColumnsChange(DEFAULT_COLUMNS);
    saveColumnPreferences(DEFAULT_COLUMNS);
  };

  const filteredCategories = searchTerm
    ? COLUMN_CATEGORIES.map(cat => ({
        ...cat,
        columns: cat.columns.filter(col => 
          col.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(col.field).toLowerCase().includes(searchTerm.toLowerCase())
        )
      })).filter(cat => cat.columns.length > 0)
    : COLUMN_CATEGORIES;

  const getCategorySelectionCount = (category: ColumnCategory) => {
    return category.columns.filter(col => isColumnSelected(col)).length;
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        title="Configurar colunas"
      >
        <Columns className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Colunas</span>
        <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
          {selectedColumns.length}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-800">Configurar Colunas</h3>
              <button
                onClick={resetToDefault}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
                title="Restaurar padrão"
              >
                <RotateCcw className="w-3 h-3" />
                Padrão
              </button>
            </div>
            <input
              type="text"
              placeholder="Buscar colunas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredCategories.map(category => {
              const isExpanded = expandedCategories.has(category.id);
              const selectionCount = getCategorySelectionCount(category);

              return (
                <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                  <div 
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 cursor-pointer group"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium text-gray-700">{category.label}</span>
                      <span 
                        className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ 
                          backgroundColor: `${category.color}20`,
                          color: category.color 
                        }}
                      >
                        {selectionCount}/{category.columns.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addAllFromCategory(category);
                        }}
                        className="p-1 text-green-600 hover:bg-green-100 rounded"
                        title="Adicionar todas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAllFromCategory(category);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Remover todas"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="bg-gray-50 px-3 pb-2">
                      {category.columns.map(column => {
                        const selected = isColumnSelected(column);
                        return (
                          <div
                            key={String(column.field)}
                            className={`flex items-center justify-between px-3 py-2 my-1 rounded-lg cursor-pointer transition-colors ${
                              selected 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'bg-white border border-gray-100 hover:border-gray-200'
                            }`}
                            onClick={() => toggleColumn(column)}
                          >
                            <div className="flex items-center gap-2">
                              <div 
                                className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                                  selected 
                                    ? 'bg-blue-500' 
                                    : 'border border-gray-300'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className={`text-sm ${selected ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                                {column.header}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">
                              {column.width}px
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{selectedColumns.length} colunas selecionadas</span>
              <span className="text-gray-400">Arraste para reordenar no grid</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
