import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, Table } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTemaStore } from '../../stores/temaStore';

export type TimeViewMode = 'dia' | 'semana' | 'mes';
export type DisplayMode = 'calendario' | 'tabela';

interface TimeNavigatorProps {
  periodo: { inicio: Date; fim: Date };
  onPeriodoChange: (periodo: { inicio: Date; fim: Date }) => void;
  viewMode: TimeViewMode;
  onViewModeChange: (mode: TimeViewMode) => void;
  displayMode?: DisplayMode;
  onDisplayModeChange?: (mode: DisplayMode) => void;
  mostrarFinsDeSemana?: boolean;
  onMostrarFinsDeSemanaChange?: (value: boolean) => void;
  showDisplayToggle?: boolean;
  showWeekendToggle?: boolean;
}

export const TimeNavigator: React.FC<TimeNavigatorProps> = ({
  periodo,
  onPeriodoChange,
  viewMode,
  onViewModeChange,
  displayMode = 'calendario',
  onDisplayModeChange,
  mostrarFinsDeSemana = true,
  onMostrarFinsDeSemanaChange,
  showDisplayToggle = false,
  showWeekendToggle = false,
}) => {
  const { tema } = useTemaStore();
  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';

  const handlePrevious = () => {
    let inicio: Date;
    let fim: Date;
    
    switch (viewMode) {
      case 'dia':
        inicio = subDays(periodo.inicio, 1);
        fim = subDays(periodo.fim, 1);
        break;
      case 'semana':
        inicio = subWeeks(periodo.inicio, 1);
        fim = subWeeks(periodo.fim, 1);
        break;
      case 'mes':
        inicio = subMonths(periodo.inicio, 1);
        fim = endOfMonth(subMonths(periodo.inicio, 1));
        break;
      default:
        return;
    }
    
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    onPeriodoChange({ inicio, fim });
  };

  const handleNext = () => {
    let inicio: Date;
    let fim: Date;
    
    switch (viewMode) {
      case 'dia':
        inicio = addDays(periodo.inicio, 1);
        fim = addDays(periodo.fim, 1);
        break;
      case 'semana':
        inicio = addWeeks(periodo.inicio, 1);
        fim = addWeeks(periodo.fim, 1);
        break;
      case 'mes':
        inicio = addMonths(periodo.inicio, 1);
        fim = endOfMonth(addMonths(periodo.inicio, 1));
        break;
      default:
        return;
    }
    
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    onPeriodoChange({ inicio, fim });
  };

  const handleToday = () => {
    const hoje = new Date();
    let inicio: Date;
    let fim: Date;
    
    switch (viewMode) {
      case 'dia':
        inicio = startOfDay(hoje);
        fim = endOfDay(hoje);
        break;
      case 'semana':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(hoje, { locale: ptBR });
        break;
      case 'mes':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      default:
        return;
    }
    
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    onPeriodoChange({ inicio, fim });
  };

  const handleViewModeChange = (mode: TimeViewMode) => {
    const hoje = new Date();
    let inicio: Date;
    let fim: Date;
    
    switch (mode) {
      case 'dia':
        inicio = startOfDay(hoje);
        fim = endOfDay(hoje);
        break;
      case 'semana':
        inicio = startOfWeek(hoje, { locale: ptBR });
        fim = endOfWeek(hoje, { locale: ptBR });
        break;
      case 'mes':
        inicio = startOfMonth(hoje);
        fim = endOfMonth(hoje);
        break;
      default:
        return;
    }
    
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    onPeriodoChange({ inicio, fim });
    onViewModeChange(mode);
  };

  const formatPeriodo = () => {
    switch (viewMode) {
      case 'dia':
        return format(periodo.inicio, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      case 'semana':
        return `${format(periodo.inicio, "dd 'de' MMMM", { locale: ptBR })} - ${format(periodo.fim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`;
      case 'mes':
        return format(periodo.inicio, "MMMM 'de' yyyy", { locale: ptBR });
      default:
        return '';
    }
  };

  return (
    <div 
      className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border"
      style={{ 
        backgroundColor: tema.surface, 
        borderColor: tema.border 
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrevious}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: tema.text }}
          title="Anterior"
        >
          <ChevronLeft size={20} />
        </button>
        
        <button
          onClick={handleToday}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: tema.primary }}
        >
          Hoje
        </button>
        
        <button
          onClick={handleNext}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: tema.text }}
          title="Próximo"
        >
          <ChevronRight size={20} />
        </button>
        
        <span 
          className="text-sm font-medium ml-2 capitalize"
          style={{ color: tema.text }}
        >
          {formatPeriodo()}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: tema.border }}>
          {(['dia', 'semana', 'mes'] as TimeViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className="px-4 py-2 text-sm font-medium transition-colors capitalize"
              style={{
                backgroundColor: viewMode === mode ? tema.primary : 'transparent',
                color: viewMode === mode ? 'white' : tema.text,
              }}
            >
              {mode === 'dia' ? 'Diário' : mode === 'semana' ? 'Semanal' : 'Mensal'}
            </button>
          ))}
        </div>

        {showDisplayToggle && onDisplayModeChange && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDisplayModeChange('calendario')}
              className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: displayMode === 'calendario' ? tema.primary : isDarkMode ? '#374151' : '#e5e7eb',
                color: displayMode === 'calendario' ? 'white' : tema.text,
              }}
            >
              <Calendar size={16} />
              Calendário
            </button>
            <button
              onClick={() => onDisplayModeChange('tabela')}
              className="px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: displayMode === 'tabela' ? tema.primary : isDarkMode ? '#374151' : '#e5e7eb',
                color: displayMode === 'tabela' ? 'white' : tema.text,
              }}
            >
              <Table size={16} />
              Tabela
            </button>
          </div>
        )}

        {showWeekendToggle && onMostrarFinsDeSemanaChange && (
          <label 
            className="flex items-center gap-2 text-sm cursor-pointer"
            style={{ color: tema.text }}
          >
            <input
              type="checkbox"
              checked={mostrarFinsDeSemana}
              onChange={(e) => onMostrarFinsDeSemanaChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Mostrar fins de semana</span>
          </label>
        )}
      </div>
    </div>
  );
};

export default TimeNavigator;
