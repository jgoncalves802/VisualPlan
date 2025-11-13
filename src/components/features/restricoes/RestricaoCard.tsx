/**
 * RestricaoCard - Componente de post-it para restrições no calendário
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricaoLPS, TipoRestricao } from '../../../types/lps';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface RestricaoCardProps {
  restricao: RestricaoLPS;
  onClick?: () => void;
}

export const RestricaoCard: React.FC<RestricaoCardProps> = ({ restricao, onClick }) => {
  // Helper para converter para Date
  const parseDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  // Obter cor baseada no status e tipo
  const getCor = (): string => {
    if (restricao.status === 'CONCLUIDA') {
      return 'bg-green-200 border-green-400';
    }
    if (restricao.status === 'ATRASADA') {
      return 'bg-red-200 border-red-400';
    }
    if (restricao.tipo === TipoRestricao.RESTRICAO) {
      return 'bg-orange-200 border-orange-400';
    }
    return 'bg-blue-200 border-blue-400';
  };

  // Obter ícone baseado no status
  const getIcon = () => {
    switch (restricao.status) {
      case 'CONCLUIDA':
        return <CheckCircle2 size={14} className="text-green-600" />;
      case 'ATRASADA':
        return <AlertCircle size={14} className="text-red-600" />;
      case 'PENDENTE':
        return <Clock size={14} className="text-blue-600" />;
      case 'CANCELADA':
        return <XCircle size={14} className="text-gray-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  // Obter badge de prioridade
  const getPrioridadeBadge = () => {
    if (!restricao.prioridade) return null;
    const cores = {
      ALTA: 'bg-red-100 text-red-800',
      MEDIA: 'bg-yellow-100 text-yellow-800',
      BAIXA: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${cores[restricao.prioridade]}`}>
        {restricao.prioridade}
      </span>
    );
  };

  // Verificar se há histórico de reagendamentos
  const temHistorico = restricao.historico && restricao.historico.length > 0;

  return (
    <div
      onClick={onClick}
      className={`${getCor()} border-2 rounded shadow-sm p-2 cursor-pointer hover:shadow-md transition-shadow text-sm relative`}
      style={{
        minHeight: '90px',
        maxWidth: '100%',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            {getIcon()}
            <span className="font-semibold text-gray-900 text-xs leading-tight line-clamp-2">
              {restricao.descricao}
            </span>
          </div>
        </div>
        {getPrioridadeBadge()}
      </div>

      {/* Tipo de restrição */}
      <div className="mb-1">
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${
            restricao.tipo === TipoRestricao.RESTRICAO
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}
        >
          {restricao.tipo === TipoRestricao.RESTRICAO ? 'Com Restrição (S)' : 'Sem Restrição (N)'}
        </span>
      </div>

      {/* Informações */}
      <div className="mt-2 space-y-1 text-xs text-gray-600">
        {restricao.responsavel && (
          <div className="flex items-center">
            <span className="font-medium">Resp:</span>
            <span className="ml-1 truncate">{restricao.responsavel}</span>
          </div>
        )}
        {restricao.apoio && (
          <div className="flex items-center">
            <span className="font-medium">Apoio:</span>
            <span className="ml-1 truncate">{restricao.apoio}</span>
          </div>
        )}
        {(() => {
          const dataPlanejada = parseDate(restricao.data_conclusao_planejada);
          if (!dataPlanejada) return null;
          return (
            <div className="text-xs text-gray-500">
              {format(dataPlanejada, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          );
        })()}
      </div>

      {/* Indicador de histórico */}
      {temHistorico && (
        <div className="absolute top-1 right-1 bg-yellow-400 rounded-full w-2 h-2" title="Tem histórico de reagendamentos" />
      )}

      {/* Indicador de impacto */}
      {restricao.impacto_previsto && (
        <div className="mt-1 text-xs text-orange-700 font-medium">
          ⚠️ {restricao.impacto_previsto.substring(0, 30)}
          {restricao.impacto_previsto.length > 30 ? '...' : ''}
        </div>
      )}
    </div>
  );
};

