import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link2,
  Calendar,
  CheckSquare,
  Square,
  FileCheck2,
  Settings,
  Check,
} from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import TakeoffItemModal from './TakeoffItemModal';
import TakeoffMedicaoModal from './TakeoffMedicaoModal';
import TakeoffVinculoModal from './TakeoffVinculoModal';
import TakeoffConfirmDialog from './TakeoffConfirmDialog';
import TakeoffVincularCmsModal from './TakeoffVincularCmsModal';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { TakeoffItem, UpdateItemDTO, TakeoffMedicao, TakeoffVinculo } from '../../../types/takeoff.types';

interface TakeoffGridProps {
  mapaId: string;
  disciplinaId: string | null;
  projetoId?: string | null;
}

const TakeoffGrid: React.FC<TakeoffGridProps> = ({ mapaId, disciplinaId, projetoId }) => {
  const {
    itens,
    totais,
    isLoadingItens,
    loadItens,
    loadColunasConfig,
    updateItem,
    deleteItem,
    deleteItensBatch,
    colunasConfig,
  } = useTakeoffStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TakeoffItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TakeoffItem | null>(null);
  const [editingItemCriterioId, setEditingItemCriterioId] = useState<string | null>(null);
  const [showMedicaoModal, setShowMedicaoModal] = useState(false);
  const [selectedItemForMedicao, setSelectedItemForMedicao] = useState<TakeoffItem | null>(null);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedItemForVinculo, setSelectedItemForVinculo] = useState<TakeoffItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteBatchConfirm, setShowDeleteBatchConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState<{ current: number; total: number } | null>(null);
  const [deletionResult, setDeletionResult] = useState<{ success: number; errors: number } | null>(null);
  const [showCmsModal, setShowCmsModal] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(`takeoff-visible-columns-${mapaId}`);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  useEffect(() => {
    console.log('[TakeoffGrid] Loading data for mapaId:', mapaId, 'disciplinaId:', disciplinaId);
    setSelectedIds(new Set());
    loadItens({ mapaId });
    if (disciplinaId) {
      loadColunasConfig(disciplinaId, mapaId);
    }
  }, [mapaId, disciplinaId, loadItens, loadColunasConfig]);
  
  useEffect(() => {
    console.log('[TakeoffGrid] colunasConfig loaded:', colunasConfig?.length, 'columns', colunasConfig);
  }, [colunasConfig]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm]);

  const baseColumns = useMemo(() => [
    { key: 'area', label: 'Área', width: 80, isCustom: false },
    { key: 'edificacao', label: 'Edificação', width: 120, isCustom: false },
    { key: 'tag', label: 'TAG', width: 100, isCustom: false },
    { key: 'descricao', label: 'Descrição', width: 200, isCustom: false },
    { key: 'tipoMaterial', label: 'Tipo Material', width: 120, isCustom: false },
    { key: 'dimensao', label: 'Dimensão', width: 80, isCustom: false },
    { key: 'unidade', label: 'Und.', width: 60, isCustom: false },
    { key: 'qtdPrevista', label: 'Qtd Prev.', width: 90, type: 'number', isCustom: false },
    { key: 'qtdTakeoff', label: 'Qtd Take-off', width: 100, type: 'number', isCustom: false },
    { key: 'qtdExecutada', label: 'Qtd Exec.', width: 90, type: 'number', isCustom: false },
    { key: 'pesoUnitario', label: 'Peso Unit.', width: 90, type: 'number', isCustom: false },
    { key: 'pesoTotal', label: 'Peso Total', width: 90, type: 'number', calculated: true, isCustom: false },
    { key: 'custoUnitario', label: 'Custo Unit.', width: 100, type: 'number', isCustom: false },
    { key: 'custoTotal', label: 'Custo Total', width: 100, type: 'number', calculated: true, isCustom: false },
    { key: 'percentualExecutado', label: '% Exec.', width: 80, type: 'percentage', calculated: true, isCustom: false },
  ], []);

  const customColumns = useMemo(() => {
    const baseKeys = new Set(baseColumns.map(c => c.key.toLowerCase()));
    return colunasConfig
      .filter(c => !baseKeys.has(c.codigo.toLowerCase()))
      .map(c => ({
        key: c.codigo,
        label: c.nome,
        width: c.largura || 100,
        type: c.tipo === 'number' || c.tipo === 'decimal' ? 'number' : undefined,
        isCustom: true,
        calculated: false,
      }));
  }, [colunasConfig, baseColumns]);

  const allColumns = useMemo(() => [...baseColumns, ...customColumns], [baseColumns, customColumns]);

  const defaultVisibleKeys = useMemo(() => new Set(baseColumns.slice(0, 8).map(c => c.key)), [baseColumns]);

  const displayColumns = useMemo(() => {
    if (visibleColumns.size === 0) {
      return allColumns.filter(c => defaultVisibleKeys.has(c.key) || c.isCustom);
    }
    return allColumns.filter(c => visibleColumns.has(c.key));
  }, [allColumns, visibleColumns, defaultVisibleKeys]);

  const toggleColumnVisibility = useCallback((key: string) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      localStorage.setItem(`takeoff-visible-columns-${mapaId}`, JSON.stringify([...next]));
      return next;
    });
  }, [mapaId]);

  const selectAllColumns = useCallback(() => {
    const all = new Set(allColumns.map(c => c.key));
    setVisibleColumns(all);
    localStorage.setItem(`takeoff-visible-columns-${mapaId}`, JSON.stringify([...all]));
  }, [allColumns, mapaId]);

  const resetColumnsToDefault = useCallback(() => {
    setVisibleColumns(new Set());
    localStorage.removeItem(`takeoff-visible-columns-${mapaId}`);
  }, [mapaId]);

  useEffect(() => {
    const saved = localStorage.getItem(`takeoff-visible-columns-${mapaId}`);
    if (saved) {
      try {
        setVisibleColumns(new Set(JSON.parse(saved)));
      } catch {
        setVisibleColumns(new Set());
      }
    } else {
      setVisibleColumns(new Set());
    }
  }, [mapaId]);

  const filteredItens = useMemo(() => {
    let result = [...itens];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) => {
        if (
          item.descricao?.toLowerCase().includes(term) ||
          item.tag?.toLowerCase().includes(term) ||
          item.area?.toLowerCase().includes(term) ||
          item.edificacao?.toLowerCase().includes(term)
        ) {
          return true;
        }
        if (item.valoresCustom) {
          for (const val of Object.values(item.valoresCustom)) {
            if (val && String(val).toLowerCase().includes(term)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    if (sortField) {
      result.sort((a, b) => {
        let aVal: unknown;
        let bVal: unknown;
        const customCol = customColumns.find(c => c.key === sortField);
        if (customCol) {
          aVal = a.valoresCustom?.[sortField] ?? '';
          bVal = b.valoresCustom?.[sortField] ?? '';
        } else {
          aVal = a[sortField as keyof TakeoffItem] ?? '';
          bVal = b[sortField as keyof TakeoffItem] ?? '';
        }
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [itens, searchTerm, sortField, sortDirection, customColumns]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEdit = (item: TakeoffItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updates: UpdateItemDTO = {};
    
    if (editData.area !== undefined) updates.area = editData.area;
    if (editData.edificacao !== undefined) updates.edificacao = editData.edificacao;
    if (editData.tag !== undefined) updates.tag = editData.tag;
    if (editData.descricao !== undefined) updates.descricao = editData.descricao;
    if (editData.tipoMaterial !== undefined) updates.tipoMaterial = editData.tipoMaterial;
    if (editData.dimensao !== undefined) updates.dimensao = editData.dimensao;
    if (editData.unidade !== undefined) updates.unidade = editData.unidade;
    if (editData.qtdPrevista !== undefined) updates.qtdPrevista = Number(editData.qtdPrevista);
    if (editData.qtdTakeoff !== undefined) updates.qtdTakeoff = Number(editData.qtdTakeoff);
    if (editData.qtdExecutada !== undefined) updates.qtdExecutada = Number(editData.qtdExecutada);
    if (editData.pesoUnitario !== undefined) updates.pesoUnitario = Number(editData.pesoUnitario);
    if (editData.custoUnitario !== undefined) updates.custoUnitario = Number(editData.custoUnitario);

    await updateItem(editingId, updates);
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteClick = (id: string) => {
    setDeletingItemId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItemId) return;
    setIsDeleting(true);
    try {
      await deleteItem(deletingItemId);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingItemId(null);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredItens.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItens.map(i => i.id)));
    }
  };

  const handleConfirmDeleteBatch = async () => {
    if (selectedIds.size === 0) return;
    
    const validIds = Array.from(selectedIds).filter(id => 
      itens.some(item => item.id === id)
    );
    
    if (validIds.length === 0) {
      setSelectedIds(new Set());
      setShowDeleteBatchConfirm(false);
      return;
    }
    
    setIsDeleting(true);
    setShowDeleteBatchConfirm(false);
    setDeletionProgress({ current: 0, total: validIds.length });
    setDeletionResult(null);
    
    try {
      const result = await deleteItensBatch(validIds, (current) => {
        setDeletionProgress({ current, total: validIds.length });
      });
      setDeletionResult({ success: result.success, errors: result.errors.length });
      setSelectedIds(new Set());
      
      setTimeout(() => {
        setDeletionResult(null);
      }, 3000);
    } finally {
      setIsDeleting(false);
      setDeletionProgress(null);
    }
  };

  const handleOpenItemModal = async (item?: TakeoffItem) => {
    let criterioId: string | null = null;
    if (item) {
      try {
        const itemCriterio = await criteriosMedicaoService.getItemCriterio(item.id);
        criterioId = itemCriterio?.criterioId || null;
      } catch (err) {
        console.error('Erro ao carregar critério do item:', err);
      }
    }
    setEditingItemCriterioId(criterioId);
    setEditingItem(item || null);
    setShowItemModal(true);
  };

  const handleItemSaved = (_item: TakeoffItem) => {
    loadItens({ mapaId });
    setShowItemModal(false);
    setEditingItem(null);
  };

  const handleOpenMedicaoModal = (item: TakeoffItem) => {
    setSelectedItemForMedicao(item);
    setShowMedicaoModal(true);
  };

  const handleMedicaoSaved = (_medicao: TakeoffMedicao) => {
    loadItens({ mapaId });
    setShowMedicaoModal(false);
    setSelectedItemForMedicao(null);
  };

  const handleOpenVinculoModal = (item: TakeoffItem) => {
    setSelectedItemForVinculo(item);
    setShowVinculoModal(true);
  };

  const handleVinculoSaved = (_vinculo: TakeoffVinculo) => {
    setShowVinculoModal(false);
    setSelectedItemForVinculo(null);
  };

  const renderCell = (item: TakeoffItem, col: typeof displayColumns[0], isEditing: boolean) => {
    let value: unknown;
    
    if (col.isCustom) {
      value = item.valoresCustom?.[col.key] ?? '';
    } else {
      value = item[col.key as keyof TakeoffItem];
    }

    if (isEditing && !col.calculated) {
      const editValue = editData[col.key as keyof TakeoffItem];
      const displayValue = editValue !== undefined ? String(editValue) : (value !== undefined ? String(value) : '');
      return (
        <input
          type={col.type === 'number' || col.type === 'percentage' ? 'number' : 'text'}
          value={displayValue}
          onChange={(e) => setEditData({ ...editData, [col.key]: e.target.value })}
          className="w-full px-2 py-1 text-xs border rounded theme-text"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          step={col.type === 'number' ? '0.01' : undefined}
        />
      );
    }

    if (col.type === 'number') {
      const numVal = typeof value === 'number' ? value : parseFloat(String(value));
      return (
        <span className="text-right block">
          {!isNaN(numVal) ? numVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
        </span>
      );
    }

    if (col.type === 'percentage') {
      const pct = Number(value) || 0;
      return (
        <div className="flex items-center gap-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-gray-500' : 'bg-gray-300'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs w-10 text-right">{pct.toFixed(0)}%</span>
        </div>
      );
    }

    return <span className="truncate">{String(value ?? '')}</span>;
  };

  if (isLoadingItens) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 theme-text-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-3 border-b theme-divide flex items-center justify-between" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
            <input
              type="text"
              placeholder="Buscar itens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border rounded-lg theme-text w-64"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            />
          </div>
          <span className="text-sm theme-text-secondary">
            {filteredItens.length} de {itens.length} itens
          </span>
          {selectedIds.size > 0 && (
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
              {selectedIds.size} selecionado(s)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {deletionProgress && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg theme-bg-secondary">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
              <span className="theme-text">
                Excluindo {deletionProgress.current} de {deletionProgress.total}...
              </span>
            </div>
          )}
          {deletionResult && !deletionProgress && (
            <div 
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg"
              style={{ 
                backgroundColor: deletionResult.errors > 0 ? '#fef3c7' : '#d1fae5',
                color: deletionResult.errors > 0 ? '#92400e' : '#065f46'
              }}
            >
              {deletionResult.errors > 0 ? (
                <span>{deletionResult.success} excluído(s), {deletionResult.errors} erro(s)</span>
              ) : (
                <span>{deletionResult.success} item(ns) excluído(s) com sucesso</span>
              )}
            </div>
          )}
          {selectedIds.size > 0 && !isDeleting && (
            <>
              <button
                onClick={() => setShowCmsModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-90 theme-text"
                style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
              >
                <FileCheck2 className="w-4 h-4" />
                Vincular CMS ({selectedIds.size})
              </button>
              <button
                onClick={() => setShowDeleteBatchConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-90 text-white"
                style={{ backgroundColor: '#dc2626' }}
              >
                <Trash2 className="w-4 h-4" />
                Excluir Selecionados ({selectedIds.size})
              </button>
            </>
          )}
          <div className="relative">
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-90 theme-text"
              style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
              title="Configurar colunas visíveis"
            >
              <Settings className="w-4 h-4" />
              Colunas
            </button>
            {showColumnSelector && (
              <div 
                className="absolute right-0 top-full mt-2 w-72 max-h-96 overflow-y-auto z-50 rounded-lg shadow-lg border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
              >
                <div className="sticky top-0 p-2 border-b theme-divide flex justify-between items-center" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  <span className="text-sm font-medium theme-text">Colunas Visíveis</span>
                  <div className="flex gap-1">
                    <button
                      onClick={selectAllColumns}
                      className="px-2 py-1 text-xs rounded hover:opacity-80"
                      style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                    >
                      Todas
                    </button>
                    <button
                      onClick={resetColumnsToDefault}
                      className="px-2 py-1 text-xs rounded hover:opacity-80 theme-text"
                      style={{ backgroundColor: 'var(--color-surface-tertiary)' }}
                    >
                      Padrão
                    </button>
                  </div>
                </div>
                <div className="p-2 space-y-1">
                  {allColumns.map((col) => {
                    const isVisible = visibleColumns.size === 0 
                      ? defaultVisibleKeys.has(col.key) || col.isCustom 
                      : visibleColumns.has(col.key);
                    return (
                      <label
                        key={col.key}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${col.isCustom ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                      >
                        <div 
                          className="w-4 h-4 rounded border flex items-center justify-center"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: isVisible ? 'var(--color-primary)' : 'transparent' }}
                          onClick={() => toggleColumnVisibility(col.key)}
                        >
                          {isVisible && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-sm theme-text flex-1">{col.label}</span>
                        {col.isCustom && (
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Custom</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => handleOpenItemModal()}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:opacity-90 theme-text"
            style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
          >
            <Plus className="w-4 h-4" />
            Novo Item
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <th className="w-10 px-2 py-2 text-center text-xs font-medium theme-text-secondary border-b theme-divide">
                <button
                  onClick={handleToggleSelectAll}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title={selectedIds.size === filteredItens.length ? 'Desmarcar todos' : 'Selecionar todos'}
                >
                  {selectedIds.size === filteredItens.length && filteredItens.length > 0 ? (
                    <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                  ) : (
                    <Square className="w-4 h-4 theme-text-secondary" />
                  )}
                </button>
              </th>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium theme-text-secondary border-b theme-divide">
                Ações
              </th>
              {displayColumns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-2 text-left text-xs font-medium border-b theme-divide cursor-pointer ${col.isCustom ? 'bg-blue-50 dark:bg-blue-900/20 theme-text-primary' : 'theme-text-secondary'}`}
                  style={{ width: col.width, minWidth: col.width }}
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredItens.map((item) => {
              const isEditing = editingId === item.id;
              const isSelected = selectedIds.has(item.id);
              return (
                <tr
                  key={item.id}
                  className="border-b theme-divide transition-colors"
                  style={{ backgroundColor: isSelected ? 'var(--color-surface-secondary)' : isEditing ? 'var(--color-surface-secondary)' : undefined }}
                >
                  <td className="px-2 py-2 text-center">
                    <button
                      onClick={() => handleToggleSelect(item.id)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      ) : (
                        <Square className="w-4 h-4 theme-text-secondary" />
                      )}
                    </button>
                  </td>
                  <td className="px-2 py-2">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSaveEdit}
                          className="p-1 text-green-600 hover:bg-green-100 rounded"
                          title="Salvar"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 theme-text-secondary hover:theme-text rounded"
                          style={{ backgroundColor: 'transparent' }}
                          title="Editar inline"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenMedicaoModal(item)}
                          className="p-1 theme-text-secondary hover:theme-text rounded"
                          style={{ backgroundColor: 'transparent' }}
                          title="Registrar Medição"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>
                        {projetoId && (
                          <button
                            onClick={() => handleOpenVinculoModal(item)}
                            className="p-1 theme-text-secondary hover:theme-text rounded"
                            style={{ backgroundColor: 'transparent' }}
                            title="Vincular ao Cronograma"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  {displayColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-2 py-2 text-xs theme-text ${col.isCustom ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                      style={{ width: col.width }}
                    >
                      {renderCell(item, col, isEditing)}
                    </td>
                  ))}
                </tr>
              );
            })}

            {filteredItens.length === 0 && (
              <tr>
                <td colSpan={displayColumns.length + 2} className="px-4 py-12 text-center theme-text-secondary">
                  Nenhum item encontrado. Clique em "Novo Item" para adicionar.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 border-t-2 theme-divide font-medium" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <td className="px-2 py-2 text-xs theme-text font-bold">TOTAL</td>
              <td className="px-2 py-2 text-xs theme-text">{totais.totalItens} itens</td>
              {displayColumns.map((col) => {
                const footerTotals: Record<string, React.ReactNode> = {
                  qtdPrevista: totais.qtdPrevistaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                  qtdTakeoff: totais.qtdTakeoffTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                  qtdExecutada: totais.qtdExecutadaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                  pesoTotal: totais.pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                  custoTotal: `R$ ${totais.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                  percentualExecutado: (
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gray-500 rounded-full"
                          style={{ width: `${Math.min(totais.percentualMedio, 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right">{totais.percentualMedio.toFixed(0)}%</span>
                    </div>
                  ),
                };
                const content = footerTotals[col.key];
                return (
                  <td 
                    key={col.key}
                    className={`px-2 py-2 text-xs theme-text ${col.type === 'number' ? 'text-right' : ''} ${col.isCustom ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  >
                    {content ?? (col.type === 'number' ? '-' : '')}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {showItemModal && (
        <TakeoffItemModal
          isOpen={showItemModal}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
            setEditingItemCriterioId(null);
          }}
          mapaId={mapaId}
          disciplinaId={disciplinaId}
          projetoId={projetoId}
          item={editingItem}
          currentCriterioId={editingItemCriterioId}
          onSave={handleItemSaved}
        />
      )}

      {showMedicaoModal && selectedItemForMedicao && (
        <TakeoffMedicaoModal
          isOpen={showMedicaoModal}
          onClose={() => {
            setShowMedicaoModal(false);
            setSelectedItemForMedicao(null);
          }}
          item={selectedItemForMedicao}
          onSave={handleMedicaoSaved}
        />
      )}

      {showVinculoModal && selectedItemForVinculo && projetoId && (
        <TakeoffVinculoModal
          isOpen={showVinculoModal}
          onClose={() => {
            setShowVinculoModal(false);
            setSelectedItemForVinculo(null);
          }}
          item={selectedItemForVinculo}
          projetoId={projetoId}
          onSave={handleVinculoSaved}
        />
      )}

      <TakeoffConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingItemId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />

      <TakeoffConfirmDialog
        isOpen={showDeleteBatchConfirm}
        onClose={() => setShowDeleteBatchConfirm(false)}
        onConfirm={handleConfirmDeleteBatch}
        title="Excluir Itens Selecionados"
        message={`Tem certeza que deseja excluir ${selectedIds.size} item(ns) selecionado(s)? Esta ação não pode ser desfeita.`}
        isLoading={isDeleting}
      />

      {showCmsModal && projetoId && (
        <TakeoffVincularCmsModal
          isOpen={showCmsModal}
          onClose={() => setShowCmsModal(false)}
          onSuccess={() => {
            loadItens({ mapaId });
            setSelectedIds(new Set());
          }}
          projetoId={projetoId}
          itemIds={Array.from(selectedIds)}
        />
      )}
    </div>
  );
};

export default TakeoffGrid;
