import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, getYear, addDays, differenceInCalendarDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { checkinCheckoutService } from '../services/checkinCheckoutService';
import {
  ProgramacaoSemanal,
  ProgramacaoAtividade,
  MetricasPPC,
  TakeoffItemVinculado,
  DIAS_SEMANA,
  DIAS_SEMANA_LABEL,
  DiaSemana,
  Causa6M,
  CAUSAS_6M_LABEL,
  CAUSAS_6M_CORES,
  InterferenciaObra,
  TipoEmpresa,
  TIPO_EMPRESA_LABEL,
  CreateInterferenciaInput,
  CategoriaInterferencia,
} from '../types/checkinCheckout.types';
import { restricoesIshikawaService } from '../services/restricoesIshikawaService';
import { CategoriaIshikawa, StatusRestricaoIshikawa, RestricaoIshikawa } from '../types/gestao';
import { takeoffService } from '../services/takeoffService';
import { supabase } from '../services/supabase';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Download,
  Maximize2,
  Tv,
  BarChart3,
  Plus,
  History,
  ArrowRight,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const CheckInCheckOutPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { projetoSelecionado } = useProjetoStore();

  const [loading, setLoading] = useState(false);
  const [programacao, setProgramacao] = useState<ProgramacaoSemanal | null>(null);
  const [atividades, setAtividades] = useState<ProgramacaoAtividade[]>([]);
  const [itensPorAtividade, setItensPorAtividade] = useState<Record<string, TakeoffItemVinculado[]>>({});
  const [metricas, setMetricas] = useState<MetricasPPC | null>(null);
  const [modoTV, setModoTV] = useState(false);
  const [causaModal, setCausaModal] = useState<{
    atividadeId: string;
    dia: DiaSemana;
    data: string;
    realizado: number;
  } | null>(null);
  const [causaSelecionada, setCausaSelecionada] = useState<Causa6M | null>(null);
  const [causaDescricao, setCausaDescricao] = useState('');

  const [showInterferenciaModal, setShowInterferenciaModal] = useState(false);
  const [interferencias, setInterferencias] = useState<InterferenciaObra[]>([]);
  const [showHistoricoInterferencias, setShowHistoricoInterferencias] = useState(false);
  const [novaInterferencia, setNovaInterferencia] = useState({
    atividade_id: '',
    tipo_empresa: 'CONTRATADA' as TipoEmpresa,
    empresa: '',
    descricao: '',
  });
  const [savingInterferencia, setSavingInterferencia] = useState(false);
  const [convertendoInterferencia, setConvertendoInterferencia] = useState<string | null>(null);

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

  const diasDaSemana = useMemo(() => {
    const datas: Record<DiaSemana, { date: Date; formatted: string }> = {} as any;
    DIAS_SEMANA.forEach((dia, idx) => {
      const date = addDays(semanaAtual.inicio, idx);
      datas[dia] = {
        date,
        formatted: format(date, 'dd/MM', { locale: ptBR }),
      };
    });
    return datas;
  }, [semanaAtual.inicio]);

  useEffect(() => {
    if (usuario?.empresaId && projetoSelecionado?.id) {
      loadData();
    }
  }, [usuario?.empresaId, projetoSelecionado?.id, semanaAtual.semana, semanaAtual.ano]);

  const loadData = async () => {
    if (!usuario?.empresaId || !projetoSelecionado?.id) return;

    setLoading(true);
    try {
      // Usa getOrCreateProgramacao para criar automaticamente a programação e popular com atividades do cronograma
      const result = await checkinCheckoutService.getOrCreateProgramacao(
        usuario.empresaId,
        projetoSelecionado.id,
        semanaAtual.semana,
        semanaAtual.ano,
        format(semanaAtual.inicio, 'yyyy-MM-dd'),
        format(semanaAtual.fim, 'yyyy-MM-dd')
      );

      if (result.programacao) {
        setProgramacao(result.programacao);
        
        // Usa atividades retornadas por getOrCreateProgramacao
        setAtividades(result.atividades);
        
        const metrics = await checkinCheckoutService.calcularMetricasPPC(result.programacao.id);
        setMetricas(metrics);

        // Busca itens de take-off em batch para todas as atividades
        const cronogramaIds = result.atividades
          .filter(a => a.atividade_cronograma_id)
          .map(a => a.atividade_cronograma_id!);
        
        if (cronogramaIds.length > 0) {
          // Buscar durações em uma só query
          const { data: cronogramaAtivs } = await supabase
            .from('atividades_cronograma')
            .select('id, duracao_dias, data_inicio, data_fim')
            .in('id', cronogramaIds);
          
          const duracaoMap = new Map<string, number>();
          (cronogramaAtivs || []).forEach(c => {
            let duracao = c.duracao_dias || 1;
            if (!duracao && c.data_inicio && c.data_fim) {
              duracao = Math.max(1, differenceInCalendarDays(
                parseISO(c.data_fim), 
                parseISO(c.data_inicio)
              ) + 1);
            }
            duracaoMap.set(c.id, duracao);
          });

          // Buscar todos os vínculos take-off
          const itensMap: Record<string, TakeoffItemVinculado[]> = {};
          for (const ativ of result.atividades) {
            if (ativ.atividade_cronograma_id) {
              const vinculos = await takeoffService.getVinculosByAtividade(ativ.atividade_cronograma_id);
              const duracao = duracaoMap.get(ativ.atividade_cronograma_id) || 1;
              
              const itens: TakeoffItemVinculado[] = vinculos.map(v => {
                const item = (v as any).takeoff_itens;
                const qtdTotal = item?.qtd_prevista || item?.qtd_takeoff || 0;
                const qtdDiaria = duracao > 0 ? qtdTotal / duracao : qtdTotal;
                return {
                  id: v.id,
                  itemId: v.itemId,
                  descricao: item?.descricao || 'Item sem descrição',
                  unidade: item?.unidade || 'un',
                  qtdTotal,
                  qtdDiaria: Math.round(qtdDiaria * 100) / 100,
                  peso: v.peso,
                };
              });
              if (itens.length > 0) {
                itensMap[ativ.id] = itens;
              }
            }
          }
          setItensPorAtividade(itensMap);
        } else {
          setItensPorAtividade({});
        }
      const listaInterferencias = await checkinCheckoutService.getInterferencias(
          usuario.empresaId,
          projetoSelecionado.id,
          result.programacao.id
        );
        setInterferencias(listaInterferencias);
      } else {
        setProgramacao(null);
        setAtividades([]);
        setMetricas(null);
        setItensPorAtividade({});
        setInterferencias([]);
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarInterferencia = async () => {
    if (!programacao || !usuario?.empresaId || !usuario?.id || !projetoSelecionado?.id) return;
    if (!novaInterferencia.descricao.trim()) {
      alert('Por favor, descreva a interferência.');
      return;
    }

    setSavingInterferencia(true);
    try {
      const input: CreateInterferenciaInput = {
        projeto_id: projetoSelecionado.id,
        programacao_id: programacao.id,
        atividade_id: novaInterferencia.atividade_id || undefined,
        setor: (usuario as any).setor || 'Não especificado',
        empresa_nome: novaInterferencia.empresa,
        tipo_empresa: novaInterferencia.tipo_empresa,
        descricao: novaInterferencia.descricao,
        data_ocorrencia: format(new Date(), 'yyyy-MM-dd'),
      };

      const resultado = await checkinCheckoutService.registrarInterferencia(
        usuario.empresaId,
        usuario.id,
        usuario.nome || usuario.email || 'Usuário',
        input
      );

      if (resultado) {
        setShowInterferenciaModal(false);
        setNovaInterferencia({
          atividade_id: '',
          tipo_empresa: 'CONTRATADA',
          empresa: '',
          descricao: '',
        });
        const listaInterferencias = await checkinCheckoutService.getInterferencias(
          usuario.empresaId,
          projetoSelecionado.id,
          programacao.id
        );
        setInterferencias(listaInterferencias);
      }
    } catch (e) {
      console.error('Erro ao registrar interferência:', e);
    } finally {
      setSavingInterferencia(false);
    }
  };

  const mapCategoriaToCategoriaIshikawa = (categoria?: CategoriaInterferencia): CategoriaIshikawa => {
    const mapping: Record<CategoriaInterferencia, CategoriaIshikawa> = {
      'MAO_DE_OBRA': CategoriaIshikawa.MAO_DE_OBRA,
      'MATERIAL': CategoriaIshikawa.MATERIAL,
      'MAQUINA': CategoriaIshikawa.MAQUINA,
      'METODO': CategoriaIshikawa.METODO,
      'MEIO_AMBIENTE': CategoriaIshikawa.MEIO_AMBIENTE,
      'MEDIDA': CategoriaIshikawa.MEDIDA,
      'SEGURANCA': CategoriaIshikawa.METODO,
      'PROJETO': CategoriaIshikawa.METODO,
      'CLIMA': CategoriaIshikawa.MEIO_AMBIENTE,
      'OUTRO': CategoriaIshikawa.METODO,
    };
    return categoria ? mapping[categoria] : CategoriaIshikawa.METODO;
  };

  const handleConverterEmRestricao = async (interf: InterferenciaObra) => {
    if (!usuario?.empresaId || !projetoSelecionado?.id) return;

    setConvertendoInterferencia(interf.id);
    try {
      const timestamp = Date.now().toString(36).toUpperCase();
      const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
      const novoCodigo = `INT-${timestamp.slice(-4)}${randomPart}`;
      
      const novaRestricao: Omit<RestricaoIshikawa, 'id'> = {
        codigo: novoCodigo,
        descricao: `[Interferência ${interf.tipo_empresa}] ${interf.descricao}`,
        categoria: mapCategoriaToCategoriaIshikawa(interf.categoria),
        status: StatusRestricaoIshikawa.IDENTIFICADA,
        atividadeNome: interf.atividade_nome,
        dataCriacao: new Date(),
        dataPrevista: addDays(new Date(), 7),
        responsavel: usuario?.nome || interf.usuario_nome || 'Não definido',
        impactoCaminhoCritico: false,
        duracaoAtividadeImpactada: 0,
        diasAtraso: 0,
        scoreImpacto: 50,
        reincidente: false,
      };

      const restricaoCriada = await restricoesIshikawaService.create(
        novaRestricao as RestricaoIshikawa,
        usuario.empresaId
      );

      if (restricaoCriada) {
        const convertido = await checkinCheckoutService.converterEmRestricao(interf.id, restricaoCriada.id);
        
        if (convertido && programacao) {
          const listaInterferencias = await checkinCheckoutService.getInterferencias(
            usuario.empresaId,
            projetoSelecionado.id,
            programacao.id
          );
          setInterferencias(listaInterferencias);
        }
      }
    } catch (e) {
      console.error('Erro ao converter interferência em restrição:', e);
      alert('Erro ao converter interferência. Tente novamente.');
    } finally {
      setConvertendoInterferencia(null);
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

  const handleUpdateReal = async (
    atividadeId: string,
    dia: DiaSemana,
    valor: number,
    previstoValor: number
  ) => {
    if (!usuario?.empresaId || !programacao) return;

    const dataStr = format(diasDaSemana[dia].date, 'yyyy-MM-dd');
    const concluido = valor >= previstoValor && previstoValor > 0;

    if (!concluido && previstoValor > 0) {
      setCausaModal({ atividadeId, dia, data: dataStr, realizado: valor });
      return;
    }

    try {
      await checkinCheckoutService.updateCheckIn(usuario.empresaId, {
        programacao_atividade_id: atividadeId,
        dia_semana: dia,
        data: dataStr,
        realizado: valor,
        concluido,
      });

      const key = `real_${dia}` as keyof ProgramacaoAtividade;
      setAtividades(
        atividades.map((a) => (a.id === atividadeId ? { ...a, [key]: valor } : a))
      );

      const metrics = await checkinCheckoutService.calcularMetricasPPC(programacao.id);
      setMetricas(metrics);
    } catch (e) {
      console.error('Erro ao atualizar check-in:', e);
    }
  };

  const handleSalvarCausa = async () => {
    if (!causaModal || !usuario?.empresaId) return;

    try {
      await checkinCheckoutService.updateCheckIn(usuario.empresaId, {
        programacao_atividade_id: causaModal.atividadeId,
        dia_semana: causaModal.dia,
        data: causaModal.data,
        realizado: causaModal.realizado,
        concluido: false,
        causa_nao_cumprimento: causaSelecionada || undefined,
        causa_descricao: causaDescricao || undefined,
      });

      const key = `real_${causaModal.dia}` as keyof ProgramacaoAtividade;
      setAtividades(
        atividades.map((a) =>
          a.id === causaModal.atividadeId ? { ...a, [key]: causaModal.realizado } : a
        )
      );

      if (programacao) {
        const metrics = await checkinCheckoutService.calcularMetricasPPC(programacao.id);
        setMetricas(metrics);
      }

      setCausaModal(null);
      setCausaSelecionada(null);
      setCausaDescricao('');
    } catch (e) {
      console.error('Erro ao salvar causa:', e);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('checkin-grid');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3',
      });

      const imgWidth = 400;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`check-in-checkout-semana-${semanaAtual.semana}-${semanaAtual.ano}.pdf`);
    } catch (e) {
      console.error('Erro ao exportar PDF:', e);
    }
  };

  const ppcColor = (ppc: number) => {
    if (ppc >= 85) return 'text-green-600 bg-green-100';
    if (ppc >= 70) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  if (!projetoSelecionado) {
    return (
      <div className="h-full flex flex-col bg-neutral-50">
        <div className="p-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Check-in / Check-out</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Acompanhamento diário de atividades - PPC (Percent Plan Complete)
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
              Escolha um projeto no seletor acima para visualizar o quadro de check-in/check-out
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${modoTV ? 'fixed inset-0 z-50' : ''} bg-neutral-50`}>
      <div className={`${modoTV ? 'p-4' : 'p-6'} border-b border-neutral-200 bg-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {!modoTV && (
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Check-in / Check-out</h1>
                <p className="text-sm text-neutral-600 mt-1">
                  Acompanhamento diário de atividades - PPC (Percent Plan Complete)
                </p>
              </div>
            )}
            {modoTV && (
              <h1 className="text-3xl font-bold text-neutral-900">
                CHECK-IN / CHECK-OUT - Semana {semanaAtual.semana}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-4">
            {!modoTV && <ProjetoSelector />}
            <button
              onClick={() => setModoTV(!modoTV)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                modoTV
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
              title={modoTV ? 'Sair do Modo TV' : 'Modo TV'}
            >
              {modoTV ? <Maximize2 className="w-5 h-5" /> : <Tv className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSemanaAnterior}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-neutral-500" />
              <span className={`font-semibold ${modoTV ? 'text-2xl' : 'text-lg'}`}>
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
            {metricas && (
              <div
                className={`px-4 py-2 rounded-lg font-bold ${modoTV ? 'text-3xl' : 'text-xl'} ${ppcColor(
                  metricas.ppc_semanal
                )}`}
              >
                PPC: {metricas.ppc_semanal.toFixed(0)}%
              </div>
            )}
            {!modoTV && (
              <>
                {programacao && programacao.status === 'EM_EXECUCAO' && (
                  <button
                    onClick={() => setShowInterferenciaModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    title="Registrar Interferência"
                  >
                    <AlertOctagon className="w-4 h-4" />
                    <span className="text-sm">Interferência</span>
                  </button>
                )}
                {interferencias.length > 0 && (
                  <button
                    onClick={() => setShowHistoricoInterferencias(true)}
                    className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Histórico de Interferências"
                  >
                    <History className="w-4 h-4" />
                    <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded-full">{interferencias.length}</span>
                  </button>
                )}
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                  title="Exportar PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={loadData}
                  className="flex items-center gap-2 px-3 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 overflow-auto ${modoTV ? 'p-4' : 'p-6'}`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
          </div>
        ) : !programacao ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-neutral-200">
            <ClipboardList className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              Nenhuma programação para esta semana
            </h3>
            <p className="text-neutral-500">
              Crie uma programação semanal primeiro na página de Programação Semanal
            </p>
          </div>
        ) : atividades.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border border-neutral-200">
            <ClipboardList className="w-16 h-16 text-neutral-300 mb-4" />
            <h3 className="text-lg font-medium text-neutral-700 mb-2">
              Nenhuma atividade programada
            </h3>
            <p className="text-neutral-500">
              Adicione atividades na página de Programação Semanal
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {!modoTV && metricas && (
              <div className="grid grid-cols-7 gap-2 mb-4">
                {DIAS_SEMANA.map((dia) => (
                  <div
                    key={dia}
                    className={`p-3 rounded-lg text-center ${ppcColor(metricas.ppc_por_dia[dia] || 0)}`}
                  >
                    <div className="text-sm font-medium">{DIAS_SEMANA_LABEL[dia]}</div>
                    <div className="text-2xl font-bold">
                      {(metricas.ppc_por_dia[dia] || 0).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              id="checkin-grid"
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className={`w-full ${modoTV ? 'text-lg' : 'text-sm'}`}>
                  <thead className="bg-neutral-800 text-white">
                    <tr>
                      <th className="text-left p-3 font-medium w-8">#</th>
                      <th className="text-left p-3 font-medium min-w-[200px]">ATIVIDADE</th>
                      <th className="text-left p-3 font-medium w-24">REST.</th>
                      <th className="text-left p-3 font-medium w-28">RESPONSÁVEL</th>
                      {DIAS_SEMANA.map((dia) => (
                        <th key={dia} className="text-center p-2 font-medium w-16">
                          <div>{DIAS_SEMANA_LABEL[dia].toUpperCase().slice(0, 3)}</div>
                          <div className="text-xs font-normal opacity-75">
                            {diasDaSemana[dia].formatted}
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium w-20 bg-orange-500">TOTAL</th>
                      <th className="text-center p-3 font-medium w-16 bg-orange-500">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {atividades.map((atividade, idx) => {
                      let totalPrev = 0;
                      let totalReal = 0;
                      DIAS_SEMANA.forEach((dia) => {
                        totalPrev += (atividade[`prev_${dia}` as keyof ProgramacaoAtividade] as number) || 0;
                        totalReal += (atividade[`real_${dia}` as keyof ProgramacaoAtividade] as number) || 0;
                      });
                      const ppcAtividade = totalPrev > 0 ? (totalReal / totalPrev) * 100 : 0;

                      return (
                        <React.Fragment key={atividade.id}>
                          <tr className="bg-neutral-50">
                            <td rowSpan={2} className="p-2 text-center font-medium text-neutral-600 border-r border-neutral-200">
                              {idx + 1}
                            </td>
                            <td rowSpan={2} className="p-2 border-r border-neutral-200">
                              <div className="font-medium text-neutral-900">{atividade.nome}</div>
                              {atividade.codigo && (
                                <div className="text-xs text-neutral-500">{atividade.codigo}</div>
                              )}
                              {itensPorAtividade[atividade.id] && itensPorAtividade[atividade.id].length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {itensPorAtividade[atividade.id].map((item) => (
                                    <div
                                      key={item.id}
                                      className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded inline-block mr-1"
                                      title={`Total: ${item.qtdTotal.toFixed(2)} ${item.unidade} | Meta diária: ${item.qtdDiaria.toFixed(2)} ${item.unidade}`}
                                    >
                                      {item.descricao.slice(0, 20)}{item.descricao.length > 20 ? '...' : ''}: {item.qtdDiaria} {item.unidade}/dia
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td rowSpan={2} className="p-2 text-center border-r border-neutral-200">
                              {atividade.tem_restricao ? (
                                <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto" />
                              )}
                            </td>
                            <td rowSpan={2} className="p-2 text-neutral-600 border-r border-neutral-200 text-center">
                              {atividade.responsavel_nome || '-'}
                            </td>
                            {DIAS_SEMANA.map((dia) => {
                              const prevKey = `prev_${dia}` as keyof ProgramacaoAtividade;
                              const prev = (atividade[prevKey] as number) || 0;
                              return (
                                <td
                                  key={`prev-${dia}`}
                                  className="p-1 text-center bg-neutral-100 border-r border-neutral-200"
                                >
                                  <div className="text-xs text-neutral-500 mb-0.5">Prev</div>
                                  <div className="font-medium">{prev > 0 ? prev : '-'}</div>
                                </td>
                              );
                            })}
                            <td rowSpan={2} className="p-2 text-center font-bold text-neutral-900 bg-orange-50 border-r border-neutral-200">
                              {totalReal.toFixed(1)} / {totalPrev.toFixed(1)}
                            </td>
                            <td
                              rowSpan={2}
                              className={`p-2 text-center font-bold ${
                                ppcAtividade >= 100
                                  ? 'bg-green-100 text-green-700'
                                  : ppcAtividade >= 70
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {ppcAtividade.toFixed(0)}%
                            </td>
                          </tr>
                          <tr className="bg-white">
                            {DIAS_SEMANA.map((dia) => {
                              const prevKey = `prev_${dia}` as keyof ProgramacaoAtividade;
                              const realKey = `real_${dia}` as keyof ProgramacaoAtividade;
                              const prev = (atividade[prevKey] as number) || 0;
                              const real = (atividade[realKey] as number) || 0;
                              const concluido = real >= prev && prev > 0;
                              const naoConcluido = real < prev && prev > 0;

                              return (
                                <td
                                  key={`real-${dia}`}
                                  className={`p-1 border-r border-neutral-200 ${
                                    concluido
                                      ? 'bg-green-50'
                                      : naoConcluido
                                      ? 'bg-red-50'
                                      : ''
                                  }`}
                                >
                                  <div className="text-xs text-neutral-500 mb-0.5 text-center">
                                    Real
                                  </div>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={real || ''}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      const key = `real_${dia}` as keyof ProgramacaoAtividade;
                                      setAtividades(
                                        atividades.map((a) =>
                                          a.id === atividade.id ? { ...a, [key]: val } : a
                                        )
                                      );
                                    }}
                                    onBlur={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      handleUpdateReal(atividade.id, dia, val, prev);
                                    }}
                                    className={`w-full p-1 text-center border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                      concluido
                                        ? 'border-green-300 bg-green-50'
                                        : naoConcluido
                                        ? 'border-red-300 bg-red-50'
                                        : 'border-neutral-200'
                                    }`}
                                    placeholder="-"
                                    disabled={prev === 0}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {!modoTV && metricas && Object.values(metricas.causas_6m).some((v) => v > 0) && (
              <div className="bg-white rounded-xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Causas de Não Cumprimento (6M + S)
                </h3>
                <div className="flex flex-wrap gap-3">
                  {(Object.entries(metricas.causas_6m) as [Causa6M, number][])
                    .filter(([, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([causa, count]) => (
                      <div
                        key={causa}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{ backgroundColor: `${CAUSAS_6M_CORES[causa]}20` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CAUSAS_6M_CORES[causa] }}
                        />
                        <span className="font-medium">{CAUSAS_6M_LABEL[causa]}</span>
                        <span
                          className="px-2 py-0.5 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: CAUSAS_6M_CORES[causa] }}
                        >
                          {count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {causaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="font-semibold text-lg">Registrar Causa de Não Cumprimento</h3>
              <p className="text-sm text-neutral-500 mt-1">
                A atividade não atingiu a meta prevista. Selecione a causa principal.
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(CAUSAS_6M_LABEL) as Causa6M[]).map((causa) => (
                  <button
                    key={causa}
                    onClick={() => setCausaSelecionada(causa)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      causaSelecionada === causa
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CAUSAS_6M_CORES[causa] }}
                      />
                      <span className="font-medium text-sm">{CAUSAS_6M_LABEL[causa]}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  value={causaDescricao}
                  onChange={(e) => setCausaDescricao(e.target.value)}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descreva o motivo do não cumprimento..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setCausaModal(null);
                  setCausaSelecionada(null);
                  setCausaDescricao('');
                }}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarCausa}
                disabled={!causaSelecionada}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showInterferenciaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Registrar Interferência</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  Registre ocorrências que afetaram o andamento das atividades
                </p>
              </div>
              <button
                onClick={() => setShowInterferenciaModal(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Atividade Afetada (opcional)
                </label>
                <select
                  value={novaInterferencia.atividade_id}
                  onChange={(e) => setNovaInterferencia({...novaInterferencia, atividade_id: e.target.value})}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Geral - Afeta toda a programação</option>
                  {atividades.map(ativ => (
                    <option key={ativ.id} value={ativ.id}>{ativ.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo de Empresa
                </label>
                <div className="flex gap-2">
                  {(Object.keys(TIPO_EMPRESA_LABEL) as TipoEmpresa[]).map(tipo => (
                    <button
                      key={tipo}
                      onClick={() => setNovaInterferencia({...novaInterferencia, tipo_empresa: tipo})}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        novaInterferencia.tipo_empresa === tipo
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      {TIPO_EMPRESA_LABEL[tipo]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Nome da Empresa (opcional)
                </label>
                <input
                  type="text"
                  value={novaInterferencia.empresa}
                  onChange={(e) => setNovaInterferencia({...novaInterferencia, empresa: e.target.value})}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome da empresa envolvida"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Descrição da Interferência *
                </label>
                <textarea
                  value={novaInterferencia.descricao}
                  onChange={(e) => setNovaInterferencia({...novaInterferencia, descricao: e.target.value})}
                  className="w-full p-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Descreva a interferência que ocorreu, seu impacto e possíveis ações..."
                />
              </div>
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowInterferenciaModal(false);
                  setNovaInterferencia({
                    atividade_id: '',
                    tipo_empresa: 'CONTRATADA',
                    empresa: '',
                    descricao: '',
                  });
                }}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarInterferencia}
                disabled={savingInterferencia || !novaInterferencia.descricao.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                {savingInterferencia ? 'Registrando...' : 'Registrar Interferência'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoricoInterferencias && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold text-lg">Histórico de Interferências</h3>
              <button
                onClick={() => setShowHistoricoInterferencias(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {interferencias.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  Nenhuma interferência registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {interferencias.map((interf) => (
                    <div key={interf.id} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              interf.tipo_empresa === 'CONTRATADA' ? 'bg-blue-100 text-blue-700' :
                              interf.tipo_empresa === 'CONTRATANTE' ? 'bg-green-100 text-green-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {TIPO_EMPRESA_LABEL[interf.tipo_empresa]}
                            </span>
                            {interf.empresa_nome && (
                              <span className="text-sm text-neutral-500">{interf.empresa_nome}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              interf.status === 'ABERTA' ? 'bg-red-100 text-red-700' :
                              interf.status === 'RESOLVIDA' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {interf.status}
                            </span>
                          </div>
                          <p className="text-neutral-900">{interf.descricao}</p>
                          <div className="text-sm text-neutral-500 mt-2 flex items-center gap-4">
                            <span>Por: {interf.usuario_nome}</span>
                            <span>{format(new Date(interf.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                          {interf.convertida_restricao ? (
                            <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                              <ArrowRight className="w-4 h-4" />
                              Convertida em restrição
                            </div>
                          ) : interf.status === 'ABERTA' && (
                            <div className="mt-3">
                              <button
                                onClick={() => handleConverterEmRestricao(interf)}
                                disabled={convertendoInterferencia === interf.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                              >
                                <ArrowRight className="w-4 h-4" />
                                {convertendoInterferencia === interf.id ? 'Convertendo...' : 'Converter em Restrição'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => setShowHistoricoInterferencias(false)}
                className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInCheckOutPage;
