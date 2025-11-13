/**
 * RestricoesCalendarView - Visualização de restrições em formato de calendário (post-its)
 */

import React, { useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricaoLPS } from '../../../types/lps';
import { RestricaoCard } from './RestricaoCard';

interface RestricoesCalendarViewProps {
  dataInicio: Date;
  dataFim: Date;
  restricoes: RestricaoLPS[];
  onRestricaoClick?: (restricao: RestricaoLPS) => void;
  onRestricaoMove?: (restricaoId: string, novaData: Date) => void;
  mostrarFinsDeSemana?: boolean;
}

export const RestricoesCalendarView: React.FC<RestricoesCalendarViewProps> = ({
  dataInicio,
  dataFim,
  restricoes,
  onRestricaoClick,
  onRestricaoMove,
  mostrarFinsDeSemana = true,
}) => {
  // Helper para converter para Date
  const parseDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  };

  // Gerar array de datas do calendário
  const datas = useMemo(() => {
    const inicio = parseDate(dataInicio);
    const fim = parseDate(dataFim);
    
    // Verificar se as datas são válidas
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return [];
    }
    
    const todasDatas = eachDayOfInterval({ start: inicio, end: fim });
    if (!mostrarFinsDeSemana) {
      return todasDatas.filter((data) => {
        const dia = data.getDay();
        return dia !== 0 && dia !== 6; // Remove domingo (0) e sábado (6)
      });
    }
    return todasDatas;
  }, [dataInicio, dataFim, mostrarFinsDeSemana]);

  // Agrupar restrições por data
  const restricoesPorData = useMemo(() => {
    const agrupadas: { [key: string]: RestricaoLPS[] } = {};
    datas.forEach((data) => {
      const key = format(data, 'yyyy-MM-dd');
      agrupadas[key] = restricoes.filter((restricao) => {
        if (!restricao.data_conclusao_planejada) return false;
        const dataRestricao = parseDate(restricao.data_conclusao_planejada);
        if (isNaN(dataRestricao.getTime())) return false;
        return isSameDay(dataRestricao, data);
      });
    });
    return agrupadas;
  }, [datas, restricoes]);

  // Obter nome do dia da semana
  const getDiaSemana = (data: Date): string => {
    return format(data, 'EEE', { locale: ptBR });
  };

  // Handler para drop de restrição
  const handleDrop = (e: React.DragEvent, data: Date) => {
    e.preventDefault();
    const restricaoId = e.dataTransfer.getData('restricao-id');
    if (restricaoId && onRestricaoMove) {
      onRestricaoMove(restricaoId, data);
    }
  };

  // Handler para permitir drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Calendário com scroll horizontal */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50">
        <div className="flex min-w-full h-full">
          {datas.map((data) => {
            const key = format(data, 'yyyy-MM-dd');
            const restricoesDoDia = restricoesPorData[key] || [];
            const diaSemana = getDiaSemana(data);
            const isFimDeSemana = data.getDay() === 0 || data.getDay() === 6;
            const isHoje = isSameDay(data, new Date());

            return (
              <div
                key={key}
                className="flex-shrink-0 w-56 border-r border-gray-300 flex flex-col bg-white"
                style={{ minHeight: '100%' }}
                onDrop={(e) => handleDrop(e, data)}
                onDragOver={handleDragOver}
              >
                {/* Header da coluna (data e dia da semana) */}
                <div
                  className={`px-3 py-2 border-b border-gray-300 text-center font-semibold sticky top-0 z-10 ${
                    isHoje
                      ? 'bg-blue-600 text-white border-blue-600'
                      : isFimDeSemana
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-50 text-gray-900 border-blue-200'
                  }`}
                >
                  <div className="text-sm font-bold">{format(data, 'dd/MM')}</div>
                  <div className="text-xs uppercase font-medium">{diaSemana}</div>
                  {isHoje && (
                    <div className="text-xs mt-1 opacity-90">Hoje</div>
                  )}
                </div>

                {/* Área de restrições (post-its) */}
                <div
                  className="flex-1 p-2 space-y-2 overflow-y-auto bg-white"
                  style={{
                    minHeight: 'calc(100vh - 250px)',
                  }}
                >
                  {restricoesDoDia.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8 opacity-50">
                      Sem restrições
                    </div>
                  ) : (
                    restricoesDoDia.map((restricao) => (
                      <div
                        key={restricao.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('restricao-id', restricao.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                      >
                        <RestricaoCard
                          restricao={restricao}
                          onClick={() => onRestricaoClick?.(restricao)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

