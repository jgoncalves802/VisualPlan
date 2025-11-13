/**
 * RestricoesTableView - Visualização de restrições em formato de tabela
 */

import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricaoLPS, TipoRestricao } from '../../../types/lps';
import {
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  History,
  Filter,
  Download,
} from 'lucide-react';

interface RestricoesTableViewProps {
  restricoes: RestricaoLPS[];
  onEdit?: (restricao: RestricaoLPS) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onViewHistory?: (restricao: RestricaoLPS) => void;
  onReagendar?: (restricao: RestricaoLPS) => void;
  podeConcluir?: (restricaoId: string) => boolean; // Função para verificar se pode concluir
}

export const RestricoesTableView: React.FC<RestricoesTableViewProps> = ({
  restricoes,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewHistory,
  onReagendar,
  podeConcluir,
}) => {
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todos');
  const [ordenarPor, setOrdenarPor] = useState<'data' | 'prioridade' | 'status'>('data');

  // Helper para converter para Date
  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Filtrar restrições
  const restricoesFiltradas = useMemo(() => {
    let filtradas = [...restricoes];

    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter((r) => r.status === filtroStatus);
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos') {
      filtradas = filtradas.filter((r) => r.tipo === filtroTipo);
    }

    // Filtro por prioridade
    if (filtroPrioridade !== 'todos') {
      filtradas = filtradas.filter((r) => r.prioridade === filtroPrioridade);
    }

    // Ordenar
    filtradas.sort((a, b) => {
      switch (ordenarPor) {
        case 'data':
          const dataA = parseDate(a.data_conclusao_planejada);
          const dataB = parseDate(b.data_conclusao_planejada);
          const timeA = dataA ? dataA.getTime() : 0;
          const timeB = dataB ? dataB.getTime() : 0;
          return timeA - timeB;
        case 'prioridade':
          const prioridadeOrder = { ALTA: 3, MEDIA: 2, BAIXA: 1 };
          const prioridadeA = prioridadeOrder[a.prioridade || 'BAIXA'] || 0;
          const prioridadeB = prioridadeOrder[b.prioridade || 'BAIXA'] || 0;
          return prioridadeB - prioridadeA;
        case 'status':
          const statusOrder = { ATRASADA: 4, PENDENTE: 3, CONCLUIDA: 2, CANCELADA: 1 };
          return statusOrder[b.status] - statusOrder[a.status];
        default:
          return 0;
      }
    });

    return filtradas;
  }, [restricoes, filtroStatus, filtroTipo, filtroPrioridade, ordenarPor]);

  // Obter ícone de status
  const getStatusIcon = (status: RestricaoLPS['status']) => {
    switch (status) {
      case 'CONCLUIDA':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'ATRASADA':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'PENDENTE':
        return <Clock size={16} className="text-blue-600" />;
      case 'CANCELADA':
        return <XCircle size={16} className="text-gray-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  // Obter cor de status
  const getStatusColor = (status: RestricaoLPS['status']) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'bg-green-50 text-green-800';
      case 'ATRASADA':
        return 'bg-red-50 text-red-800';
      case 'PENDENTE':
        return 'bg-blue-50 text-blue-800';
      case 'CANCELADA':
        return 'bg-gray-50 text-gray-800';
      default:
        return 'bg-gray-50 text-gray-800';
    }
  };

  // Obter cor de prioridade
  const getPrioridadeColor = (prioridade?: string) => {
    switch (prioridade) {
      case 'ALTA':
        return 'bg-red-100 text-red-800';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800';
      case 'BAIXA':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Filtros e controles */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          {/* Filtro por status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="todos">Todos os Status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="ATRASADA">Atrasada</option>
            <option value="CANCELADA">Cancelada</option>
          </select>

          {/* Filtro por tipo */}
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="todos">Todos os Tipos</option>
            <option value={TipoRestricao.RESTRICAO}>Com Restrição (S)</option>
            <option value={TipoRestricao.SEM_RESTRICAO}>Sem Restrição (N)</option>
          </select>

          {/* Filtro por prioridade */}
          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>

          {/* Ordenar por */}
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as 'data' | 'prioridade' | 'status')}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
          >
            <option value="data">Ordenar por Data</option>
            <option value="prioridade">Ordenar por Prioridade</option>
            <option value="status">Ordenar por Status</option>
          </select>

          <div className="ml-auto text-sm text-gray-600">
            {restricoesFiltradas.length} de {restricoes.length} restrições
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-300">
                Descrição
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-300 w-24">
                Tipo
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-300 w-24">
                Status
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-300 w-24">
                Prioridade
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-300">
                Responsável
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-300">
                Apoio
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700 border-b border-gray-300">
                Data Conclusão
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700 border-b border-gray-300 w-32">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {restricoesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Nenhuma restrição encontrada
                </td>
              </tr>
            ) : (
              restricoesFiltradas.map((restricao) => (
                <tr
                  key={restricao.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    restricao.status === 'CONCLUIDA' ? 'bg-green-50' : ''
                  } ${restricao.status === 'ATRASADA' ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-900">
                    <div className="flex items-center gap-2">
                      {restricao.historico && restricao.historico.length > 0 && (
                        <History size={14} className="text-yellow-600" title="Tem histórico" />
                      )}
                      <span className="font-medium">{restricao.descricao}</span>
                    </div>
                    {restricao.impacto_previsto && (
                      <div className="text-xs text-orange-600 mt-1">
                        ⚠️ {restricao.impacto_previsto}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        restricao.tipo === TipoRestricao.RESTRICAO
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {restricao.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(restricao.status)}
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(restricao.status)}`}>
                        {restricao.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {restricao.prioridade && (
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${getPrioridadeColor(
                          restricao.prioridade
                        )}`}
                      >
                        {restricao.prioridade}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{restricao.responsavel || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{restricao.apoio || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {(() => {
                      const dataConclusao = parseDate(restricao.data_conclusao);
                      const dataConclusaoPlanejada = parseDate(restricao.data_conclusao_planejada);
                      
                      if (dataConclusao) {
                        return (
                          <span className="text-green-600 font-semibold">
                            {format(dataConclusao, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        );
                      } else if (dataConclusaoPlanejada) {
                        return (
                          <span className="text-gray-600">
                            {format(dataConclusaoPlanejada, 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        );
                      } else {
                        return '-';
                      }
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {restricao.historico && restricao.historico.length > 0 && (
                        <button
                          onClick={() => onViewHistory?.(restricao)}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 rounded"
                          title="Ver histórico"
                        >
                          <History size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => onReagendar?.(restricao)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="Reagendar"
                      >
                        <Clock size={16} />
                      </button>
                      <button
                        onClick={() => onToggleStatus?.(restricao.id)}
                        disabled={
                          restricao.status !== 'CONCLUIDA' &&
                          podeConcluir &&
                          !podeConcluir(restricao.id)
                        }
                        className={`p-1.5 rounded ${
                          restricao.status === 'CONCLUIDA'
                            ? 'text-green-600 hover:bg-green-100'
                            : podeConcluir && !podeConcluir(restricao.id)
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                        title={
                          restricao.status === 'CONCLUIDA'
                            ? 'Marcar como pendente'
                            : podeConcluir && !podeConcluir(restricao.id)
                            ? 'Apenas o criador pode marcar como concluída'
                            : 'Marcar como concluída'
                        }
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => onEdit?.(restricao)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => onDelete?.(restricao.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

