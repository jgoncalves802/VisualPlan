/**
 * LPSA3PrintViewer - Visualizador para impressão em formato A3
 * Exibe cronograma de atividades e restrições para expor na frente da obra
 */

import React, { useMemo, useRef, useState } from 'react';
import { format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, RestricaoLPS, StatusAtividadeLPS } from '../../../types/lps';
import { X, Printer, ChevronLeft, ChevronRight } from 'lucide-react';

interface LPSA3PrintViewerProps {
  isOpen: boolean;
  onClose: () => void;
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  dataInicio: Date;
  dataFim: Date;
  projetoNome?: string;
}

interface PageData {
  weekStart: Date;
  weekEnd: Date;
  days: Date[];
  pageNumber: number;
}

export const LPSA3PrintViewer: React.FC<LPSA3PrintViewerProps> = ({
  isOpen,
  onClose,
  atividades,
  restricoes,
  dataInicio,
  dataFim,
  projetoNome = 'VisionPlan - Planejamento Puxado',
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const parseDate = (date: any): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  };

  const pages: PageData[] = useMemo(() => {
    const result: PageData[] = [];
    let weekStart = startOfWeek(parseDate(dataInicio), { locale: ptBR });
    const finalDate = parseDate(dataFim);
    let pageNumber = 1;

    while (weekStart <= finalDate) {
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
        (day) => day.getDay() !== 0 && day.getDay() !== 6
      );

      if (days.length > 0) {
        result.push({
          weekStart,
          weekEnd,
          days,
          pageNumber,
        });
        pageNumber++;
      }
      weekStart = addWeeks(weekStart, 1);
    }
    return result;
  }, [dataInicio, dataFim]);

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

  const getAtividadesPorDia = (dia: Date) => {
    return atividades.filter((atividade) => {
      const dataAtribuida = atividade.data_atribuida
        ? parseDate(atividade.data_atribuida)
        : parseDate(atividade.data_inicio);
      return isSameDay(dataAtribuida, dia);
    });
  };

  const getCorAtividade = (atividade: AtividadeLPS) => {
    const restricoesAtiv = getRestricoesAtividade[atividade.id] || [];
    const temRestricoesPendentes = restricoesAtiv.some(
      (r) => r.status === 'PENDENTE' || r.status === 'ATRASADA'
    );

    if (temRestricoesPendentes) {
      return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
    }
    return { bg: '#D1FAE5', border: '#10B981', text: '#065F46' };
  };

  const getStatusColor = (status: StatusAtividadeLPS) => {
    switch (status) {
      case StatusAtividadeLPS.CONCLUIDA:
        return '#10B981';
      case StatusAtividadeLPS.EM_ANDAMENTO:
        return '#3B82F6';
      case StatusAtividadeLPS.ATRASADA:
        return '#EF4444';
      case StatusAtividadeLPS.BLOQUEADA:
        return '#6B7280';
      default:
        return '#9CA3AF';
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LPS - Planejamento Puxado - Impressão A3</title>
          <style>
            @page {
              size: A3 landscape;
              margin: 15mm;
            }
            
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              color: #1F2937;
            }
            
            .page {
              width: 100%;
              height: 100%;
              page-break-after: always;
              padding: 10mm;
              border: 2px solid #3B82F6;
              border-radius: 8px;
              margin-bottom: 10mm;
            }
            
            .page:last-child {
              page-break-after: auto;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 8mm;
              border-bottom: 2px solid #3B82F6;
              margin-bottom: 8mm;
            }
            
            .header-title {
              font-size: 18pt;
              font-weight: bold;
              color: #1E40AF;
            }
            
            .header-subtitle {
              font-size: 12pt;
              color: #6B7280;
            }
            
            .header-date {
              font-size: 11pt;
              font-weight: 600;
              color: #374151;
              text-align: right;
            }
            
            .header-page {
              font-size: 10pt;
              color: #9CA3AF;
            }
            
            .calendar-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 4mm;
              height: calc(100% - 30mm);
            }
            
            .day-column {
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            
            .day-header {
              background: #3B82F6;
              color: white;
              padding: 3mm;
              text-align: center;
              font-weight: bold;
            }
            
            .day-date {
              font-size: 14pt;
            }
            
            .day-name {
              font-size: 9pt;
              text-transform: uppercase;
              opacity: 0.9;
            }
            
            .day-content {
              flex: 1;
              padding: 2mm;
              overflow: hidden;
              background: #F9FAFB;
            }
            
            .activity-card {
              padding: 2mm;
              border-radius: 4px;
              margin-bottom: 2mm;
              border-left: 3px solid;
              font-size: 8pt;
            }
            
            .activity-name {
              font-weight: 600;
              margin-bottom: 1mm;
              line-height: 1.2;
            }
            
            .activity-resp {
              font-size: 7pt;
              color: #6B7280;
            }
            
            .activity-restrictions {
              margin-top: 1mm;
              padding-top: 1mm;
              border-top: 1px dashed #D1D5DB;
            }
            
            .restriction-item {
              font-size: 7pt;
              color: #92400E;
              margin-bottom: 0.5mm;
              display: flex;
              align-items: flex-start;
              gap: 1mm;
            }
            
            .restriction-bullet {
              color: #F59E0B;
              font-weight: bold;
            }
            
            .legend {
              display: flex;
              justify-content: center;
              gap: 8mm;
              padding-top: 4mm;
              border-top: 1px solid #E5E7EB;
              margin-top: 4mm;
            }
            
            .legend-item {
              display: flex;
              align-items: center;
              gap: 2mm;
              font-size: 8pt;
            }
            
            .legend-color {
              width: 4mm;
              height: 4mm;
              border-radius: 2px;
            }
            
            .footer {
              text-align: center;
              font-size: 8pt;
              color: #9CA3AF;
              margin-top: 4mm;
            }

            @media print {
              .page {
                page-break-after: always;
                height: auto;
                min-height: 250mm;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!isOpen) return null;

  const currentPageData = pages[currentPage];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-[1600px] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Visualizador de Impressão A3</h2>
            <p className="text-sm text-blue-200">Formato otimizado para exposição na frente da obra</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-700 rounded-lg px-3 py-2">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="p-1 hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                Página {currentPage + 1} de {pages.length}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pages.length - 1, currentPage + 1))}
                disabled={currentPage >= pages.length - 1}
                className="p-1 hover:bg-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              <Printer size={18} />
              <span className="font-medium">Imprimir A3</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-auto p-6 bg-gray-100">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto" style={{ aspectRatio: '420/297', maxWidth: '1400px' }}>
            {currentPageData && (
              <div className="h-full p-6 flex flex-col border-2 border-blue-500 rounded-lg">
                {/* Page Header */}
                <div className="flex justify-between items-center pb-4 border-b-2 border-blue-500 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-800">{projetoNome}</h1>
                    <p className="text-gray-500">Last Planner System - Planejamento Semanal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">
                      Semana: {format(currentPageData.weekStart, "dd/MM", { locale: ptBR })} - {format(currentPageData.weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-400">
                      Página {currentPageData.pageNumber} de {pages.length}
                    </p>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-5 gap-3">
                  {currentPageData.days.map((dia) => {
                    const atividadesDia = getAtividadesPorDia(dia);
                    return (
                      <div key={dia.toISOString()} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                        <div className="bg-blue-600 text-white py-2 px-3 text-center">
                          <div className="text-xl font-bold">{format(dia, 'dd/MM')}</div>
                          <div className="text-xs uppercase opacity-90">
                            {format(dia, 'EEEE', { locale: ptBR })}
                          </div>
                        </div>
                        <div className="flex-1 p-2 bg-gray-50 overflow-y-auto space-y-2">
                          {atividadesDia.length === 0 ? (
                            <div className="text-center text-gray-400 text-xs py-4">
                              Sem atividades
                            </div>
                          ) : (
                            atividadesDia.map((atividade) => {
                              const cores = getCorAtividade(atividade);
                              const restricoesAtiv = getRestricoesAtividade[atividade.id] || [];
                              const restricoesPendentes = restricoesAtiv.filter(
                                (r) => r.status === 'PENDENTE' || r.status === 'ATRASADA'
                              );
                              
                              return (
                                <div
                                  key={atividade.id}
                                  className="rounded p-2 text-xs"
                                  style={{
                                    backgroundColor: cores.bg,
                                    borderLeft: `3px solid ${cores.border}`,
                                    color: cores.text,
                                  }}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="font-semibold text-sm leading-tight flex-1">
                                      {atividade.nome}
                                    </div>
                                    <div
                                      className="w-2 h-2 rounded-full ml-1 flex-shrink-0"
                                      style={{ backgroundColor: getStatusColor(atividade.status) }}
                                      title={atividade.status}
                                    />
                                  </div>
                                  {atividade.responsavel && (
                                    <div className="text-xs opacity-75 mt-1">
                                      Resp: {atividade.responsavel}
                                    </div>
                                  )}
                                  {restricoesPendentes.length > 0 && (
                                    <div className="mt-1 pt-1 border-t border-dashed border-yellow-400">
                                      <div className="text-xs font-medium text-amber-700 mb-1">
                                        Restrições ({restricoesPendentes.length}):
                                      </div>
                                      {restricoesPendentes.slice(0, 2).map((rest) => (
                                        <div key={rest.id} className="flex items-start gap-1 text-xs text-amber-600">
                                          <span className="text-amber-500 font-bold">•</span>
                                          <span className="line-clamp-1">{rest.descricao}</span>
                                        </div>
                                      ))}
                                      {restricoesPendentes.length > 2 && (
                                        <div className="text-xs text-amber-500 italic">
                                          +{restricoesPendentes.length - 2} mais...
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex justify-center gap-6 pt-3 mt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-green-200 border border-green-500" />
                    <span>Sem restrições</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-500" />
                    <span>Com restrições pendentes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>Concluída</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Em andamento</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span>Atrasada</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 mt-2">
                  Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • VisionPlan v2.2
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden print content */}
        <div ref={printRef} className="hidden">
          {pages.map((page) => (
            <div key={page.pageNumber} className="page">
              <div className="header">
                <div>
                  <div className="header-title">{projetoNome}</div>
                  <div className="header-subtitle">Last Planner System - Planejamento Semanal</div>
                </div>
                <div>
                  <div className="header-date">
                    Semana: {format(page.weekStart, "dd/MM", { locale: ptBR })} - {format(page.weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="header-page">Página {page.pageNumber} de {pages.length}</div>
                </div>
              </div>

              <div className="calendar-grid">
                {page.days.map((dia) => {
                  const atividadesDia = getAtividadesPorDia(dia);
                  return (
                    <div key={dia.toISOString()} className="day-column">
                      <div className="day-header">
                        <div className="day-date">{format(dia, 'dd/MM')}</div>
                        <div className="day-name">{format(dia, 'EEEE', { locale: ptBR })}</div>
                      </div>
                      <div className="day-content">
                        {atividadesDia.map((atividade) => {
                          const cores = getCorAtividade(atividade);
                          const restricoesAtiv = getRestricoesAtividade[atividade.id] || [];
                          const restricoesPendentes = restricoesAtiv.filter(
                            (r) => r.status === 'PENDENTE' || r.status === 'ATRASADA'
                          );

                          return (
                            <div
                              key={atividade.id}
                              className="activity-card"
                              style={{
                                backgroundColor: cores.bg,
                                borderColor: cores.border,
                                color: cores.text,
                              }}
                            >
                              <div className="activity-name">{atividade.nome}</div>
                              {atividade.responsavel && (
                                <div className="activity-resp">Resp: {atividade.responsavel}</div>
                              )}
                              {restricoesPendentes.length > 0 && (
                                <div className="activity-restrictions">
                                  {restricoesPendentes.slice(0, 3).map((rest) => (
                                    <div key={rest.id} className="restriction-item">
                                      <span className="restriction-bullet">•</span>
                                      <span>{rest.descricao}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981' }} />
                  <span>Sem restrições</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }} />
                  <span>Com restrições</span>
                </div>
              </div>

              <div className="footer">
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • VisionPlan v2.2
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
