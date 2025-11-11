/**
 * Modal para criar dependências entre atividades
 */

import React, { useState, useEffect } from 'react';
import { AtividadeMock, TipoDependencia } from '../../../types/cronograma';

interface DependencyModalProps {
  open: boolean;
  onClose: () => void;
  atividades: AtividadeMock[];
  onSave: (dependencia: {
    atividade_origem_id: string;
    atividade_destino_id: string;
    tipo: TipoDependencia;
    lag_dias?: number;
  }) => Promise<void>;
}

export const DependencyModal: React.FC<DependencyModalProps> = ({
  open,
  onClose,
  atividades,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    atividade_origem_id: '',
    atividade_destino_id: '',
    tipo: TipoDependencia.FS,
    lag_dias: 0,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setFormData({
        atividade_origem_id: '',
        atividade_destino_id: '',
        tipo: TipoDependencia.FS,
        lag_dias: 0,
      });
      setErrors({});
    }
  }, [open]);

  // Validações
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.atividade_origem_id) {
      newErrors.atividade_origem_id = 'Selecione a atividade predecessora';
    }

    if (!formData.atividade_destino_id) {
      newErrors.atividade_destino_id = 'Selecione a atividade sucessora';
    }

    if (formData.atividade_origem_id === formData.atividade_destino_id) {
      newErrors.atividade_destino_id = 'Uma atividade não pode depender de si mesma';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave({
        atividade_origem_id: formData.atividade_origem_id,
        atividade_destino_id: formData.atividade_destino_id,
        tipo: formData.tipo,
        lag_dias: formData.lag_dias || 0,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao criar dependência:', error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao criar dependência';
      setErrors({ submit: mensagem });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  const tiposInfo = {
    [TipoDependencia.FS]: {
      nome: 'Finish-to-Start (FS)',
      descricao: 'A sucessora só pode começar após a predecessora terminar',
      exemplo: 'Padrão - Mais comum',
    },
    [TipoDependencia.SS]: {
      nome: 'Start-to-Start (SS)',
      descricao: 'A sucessora só pode começar quando a predecessora começar',
      exemplo: 'Tarefas paralelas',
    },
    [TipoDependencia.FF]: {
      nome: 'Finish-to-Finish (FF)',
      descricao: 'A sucessora só pode terminar quando a predecessora terminar',
      exemplo: 'Sincronizar conclusões',
    },
    [TipoDependencia.SF]: {
      nome: 'Start-to-Finish (SF)',
      descricao: 'A sucessora só pode terminar quando a predecessora começar',
      exemplo: 'Raro - Transições',
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nova Dependência</h2>
            <p className="text-sm text-gray-500 mt-1">
              Crie uma relação de dependência entre duas atividades
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Atividade Predecessora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atividade Predecessora <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              A atividade que deve ser concluída (ou iniciada) primeiro
            </p>
            <select
              value={formData.atividade_origem_id}
              onChange={(e) => setFormData({ ...formData, atividade_origem_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.atividade_origem_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione uma atividade...</option>
              {atividades.map((ativ) => (
                <option key={ativ.id} value={ativ.id}>
                  {ativ.codigo ? `${ativ.codigo} - ` : ''}{ativ.nome}
                </option>
              ))}
            </select>
            {errors.atividade_origem_id && (
              <p className="text-red-500 text-xs mt-1">{errors.atividade_origem_id}</p>
            )}
          </div>

          {/* Tipo de Dependência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Dependência <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {Object.values(TipoDependencia).map((tipo) => {
                const info = tiposInfo[tipo];
                return (
                  <label
                    key={tipo}
                    className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                      formData.tipo === tipo
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={tipo}
                      checked={formData.tipo === tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoDependencia })}
                      className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{info.nome}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {tipo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{info.descricao}</p>
                      <p className="text-xs text-gray-500 mt-1 italic">Exemplo: {info.exemplo}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Atividade Sucessora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Atividade Sucessora <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-2">
              A atividade que depende da predecessora
            </p>
            <select
              value={formData.atividade_destino_id}
              onChange={(e) => setFormData({ ...formData, atividade_destino_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.atividade_destino_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Selecione uma atividade...</option>
              {atividades
                .filter((ativ) => ativ.id !== formData.atividade_origem_id)
                .map((ativ) => (
                  <option key={ativ.id} value={ativ.id}>
                    {ativ.codigo ? `${ativ.codigo} - ` : ''}{ativ.nome}
                  </option>
                ))}
            </select>
            {errors.atividade_destino_id && (
              <p className="text-red-500 text-xs mt-1">{errors.atividade_destino_id}</p>
            )}
          </div>

          {/* Lag (Atraso/Antecipação) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lag (Atraso/Antecipação em dias)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Positivo = atraso | Negativo = antecipação | 0 = imediato
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={formData.lag_dias}
                onChange={(e) => setFormData({ ...formData, lag_dias: parseInt(e.target.value) || 0 })}
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                {formData.lag_dias > 0 && `Atraso de ${formData.lag_dias} dia(s)`}
                {formData.lag_dias < 0 && `Antecipação de ${Math.abs(formData.lag_dias)} dia(s)`}
                {formData.lag_dias === 0 && 'Sem atraso/antecipação'}
              </span>
            </div>
          </div>

          {/* Visualização da Dependência */}
          {formData.atividade_origem_id && formData.atividade_destino_id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Visualização:</h4>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 bg-white border border-blue-300 rounded px-3 py-2">
                  {atividades.find((a) => a.id === formData.atividade_origem_id)?.nome}
                </div>
                <div className="flex flex-col items-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  <span className="text-xs font-mono text-blue-700 mt-1">{formData.tipo}</span>
                </div>
                <div className="flex-1 bg-white border border-blue-300 rounded px-3 py-2">
                  {atividades.find((a) => a.id === formData.atividade_destino_id)?.nome}
                </div>
              </div>
            </div>
          )}

          {/* Erro de submit */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
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
              <span>Criar Dependência</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

