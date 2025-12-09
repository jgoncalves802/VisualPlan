/**
 * ActivityCard - Componente de post-it para atividades no LPS
 * Card arrastável que representa uma atividade no calendário
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, StatusAtividadeLPS, TipoAtividadeLPS } from '../../../types/lps';

interface ActivityCardProps {
  atividade: AtividadeLPS;
  onClick?: () => void;
  cor?: string;
  restricoesCount?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  atividade,
  onClick,
  cor = 'bg-green-200 border-green-500',
  restricoesCount = 0,
}) => {
  // Handler para iniciar drag
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('atividade-id', atividade.id);
    e.dataTransfer.effectAllowed = 'move';
    // Adicionar classe visual de drag
    e.currentTarget.classList.add('opacity-50');
  };

  // Handler para terminar drag
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  // Obter cor do status
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

  // Obter texto do status
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

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`${cor} border-2 rounded shadow-sm p-2 cursor-move hover:shadow-md transition-shadow text-sm relative ${
        atividade.tipo === TipoAtividadeLPS.CRITICA ? 'ring-2 ring-red-500' : ''
      }`}
      style={{
        minHeight: '80px',
        maxWidth: '100%',
      }}
    >
      {/* Cabeçalho do card */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          {atividade.codigo && (
            <div className="text-xs font-bold text-gray-700 mb-1">{atividade.codigo}</div>
          )}
          <div className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
            {atividade.nome}
          </div>
        </div>
        {/* Indicador de status */}
        <div
          className={`w-2 h-2 rounded-full ${getStatusColor(atividade.status)} ml-1 flex-shrink-0`}
          title={getStatusText(atividade.status)}
        />
      </div>

      {/* Informações adicionais */}
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        {atividade.responsavel && (
          <div className="flex items-center">
            <span className="font-medium">Resp:</span>
            <span className="ml-1 truncate">{atividade.responsavel}</span>
          </div>
        )}
        {atividade.data_inicio && atividade.data_fim && (
          <div className="text-xs text-gray-500">
            {format(atividade.data_inicio, 'dd/MM', { locale: ptBR })} -{' '}
            {format(atividade.data_fim, 'dd/MM', { locale: ptBR })}
          </div>
        )}
        {atividade.tags && atividade.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {atividade.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-1 py-0.5 bg-gray-300 rounded text-xs text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Indicador de tipo crítico */}
      {atividade.tipo === TipoAtividadeLPS.CRITICA && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
      )}

      {/* Badge de restrições pendentes */}
      {restricoesCount > 0 && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
          {restricoesCount}
        </div>
      )}
    </div>
  );
};

