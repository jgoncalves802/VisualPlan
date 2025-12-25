import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import type { TakeoffItem, CreateItemDTO, UpdateItemDTO } from '../../../types/takeoff.types';

interface TakeoffGridProps {
  mapaId: string;
  disciplinaId: string | null;
}

const TakeoffGrid: React.FC<TakeoffGridProps> = ({ mapaId, disciplinaId }) => {
  const {
    itens,
    totais,
    colunasConfig,
    isLoadingItens,
    loadItens,
    loadColunasConfig,
    createItem,
    updateItem,
    deleteItem,
    setFilter,
  } = useTakeoffStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<TakeoffItem>>({});
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItem, setNewItem] = useState<Partial<CreateItemDTO>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const handleDelete = async (id: string) => {
    if (confirm('Deseja excluir este item?')) {
      await deleteItem(id);
    }
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewItem({ mapaId, unidade: 'un' });
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewItem({});
  };

  const handleSaveNew = async () => {
    if (!newItem.descricao || !newItem.unidade) {
      alert('Preencha pelo menos a descrição e unidade');
      return;
    }

    await createItem({
      mapaId,
      descricao: newItem.descricao,
      unidade: newItem.unidade,
      area: newItem.area,
      edificacao: newItem.edificacao,
      tag: newItem.tag,
      tipoMaterial: newItem.tipoMaterial,
      dimensao: newItem.dimensao,
      qtdPrevista: Number(newItem.qtdPrevista) || 0,
      qtdTakeoff: Number(newItem.qtdTakeoff) || 0,
      pesoUnitario: Number(newItem.pesoUnitario) || 0,
      custoUnitario: Number(newItem.custoUnitario) || 0,
    });

    setIsAddingNew(false);
    setNewItem({});
  };

  const renderCell = (item: TakeoffItem, col: typeof baseColumns[0], isEditing: boolean) => {
    const value = item[col.key as keyof TakeoffItem];

    if (isEditing && !col.calculated) {
      return (
        <input
          type={col.type === 'number' || col.type === 'percentage' ? 'number' : 'text'}
          value={editData[col.key as keyof TakeoffItem] ?? value ?? ''}
          onChange={(e) => setEditData({ ...editData, [col.key]: e.target.value })}
          className="w-full px-2 py-1 text-xs border theme-divide rounded theme-bg-primary theme-text"
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
              className={`h-full rounded-full ${pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span className="text-xs w-10 text-right">{pct.toFixed(0)}%</span>
        </div>
      );
    }

    return <span className="truncate">{String(value ?? '')}</span>;
  };

  const renderNewCell = (col: typeof baseColumns[0]) => {
    if (col.calculated) return <span className="text-gray-400">-</span>;

    return (
      <input
        type={col.type === 'number' ? 'number' : 'text'}
        value={newItem[col.key as keyof CreateItemDTO] ?? ''}
        onChange={(e) => setNewItem({ ...newItem, [col.key]: e.target.value })}
        className="w-full px-2 py-1 text-xs border theme-divide rounded theme-bg-primary theme-text"
        placeholder={col.label}
        step={col.type === 'number' ? '0.01' : undefined}
      />
    );
  };

  if (isLoadingItens) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
              className="pl-9 pr-4 py-2 text-sm border theme-divide rounded-lg theme-bg-primary theme-text w-64"
            />
          </div>
          <span className="text-sm theme-text-secondary">
            {filteredItens.length} de {itens.length} itens
          </span>
        </div>

        <button
          onClick={handleAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50"
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
                  className="px-2 py-2 text-left text-xs font-medium theme-text-secondary border-b theme-divide cursor-pointer hover:theme-bg-primary"
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
            {isAddingNew && (
              <tr className="theme-bg-primary border-b theme-divide bg-green-50">
                <td className="px-2 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveNew}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                      title="Salvar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCancelNew}
                      className="p-1 text-red-600 hover:bg-red-100 rounded"
                      title="Cancelar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                {baseColumns.map((col) => (
                  <td key={col.key} className="px-2 py-2" style={{ width: col.width }}>
                    {renderNewCell(col)}
                  </td>
                ))}
              </tr>
            )}

            {filteredItens.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <tr
                  key={item.id}
                  className={`border-b theme-divide transition-colors ${
                    isEditing ? 'bg-blue-50' : ''
                  }`}
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 theme-text-secondary hover:theme-text hover:bg-gray-100 rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-red-500 hover:bg-red-100 rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
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

            {filteredItens.length === 0 && !isAddingNew && (
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
                      className="h-full bg-primary rounded-full"
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
    </div>
  );
};

export default TakeoffGrid;
