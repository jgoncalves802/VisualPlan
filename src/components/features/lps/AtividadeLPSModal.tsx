import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { AtividadeLPS, StatusAtividadeLPS, TipoAtividadeLPS } from '../../../types/lps';
import { parseDateOnly, formatDateOnlyRequired } from '../../../utils/dateHelpers';

interface AtividadeLPSModalProps {
  atividade: AtividadeLPS | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AtividadeLPS>) => void;
}

export const AtividadeLPSModal: React.FC<AtividadeLPSModalProps> = ({
  atividade,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    responsavel: '',
    data_inicio: '',
    data_fim: '',
    status: StatusAtividadeLPS.PLANEJADA as StatusAtividadeLPS,
    tipo: TipoAtividadeLPS.NORMAL as TipoAtividadeLPS,
  });

  useEffect(() => {
    if (atividade) {
      let dataInicio = '';
      if (atividade.data_inicio) {
        if (typeof atividade.data_inicio === 'string') {
          dataInicio = atividade.data_inicio.split('T')[0];
        } else if (atividade.data_inicio instanceof Date) {
          dataInicio = formatDateOnlyRequired(atividade.data_inicio);
        }
      }
      let dataFim = '';
      if (atividade.data_fim) {
        if (typeof atividade.data_fim === 'string') {
          dataFim = atividade.data_fim.split('T')[0];
        } else if (atividade.data_fim instanceof Date) {
          dataFim = formatDateOnlyRequired(atividade.data_fim);
        }
      }
      setFormData({
        nome: atividade.nome || '',
        descricao: atividade.descricao || '',
        responsavel: atividade.responsavel || '',
        data_inicio: dataInicio,
        data_fim: dataFim,
        status: atividade.status || StatusAtividadeLPS.PLANEJADA,
        tipo: atividade.tipo || TipoAtividadeLPS.NORMAL,
      });
    }
  }, [atividade]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      data_inicio: formData.data_inicio ? parseDateOnly(formData.data_inicio) ?? undefined : undefined,
      data_fim: formData.data_fim ? parseDateOnly(formData.data_fim) ?? undefined : undefined,
    });
  };

  const statusOptions = [
    { value: StatusAtividadeLPS.PLANEJADA, label: 'Planejada' },
    { value: StatusAtividadeLPS.EM_ANDAMENTO, label: 'Em Andamento' },
    { value: StatusAtividadeLPS.CONCLUIDA, label: 'Concluída' },
    { value: StatusAtividadeLPS.BLOQUEADA, label: 'Bloqueada' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {atividade ? 'Editar Atividade LPS' : 'Nova Atividade LPS'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Atividade
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={14} className="inline mr-1" />
                Responsável
              </label>
              <input
                type="text"
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as StatusAtividadeLPS })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={14} className="inline mr-1" />
                Data Início
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={14} className="inline mr-1" />
                Data Fim
              </label>
              <input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.tipo === TipoAtividadeLPS.CRITICA}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.checked ? TipoAtividadeLPS.CRITICA : TipoAtividadeLPS.NORMAL })}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <AlertCircle size={14} className="text-red-500" />
                Atividade Crítica
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
