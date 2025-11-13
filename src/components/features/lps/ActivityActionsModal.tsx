/**
 * ActivityActionsModal - Modal de ações para atividades no LPS
 * Permite adicionar restrições, editar atividade, etc.
 */

import React from 'react';
import { AtividadeLPS } from '../../../types/lps';
import { X, AlertTriangle, Edit2, FileText } from 'lucide-react';

interface ActivityActionsModalProps {
  atividade: AtividadeLPS | null;
  isOpen: boolean;
  onClose: () => void;
  onAddRestricao?: (atividadeId: string) => void;
  onEditAtividade?: (atividadeId: string) => void;
  onViewDetails?: (atividadeId: string) => void;
}

export const ActivityActionsModal: React.FC<ActivityActionsModalProps> = ({
  atividade,
  isOpen,
  onClose,
  onAddRestricao,
  onEditAtividade,
  onViewDetails,
}) => {
  if (!isOpen || !atividade) return null;

  const handleAddRestricao = () => {
    if (onAddRestricao) {
      onAddRestricao(atividade.id);
    }
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Ações da Atividade</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {/* Informações da atividade */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {atividade.nome}
            </h3>
            {atividade.codigo && (
              <p className="text-sm text-gray-600 mb-1">
                Código: {atividade.codigo}
              </p>
            )}
            {atividade.responsavel && (
              <p className="text-sm text-gray-600 mb-1">
                Responsável: {atividade.responsavel}
              </p>
            )}
          </div>

          {/* Ações */}
          <div className="space-y-2">
            <button
              onClick={handleAddRestricao}
              className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <AlertTriangle size={20} />
              <span className="font-medium">Adicionar Restrição</span>
            </button>

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
              <span className="font-medium">Ver Detalhes</span>
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

