/**
 * Modal para criar/editar atividades
 */

import React, { useState, useEffect } from 'react';
import { AtividadeMock } from '../../../types/cronograma';
import { useCronogramaStore } from '../../../stores/cronogramaStore';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  atividadeId: string | null;
  projetoId: string;
  onSave: (dados: Partial<AtividadeMock>) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  open,
  onClose,
  atividadeId,
  projetoId: _projetoId,
  onSave,
}) => {
  const atividades = useCronogramaStore((state) => state.atividades);
  const calendarios = useCronogramaStore((state) => state.calendarios);
  const calendario_padrao = useCronogramaStore((state) => state.calendario_padrao);
  const atividade = atividadeId ? atividades.find((a) => a.id === atividadeId) : null;

  const [formData, setFormData] = useState({
    codigo: '',
    edt: '',
    nome: '',
    descricao: '',
    tipo: 'Tarefa' as 'Tarefa' | 'Marco' | 'Fase',
    data_inicio: '',
    data_fim: '',
    duracao_dias: 1,
    progresso: 0,
    status: 'Não Iniciada',
    responsavel_nome: '',
    prioridade: 'Média',
    parent_id: '',
    calendario_id: calendario_padrao || 'cal-padrao-5x8',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carrega dados da atividade ao editar
  useEffect(() => {
    if (atividade) {
      setFormData({
        codigo: atividade.codigo || '',
        edt: atividade.edt || '',
        nome: atividade.nome,
        descricao: atividade.descricao || '',
        tipo: atividade.tipo as any,
        data_inicio: atividade.data_inicio,
        data_fim: atividade.data_fim,
        duracao_dias: atividade.duracao_dias,
        progresso: atividade.progresso,
        status: atividade.status,
        responsavel_nome: atividade.responsavel_nome || '',
        prioridade: atividade.prioridade || 'Média',
        parent_id: atividade.parent_id || '',
        calendario_id: atividade.calendario_id || calendario_padrao || 'cal-padrao-5x8',
      });
    } else {
      // Reset para nova atividade
      const hoje = new Date().toISOString().split('T')[0];
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      setFormData({
        codigo: '',
        edt: '',
        nome: '',
        descricao: '',
        tipo: 'Tarefa',
        data_inicio: hoje,
        data_fim: amanha.toISOString().split('T')[0],
        duracao_dias: 1,
        progresso: 0,
        status: 'Não Iniciada',
        responsavel_nome: '',
        prioridade: 'Média',
        parent_id: '',
        calendario_id: calendario_padrao || 'cal-padrao-5x8',
      });
    }
    setErrors({});
  }, [atividade, open, calendario_padrao]);

  // Calcula duração automaticamente ao mudar datas
  useEffect(() => {
    if (formData.data_inicio && formData.data_fim) {
      const inicio = new Date(formData.data_inicio);
      const fim = new Date(formData.data_fim);
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({ ...prev, duracao_dias: diffDays }));
    }
  }, [formData.data_inicio, formData.data_fim]);

  // Validações
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.data_inicio) {
      newErrors.data_inicio = 'Data de início é obrigatória';
    }

    if (!formData.data_fim) {
      newErrors.data_fim = 'Data de fim é obrigatória';
    }

    if (formData.data_inicio && formData.data_fim) {
      const inicio = new Date(formData.data_inicio);
      const fim = new Date(formData.data_fim);
      if (fim < inicio) {
        newErrors.data_fim = 'Data de fim deve ser após data de início';
      }
    }

    if (formData.progresso < 0 || formData.progresso > 100) {
      newErrors.progresso = 'Progresso deve estar entre 0 e 100';
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
        ...formData,
        parent_id: formData.parent_id || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErrors({ submit: 'Erro ao salvar atividade. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {atividadeId ? 'Editar Atividade' : 'Nova Atividade'}
          </h2>
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
          {/* Código, EDT e Tipo */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="A001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EDT / WBS
              </label>
              <input
                type="text"
                value={formData.edt}
                onChange={(e) => setFormData({ ...formData, edt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1.2.3"
                title="Estrutura de Decomposição do Trabalho"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Tarefa">Tarefa</option>
                <option value="Marco">Marco</option>
                <option value="Fase">Fase</option>
              </select>
            </div>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nome da atividade"
            />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrição detalhada da atividade"
            />
          </div>

          {/* Hierarquia e Calendário */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Atividade Mãe (Hierarquia)
              </label>
              <select
                value={formData.parent_id}
                onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sem atividade mãe (nível raiz)</option>
                {atividades
                  .filter((a) => a.id !== atividadeId)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.codigo ? `${a.codigo} - ` : '') + a.nome}
                    </option>
                  ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Defina a hierarquia do cronograma
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calendário do Trabalho
              </label>
              <select
                value={formData.calendario_id}
                onChange={(e) => setFormData({ ...formData, calendario_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {calendarios.map((cal) => (
                  <option key={cal.id} value={cal.id}>
                    {cal.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Define dias e horários de trabalho
              </p>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.data_inicio ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.data_inicio && <p className="text-red-500 text-xs mt-1">{errors.data_inicio}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.data_fim ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.data_fim && <p className="text-red-500 text-xs mt-1">{errors.data_fim}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duração (dias)
              </label>
              <input
                type="number"
                value={formData.duracao_dias}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>
          </div>

          {/* Status, Progresso e Prioridade */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Não Iniciada</option>
                <option>Em Andamento</option>
                <option>Concluída</option>
                <option>Paralisada</option>
                <option>Atrasada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Progresso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.progresso}
                onChange={(e) => setFormData({ ...formData, progresso: parseInt(e.target.value) || 0 })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.progresso ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.progresso && <p className="text-red-500 text-xs mt-1">{errors.progresso}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                value={formData.prioridade}
                onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Baixa</option>
                <option>Média</option>
                <option>Alta</option>
                <option>Crítica</option>
              </select>
            </div>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsável
            </label>
            <input
              type="text"
              value={formData.responsavel_nome}
              onChange={(e) => setFormData({ ...formData, responsavel_nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do responsável"
            />
          </div>

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
              <span>{atividadeId ? 'Salvar Alterações' : 'Criar Atividade'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

