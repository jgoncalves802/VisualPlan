/**
 * Toolbar do Cronograma
 */

import React, { useState } from 'react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { VisualizacaoCronograma, EscalaTempo, UnidadeTempo, CabecalhoImpressao } from '../../../types/cronograma';
import { exportarPDF, exportarExcel } from '../../../services/exportService';
import { PrintConfigModal } from './PrintConfigModal';

interface CronogramaToolbarProps {
  onNovaAtividade: () => void;
  onNovaDependencia: () => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  projetoNome?: string;
  presentationMode?: boolean;
  onTogglePresentationMode?: () => void;
}

export const CronogramaToolbar: React.FC<CronogramaToolbarProps> = ({
  onNovaAtividade,
  onNovaDependencia,
  onToggleFilters,
  showFilters,
  projetoNome = 'Projeto',
  presentationMode = false,
  onTogglePresentationMode,
}) => {
  const { 
    visualizacao, 
    escala, 
    unidadeTempoPadrao,
    setVisualizacao, 
    setEscala, 
    setUnidadeTempoPadrao,
    atividades, 
    dependencias, 
    caminhoCritico 
  } = useCronogramaStore();
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPrintConfigModal, setShowPrintConfigModal] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = async (cabecalho?: CabecalhoImpressao) => {
    setIsExporting(true);
    try {
      await exportarPDF(projetoNome, atividades, dependencias, caminhoCritico, true, cabecalho);
      alert('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
      setShowPrintConfigModal(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      exportarExcel(projetoNome, atividades, dependencias, caminhoCritico);
      alert('Excel exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      alert('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Abre modal de configuração para PDF
  const handleOpenPrintConfig = (type: 'pdf' | 'excel') => {
    setExportType(type);
    setShowPrintConfigModal(true);
    setShowExportMenu(false);
  };

  // Confirma impressão com configuração
  const handleConfirmPrint = (cabecalho: CabecalhoImpressao) => {
    if (exportType === 'pdf') {
      handleExportPDF(cabecalho);
    } else if (exportType === 'excel') {
      // Por enquanto Excel não usa cabeçalho personalizado no mesmo formato
      handleExportExcel();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Botões de Ação */}
      <div className="flex items-center gap-2">
        <button
          onClick={onNovaAtividade}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Nova Atividade</span>
        </button>

        <button
          onClick={onNovaDependencia}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span>Nova Dependência</span>
        </button>
      </div>

      {/* Divisor */}
      <div className="h-8 w-px bg-gray-300"></div>

      {/* Toggle Visualização */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setVisualizacao(VisualizacaoCronograma.GANTT)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition ${
            visualizacao === VisualizacaoCronograma.GANTT
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-sm font-medium">Gantt</span>
        </button>

        <button
          onClick={() => setVisualizacao(VisualizacaoCronograma.LISTA)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition ${
            visualizacao === VisualizacaoCronograma.LISTA
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 10h16M4 14h16M4 18h16"
            />
          </svg>
          <span className="text-sm font-medium">Lista</span>
        </button>
      </div>

      {/* Unidade de Tempo */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Unidade:</span>
        <select
          value={unidadeTempoPadrao}
          onChange={(e) => setUnidadeTempoPadrao(e.target.value as UnidadeTempo)}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Unidade de duração das atividades"
        >
          <option value={UnidadeTempo.DIAS}>Dias</option>
          <option value={UnidadeTempo.HORAS}>Horas</option>
        </select>
      </div>

      {/* Escala de Tempo */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Escala:</span>
        <select
          value={escala}
          onChange={(e) => setEscala(e.target.value as EscalaTempo)}
          className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={EscalaTempo.HORA}>Hora</option>
          <option value={EscalaTempo.DIA}>Dia</option>
          <option value={EscalaTempo.SEMANA}>Semana</option>
          <option value={EscalaTempo.MES}>Mês</option>
          <option value={EscalaTempo.ANO}>Ano</option>
        </select>
      </div>

      {/* Divisor */}
      <div className="h-8 w-px bg-gray-300"></div>

      {/* Botão Filtros */}
      <button
        onClick={onToggleFilters}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
          showFilters
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        <span>Filtros</span>
        {showFilters && (
          <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
            ✓
          </span>
        )}
      </button>

      {/* Espaçador */}
      <div className="flex-1"></div>

      {/* Botão Exportar com Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          )}
          <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
        </button>

        {/* Dropdown Menu */}
        {showExportMenu && !isExporting && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
            <button
              onClick={() => handleOpenPrintConfig('pdf')}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition rounded-t-lg border-b border-gray-100"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <div>
                <div className="font-medium">Imprimir PDF</div>
                <div className="text-xs text-gray-500">Com cabeçalho personalizado</div>
              </div>
            </button>
            <button
              onClick={() => handleExportPDF()}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition border-b border-gray-100"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="font-medium">Exportar PDF</div>
                <div className="text-xs text-gray-500">Simples (sem logos)</div>
              </div>
            </button>
            <button
              onClick={handleExportExcel}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition rounded-b-lg"
            >
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <div>
                <div className="font-medium">Exportar Excel</div>
                <div className="text-xs text-gray-500">Planilha com abas</div>
              </div>
            </button>
          </div>
        )}

        {/* Backdrop para fechar o menu */}
        {showExportMenu && !isExporting && (
          <div
            className="fixed inset-0 z-0"
            onClick={() => setShowExportMenu(false)}
          />
        )}
      </div>

      {/* Botão Modo Apresentação */}
      {onTogglePresentationMode && (
        <button
          onClick={onTogglePresentationMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
            presentationMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={presentationMode ? 'Sair do Modo Apresentação' : 'Ativar Modo Apresentação'}
        >
          {presentationMode ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span>Sair</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              <span>Apresentação</span>
            </>
          )}
        </button>
      )}

      {/* Botão Atualizar */}
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Atualizar</span>
      </button>

      {/* Modal de Configuração de Impressão */}
      <PrintConfigModal
        open={showPrintConfigModal}
        onClose={() => setShowPrintConfigModal(false)}
        onConfirm={handleConfirmPrint}
        projetoNome={projetoNome}
      />
    </div>
  );
};

