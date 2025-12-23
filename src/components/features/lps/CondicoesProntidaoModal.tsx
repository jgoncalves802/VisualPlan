import React from 'react';
import { X, Link, CheckCircle, Clock } from 'lucide-react';
import { AtividadeLPS, ResumoProntidao, StatusAtividadeLPS } from '../../../types/lps';
import { CondicoesProntidaoChecklist } from './CondicoesProntidaoChecklist';

interface CondicoesProntidaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  atividade: AtividadeLPS | null;
  empresaId: string;
  onAddRestricao?: (atividade: AtividadeLPS) => void;
  onProntidaoChange?: (atividadeId: string, resumo: ResumoProntidao) => void;
  todasAtividades?: AtividadeLPS[];
}

export const CondicoesProntidaoModal: React.FC<CondicoesProntidaoModalProps> = ({
  isOpen,
  onClose,
  atividade,
  empresaId,
  onAddRestricao,
  onProntidaoChange,
  todasAtividades = [],
}) => {
  if (!isOpen || !atividade) return null;

  const handleProntidaoChange = (resumo: ResumoProntidao) => {
    onProntidaoChange?.(atividade.id, resumo);
  };

  const predecessoras = atividade.dependencias?.map(depId => 
    todasAtividades.find(a => a.id === depId)
  ).filter(Boolean) as AtividadeLPS[] || [];

  const predecessorasConcluidas = predecessoras.filter(p => p.status === StatusAtividadeLPS.CONCLUIDA);
  const todasPredecessorasConcluidas = predecessoras.length === 0 || predecessorasConcluidas.length === predecessoras.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
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

        <div className="p-4 overflow-y-auto flex-1">
          {predecessoras.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Link className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Predecessoras ({predecessorasConcluidas.length}/{predecessoras.length} concluídas)
                </span>
                {todasPredecessorasConcluidas ? (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-500 ml-auto" />
                )}
              </div>
              <div className="space-y-1">
                {predecessoras.map(pred => (
                  <div key={pred.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${
                      pred.status === StatusAtividadeLPS.CONCLUIDA 
                        ? 'bg-green-500' 
                        : 'bg-amber-500'
                    }`} />
                    <span className={pred.status === StatusAtividadeLPS.CONCLUIDA ? 'text-gray-600' : 'text-gray-800'}>
                      {pred.nome}
                    </span>
                    <span className={`ml-auto text-xs ${
                      pred.status === StatusAtividadeLPS.CONCLUIDA 
                        ? 'text-green-600' 
                        : 'text-amber-600'
                    }`}>
                      {pred.status === StatusAtividadeLPS.CONCLUIDA ? '100%' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <CondicoesProntidaoChecklist
            atividadeId={atividade.id}
            empresaId={empresaId}
            onProntidaoChange={handleProntidaoChange}
            atividade={atividade}
            todasAtividades={todasAtividades}
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
