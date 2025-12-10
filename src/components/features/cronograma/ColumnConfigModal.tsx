import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  X, 
  GripVertical, 
  Search,
  Check,
  RotateCcw,
  Columns,
  Lock
} from 'lucide-react';
import type { ColumnConfig } from '../../../lib/vision-gantt/types';

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
  
  const activeListRef = useRef<HTMLDivElement>(null);
  const availableListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const wbsColumn = activeColumns.find(c => c.field === 'wbs');
      const otherActiveColumns = activeColumns.filter(c => c.field !== 'wbs');
      const sortedActive = wbsColumn ? [wbsColumn, ...otherActiveColumns] : otherActiveColumns;
      setLocalActiveColumns(sortedActive);
      
      const activeFields = new Set(activeColumns.map(c => c.field));
      const filteredAvailable = availableColumns.filter(c => !activeFields.has(c.field) && c.field !== 'wbs');
      setLocalAvailableColumns(filteredAvailable);
      setSearchTerm('');
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
      const originalIndex = availableColumns.findIndex(c => c.field === column.field);
      let insertAt = 0;
      for (let i = 0; i < newAvailableColumns.length; i++) {
        const colOrigIdx = availableColumns.findIndex(c => c.field === newAvailableColumns[i].field);
        if (colOrigIdx < originalIndex) {
          insertAt = i + 1;
        }
      }
      newAvailableColumns.splice(insertAt, 0, column);
    }

    setLocalActiveColumns(newActiveColumns);
    setLocalAvailableColumns(newAvailableColumns);
    setDragItem(null);
    setDropTarget(null);
  }, [dragItem, localActiveColumns, localAvailableColumns, availableColumns]);

  const handleDragEnd = useCallback(() => {
    setDragItem(null);
    setDropTarget(null);
  }, []);

  const moveToActive = useCallback((column: ColumnConfig, index: number) => {
    if (column.field === 'wbs') return;
    
    const newAvailable = localAvailableColumns.filter((_, i) => i !== index);
    const newActive = [...localActiveColumns, column];
    
    setLocalAvailableColumns(newAvailable);
    setLocalActiveColumns(newActive);
  }, [localActiveColumns, localAvailableColumns]);

  const moveToAvailable = useCallback((column: ColumnConfig, index: number) => {
    if (column.field === 'wbs') return;
    
    const newActive = localActiveColumns.filter((_, i) => i !== index);
    const originalIndex = availableColumns.findIndex(c => c.field === column.field);
    
    const newAvailable = [...localAvailableColumns];
    let insertAt = 0;
    for (let i = 0; i < newAvailable.length; i++) {
      const colOrigIdx = availableColumns.findIndex(c => c.field === newAvailable[i].field);
      if (colOrigIdx < originalIndex) {
        insertAt = i + 1;
      }
    }
    newAvailable.splice(insertAt, 0, column);
    
    setLocalActiveColumns(newActive);
    setLocalAvailableColumns(newAvailable);
  }, [localActiveColumns, localAvailableColumns, availableColumns]);

  const handleReset = useCallback(() => {
    const wbsColumn = activeColumns.find(c => c.field === 'wbs');
    const otherActiveColumns = activeColumns.filter(c => c.field !== 'wbs');
    const sortedActive = wbsColumn ? [wbsColumn, ...otherActiveColumns] : otherActiveColumns;
    setLocalActiveColumns(sortedActive);
    
    const activeFields = new Set(activeColumns.map(c => c.field));
    setLocalAvailableColumns(availableColumns.filter(c => !activeFields.has(c.field) && c.field !== 'wbs'));
  }, [activeColumns, availableColumns]);

  const handleSave = useCallback(() => {
    const wbsColumn = localActiveColumns.find(c => c.field === 'wbs');
    const otherColumns = localActiveColumns.filter(c => c.field !== 'wbs');
    const finalColumns = wbsColumn ? [wbsColumn, ...otherColumns] : localActiveColumns;
    onSave(finalColumns);
    onClose();
  }, [localActiveColumns, onSave, onClose]);

  const filteredAvailable = localAvailableColumns.filter(col => 
    searchTerm === '' || 
    col.header.toLowerCase().includes(searchTerm.toLowerCase()) ||
    col.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-[900px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary to-primary-dark rounded-t-xl">
          <div className="flex items-center gap-3">
            <Columns className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Configurar Colunas</h2>
              <p className="text-sm text-white/80">Arraste para reordenar ou mover entre áreas</p>
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
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Colunas Ativas ({localActiveColumns.length})
              </h3>
              <p className="text-xs text-gray-500 mt-1">Arraste para reordenar ou remover</p>
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
                      onClick={() => !isWbs && moveToAvailable(column, index)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all
                        ${isWbs 
                          ? 'bg-amber-50 border-amber-200 cursor-not-allowed' 
                          : isDragging
                            ? 'bg-blue-100 border-blue-300 opacity-50'
                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50 cursor-pointer'
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
                      {!isWbs && (
                        <span className="text-xs text-gray-400">clique para remover</span>
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

          <div className="w-1/2 flex flex-col">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Colunas Disponíveis ({filteredAvailable.length})
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
              className="flex-1 overflow-y-auto p-2 space-y-1"
              onDragOver={(e) => handleDragOver(e, 'available', localAvailableColumns.length)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'available', localAvailableColumns.length)}
            >
              {filteredAvailable.map((column, index) => {
                const isDragging = dragItem?.column.field === column.field;
                const isDropTarget = dropTarget?.area === 'available' && dropTarget.index === index;
                
                return (
                  <div key={column.field}>
                    {isDropTarget && (
                      <div className="h-1 bg-primary rounded-full mb-1 mx-2" />
                    )}
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, column, 'available', index)}
                      onDragOver={(e) => handleDragOver(e, 'available', index)}
                      onDragEnd={handleDragEnd}
                      onClick={() => moveToActive(column, index)}
                      className={`
                        flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all
                        ${isDragging
                          ? 'bg-blue-100 border-blue-300 opacity-50'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 hover:bg-green-50 cursor-pointer'
                        }
                      `}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab" />
                      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {column.header}
                      </span>
                      <span className="text-xs text-gray-400">clique para adicionar</span>
                    </div>
                  </div>
                );
              })}
              
              {filteredAvailable.length === 0 && searchTerm !== '' && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma coluna encontrada</p>
                </div>
              )}
              
              {filteredAvailable.length === 0 && searchTerm === '' && (
                <div className="text-center py-8 text-gray-500">
                  <Check className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Todas as colunas estão ativas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-xl">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar
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
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
