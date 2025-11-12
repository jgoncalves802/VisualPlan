/**
 * Gantt Extensions Toolbar
 * Toolbar com TODAS as funcionalidades avançadas do DHTMLX Gantt
 */

import React, { useState } from 'react';
import {
  enterFullscreen,
  undo,
  redo,
  toggleCriticalPath,
  toggleAutoScheduling,
  zoomIn,
  zoomOut,
  zoomToFit,
  sortTasks,
  groupBy,
  removeGrouping,
  exportToPDF,
  exportToPNG,
  exportToExcel,
  exportToMSProject,
  exportToPrimaveraP6,
  exportToICal,
  addCustomMarker,
  updateTodayMarker,
  addBaselineLayer,
  addDeadlineLayer,
  removeTaskLayer,
  calculateSlackTime,
} from '../../../lib/gantt/extensions';
import { useCronogramaStore } from '../../../stores/cronogramaStore';

export const GanttExtensionsToolbar: React.FC = () => {
  const { configuracoes, setConfiguracoes } = useCronogramaStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [baselineLayerId, setBaselineLayerId] = useState<string | null>(null);
  const [deadlineLayerId, setDeadlineLayerId] = useState<string | null>(null);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const handleFullscreen = () => {
    enterFullscreen();
  };

  const handleToggleCriticalPath = () => {
    const enabled = !configuracoes.destacar_caminho_critico;
    setConfiguracoes({ destacar_caminho_critico: enabled });
    toggleCriticalPath(enabled);
  };

  const handleToggleAutoScheduling = () => {
    const enabled = !configuracoes.habilitar_auto_scheduling;
    setConfiguracoes({ habilitar_auto_scheduling: enabled });
    toggleAutoScheduling(enabled);
  };

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleZoomToFit = () => {
    zoomToFit();
  };

  const handleSort = (field: string, desc: boolean = false) => {
    sortTasks(field, desc);
  };

  const handleGroup = (field: string) => {
    if (field === 'none') {
      removeGrouping();
    } else {
      groupBy(field);
    }
  };

  const handleToggleBaseline = () => {
    if (baselineLayerId) {
      removeTaskLayer(baselineLayerId);
      setBaselineLayerId(null);
      setConfiguracoes({ mostrar_baseline: false });
    } else {
      const id = addBaselineLayer();
      setBaselineLayerId(id);
      setConfiguracoes({ mostrar_baseline: true });
    }
  };

  const handleToggleDeadline = () => {
    if (deadlineLayerId) {
      removeTaskLayer(deadlineLayerId);
      setDeadlineLayerId(null);
    } else {
      const id = addDeadlineLayer();
      setDeadlineLayerId(id);
    }
  };

  const handleCalculateSlack = () => {
    calculateSlackTime();
  };

  const handleAddMarker = () => {
    const date = prompt('Digite a data do marcador (dd/mm/yyyy):');
    if (date) {
      const [day, month, year] = date.split('/');
      const markerDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const text = prompt('Digite o texto do marcador:');
      if (text) {
        addCustomMarker(markerDate, text, 'custom-marker');
      }
    }
  };

  const handleUpdateToday = () => {
    updateTodayMarker();
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <div className="gantt-extensions-toolbar bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 p-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* ===================================================================
            SEÇÃO 1: UNDO/REDO
            =================================================================== */}
        <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={handleUndo}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Desfazer (Ctrl+Z)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Refazer (Ctrl+Y)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* ===================================================================
            SEÇÃO 2: ZOOM
            =================================================================== */}
        <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Zoom Out (-)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Zoom In (+)"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
          <button
            onClick={handleZoomToFit}
            className="p-2 hover:bg-gray-100 rounded transition"
            title="Zoom to Fit"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>

        {/* ===================================================================
            SEÇÃO 3: FEATURES (Caminho Crítico, Auto-scheduling)
            =================================================================== */}
        <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200">
          <button
            onClick={handleToggleCriticalPath}
            className={`flex items-center gap-2 px-3 py-2 rounded transition ${
              configuracoes.destacar_caminho_critico
                ? 'bg-red-100 text-red-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Caminho Crítico"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm">Crítico</span>
          </button>
          
          <button
            onClick={handleToggleAutoScheduling}
            className={`flex items-center gap-2 px-3 py-2 rounded transition ${
              configuracoes.habilitar_auto_scheduling
                ? 'bg-green-100 text-green-700 font-medium'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Auto-scheduling"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">Auto</span>
          </button>
        </div>

        {/* ===================================================================
            SEÇÃO 4: VIEW (Baseline, Deadlines, Slack)
            =================================================================== */}
        <div className="relative">
          <button
            onClick={() => setShowViewMenu(!showViewMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">Visualização</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showViewMenu && (
            <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    handleToggleBaseline();
                    setShowViewMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition ${
                    baselineLayerId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-sm">Linha de Base (Baseline)</span>
                </button>

                <button
                  onClick={() => {
                    handleToggleDeadline();
                    setShowViewMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition ${
                    deadlineLayerId ? 'bg-red-50 text-red-700' : 'text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm">Prazos Finais (Deadlines)</span>
                </button>

                <button
                  onClick={() => {
                    handleCalculateSlack();
                    setShowViewMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <span className="text-sm">Calcular Folga (Slack Time)</span>
                </button>

                <div className="border-t my-2"></div>

                <button
                  onClick={() => {
                    handleAddMarker();
                    setShowViewMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm">Adicionar Marcador</span>
                </button>

                <button
                  onClick={() => {
                    handleUpdateToday();
                    setShowViewMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Atualizar "Hoje"</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            SEÇÃO 5: TOOLS (Ordenar, Agrupar)
            =================================================================== */}
        <div className="relative">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <span className="text-sm font-medium">Ferramentas</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showToolsMenu && (
            <div className="absolute top-full mt-2 left-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Ordenar por</div>
                <button
                  onClick={() => {
                    handleSort('text', false);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Nome (A-Z)</span>
                </button>
                <button
                  onClick={() => {
                    handleSort('start_date', false);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Data de Início</span>
                </button>
                <button
                  onClick={() => {
                    handleSort('duration', true);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Duração</span>
                </button>
                <button
                  onClick={() => {
                    handleSort('progress', true);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Progresso</span>
                </button>

                <div className="border-t my-2"></div>

                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Agrupar por</div>
                <button
                  onClick={() => {
                    handleGroup('none');
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Nenhum</span>
                </button>
                <button
                  onClick={() => {
                    handleGroup('status');
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Status</span>
                </button>
                <button
                  onClick={() => {
                    handleGroup('responsavel');
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Responsável</span>
                </button>
                <button
                  onClick={() => {
                    handleGroup('tipo');
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <span className="text-sm">Tipo</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            SEÇÃO 6: EXPORT
            =================================================================== */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm hover:bg-green-600 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-sm font-medium">Exportar</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showExportMenu && (
            <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    exportToPDF();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">PDF</span>
                </button>

                <button
                  onClick={() => {
                    exportToPNG();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">PNG (Imagem)</span>
                </button>

                <button
                  onClick={() => {
                    exportToExcel();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Excel (.xlsx)</span>
                </button>

                <div className="border-t my-2"></div>

                <button
                  onClick={() => {
                    exportToMSProject();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">MS Project (.xml)</span>
                </button>

                <button
                  onClick={() => {
                    exportToPrimaveraP6();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm">Primavera P6 (.xml)</span>
                </button>

                <button
                  onClick={() => {
                    exportToICal();
                    setShowExportMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 transition text-gray-700"
                >
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">iCalendar (.ics)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            SEÇÃO 7: FULLSCREEN
            =================================================================== */}
        <button
          onClick={handleFullscreen}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg shadow-sm hover:bg-indigo-600 transition"
          title="Tela Cheia"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          <span className="text-sm font-medium">Tela Cheia</span>
        </button>
      </div>

      {/* Legenda de atalhos */}
      <div className="mt-2 flex items-center gap-4 text-xs text-gray-600">
        <span>🎹 Atalhos:</span>
        <span>Ctrl+Z = Desfazer</span>
        <span>Ctrl+Y = Refazer</span>
        <span>+ = Zoom In</span>
        <span>- = Zoom Out</span>
        <span>F11 = Tela Cheia</span>
      </div>
    </div>
  );
};

