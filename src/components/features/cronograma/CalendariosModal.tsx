/**
 * Modal para gerenciar calendários do projeto
 * Baseado no MS Project - Alteração de Período de Trabalho
 */

import React, { useState } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Check, Copy, AlertCircle } from 'lucide-react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { CalendarioProjeto, DiaTrabalho, ExcecaoCalendario } from '../../../types/cronograma';
import { ExcecoesModal } from './ExcecoesModal';

interface CalendariosModalProps {
  open: boolean;
  onClose: () => void;
}

// Tipo para períodos de trabalho de um dia específico
interface PeriodoTrabalho {
  inicio: string;
  fim: string;
}

// Estado para definir períodos por dia da semana
interface PeriodosDiaSemana {
  [key: string]: {
    trabalhando: boolean;
    periodos: PeriodoTrabalho[];
  };
}

export const CalendariosModal: React.FC<CalendariosModalProps> = ({
  open,
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

  const [calendarioSelecionadoId, setCalendarioSelecionadoId] = useState<string | null>(
    calendario_padrao || (calendarios.length > 0 ? calendarios[0].id : null)
  );
  const [modoEdicao, setModoEdicao] = useState<'visualizar' | 'editar'>('visualizar');
  const [nomeCalendario, setNomeCalendario] = useState('');
  const [baseadoEm, setBaseadoEm] = useState<string>('');
  
  // Estado para períodos de trabalho por dia da semana
  const [periodosSemana, setPeriodosSemana] = useState<PeriodosDiaSemana>({
    [DiaTrabalho.DOMINGO]: { trabalhando: false, periodos: [] },
    [DiaTrabalho.SEGUNDA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
    [DiaTrabalho.TERCA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
    [DiaTrabalho.QUARTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
    [DiaTrabalho.QUINTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
    [DiaTrabalho.SEXTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
    [DiaTrabalho.SABADO]: { trabalhando: false, periodos: [] },
  });

  // Exceções (feriados e dias especiais) - agora usa o ExcecoesModal
  const [excecoes, setExcecoes] = useState<ExcecaoCalendario[]>([]);
  const [showExcecoesModal, setShowExcecoesModal] = useState(false);

  if (!open) return null;

  const calendarioSelecionado = calendarioSelecionadoId
    ? calendarios.find((c) => c.id === calendarioSelecionadoId)
    : null;

  const diasSemana = [
    { value: DiaTrabalho.DOMINGO, label: 'Domingo', abrev: 'D' },
    { value: DiaTrabalho.SEGUNDA, label: 'Segunda-feira', abrev: 'S' },
    { value: DiaTrabalho.TERCA, label: 'Terça-feira', abrev: 'T' },
    { value: DiaTrabalho.QUARTA, label: 'Quarta-feira', abrev: 'Q' },
    { value: DiaTrabalho.QUINTA, label: 'Quinta-feira', abrev: 'Q' },
    { value: DiaTrabalho.SEXTA, label: 'Sexta-feira', abrev: 'S' },
    { value: DiaTrabalho.SABADO, label: 'Sábado', abrev: 'S' },
  ];

  const handleNovoCalendario = () => {
    setModoEdicao('editar');
    setNomeCalendario('');
    setBaseadoEm('');
    setCalendarioSelecionadoId(null);
    
    // Reset períodos para padrão 5x8
    setPeriodosSemana({
      [DiaTrabalho.DOMINGO]: { trabalhando: false, periodos: [] },
      [DiaTrabalho.SEGUNDA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
      [DiaTrabalho.TERCA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
      [DiaTrabalho.QUARTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
      [DiaTrabalho.QUINTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
      [DiaTrabalho.SEXTA]: { trabalhando: true, periodos: [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }] },
      [DiaTrabalho.SABADO]: { trabalhando: false, periodos: [] },
    });
    setExcecoes([]);
  };

  const handleEditarCalendario = () => {
    if (!calendarioSelecionado) return;
    
    setModoEdicao('editar');
    setNomeCalendario(calendarioSelecionado.nome);
    
    // Carregar períodos do calendário selecionado
    const novosPeriodos: PeriodosDiaSemana = {};
    diasSemana.forEach(dia => {
      const trabalhando = calendarioSelecionado.dias_trabalho.includes(dia.value);
      novosPeriodos[dia.value] = {
        trabalhando,
        periodos: trabalhando ? [
          { inicio: calendarioSelecionado.horario_inicio, fim: calendarioSelecionado.horario_almoco_inicio || calendarioSelecionado.horario_fim },
          ...(calendarioSelecionado.horario_almoco_fim ? [{ inicio: calendarioSelecionado.horario_almoco_fim, fim: calendarioSelecionado.horario_fim }] : [])
        ] : []
      };
    });
    setPeriodosSemana(novosPeriodos);
    
    // Carregar exceções
    setExcecoes(calendarioSelecionado.excecoes || []);
  };

  const handleCopiarCalendario = () => {
    if (!calendarioSelecionado) return;
    
    setModoEdicao('editar');
    setNomeCalendario(`Cópia de ${calendarioSelecionado.nome}`);
    setBaseadoEm(calendarioSelecionado.id);
    setCalendarioSelecionadoId(null);
    
    // Copiar todos os períodos e exceções
    const novosPeriodos: PeriodosDiaSemana = {};
    diasSemana.forEach(dia => {
      const trabalhando = calendarioSelecionado.dias_trabalho.includes(dia.value);
      novosPeriodos[dia.value] = {
        trabalhando,
        periodos: trabalhando ? [
          { inicio: calendarioSelecionado.horario_inicio, fim: calendarioSelecionado.horario_almoco_inicio || calendarioSelecionado.horario_fim },
          ...(calendarioSelecionado.horario_almoco_fim ? [{ inicio: calendarioSelecionado.horario_almoco_fim, fim: calendarioSelecionado.horario_fim }] : [])
        ] : []
      };
    });
    setPeriodosSemana(novosPeriodos);
    
    // Copiar exceções
    setExcecoes(calendarioSelecionado.excecoes || []);
  };

  const handleSalvar = () => {
    if (!nomeCalendario.trim()) {
      alert('Digite um nome para o calendário');
      return;
    }

    // Calcular dias de trabalho
    const diasTrabalho = Object.entries(periodosSemana)
      .filter(([_, config]) => config.trabalhando)
      .map(([dia, _]) => dia as DiaTrabalho);

    if (diasTrabalho.length === 0) {
      alert('Selecione ao menos um dia de trabalho');
      return;
    }

    // Calcular horários (pegar primeiro período do primeiro dia útil)
    const primeiroDiaUtil = diasTrabalho[0];
    const periodoPrimeiro = periodosSemana[primeiroDiaUtil].periodos[0];
    
    // Calcular total de horas
    let totalHoras = 0;
    periodosSemana[primeiroDiaUtil].periodos.forEach(periodo => {
      const [hi, mi] = periodo.inicio.split(':').map(Number);
      const [hf, mf] = periodo.fim.split(':').map(Number);
      const inicio = hi * 60 + mi;
      const fim = hf * 60 + mf;
      totalHoras += (fim - inicio) / 60;
    });

    const novoCalendario: Omit<CalendarioProjeto, 'id'> = {
      nome: nomeCalendario,
      descricao: baseadoEm ? `Baseado em ${calendarios.find(c => c.id === baseadoEm)?.nome}` : 'Calendário personalizado',
      dias_trabalho: diasTrabalho,
      horas_por_dia: Math.round(totalHoras),
      horario_inicio: periodoPrimeiro.inicio,
      horario_almoco_inicio: periodosSemana[primeiroDiaUtil].periodos.length > 1 ? periodosSemana[primeiroDiaUtil].periodos[0].fim : undefined,
      horario_almoco_fim: periodosSemana[primeiroDiaUtil].periodos.length > 1 ? periodosSemana[primeiroDiaUtil].periodos[1].inicio : undefined,
      horario_fim: periodosSemana[primeiroDiaUtil].periodos[periodosSemana[primeiroDiaUtil].periodos.length - 1].fim,
      excecoes: excecoes,
      is_padrao: false,
    };

    if (calendarioSelecionadoId && modoEdicao === 'editar') {
      atualizarCalendario(calendarioSelecionadoId, novoCalendario);
    } else {
      adicionarCalendario(novoCalendario);
    }

    setModoEdicao('visualizar');
  };

  const handleRemover = () => {
    if (!calendarioSelecionadoId) return;
    
    if (confirm(`Deseja realmente excluir o calendário "${calendarioSelecionado?.nome}"?`)) {
      try {
        removerCalendario(calendarioSelecionadoId);
        setCalendarioSelecionadoId(calendarios[0]?.id || null);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao remover calendário');
      }
    }
  };

  const handleToggleDiaTrabalhando = (dia: DiaTrabalho) => {
    const config = periodosSemana[dia];
    setPeriodosSemana({
      ...periodosSemana,
      [dia]: {
        trabalhando: !config.trabalhando,
        periodos: !config.trabalhando && config.periodos.length === 0 
          ? [{ inicio: '08:00', fim: '12:00' }, { inicio: '13:00', fim: '17:00' }]
          : config.periodos
      }
    });
  };

  const handleAdicionarPeriodo = (dia: DiaTrabalho) => {
    const config = periodosSemana[dia];
    const ultimoPeriodo = config.periodos[config.periodos.length - 1];
    const novoInicio = ultimoPeriodo ? ultimoPeriodo.fim : '08:00';
    
    setPeriodosSemana({
      ...periodosSemana,
      [dia]: {
        ...config,
        periodos: [...config.periodos, { inicio: novoInicio, fim: '18:00' }]
      }
    });
  };

  const handleRemoverPeriodo = (dia: DiaTrabalho, index: number) => {
    const config = periodosSemana[dia];
    setPeriodosSemana({
      ...periodosSemana,
      [dia]: {
        ...config,
        periodos: config.periodos.filter((_, i) => i !== index)
      }
    });
  };

  const handleAtualizarPeriodo = (dia: DiaTrabalho, index: number, campo: 'inicio' | 'fim', valor: string) => {
    const config = periodosSemana[dia];
    const novosPeriodos = [...config.periodos];
    novosPeriodos[index] = { ...novosPeriodos[index], [campo]: valor };
    
    setPeriodosSemana({
      ...periodosSemana,
      [dia]: {
        ...config,
        periodos: novosPeriodos
      }
    });
  };

  const handleAbrirExcecoes = () => {
    setShowExcecoesModal(true);
  };

  const handleSalvarExcecoes = (novasExcecoes: ExcecaoCalendario[]) => {
    setExcecoes(novasExcecoes);
  };

  const calcularHorasPorDia = (dia: DiaTrabalho): string => {
    const config = periodosSemana[dia];
    if (!config.trabalhando) return '0h';
    
    let totalMinutos = 0;
    config.periodos.forEach(periodo => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-bold text-white">Alterar Período de Trabalho</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Lista de Calendários */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Para: (Calendário do projeto)
              </label>
              <select
                value={calendarioSelecionadoId || ''}
                onChange={(e) => {
                  setCalendarioSelecionadoId(e.target.value);
                  setModoEdicao('visualizar');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={modoEdicao === 'editar'}
              >
                {calendarios.map(cal => (
                  <option key={cal.id} value={cal.id}>
                    {cal.nome}
                    {cal.is_padrao ? ' (Sistema)' : ''}
                    {calendario_padrao === cal.id ? ' ★' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {calendarios.map(cal => (
                  <button
                    key={cal.id}
                    onClick={() => {
                      setCalendarioSelecionadoId(cal.id);
                      setModoEdicao('visualizar');
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      calendarioSelecionadoId === cal.id
                        ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                        : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow'
                    }`}
                    disabled={modoEdicao === 'editar' && calendarioSelecionadoId !== cal.id}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-semibold text-gray-900 text-sm">
                        {cal.nome}
                      </span>
                      {calendario_padrao === cal.id && (
                        <span className="text-yellow-500 text-lg leading-none">★</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{cal.descricao}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{cal.horas_por_dia}h/dia</span>
                    </div>
                    {cal.is_padrao && (
                      <span className="inline-block mt-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                        Sistema
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-white space-y-2">
              <button
                onClick={handleNovoCalendario}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                disabled={modoEdicao === 'editar'}
              >
                <Plus className="w-4 h-4" />
                Novo...
              </button>
              <button
                onClick={handleCopiarCalendario}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                disabled={!calendarioSelecionado || modoEdicao === 'editar'}
              >
                <Copy className="w-4 h-4" />
                Copiar...
              </button>
            </div>
          </div>

          {/* Main Content - Configuração do Calendário */}
          <div className="flex-1 overflow-y-auto">
            {modoEdicao === 'visualizar' && calendarioSelecionado ? (
              // Modo Visualização
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">{calendarioSelecionado.nome}</h3>
                  <p className="text-sm text-blue-700 mb-3">{calendarioSelecionado.descricao}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-gray-700">Horas por dia:</span>
                      <span className="ml-2 text-gray-900">{calendarioSelecionado.horas_por_dia}h</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Dias úteis:</span>
                      <span className="ml-2 text-gray-900">{calendarioSelecionado.dias_trabalho.length}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Horários de Trabalho
                  </h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Dia</th>
                          <th className="text-left px-4 py-3 font-semibold text-gray-700">Horário</th>
                          <th className="text-right px-4 py-3 font-semibold text-gray-700">Horas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {diasSemana.map(dia => {
                          const trabalhando = calendarioSelecionado.dias_trabalho.includes(dia.value);
                          return (
                            <tr key={dia.value} className={trabalhando ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-3 font-medium text-gray-900">{dia.label}</td>
                              <td className="px-4 py-3 text-gray-700">
                                {trabalhando ? (
                                  <>
                                    {calendarioSelecionado.horario_inicio} - {calendarioSelecionado.horario_almoco_inicio || calendarioSelecionado.horario_fim}
                                    {calendarioSelecionado.horario_almoco_fim && (
                                      <>, {calendarioSelecionado.horario_almoco_fim} - {calendarioSelecionado.horario_fim}</>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-gray-400 italic">Não trabalhando</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-gray-900 font-medium">
                                {trabalhando ? `${calendarioSelecionado.horas_por_dia}h` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {calendarioSelecionado.excecoes && calendarioSelecionado.excecoes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-purple-600" />
                      Exceções (Feriados e Dias Especiais)
                    </h4>
                    <div className="space-y-2">
                      {calendarioSelecionado.excecoes.slice(0, 5).map((excecao) => (
                        <div key={excecao.id} className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-purple-900">{excecao.nome}</span>
                            <span className="text-xs text-purple-700 ml-2">
                              - {new Date(excecao.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <span className="text-xs text-purple-700">
                            {excecao.trabalhando ? '✓ Trabalhando' : '✗ Folga'}
                          </span>
                        </div>
                      ))}
                      {calendarioSelecionado.excecoes.length > 5 && (
                        <p className="text-xs text-gray-500 text-center">
                          + {calendarioSelecionado.excecoes.length - 5} exceções
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  {!calendarioSelecionado.is_padrao && (
                    <button
                      onClick={handleRemover}
                      className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </button>
                  )}
                  {calendario_padrao !== calendarioSelecionado.id && (
                    <button
                      onClick={() => setCalendarioPadrao(calendarioSelecionado.id)}
                      className="px-4 py-2.5 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                    >
                      Definir como Padrão
                    </button>
                  )}
                  <button
                    onClick={handleEditarCalendario}
                    className="ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Editar...
                  </button>
                </div>
              </div>
            ) : (
              // Modo Edição
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome: *
                  </label>
                  <input
                    type="text"
                    value={nomeCalendario}
                    onChange={(e) => setNomeCalendario(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Padrão 5x8, Intensivo 6x10, etc."
                  />
                </div>

                {!calendarioSelecionadoId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Baseado em: (opcional)
                    </label>
                    <select
                      value={baseadoEm}
                      onChange={(e) => setBaseadoEm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Nenhum</option>
                      {calendarios.map(cal => (
                        <option key={cal.id} value={cal.id}>{cal.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">Definir dias úteis e horários de trabalho</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Configure os períodos de trabalho para cada dia da semana
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {diasSemana.map(dia => {
                      const config = periodosSemana[dia.value];
                      return (
                        <div key={dia.value} className={`p-4 ${config.trabalhando ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                checked={config.trabalhando}
                                onChange={() => handleToggleDiaTrabalhando(dia.value)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-900">{dia.label}</span>
                                <span className="text-sm text-gray-600">
                                  {calcularHorasPorDia(dia.value)}
                                </span>
                              </div>

                              {config.trabalhando && (
                                <div className="space-y-2">
                                  {config.periodos.map((periodo, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <span className="text-sm text-gray-600 w-16">De:</span>
                                      <input
                                        type="time"
                                        value={periodo.inicio}
                                        onChange={(e) => handleAtualizarPeriodo(dia.value, index, 'inicio', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                      />
                                      <span className="text-sm text-gray-600">Até:</span>
                                      <input
                                        type="time"
                                        value={periodo.fim}
                                        onChange={(e) => handleAtualizarPeriodo(dia.value, index, 'fim', e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                      />
                                      {config.periodos.length > 1 && (
                                        <button
                                          onClick={() => handleRemoverPeriodo(dia.value, index)}
                                          className="text-red-600 hover:text-red-800 p-1"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                  <button
                                    onClick={() => handleAdicionarPeriodo(dia.value)}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    + Adicionar período
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Exceções */}
                <div className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50">
                  <div className="bg-purple-100 px-4 py-3 border-b border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Exceções (Feriados e Dias Especiais)
                        </h4>
                        <p className="text-xs text-purple-700 mt-1">
                          Feriados, folgas, horas extras e trabalho personalizado
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {excecoes.length}
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <button
                      onClick={handleAbrirExcecoes}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      <Calendar className="w-5 h-5" />
                      Gerenciar Exceções
                    </button>

                    {excecoes.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-purple-900 mb-2">Últimas exceções:</p>
                        {excecoes.slice(0, 3).map((excecao) => (
                          <div key={excecao.id} className="flex items-center justify-between bg-white border border-purple-200 rounded px-3 py-2">
                            <span className="text-xs text-purple-900 font-medium">{excecao.nome}</span>
                            <span className="text-xs text-purple-600">
                              {new Date(excecao.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </span>
                          </div>
                        ))}
                        {excecoes.length > 3 && (
                          <p className="text-xs text-purple-600 text-center">
                            + {excecoes.length - 3} exceções
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setModoEdicao('visualizar');
                      if (!calendarioSelecionadoId) {
                        setCalendarioSelecionadoId(calendarios[0]?.id || null);
                      }
                    }}
                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvar}
                    className="ml-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Calendário Padrão:</span>{' '}
            <span className="text-yellow-600">★</span>{' '}
            {calendarios.find(c => c.id === calendario_padrao)?.nome || 'Nenhum'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Modal de Exceções */}
      <ExcecoesModal
        open={showExcecoesModal}
        onClose={() => setShowExcecoesModal(false)}
        excecoes={excecoes}
        onSalvar={handleSalvarExcecoes}
        calendarioNome={nomeCalendario || calendarioSelecionado?.nome || 'Calendário'}
      />
    </div>
  );
};
