/**
 * ActivityCard - Componente de post-it para atividades no LPS
 * Card arrastável que representa uma atividade no calendário
 * Formato: Código | Nome | Responsável | Datas | Tags
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, StatusAtividadeLPS, TipoAtividadeLPS, ResumoProntidao } from '../../../types/lps';
import { AlertTriangle, CheckCircle, Plus, MoreVertical } from 'lucide-react';

interface ActivityCardProps {
  atividade: AtividadeLPS;
  onClick?: () => void;
  cor?: string;
  restricoesCount?: number;
  compact?: boolean;
  empresaId?: string;
  prontidao?: ResumoProntidao | null;
  onAddRestricao?: (atividade: AtividadeLPS) => void;
  onOpenProntidao?: (atividade: AtividadeLPS) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  atividade,
  onClick,
  cor = 'bg-green-200 border-green-500',
  restricoesCount = 0,
  compact = false,
  prontidao,
  onAddRestricao,
  onOpenProntidao,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('atividade-id', atividade.id);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const getStatusColor = (status: StatusAtividadeLPS): string => {
    switch (status) {
      case StatusAtividadeLPS.CONCLUIDA:
        return 'bg-green-500';
      case StatusAtividadeLPS.EM_ANDAMENTO:
        return 'bg-blue-500';
      case StatusAtividadeLPS.ATRASADA:
        return 'bg-red-500';
      case StatusAtividadeLPS.BLOQUEADA:
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = (status: StatusAtividadeLPS): string => {
    switch (status) {
      case StatusAtividadeLPS.CONCLUIDA:
        return 'Concluída';
      case StatusAtividadeLPS.EM_ANDAMENTO:
        return 'Em Andamento';
      case StatusAtividadeLPS.ATRASADA:
        return 'Atrasada';
      case StatusAtividadeLPS.BLOQUEADA:
        return 'Bloqueada';
      default:
        return 'Planejada';
    }
  };

  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return null;
  };

  const dataInicio = parseDate(atividade.data_inicio);
  const dataFim = parseDate(atividade.data_fim);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`${cor} border-2 rounded-lg shadow-sm p-2.5 cursor-move hover:shadow-md transition-shadow text-sm relative ${
        atividade.tipo === TipoAtividadeLPS.CRITICA ? 'ring-2 ring-red-500' : ''
      }`}
      style={{
        minHeight: compact ? '60px' : '110px',
        maxWidth: '100%',
        paddingBottom: prontidao && prontidao.totalCondicoes > 0 ? '28px' : '10px',
      }}
    >
      {/* Código da atividade */}
      {atividade.codigo && (
        <div className="text-xs font-bold text-green-700 mb-1">
          {atividade.codigo}
        </div>
      )}

      {/* Nome da atividade */}
      <div className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1.5">
        {atividade.nome}
      </div>

      {/* Responsável */}
      {atividade.responsavel && (
        <div className="text-xs text-gray-600 mb-0.5">
          <span className="font-medium">Resp:</span> {atividade.responsavel}
        </div>
      )}

      {/* Datas */}
      {dataInicio && dataFim && (
        <div className="text-xs text-gray-500 mb-1.5">
          {format(dataInicio, 'dd/MM', { locale: ptBR })} - {format(dataFim, 'dd/MM', { locale: ptBR })}
        </div>
      )}

      {/* Tags como badges com borda */}
      {atividade.tags && atividade.tags.length > 0 && !compact && (
        <div className="flex flex-wrap gap-1 mt-1">
          {atividade.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-1.5 py-0.5 bg-white border border-gray-400 rounded text-xs text-gray-700"
            >
              {tag}
            </span>
          ))}
          {atividade.tags.length > 3 && (
            <span className="text-xs text-gray-500">+{atividade.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Indicador de status (pequeno ponto) */}
      <div
        className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(atividade.status)}`}
        title={getStatusText(atividade.status)}
      />

      {/* Indicador de tipo crítico */}
      {atividade.tipo === TipoAtividadeLPS.CRITICA && (
        <div className="absolute top-2 right-5 w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Atividade Crítica" />
      )}

      {/* Badge de restrições pendentes */}
      {restricoesCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
          {restricoesCount}
        </div>
      )}

      {/* Badge de prontidão */}
      {prontidao && prontidao.totalCondicoes > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenProntidao?.(atividade);
          }}
          className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium transition-colors ${
            prontidao.prontaParaExecucao
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          }`}
          title={`${prontidao.condicoesAtendidas}/${prontidao.totalCondicoes - prontidao.condicoesNaoAplicaveis} condições atendidas`}
        >
          {prontidao.prontaParaExecucao ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <AlertTriangle className="w-3 h-3" />
          )}
          {prontidao.condicoesAtendidas}/{prontidao.totalCondicoes - prontidao.condicoesNaoAplicaveis}
        </button>
      )}

      {/* Botão de menu de ações */}
      {onAddRestricao && (
        <div className="absolute bottom-1.5 right-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="p-1 rounded hover:bg-black/10 transition-colors"
            title="Ações rápidas"
          >
            <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
          </button>

          {/* Menu dropdown de ações */}
          {showActions && (
            <div 
              className="absolute bottom-full right-0 mb-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px] z-50"
              onMouseLeave={() => setShowActions(false)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddRestricao(atividade);
                  setShowActions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" />
                Nova Restrição
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
