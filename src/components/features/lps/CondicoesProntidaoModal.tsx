import React from 'react';
import { X } from 'lucide-react';
import { AtividadeLPS } from '../../../types/lps';
import { CondicoesProntidaoChecklist } from './CondicoesProntidaoChecklist';

interface CondicoesProntidaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  atividade: AtividadeLPS | null;
  empresaId: string;
  onAddRestricao?: (atividade: AtividadeLPS) => void;
}

export const CondicoesProntidaoModal: React.FC<CondicoesProntidaoModalProps> = ({
  isOpen,
  onClose,
  atividade,
  empresaId,
  onAddRestricao,
}) => {
  if (!isOpen || !atividade) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold text-gray-900">Condições de Prontidão</h3>
            <p className="text-sm text-gray-500 mt-0.5">{atividade.nome}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          <CondicoesProntidaoChecklist
            atividadeId={atividade.id}
            empresaId={empresaId}
          />

          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500 mb-3">
              Clique em cada condição para alterar o status. Quando todas estiverem atendidas, a atividade estará pronta para execução.
            </p>
            
            {onAddRestricao && (
              <button
                onClick={() => {
                  onAddRestricao(atividade);
                  onClose();
                }}
                className="w-full py-2 px-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                + Criar Restrição para Condição Pendente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
