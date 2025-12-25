import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import TakeoffItemModal from './TakeoffItemModal';
import TakeoffMedicaoModal from './TakeoffMedicaoModal';
import TakeoffVinculoModal from './TakeoffVinculoModal';
import TakeoffConfirmDialog from './TakeoffConfirmDialog';
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
  } = useTakeoffStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TakeoffItem>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TakeoffItem | null>(null);
  const [showMedicaoModal, setShowMedicaoModal] = useState(false);
  const [selectedItemForMedicao, setSelectedItemForMedicao] = useState<TakeoffItem | null>(null);
  const [showVinculoModal, setShowVinculoModal] = useState(false);
  const [selectedItemForVinculo, setSelectedItemForVinculo] = useState<TakeoffItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadItens({ mapaId });
    if (disciplinaId) {
      loadColunasConfig(disciplinaId);
    }
  }, [mapaId, disciplinaId, loadItens, loadColunasConfig]);

  const baseColumns = [
    { key: 'area', label: 'Área', width: 80 },
    { key: 'edificacao', label: 'Edificação', width: 120 },
    { key: 'tag', label: 'TAG', width: 100 },
    { key: 'descricao', label: 'Descrição', width: 200 },
    { key: 'tipoMaterial', label: 'Tipo Material', width: 120 },
    { key: 'dimensao', label: 'Dimensão', width: 80 },
    { key: 'unidade', label: 'Und.', width: 60 },
    { key: 'qtdPrevista', label: 'Qtd Prev.', width: 90, type: 'number' },
    { key: 'qtdTakeoff', label: 'Qtd Take-off', width: 100, type: 'number' },
    { key: 'qtdExecutada', label: 'Qtd Exec.', width: 90, type: 'number' },
    { key: 'pesoUnitario', label: 'Peso Unit.', width: 90, type: 'number' },
    { key: 'pesoTotal', label: 'Peso Total', width: 90, type: 'number', calculated: true },
    { key: 'custoUnitario', label: 'Custo Unit.', width: 100, type: 'number' },
    { key: 'custoTotal', label: 'Custo Total', width: 100, type: 'number', calculated: true },
    { key: 'percentualExecutado', label: '% Exec.', width: 80, type: 'percentage', calculated: true },
  ];

  const filteredItens = useMemo(() => {
    let result = [...itens];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.descricao?.toLowerCase().includes(term) ||
          item.tag?.toLowerCase().includes(term) ||
          item.area?.toLowerCase().includes(term) ||
          item.edificacao?.toLowerCase().includes(term)
      );
    }

    if (sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField as keyof TakeoffItem] ?? '';
        const bVal = b[sortField as keyof TakeoffItem] ?? '';
        const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [itens, searchTerm, sortField, sortDirection]);

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

  const handleOpenItemModal = (item?: TakeoffItem) => {
    setEditingItem(item || null);
    setShowItemModal(true);
  };

  const handleItemSaved = (item: TakeoffItem) => {
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

  const renderCell = (item: TakeoffItem, col: typeof baseColumns[0], isEditing: boolean) => {
    const value = item[col.key as keyof TakeoffItem];

    if (isEditing && !col.calculated) {
      return (
        <input
          type={col.type === 'number' || col.type === 'percentage' ? 'number' : 'text'}
          value={editData[col.key as keyof TakeoffItem] ?? value ?? ''}
          onChange={(e) => setEditData({ ...editData, [col.key]: e.target.value })}
          className="w-full px-2 py-1 text-xs border rounded theme-text"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          step={col.type === 'number' ? '0.01' : undefined}
        />
      );
    }

    if (col.type === 'number') {
      return (
        <span className="text-right block">
          {typeof value === 'number' ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
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

      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
              <th className="w-20 px-2 py-2 text-left text-xs font-medium theme-text-secondary border-b theme-divide">
                Ações
              </th>
              {baseColumns.map((col) => (
                <th
                  key={col.key}
                  className="px-2 py-2 text-left text-xs font-medium theme-text-secondary border-b theme-divide cursor-pointer"
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
              return (
                <tr
                  key={item.id}
                  className="border-b theme-divide transition-colors"
                  style={{ backgroundColor: isEditing ? 'var(--color-surface-secondary)' : undefined }}
                >
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
                  {baseColumns.map((col) => (
                    <td
                      key={col.key}
                      className="px-2 py-2 text-xs theme-text"
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
                <td colSpan={baseColumns.length + 1} className="px-4 py-12 text-center theme-text-secondary">
                  Nenhum item encontrado. Clique em "Novo Item" para adicionar.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="sticky bottom-0 border-t-2 theme-divide font-medium" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
            <tr>
              <td className="px-2 py-2 text-xs theme-text">TOTAL</td>
              <td colSpan={6} className="px-2 py-2 text-xs theme-text">
                {totais.totalItens} itens
              </td>
              <td className="px-2 py-2 text-xs theme-text text-right">
                {totais.qtdPrevistaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-2 text-xs theme-text text-right">
                {totais.qtdTakeoffTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-2 text-xs theme-text text-right">
                {totais.qtdExecutadaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-2 text-xs theme-text text-right">-</td>
              <td className="px-2 py-2 text-xs theme-text text-right">
                {totais.pesoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-2 text-xs theme-text text-right">-</td>
              <td className="px-2 py-2 text-xs theme-text text-right">
                R$ {totais.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-2 text-xs theme-text">
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500 rounded-full"
                      style={{ width: `${Math.min(totais.percentualMedio, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right">{totais.percentualMedio.toFixed(0)}%</span>
                </div>
              </td>
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
          }}
          mapaId={mapaId}
          disciplinaId={disciplinaId}
          item={editingItem}
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
    </div>
  );
};

export default TakeoffGrid;
