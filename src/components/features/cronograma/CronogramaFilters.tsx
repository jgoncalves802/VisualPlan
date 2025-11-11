/**
 * Filtros do Cronograma
 */

import React, { useState, useEffect } from 'react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';

export const CronogramaFilters: React.FC = () => {
  const { filtros, setFiltros, limparFiltros } = useCronogramaStore();

  const [buscaLocal, setBuscaLocal] = useState(filtros.busca || '');

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros({ busca: buscaLocal });
    }, 300);

    return () => clearTimeout(timer);
  }, [buscaLocal, setFiltros]);

  const statusOptions = [
    'Não Iniciada',
    'Em Andamento',
    'Concluída',
    'Paralisada',
    'Atrasada',
  ];

  const handleStatusToggle = (status: string) => {
    const novoStatus = filtros.status?.includes(status)
      ? filtros.status.filter((s) => s !== status)
      : [...(filtros.status || []), status];

    setFiltros({ status: novoStatus });
  };

  const temFiltrosAtivos =
    buscaLocal ||
    (filtros.status && filtros.status.length > 0) ||
    filtros.apenas_criticas ||
    filtros.apenas_atrasadas ||
    filtros.data_inicio ||
    filtros.data_fim;

  // Formata data para input date (YYYY-MM-DD)
  const formatarDataParaInput = (data?: Date) => {
    if (!data) return '';
    const d = new Date(data);
    return d.toISOString().split('T')[0];
  };

  // Converte string do input para Date
  const parseDataDoInput = (valor: string) => {
    return valor ? new Date(valor + 'T00:00:00') : undefined;
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Busca e Checkboxes */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Busca */}
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, código ou descrição..."
              value={buscaLocal}
              onChange={(e) => setBuscaLocal(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {buscaLocal && (
              <button
                onClick={() => setBuscaLocal('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Checkbox: Apenas Críticas */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.apenas_criticas || false}
            onChange={(e) => setFiltros({ apenas_criticas: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Apenas Críticas
          </span>
        </label>

        {/* Checkbox: Apenas Atrasadas */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filtros.apenas_atrasadas || false}
            onChange={(e) => setFiltros({ apenas_atrasadas: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Apenas Atrasadas
          </span>
        </label>

        {/* Botão Limpar Filtros */}
        {temFiltrosAtivos && (
          <button
            onClick={() => {
              setBuscaLocal('');
              limparFiltros();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Linha 2: Filtros de Status */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Status:</span>
        {statusOptions.map((status) => {
          const isActive = filtros.status?.includes(status);
          const colors = {
            'Não Iniciada': 'bg-gray-100 text-gray-700 border-gray-300',
            'Em Andamento': 'bg-blue-50 text-blue-700 border-blue-300',
            'Concluída': 'bg-green-50 text-green-700 border-green-300',
            'Paralisada': 'bg-orange-50 text-orange-700 border-orange-300',
            'Atrasada': 'bg-red-50 text-red-700 border-red-300',
          };

          return (
            <button
              key={status}
              onClick={() => handleStatusToggle(status)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition ${
                isActive
                  ? colors[status as keyof typeof colors] + ' ring-2 ring-offset-1 ring-blue-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status}
              {isActive && (
                <svg
                  className="inline-block w-4 h-4 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Linha 3: Filtros de Data */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Período:</span>
        
        {/* Data Início */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">De:</label>
          <input
            type="date"
            value={formatarDataParaInput(filtros.data_inicio)}
            onChange={(e) => setFiltros({ data_inicio: parseDataDoInput(e.target.value) })}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Data Fim */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Até:</label>
          <input
            type="date"
            value={formatarDataParaInput(filtros.data_fim)}
            onChange={(e) => setFiltros({ data_fim: parseDataDoInput(e.target.value) })}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Limpar Datas */}
        {(filtros.data_inicio || filtros.data_fim) && (
          <button
            onClick={() => setFiltros({ data_inicio: undefined, data_fim: undefined })}
            className="text-sm text-gray-500 hover:text-gray-700"
            title="Limpar filtro de datas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

