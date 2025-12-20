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
import { dashboardService, DashboardKPIs, CurvaSData, RestricaoDistribution } from '../services/dashboardService';

const DEFAULT_KPIS: DashboardKPIs = {
  percentualPAC: 78.5,
  tempoMedioResolucao: 32,
  spi: 0.95,
  cpi: 1.02,
  restricoesImpeditivas: 5,
  restricoesTotal: 25,
  atividadesAtrasadas: 12,
  atividadesTotal: 100,
  acoesAbertas: 8,
  acoesTotal: 15,
  mudancasPendentes: 3,
  auditoriasEmAndamento: 2,
  conformidadeMedia: 85.5,
};

const DEFAULT_CURVA_S: CurvaSData[] = [
  { mes: 'Jan', planejado: 10, realizado: 12 },
  { mes: 'Fev', planejado: 25, realizado: 23 },
  { mes: 'Mar', planejado: 42, realizado: 40 },
  { mes: 'Abr', planejado: 58, realizado: 55 },
  { mes: 'Mai', planejado: 73, realizado: 68 },
  { mes: 'Jun', planejado: 85, realizado: 78 },
  { mes: 'Jul', planejado: 100, realizado: 85 },
];

const DEFAULT_RESTRICOES: RestricaoDistribution[] = [
  { categoria: 'Material', count: 15, color: '#10B981' },
  { categoria: 'Mão de Obra', count: 8, color: '#3B82F6' },
  { categoria: 'Máquina', count: 5, color: '#F59E0B' },
  { categoria: 'Método', count: 12, color: '#8B5CF6' },
  { categoria: 'Meio Ambiente', count: 3, color: '#06B6D4' },
];

const DashboardPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const { tema } = useTemaStore();
  const [presentationMode, setPresentationMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiData, setKpiData] = useState<DashboardKPIs>(DEFAULT_KPIS);
  const [curvaS, setCurvaS] = useState<CurvaSData[]>(DEFAULT_CURVA_S);
  const [restricoesPorTipo, setRestricoesPorTipo] = useState<RestricaoDistribution[]>(DEFAULT_RESTRICOES);

  const loadData = useCallback(async () => {
    if (!usuario?.empresaId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [kpis, curva, restricoes] = await Promise.all([
        dashboardService.getKPIs(usuario.empresaId),
        dashboardService.getCurvaS(usuario.empresaId),
        dashboardService.getRestricoesPorCategoria(usuario.empresaId),
      ]);

      const hasRealKPIData = kpis.atividadesTotal > 0 || kpis.acoesTotal > 0 || kpis.restricoesTotal > 0;
      setKpiData(hasRealKPIData ? kpis : DEFAULT_KPIS);
      
      setCurvaS(curva.length > 0 ? curva : DEFAULT_CURVA_S);
      
      const hasRealRestricoes = restricoes.some(r => r.count > 0);
      setRestricoesPorTipo(hasRealRestricoes ? restricoes : DEFAULT_RESTRICOES);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId]);

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
        <div>
          <h1 className="text-3xl font-bold theme-text">
            Dashboard {usuario?.camadaGovernanca}
          </h1>
          <p className="text-sm theme-text-secondary mt-1">
            Visão geral dos indicadores do projeto
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
        </div>

        {/* Restrições por Tipo */}
        <div className="card">
          <h3 className="text-lg font-semibold theme-text mb-4">
            Restrições por Tipo
          </h3>
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
