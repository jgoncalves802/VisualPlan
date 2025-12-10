import { useMemo, useState } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { Layers, Download, Eye, EyeOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export interface CommodityDataPoint {
  date: string;
  labor: number;
  material: number;
  equipment: number;
  subcontractor: number;
  other: number;
  total: number;
  laborCumulative: number;
  materialCumulative: number;
  equipmentCumulative: number;
  subcontractorCumulative: number;
  otherCumulative: number;
  totalCumulative: number;
}

interface CommodityCurvesChartProps {
  data: CommodityDataPoint[];
  title?: string;
  unit?: 'cost' | 'hours';
  viewMode?: 'cumulative' | 'periodic';
  chartType?: 'line' | 'bar' | 'stacked';
  onExport?: () => void;
}

const COMMODITY_CONFIG: Record<string, { name: string; color: string; bgColor: string }> = {
  labor: { name: 'Mão de Obra', color: '#3B82F6', bgColor: '#DBEAFE' },
  material: { name: 'Material', color: '#10B981', bgColor: '#D1FAE5' },
  equipment: { name: 'Equipamento', color: '#F59E0B', bgColor: '#FEF3C7' },
  subcontractor: { name: 'Subempreiteiro', color: '#8B5CF6', bgColor: '#EDE9FE' },
  other: { name: 'Outros', color: '#6B7280', bgColor: '#F3F4F6' },
};

const formatValue = (value: number, unit: string): string => {
  if (unit === 'cost') {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(0)}`;
  }
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k h`;
  return `${value.toFixed(0)} h`;
};

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  
  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="text-sm font-medium text-gray-900 mb-2 border-b pb-2">
        {format(parseISO(label), "d 'de' MMMM", { locale: ptBR })}
      </p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">{entry.name}</span>
            </div>
            <span className="font-medium">{formatValue(entry.value, unit)}</span>
          </div>
        ))}
      </div>
      <div className="border-t mt-2 pt-2 flex items-center justify-between text-sm font-semibold">
        <span className="text-gray-700">Total</span>
        <span className="text-gray-900">{formatValue(total, unit)}</span>
      </div>
    </div>
  );
};

