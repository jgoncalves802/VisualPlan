/**
 * CalendarView - Componente de calendário visual para LPS
 * Mostra colunas por data com post-its arrastáveis
 */

import React, { useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, CategoriaAtividade } from '../../../types/lps';
import { ActivityCard } from './ActivityCard';

interface CalendarViewProps {
  dataInicio: Date;
  dataFim: Date;
  atividades: AtividadeLPS[];
  onActivityMove?: (atividadeId: string, novaData: Date) => void;
  onActivityClick?: (atividade: AtividadeLPS) => void;
  mostrarFinsDeSemana?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  dataInicio,
  dataFim,
  atividades,
  onActivityMove,
  onActivityClick,
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

  // Agrupar atividades por data
  const atividadesPorData = useMemo(() => {
    const agrupadas: { [key: string]: AtividadeLPS[] } = {};
    datas.forEach((data) => {
      const key = format(data, 'yyyy-MM-dd');
      agrupadas[key] = atividades.filter((atividade) => {
        // Converter datas da atividade para Date
        const dataAtribuida = atividade.data_atribuida
          ? parseDate(atividade.data_atribuida)
          : parseDate(atividade.data_inicio);
        const dataInicioAtividade = parseDate(atividade.data_inicio);
        const dataFimAtividade = parseDate(atividade.data_fim);
        
        // Verificar se a atividade está atribuída para esta data específica
        // Ou se a atividade cobre esta data (está no intervalo)
        if (dataAtribuida && !isNaN(dataAtribuida.getTime())) {
          return isSameDay(dataAtribuida, data);
        }
        
        // Se não há data_atribuida válida, verificar se a atividade cobre esta data
        if (!isNaN(dataInicioAtividade.getTime()) && !isNaN(dataFimAtividade.getTime())) {
          return isWithinInterval(data, {
            start: dataInicioAtividade,
            end: dataFimAtividade,
          });
        }
        
        return false;
      });
    });
    return agrupadas;
  }, [datas, atividades]);

  // Obter nome do dia da semana
  const getDiaSemana = (data: Date): string => {
    return format(data, 'EEE', { locale: ptBR });
  };

  // Obter cor da categoria (cores baseadas nas fotos)
  const getCorCategoria = (categoria: CategoriaAtividade): string => {
    switch (categoria) {
      case CategoriaAtividade.PRINCIPAL:
        // Amarelo (post-its principais)
        return 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300';
      case CategoriaAtividade.SECUNDARIA:
        // Rosa (post-its secundários)
        return 'bg-pink-200 border-pink-400 hover:bg-pink-300';
      case CategoriaAtividade.ESPECIAL:
        // Branco (post-its especiais como "Operação Assistida")
        return 'bg-white border-gray-400 hover:bg-gray-50';
      default:
        return 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300';
    }
  };

  // Handler para drop de atividade
  const handleDrop = (e: React.DragEvent, data: Date) => {
    e.preventDefault();
    const atividadeId = e.dataTransfer.getData('atividade-id');
    if (atividadeId && onActivityMove) {
      onActivityMove(atividadeId, data);
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
          {datas.map((data, index) => {
            const key = format(data, 'yyyy-MM-dd');
            const atividadesDoDia = atividadesPorData[key] || [];
            const diaSemana = getDiaSemana(data);
            const isFimDeSemana = data.getDay() === 0 || data.getDay() === 6;

            return (
              <div
                key={key}
                className="flex-shrink-0 w-48 border-r border-gray-200 flex flex-col"
                style={{ minHeight: '100%' }}
                onDrop={(e) => handleDrop(e, data)}
                onDragOver={handleDragOver}
              >
                {/* Header da coluna (data e dia da semana) */}
                <div
                  className={`px-2 py-2 border-b border-gray-300 text-center font-semibold ${
                    isFimDeSemana ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-bold">{format(data, 'dd/MM')}</div>
                  <div className="text-xs uppercase">{diaSemana}</div>
                </div>

                {/* Área de atividades (post-its) */}
                <div 
                  className="flex-1 p-2 space-y-2 overflow-y-auto bg-white"
                  style={{ 
                    minHeight: 'calc(100vh - 250px)',
                  }}
                >
                  {atividadesDoDia.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8 opacity-50">
                      Arraste atividades aqui
                    </div>
                  ) : (
                    atividadesDoDia.map((atividade, index) => (
                      <ActivityCard
                        key={atividade.id}
                        atividade={atividade}
                        onClick={() => onActivityClick?.(atividade)}
                        cor={getCorCategoria(atividade.categoria)}
                      />
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

