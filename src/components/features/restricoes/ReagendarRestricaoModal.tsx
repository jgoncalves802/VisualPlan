/**
 * ReagendarRestricaoModal - Modal para reagendar uma restrição
 */

import React, { useState, useEffect } from 'react';
import { RestricaoLPS } from '../../../types/lps';
import { X, Save, AlertTriangle } from 'lucide-react';

interface ReagendarRestricaoModalProps {
  restricao: RestricaoLPS | null;
  isOpen: boolean;
  onClose: () => void;
  onReagendar: (restricaoId: string, novaData: Date, motivo?: string, impacto?: string) => void;
}

export const ReagendarRestricaoModal: React.FC<ReagendarRestricaoModalProps> = ({
  restricao,
  isOpen,
  onClose,
  onReagendar,
}) => {
  const [formData, setFormData] = useState({
    novaData: new Date(),
    motivo: '',
    impacto: '',
    responsavel: '',
  });

  useEffect(() => {
    if (restricao) {
      // Usar a função parseDate definida abaixo do componente
      const dataPlanejada = parseDate(restricao.data_conclusao_planejada);
      setFormData({
        novaData: dataPlanejada,
        motivo: '',
        impacto: '',
        responsavel: restricao.responsavel || '',
      });
    }
  }, [restricao, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (restricao) {
      onReagendar(restricao.id, formData.novaData, formData.motivo, formData.impacto);
      onClose();
    }
  };

  if (!isOpen || !restricao) return null;

  // Verificar se a restrição tem uma data de conclusão planejada
  const temDataAnterior = restricao.data_conclusao_planejada !== undefined && restricao.data_conclusao_planejada !== null;
  const dataAnterior = temDataAnterior ? parseDate(restricao.data_conclusao_planejada) : null;
  const diasDiferenca = dataAnterior
    ? Math.ceil((formData.novaData.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Reagendar Restrição</h2>
            <p className="text-sm text-orange-100 mt-1">{restricao.descricao}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-orange-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form id="reagendar-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Informações da data anterior */}
            {dataAnterior && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Data Atual Planejada:</div>
                <div className="text-lg font-semibold text-gray-900">
                  {dataAnterior.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </div>
              </div>
            )}

            {/* Nova data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nova Data de Conclusão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formatDateForInput(formData.novaData)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setFormData({
                      ...formData,
                      novaData: new Date(year, month - 1, day, 12, 0, 0),
                    });
                  }
                }}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
              {diasDiferenca !== undefined && diasDiferenca !== 0 && (
                <div
                  className={`mt-2 text-sm ${
                    diasDiferenca > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}
                >
                  {diasDiferenca > 0
                    ? `Adiamento de ${diasDiferenca} dia(s)`
                    : `Antecipação de ${Math.abs(diasDiferenca)} dia(s)`}
                </div>
              )}
            </div>

            {/* Responsável pelo reagendamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsável pelo Reagendamento
              </label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Nome do responsável"
              />
            </div>

            {/* Motivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo do Reagendamento <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows={3}
                required
                placeholder="Descreva o motivo do reagendamento..."
              />
            </div>

            {/* Impacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <AlertTriangle size={16} className="text-orange-600" />
                Impacto Esperado (se houver)
              </label>
              <textarea
                value={formData.impacto}
                onChange={(e) => setFormData({ ...formData, impacto: e.target.value })}
                className="w-full p-2 border border-orange-300 rounded resize-none bg-orange-50"
                rows={3}
                placeholder="Descreva o impacto esperado deste reagendamento..."
              />
              <div className="mt-1 text-xs text-gray-500">
                Este campo ajudará a mapear possíveis impactos posteriores e gerar relatórios.
              </div>
            </div>

            {/* Aviso sobre histórico */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>Importante:</strong> Este reagendamento será registrado no histórico da
                restrição e poderá ser visualizado posteriormente para análise de impactos.
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="reagendar-form"
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Reagendar
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper para converter qualquer valor para Date válido
function parseDate(date: any): Date {
  try {
    if (!date) {
      return new Date();
    }
    if (date instanceof Date) {
      if (isNaN(date.getTime()) || typeof date.getFullYear !== 'function') {
        return new Date();
      }
      return date;
    }
    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
        return new Date();
      }
      return parsed;
    }
    if (typeof date === 'number') {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
        return new Date();
      }
      return parsed;
    }
    return new Date();
  } catch (error) {
    return new Date();
  }
}

// Helper para formatar data para input
function formatDateForInput(date: any): string {
  try {
    const dateObj = parseDate(date);
    
    // Verificação final de segurança
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime()) || typeof dateObj.getFullYear !== 'function') {
      const fallbackDate = new Date();
      const year = fallbackDate.getFullYear();
      const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
      const day = String(fallbackDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    const fallbackDate = new Date();
    const year = fallbackDate.getFullYear();
    const month = String(fallbackDate.getMonth() + 1).padStart(2, '0');
    const day = String(fallbackDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

