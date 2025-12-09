/**
 * LPSA3PrintViewer - Visualizador para impressão em formato A3
 * Exibe cronograma de atividades e restrições para expor na frente da obra
 * Suporta paginação vertical para overflow de atividades com marcas de continuação
 */

import React, { useMemo, useRef, useState } from 'react';
import { format, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AtividadeLPS, RestricaoLPS, StatusAtividadeLPS } from '../../../types/lps';
import { X, Printer, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

interface LPSA3PrintViewerProps {
  isOpen: boolean;
  onClose: () => void;
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  dataInicio: Date;
  dataFim: Date;
  projetoNome?: string;
}

interface DaySlice {
  dia: Date;
  atividades: AtividadeLPS[];
  hasMore: boolean;
  hasPrevious: boolean;
}

interface PageData {
  weekStart: Date;
  weekEnd: Date;
  weekNumber: number;
  pageIndexInWeek: number;
  totalPagesInWeek: number;
  daySlices: DaySlice[];
  globalPageNumber: number;
}

const LAYOUT_CONSTANTS = {
  CARD_HEIGHT_ESTIMATE: 60,
  CARD_WITH_RESTRICTIONS_HEIGHT: 90,
  GAP_BETWEEN_CARDS: 8,
  HEADER_HEIGHT: 50,
  AVAILABLE_HEIGHT_MM: 180,
  MAX_CARDS_PER_DAY_PER_PAGE: 5,
};

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

  const pages: PageData[] = useMemo(() => {
    const result: PageData[] = [];
    let weekStart = startOfWeek(parseDate(dataInicio), { locale: ptBR });
    const finalDate = parseDate(dataFim);
    let globalPageNumber = 1;
    let weekNumber = 1;

    while (weekStart <= finalDate) {
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      const days = eachDayOfInterval({ start: weekStart, end: weekEnd }).filter(
        (day) => day.getDay() !== 0 && day.getDay() !== 6
      );

      if (days.length > 0) {
        const maxCardsPerDay = LAYOUT_CONSTANTS.MAX_CARDS_PER_DAY_PER_PAGE;
        
        const actividadesPorDia = days.map(dia => ({
          dia,
          atividades: getAtividadesPorDia(dia)
        }));
        
        const maxAtividadesEmDia = Math.max(
          ...actividadesPorDia.map(d => d.atividades.length),
          1
        );
        
        const totalPagesForWeek = Math.ceil(maxAtividadesEmDia / maxCardsPerDay);

        for (let pageIndex = 0; pageIndex < totalPagesForWeek; pageIndex++) {
          const startIdx = pageIndex * maxCardsPerDay;
          const endIdx = startIdx + maxCardsPerDay;

          const daySlices: DaySlice[] = actividadesPorDia.map(({ dia, atividades: atividadesDia }) => {
            const slicedAtividades = atividadesDia.slice(startIdx, endIdx);
            return {
              dia,
              atividades: slicedAtividades,
              hasMore: atividadesDia.length > endIdx,
              hasPrevious: startIdx > 0 && atividadesDia.length > startIdx,
            };
          });

          result.push({
            weekStart,
            weekEnd,
            weekNumber,
            pageIndexInWeek: pageIndex,
            totalPagesInWeek: totalPagesForWeek,
            daySlices,
            globalPageNumber,
          });
          globalPageNumber++;
        }
        weekNumber++;
      }
      weekStart = addWeeks(weekStart, 1);
    }
    return result;
  }, [dataInicio, dataFim, atividades]);

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
              margin: 10mm;
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
              height: 267mm;
              page-break-after: always;
              padding: 8mm;
              border: 2px solid #3B82F6;
              border-radius: 8px;
              margin-bottom: 10mm;
              position: relative;
              display: flex;
              flex-direction: column;
            }
            
            .page:last-child {
              page-break-after: auto;
            }

            .alignment-marks {
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
            }

            .alignment-mark {
              position: absolute;
              background: #9CA3AF;
            }

            .alignment-mark-left {
              left: -5mm;
              width: 3mm;
              height: 1mm;
            }

            .alignment-mark-right {
              right: -5mm;
              width: 3mm;
              height: 1mm;
            }

            .alignment-mark-top {
              top: 50mm;
            }

            .alignment-mark-bottom {
              bottom: 50mm;
            }

            .continuation-band-top {
              background: linear-gradient(180deg, #E5E7EB 0%, transparent 100%);
              padding: 2mm 4mm;
              margin-bottom: 3mm;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 2mm;
              font-size: 9pt;
              color: #6B7280;
            }

            .continuation-band-bottom {
              background: linear-gradient(0deg, #E5E7EB 0%, transparent 100%);
              padding: 2mm 4mm;
              margin-top: 3mm;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 2mm;
              font-size: 9pt;
              color: #6B7280;
            }

            .continuation-arrow {
              font-size: 12pt;
              font-weight: bold;
              color: #3B82F6;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding-bottom: 6mm;
              border-bottom: 2px solid #3B82F6;
              margin-bottom: 4mm;
              flex-shrink: 0;
            }
            
            .header-title {
              font-size: 16pt;
              font-weight: bold;
              color: #1E40AF;
            }
            
            .header-subtitle {
              font-size: 11pt;
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

            .page-indicator {
              background: #3B82F6;
              color: white;
              padding: 1mm 3mm;
              border-radius: 4px;
              font-size: 9pt;
              font-weight: bold;
              display: inline-block;
              margin-top: 1mm;
            }
            
            .calendar-grid {
              display: grid;
              grid-template-columns: repeat(5, 1fr);
              gap: 3mm;
              flex: 1;
              min-height: 0;
            }
            
            .day-column {
              border: 1px solid #E5E7EB;
              border-radius: 6px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              position: relative;
            }

            .day-column.has-continuation-top::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 3mm;
              background: linear-gradient(180deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%);
              z-index: 1;
            }

            .day-column.has-continuation-bottom::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              height: 3mm;
              background: linear-gradient(0deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%);
              z-index: 1;
            }
            
            .day-header {
              background: #3B82F6;
              color: white;
              padding: 2mm;
              text-align: center;
              font-weight: bold;
              flex-shrink: 0;
            }
            
            .day-date {
              font-size: 12pt;
            }
            
            .day-name {
              font-size: 8pt;
              text-transform: uppercase;
              opacity: 0.9;
            }

            .day-continuation-indicator {
              font-size: 8pt;
              background: rgba(255,255,255,0.3);
              padding: 0.5mm 2mm;
              border-radius: 2mm;
              margin-top: 1mm;
            }
            
            .day-content {
              flex: 1;
              padding: 2mm;
              background: #F9FAFB;
              display: flex;
              flex-direction: column;
              gap: 2mm;
            }

            .continuation-indicator-top {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1mm;
              padding: 1mm;
              background: #DBEAFE;
              border-radius: 2mm;
              font-size: 7pt;
              color: #1E40AF;
              margin-bottom: 1mm;
            }

            .continuation-indicator-bottom {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 1mm;
              padding: 1mm;
              background: #DBEAFE;
              border-radius: 2mm;
              font-size: 7pt;
              color: #1E40AF;
              margin-top: auto;
            }
            
            .activity-card {
              padding: 2mm;
              border-radius: 4px;
              border-left: 3px solid;
              font-size: 8pt;
              page-break-inside: avoid;
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
              gap: 6mm;
              padding-top: 3mm;
              border-top: 1px solid #E5E7EB;
              margin-top: 3mm;
              flex-shrink: 0;
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
              margin-top: 3mm;
              flex-shrink: 0;
            }

            .join-guide {
              position: absolute;
              bottom: 2mm;
              left: 50%;
              transform: translateX(-50%);
              display: flex;
              align-items: center;
              gap: 2mm;
              background: #F3F4F6;
              padding: 1mm 3mm;
              border-radius: 3mm;
              font-size: 7pt;
              color: #6B7280;
            }

            .scissors-icon {
              font-size: 10pt;
            }

            @media print {
              .page {
                page-break-after: always;
                height: 267mm;
              }

              .no-print {
                display: none !important;
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

  const renderActivityCard = (atividade: AtividadeLPS, showRestrictions = true) => {
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
        {showRestrictions && restricoesPendentes.length > 0 && (
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
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-[1600px] max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Visualizador de Impressão A3</h2>
            <p className="text-sm text-blue-200">Formato otimizado para exposição na frente da obra (com paginação para junção)</p>
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
              <span className="text-sm font-medium min-w-[100px] text-center">
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
                {/* Continuation Band Top */}
                {currentPageData.pageIndexInWeek > 0 && (
                  <div className="bg-gradient-to-b from-gray-200 to-transparent p-2 mb-2 rounded flex items-center justify-center gap-2 text-gray-600 text-sm">
                    <ChevronUp size={16} className="text-blue-600" />
                    <span>Continua da página {currentPageData.globalPageNumber - 1} (Semana {currentPageData.weekNumber} - Parte {currentPageData.pageIndexInWeek}/{currentPageData.totalPagesInWeek})</span>
                    <ChevronUp size={16} className="text-blue-600" />
                  </div>
                )}

                {/* Page Header */}
                <div className="flex justify-between items-center pb-4 border-b-2 border-blue-500 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-blue-800">{projetoNome}</h1>
                    <p className="text-gray-500">Last Planner System - Planejamento Semanal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-700">
                      Semana {currentPageData.weekNumber}: {format(currentPageData.weekStart, "dd/MM", { locale: ptBR })} - {format(currentPageData.weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-sm text-gray-400">
                        Página {currentPageData.globalPageNumber} de {pages.length}
                      </span>
                      {currentPageData.totalPagesInWeek > 1 && (
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                          Parte {currentPageData.pageIndexInWeek + 1}/{currentPageData.totalPagesInWeek}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 grid grid-cols-5 gap-3">
                  {currentPageData.daySlices.map((daySlice) => (
                    <div 
                      key={daySlice.dia.toISOString()} 
                      className={`border border-gray-200 rounded-lg overflow-hidden flex flex-col relative
                        ${daySlice.hasPrevious ? 'border-t-blue-400 border-t-2' : ''}
                        ${daySlice.hasMore ? 'border-b-blue-400 border-b-2' : ''}
                      `}
                    >
                      <div className="bg-blue-600 text-white py-2 px-3 text-center">
                        <div className="text-xl font-bold">{format(daySlice.dia, 'dd/MM')}</div>
                        <div className="text-xs uppercase opacity-90">
                          {format(daySlice.dia, 'EEEE', { locale: ptBR })}
                        </div>
                        {(daySlice.hasPrevious || daySlice.hasMore) && (
                          <div className="text-xs bg-white/20 rounded px-2 py-0.5 mt-1">
                            {daySlice.hasPrevious && !daySlice.hasMore && '↑ Continua acima'}
                            {!daySlice.hasPrevious && daySlice.hasMore && '↓ Continua abaixo'}
                            {daySlice.hasPrevious && daySlice.hasMore && '↕ Continua'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-2 bg-gray-50 overflow-y-auto space-y-2 flex flex-col">
                        {daySlice.hasPrevious && (
                          <div className="flex items-center justify-center gap-1 p-1 bg-blue-100 rounded text-xs text-blue-700">
                            <ChevronUp size={12} />
                            <span>Ver página anterior</span>
                          </div>
                        )}
                        
                        {daySlice.atividades.length === 0 && !daySlice.hasPrevious ? (
                          <div className="text-center text-gray-400 text-xs py-4 flex-1 flex items-center justify-center">
                            Sem atividades
                          </div>
                        ) : (
                          daySlice.atividades.map((atividade) => renderActivityCard(atividade))
                        )}

                        {daySlice.hasMore && (
                          <div className="flex items-center justify-center gap-1 p-1 bg-blue-100 rounded text-xs text-blue-700 mt-auto">
                            <ChevronDown size={12} />
                            <span>Ver próxima página</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Continuation Band Bottom */}
                {currentPageData.pageIndexInWeek < currentPageData.totalPagesInWeek - 1 && (
                  <div className="bg-gradient-to-t from-gray-200 to-transparent p-2 mt-2 rounded flex items-center justify-center gap-2 text-gray-600 text-sm">
                    <ChevronDown size={16} className="text-blue-600" />
                    <span>Continua na página {currentPageData.globalPageNumber + 1} (Semana {currentPageData.weekNumber} - Parte {currentPageData.pageIndexInWeek + 2}/{currentPageData.totalPagesInWeek})</span>
                    <ChevronDown size={16} className="text-blue-600" />
                  </div>
                )}

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
                  {currentPageData.totalPagesInWeek > 1 && (
                    <>
                      <div className="w-px h-4 bg-gray-300" />
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-4 h-4 rounded border-2 border-blue-400 bg-blue-50" />
                        <span>Juntar páginas</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 mt-2">
                  Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • VisionPlan v2.2
                  {currentPageData.totalPagesInWeek > 1 && (
                    <span className="ml-2">• ✂️ Recorte nas bordas azuis para juntar folhas</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden print content */}
        <div ref={printRef} className="hidden">
          {pages.map((page) => (
            <div key={page.globalPageNumber} className="page">
              {/* Alignment marks for joining pages */}
              <div className="alignment-marks">
                <div className="alignment-mark alignment-mark-left alignment-mark-top"></div>
                <div className="alignment-mark alignment-mark-right alignment-mark-top"></div>
                <div className="alignment-mark alignment-mark-left alignment-mark-bottom"></div>
                <div className="alignment-mark alignment-mark-right alignment-mark-bottom"></div>
              </div>

              {/* Continuation band top */}
              {page.pageIndexInWeek > 0 && (
                <div className="continuation-band-top">
                  <span className="continuation-arrow">▲</span>
                  <span>Continua da página {page.globalPageNumber - 1} (Semana {page.weekNumber} - Parte {page.pageIndexInWeek}/{page.totalPagesInWeek})</span>
                  <span className="continuation-arrow">▲</span>
                </div>
              )}

              <div className="header">
                <div>
                  <div className="header-title">{projetoNome}</div>
                  <div className="header-subtitle">Last Planner System - Planejamento Semanal</div>
                </div>
                <div>
                  <div className="header-date">
                    Semana {page.weekNumber}: {format(page.weekStart, "dd/MM", { locale: ptBR })} - {format(page.weekEnd, "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                  <div className="header-page">
                    Página {page.globalPageNumber} de {pages.length}
                    {page.totalPagesInWeek > 1 && (
                      <span className="page-indicator" style={{ marginLeft: '8px' }}>
                        Parte {page.pageIndexInWeek + 1}/{page.totalPagesInWeek}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="calendar-grid">
                {page.daySlices.map((daySlice) => (
                  <div 
                    key={daySlice.dia.toISOString()} 
                    className={`day-column ${daySlice.hasPrevious ? 'has-continuation-top' : ''} ${daySlice.hasMore ? 'has-continuation-bottom' : ''}`}
                  >
                    <div className="day-header">
                      <div className="day-date">{format(daySlice.dia, 'dd/MM')}</div>
                      <div className="day-name">{format(daySlice.dia, 'EEEE', { locale: ptBR })}</div>
                      {(daySlice.hasPrevious || daySlice.hasMore) && (
                        <div className="day-continuation-indicator">
                          {daySlice.hasPrevious && !daySlice.hasMore && '↑'}
                          {!daySlice.hasPrevious && daySlice.hasMore && '↓'}
                          {daySlice.hasPrevious && daySlice.hasMore && '↕'}
                        </div>
                      )}
                    </div>
                    <div className="day-content">
                      {daySlice.hasPrevious && (
                        <div className="continuation-indicator-top">
                          <span>▲</span>
                          <span>Ver página anterior</span>
                        </div>
                      )}

                      {daySlice.atividades.map((atividade) => {
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

                      {daySlice.hasMore && (
                        <div className="continuation-indicator-bottom">
                          <span>▼</span>
                          <span>Ver próxima página</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Continuation band bottom */}
              {page.pageIndexInWeek < page.totalPagesInWeek - 1 && (
                <div className="continuation-band-bottom">
                  <span className="continuation-arrow">▼</span>
                  <span>Continua na página {page.globalPageNumber + 1} (Semana {page.weekNumber} - Parte {page.pageIndexInWeek + 2}/{page.totalPagesInWeek})</span>
                  <span className="continuation-arrow">▼</span>
                </div>
              )}

              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981' }} />
                  <span>Sem restrições</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B' }} />
                  <span>Com restrições</span>
                </div>
                {page.totalPagesInWeek > 1 && (
                  <div className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: '#DBEAFE', border: '2px solid #3B82F6' }} />
                    <span>Juntar páginas na borda azul</span>
                  </div>
                )}
              </div>

              <div className="footer">
                Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • VisionPlan v2.2
                {page.totalPagesInWeek > 1 && (
                  <span> • ✂️ Recorte e junte nas bordas para montar semana completa</span>
                )}
              </div>

              {/* Join guide for multi-page weeks */}
              {page.pageIndexInWeek < page.totalPagesInWeek - 1 && (
                <div className="join-guide">
                  <span className="scissors-icon">✂️</span>
                  <span>Junte com a página {page.globalPageNumber + 1}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
