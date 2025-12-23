/**
 * CalendarView - Componente de calendário visual para LPS
 * Mostra colunas por data com post-its arrastáveis
 */

import React, { useMemo } from 'react';
import { format, eachDayOfInterval, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, RestricaoLPS, WBSLPS, ResumoProntidao } from '../../../types/lps';
import { ActivityCard } from './ActivityCard';

interface CalendarViewProps {
  dataInicio: Date;
  dataFim: Date;
  atividades: AtividadeLPS[];
  restricoes?: RestricaoLPS[];
  wbsList?: WBSLPS[];
  selectedWbsId?: string;
  onActivityMove?: (atividadeId: string, novaData: Date) => void;
  onActivityClick?: (atividade: AtividadeLPS) => void;
  mostrarFinsDeSemana?: boolean;
  empresaId?: string;
  prontidaoMap?: Record<string, ResumoProntidao>;
  onAddRestricao?: (atividade: AtividadeLPS) => void;
  onOpenProntidao?: (atividade: AtividadeLPS) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  dataInicio,
  dataFim,
  atividades,
  restricoes = [],
  wbsList = [],
  selectedWbsId,
  onActivityMove,
  onActivityClick,
  mostrarFinsDeSemana = true,
  empresaId,
  prontidaoMap = {},
  onAddRestricao,
  onOpenProntidao,
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

  // Função para obter todos os IDs descendentes de uma WBS (incluindo ela mesma)
  const getDescendantWbsIds = useMemo(() => {
    if (!selectedWbsId || wbsList.length === 0) return null;
    
    const getAllDescendants = (parentId: string): string[] => {
      const directChildren = wbsList.filter((w) => w.parent_id === parentId);
      let ids: string[] = [parentId];
      directChildren.forEach((child) => {
        ids = [...ids, ...getAllDescendants(child.id)];
      });
      return ids;
    };
    
    return getAllDescendants(selectedWbsId);
  }, [selectedWbsId, wbsList]);

  // Filtrar atividades por WBS selecionada
  // Quando um WBS é selecionado, mostra atividades desse WBS e seus filhos
  // Atividades sem wbs_id são sempre exibidas (não classificadas)
  const atividadesFiltradas = useMemo(() => {
    if (!getDescendantWbsIds) return atividades;
    return atividades.filter((a) => {
      // Se atividade não tem wbs_id, sempre exibe (não classificada)
      if (!a.wbs_id) return true;
      // Se tem wbs_id, verifica se está no filtro
      return getDescendantWbsIds.includes(a.wbs_id);
    });
  }, [atividades, getDescendantWbsIds]);

  // Agrupar atividades por data
  const atividadesPorData = useMemo(() => {
    const agrupadas: { [key: string]: AtividadeLPS[] } = {};
    datas.forEach((data) => {
      const key = format(data, 'yyyy-MM-dd');
      agrupadas[key] = atividadesFiltradas.filter((atividade) => {
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
  }, [datas, atividadesFiltradas]);

  // Obter nome do dia da semana
  const getDiaSemana = (data: Date): string => {
    return format(data, 'EEE', { locale: ptBR });
  };

  const getRestricoesAtividade = useMemo(() => {
    const map: Record<string, RestricaoLPS[]> = {};
    restricoes.forEach((r) => {
      if (r.atividade_id) {
        if (!map[r.atividade_id]) {
          map[r.atividade_id] = [];
        }
        map[r.atividade_id].push(r);
      }
    });
    return map;
  }, [restricoes]);

  const getCorCategoria = (atividade: AtividadeLPS): string => {
    const restricoesAtividade = getRestricoesAtividade[atividade.id] || [];
    
    if (restricoesAtividade.length === 0) {
      return 'bg-green-200 border-green-500 hover:bg-green-300';
    }
    
    const temRestricoesAtrasadas = restricoesAtividade.some(
      (r) => r.status === 'ATRASADA'
    );
    const temRestricoesPendentes = restricoesAtividade.some(
      (r) => r.status === 'PENDENTE'
    );
    
    if (temRestricoesAtrasadas) {
      return 'bg-red-200 border-red-400 hover:bg-red-300';
    }
    if (temRestricoesPendentes) {
      return 'bg-yellow-200 border-yellow-400 hover:bg-yellow-300';
    }
    return 'bg-green-200 border-green-500 hover:bg-green-300';
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
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Calendário com scroll */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="flex min-w-max">
          {datas.map((data) => {
            const key = format(data, 'yyyy-MM-dd');
            const atividadesDoDia = atividadesPorData[key] || [];
            const diaSemana = getDiaSemana(data);
            const isFimDeSemana = data.getDay() === 0 || data.getDay() === 6;

            return (
              <div
                key={key}
                className="flex-shrink-0 w-48 border-r border-gray-200 flex flex-col bg-white"
                onDrop={(e) => handleDrop(e, data)}
                onDragOver={handleDragOver}
              >
                {/* Header da coluna (data e dia da semana) */}
                <div
                  className={`px-2 py-2 border-b border-gray-300 text-center font-semibold sticky top-0 z-10 ${
                    isFimDeSemana ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-bold">{format(data, 'dd/MM')}</div>
                  <div className="text-xs uppercase">{diaSemana}</div>
                </div>

                {/* Área de atividades (post-its) */}
                <div className="flex-1 p-2 space-y-2 bg-white min-h-[300px]">
                  {atividadesDoDia.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8 opacity-50">
                      Arraste atividades aqui
                    </div>
                  ) : (
                    atividadesDoDia.map((atividade) => {
                      const restricoesAtividade = getRestricoesAtividade[atividade.id] || [];
                      const restricoesPendentes = restricoesAtividade.filter(
                        (r) => r.status === 'PENDENTE' || r.status === 'ATRASADA'
                      ).length;
                      const restricoesResolvidas = restricoesAtividade.filter(
                        (r) => r.status === 'CONCLUIDA'
                      ).length;
                      const restricoesTotal = restricoesAtividade.length;
                      
                      return (
                        <ActivityCard
                          key={atividade.id}
                          atividade={atividade}
                          onClick={() => onActivityClick?.(atividade)}
                          cor={getCorCategoria(atividade)}
                          restricoesCount={restricoesPendentes}
                          restricoesTotalCount={restricoesTotal}
                          restricoesResolvidasCount={restricoesResolvidas}
                          empresaId={empresaId}
                          prontidao={prontidaoMap[atividade.id]}
                          onAddRestricao={onAddRestricao}
                          onOpenProntidao={onOpenProntidao}
                        />
                      );
                    })
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

