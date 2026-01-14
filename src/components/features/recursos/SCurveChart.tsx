import { useMemo, useState } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from 'recharts';
import { TrendingUp, Download, Calendar, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';

export interface SCurveDataPoint {
  date: string;
  plannedCumulative: number;
  actualCumulative: number;
  earnedValueCumulative: number;
  remainingCumulative?: number;
  forecastCumulative?: number;
}

interface SCurveChartProps {
  data: SCurveDataPoint[];
  title?: string;
  unit?: 'cost' | 'hours' | 'percent';
  showForecast?: boolean;
  showEarnedValue?: boolean;
  _projectStartDate?: string;
  _projectEndDate?: string;
  dataDate?: string;
  onExport?: () => void;
}

const formatValue = (value: number, unit: string): string => {
  if (unit === 'cost') {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(0)}`;
  }
  if (unit === 'hours') {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k h`;
    return `${value.toFixed(0)} h`;
  }
  return `${value.toFixed(1)}%`;
};

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const formatLabel = (lbl: any): string => {
    if (!lbl) return '';
    try {
      const parsed = parseISO(String(lbl));
      if (isNaN(parsed.getTime())) return String(lbl);
      return format(parsed, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return String(lbl);
    }
  };
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3">
      <p className="text-sm font-medium text-gray-900 mb-2">
        {formatLabel(label)}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">{formatValue(entry.value, unit)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function SCurveChart({
  data,
  title = 'Curva S',
  unit = 'cost',
  showForecast = true,
  showEarnedValue = true,
  dataDate,
  onExport,
}: SCurveChartProps) {
  const [activeLines, setActiveLines] = useState({
    planned: true,
    actual: true,
    earnedValue: true,
    forecast: true,
  });

  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const latest = data[data.length - 1];
    const planned = latest.plannedCumulative;
    const actual = latest.actualCumulative;
    const earnedValue = latest.earnedValueCumulative;
    
    const costVariance = earnedValue - actual;
    const scheduleVariance = earnedValue - planned;
    const cpi = actual > 0 ? earnedValue / actual : 1;
    const spi = planned > 0 ? earnedValue / planned : 1;
    
    const bac = data[data.length - 1]?.plannedCumulative || 0;
    const eac = cpi > 0 ? bac / cpi : bac;
    const etc = eac - actual;
    const vac = bac - eac;
    
    return {
      planned,
      actual,
      earnedValue,
      costVariance,
      scheduleVariance,
      cpi,
      spi,
      bac,
      eac,
      etc,
      vac,
      percentComplete: bac > 0 ? (earnedValue / bac) * 100 : 0,
    };
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(point => {
      let dateLabel = point.date;
      try {
        const parsed = parseISO(point.date);
        if (!isNaN(parsed.getTime())) {
          dateLabel = format(parsed, 'dd/MM', { locale: ptBR });
        }
      } catch {
        // Keep original if parse fails
      }
      return { ...point, dateLabel };
    });
  }, [data]);

  const toggleLine = (line: keyof typeof activeLines) => {
    setActiveLines(prev => ({ ...prev, [line]: !prev[line] }));
  };

  const getStatusColor = (value: number): string => {
    if (value >= 1) return 'text-green-600';
    if (value >= 0.9) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {dataDate && (() => {
                try {
                  const parsed = parseISO(dataDate);
                  if (isNaN(parsed.getTime())) return null;
                  return (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      Data de Status: {format(parsed, "d 'de' MMMM", { locale: ptBR })}
                    </p>
                  );
                } catch {
                  return null;
                }
              })()}
            </div>
          </div>
          
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 divide-x border-b">
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">% Completo</p>
            <p className="text-lg font-bold text-blue-600">
              {stats.percentComplete.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">CPI</p>
            <p className={`text-lg font-bold ${getStatusColor(stats.cpi)}`}>
              {stats.cpi.toFixed(2)}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">SPI</p>
            <p className={`text-lg font-bold ${getStatusColor(stats.spi)}`}>
              {stats.spi.toFixed(2)}
            </p>
          </div>
          <div className="p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">Variação de Custo</p>
            <p className={`text-lg font-bold ${stats.costVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatValue(Math.abs(stats.costVariance), unit)}
              {stats.costVariance < 0 && <span className="text-xs ml-1">atrás</span>}
            </p>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => toggleLine('planned')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
              activeLines.planned ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="w-3 h-0.5 bg-blue-500 rounded"></span>
            Planejado (PV)
          </button>
          <button
            onClick={() => toggleLine('actual')}
            className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
              activeLines.actual ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <span className="w-3 h-0.5 bg-red-500 rounded"></span>
            Real (AC)
          </button>
          {showEarnedValue && (
            <button
              onClick={() => toggleLine('earnedValue')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
                activeLines.earnedValue ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="w-3 h-0.5 bg-green-500 rounded"></span>
              Valor Agregado (EV)
            </button>
          )}
          {showForecast && (
            <button
              onClick={() => toggleLine('forecast')}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded ${
                activeLines.forecast ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="w-3 h-0.5 bg-purple-500 rounded border-dashed"></span>
              Projetado
            </button>
          )}
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              tickFormatter={(value) => formatValue(value, unit)}
            />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            
            {dataDate && (
              <ReferenceLine
                x={format(parseISO(dataDate), 'dd/MM', { locale: ptBR })}
                stroke="#6366F1"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'Data Status', position: 'top', fontSize: 10, fill: '#6366F1' }}
              />
            )}
            
            {activeLines.planned && (
              <Line
                type="monotone"
                dataKey="plannedCumulative"
                name="Planejado (PV)"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            
            {activeLines.actual && (
              <Line
                type="monotone"
                dataKey="actualCumulative"
                name="Real (AC)"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            
            {showEarnedValue && activeLines.earnedValue && (
              <Line
                type="monotone"
                dataKey="earnedValueCumulative"
                name="Valor Agregado (EV)"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
            
            {showForecast && activeLines.forecast && (
              <Line
                type="monotone"
                dataKey="forecastCumulative"
                name="Projetado"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {stats && (stats.cpi < 0.9 || stats.spi < 0.9) && (
        <div className="px-4 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Atenção: Projeto com desvios significativos
              </p>
              <div className="text-xs text-amber-600 mt-1 space-y-1">
                {stats.cpi < 0.9 && (
                  <p>CPI abaixo de 0.9 indica custos acima do planejado.</p>
                )}
                {stats.spi < 0.9 && (
                  <p>SPI abaixo de 0.9 indica atraso no cronograma.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="border-t p-4">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Indicadores EVM</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-gray-500">BAC (Orçamento)</p>
              <p className="font-semibold text-gray-900">{formatValue(stats.bac, unit)}</p>
            </div>
            <div>
              <p className="text-gray-500">EAC (Estimativa Final)</p>
              <p className={`font-semibold ${stats.eac > stats.bac ? 'text-red-600' : 'text-green-600'}`}>
                {formatValue(stats.eac, unit)}
              </p>
            </div>
            <div>
              <p className="text-gray-500">VAC (Variação Final)</p>
              <p className={`font-semibold ${stats.vac >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.vac >= 0 ? '+' : ''}{formatValue(stats.vac, unit)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SCurveChart;
