import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { checkinCheckoutService } from '../services/checkinCheckoutService';
import {
  ProgramacaoSemanal,
  ProgramacaoAtividade,
  AtividadeParaProgramar,
  DIAS_SEMANA,
  DIAS_SEMANA_LABEL,
  CreateProgramacaoAtividadeInput,
} from '../types/checkinCheckout.types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardList,
  Save,
  Trash2,
  RefreshCw,
  Play,
} from 'lucide-react';

export const ProgramacaoSemanalPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { projetoSelecionado } = useProjetoStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programacao, setProgramacao] = useState<ProgramacaoSemanal | null>(null);
  const [atividades, setAtividades] = useState<ProgramacaoAtividade[]>([]);
  const [atividadesDisponiveis, setAtividadesDisponiveis] = useState<AtividadeParaProgramar[]>([]);
  const [atividadesSelecionadas, setAtividadesSelecionadas] = useState<Set<string>>(new Set());
  const [showSeletor, setShowSeletor] = useState(false);

  const [semanaAtual, setSemanaAtual] = useState(() => {
    const hoje = new Date();
    return {
      date: hoje,
      semana: getWeek(hoje, { weekStartsOn: 1, locale: ptBR }),
      ano: getYear(hoje),
      inicio: startOfWeek(hoje, { weekStartsOn: 1 }),
      fim: endOfWeek(hoje, { weekStartsOn: 1 }),
    };
  });

  useEffect(() => {
    if (usuario?.empresaId && projetoSelecionado?.id) {
      loadData();
    }
  }, [usuario?.empresaId, projetoSelecionado?.id, semanaAtual.semana, semanaAtual.ano]);

  const loadData = async () => {
    if (!usuario?.empresaId || !projetoSelecionado?.id) return;

    setLoading(true);
    try {
      const dataInicioStr = format(semanaAtual.inicio, 'yyyy-MM-dd');
      const dataFimStr = format(semanaAtual.fim, 'yyyy-MM-dd');

      // Usar getOrCreateProgramacao para carregar ou criar automaticamente
      const { programacao: prog, atividades: ativs, isNew } = await checkinCheckoutService.getOrCreateProgramacao(
        usuario.empresaId,
        projetoSelecionado.id,
        semanaAtual.semana,
        semanaAtual.ano,
        dataInicioStr,
        dataFimStr
      );

      setProgramacao(prog);
      setAtividades(ativs);

      if (isNew && ativs.length > 0) {
        console.log(`Programação criada automaticamente com ${ativs.length} atividades do cronograma`);
      }

      // Carregar atividades disponíveis para adicionar (outras semanas)
      const disponiveis = await checkinCheckoutService.getAtividadesDisponiveis(
        usuario.empresaId,
        projetoSelecionado.id
      );
      
      // Filtrar atividades que já estão na programação
      const idsNaProgramacao = new Set(ativs.map(a => a.atividade_cronograma_id));
      setAtividadesDisponiveis(disponiveis.filter(a => !idsNaProgramacao.has(a.id)));
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSemanaAnterior = () => {
    const novaData = subWeeks(semanaAtual.date, 1);
    setSemanaAtual({
      date: novaData,
      semana: getWeek(novaData, { weekStartsOn: 1, locale: ptBR }),
      ano: getYear(novaData),
      inicio: startOfWeek(novaData, { weekStartsOn: 1 }),
      fim: endOfWeek(novaData, { weekStartsOn: 1 }),
    });
  };

  const handleSemanaProxima = () => {
    const novaData = addWeeks(semanaAtual.date, 1);
    setSemanaAtual({
      date: novaData,
      semana: getWeek(novaData, { weekStartsOn: 1, locale: ptBR }),
      ano: getYear(novaData),
      inicio: startOfWeek(novaData, { weekStartsOn: 1 }),
      fim: endOfWeek(novaData, { weekStartsOn: 1 }),
    });
  };

  const handleAdicionarAtividades = async () => {
    if (!usuario?.empresaId || !programacao) return;

    const selecionadas = atividadesDisponiveis.filter((a) => atividadesSelecionadas.has(a.id));
    if (selecionadas.length === 0) return;

    setSaving(true);
    try {
      const inputs: CreateProgramacaoAtividadeInput[] = selecionadas.map((a, idx) => ({
        programacao_id: programacao.id,
        atividade_cronograma_id: a.id,
        codigo: a.codigo,
        nome: a.nome,
        area: a.area,
        responsavel_nome: a.responsavel_nome,
        tem_restricao: a.tem_restricao,
        restricao_id: a.restricao_id,
        restricao_descricao: a.restricao_descricao,
        ordem: atividades.length + idx,
      }));

      const novasAtividades = await checkinCheckoutService.addAtividadesBatch(
        usuario.empresaId,
        inputs
      );

      if (novasAtividades.length > 0) {
        setAtividades([...atividades, ...novasAtividades]);
        setAtividadesSelecionadas(new Set());
        setShowSeletor(false);
      }
    } catch (e) {
      console.error('Erro ao adicionar atividades:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoverAtividade = async (id: string) => {
    if (!confirm('Deseja realmente remover esta atividade da programação?')) return;

    try {
      const sucesso = await checkinCheckoutService.deleteAtividade(id);
      if (sucesso) {
        setAtividades(atividades.filter((a) => a.id !== id));
      }
    } catch (e) {
      console.error('Erro ao remover atividade:', e);
    }
  };

  const handleUpdatePrevisto = async (atividadeId: string, dia: string, valor: number) => {
    const atividade = atividades.find((a) => a.id === atividadeId);
    if (!atividade) return;

    const key = `prev_${dia}` as keyof ProgramacaoAtividade;
    const atualizado = { ...atividade, [key]: valor };

    setAtividades(atividades.map((a) => (a.id === atividadeId ? atualizado : a)));

    try {
      await checkinCheckoutService.updateAtividade(atividadeId, { [key]: valor });
    } catch (e) {
      console.error('Erro ao atualizar previsto:', e);
    }
  };

  const handleIniciarExecucao = async () => {
    if (!programacao) return;

    try {
      await checkinCheckoutService.updateProgramacao(programacao.id, {
        status: 'EM_EXECUCAO',
      });
      setProgramacao({ ...programacao, status: 'EM_EXECUCAO' });
    } catch (e) {
      console.error('Erro ao iniciar execução:', e);
    }
  };

  const estatisticas = useMemo(() => {
    return {
      total: atividades.length,
      comRestricao: atividades.filter((a) => a.tem_restricao).length,
      semRestricao: atividades.filter((a) => !a.tem_restricao).length,
    };
  }, [atividades]);

  const atividadesJaProgramadas = useMemo(() => {
    return new Set(atividades.map((a) => a.atividade_cronograma_id));
  }, [atividades]);

  const atividadesDisponiveisFiltradas = useMemo(() => {
    return atividadesDisponiveis.filter((a) => !atividadesJaProgramadas.has(a.id));
  }, [atividadesDisponiveis, atividadesJaProgramadas]);

  if (!projetoSelecionado) {
    return (
      <div className="h-full flex flex-col bg-neutral-50">
        <div className="p-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Programação Semanal</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Weekly Work Plan - Planejamento de atividades para a semana
              </p>
            </div>
            <ProjetoSelector />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ClipboardList className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">Selecione um Projeto</h3>
            <p className="text-neutral-500">
              Escolha um projeto no seletor acima para visualizar a programação semanal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      <div className="p-6 border-b border-neutral-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Programação Semanal</h1>
            <p className="text-sm text-neutral-600 mt-1">
              Weekly Work Plan - Planejamento de atividades para a semana
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ProjetoSelector />
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSemanaAnterior}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-500" />
              <span className="font-semibold text-lg">
                Semana {semanaAtual.semana}/{semanaAtual.ano}
              </span>
              <span className="text-neutral-500">
                ({format(semanaAtual.inicio, 'dd/MM', { locale: ptBR })} -{' '}
                {format(semanaAtual.fim, 'dd/MM', { locale: ptBR })})
              </span>
            </div>
            <button
              onClick={handleSemanaProxima}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {programacao && programacao.status === 'PLANEJADA' && atividades.length > 0 && (
              <button
                onClick={handleIniciarExecucao}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Play className="w-4 h-4" />
                Iniciar Execução
              </button>
            )}
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
          </div>
        ) : !programacao ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-neutral-200">
            <ClipboardList className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              Carregando programação...
            </h3>
            <p className="text-neutral-500 mb-6">
              Aguarde enquanto a programação é criada automaticamente com as atividades do cronograma
            </p>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Carregando...' : 'Recarregar'}
            </button>
          </div>
        ) : atividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-neutral-200">
            <Calendar className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              Nenhuma atividade nesta semana
            </h3>
            <p className="text-neutral-500 mb-6 text-center max-w-md">
              O cronograma não possui atividades programadas para esta semana.
              <br />
              Você pode adicionar atividades de outras semanas para adiantar o trabalho.
            </p>
            <button
              onClick={() => setShowSeletor(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Adicionar Atividades
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">{estatisticas.total}</div>
                    <div className="text-sm text-neutral-500">Atividades Programadas</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {estatisticas.semRestricao}
                    </div>
                    <div className="text-sm text-neutral-500">Sem Restrições</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {estatisticas.comRestricao}
                    </div>
                    <div className="text-sm text-neutral-500">Com Restrições</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-neutral-900">
                      {programacao.ppc_semanal?.toFixed(0) || 0}%
                    </div>
                    <div className="text-sm text-neutral-500">PPC Semanal</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h3 className="font-semibold text-neutral-900">Atividades da Semana</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      programacao.status === 'PLANEJADA'
                        ? 'bg-blue-100 text-blue-700'
                        : programacao.status === 'EM_EXECUCAO'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {programacao.status === 'PLANEJADA'
                      ? 'Em Planejamento'
                      : programacao.status === 'EM_EXECUCAO'
                      ? 'Em Execução'
                      : programacao.status}
                  </span>
                  {programacao.status === 'PLANEJADA' && (
                    <button
                      onClick={() => setShowSeletor(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar Atividades
                    </button>
                  )}
                </div>
              </div>

              {atividades.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-neutral-500">Nenhuma atividade programada ainda.</p>
                  <button
                    onClick={() => setShowSeletor(true)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Adicionar atividades do cronograma
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-neutral-600 w-8">#</th>
                        <th className="text-left p-3 font-medium text-neutral-600 min-w-[200px]">
                          Atividade
                        </th>
                        <th className="text-left p-3 font-medium text-neutral-600 w-24">
                          Restrição
                        </th>
                        <th className="text-left p-3 font-medium text-neutral-600 w-32">
                          Responsável
                        </th>
                        {DIAS_SEMANA.slice(0, 5).map((dia) => (
                          <th
                            key={dia}
                            className="text-center p-3 font-medium text-neutral-600 w-20"
                          >
                            {DIAS_SEMANA_LABEL[dia].slice(0, 3)}
                          </th>
                        ))}
                        <th className="text-center p-3 font-medium text-neutral-600 w-20">
                          Total
                        </th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {atividades.map((atividade, idx) => {
                        const totalPrev =
                          (atividade.prev_seg || 0) +
                          (atividade.prev_ter || 0) +
                          (atividade.prev_qua || 0) +
                          (atividade.prev_qui || 0) +
                          (atividade.prev_sex || 0);

                        return (
                          <tr key={atividade.id} className="hover:bg-neutral-50">
                            <td className="p-3 text-neutral-500">{idx + 1}</td>
                            <td className="p-3">
                              <div className="font-medium text-neutral-900">{atividade.nome}</div>
                              {atividade.codigo && (
                                <div className="text-xs text-neutral-500">{atividade.codigo}</div>
                              )}
                            </td>
                            <td className="p-3">
                              {atividade.tem_restricao ? (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-xs">Sim</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs">Não</span>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-neutral-600">{atividade.responsavel_nome || '-'}</td>
                            {DIAS_SEMANA.slice(0, 5).map((dia) => {
                              const prevKey = `prev_${dia}` as keyof ProgramacaoAtividade;
                              const valor = (atividade[prevKey] as number) || 0;

                              return (
                                <td key={dia} className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={valor || ''}
                                    onChange={(e) =>
                                      handleUpdatePrevisto(
                                        atividade.id,
                                        dia,
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    disabled={programacao.status !== 'PLANEJADA'}
                                    className="w-full p-2 text-center border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-50"
                                    placeholder="0"
                                  />
                                </td>
                              );
                            })}
                            <td className="p-3 text-center font-medium text-neutral-900">
                              {totalPrev.toFixed(1)}
                            </td>
                            <td className="p-2">
                              {programacao.status === 'PLANEJADA' && (
                                <button
                                  onClick={() => handleRemoverAtividade(atividade.id)}
                                  className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                                  title="Remover"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showSeletor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Selecionar Atividades do Cronograma</h3>
              <button
                onClick={() => setShowSeletor(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {atividadesDisponiveisFiltradas.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Nenhuma atividade disponível para programar
                </div>
              ) : (
                <div className="space-y-2">
                  {atividadesDisponiveisFiltradas.map((atividade) => (
                    <div
                      key={atividade.id}
                      className={`rounded-lg border transition-colors ${
                        atividadesSelecionadas.has(atividade.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <label className="flex items-center gap-3 p-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={atividadesSelecionadas.has(atividade.id)}
                          onChange={(e) => {
                            const novasSelecionadas = new Set(atividadesSelecionadas);
                            if (e.target.checked) {
                              novasSelecionadas.add(atividade.id);
                            } else {
                              novasSelecionadas.delete(atividade.id);
                            }
                            setAtividadesSelecionadas(novasSelecionadas);
                          }}
                          className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">{atividade.nome}</div>
                          <div className="text-sm text-neutral-500 flex items-center gap-4">
                            {atividade.codigo && <span>{atividade.codigo}</span>}
                            {atividade.responsavel_nome && (
                              <span>Resp: {atividade.responsavel_nome}</span>
                            )}
                            {atividade.duracao_dias && (
                              <span>Duração: {atividade.duracao_dias} dias</span>
                            )}
                          </div>
                        </div>
                        {atividade.tem_restricao && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            Com Restrição
                          </div>
                        )}
                      </label>
                      {atividade.itens_takeoff && atividade.itens_takeoff.length > 0 && (
                        <div className="px-10 pb-3">
                          <div className="text-xs font-medium text-neutral-500 mb-1">
                            Quantitativos vinculados (meta diária calculada):
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {atividade.itens_takeoff.map((item) => (
                              <div
                                key={item.id}
                                className="px-2 py-1 bg-neutral-100 rounded text-xs text-neutral-700"
                                title={`Total: ${item.qtdTotal.toFixed(2)} ${item.unidade}`}
                              >
                                {item.descricao.slice(0, 30)}{item.descricao.length > 30 ? '...' : ''}: {item.qtdDiaria.toFixed(2)} {item.unidade}/dia
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-neutral-200 flex items-center justify-between">
              <span className="text-sm text-neutral-600">
                {atividadesSelecionadas.size} atividades selecionadas
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSeletor(false)}
                  className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdicionarAtividades}
                  disabled={atividadesSelecionadas.size === 0 || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Adicionar Selecionadas'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramacaoSemanalPage;
