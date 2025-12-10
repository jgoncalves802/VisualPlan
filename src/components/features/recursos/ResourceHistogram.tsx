import { useMemo, useState } from 'react';
import { AlertTriangle, Users, Calendar, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWeekend } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Resource } from '@/services/resourceService';

interface ResourceAllocationData {
  id: string;
  resourceId: string;
  atividadeId: string;
  atividadeNome: string;
  dataInicio: string;
  dataFim: string;
  unidades: number;
  unitsPerTime: number;
}

interface ResourceHistogramProps {
  resources: Resource[];
  allocations: ResourceAllocationData[];
  startDate: Date;
  _endDate?: Date;
  _viewMode?: 'day' | 'week' | 'month';
  onAllocationClick?: (allocation: ResourceAllocationData) => void;
  selectedResourceId?: string;
  onResourceSelect?: (resourceId: string | null) => void;
}

interface DayAllocation {
  date: Date;
  totalHours: number;
  capacity: number;
  overallocation: number;
  allocations: Array<{
    allocation: ResourceAllocationData;
    hours: number;
  }>;
}

export function ResourceHistogram({
  resources,
  allocations,
  startDate,
  onAllocationClick,
  selectedResourceId,
  onResourceSelect,
}: ResourceHistogramProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(startDate, { weekStartsOn: 1 }));

  const selectedResource = useMemo(() => {
    return resources.find(r => r.id === selectedResourceId);
  }, [resources, selectedResourceId]);

  const filteredAllocations = useMemo(() => {
    if (!selectedResourceId) return allocations;
    return allocations.filter(a => a.resourceId === selectedResourceId);
  }, [allocations, selectedResourceId]);

  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  const dailyAllocations = useMemo((): DayAllocation[] => {
    const capacity = selectedResource?.capacidadeDiaria || 8;
    
    return weekDays.map(date => {
      const dayAllocations: DayAllocation['allocations'] = [];
      let totalHours = 0;
      
      filteredAllocations.forEach(allocation => {
        const allocStart = new Date(allocation.dataInicio);
        const allocEnd = new Date(allocation.dataFim);
        
        if (date >= allocStart && date <= allocEnd) {
          const isWorkday = !isWeekend(date);
          if (isWorkday) {
            const dailyHours = (allocation.unidades / 100) * allocation.unitsPerTime;
            totalHours += dailyHours;
            dayAllocations.push({
              allocation,
              hours: dailyHours,
            });
          }
        }
      });
      
      return {
        date,
        totalHours,
        capacity: isWeekend(date) ? 0 : capacity,
        overallocation: isWeekend(date) ? 0 : Math.max(0, totalHours - capacity),
        allocations: dayAllocations,
      };
    });
  }, [weekDays, filteredAllocations, selectedResource]);

  const maxHours = useMemo(() => {
    const maxAlloc = Math.max(...dailyAllocations.map(d => d.totalHours));
    const maxCap = Math.max(...dailyAllocations.map(d => d.capacity));
    return Math.max(maxAlloc, maxCap, 8);
  }, [dailyAllocations]);

  const totalOverallocation = useMemo(() => {
    return dailyAllocations.reduce((sum, d) => sum + d.overallocation, 0);
  }, [dailyAllocations]);

  const utilizationRate = useMemo(() => {
    const totalCapacity = dailyAllocations.reduce((sum, d) => sum + d.capacity, 0);
    const totalUsed = dailyAllocations.reduce((sum, d) => sum + Math.min(d.totalHours, d.capacity), 0);
    return totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
  }, [dailyAllocations]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  const getBarColor = (day: DayAllocation): string => {
    if (isWeekend(day.date)) return '#E5E7EB';
    if (day.overallocation > 0) return '#EF4444';
    if (day.totalHours >= day.capacity * 0.9) return '#F59E0B';
    if (day.totalHours >= day.capacity * 0.5) return '#10B981';
    return '#3B82F6';
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Histograma de Recursos</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
              {format(currentWeekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(currentWeekStart, 6), "d 'de' MMMM", { locale: ptBR })}
            </span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedResourceId || ''}
              onChange={(e) => onResourceSelect?.(e.target.value || null)}
              className="text-sm border rounded px-2 py-1 min-w-[150px]"
            >
              <option value="">Todos os recursos</option>
              {resources.map(resource => (
                <option key={resource.id} value={resource.id}>
                  {resource.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-500"></span>
              <span className="text-gray-600">Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500"></span>
              <span className="text-gray-600">50-90%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500"></span>
              <span className="text-gray-600">90-100%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500"></span>
              <span className="text-gray-600">Sobre-alocado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x border-b">
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Utilização</p>
          <p className={`text-lg font-bold ${utilizationRate > 100 ? 'text-red-600' : utilizationRate > 80 ? 'text-amber-600' : 'text-green-600'}`}>
            {utilizationRate.toFixed(0)}%
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Sobre-alocação</p>
          <p className={`text-lg font-bold ${totalOverallocation > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {totalOverallocation.toFixed(1)}h
          </p>
        </div>
        <div className="p-3 text-center">
          <p className="text-xs text-gray-500 mb-1">Recurso</p>
          <p className="text-lg font-bold text-gray-900 truncate">
            {selectedResource?.nome || 'Todos'}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="relative h-48">
          <div className="absolute inset-0 flex">
            {dailyAllocations.map((day, index) => {
              const barHeight = maxHours > 0 ? (day.totalHours / maxHours) * 100 : 0;
              const capacityHeight = maxHours > 0 ? (day.capacity / maxHours) * 100 : 0;
              const isWeekendDay = isWeekend(day.date);
              
              return (
                <div
                  key={index}
                  className={`flex-1 flex flex-col justify-end px-1 ${isWeekendDay ? 'bg-gray-50' : ''}`}
                >
                  <div className="relative h-full flex items-end">
                    {!isWeekendDay && (
                      <div
                        className="absolute bottom-0 left-1 right-1 border-t-2 border-dashed border-gray-400"
                        style={{ bottom: `${capacityHeight}%` }}
                        title={`Capacidade: ${day.capacity}h`}
                      />
                    )}
                    
                    <div
                      className={`w-full rounded-t transition-all cursor-pointer hover:opacity-80 ${
                        day.overallocation > 0 ? 'ring-2 ring-red-300' : ''
                      }`}
                      style={{
                        height: `${barHeight}%`,
                        backgroundColor: getBarColor(day),
                        minHeight: day.totalHours > 0 ? '4px' : '0',
                      }}
                      onClick={() => {
                        if (day.allocations.length > 0) {
                          onAllocationClick?.(day.allocations[0].allocation);
                        }
                      }}
                      title={`${format(day.date, 'EEEE, d/MM', { locale: ptBR })}\nTotal: ${day.totalHours.toFixed(1)}h\nCapacidade: ${day.capacity}h${day.overallocation > 0 ? `\nSobre-alocação: ${day.overallocation.toFixed(1)}h` : ''}`}
                    >
                      {day.overallocation > 0 && (
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center mt-2">
                    <p className={`text-xs font-medium ${isWeekendDay ? 'text-gray-400' : 'text-gray-700'}`}>
                      {format(day.date, 'EEE', { locale: ptBR })}
                    </p>
                    <p className={`text-[10px] ${isWeekendDay ? 'text-gray-400' : 'text-gray-500'}`}>
                      {format(day.date, 'd/MM')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-[10px] text-gray-500">
            <span>{maxHours.toFixed(0)}h</span>
            <span>{(maxHours / 2).toFixed(0)}h</span>
            <span>0h</span>
          </div>
        </div>
      </div>

      {totalOverallocation > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Sobre-alocação detectada
              </p>
              <p className="text-xs text-red-600 mt-1">
                {totalOverallocation.toFixed(1)} horas acima da capacidade nesta semana.
                Considere redistribuir as atividades ou ajustar as alocações.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedResourceId && dailyAllocations.some(d => d.allocations.length > 0) && (
        <div className="border-t">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Detalhes das Alocações</h4>
            <div className="space-y-2 max-h-40 overflow-auto">
              {filteredAllocations.map(allocation => (
                <div
                  key={allocation.id}
                  onClick={() => onAllocationClick?.(allocation)}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {allocation.atividadeNome}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{allocation.unidades}%</span>
                    <span>
                      {format(new Date(allocation.dataInicio), 'd/MM')} - {format(new Date(allocation.dataFim), 'd/MM')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceHistogram;
