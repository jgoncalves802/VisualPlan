/**
 * Modal para gerenciar calendários do projeto
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Check } from 'lucide-react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { CalendarioProjeto, DiaTrabalho } from '../../../types/cronograma';

interface CalendariosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalendariosModal: React.FC<CalendariosModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    calendarios,
    calendario_padrao,
    adicionarCalendario,
    atualizarCalendario,
    removerCalendario,
    setCalendarioPadrao,
  } = useCronogramaStore();

  const [selectedCalendarioId, setSelectedCalendarioId] = useState<string | null>(null);
  const [modoEdicao, setModoEdicao] = useState<'lista' | 'criar' | 'editar'>('lista');
  const [formData, setFormData] = useState<Partial<CalendarioProjeto>>({});

  if (!isOpen) return null;

  const calendarioSelecionado = selectedCalendarioId
    ? calendarios.find((c) => c.id === selectedCalendarioId)
    : null;

  const diasSemana = [
    { value: DiaTrabalho.DOMINGO, label: 'Domingo' },
    { value: DiaTrabalho.SEGUNDA, label: 'Segunda' },
    { value: DiaTrabalho.TERCA, label: 'Terça' },
    { value: DiaTrabalho.QUARTA, label: 'Quarta' },
    { value: DiaTrabalho.QUINTA, label: 'Quinta' },
    { value: DiaTrabalho.SEXTA, label: 'Sexta' },
    { value: DiaTrabalho.SABADO, label: 'Sábado' },
  ];

  const handleNovoCalendario = () => {
    setFormData({
      nome: '',
      descricao: '',
      dias_trabalho: [
        DiaTrabalho.SEGUNDA,
        DiaTrabalho.TERCA,
        DiaTrabalho.QUARTA,
        DiaTrabalho.QUINTA,
        DiaTrabalho.SEXTA,
      ],
      horas_por_dia: 8,
      horario_inicio: '08:00',
      horario_almoco_inicio: '12:00',
      horario_almoco_fim: '13:00',
      horario_fim: '17:00',
      feriados: [],
      is_padrao: false,
    });
    setModoEdicao('criar');
  };

  const handleEditarCalendario = (calendario: CalendarioProjeto) => {
    setFormData(calendario);
    setSelectedCalendarioId(calendario.id);
    setModoEdicao('editar');
  };

  const handleSalvar = () => {
    if (!formData.nome || !formData.dias_trabalho || formData.dias_trabalho.length === 0) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (modoEdicao === 'criar') {
      adicionarCalendario(formData as Omit<CalendarioProjeto, 'id'>);
    } else if (modoEdicao === 'editar' && selectedCalendarioId) {
      atualizarCalendario(selectedCalendarioId, formData);
    }

    setModoEdicao('lista');
    setFormData({});
    setSelectedCalendarioId(null);
  };

  const handleRemover = (id: string) => {
    if (confirm('Deseja realmente remover este calendário?')) {
      try {
        removerCalendario(id);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao remover calendário');
      }
    }
  };

  const handleToggleDia = (dia: DiaTrabalho) => {
    const diasAtuais = formData.dias_trabalho || [];
    const jaExiste = diasAtuais.includes(dia);

    setFormData({
      ...formData,
      dias_trabalho: jaExiste
        ? diasAtuais.filter((d) => d !== dia)
        : [...diasAtuais, dia],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Calendários do Projeto</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {modoEdicao === 'lista' ? (
            <div className="space-y-4">
              {/* Botão Novo Calendário */}
              <button
                onClick={handleNovoCalendario}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Novo Calendário
              </button>

              {/* Lista de Calendários */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {calendarios.map((calendario) => (
                  <div
                    key={calendario.id}
                    className={`p-4 border-2 rounded-lg ${
                      calendario_padrao === calendario.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    } hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {calendario.nome}
                          {calendario.is_padrao && (
                            <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              Sistema
                            </span>
                          )}
                          {calendario_padrao === calendario.id && (
                            <span className="ml-2 text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                              Padrão
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{calendario.descricao}</p>
                      </div>
                      {!calendario.is_padrao && (
                        <button
                          onClick={() => handleRemover(calendario.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>
                          {calendario.horas_por_dia}h/dia ({calendario.horario_inicio} - {calendario.horario_fim})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {diasSemana.map((dia) => (
                          <span
                            key={dia.value}
                            className={`px-2 py-1 rounded text-xs ${
                              calendario.dias_trabalho.includes(dia.value)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {dia.label.substring(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {calendario_padrao !== calendario.id && (
                        <button
                          onClick={() => setCalendarioPadrao(calendario.id)}
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                        >
                          Definir como Padrão
                        </button>
                      )}
                      <button
                        onClick={() => handleEditarCalendario(calendario)}
                        className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Formulário de Criar/Editar
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Calendário *
                </label>
                <input
                  type="text"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Padrão 5x8"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descreva o calendário..."
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias de Trabalho *
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.value}
                      onClick={() => handleToggleDia(dia.value)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        formData.dias_trabalho?.includes(dia.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas por Dia *
                  </label>
                  <input
                    type="number"
                    value={formData.horas_por_dia || 8}
                    onChange={(e) =>
                      setFormData({ ...formData, horas_por_dia: parseInt(e.target.value) })
                    }
                    min="1"
                    max="24"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário de Início *
                  </label>
                  <input
                    type="time"
                    value={formData.horario_inicio || '08:00'}
                    onChange={(e) =>
                      setFormData({ ...formData, horario_inicio: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Início do Almoço
                  </label>
                  <input
                    type="time"
                    value={formData.horario_almoco_inicio || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, horario_almoco_inicio: e.target.value || undefined })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fim do Almoço
                  </label>
                  <input
                    type="time"
                    value={formData.horario_almoco_fim || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, horario_almoco_fim: e.target.value || undefined })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Fim *
                </label>
                <input
                  type="time"
                  value={formData.horario_fim || '17:00'}
                  onChange={(e) =>
                    setFormData({ ...formData, horario_fim: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setModoEdicao('lista');
                    setFormData({});
                    setSelectedCalendarioId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Salvar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer com informações */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Calendário Padrão:</strong>{' '}
            {calendarios.find((c) => c.id === calendario_padrao)?.nome || 'Nenhum'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            O calendário padrão será aplicado automaticamente a novas atividades.
          </p>
        </div>
      </div>
    </div>
  );
};

