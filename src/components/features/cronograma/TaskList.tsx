/**
 * Lista de Tarefas (visualização alternativa)
 */

import React, { useState } from 'react';
import { AtividadeMock } from '../../../types/cronograma';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { formatarData } from '../../../utils/dateFormatter';

interface TaskListProps {
  atividades: AtividadeMock[];
  onEdit: (atividadeId: string) => void;
  onDelete: (atividadeId: string) => void;
}

type SortField = 'nome' | 'data_inicio' | 'data_fim' | 'progresso' | 'status';
type SortOrder = 'asc' | 'desc';

export const TaskList: React.FC<TaskListProps> = ({ atividades, onEdit, onDelete }) => {
  const { configuracoes } = useCronogramaStore();
  const [sortField, setSortField] = useState<SortField>('data_inicio');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
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
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {atividadesOrdenadas.map((atividade) => (
            <tr key={atividade.id} className="hover:bg-gray-50 transition">
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

