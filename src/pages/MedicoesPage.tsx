import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  Settings, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Save,
  RefreshCw,
  Download,
  User,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { parseDateOnly } from '../utils/dateHelpers';
import { useAuthStore } from '../stores/authStore';
import { useEpsStore } from '../stores/epsStore';
import { medicoesService } from '../services/medicoesService';
import { useToast } from '../components/ui/Toast';
import type { 
  MedicoesConfig, 
  MedicoesPeriodo, 
  MedicoesAvanco,
  StatusPeriodo,
  StatusAvanco
} from '../types/medicoes.types';
import type { EpsNode } from '../services/epsService';

type TabType = 'periodos' | 'avancos' | 'aprovacoes' | 'relatorios' | 'configuracoes';

const statusPeriodoLabels: Record<StatusPeriodo, string> = {
  aberto: 'Aberto',
  em_medicao: 'Em Medição',
  aguardando_aprovacao: 'Aguardando Aprovação',
  aprovado: 'Aprovado',
  fechado: 'Fechado',
};

const statusPeriodoColors: Record<StatusPeriodo, string> = {
  aberto: 'bg-gray-100 text-gray-700',
  em_medicao: 'bg-gray-200 text-gray-800',
  aguardando_aprovacao: 'bg-gray-300 text-gray-900',
  aprovado: 'bg-gray-800 text-white',
  fechado: 'bg-gray-400 text-gray-900',
};

