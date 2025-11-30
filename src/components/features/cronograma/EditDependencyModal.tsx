/**
 * Modal para editar dependências existentes entre atividades
 * Permite alterar o tipo de dependência (FS, SS, FF, SF) e o lag
 */

import React, { useState, useEffect } from 'react';
import { TipoDependencia } from '../../../types/cronograma';
import type { Dependency, Task } from '../../../lib/vision-gantt/types';

interface EditDependencyModalProps {
  open: boolean;
  onClose: () => void;
  dependency: Dependency | null;
  fromTask: Task | null;
  toTask: Task | null;
  onSave: (dependencyId: string, updates: {
    tipo: TipoDependencia;
    lag_dias: number;
  }) => Promise<void>;
  onDelete?: (dependencyId: string) => Promise<void>;
}

export const EditDependencyModal: React.FC<EditDependencyModalProps> = ({
  open,
  onClose,
  dependency,
  fromTask,
  toTask,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    tipo: TipoDependencia.FS,
    lag_dias: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && dependency) {
      setFormData({
        tipo: dependency.type as TipoDependencia,
        lag_dias: dependency.lag || 0,
      });
      setError(null);
    }
  }, [open, dependency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dependency) return;

    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave(dependency.id, {
        tipo: formData.tipo,
        lag_dias: formData.lag_dias,
      });
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar dependência:', err);
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar dependência';
      setError(mensagem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!dependency || !onDelete) return;

    if (!window.confirm('Tem certeza que deseja excluir esta dependência?')) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    
    try {
      await onDelete(dependency.id);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir dependência:', err);
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir dependência';
      setError(mensagem);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open || !dependency || !fromTask || !toTask) return null;

  const tiposInfo = {
    [TipoDependencia.FS]: {
      nome: 'Finish-to-Start (FS)',
      descricao: 'A sucessora só pode começar após a predecessora terminar',
      icone: '→',
    },
    [TipoDependencia.SS]: {
      nome: 'Start-to-Start (SS)',
      descricao: 'A sucessora só pode começar quando a predecessora começar',
      icone: '⇉',
    },
    [TipoDependencia.FF]: {
      nome: 'Finish-to-Finish (FF)',
      descricao: 'A sucessora só pode terminar quando a predecessora terminar',
      icone: '⇇',
    },
    [TipoDependencia.SF]: {
      nome: 'Start-to-Finish (SF)',
      descricao: 'A sucessora só pode terminar quando a predecessora começar',
      icone: '←',
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div>
            <h2 className="text-lg font-bold text-white">Editar Dependência</h2>
            <p className="text-sm text-blue-100 mt-0.5">
              Altere o tipo de ligação entre as atividades
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition p-1 rounded-full hover:bg-white/10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Atividades Vinculadas */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Predecessora</span>
              <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="font-medium text-gray-900 text-sm">{fromTask.name}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-center pt-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">{tiposInfo[formData.tipo].icone}</span>
              </div>
              <span className="text-xs font-mono text-gray-500 mt-1">{formData.tipo}</span>
            </div>
            
            <div className="flex-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sucessora</span>
              <div className="mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
                <span className="font-medium text-gray-900 text-sm">{toTask.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Tipo de Dependência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Dependência
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(TipoDependencia).map((tipo) => {
                const info = tiposInfo[tipo];
                const isSelected = formData.tipo === tipo;
                return (
                  <label
                    key={tipo}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      checked={isSelected}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoDependencia })}
                      className="sr-only"
                    />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className="text-lg">{info.icone}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                          {tipo}
                        </span>
                      </div>
                      <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                        {info.descricao}
                      </p>
                    </div>
                    {isSelected && (
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Lag (Atraso/Antecipação) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lag (Atraso/Antecipação)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Positivo = atraso | Negativo = antecipação (lead) | Intervalo: -365 a 365 dias
            </p>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, lag_dias: Math.max(-365, formData.lag_dias - 1) })}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 transition border-r border-gray-300"
                  disabled={formData.lag_dias <= -365}
                >
                  −
                </button>
                <input
                  type="number"
                  min="-365"
                  max="365"
                  value={formData.lag_dias}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '-') {
                      setFormData({ ...formData, lag_dias: 0 });
                      return;
                    }
                    const parsed = parseInt(value, 10);
                    if (!isNaN(parsed)) {
                      const clamped = Math.min(365, Math.max(-365, parsed));
                      setFormData({ ...formData, lag_dias: clamped });
                    }
                  }}
                  className="w-20 px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, lag_dias: Math.min(365, formData.lag_dias + 1) })}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 transition border-l border-gray-300"
                  disabled={formData.lag_dias >= 365}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-600">dias</span>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                formData.lag_dias > 0 
                  ? 'bg-amber-100 text-amber-700' 
                  : formData.lag_dias < 0 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {formData.lag_dias > 0 && `+${formData.lag_dias}d atraso`}
                {formData.lag_dias < 0 && `${formData.lag_dias}d antecipação`}
                {formData.lag_dias === 0 && 'Imediato'}
              </span>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Excluir
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
