import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  Briefcase,
  Target,
  ClipboardList,
  RefreshCw,
  GitBranch,
  BookOpen,
  BarChart3,
  Activity,
  Shield,
  FileCheck,
  AlertCircle,
  Wrench
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
  AreaChart,
  Area
} from 'recharts';
import KPICard from '../components/ui/KPICard';
import { useTemaStore } from '../stores/temaStore';
import { SetorDashboard } from '../types/gestao';

interface SectorProps {
  id: SetorDashboard;
  title: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

const CollapsibleSector: React.FC<SectorProps> = ({
  title,
  icon,
  color,
  bgColor,
  children,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 transition-colors hover:opacity-90"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color, color: 'white' }}
          >
            {icon}
          </div>
          <h2 className="text-lg font-bold" style={{ color }}>
            {title}
          </h2>
        </div>
        <div style={{ color }}>
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4 animate-slide-in-up">
          {children}
        </div>
      )}
    </div>
  );
};

const DashboardIndicadoresPage: React.FC = () => {
  const { tema } = useTemaStore();
  const [presentationMode, setPresentationMode] = useState(false);
  const [expandedSectors, setExpandedSectors] = useState<Record<SetorDashboard, boolean>>({
    [SetorDashboard.CRONOGRAMA_EVM]: true,
    [SetorDashboard.PRODUCAO_LPS]: true,
    [SetorDashboard.QUALIDADE]: true,
    [SetorDashboard.RECURSOS]: true,
    [SetorDashboard.GESTAO]: true
  });

  const lastUpdate = new Date().toLocaleString('pt-BR');

  const toggleSector = (sector: SetorDashboard) => {
    setExpandedSectors(prev => ({ ...prev, [sector]: !prev[sector] }));
  };

  const togglePresentationMode = () => {
    setPresentationMode(!presentationMode);
    if (!presentationMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // ============================================================================
  // MOCK DATA - CRONOGRAMA & EVM
  // ============================================================================
  const evmData = {
    spi: 0.95,
    cpi: 1.02,
    eac: 15800000,
    vac: -280000,
    bac: 15520000
  };

  const curvaS = [
    { mes: 'Jan', planejado: 5, realizado: 6 },
    { mes: 'Fev', planejado: 12, realizado: 11 },
    { mes: 'Mar', planejado: 22, realizado: 20 },
    { mes: 'Abr', planejado: 35, realizado: 32 },
    { mes: 'Mai', planejado: 48, realizado: 44 },
    { mes: 'Jun', planejado: 62, realizado: 56 },
    { mes: 'Jul', planejado: 75, realizado: 68 },
    { mes: 'Ago', planejado: 85, realizado: 78 }
  ];

  const atividadesAtrasadas = [
    { id: '1.2.3.1', nome: 'Fundação Bloco A', atraso: 12, responsavel: 'João Silva' },
    { id: '1.3.2.4', nome: 'Estrutura Metálica P2', atraso: 8, responsavel: 'Maria Santos' },
    { id: '2.1.1.3', nome: 'Instalações Elétricas', atraso: 6, responsavel: 'Carlos Lima' },
    { id: '1.4.5.2', nome: 'Acabamento Interno', atraso: 5, responsavel: 'Ana Costa' },
    { id: '2.2.3.1', nome: 'Sistema HVAC', atraso: 4, responsavel: 'Pedro Souza' }
  ];

  // ============================================================================
  // MOCK DATA - PRODUÇÃO LPS
  // ============================================================================
  const lpsData = {
    ppc: 78.5,
    tmr: 4.2,
    restricoesAtivas: 15
  };

  const ppcSemanal = [
    { semana: 'S1', ppc: 72 },
    { semana: 'S2', ppc: 68 },
    { semana: 'S3', ppc: 75 },
    { semana: 'S4', ppc: 82 },
    { semana: 'S5', ppc: 79 },
    { semana: 'S6', ppc: 78 },
    { semana: 'S7', ppc: 85 },
    { semana: 'S8', ppc: 78.5 }
  ];

  const restricoesPorTipo = [
    { tipo: 'Material', quantidade: 6 },
    { tipo: 'Mão de Obra', quantidade: 4 },
    { tipo: 'Equipamento', quantidade: 2 },
    { tipo: 'Projeto', quantidade: 2 },
    { tipo: 'Clima', quantidade: 1 }
  ];

  // ============================================================================
  // MOCK DATA - QUALIDADE
  // ============================================================================
  const qualidadeData = {
    iqo: 92.5,
    auditoriasCompletas: 12,
    naoConformidades: 8,
    acoesCorretivas: 5
  };

  const auditoriasRecentes = [
    { id: 'AUD-001', titulo: 'Auditoria Estrutural', data: '2024-12-05', conformidade: 95 },
    { id: 'AUD-002', titulo: 'Auditoria de Segurança', data: '2024-12-03', conformidade: 88 },
    { id: 'AUD-003', titulo: 'Auditoria Ambiental', data: '2024-11-28', conformidade: 92 },
    { id: 'AUD-004', titulo: 'Auditoria de Qualidade', data: '2024-11-25', conformidade: 96 }
  ];

  // ============================================================================
  // MOCK DATA - RECURSOS
  // ============================================================================
  const recursosData = {
    capacidadeEquipe: 45,
    alocacaoAtual: 87,
    indiceProdutividade: 1.05
  };

  const alocacaoRecursos = [
    { recurso: 'Engenheiros Civis', alocado: 92, capacidade: 8 },
    { recurso: 'Técnicos', alocado: 85, capacidade: 15 },
    { recurso: 'Operadores', alocado: 78, capacidade: 12 },
    { recurso: 'Supervisores', alocado: 95, capacidade: 5 },
    { recurso: 'Auxiliares', alocado: 70, capacidade: 10 }
  ];

  // ============================================================================
  // MOCK DATA - GESTÃO
  // ============================================================================
  const gestaoData = {
    solicitacoesMudanca: 3,
    acoes5w2h: 18,
    ciclosPdca: 4,
    licoesAprendidas: 12
  };

  const acoesRecentes = [
    { id: '5W2H-018', titulo: 'Replanejar atividade fundação', status: 'EM_ANDAMENTO', prazo: '2024-12-15' },
    { id: '5W2H-017', titulo: 'Solicitar material adicional', status: 'CONCLUIDA', prazo: '2024-12-10' },
    { id: '5W2H-016', titulo: 'Treinar equipe nova', status: 'PENDENTE', prazo: '2024-12-20' },
    { id: '5W2H-015', titulo: 'Revisar cronograma fase 2', status: 'EM_ANDAMENTO', prazo: '2024-12-18' }
  ];

  // ============================================================================
  // SECTOR COLORS
  // ============================================================================
  const sectorColors = {
    [SetorDashboard.CRONOGRAMA_EVM]: { main: '#3B82F6', bg: '#EFF6FF' },
    [SetorDashboard.PRODUCAO_LPS]: { main: '#F97316', bg: '#FFF7ED' },
    [SetorDashboard.QUALIDADE]: { main: '#EF4444', bg: '#FEF2F2' },
    [SetorDashboard.RECURSOS]: { main: '#22C55E', bg: '#F0FDF4' },
    [SetorDashboard.GESTAO]: { main: '#8B5CF6', bg: '#F5F3FF' }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA': return 'bg-green-100 text-green-800';
      case 'EM_ANDAMENTO': return 'bg-yellow-100 text-yellow-800';
      case 'PENDENTE': return 'bg-gray-100 text-gray-800';
      case 'ATRASADA': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold theme-text">
            Dashboard de Indicadores
          </h1>
          <p className="text-sm theme-text-secondary mt-1">
            Última atualização: {lastUpdate}
          </p>
        </div>
        <button
          onClick={togglePresentationMode}
          className="btn btn-outline flex items-center space-x-2"
        >
          {presentationMode ? <X size={20} /> : <Maximize2 size={20} />}
          <span>{presentationMode ? 'Sair' : 'Modo Apresentação'}</span>
        </button>
      </div>

      {/* Sector 1: CRONOGRAMA & EVM */}
      <CollapsibleSector
        id={SetorDashboard.CRONOGRAMA_EVM}
        title="CRONOGRAMA & EVM"
        icon={<Calendar size={20} />}
        color={sectorColors[SetorDashboard.CRONOGRAMA_EVM].main}
        bgColor={sectorColors[SetorDashboard.CRONOGRAMA_EVM].bg}
        isExpanded={expandedSectors[SetorDashboard.CRONOGRAMA_EVM]}
        onToggle={() => toggleSector(SetorDashboard.CRONOGRAMA_EVM)}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="SPI"
            value={evmData.spi.toFixed(2)}
            icon={Activity}
            color={evmData.spi >= 1 ? 'success' : 'warning'}
            subtitle="Schedule Performance Index"
            trend={{ value: 2.1, isPositive: evmData.spi >= 1 }}
          />
          <KPICard
            title="CPI"
            value={evmData.cpi.toFixed(2)}
            icon={TrendingUp}
            color={evmData.cpi >= 1 ? 'success' : 'danger'}
            subtitle="Cost Performance Index"
            trend={{ value: 1.5, isPositive: evmData.cpi >= 1 }}
          />
          <KPICard
            title="EAC"
            value={formatCurrency(evmData.eac)}
            icon={Target}
            color="info"
            subtitle="Estimate at Completion"
          />
          <KPICard
            title="VAC"
            value={formatCurrency(evmData.vac)}
            icon={evmData.vac >= 0 ? TrendingUp : TrendingDown}
            color={evmData.vac >= 0 ? 'success' : 'danger'}
            subtitle="Variance at Completion"
          />
        </div>

        {/* S-Curve Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Curva S - Avanço Físico</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={curvaS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="planejado"
                  stroke={sectorColors[SetorDashboard.CRONOGRAMA_EVM].main}
                  fill={sectorColors[SetorDashboard.CRONOGRAMA_EVM].bg}
                  strokeWidth={2}
                  name="Planejado"
                />
                <Line
                  type="monotone"
                  dataKey="realizado"
                  stroke={tema.success}
                  strokeWidth={3}
                  dot={{ fill: tema.success }}
                  name="Realizado"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Top 5 Delayed Activities */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold theme-text mb-4">
              Top 5 Atividades Atrasadas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium theme-text-secondary">Código</th>
                    <th className="text-left py-2 px-2 font-medium theme-text-secondary">Atividade</th>
                    <th className="text-left py-2 px-2 font-medium theme-text-secondary">Atraso</th>
                    <th className="text-left py-2 px-2 font-medium theme-text-secondary">Responsável</th>
                  </tr>
                </thead>
                <tbody>
                  {atividadesAtrasadas.map((ativ) => (
                    <tr key={ativ.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-mono text-xs">{ativ.id}</td>
                      <td className="py-2 px-2 theme-text">{ativ.nome}</td>
                      <td className="py-2 px-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {ativ.atraso} dias
                        </span>
                      </td>
                      <td className="py-2 px-2 theme-text-secondary">{ativ.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CollapsibleSector>

      {/* Sector 2: PRODUÇÃO LPS */}
      <CollapsibleSector
        id={SetorDashboard.PRODUCAO_LPS}
        title="PRODUÇÃO LPS"
        icon={<BarChart3 size={20} />}
        color={sectorColors[SetorDashboard.PRODUCAO_LPS].main}
        bgColor={sectorColors[SetorDashboard.PRODUCAO_LPS].bg}
        isExpanded={expandedSectors[SetorDashboard.PRODUCAO_LPS]}
        onToggle={() => toggleSector(SetorDashboard.PRODUCAO_LPS)}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="PPC"
            value={`${lpsData.ppc}%`}
            icon={CheckCircle2}
            color={lpsData.ppc >= 80 ? 'success' : lpsData.ppc >= 60 ? 'warning' : 'danger'}
            subtitle="Percent Plan Complete"
            trend={{ value: 3.5, isPositive: true }}
          />
          <KPICard
            title="TMR"
            value={`${lpsData.tmr} dias`}
            icon={Clock}
            color={lpsData.tmr <= 5 ? 'success' : 'warning'}
            subtitle="Tempo Médio Remoção Restrições"
            trend={{ value: 8, isPositive: false }}
          />
          <KPICard
            title="Restrições Ativas"
            value={lpsData.restricoesAtivas}
            icon={AlertTriangle}
            color="danger"
            subtitle="Aguardando resolução"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Weekly PPC Trend */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Tendência PPC Semanal</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ppcSemanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semana" />
                <YAxis domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'PPC']} />
                <Line
                  type="monotone"
                  dataKey="ppc"
                  stroke={sectorColors[SetorDashboard.PRODUCAO_LPS].main}
                  strokeWidth={3}
                  dot={{ fill: sectorColors[SetorDashboard.PRODUCAO_LPS].main }}
                />
                {/* Meta line at 80% */}
                <Line
                  type="monotone"
                  dataKey={() => 80}
                  stroke={tema.success}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Meta"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Restrictions by Type */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="text-lg font-semibold theme-text mb-4">Restrições por Tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={restricoesPorTipo} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="tipo" type="category" width={100} />
                <Tooltip />
                <Bar
                  dataKey="quantidade"
                  fill={sectorColors[SetorDashboard.PRODUCAO_LPS].main}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CollapsibleSector>

      {/* Sector 3: QUALIDADE */}
      <CollapsibleSector
        id={SetorDashboard.QUALIDADE}
        title="QUALIDADE"
        icon={<Shield size={20} />}
        color={sectorColors[SetorDashboard.QUALIDADE].main}
        bgColor={sectorColors[SetorDashboard.QUALIDADE].bg}
        isExpanded={expandedSectors[SetorDashboard.QUALIDADE]}
        onToggle={() => toggleSector(SetorDashboard.QUALIDADE)}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="IQO"
            value={`${qualidadeData.iqo}%`}
            icon={Target}
            color={qualidadeData.iqo >= 90 ? 'success' : qualidadeData.iqo >= 75 ? 'warning' : 'danger'}
            subtitle="Índice de Qualidade da Obra"
            trend={{ value: 1.2, isPositive: true }}
          />
          <KPICard
            title="Auditorias Completas"
            value={qualidadeData.auditoriasCompletas}
            icon={FileCheck}
            color="success"
            subtitle="Este mês"
          />
          <KPICard
            title="Não Conformidades"
            value={qualidadeData.naoConformidades}
            icon={AlertCircle}
            color="danger"
            subtitle="Abertas"
          />
          <KPICard
            title="Ações Corretivas"
            value={qualidadeData.acoesCorretivas}
            icon={Wrench}
            color="warning"
            subtitle="Em andamento"
          />
        </div>

        {/* Recent Audits List */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold theme-text mb-4">Auditorias Recentes</h3>
          <div className="space-y-3">
            {auditoriasRecentes.map((audit) => (
              <div
                key={audit.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{
                      backgroundColor:
                        audit.conformidade >= 90
                          ? tema.success
                          : audit.conformidade >= 75
                          ? tema.warning
                          : tema.danger
                    }}
                  >
                    {audit.conformidade}%
                  </div>
                  <div>
                    <p className="font-medium theme-text">{audit.titulo}</p>
                    <p className="text-sm theme-text-secondary">{audit.id} • {audit.data}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${audit.conformidade}%`,
                        backgroundColor:
                          audit.conformidade >= 90
                            ? tema.success
                            : audit.conformidade >= 75
                            ? tema.warning
                            : tema.danger
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSector>

      {/* Sector 4: RECURSOS */}
      <CollapsibleSector
        id={SetorDashboard.RECURSOS}
        title="RECURSOS"
        icon={<Users size={20} />}
        color={sectorColors[SetorDashboard.RECURSOS].main}
        bgColor={sectorColors[SetorDashboard.RECURSOS].bg}
        isExpanded={expandedSectors[SetorDashboard.RECURSOS]}
        onToggle={() => toggleSector(SetorDashboard.RECURSOS)}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Capacidade da Equipe"
            value={recursosData.capacidadeEquipe}
            icon={Users}
            color="info"
            subtitle="Profissionais disponíveis"
          />
          <KPICard
            title="Alocação Atual"
            value={`${recursosData.alocacaoAtual}%`}
            icon={Briefcase}
            color={recursosData.alocacaoAtual > 90 ? 'warning' : 'success'}
            subtitle="Taxa de utilização"
            trend={{ value: 5, isPositive: true }}
          />
          <KPICard
            title="Índice Produtividade"
            value={recursosData.indiceProdutividade.toFixed(2)}
            icon={TrendingUp}
            color={recursosData.indiceProdutividade >= 1 ? 'success' : 'warning'}
            subtitle="Performance da equipe"
          />
        </div>

        {/* Resource Allocation Progress Bars */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold theme-text mb-4">Alocação por Tipo de Recurso</h3>
          <div className="space-y-4">
            {alocacaoRecursos.map((recurso) => (
              <div key={recurso.recurso}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium theme-text">{recurso.recurso}</span>
                  <span className="text-sm theme-text-secondary">
                    {recurso.alocado}% ({recurso.capacidade} pessoas)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${recurso.alocado}%`,
                      backgroundColor:
                        recurso.alocado > 90
                          ? tema.warning
                          : recurso.alocado > 70
                          ? sectorColors[SetorDashboard.RECURSOS].main
                          : tema.info
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSector>

      {/* Sector 5: GESTÃO */}
      <CollapsibleSector
        id={SetorDashboard.GESTAO}
        title="GESTÃO"
        icon={<Briefcase size={20} />}
        color={sectorColors[SetorDashboard.GESTAO].main}
        bgColor={sectorColors[SetorDashboard.GESTAO].bg}
        isExpanded={expandedSectors[SetorDashboard.GESTAO]}
        onToggle={() => toggleSector(SetorDashboard.GESTAO)}
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Solicitações de Mudança"
            value={gestaoData.solicitacoesMudanca}
            icon={GitBranch}
            color="warning"
            subtitle="Pendentes de análise"
          />
          <KPICard
            title="Ações 5W2H"
            value={gestaoData.acoes5w2h}
            icon={ClipboardList}
            color="info"
            subtitle="Abertas"
          />
          <KPICard
            title="Ciclos PDCA"
            value={gestaoData.ciclosPdca}
            icon={RefreshCw}
            color="primary"
            subtitle="Ativos"
          />
          <KPICard
            title="Lições Aprendidas"
            value={gestaoData.licoesAprendidas}
            icon={BookOpen}
            color="success"
            subtitle="Registradas"
          />
        </div>

        {/* Recent Actions List */}
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold theme-text mb-4">Ações Recentes (5W2H)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium theme-text-secondary">Código</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-secondary">Ação</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-secondary">Status</th>
                  <th className="text-left py-2 px-3 font-medium theme-text-secondary">Prazo</th>
                </tr>
              </thead>
              <tbody>
                {acoesRecentes.map((acao) => (
                  <tr key={acao.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono text-xs">{acao.id}</td>
                    <td className="py-2 px-3 theme-text">{acao.titulo}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(acao.status)}`}>
                        {acao.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2 px-3 theme-text-secondary">{acao.prazo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSector>
    </div>
  );

  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-auto p-6">
        <DashboardContent />
      </div>
    );
  }

  return <DashboardContent />;
};

export default DashboardIndicadoresPage;
