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
  ChevronDown,
  Building2,
  FolderKanban,
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
import { epsService, EpsNode } from '../services/epsService';
import { formatDateOnly } from '../utils/dateHelpers';

interface ProjetoSelecionado {
  id: string | undefined;
  nome: string;
}

const DashboardExecutivoPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { tema } = useTemaStore();
  const empresaId = usuario?.empresaId;
  
  const [projetos, setProjetos] = useState<EpsNode[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState<ProjetoSelecionado>({ id: undefined, nome: 'Todos os Projetos' });
  const [showProjetoDropdown, setShowProjetoDropdown] = useState(false);
  
  const handleSelectProjeto = (projeto: ProjetoSelecionado) => {
    setProjetoSelecionado(projeto);
    setShowProjetoDropdown(false);
  };

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

  useEffect(() => {
    const loadProjetos = async () => {
      if (!empresaId) return;
      try {
        const nodes = await epsService.getByEmpresa(empresaId);
        const projetosAtivos = nodes.filter(n => n.nivel === 1 && n.ativo);
        setProjetos(projetosAtivos);
      } catch (error) {
        console.error('Erro ao carregar projetos:', error);
      }
    };
    loadProjetos();
  }, [empresaId]);

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
          <h1 className="text-2xl font-bold" style={{ color: tema.text }}>
            Dashboard Executivo
          </h1>
          <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setShowProjetoDropdown(!showProjetoDropdown)}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all"
              style={{ 
                borderColor: tema.primary,
                backgroundColor: tema.surface,
                color: tema.text
              }}
            >
              {projetoSelecionado.id ? (
                <FolderKanban size={18} style={{ color: tema.primary }} />
              ) : (
                <Building2 size={18} style={{ color: tema.primary }} />
              )}
              <span className="font-medium max-w-[200px] truncate">{projetoSelecionado.nome}</span>
              <ChevronDown size={16} className={`transition-transform ${showProjetoDropdown ? 'rotate-180' : ''}`} />
            </button>
            {showProjetoDropdown && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-lg shadow-xl z-50 border overflow-hidden"
                style={{ backgroundColor: tema.surface, borderColor: tema.border }}
              >
                <div className="py-1">
                  <button
                    onClick={() => handleSelectProjeto({ id: undefined, nome: 'Todos os Projetos' })}
                    className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${!projetoSelecionado.id ? 'bg-gray-50' : ''}`}
                  >
                    <Building2 size={18} style={{ color: tema.primary }} />
                    <div>
                      <p className="font-medium" style={{ color: tema.text }}>Todos os Projetos</p>
                      <p className="text-xs" style={{ color: tema.textSecondary }}>Visão consolidada da empresa</p>
                    </div>
                  </button>
                  {projetos.length > 0 && (
                    <div className="border-t" style={{ borderColor: tema.border }}>
                      <p className="px-4 py-2 text-xs font-semibold uppercase" style={{ color: tema.textSecondary }}>
                        Projetos Ativos
                      </p>
                      {projetos.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProjeto({ id: p.id, nome: p.nome })}
                          className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors hover:bg-gray-50 ${projetoSelecionado.id === p.id ? 'bg-gray-50' : ''}`}
                        >
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.cor || tema.primary }} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate" style={{ color: tema.text }}>{p.nome}</p>
                            <p className="text-xs truncate" style={{ color: tema.textSecondary }}>{p.codigo}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={loadData}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
            style={{ borderColor: tema.border, color: tema.text }}
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} style={{ color: tema.primary }} />
            <span>Atualizar</span>
          </button>
          <button
            onClick={togglePresentationMode}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: tema.primary, color: '#ffffff' }}
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
        iconColor={tema.primary}
        iconBgColor={`${tema.primary}15`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Curva S - Avanço Físico</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={curvaS}>
                <CartesianGrid strokeDasharray="3 3" stroke={tema.border} />
                <XAxis dataKey="periodo" tick={{ fontSize: 12, fill: tema.textSecondary }} stroke={tema.border} />
                <YAxis tick={{ fontSize: 12, fill: tema.textSecondary }} stroke={tema.border} />
                <Tooltip
                  contentStyle={{ backgroundColor: tema.surface, border: `1px solid ${tema.border}` }}
                  formatter={(value: number) => [`${value}%`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planejado"
                  stroke={tema.secondary}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Planejado"
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke={tema.primary}
                  strokeWidth={3}
                  dot={{ fill: tema.primary, r: 4 }}
                  name="Realizado"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Atividades Críticas</h4>
            <div className="overflow-x-auto max-h-[220px]">
              <table className="w-full text-sm">
                <thead className="sticky top-0" style={{ backgroundColor: tema.surface }}>
                  <tr style={{ borderBottom: `1px solid ${tema.border}` }}>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: tema.textSecondary }}>Código</th>
                    <th className="text-left py-2 px-2 font-medium" style={{ color: tema.textSecondary }}>Atividade</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: tema.textSecondary }}>%</th>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: tema.textSecondary }}>Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesCriticas.length > 0 ? (
                    atividadesCriticas.map((a) => (
                      <tr key={a.id} className="hover:opacity-80" style={{ borderBottom: `1px solid ${tema.border}` }}>
                        <td className="py-2 px-2 font-mono text-xs" style={{ color: tema.primary }}>{a.codigo}</td>
                        <td className="py-2 px-2 truncate max-w-[200px]" style={{ color: tema.text }}>{a.nome}</td>
                        <td className="py-2 px-2 text-right" style={{ color: tema.textSecondary }}>{a.percentual}%</td>
                        <td className="py-2 px-2 text-right">
                          {a.atraso > 0 ? (
                            <span className="font-medium" style={{ color: tema.danger }}>{a.atraso}d</span>
                          ) : (
                            <span style={{ color: tema.success }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center" style={{ color: tema.textSecondary }}>
                        Nenhuma atividade crítica encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
          <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Marcos do Projeto</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {marcos.length > 0 ? (
              marcos.slice(0, 6).map((m) => (
                <div key={m.id} className="rounded-lg p-3" style={{ backgroundColor: tema.background, border: `1px solid ${tema.border}` }}>
                  <p className="text-xs font-medium truncate mb-1" style={{ color: tema.text }}>{m.nome}</p>
                  <p className="text-xs mb-2" style={{ color: tema.textSecondary }}>{formatDateOnly(new Date(m.data))}</p>
                  {getMarcoStatusBadge(m.status)}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-4" style={{ color: tema.textSecondary }}>
                Nenhum marco cadastrado
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="LPS & Restrições"
        icon={AlertCircle}
        iconColor={tema.warning}
        iconBgColor={`${tema.warning}15`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>PPC Semanal</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ppcHistorico}>
                <CartesianGrid strokeDasharray="3 3" stroke={tema.border} />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: tema.textSecondary }} stroke={tema.border} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: tema.textSecondary }} stroke={tema.border} />
                <Tooltip contentStyle={{ backgroundColor: tema.surface, border: `1px solid ${tema.border}` }} />
                <Bar dataKey="ppc" fill={tema.primary} radius={[4, 4, 0, 0]} name="PPC" />
                <Line type="monotone" dataKey="meta" stroke={tema.warning} strokeDasharray="5 5" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Restrições por Categoria (Ishikawa 6M)</h4>
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
                <p className="text-center py-4" style={{ color: tema.textSecondary }}>Nenhuma restrição cadastrada</p>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span style={{ color: tema.textSecondary }}>TMR (Tempo Médio Remoção)</span>
              <span className="font-semibold" style={{ color: tema.text }}>{kpis?.tmr?.toFixed(1) || 0} dias</span>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Medições & Take-off"
        icon={Package}
        iconColor={tema.secondary}
        iconBgColor={`${tema.secondary}15`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Período de Medição Atual</h4>
            {kpis?.medicaoAtual ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span style={{ color: tema.textSecondary }}>Período</span>
                  <span className="font-semibold" style={{ color: tema.primary }}>#{kpis.medicaoAtual.periodoNumero}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: tema.textSecondary }}>Vigência</span>
                  <span style={{ color: tema.text }}>
                    {formatDateOnly(new Date(kpis.medicaoAtual.dataInicio))} - {formatDateOnly(new Date(kpis.medicaoAtual.dataFim))}
                  </span>
                </div>
                <ProgressBar
                  label="Avanço Acumulado"
                  value={kpis.medicaoAtual.avancoAcumulado}
                  color={tema.primary}
                />
                <div className="flex items-center justify-between">
                  <span style={{ color: tema.textSecondary }}>Status</span>
                  <StatusBadge
                    status={kpis.medicaoAtual.statusAprovacao === 'aprovado' ? 'success' : 'warning'}
                    text={kpis.medicaoAtual.statusAprovacao}
                  />
                </div>
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: tema.textSecondary }}>Nenhum período de medição configurado</p>
            )}
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Avanço por Disciplina (Take-off)</h4>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ color: tema.textSecondary }}>Avanço Geral</span>
                <span className="font-bold text-lg" style={{ color: tema.primary }}>{kpis?.takeoffAvancoGeral?.toFixed(1) || 0}%</span>
              </div>
              <ProgressBar value={kpis?.takeoffAvancoGeral || 0} showValue={false} color={tema.primary} />
            </div>
            <div className="space-y-2">
              {kpis?.takeoffPorDisciplina && kpis.takeoffPorDisciplina.length > 0 ? (
                kpis.takeoffPorDisciplina.slice(0, 4).map((d) => (
                  <div key={d.disciplina} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm flex-1" style={{ color: tema.text }}>{d.disciplina}</span>
                    <span className="text-sm font-medium" style={{ color: tema.primary }}>{d.avanco}%</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-2" style={{ color: tema.textSecondary }}>Nenhuma disciplina configurada</p>
              )}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Gestão & Qualidade"
        icon={FileCheck}
        iconColor={tema.success}
        iconBgColor={`${tema.success}15`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Ações 5W2H Pendentes</h4>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {acoesRecentes.length > 0 ? (
                acoesRecentes.map((a) => (
                  <div key={a.id} className="rounded-lg p-3" style={{ backgroundColor: tema.background, border: `1px solid ${tema.border}` }}>
                    <p className="text-sm font-medium truncate" style={{ color: tema.text }}>{a.titulo}</p>
                    <div className="flex items-center justify-between mt-2 text-xs">
                      <span style={{ color: tema.textSecondary }}>{a.responsavel}</span>
                      <span style={{ color: tema.primary }}>{formatDateOnly(new Date(a.prazo))}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4" style={{ color: tema.textSecondary }}>Nenhuma ação pendente</p>
              )}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Solicitações de Mudança</h4>
            <div className="text-center py-4">
              <div className="text-4xl font-bold mb-1" style={{ color: tema.primary }}>{kpis?.mudancasPendentes || 0}</div>
              <p className="text-sm" style={{ color: tema.textSecondary }}>pendentes de análise</p>
              <div className="mt-4 text-sm" style={{ color: tema.text }}>
                Total: {kpis?.mudancasTotal || 0} mudanças
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
            <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Auditorias Recentes</h4>
            <div className="space-y-3 max-h-[200px] overflow-auto">
              {auditoriasRecentes.length > 0 ? (
                auditoriasRecentes.map((a) => (
                  <div key={a.id} className="rounded-lg p-3" style={{ backgroundColor: tema.background, border: `1px solid ${tema.border}` }}>
                    <p className="text-sm font-medium truncate" style={{ color: tema.text }}>{a.titulo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs" style={{ color: tema.textSecondary }}>{formatDateOnly(new Date(a.data))}</span>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-semibold" style={{ color: tema.success }}>{a.conformidade.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4" style={{ color: tema.textSecondary }}>Nenhuma auditoria recente</p>
              )}
            </div>
            {kpis?.conformidadeMedia !== undefined && kpis.conformidadeMedia > 0 && (
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${tema.border}` }}>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: tema.textSecondary }}>Conformidade Média</span>
                  <span className="font-semibold" style={{ color: tema.success }}>{kpis.conformidadeMedia.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      <DashboardSection
        title="Portfolio de Projetos"
        icon={Layers}
        iconColor={tema.accent}
        iconBgColor={`${tema.accent}15`}
      >
        <div className="rounded-lg p-4" style={{ backgroundColor: tema.surface }}>
          <h4 className="text-sm font-semibold mb-4" style={{ color: tema.text }}>Ranking de Priorização</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${tema.border}` }}>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: tema.textSecondary }}>#</th>
                  <th className="text-left py-2 px-3 font-medium" style={{ color: tema.textSecondary }}>Projeto</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: tema.textSecondary }}>Score</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: tema.textSecondary }}>SPI</th>
                  <th className="text-right py-2 px-3 font-medium" style={{ color: tema.textSecondary }}>CPI</th>
                </tr>
              </thead>
              <tbody>
                {portfolioRanking.length > 0 ? (
                  portfolioRanking.map((p, index) => (
                    <tr key={p.id} className="hover:opacity-80" style={{ borderBottom: `1px solid ${tema.border}` }}>
                      <td className="py-2 px-3">
                        <span 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ 
                            backgroundColor: index === 0 ? tema.primary : index === 1 ? tema.secondary : tema.accent,
                            color: '#ffffff'
                          }}
                        >
                          {p.prioridade}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium" style={{ color: tema.text }}>{p.nome}</td>
                      <td className="py-2 px-3 text-right font-semibold" style={{ color: tema.primary }}>{p.score.toFixed(1)}</td>
                      <td className="py-2 px-3 text-right" style={{ color: p.spi >= 1 ? tema.success : p.spi >= 0.9 ? tema.warning : tema.danger }}>{p.spi.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right" style={{ color: p.cpi >= 1 ? tema.success : p.cpi >= 0.9 ? tema.warning : tema.danger }}>{p.cpi.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center" style={{ color: tema.textSecondary }}>
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
