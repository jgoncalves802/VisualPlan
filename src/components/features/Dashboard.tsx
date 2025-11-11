import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Activity,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DashboardKPIs } from '../types';

// Mock data - substituir por dados reais do Supabase
const mockKPIs: DashboardKPIs = {
  percentualPAC: 78,
  tempoMedioResolucaoRestricoes: 36, // horas
  spi: 0.92, // Schedule Performance Index
  cpi: 1.05, // Cost Performance Index
  restricoesImpeditvasAtivas: 3,
  atividadesEmAtraso: 12,
  totalAtividades: 145,
  totalConcluidas: 89,
  percentualConcluido: 61.4,
};

const curvaSData = [
  { mes: 'Jan', planejado: 10, realizado: 8 },
  { mes: 'Fev', planejado: 25, realizado: 22 },
  { mes: 'Mar', planejado: 42, planejado: 40 },
  { mes: 'Abr', planejado: 60, realizado: 56 },
  { mes: 'Mai', planejado: 75, realizado: 73 },
  { mes: 'Jun', planejado: 88, realizado: 85 },
];

const pacSemanal = [
  { semana: 'S1', pac: 85 },
  { semana: 'S2', pac: 72 },
  { semana: 'S3', pac: 78 },
  { semana: 'S4', pac: 81 },
  { semana: 'S5', pac: 76 },
  { semana: 'S6', pac: 78 },
];

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
}) => {
  const variantColors = {
    default: 'var(--color-primary-500)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  };

  return (
    <Card padding="md" hover className="h-full">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {title}
          </p>
          <h3 className="text-3xl font-bold mt-2" style={{ color: variantColors[variant] }}>
            {value}
          </h3>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </p>
          )}
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' && <TrendingUp className="w-4 h-4 text-success" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 text-danger" />}
              <span className={`text-sm ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
                {trendValue}
              </span>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                vs. semana anterior
              </span>
            </div>
          )}
        </div>
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${variantColors[variant]}20` }}
        >
          {React.cloneElement(icon as React.ReactElement, {
            className: 'w-6 h-6',
            style: { color: variantColors[variant] },
          })}
        </div>
      </div>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs>(mockKPIs);

  useEffect(() => {
    // Carregar KPIs do Supabase
    // const loadKPIs = async () => { ... };
    // loadKPIs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Dashboard Executivo
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Visão geral do desempenho do projeto
          </p>
        </div>
        <Badge variant="success">Atualizado há 5 min</Badge>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="% PAC Médio"
          value={`${kpis.percentualPAC}%`}
          subtitle="Percentual de Atividades Concluídas"
          icon={<CheckCircle />}
          trend="up"
          trendValue="+5%"
          variant="success"
        />
        
        <KPICard
          title="Tempo Médio Resolução"
          value={`${kpis.tempoMedioResolucaoRestricoes}h`}
          subtitle="Restrições impeditivas"
          icon={<Clock />}
          trend="down"
          trendValue="-8h"
          variant="success"
        />
        
        <KPICard
          title="SPI"
          value={kpis.spi.toFixed(2)}
          subtitle="Schedule Performance Index"
          icon={<Activity />}
          variant={kpis.spi >= 1 ? 'success' : 'warning'}
        />
        
        <KPICard
          title="CPI"
          value={kpis.cpi.toFixed(2)}
          subtitle="Cost Performance Index"
          icon={<DollarSign />}
          variant={kpis.cpi >= 1 ? 'success' : 'danger'}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Restrições Impeditivas"
          value={kpis.restricoesImpeditvasAtivas}
          subtitle="Ativas no momento"
          icon={<AlertTriangle />}
          variant="danger"
        />
        
        <KPICard
          title="Atividades em Atraso"
          value={kpis.atividadesEmAtraso}
          subtitle={`De ${kpis.totalAtividades} totais`}
          icon={<Calendar />}
          variant="warning"
        />
        
        <KPICard
          title="Progresso Geral"
          value={`${kpis.percentualConcluido}%`}
          subtitle={`${kpis.totalConcluidas} de ${kpis.totalAtividades} atividades`}
          icon={<TrendingUp />}
          variant="default"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Curva S */}
        <Card title="Curva S - Avanço Físico" padding="md">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={curvaSData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-secondary-200)" />
              <XAxis dataKey="mes" stroke="var(--color-text-secondary)" />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-main)',
                  border: '1px solid var(--color-secondary-200)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="planejado"
                stroke="var(--color-primary-500)"
                strokeWidth={2}
                name="Planejado"
              />
              <Line
                type="monotone"
                dataKey="realizado"
                stroke="var(--color-success)"
                strokeWidth={2}
                name="Realizado"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* % PAC Semanal */}
        <Card title="% PAC Semanal" padding="md">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pacSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-secondary-200)" />
              <XAxis dataKey="semana" stroke="var(--color-text-secondary)" />
              <YAxis stroke="var(--color-text-secondary)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-bg-main)',
                  border: '1px solid var(--color-secondary-200)',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="pac"
                fill="var(--color-primary-500)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-primary-50)' }}>
            <p className="text-sm" style={{ color: 'var(--color-primary-700)' }}>
              <strong>Meta:</strong> Manter % PAC acima de 75% consistentemente
            </p>
          </div>
        </Card>
      </div>

      {/* Restrições Ativas */}
      <Card title="Restrições Impeditivas Ativas" padding="md">
        <div className="space-y-3">
          <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="w-10 h-10 rounded-full bg-danger flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Atraso na Entrega de Vigas Metálicas
                </h4>
                <Badge variant="danger">Impeditiva</Badge>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Atividade: 1.2.3 - Montagem da Estrutura Metálica P5
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Origem:</strong> Fornecedor
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Tempo de Paralisação:</strong> 48h
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Responsável:</strong> Compras
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div className="w-10 h-10 rounded-full bg-warning flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Reprovação de Qualidade - Laje P3
                </h4>
                <Badge variant="warning">Em Tratamento</Badge>
              </div>
              <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Atividade: 1.2.1.3 - Concretagem Laje P3
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Origem:</strong> Fiscalização
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Tempo de Paralisação:</strong> 24h
                </span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  <strong>Responsável:</strong> Contratada
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
