import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  TrendingUp,
  Scale,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import { takeoffService } from '../../../services/takeoffService';
import type { TakeoffTotais } from '../../../types/takeoff.types';

interface TakeoffDashboardProps {
  projetoId: string | null;
  disciplinaId: string | null;
}

const TakeoffDashboard: React.FC<TakeoffDashboardProps> = ({ projetoId, disciplinaId }) => {
  const { disciplinas } = useTakeoffStore();
  const [totaisPorDisciplina, setTotaisPorDisciplina] = useState<Record<string, TakeoffTotais>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTotais = async () => {
      if (!projetoId) return;
      
      setIsLoading(true);
      const totais: Record<string, TakeoffTotais> = {};

      for (const disc of disciplinas) {
        const mapas = await takeoffService.getMapas(projetoId, disc.id);
        let discTotais: TakeoffTotais = {
          totalItens: 0,
          qtdPrevistaTotal: 0,
          qtdTakeoffTotal: 0,
          qtdExecutadaTotal: 0,
          pesoTotal: 0,
          custoTotal: 0,
          percentualMedio: 0,
        };

        for (const mapa of mapas) {
          const mapaTotais = await takeoffService.getTotais({ mapaId: mapa.id });
          discTotais.totalItens += mapaTotais.totalItens;
          discTotais.qtdPrevistaTotal += mapaTotais.qtdPrevistaTotal;
          discTotais.qtdTakeoffTotal += mapaTotais.qtdTakeoffTotal;
          discTotais.qtdExecutadaTotal += mapaTotais.qtdExecutadaTotal;
          discTotais.pesoTotal += mapaTotais.pesoTotal;
          discTotais.custoTotal += mapaTotais.custoTotal;
        }

        if (discTotais.qtdTakeoffTotal > 0) {
          discTotais.percentualMedio = (discTotais.qtdExecutadaTotal / discTotais.qtdTakeoffTotal) * 100;
        }

        totais[disc.id] = discTotais;
      }

      setTotaisPorDisciplina(totais);
      setIsLoading(false);
    };

    loadTotais();
  }, [projetoId, disciplinas]);

  const totaisGerais = Object.values(totaisPorDisciplina).reduce(
    (acc, t) => ({
      totalItens: acc.totalItens + t.totalItens,
      qtdPrevistaTotal: acc.qtdPrevistaTotal + t.qtdPrevistaTotal,
      qtdTakeoffTotal: acc.qtdTakeoffTotal + t.qtdTakeoffTotal,
      qtdExecutadaTotal: acc.qtdExecutadaTotal + t.qtdExecutadaTotal,
      pesoTotal: acc.pesoTotal + t.pesoTotal,
      custoTotal: acc.custoTotal + t.custoTotal,
      percentualMedio: 0,
    }),
    {
      totalItens: 0,
      qtdPrevistaTotal: 0,
      qtdTakeoffTotal: 0,
      qtdExecutadaTotal: 0,
      pesoTotal: 0,
      custoTotal: 0,
      percentualMedio: 0,
    }
  );

  if (totaisGerais.qtdTakeoffTotal > 0) {
    totaisGerais.percentualMedio = (totaisGerais.qtdExecutadaTotal / totaisGerais.qtdTakeoffTotal) * 100;
  }

  const chartDataDisciplinas = disciplinas
    .filter((d) => totaisPorDisciplina[d.id]?.totalItens > 0)
    .map((d) => ({
      nome: d.nome,
      cor: d.cor,
      itens: totaisPorDisciplina[d.id]?.totalItens || 0,
      peso: totaisPorDisciplina[d.id]?.pesoTotal || 0,
      custo: totaisPorDisciplina[d.id]?.custoTotal || 0,
      progresso: totaisPorDisciplina[d.id]?.percentualMedio || 0,
    }));

  const pieData = chartDataDisciplinas.map((d) => ({
    name: d.nome,
    value: d.peso,
    color: d.cor,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (!projetoId) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
        <h3 className="text-lg font-medium theme-text mb-2">Dashboard de Take-off</h3>
        <p className="text-sm theme-text-secondary">
          Selecione um projeto para visualizar os indicadores
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="theme-bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm theme-text-secondary">Total de Itens</p>
              <p className="text-2xl font-bold theme-text">{totaisGerais.totalItens.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="theme-bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm theme-text-secondary">Avanço Físico</p>
              <p className="text-2xl font-bold theme-text">{totaisGerais.percentualMedio.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${Math.min(totaisGerais.percentualMedio, 100)}%` }}
            />
          </div>
        </div>

        <div className="theme-bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm theme-text-secondary">Peso Total</p>
              <p className="text-2xl font-bold theme-text">
                {(totaisGerais.pesoTotal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ton
              </p>
            </div>
          </div>
        </div>

        <div className="theme-bg-secondary rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm theme-text-secondary">Custo Total</p>
              <p className="text-2xl font-bold theme-text">
                R$ {(totaisGerais.custoTotal / 1000000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} M
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="theme-bg-secondary rounded-lg p-4">
          <h3 className="text-sm font-medium theme-text mb-4">Progresso por Disciplina</h3>
          {chartDataDisciplinas.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataDisciplinas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="nome" width={100} />
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Bar dataKey="progresso" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm theme-text-secondary">
              Nenhum dado disponível
            </div>
          )}
        </div>

        <div className="theme-bg-secondary rounded-lg p-4">
          <h3 className="text-sm font-medium theme-text mb-4">Distribuição de Peso</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${(value / 1000).toFixed(1)} ton`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm theme-text-secondary">
              Nenhum dado disponível
            </div>
          )}
        </div>
      </div>

      <div className="theme-bg-secondary rounded-lg p-4">
        <h3 className="text-sm font-medium theme-text mb-4">Detalhamento por Disciplina</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b theme-divide">
                <th className="text-left py-2 px-3 font-medium theme-text-secondary">Disciplina</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Itens</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Qtd Prevista</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Qtd Take-off</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Qtd Executada</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Peso (ton)</th>
                <th className="text-right py-2 px-3 font-medium theme-text-secondary">Custo (R$)</th>
                <th className="text-center py-2 px-3 font-medium theme-text-secondary">Progresso</th>
              </tr>
            </thead>
            <tbody>
              {disciplinas.map((disc) => {
                const t = totaisPorDisciplina[disc.id];
                if (!t || t.totalItens === 0) return null;
                return (
                  <tr key={disc.id} className="border-b theme-divide hover:theme-bg-primary">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: disc.cor }} />
                        <span className="theme-text">{disc.nome}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 theme-text">{t.totalItens.toLocaleString()}</td>
                    <td className="text-right py-2 px-3 theme-text">{t.qtdPrevistaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-2 px-3 theme-text">{t.qtdTakeoffTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-2 px-3 theme-text">{t.qtdExecutadaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-2 px-3 theme-text">{(t.pesoTotal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                    <td className="text-right py-2 px-3 theme-text">{t.custoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(t.percentualMedio, 100)}%`,
                              backgroundColor: disc.cor,
                            }}
                          />
                        </div>
                        <span className="text-xs theme-text w-10 text-right">{t.percentualMedio.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-medium theme-bg-primary">
                <td className="py-2 px-3 theme-text">TOTAL</td>
                <td className="text-right py-2 px-3 theme-text">{totaisGerais.totalItens.toLocaleString()}</td>
                <td className="text-right py-2 px-3 theme-text">{totaisGerais.qtdPrevistaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td className="text-right py-2 px-3 theme-text">{totaisGerais.qtdTakeoffTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td className="text-right py-2 px-3 theme-text">{totaisGerais.qtdExecutadaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td className="text-right py-2 px-3 theme-text">{(totaisGerais.pesoTotal / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td className="text-right py-2 px-3 theme-text">{totaisGerais.custoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(totaisGerais.percentualMedio, 100)}%` }} />
                    </div>
                    <span className="text-xs theme-text w-10 text-right">{totaisGerais.percentualMedio.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TakeoffDashboard;
