import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Maximize2,
  X,
  Loader2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KPICard from '../components/ui/KPICard';
import { useAuthStore } from '../stores/authStore';
import { useTemaStore } from '../stores/temaStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { dashboardService, DashboardKPIs, CurvaSData, RestricaoDistribution } from '../services/dashboardService';

const EMPTY_KPIS: DashboardKPIs = {
  percentualPAC: 0,
  tempoMedioResolucao: 0,
  spi: 0,
  cpi: 0,
  restricoesImpeditivas: 0,
  restricoesTotal: 0,
  atividadesAtrasadas: 0,
  atividadesTotal: 0,
  acoesAbertas: 0,
  acoesTotal: 0,
  mudancasPendentes: 0,
  auditoriasEmAndamento: 0,
  conformidadeMedia: 0,
};

const DashboardPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { tema } = useTemaStore();
  const { projetoSelecionado } = useProjetoStore();
  const [presentationMode, setPresentationMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState<DashboardKPIs>(EMPTY_KPIS);
  const [curvaS, setCurvaS] = useState<CurvaSData[]>([]);
  const [restricoesPorTipo, setRestricoesPorTipo] = useState<RestricaoDistribution[]>([]);

  const loadData = useCallback(async () => {
    if (!usuario?.empresaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [kpis, curva, restricoes] = await Promise.all([
        dashboardService.getKPIs(usuario.empresaId, projetoSelecionado?.id),
        dashboardService.getCurvaS(usuario.empresaId, projetoSelecionado?.id),
        dashboardService.getRestricoesPorCategoria(usuario.empresaId, projetoSelecionado?.id),
      ]);

      setKpiData(kpis);
      setCurvaS(curva);
      setRestricoesPorTipo(restricoes);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId, projetoSelecionado?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const togglePresentationMode = () => {
    setPresentationMode(!presentationMode);
    if (!presentationMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  const DashboardContent = () => (
    <div className="p-6 space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold theme-text">
              Dashboard {usuario?.camadaGovernanca}
              {projetoSelecionado && (
                <span className="text-xl font-normal ml-2 theme-text-secondary">
                  — {projetoSelecionado.nome}
                </span>
              )}
            </h1>
            <p className="text-sm theme-text-secondary mt-1">
              {projetoSelecionado ? `Projeto: ${projetoSelecionado.nome}` : 'Visão geral dos indicadores do projeto'}
            </p>
          </div>
          <ProjetoSelector compact />
        </div>
        <button
          onClick={togglePresentationMode}
          className="btn btn-outline flex items-center space-x-2"
        >
          {presentationMode ? <X size={20} /> : <Maximize2 size={20} />}
          <span>{presentationMode ? 'Sair' : 'Modo Apresentação'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <KPICard
          title="% PAC Médio"
          value={`${kpiData.percentualPAC}%`}
          icon={TrendingUp}
          color="primary"
          trend={{ value: 5.2, isPositive: true }}
          subtitle="Percentual de Atividades Concluídas"
        />
        
        <KPICard
          title="Tempo Médio Resolução"
          value={`${kpiData.tempoMedioResolucao}h`}
          icon={Clock}
          color="info"
          trend={{ value: 12, isPositive: false }}
          subtitle="Restrições Impeditivas"
        />
        
        <KPICard
          title="SPI - Cronograma"
          value={kpiData.spi.toFixed(2)}
          icon={CheckCircle2}
          color={kpiData.spi >= 1 ? 'success' : 'warning'}
          subtitle="Schedule Performance Index"
        />
        
        <KPICard
          title="Restrições Impeditivas"
          value={kpiData.restricoesImpeditivas}
          icon={AlertTriangle}
          color="danger"
          subtitle="Ativas no momento"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva S */}
        <div className="card">
          <h3 className="text-lg font-semibold theme-text mb-4">
            Curva S - Avanço Físico
          </h3>
          {curvaS.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={curvaS}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="planejado" 
                  stroke={tema.primary} 
                  strokeWidth={2}
                  name="Planejado"
                />
                <Line 
                  type="monotone" 
                  dataKey="realizado" 
                  stroke={tema.success} 
                  strokeWidth={2}
                  name="Realizado"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <p>Sem dados de atividades para exibir a Curva S</p>
            </div>
          )}
        </div>

        {/* Restrições por Tipo */}
        <div className="card">
          <h3 className="text-lg font-semibold theme-text mb-4">
            Restrições por Tipo
          </h3>
          {restricoesPorTipo.length > 0 ? (
            <div className="space-y-3">
              {restricoesPorTipo.map((item) => {
                const total = restricoesPorTipo.reduce((acc, r) => acc + r.count, 0);
                const percentage = total > 0 ? (item.count / total) * 100 : 0;
                
                return (
                  <div key={item.categoria}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="theme-text-secondary">{item.categoria}</span>
                      <span className="font-medium theme-text">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              <p>Sem restrições cadastradas</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Atividades Críticas */}
      <div className="card">
        <h3 className="text-lg font-semibold theme-text mb-4">
          Atividades Críticas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b theme-border-primary">
                <th className="text-left py-3 px-4 theme-text-secondary font-medium">Código</th>
                <th className="text-left py-3 px-4 theme-text-secondary font-medium">Atividade</th>
                <th className="text-left py-3 px-4 theme-text-secondary font-medium">Status</th>
                <th className="text-left py-3 px-4 theme-text-secondary font-medium">Progresso</th>
                <th className="text-left py-3 px-4 theme-text-secondary font-medium">Previsão</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b theme-border-primary hover:bg-gray-50">
                  <td className="py-3 px-4 theme-text font-mono text-sm">1.2.{i}.1</td>
                  <td className="py-3 px-4 theme-text">Execução de Estrutura P{i}</td>
                  <td className="py-3 px-4">
                    <span className="badge badge-warning">Em Andamento</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div 
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${45 + i * 5}%`,
                            backgroundColor: tema.success
                          }}
                        />
                      </div>
                      <span className="text-sm theme-text">{45 + i * 5}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 theme-text-secondary text-sm">
                    {new Date(2024, 11, 15 + i).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ backgroundColor: tema.background }}>
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: tema.primary }} />
          <p className="text-sm" style={{ color: tema.textSecondary }}>Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (presentationMode) {
    return (
      <div className="presentation-mode">
        <div className="dashboard-content">
          <DashboardContent />
        </div>
      </div>
    );
  }

  return <DashboardContent />;
};

export default DashboardPage;
