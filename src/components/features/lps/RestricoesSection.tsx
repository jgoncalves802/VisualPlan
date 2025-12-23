/**
 * RestricoesSection - Componente de seção de restrições do LPS
 * Tabela de restrições da semana atual com responsáveis, apoio e datas de conclusão
 */

import React, { useState, useMemo } from 'react';
import { format, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricaoLPS, TipoRestricao } from '../../../types/lps';
import { Plus, X, Edit2, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RestricoesSectionProps {
  restricoes: RestricaoLPS[];
  dataInicio: Date;
  dataFim: Date;
  onAddRestricao?: (restricao: Omit<RestricaoLPS, 'id'>) => void;
  onEditRestricao?: (id: string, restricao: Partial<RestricaoLPS>) => void;
  onDeleteRestricao?: (id: string) => void;
  onToggleRestricao?: (id: string) => void;
}

export const RestricoesSection: React.FC<RestricoesSectionProps> = ({
  restricoes,
  dataInicio,
  dataFim,
  onAddRestricao,
  onEditRestricao,
  onDeleteRestricao,
  onToggleRestricao,
}) => {
  const navigate = useNavigate();
  const [showAddRestricao, setShowAddRestricao] = useState(false);
  const [novaRestricao, setNovaRestricao] = useState({
    descricao: '',
    tipo: TipoRestricao.SEM_RESTRICAO as TipoRestricao,
    responsavel: '',
    apoio: '',
    data_conclusao_planejada: new Date(),
  });

  // Helper para converter para Date
  const parseDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  };

  // Filtrar restrições da semana atual
  const restricoesDaSemana = useMemo(() => {
    // Verificar se dataInicio e dataFim são Date válidas
    const inicio = parseDate(dataInicio);
    const fim = parseDate(dataFim);
    
    return restricoes.filter((restricao) => {
      if (!restricao.data_conclusao_planejada) return false;
      const dataRestricao = parseDate(restricao.data_conclusao_planejada);
      return isWithinInterval(dataRestricao, {
        start: inicio,
        end: fim,
      });
    });
  }, [restricoes, dataInicio, dataFim]);

  // Handler para adicionar restrição
  const handleAddRestricao = () => {
    if (novaRestricao.descricao.trim() && onAddRestricao) {
      onAddRestricao({
        ...novaRestricao,
        status: 'PENDENTE',
        data_conclusao_planejada: novaRestricao.data_conclusao_planejada,
        data_criacao: new Date(),
        historico: [],
      });
      setNovaRestricao({
        descricao: '',
        tipo: TipoRestricao.SEM_RESTRICAO,
        responsavel: '',
        apoio: '',
        data_conclusao_planejada: new Date(),
      });
      setShowAddRestricao(false);
    }
  };

  // Handler para marcar como concluída
  const handleToggleConcluida = (id: string) => {
    if (onToggleRestricao) {
      onToggleRestricao(id);
    } else {
      const restricao = restricoes.find((r) => r.id === id);
      if (restricao && onEditRestricao) {
        onEditRestricao(id, {
          status: restricao.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA',
          data_conclusao:
            restricao.status === 'CONCLUIDA' ? undefined : new Date(),
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold uppercase">Restrições da Semana</h3>
          <button
            onClick={() => navigate('/restricoes')}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            title="Ver todas as restrições"
          >
            <Calendar size={18} />
          </button>
        </div>
      </div>

      {/* Tabela de restrições */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Restrição
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 border-b border-gray-300 w-16">
                Tipo
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Responsável
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Apoio
              </th>
              <th className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300">
                Data Conclusão
              </th>
              <th className="px-3 py-2 text-center font-semibold text-gray-700 border-b border-gray-300 w-20">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {restricoesDaSemana.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-sm">
                  Nenhuma restrição para esta semana
                </td>
              </tr>
            ) : (
              restricoesDaSemana.map((restricao) => (
                <tr
                  key={restricao.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    restricao.status === 'CONCLUIDA' ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-3 py-2 text-gray-900">{restricao.descricao}</td>
                  <td className="px-3 py-2 text-center">
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
                  <td className="px-3 py-2 text-gray-700">{restricao.responsavel || '-'}</td>
                  <td className="px-3 py-2 text-gray-700">{restricao.apoio || '-'}</td>
                  <td className="px-3 py-2 text-gray-700">
                    {restricao.data_conclusao ? (
                      <span className="text-blue-600 font-semibold">
                        {format(restricao.data_conclusao, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    ) : restricao.data_conclusao_planejada ? (
                      <span className="text-gray-600">
                        {format(restricao.data_conclusao_planejada, 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </span>
                    ) : (
                      '-'
                    )}
                    {restricao.status === 'CONCLUIDA' && (
                      <span className="ml-2 text-green-600 font-semibold">(Concluído)</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleConcluida(restricao.id)}
                        className={`p-1 rounded ${
                          restricao.status === 'CONCLUIDA'
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-gray-500 hover:bg-gray-200'
                        }`}
                        title={
                          restricao.status === 'CONCLUIDA'
                            ? 'Marcar como pendente'
                            : 'Marcar como concluída'
                        }
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button
                        onClick={() => onDeleteRestricao?.(restricao.id)}
                        className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-200 rounded"
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

        {/* Botão para adicionar restrição */}
        {showAddRestricao ? (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="space-y-2">
              <input
                type="text"
                value={novaRestricao.descricao}
                onChange={(e) =>
                  setNovaRestricao({ ...novaRestricao, descricao: e.target.value })
                }
                placeholder="Descrição da restrição..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={novaRestricao.tipo}
                  onChange={(e) =>
                    setNovaRestricao({
                      ...novaRestricao,
                      tipo: e.target.value as TipoRestricao,
                    })
                  }
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                >
                  <option value={TipoRestricao.SEM_RESTRICAO}>Sem Restrição (N)</option>
                  <option value={TipoRestricao.RESTRICAO}>Com Restrição (S)</option>
                </select>
                <input
                  type="text"
                  value={novaRestricao.responsavel}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, responsavel: e.target.value })
                  }
                  placeholder="Responsável"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={novaRestricao.apoio}
                  onChange={(e) =>
                    setNovaRestricao({ ...novaRestricao, apoio: e.target.value })
                  }
                  placeholder="Apoio"
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={format(novaRestricao.data_conclusao_planejada, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      setNovaRestricao({
                        ...novaRestricao,
                        data_conclusao_planejada: new Date(year, month - 1, day, 12, 0, 0),
                      });
                    }
                  }}
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleAddRestricao}
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => {
                    setShowAddRestricao(false);
                    setNovaRestricao({
                      descricao: '',
                      tipo: TipoRestricao.SEM_RESTRICAO,
                      responsavel: '',
                      apoio: '',
                      data_conclusao_planejada: new Date(),
                    });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setShowAddRestricao(true)}
              className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Adicionar Restrição</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