export function CommodityCurvesChart({
  data,
  title = 'Curvas de Commodities',
  unit = 'cost',
  viewMode = 'cumulative',
  chartType = 'line',
  onExport,
}: CommodityCurvesChartProps) {
  const [activeCommodities, setActiveCommodities] = useState<Record<string, boolean>>({
    labor: true,
    material: true,
    equipment: true,
    subcontractor: true,
    other: true,
  });

  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [currentChartType, setCurrentChartType] = useState(chartType);

  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      dateLabel: format(parseISO(point.date), 'dd/MM', { locale: ptBR }),
    }));
  }, [data]);

  const totals = useMemo(() => {
    if (data.length === 0) return null;
    
    const last = data[data.length - 1];
    return {
      labor: last.laborCumulative,
      material: last.materialCumulative,
      equipment: last.equipmentCumulative,
      subcontractor: last.subcontractorCumulative,
      other: last.otherCumulative,
      total: last.totalCumulative,
    };
  }, [data]);

  const distribution = useMemo(() => {
    if (!totals || totals.total === 0) return null;
    
    return {
      labor: (totals.labor / totals.total) * 100,
      material: (totals.material / totals.total) * 100,
      equipment: (totals.equipment / totals.total) * 100,
      subcontractor: (totals.subcontractor / totals.total) * 100,
      other: (totals.other / totals.total) * 100,
    };
  }, [totals]);

  const toggleCommodity = (key: string) => {
    setActiveCommodities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDataKey = (key: string): string => {
    return currentViewMode === 'cumulative' ? `${key}Cumulative` : key;
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={currentViewMode}
              onChange={(e) => setCurrentViewMode(e.target.value as 'cumulative' | 'periodic')}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="cumulative">Acumulado</option>
              <option value="periodic">Por Período</option>
            </select>
            
            <select
              value={currentChartType}
              onChange={(e) => setCurrentChartType(e.target.value as 'line' | 'bar' | 'stacked')}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="line">Linhas</option>
              <option value="bar">Barras</option>
              <option value="stacked">Empilhado</option>
            </select>
            
            {onExport && (
              <Button variant="secondary" size="sm" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {distribution && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-700">Distribuição por Tipo:</span>
          </div>
          <div className="flex items-center h-4 rounded-full overflow-hidden">
            {Object.entries(distribution).map(([key, value]) => (
              <div
                key={key}
                className="h-full transition-all"
                style={{
                  width: `${value}%`,
                  backgroundColor: COMMODITY_CONFIG[key]?.color || '#6B7280',
                }}
                title={`${COMMODITY_CONFIG[key]?.name}: ${value.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-500">
            {Object.entries(distribution).map(([key, value]) => (
              <span key={key}>{value.toFixed(0)}%</span>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          {Object.entries(COMMODITY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => toggleCommodity(key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-colors ${
                activeCommodities[key]
                  ? `bg-opacity-100`
                  : 'bg-gray-100 text-gray-400'
              }`}
              style={{
                backgroundColor: activeCommodities[key] ? config.bgColor : undefined,
                color: activeCommodities[key] ? config.color : undefined,
              }}
            >
              {activeCommodities[key] ? (
                <Eye className="w-3 h-3" />
              ) : (
                <EyeOff className="w-3 h-3" />
              )}
              <span className="w-3 h-0.5 rounded" style={{ backgroundColor: config.color }} />
              {config.name}
            </button>
          ))}
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
            
            {currentChartType === 'line' && (
              <>
                {activeCommodities.labor && (
                  <Line
                    type="monotone"
                    dataKey={getDataKey('labor')}
                    name="Mão de Obra"
                    stroke={COMMODITY_CONFIG.labor.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {activeCommodities.material && (
                  <Line
                    type="monotone"
                    dataKey={getDataKey('material')}
                    name="Material"
                    stroke={COMMODITY_CONFIG.material.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {activeCommodities.equipment && (
                  <Line
                    type="monotone"
                    dataKey={getDataKey('equipment')}
                    name="Equipamento"
                    stroke={COMMODITY_CONFIG.equipment.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {activeCommodities.subcontractor && (
                  <Line
                    type="monotone"
                    dataKey={getDataKey('subcontractor')}
                    name="Subempreiteiro"
                    stroke={COMMODITY_CONFIG.subcontractor.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
                {activeCommodities.other && (
                  <Line
                    type="monotone"
                    dataKey={getDataKey('other')}
                    name="Outros"
                    stroke={COMMODITY_CONFIG.other.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                )}
              </>
            )}
            
            {(currentChartType === 'bar' || currentChartType === 'stacked') && (
              <>
                {activeCommodities.labor && (
                  <Bar
                    dataKey={getDataKey('labor')}
                    name="Mão de Obra"
                    fill={COMMODITY_CONFIG.labor.color}
                    stackId={currentChartType === 'stacked' ? 'stack' : undefined}
                  />
                )}
                {activeCommodities.material && (
                  <Bar
                    dataKey={getDataKey('material')}
                    name="Material"
                    fill={COMMODITY_CONFIG.material.color}
                    stackId={currentChartType === 'stacked' ? 'stack' : undefined}
                  />
                )}
                {activeCommodities.equipment && (
                  <Bar
                    dataKey={getDataKey('equipment')}
                    name="Equipamento"
                    fill={COMMODITY_CONFIG.equipment.color}
                    stackId={currentChartType === 'stacked' ? 'stack' : undefined}
                  />
                )}
                {activeCommodities.subcontractor && (
                  <Bar
                    dataKey={getDataKey('subcontractor')}
                    name="Subempreiteiro"
                    fill={COMMODITY_CONFIG.subcontractor.color}
                    stackId={currentChartType === 'stacked' ? 'stack' : undefined}
                  />
                )}
                {activeCommodities.other && (
                  <Bar
                    dataKey={getDataKey('other')}
                    name="Outros"
                    fill={COMMODITY_CONFIG.other.color}
                    stackId={currentChartType === 'stacked' ? 'stack' : undefined}
                  />
                )}
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {totals && (
        <div className="border-t p-4">
          <h4 className="text-xs font-medium text-gray-700 mb-3">Totais por Categoria</h4>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(COMMODITY_CONFIG).map(([key, config]) => (
              <div
                key={key}
                className="text-center p-2 rounded"
                style={{ backgroundColor: config.bgColor }}
              >
                <p className="text-[10px] text-gray-600 mb-1">{config.name}</p>
                <p className="text-sm font-bold" style={{ color: config.color }}>
                  {formatValue(totals[key as keyof typeof totals], unit)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-center p-2 bg-gray-100 rounded">
            <p className="text-xs text-gray-600">Total Geral</p>
            <p className="text-lg font-bold text-gray-900">
              {formatValue(totals.total, unit)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CommodityCurvesChart;
