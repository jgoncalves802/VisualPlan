/**
 * Lista de Tarefas (visualização alternativa)
 */

import React, { useMemo, useState } from 'react';
import { AtividadeMock, DependenciaAtividade } from '../../../types/cronograma';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { formatarData } from '../../../utils/dateFormatter';
import { Trash2, AlertTriangle, Loader2, X } from 'lucide-react';

interface TaskListProps {
  atividades: AtividadeMock[];
  todasAtividades: AtividadeMock[];
  dependencias: DependenciaAtividade[];
  onEdit: (atividadeId: string) => void;
  onDelete: (atividadeId: string) => void;
  onDeleteMultiple?: (atividadeIds: string[]) => Promise<void>;
}

type SortField = 'nome' | 'data_inicio' | 'data_fim' | 'progresso' | 'status';
type SortOrder = 'asc' | 'desc';

export const TaskList: React.FC<TaskListProps> = ({ atividades, todasAtividades, dependencias, onEdit, onDelete, onDeleteMultiple }) => {
  const { configuracoes } = useCronogramaStore();
  const [sortField, setSortField] = useState<SortField>('data_inicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(atividades.filter(a => a.tipo !== 'WBS').map(a => a.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteMultiple || selectedIds.size === 0) return;
    
    setIsDeleting(true);
    try {
      await onDeleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting activities:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const selectableActivities = atividades.filter(a => a.tipo !== 'WBS');
  const allSelected = selectableActivities.length > 0 && selectableActivities.every(a => selectedIds.has(a.id));

  const atividadesMap = useMemo(() => {
    const map = new Map<string, AtividadeMock>();
    todasAtividades.forEach((atividade) => map.set(atividade.id, atividade));
    return map;
  }, [todasAtividades]);

  const predecessorasMap = useMemo(() => {
    const map = new Map<string, AtividadeMock[]>();
    dependencias.forEach((dep) => {
      const origem = atividadesMap.get(dep.atividade_origem_id);
      if (!origem) return;
      const lista = map.get(dep.atividade_destino_id) || [];
      lista.push(origem);
      map.set(dep.atividade_destino_id, lista);
    });
    return map;
  }, [dependencias, atividadesMap]);

  const sucessorasMap = useMemo(() => {
    const map = new Map<string, AtividadeMock[]>();
    dependencias.forEach((dep) => {
      const destino = atividadesMap.get(dep.atividade_destino_id);
      if (!destino) return;
      const lista = map.get(dep.atividade_origem_id) || [];
      lista.push(destino);
      map.set(dep.atividade_origem_id, lista);
    });
    return map;
  }, [dependencias, atividadesMap]);

  // Ordenação
  const atividadesOrdenadas = [...atividades].sort((a, b) => {
    let compareValue = 0;

    switch (sortField) {
      case 'nome':
        compareValue = a.nome.localeCompare(b.nome);
        break;
      case 'data_inicio':
        compareValue = new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime();
        break;
      case 'data_fim':
        compareValue = new Date(a.data_fim).getTime() - new Date(b.data_fim).getTime();
        break;
      case 'progresso':
        compareValue = a.progresso - b.progresso;
        break;
      case 'status':
        compareValue = a.status.localeCompare(b.status);
        break;
    }

    return sortOrder === 'asc' ? compareValue : -compareValue;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Não Iniciada':
        return 'bg-gray-100 text-gray-700';
      case 'Em Andamento':
        return 'bg-blue-100 text-blue-700';
      case 'Concluída':
        return 'bg-green-100 text-green-700';
      case 'Paralisada':
        return 'bg-orange-100 text-orange-700';
      case 'Atrasada':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="overflow-x-auto">
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} atividade(s) selecionada(s)
            </span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpar seleção
            </button>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Selecionadas
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Confirmar Exclusão
              </h3>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Tem certeza que deseja excluir <strong>{selectedIds.size}</strong> atividade(s)?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">
              Esta ação excluirá as atividades selecionadas e suas dependências. Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-3 py-3 text-center w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('nome')}
            >
              <div className="flex items-center gap-2">
                <span>Nome</span>
                <SortIcon field="nome" />
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Código
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Atividade Mãe
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('data_inicio')}
            >
              <div className="flex items-center gap-2">
                <span>Data Início</span>
                <SortIcon field="data_inicio" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('data_fim')}
            >
              <div className="flex items-center gap-2">
                <span>Data Fim</span>
                <SortIcon field="data_fim" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('progresso')}
            >
              <div className="flex items-center gap-2">
                <span>Progresso</span>
                <SortIcon field="progresso" />
              </div>
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                <span>Status</span>
                <SortIcon field="status" />
              </div>
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Responsável
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Predecessoras
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sucessoras
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {atividadesOrdenadas.map((atividade) => (
            <tr key={atividade.id} className={`hover:bg-gray-50 transition ${selectedIds.has(atividade.id) ? 'bg-blue-50' : ''}`}>
              <td className="px-3 py-4 text-center">
                {atividade.tipo !== 'WBS' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.has(atividade.id)}
                    onChange={(e) => handleSelectOne(atividade.id, e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {atividade.e_critica && (
                    <svg
                      className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{atividade.nome}</div>
                    {atividade.descricao && (
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{atividade.descricao}</div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700 font-mono">{atividade.codigo || '-'}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">{atividade.tipo}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">
                  {atividade.parent_id
                    ? (() => {
                        const parent = atividadesMap.get(atividade.parent_id);
                        if (!parent) return '-';
                        return parent.codigo ? `${parent.codigo} - ${parent.nome}` : parent.nome;
                      })()
                    : '-'}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">
                  {formatarData(atividade.data_inicio, configuracoes.formato_data_tabela)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">
                  {formatarData(atividade.data_fim, configuracoes.formato_data_tabela)}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${atividade.progresso}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">{atividade.progresso}%</span>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(atividade.status)}`}>
                  {atividade.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-700">{atividade.responsavel_nome || '-'}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap max-w-[200px]">
                <div className="text-sm text-gray-700 truncate" title={formatRelacoes(predecessorasMap.get(atividade.id))}>
                  {formatRelacoes(predecessorasMap.get(atividade.id))}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap max-w-[200px]">
                <div className="text-sm text-gray-700 truncate" title={formatRelacoes(sucessorasMap.get(atividade.id))}>
                  {formatRelacoes(sucessorasMap.get(atividade.id))}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(atividade.id)}
                    className="text-blue-600 hover:text-blue-900 transition"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(atividade.id)}
                    className="text-red-600 hover:text-red-900 transition"
                    title="Excluir"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function formatRelacoes(lista?: AtividadeMock[]): string {
  if (!lista || lista.length === 0) {
    return '-';
  }
  return lista
    .map((atividade) => (atividade.codigo ? `${atividade.codigo}` : atividade.nome))
    .join(', ');
}