const statusAvancoLabels: Record<StatusAvanco, string> = {
  pendente: 'Pendente',
  supervisor_aprovado: 'Supervisor Aprovou',
  fiscal_aprovado: 'Fiscal Aprovou',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const statusAvancoColors: Record<StatusAvanco, string> = {
  pendente: 'bg-gray-100 text-gray-700',
  supervisor_aprovado: 'bg-gray-200 text-gray-800',
  fiscal_aprovado: 'bg-gray-300 text-gray-900',
  aprovado: 'bg-gray-800 text-white',
  rejeitado: 'bg-red-100 text-red-800',
};

const MedicoesPage: React.FC = () => {
  const toast = useToast();
  const { usuario } = useAuthStore();
  const { projetos, loadProjetos } = useEpsStore();

  const [activeTab, setActiveTab] = useState<TabType>('periodos');
  const [isLoading, setIsLoading] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState<EpsNode | null>(null);

  const [config, setConfig] = useState<MedicoesConfig | null>(null);
  const [periodos, setPeriodos] = useState<MedicoesPeriodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<MedicoesPeriodo | null>(null);
  const [avancos, setAvancos] = useState<MedicoesAvanco[]>([]);

  const [configForm, setConfigForm] = useState({
    diaInicio: 1,
    diaFim: 25,
    prazoInicio: '',
    prazoFim: '',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  useEffect(() => {
    if (usuario?.empresaId && projetos.length === 0) {
      loadProjetos(usuario.empresaId);
    }
  }, [usuario?.empresaId, projetos.length, loadProjetos]);

  const loadData = useCallback(async () => {
    if (!projetoSelecionado) return;
    
    setIsLoading(true);
    try {
      const [configData, periodosData] = await Promise.all([
        medicoesService.getConfig(projetoSelecionado.id),
        medicoesService.getPeriodos(projetoSelecionado.id),
      ]);

      setConfig(configData);
      setPeriodos(periodosData);

      if (configData) {
        setConfigForm({
          diaInicio: configData.diaInicioPeriodo,
          diaFim: configData.diaFimPeriodo,
          prazoInicio: configData.prazoContratualInicio 
            ? format(configData.prazoContratualInicio, 'yyyy-MM-dd') 
            : '',
          prazoFim: configData.prazoContratualFim 
            ? format(configData.prazoContratualFim, 'yyyy-MM-dd') 
            : '',
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      toast.error('Erro ao carregar dados de medições');
    } finally {
      setIsLoading(false);
    }
  }, [projetoSelecionado, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAvancos = useCallback(async (periodoId: string) => {
    try {
      const data = await medicoesService.getAvancos(periodoId);
      setAvancos(data);
    } catch (err) {
      console.error('Erro ao carregar avanços:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      loadAvancos(selectedPeriodo.id);
    } else {
      setAvancos([]);
    }
  }, [selectedPeriodo, loadAvancos]);

  const handleSaveConfig = async () => {
    if (!projetoSelecionado || !usuario?.empresaId) return;

    setIsSavingConfig(true);
    try {
      const configData = await medicoesService.upsertConfig({
        projetoId: projetoSelecionado.id,
        empresaId: usuario.empresaId,
        diaInicioPeriodo: configForm.diaInicio,
        diaFimPeriodo: configForm.diaFim,
        prazoContratualInicio: configForm.prazoInicio ? parseDateOnly(configForm.prazoInicio) ?? undefined : undefined,
        prazoContratualFim: configForm.prazoFim ? parseDateOnly(configForm.prazoFim) ?? undefined : undefined,
      });

      setConfig(configData);
      toast.success('Configuração salva com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar config:', err);
      toast.error('Erro ao salvar configuração');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleGeneratePeriodos = async () => {
    if (!projetoSelecionado || !usuario?.empresaId || !config) return;

    if (!configForm.prazoInicio || !configForm.prazoFim) {
      toast.error('Defina o prazo contratual antes de gerar os períodos');
      return;
    }

    setIsLoading(true);
    try {
      await medicoesService.deletePeriodosByProjeto(projetoSelecionado.id);

      const periodosGerados = medicoesService.generatePeriodos(
        configForm.diaInicio,
        configForm.diaFim,
        parseDateOnly(configForm.prazoInicio)!,
        parseDateOnly(configForm.prazoFim)!
      );

      const dtos = periodosGerados.map(p => ({
        projetoId: projetoSelecionado.id,
        empresaId: usuario.empresaId!,
        numero: p.numero,
        dataInicio: p.dataInicio,
        dataFim: p.dataFim,
      }));

      const created = await medicoesService.createPeriodosBatch(dtos);
      setPeriodos(created);
      toast.success(`${created.length} períodos gerados com sucesso!`);
    } catch (err) {
      console.error('Erro ao gerar períodos:', err);
      toast.error('Erro ao gerar períodos');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'periodos' as TabType, label: 'Períodos', icon: Calendar },
    { id: 'avancos' as TabType, label: 'Avanços', icon: FileText },
    { id: 'aprovacoes' as TabType, label: 'Aprovações', icon: CheckCircle },
    { id: 'relatorios' as TabType, label: 'Relatórios', icon: Download },
    { id: 'configuracoes' as TabType, label: 'Configurações', icon: Settings },
  ];

  const periodoAtual = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return periodos.find(p => {
      return hoje >= p.dataInicio && hoje <= p.dataFim;
    });
  }, [periodos]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold theme-text flex items-center gap-2">
            <Calendar className="w-7 h-7" />
            Medições
          </h1>
          <p className="text-sm theme-text-secondary mt-1">
            Gestão de períodos de medição e avanços físicos
          </p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={projetoSelecionado?.id || ''}
            onChange={(e) => {
              const proj = projetos.find((p: EpsNode) => p.id === e.target.value);
              setProjetoSelecionado(proj || null);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm theme-bg theme-text focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          >
            <option value="">Selecione um projeto</option>
            {projetos.map((p: EpsNode) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          <button
            onClick={loadData}
            disabled={isLoading || !projetoSelecionado}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {!projetoSelecionado ? (
        <div className="text-center py-12 theme-card rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium theme-text mb-2">Selecione um Projeto</h3>
          <p className="text-sm theme-text-secondary">
            Escolha um projeto para visualizar as medições
          </p>
        </div>
      ) : (
        <div className="theme-card rounded-lg border border-gray-200 p-6">
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuração de Períodos
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium theme-text">Dias do Período</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Dia Início</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={configForm.diaInicio}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, diaInicio: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Dia Fim</label>
                      <input
                        type="number"
                        min={1}
                        max={31}
                        value={configForm.diaFim}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, diaFim: Number(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium theme-text">Prazo Contratual</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Data Início</label>
                      <input
                        type="date"
                        value={configForm.prazoInicio}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, prazoInicio: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Data Fim</label>
                      <input
                        type="date"
                        value={configForm.prazoFim}
                        onChange={(e) => setConfigForm(prev => ({ ...prev, prazoFim: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSavingConfig}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingConfig ? 'Salvando...' : 'Salvar Configuração'}
                </button>

                <button
                  onClick={handleGeneratePeriodos}
                  disabled={isLoading || !config}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Gerar Períodos
                </button>
              </div>

              {periodos.length > 0 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm theme-text-secondary">
                    <strong>{periodos.length}</strong> períodos gerados para este projeto
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'periodos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Períodos de Medição
                </h2>

                {periodoAtual && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      Período atual: <strong>#{periodoAtual.numero}</strong>
                    </span>
                  </div>
                )}
              </div>

              {periodos.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium theme-text mb-2">Nenhum Período Cadastrado</h3>
                  <p className="text-sm theme-text-secondary mb-4">
                    Configure os períodos na aba Configurações
                  </p>
                  <button
                    onClick={() => setActiveTab('configuracoes')}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Ir para Configurações
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Previsto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Medido</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Aprovado</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {periodos.map(periodo => (
                        <tr 
                          key={periodo.id} 
                          className={`hover:bg-gray-50 ${selectedPeriodo?.id === periodo.id ? 'bg-gray-100' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm font-medium theme-text">
                            #{periodo.numero}
                          </td>
                          <td className="px-4 py-3 text-sm theme-text">
                            {format(periodo.dataInicio, 'dd/MM/yyyy')} - {format(periodo.dataFim, 'dd/MM/yyyy')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusPeriodoColors[periodo.status]}`}>
                              {statusPeriodoLabels[periodo.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right theme-text">
                            {periodo.valorPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right theme-text">
                            {periodo.valorMedido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right theme-text">
                            {periodo.valorAprovado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedPeriodo(periodo);
                                setActiveTab('avancos');
                              }}
                              className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                              title="Ver avanços"
                            >
                              <ArrowRight className="w-4 h-4 text-gray-600" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'avancos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Avanços Físicos
                  {selectedPeriodo && (
                    <span className="text-sm font-normal text-gray-500">
                      - Período #{selectedPeriodo.numero}
                    </span>
                  )}
                </h2>

                <select
                  value={selectedPeriodo?.id || ''}
                  onChange={(e) => {
                    const p = periodos.find(per => per.id === e.target.value);
                    setSelectedPeriodo(p || null);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">Selecione um período</option>
                  {periodos.map(p => (
                    <option key={p.id} value={p.id}>
                      #{p.numero} - {format(p.dataInicio, 'dd/MM')} a {format(p.dataFim, 'dd/MM/yyyy')}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedPeriodo ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium theme-text mb-2">Selecione um Período</h3>
                  <p className="text-sm theme-text-secondary">
                    Escolha um período para visualizar os avanços
                  </p>
                </div>
              ) : avancos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium theme-text mb-2">Nenhum Avanço Registrado</h3>
                  <p className="text-sm theme-text-secondary">
                    Os avanços serão capturados do cronograma e mapa de controle
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avanço</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acumulado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registrado Por</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {avancos.map(avanco => (
                        <tr key={avanco.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              avanco.origem === 'cronograma' 
                                ? 'bg-gray-200 text-gray-800' 
                                : 'bg-gray-300 text-gray-900'
                            }`}>
                              {avanco.origem === 'cronograma' ? 'Cronograma' : 'Mapa'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm theme-text">{avanco.descricao}</td>
                          <td className="px-4 py-3 text-sm text-right theme-text">
                            {avanco.percentualAvancado.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-right theme-text">
                            {avanco.percentualAcumulado.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-sm theme-text-secondary">
                            {format(avanco.registradoEm, 'dd/MM/yyyy HH:mm')}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusAvancoColors[avanco.status]}`}>
                              {statusAvancoLabels[avanco.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'aprovacoes' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Fluxo de Aprovações
              </h2>

              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-medium theme-text">Supervisor</h3>
                      <p className="text-xs text-gray-500">1º Nível</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Valida a execução técnica do avanço físico
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-800" />
                    </div>
                    <div>
                      <h3 className="font-medium theme-text">Fiscal</h3>
                      <p className="text-xs text-gray-500">2º Nível</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Confirma conformidade com o projeto
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium theme-text">Proponente</h3>
                      <p className="text-xs text-gray-500">3º Nível</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Aprova para faturamento
                  </p>
                </div>
              </div>

              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm theme-text-secondary">
                  Selecione um avanço para gerenciar suas aprovações
                </p>
              </div>
            </div>
          )}

          {activeTab === 'relatorios' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold theme-text flex items-center gap-2">
                <Download className="w-5 h-5" />
                Relatórios
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium theme-text">Relatório PDF</h3>
                    <p className="text-sm text-gray-500">Exportar medição completa com evidências</p>
                  </div>
                </button>

                <button className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-medium theme-text">Planilha Excel</h3>
                    <p className="text-sm text-gray-500">Dados tabulares para análise</p>
                  </div>
                </button>
              </div>

              <div className="text-center py-8 text-gray-500 text-sm">
                Selecione um período para gerar os relatórios
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicoesPage;
