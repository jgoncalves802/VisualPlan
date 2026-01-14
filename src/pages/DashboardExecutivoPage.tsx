import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  ClipboardList,
  FileCheck,
  RefreshCw,
  Maximize2,
  X,
  Loader2,
  Layers,
  Package,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAuthStore } from '../stores/authStore';
import { useTemaStore } from '../stores/temaStore';
import DashboardSection from '../components/ui/DashboardSection';
import MiniKPICard from '../components/ui/MiniKPICard';
import ProgressBar from '../components/ui/ProgressBar';
import StatusBadge from '../components/ui/StatusBadge';
import {
  dashboardExecutivoService,
  DashboardExecutivoKPIs,
  CurvaSItem,
  AtividadeCritica,
  Marco,
  PPCHistorico,
  Acao5W2HResumo,
  AuditoriaResumo,
  ProjetoRanking,
} from '../services/dashboardExecutivoService';
import { formatDateOnly } from '../utils/dateHelpers';

interface ProjetoSelecionado {
  id?: string;
  nome?: string;
}

const DashboardExecutivoPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { tema } = useTemaStore();
  const empresaId = usuario?.empresaId;
  const [projetoSelecionado] = useState<ProjetoSelecionado | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [kpis, setKpis] = useState<DashboardExecutivoKPIs | null>(null);
  const [curvaS, setCurvaS] = useState<CurvaSItem[]>([]);
  const [atividadesCriticas, setAtividadesCriticas] = useState<AtividadeCritica[]>([]);
  const [marcos, setMarcos] = useState<Marco[]>([]);
  const [ppcHistorico, setPpcHistorico] = useState<PPCHistorico[]>([]);
  const [acoesRecentes, setAcoesRecentes] = useState<Acao5W2HResumo[]>([]);
  const [auditoriasRecentes, setAuditoriasRecentes] = useState<AuditoriaResumo[]>([]);
  const [portfolioRanking, setPortfolioRanking] = useState<ProjetoRanking[]>([]);

  const loadData = useCallback(async () => {
    if (!empresaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const projetoId = projetoSelecionado?.id;

      const [
        kpisData,
        curvaSData,
        atividadesData,
        marcosData,
        ppcData,
        acoesData,
        auditoriasData,
        portfolioData,
      ] = await Promise.all([
        dashboardExecutivoService.getKPIs(empresaId, projetoId),
        dashboardExecutivoService.getCurvaS(empresaId, projetoId),
        dashboardExecutivoService.getAtividadesCriticas(empresaId, projetoId),
        dashboardExecutivoService.getMarcos(empresaId, projetoId),
        dashboardExecutivoService.getPPCHistorico(empresaId),
        dashboardExecutivoService.getAcoesRecentes(empresaId),
        dashboardExecutivoService.getAuditoriasRecentes(empresaId),
        dashboardExecutivoService.getPortfolioRanking(empresaId),
      ]);

      setKpis(kpisData);
      setCurvaS(curvaSData);
      setAtividadesCriticas(atividadesData);
      setMarcos(marcosData);
      setPpcHistorico(ppcData);
      setAcoesRecentes(acoesData);
      setAuditoriasRecentes(auditoriasData);
      setPortfolioRanking(portfolioData);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId, projetoSelecionado?.id]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const togglePresentationMode = () => {
    setPresentationMode(!presentationMode);
    document.body.style.overflow = presentationMode ? 'auto' : 'hidden';
  };

  const getSPIColor = (spi: number) => {
    if (spi >= 1) return 'success';
    if (spi >= 0.9) return 'warning';
    return 'danger';
  };

  const getCPIColor = (cpi: number) => {
    if (cpi >= 1) return 'success';
    if (cpi >= 0.9) return 'warning';
    return 'danger';
  };

  const getMarcoStatusBadge = (status: Marco['status']) => {
    switch (status) {
      case 'concluido':
        return <StatusBadge status="success" text="Concluído" />;
      case 'em_dia':
        return <StatusBadge status="info" text="Em dia" />;
      case 'atrasado':
        return <StatusBadge status="danger" text="Atrasado" />;
      default:
        return <StatusBadge status="neutral" text="Pendente" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ backgroundColor: tema.background }}>
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: tema.primary }} />
          <p className="text-sm text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const DashboardContent = () => (
    <div className="p-6 space-y-6 h-full overflow-auto" style={{ backgroundColor: tema.background }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Executivo
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {projetoSelecionado ? `Projeto: ${projetoSelecionado.nome}` : 'Visão geral de todos os projetos'}
            {' • '}
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            className="btn btn-outline flex items-center space-x-2"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={togglePresentationMode}
            className="btn btn-outline flex items-center space-x-2"
          >
            {presentationMode ? <X size={18} /> : <Maximize2 size={18} />}
            <span>{presentationMode ? 'Sair' : 'Apresentação'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MiniKPICard
          title="SPI"
          value={kpis?.spi?.toFixed(2) || '1.00'}
          icon={TrendingUp}
          color={getSPIColor(kpis?.spi || 1)}
          subtitle="Cronograma"
        />
        <MiniKPICard
          title="CPI"
          value={kpis?.cpi?.toFixed(2) || '1.00'}
          icon={TrendingDown}
          color={getCPIColor(kpis?.cpi || 1)}
          subtitle="Custo"
        />
        <MiniKPICard
          title="Avanço Físico"
          value={`${kpis?.avancoFisico?.toFixed(1) || 0}%`}
          icon={Target}
          color="neutral"
          subtitle={`${kpis?.atividadesConcluidas || 0}/${kpis?.atividadesTotal || 0} ativ.`}
        />
        <MiniKPICard
          title="PPC"
          value={`${kpis?.ppc?.toFixed(1) || 0}%`}
          icon={CheckCircle2}
          color={kpis?.ppc && kpis.ppc >= 80 ? 'success' : kpis?.ppc && kpis.ppc >= 60 ? 'warning' : 'danger'}
          subtitle="Last Planner"
        />
        <MiniKPICard
          title="Restrições"
          value={kpis?.restricoesAtivas || 0}
          icon={AlertTriangle}
          color={kpis?.restricoesImpeditivas && kpis.restricoesImpeditivas > 0 ? 'danger' : 'warning'}
          subtitle={`${kpis?.restricoesImpeditivas || 0} impeditivas`}
        />
        <MiniKPICard
          title="Ações Abertas"
          value={kpis?.acoesAbertas || 0}
          icon={ClipboardList}
          color={kpis?.acoesVencidas && kpis.acoesVencidas > 0 ? 'danger' : 'neutral'}
          subtitle={`${kpis?.acoesVencidas || 0} vencidas`}
        />
      </div>

      <DashboardSection
        title="Cronograma & EVM"
        icon={BarChart3}
        iconColor="#374151"
        iconBgColor="#F3F4F6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Curva S - Avanço Físico</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={curvaS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="periodo" tick={{ fontSize: 12 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planejado"
                  stroke="#6B7280"
                  strokeWidth={2}
                  dot={false}
                  name="Planejado"
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke="#374151"
                  strokeWidth={2}
                  dot={{ fill: '#374151', r: 3 }}
                  name="Realizado"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Atividades Críticas</h4>
            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Código</th>
                    <th className="text-left py-2 px-2 font-medium text-gray-600">Atividade</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">%</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-600">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesCriticas.length > 0 ? (
                    atividadesCriticas.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100 hover:bg-gray-100">
                        <td className="py-2 px-2 font-mono text-xs text-gray-700">{a.codigo}</td>
                        <td className="py-2 px-2 text-gray-800 truncate max-w-[200px]">{a.nome}</td>
                        <td className="py-2 px-2 text-right text-gray-700">{a.percentual}%</td>
                        <td className="py-2 px-2 text-right">
                          {a.atraso > 0 ? (
                            <span className="text-red-600 font-medium">{a.atraso}d</span>
                          ) : (
                            <span className="text-green-600">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-gray-500">
                        Nenhuma atividade crítica encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Marcos do Projeto</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {marcos.length > 0 ? (
              marcos.slice(0, 6).map((m) => (
                <div key={m.id} className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-gray-800 truncate mb-1">{m.nome}</p>
                  <p className="text-xs text-gray-500 mb-2">{formatDateOnly(new Date(m.data))}</p>
                  {getMarcoStatusBadge(m.status)}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-4">
                Nenhum marco cadastrado
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="LPS & Restrições"
        icon={AlertCircle}
        iconColor="#6B7280"
        iconBgColor="#F9FAFB"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">PPC Semanal</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ppcHistorico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} stroke="#6B7280" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#6B7280" />
                <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="ppc" fill="#374151" radius={[4, 4, 0, 0]} name="PPC" />
                <Line type="monotone" dataKey="meta" stroke="#9CA3AF" strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Restrições por Categoria (Ishikawa 6M)</h4>
            <div className="space-y-3">
              {kpis?.restricoesPorCategoria && kpis.restricoesPorCategoria.length > 0 ? (
                kpis.restricoesPorCategoria.map((r) => (
                  <ProgressBar
                    key={r.categoria}
                    label={r.label}
                    value={(r.count / (kpis.restricoesAtivas || 1)) * 100}
                    showValue={false}
                    color={r.color}
                    size="sm"
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma restrição cadastrada</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-600">TMR (Tempo Médio Remoção)</span>
              <span className="font-semibold text-gray-800">{kpis?.tmr?.toFixed(1) || 0} dias</span>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Medições & Take-off"
        icon={Package}
        iconColor="#4B5563"
        iconBgColor="#F3F4F6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Período de Medição Atual</h4>
            {kpis?.medicaoAtual ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Período</span>
                  <span className="font-semibold text-gray-800">#{kpis.medicaoAtual.periodoNumero}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vigência</span>
                  <span className="text-gray-800">
                    {formatDateOnly(new Date(kpis.medicaoAtual.dataInicio))} - {formatDateOnly(new Date(kpis.medicaoAtual.dataFim))}
                  </span>
                </div>
                <ProgressBar
                  label="Avanço Acumulado"
                  value={kpis.medicaoAtual.avancoAcumulado}
                  color="#374151"
                />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <StatusBadge
                    status={kpis.medicaoAtual.statusAprovacao === 'aprovado' ? 'success' : 'warning'}
                    text={kpis.medicaoAtual.statusAprovacao}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">Nenhum período de medição configurado</p>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Avanço por Disciplina (Take-off)</h4>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Avanço Geral</span>
                <span className="font-bold text-lg text-gray-800">{kpis?.takeoffAvancoGeral?.toFixed(1) || 0}%</span>
              </div>
              <ProgressBar value={kpis?.takeoffAvancoGeral || 0} showValue={false} color="#374151" />
            </div>
            <div className="space-y-2">
              {kpis?.takeoffPorDisciplina && kpis.takeoffPorDisciplina.length > 0 ? (
                kpis.takeoffPorDisciplina.slice(0, 4).map((d) => (
                  <div key={d.disciplina} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm text-gray-700 flex-1">{d.disciplina}</span>
                    <span className="text-sm font-medium text-gray-800">{d.avanco}%</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-2">Nenhuma disciplina configurada</p>
              )}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Gestão & Qualidade"
        icon={FileCheck}
        iconColor="#374151"
        iconBgColor="#F9FAFB"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Ações 5W2H Pendentes</h4>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {acoesRecentes.length > 0 ? (
                acoesRecentes.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.titulo}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span className="text-gray-500">{a.responsavel}</span>
                      <span className="text-gray-600">{formatDateOnly(new Date(a.prazo))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma ação pendente</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Solicitações de Mudança</h4>
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-gray-800 mb-1">{kpis?.mudancasPendentes || 0}</div>
              <p className="text-sm text-gray-500">pendentes de análise</p>
              <div className="mt-4 text-sm text-gray-600">
                Total: {kpis?.mudancasTotal || 0} mudanças
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Auditorias Recentes</h4>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {auditoriasRecentes.length > 0 ? (
                auditoriasRecentes.map((a) => (
                  <div key={a.id} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.titulo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{formatDateOnly(new Date(a.data))}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-semibold text-gray-700">{a.conformidade.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">Nenhuma auditoria recente</p>
              )}
            </div>
            {kpis?.conformidadeMedia !== undefined && kpis.conformidadeMedia > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Conformidade Média</span>
                  <span className="font-semibold text-gray-800">{kpis.conformidadeMedia.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Portfolio de Projetos"
        icon={Layers}
        iconColor="#6B7280"
        iconBgColor="#F3F4F6"
      >
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Ranking de Priorização</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Projeto</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">Score</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">SPI</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-600">CPI</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRanking.length > 0 ? (
                  portfolioRanking.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-100">
                      <td className="py-2 px-3">
                        <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold">
                          {p.prioridade}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-800 font-medium">{p.nome}</td>
                      <td className="py-2 px-3 text-right font-semibold text-gray-700">{p.score.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{p.spi.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-gray-600">{p.cpi.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-500">
                      Nenhum projeto no portfolio
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardSection>
    </div>
  );

  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto">
        <DashboardContent />
      </div>
    );
  }

  return <DashboardContent />;
};

export default DashboardExecutivoPage;
