/**
 * RestricaoHistoryModal - Modal para visualizar histórico de reagendamentos de uma restrição
 */

import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricaoLPS, RestricaoHistorico } from '../../../types/lps';
import { X, Calendar, AlertTriangle, User, FileText, Image, Clock, Eye, Trash2 } from 'lucide-react';

interface RestricaoHistoryModalProps {
  restricao: RestricaoLPS | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RestricaoHistoryModal: React.FC<RestricaoHistoryModalProps> = ({
  restricao,
  isOpen,
  onClose,
}) => {
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

  if (!isOpen || !restricao) return null;

  const historico = restricao.historico || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Histórico de Reagendamentos</h2>
            <p className="text-sm text-blue-100 mt-1">{restricao.descricao}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Informações da restrição */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Informações da Restrição</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Data de Criação:</span>
                <span className="ml-2 text-gray-900">
                  {(() => {
                    const dataCriacao = parseDate(restricao.data_criacao);
                    return dataCriacao
                      ? format(dataCriacao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      : '-';
                  })()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Data Atual Planejada:</span>
                <span className="ml-2 text-gray-900">
                  {(() => {
                    const dataPlanejada = parseDate(restricao.data_conclusao_planejada);
                    return dataPlanejada
                      ? format(dataPlanejada, "dd 'de' MMMM 'de' yyyy", {
                          locale: ptBR,
                        })
                      : '-';
                  })()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2 text-gray-900">{restricao.status}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Prioridade:</span>
                <span className="ml-2 text-gray-900">{restricao.prioridade || '-'}</span>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              Reagendamentos ({historico.length})
            </h3>
            {historico.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar size={48} className="mx-auto mb-3 text-gray-400" />
                <p>Nenhum reagendamento registrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historico
                  .filter((item) => {
                    const dataReagendamento = parseDate(item.data_reagendamento);
                    return dataReagendamento !== null;
                  })
                  .sort((a, b) => {
                    const dataA = parseDate(a.data_reagendamento);
                    const dataB = parseDate(b.data_reagendamento);
                    const timeA = dataA ? dataA.getTime() : 0;
                    const timeB = dataB ? dataB.getTime() : 0;
                    return timeB - timeA;
                  })
                  .map((item, index) => {
                    const dataReagendamento = parseDate(item.data_reagendamento);
                    const dataAnterior = parseDate(item.data_anterior);
                    const dataNova = parseDate(item.data_nova);
                    
                    if (!dataReagendamento) return null;
                    
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                              {historico.length - index}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                Reagendamento #{historico.length - index}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(dataReagendamento, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                              <div className="text-xs text-gray-500">Data Anterior</div>
                              <div className="text-sm font-medium text-gray-900">
                                {dataAnterior
                                  ? format(dataAnterior, "dd 'de' MMMM 'de' yyyy", {
                                      locale: ptBR,
                                    })
                                  : '-'}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-blue-600" />
                            <div>
                              <div className="text-xs text-gray-500">Nova Data</div>
                              <div className="text-sm font-medium text-blue-600">
                                {dataNova
                                  ? format(dataNova, "dd 'de' MMMM 'de' yyyy", {
                                      locale: ptBR,
                                    })
                                  : '-'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {item.motivo && (
                          <div className="mb-3">
                            <div className="text-xs text-gray-500 mb-1">Motivo:</div>
                            <div className="text-sm text-gray-900 bg-gray-50 rounded p-2">
                              {item.motivo}
                            </div>
                          </div>
                        )}

                        {item.impacto && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-xs text-orange-600 mb-1">
                              <AlertTriangle size={14} />
                              <span className="font-semibold">Impacto:</span>
                            </div>
                            <div className="text-sm text-orange-800 bg-orange-50 rounded p-2">
                              {item.impacto}
                            </div>
                          </div>
                        )}

                        {item.responsavel && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <User size={14} />
                            <span>Responsável pelo reagendamento: {item.responsavel}</span>
                          </div>
                        )}

                        {/* Linha do tempo */}
                        {index < historico.length - 1 && (
                          <div className="border-l-2 border-gray-300 ml-4 mt-2 h-4"></div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Análise de impactos */}
          {historico.length > 0 && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                <AlertTriangle size={20} />
                Análise de Impactos
              </h3>
              <div className="text-sm text-orange-800">
                <p className="mb-2">
                  Esta restrição foi reagendada <strong>{historico.length} vez(es)</strong>.
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {historico.map((item, index) => {
                    if (!item.impacto) return null;
                    return (
                      <li key={item.id}>
                        Reagendamento #{historico.length - index}: {item.impacto}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}

          {/* Histórico de Andamento */}
          {restricao.andamento && restricao.andamento.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={20} />
                Histórico de Andamento ({restricao.andamento.length})
              </h3>
              <div className="space-y-3">
                {restricao.andamento
                  .sort((a, b) => {
                    const dataA = parseDate(a.data);
                    const dataB = parseDate(b.data);
                    const timeA = dataA ? dataA.getTime() : 0;
                    const timeB = dataB ? dataB.getTime() : 0;
                    return timeB - timeA;
                  })
                  .map((andamento) => {
                    const dataAndamento = parseDate(andamento.data);
                    return (
                      <div
                        key={andamento.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {dataAndamento
                              ? format(dataAndamento, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                                  locale: ptBR,
                                })
                              : '-'}
                          </span>
                          {andamento.responsavel && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User size={12} />
                              {andamento.responsavel}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{andamento.descricao}</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Evidências */}
          {restricao.evidencias && restricao.evidencias.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Evidências ({restricao.evidencias.length})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {restricao.evidencias.map((evidencia) => {
                  const dataUpload = parseDate(evidencia.data_upload);
                  return (
                    <div
                      key={evidencia.id}
                      className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {evidencia.tipo_arquivo === 'PDF' ? (
                          <FileText size={20} className="text-red-600" />
                        ) : (
                          <Image size={20} className="text-blue-600" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {evidencia.nome_arquivo}
                          </p>
                          {dataUpload && (
                            <p className="text-xs text-gray-500">
                              {format(dataUpload, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          )}
                          {evidencia.tamanho && (
                            <p className="text-xs text-gray-500">
                              {(evidencia.tamanho / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={evidencia.url_arquivo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <Eye size={14} />
                          Ver
                        </a>
                        {evidencia.descricao && (
                          <p className="text-xs text-gray-600 truncate">{evidencia.descricao}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resumo de Rastreabilidade */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Resumo de Rastreabilidade</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-blue-700">Criado por:</span>
                <span className="ml-2 text-blue-900">
                  {restricao.criado_por_nome || restricao.responsavel || '-'}
                </span>
              </div>
              <div>
                <span className="font-medium text-blue-700">Data de Criação:</span>
                <span className="ml-2 text-blue-900">
                  {(() => {
                    const dataCriacao = parseDate(restricao.data_criacao);
                    return dataCriacao
                      ? format(dataCriacao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : '-';
                  })()}
                </span>
              </div>
              {restricao.tipo_detalhado && (
                <div>
                  <span className="font-medium text-blue-700">Tipo:</span>
                  <span className="ml-2 text-blue-900">{restricao.tipo_detalhado}</span>
                </div>
              )}
              {restricao.tipo_responsabilidade && (
                <div>
                  <span className="font-medium text-blue-700">Responsabilidade:</span>
                  <span className="ml-2 text-blue-900">{restricao.tipo_responsabilidade}</span>
                </div>
              )}
              {restricao.dias_latencia !== undefined && (
                <div>
                  <span className="font-medium text-blue-700">Dias de Latência:</span>
                  <span className="ml-2 text-blue-900">{restricao.dias_latencia} dias</span>
                </div>
              )}
              {restricao.data_inicio_latencia && (
                <div>
                  <span className="font-medium text-blue-700">Início da Latência:</span>
                  <span className="ml-2 text-blue-900">
                    {(() => {
                      const dataInicioLatencia = parseDate(restricao.data_inicio_latencia);
                      return dataInicioLatencia
                        ? format(dataInicioLatencia, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : '-';
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

