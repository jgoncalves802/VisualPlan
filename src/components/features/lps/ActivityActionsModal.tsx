/**
 * ActivityActionsModal - Modal de ações para atividades no LPS
 * Permite adicionar restrições, editar atividade, ver restrições vinculadas, etc.
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, RestricaoLPS } from '../../../types/lps';
import { X, AlertTriangle, Edit2, FileText, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ActivityActionsModalProps {
  atividade: AtividadeLPS | null;
  restricoes?: RestricaoLPS[];
  isOpen: boolean;
  onClose: () => void;
  onAddRestricao?: (atividadeId: string) => void;
  onEditAtividade?: (atividadeId: string) => void;
  onViewDetails?: (atividadeId: string) => void;
  onEditRestricao?: (restricao: RestricaoLPS) => void;
}

export const ActivityActionsModal: React.FC<ActivityActionsModalProps> = ({
  atividade,
  restricoes = [],
  isOpen,
  onClose,
  onAddRestricao,
  onEditAtividade,
  onViewDetails,
  onEditRestricao,
}) => {
  if (!isOpen || !atividade) return null;

  const restricoesAtividade = restricoes.filter((r) => r.atividade_id === atividade.id);
  const restricoesPendentes = restricoesAtividade.filter((r) => r.status === 'PENDENTE' || r.status === 'ATRASADA');
  const restricoesConcluidas = restricoesAtividade.filter((r) => r.status === 'CONCLUIDA');

  const handleAddRestricao = () => {
    if (onAddRestricao) {
      onAddRestricao(atividade.id);
    }
  };

  const handleEditAtividade = () => {
    if (onEditAtividade) {
      onEditAtividade(atividade.id);
    }
    onClose();
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(atividade.id);
    }
    onClose();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return <CheckCircle2 size={16} className="text-green-500" />;
      case 'ATRASADA':
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-medium';
    switch (status) {
      case 'CONCLUIDA':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'ATRASADA':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'PENDENTE':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const getPrioridadeBadge = (prioridade?: string) => {
    const baseClasses = 'px-2 py-0.5 rounded text-xs font-medium';
    switch (prioridade) {
      case 'ALTA':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'MEDIA':
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      case 'BAIXA':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Detalhes da Atividade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Informações da atividade */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {atividade.nome}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              {atividade.codigo && (
                <div>
                  <span className="font-medium">Código:</span> {atividade.codigo}
                </div>
              )}
              {atividade.responsavel && (
                <div>
                  <span className="font-medium">Responsável:</span> {atividade.responsavel}
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className={getStatusBadge(atividade.status)}>{atividade.status}</span>
              </div>
              {atividade.data_inicio && atividade.data_fim && (
                <div>
                  <span className="font-medium">Período:</span>{' '}
                  {format(atividade.data_inicio, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(atividade.data_fim, 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
            </div>
          </div>

          {/* Restrições da Atividade */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                Restrições ({restricoesAtividade.length})
              </h4>
              <button
                onClick={handleAddRestricao}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <AlertTriangle size={14} />
                Nova Restrição
              </button>
            </div>

            {restricoesAtividade.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                <p className="text-green-700 font-medium">Atividade sem restrições</p>
                <p className="text-green-600 text-sm">Esta atividade pode prosseguir normalmente.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Restrições Pendentes */}
                {restricoesPendentes.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Clock size={14} className="text-yellow-500" />
                      Pendentes ({restricoesPendentes.length})
                    </h5>
                    <div className="space-y-2">
                      {restricoesPendentes.map((restricao) => (
                        <div
                          key={restricao.id}
                          onClick={() => onEditRestricao?.(restricao)}
                          className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 cursor-pointer hover:bg-yellow-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {restricao.descricao}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={getStatusBadge(restricao.status)}>
                                  {restricao.status}
                                </span>
                                {restricao.prioridade && (
                                  <span className={getPrioridadeBadge(restricao.prioridade)}>
                                    {restricao.prioridade}
                                  </span>
                                )}
                              </div>
                            </div>
                            {getStatusIcon(restricao.status)}
                          </div>
                          {restricao.data_conclusao_planejada && (
                            <p className="text-xs text-gray-500 mt-2">
                              Prazo: {format(restricao.data_conclusao_planejada, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                          {restricao.responsavel && (
                            <p className="text-xs text-gray-500">
                              Responsável: {restricao.responsavel}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restrições Concluídas */}
                {restricoesConcluidas.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <CheckCircle2 size={14} className="text-green-500" />
                      Concluídas ({restricoesConcluidas.length})
                    </h5>
                    <div className="space-y-2">
                      {restricoesConcluidas.map((restricao) => (
                        <div
                          key={restricao.id}
                          onClick={() => onEditRestricao?.(restricao)}
                          className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 line-through">
                                {restricao.descricao}
                              </p>
                              <span className={getStatusBadge(restricao.status)}>
                                {restricao.status}
                              </span>
                            </div>
                            {getStatusIcon(restricao.status)}
                          </div>
                          {restricao.data_conclusao && (
                            <p className="text-xs text-gray-500 mt-1">
                              Concluída em: {format(restricao.data_conclusao, 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <button
              onClick={handleEditAtividade}
              className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Edit2 size={20} />
              <span className="font-medium">Editar Atividade</span>
            </button>

            <button
              onClick={handleViewDetails}
              className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileText size={20} />
              <span className="font-medium">Ver Detalhes Completos</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
