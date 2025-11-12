/**
 * Modal para gerenciar exceções de calendário (Feriados, Dias Especiais, Horas Extras)
 * Baseado no MS Project e Primavera P6
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Check, AlertCircle, RefreshCw, Copy } from 'lucide-react';
import { ExcecaoCalendario, TipoExcecao, PadraoRecorrencia, PeriodoTrabalho } from '../../../types/cronograma';

interface ExcecoesModalProps {
  open: boolean;
  onClose: () => void;
  excecoes: ExcecaoCalendario[];
  onSalvar: (excecoes: ExcecaoCalendario[]) => void;
  calendarioNome: string;
}

export const ExcecoesModal: React.FC<ExcecoesModalProps> = ({
  open,
  onClose,
  excecoes,
  onSalvar,
  calendarioNome,
}) => {
  const [excecoesEditadas, setExcecoesEditadas] = useState<ExcecaoCalendario[]>(excecoes);
  const [modoEdicao, setModoEdicao] = useState<'lista' | 'criar' | 'editar'>('lista');
  const [excecaoAtual, setExcecaoAtual] = useState<Partial<ExcecaoCalendario> | null>(null);
  const [excecaoEditandoId, setExcecaoEditandoId] = useState<string | null>(null);

  if (!open) return null;

  const tiposExcecao = [
    { value: TipoExcecao.FERIADO, label: 'Feriado', icon: '🎄', cor: 'red' },
    { value: TipoExcecao.DIA_NAO_UTIL, label: 'Dia Não Útil (Folga)', icon: '🏖️', cor: 'orange' },
    { value: TipoExcecao.TRABALHO_PERSONALIZADO, label: 'Trabalho Personalizado', icon: '📋', cor: 'blue' },
    { value: TipoExcecao.HORA_EXTRA, label: 'Hora Extra', icon: '⏰', cor: 'green' },
  ];

  const padraoRecorrencia = [
    { value: PadraoRecorrencia.UNICO, label: 'Único (não repete)' },
    { value: PadraoRecorrencia.DIARIAMENTE, label: 'Diariamente' },
    { value: PadraoRecorrencia.SEMANALMENTE, label: 'Semanalmente' },
    { value: PadraoRecorrencia.MENSALMENTE, label: 'Mensalmente' },
    { value: PadraoRecorrencia.ANUALMENTE, label: 'Anualmente' },
  ];

  const gerarId = () => `exc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleNovaExcecao = () => {
    setExcecaoAtual({
      nome: '',
      tipo: TipoExcecao.FERIADO,
      data_inicio: '',
      recorrencia: PadraoRecorrencia.UNICO,
      trabalhando: false,
      periodos: [],
    });
    setModoEdicao('criar');
    setExcecaoEditandoId(null);
  };

  const handleEditarExcecao = (excecao: ExcecaoCalendario) => {
    setExcecaoAtual({ ...excecao });
    setExcecaoEditandoId(excecao.id);
    setModoEdicao('editar');
  };

  const handleCopiarExcecao = (excecao: ExcecaoCalendario) => {
    setExcecaoAtual({
      ...excecao,
      nome: `Cópia de ${excecao.nome}`,
      data_inicio: '',
    });
    setExcecaoEditandoId(null);
    setModoEdicao('criar');
  };

  const handleSalvarExcecao = () => {
    if (!excecaoAtual?.nome || !excecaoAtual?.data_inicio) {
      alert('Preencha o nome e a data de início');
      return;
    }

    if (excecaoAtual.trabalhando && (!excecaoAtual.periodos || excecaoAtual.periodos.length === 0)) {
      alert('Adicione ao menos um período de trabalho');
      return;
    }

    const excecaoCompleta: ExcecaoCalendario = {
      id: excecaoEditandoId || gerarId(),
      nome: excecaoAtual.nome,
      tipo: excecaoAtual.tipo || TipoExcecao.FERIADO,
      data_inicio: excecaoAtual.data_inicio,
      data_fim: excecaoAtual.data_fim,
      recorrencia: excecaoAtual.recorrencia || PadraoRecorrencia.UNICO,
      intervalo_recorrencia: excecaoAtual.intervalo_recorrencia,
      termina_apos: excecaoAtual.termina_apos,
      trabalhando: excecaoAtual.trabalhando || false,
      periodos: excecaoAtual.periodos || [],
      observacoes: excecaoAtual.observacoes,
    };

    if (excecaoEditandoId) {
      // Editando
      setExcecoesEditadas(excecoesEditadas.map(e => e.id === excecaoEditandoId ? excecaoCompleta : e));
    } else {
      // Criando
      setExcecoesEditadas([...excecoesEditadas, excecaoCompleta]);
    }

    setModoEdicao('lista');
    setExcecaoAtual(null);
    setExcecaoEditandoId(null);
  };

  const handleRemoverExcecao = (id: string) => {
    if (confirm('Deseja realmente remover esta exceção?')) {
      setExcecoesEditadas(excecoesEditadas.filter(e => e.id !== id));
    }
  };

  const handleAdicionarPeriodo = () => {
    if (!excecaoAtual) return;
    
    const ultimoPeriodo = excecaoAtual.periodos && excecaoAtual.periodos.length > 0
      ? excecaoAtual.periodos[excecaoAtual.periodos.length - 1]
      : null;
    
    const novoPeriodo: PeriodoTrabalho = {
      inicio: ultimoPeriodo ? ultimoPeriodo.fim : '08:00',
      fim: '18:00',
    };

    setExcecaoAtual({
      ...excecaoAtual,
      periodos: [...(excecaoAtual.periodos || []), novoPeriodo],
    });
  };

  const handleRemoverPeriodo = (index: number) => {
    if (!excecaoAtual) return;
    
    setExcecaoAtual({
      ...excecaoAtual,
      periodos: excecaoAtual.periodos?.filter((_, i) => i !== index),
    });
  };

  const handleAtualizarPeriodo = (index: number, campo: 'inicio' | 'fim', valor: string) => {
    if (!excecaoAtual) return;
    
    const novosPeriodos = [...(excecaoAtual.periodos || [])];
    novosPeriodos[index] = { ...novosPeriodos[index], [campo]: valor };
    
    setExcecaoAtual({
      ...excecaoAtual,
      periodos: novosPeriodos,
    });
  };

  const calcularHorasTotais = (periodos?: PeriodoTrabalho[]): string => {
    if (!periodos || periodos.length === 0) return '0h';
    
    let totalMinutos = 0;
    periodos.forEach(periodo => {
      const [hi, mi] = periodo.inicio.split(':').map(Number);
      const [hf, mf] = periodo.fim.split(':').map(Number);
      const inicio = hi * 60 + mi;
      const fim = hf * 60 + mf;
      totalMinutos += (fim - inicio);
    });
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return minutos > 0 ? `${horas}h${minutos}min` : `${horas}h`;
  };

  const formatarData = (dataISO: string): string => {
    if (!dataISO) return '';
    return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getTipoExcecaoConfig = (tipo: TipoExcecao) => {
    return tiposExcecao.find(t => t.value === tipo) || tiposExcecao[0];
  };

  const handleConfirmarTudo = () => {
    onSalvar(excecoesEditadas);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Exceções (Feriados e Dias Especiais)</h2>
              <p className="text-sm text-purple-100 mt-1">Calendário: {calendarioNome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {modoEdicao === 'lista' ? (
            // Lista de Exceções
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Lista de Exceções</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Defina dias que não seguem o padrão semanal (feriados, folgas, horas extras)
                  </p>
                </div>
                <button
                  onClick={handleNovaExcecao}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Nova Exceção
                </button>
              </div>

              {excecoesEditadas.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium mb-2">Nenhuma exceção cadastrada</p>
                  <p className="text-sm text-gray-500">Clique em "Nova Exceção" para adicionar feriados ou dias especiais</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {excecoesEditadas
                    .sort((a, b) => a.data_inicio.localeCompare(b.data_inicio))
                    .map(excecao => {
                      const tipoConfig = getTipoExcecaoConfig(excecao.tipo);
                      return (
                        <div
                          key={excecao.id}
                          className={`p-4 border-2 rounded-lg bg-white hover:shadow-md transition-shadow border-${tipoConfig.cor}-200`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{tipoConfig.icon}</span>
                                <h4 className="text-lg font-semibold text-gray-900">{excecao.nome}</h4>
                                <span className={`text-xs px-2 py-1 rounded bg-${tipoConfig.cor}-100 text-${tipoConfig.cor}-700`}>
                                  {tipoConfig.label}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                <div>
                                  <span className="font-medium">Data:</span>{' '}
                                  {formatarData(excecao.data_inicio)}
                                  {excecao.data_fim && ` até ${formatarData(excecao.data_fim)}`}
                                </div>
                                <div>
                                  <span className="font-medium">Recorrência:</span>{' '}
                                  {padraoRecorrencia.find(p => p.value === excecao.recorrencia)?.label}
                                </div>
                                <div>
                                  <span className="font-medium">Status:</span>{' '}
                                  {excecao.trabalhando ? (
                                    <span className="text-green-700">✓ Trabalhando ({calcularHorasTotais(excecao.periodos)})</span>
                                  ) : (
                                    <span className="text-red-700">✗ Não trabalhando</span>
                                  )}
                                </div>
                                {excecao.observacoes && (
                                  <div className="col-span-2">
                                    <span className="font-medium">Obs:</span> {excecao.observacoes}
                                  </div>
                                )}
                              </div>

                              {excecao.trabalhando && excecao.periodos && excecao.periodos.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {excecao.periodos.map((periodo, idx) => (
                                    <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                      {periodo.inicio} - {periodo.fim}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleCopiarExcecao(excecao)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Copiar"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditarExcecao(excecao)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Clock className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoverExcecao(excecao.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            // Formulário de Criar/Editar
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  {modoEdicao === 'criar' ? 'Nova Exceção' : 'Editar Exceção'}
                </h3>
                <p className="text-sm text-purple-700">
                  Configure um dia que não segue o padrão semanal do calendário
                </p>
              </div>

              {/* Tipo de Exceção */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Tipo de Exceção: *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {tiposExcecao.map(tipo => (
                    <button
                      key={tipo.value}
                      onClick={() => setExcecaoAtual({
                        ...excecaoAtual,
                        tipo: tipo.value,
                        trabalhando: tipo.value === TipoExcecao.TRABALHO_PERSONALIZADO || tipo.value === TipoExcecao.HORA_EXTRA,
                        periodos: (tipo.value === TipoExcecao.TRABALHO_PERSONALIZADO || tipo.value === TipoExcecao.HORA_EXTRA)
                          ? [{ inicio: '08:00', fim: '17:00' }]
                          : [],
                      })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        excecaoAtual?.tipo === tipo.value
                          ? `border-${tipo.cor}-500 bg-${tipo.cor}-50`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{tipo.icon}</div>
                      <div className="text-sm font-medium text-gray-900">{tipo.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome: *
                </label>
                <input
                  type="text"
                  value={excecaoAtual?.nome || ''}
                  onChange={(e) => setExcecaoAtual({ ...excecaoAtual, nome: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ex: Natal, Concretagem - Hora Extra, etc."
                />
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Início: *
                  </label>
                  <input
                    type="date"
                    value={excecaoAtual?.data_inicio || ''}
                    onChange={(e) => setExcecaoAtual({ ...excecaoAtual, data_inicio: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Data de Fim: (opcional)
                  </label>
                  <input
                    type="date"
                    value={excecaoAtual?.data_fim || ''}
                    onChange={(e) => setExcecaoAtual({ ...excecaoAtual, data_fim: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Para exceções de múltiplos dias consecutivos</p>
                </div>
              </div>

              {/* Recorrência */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Padrão de Recorrência</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repete:
                    </label>
                    <select
                      value={excecaoAtual?.recorrencia || PadraoRecorrencia.UNICO}
                      onChange={(e) => setExcecaoAtual({ ...excecaoAtual, recorrencia: e.target.value as PadraoRecorrencia })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {padraoRecorrencia.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {excecaoAtual?.recorrencia !== PadraoRecorrencia.UNICO && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          A cada: (intervalo)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={excecaoAtual?.intervalo_recorrencia || 1}
                          onChange={(e) => setExcecaoAtual({ ...excecaoAtual, intervalo_recorrencia: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Ex: a cada 2 semanas</p>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Termina após: (opcional)
                        </label>
                        <input
                          type="date"
                          value={excecaoAtual?.termina_apos || ''}
                          onChange={(e) => setExcecaoAtual({ ...excecaoAtual, termina_apos: e.target.value || undefined })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Deixe em branco para recorrência infinita</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Períodos de Trabalho */}
              {excecaoAtual?.trabalhando && (
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Períodos de Trabalho</h4>
                    </div>
                    <div className="text-sm font-medium text-green-700">
                      Total: {calcularHorasTotais(excecaoAtual.periodos)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {excecaoAtual.periodos && excecaoAtual.periodos.length > 0 ? (
                      excecaoAtual.periodos.map((periodo, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-2 rounded-lg">
                          <span className="text-sm text-gray-600 w-16">De:</span>
                          <input
                            type="time"
                            value={periodo.inicio}
                            onChange={(e) => handleAtualizarPeriodo(index, 'inicio', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                          <span className="text-sm text-gray-600">Até:</span>
                          <input
                            type="time"
                            value={periodo.fim}
                            onChange={(e) => handleAtualizarPeriodo(index, 'fim', e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                          <button
                            onClick={() => handleRemoverPeriodo(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 text-center py-2">Nenhum período definido</p>
                    )}
                  </div>

                  <button
                    onClick={handleAdicionarPeriodo}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Período
                  </button>
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações: (opcional)
                </label>
                <textarea
                  value={excecaoAtual?.observacoes || ''}
                  onChange={(e) => setExcecaoAtual({ ...excecaoAtual, observacoes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Notas adicionais sobre esta exceção..."
                  rows={3}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setModoEdicao('lista');
                    setExcecaoAtual(null);
                    setExcecaoEditandoId(null);
                  }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarExcecao}
                  className="ml-auto px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Salvar Exceção
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <strong>{excecoesEditadas.length}</strong> exceção(ões) cadastrada(s)
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmarTudo}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <Check className="w-5 h-5" />
              Confirmar e Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

