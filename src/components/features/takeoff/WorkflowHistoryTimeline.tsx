import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, 
  ThumbsUp, 
  Play, 
  Square, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { takeoffItemEtapasService } from '../../../services/takeoffItemEtapasService';
import type { WorkflowStatus } from '../../../types/criteriosMedicao.types';

interface WorkflowHistoryTimelineProps {
  etapaId: string;
  onClose?: () => void;
}

interface TimelineEvent {
  id: string;
  action: string;
  label: string;
  date?: Date;
  usuario?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  observacao?: string;
}

const statusLabels: Record<WorkflowStatus, string> = {
  pendente: 'Pendente',
  programado: 'Programado',
  em_producao: 'Em Produção',
  producao_concluida: 'Produção Concluída',
  avancado: 'Avançado',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const actionConfigs: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  programar: { icon: <CalendarCheck className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  aceitar_programacao: { icon: <ThumbsUp className="w-4 h-4" />, color: 'text-green-600', bgColor: 'bg-green-100' },
  iniciar_producao: { icon: <Play className="w-4 h-4" />, color: 'text-amber-600', bgColor: 'bg-amber-100' },
  terminar_producao: { icon: <Square className="w-4 h-4" />, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  registrar_avanco: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  aprovar_fiscalizacao: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600', bgColor: 'bg-green-100' },
  rejeitar: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-600', bgColor: 'bg-red-100' },
};

export const WorkflowHistoryTimeline: React.FC<WorkflowHistoryTimelineProps> = ({
  etapaId,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [currentStatus, setCurrentStatus] = useState<WorkflowStatus>('pendente');

  useEffect(() => {
    loadHistory();
  }, [etapaId]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const history = await takeoffItemEtapasService.getWorkflowHistory(etapaId);
      if (!history) {
        setEvents([]);
        return;
      }

      setCurrentStatus(history.status);

      const timelineEvents: TimelineEvent[] = [];

      if (history.dataProposta) {
        const config = actionConfigs['programar'];
        timelineEvents.push({
          id: 'programar',
          action: 'programar',
          label: 'Programado',
          date: history.dataProposta,
          usuario: history.proponente,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataValidacao) {
        const config = actionConfigs['aceitar_programacao'];
        timelineEvents.push({
          id: 'aceitar_programacao',
          action: 'aceitar_programacao',
          label: 'Programação Aceita',
          date: history.dataValidacao,
          usuario: history.validador,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataInicio) {
        const config = actionConfigs['iniciar_producao'];
        timelineEvents.push({
          id: 'iniciar_producao',
          action: 'iniciar_producao',
          label: 'Produção Iniciada',
          date: history.dataInicio,
          usuario: history.usuarioInicio,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataTermino) {
        const config = actionConfigs['terminar_producao'];
        timelineEvents.push({
          id: 'terminar_producao',
          action: 'terminar_producao',
          label: 'Produção Concluída',
          date: history.dataTermino,
          usuario: history.usuarioTermino,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataAvanco) {
        const config = actionConfigs['registrar_avanco'];
        timelineEvents.push({
          id: 'registrar_avanco',
          action: 'registrar_avanco',
          label: 'Avanço Registrado',
          date: history.dataAvanco,
          usuario: history.usuarioAvanco,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataAprovacao) {
        const config = actionConfigs['aprovar_fiscalizacao'];
        timelineEvents.push({
          id: 'aprovar_fiscalizacao',
          action: 'aprovar_fiscalizacao',
          label: 'Aprovado pela Fiscalização',
          date: history.dataAprovacao,
          usuario: history.usuarioAprovacao,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
        });
      }

      if (history.dataFiscalizacao && history.status === 'rejeitado') {
        const config = actionConfigs['rejeitar'];
        timelineEvents.push({
          id: 'rejeitar',
          action: 'rejeitar',
          label: 'Rejeitado',
          date: history.dataFiscalizacao,
          usuario: history.fiscalizador,
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
          observacao: history.motivoRejeicao,
        });
      }

      timelineEvents.sort((a, b) => {
        if (!a.date) return 1;
        if (!b.date) return -1;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      setEvents(timelineEvents);
    } catch (error) {
      console.error('[WorkflowHistoryTimeline] Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        <span className="ml-2 text-sm theme-text-secondary">Carregando histórico...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold theme-text">Histórico do Workflow</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          currentStatus === 'aprovado' ? 'bg-green-100 text-green-700' :
          currentStatus === 'rejeitado' ? 'bg-red-100 text-red-700' :
          currentStatus === 'em_producao' ? 'bg-amber-100 text-amber-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {statusLabels[currentStatus]}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 theme-text-secondary">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma ação registrada ainda</p>
          <p className="text-sm mt-1">O item está aguardando a primeira ação</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-gray-700" />
          
          <div className="space-y-4">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4 pl-2">
                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${event.bgColor}`}>
                  <span className={event.color}>{event.icon}</span>
                </div>
                
                <div className="flex-1 min-w-0 pb-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${event.color}`}>{event.label}</span>
                    {index === events.length - 1 && currentStatus !== 'rejeitado' && currentStatus !== 'aprovado' && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">Atual</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-1 text-sm theme-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(event.date)}
                    </span>
                    {event.usuario && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.usuario}
                      </span>
                    )}
                  </div>

                  {event.observacao && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <MessageSquare className="w-3 h-3" />
                        {event.observacao}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {onClose && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium theme-text bg-gray-100 dark:bg-gray-800 rounded-lg hover:opacity-80 transition-opacity"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkflowHistoryTimeline;
