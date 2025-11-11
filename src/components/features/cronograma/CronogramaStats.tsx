/**
 * Componente de Estatísticas do Cronograma
 */

import React from 'react';

interface CronogramaStatsProps {
  stats: {
    total: number;
    concluidas: number;
    emAndamento: number;
    naoIniciadas: number;
    criticas: number;
    atrasadas: number;
    percentualConclusao: number;
  };
}

export const CronogramaStats: React.FC<CronogramaStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {/* Total */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Concluídas */}
      <div className="bg-white rounded-lg p-4 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-600 uppercase">Concluídas</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.concluidas}</p>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Em Andamento */}
      <div className="bg-white rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase">Em Andamento</p>
            <p className="text-2xl font-bold text-blue-700 mt-1">{stats.emAndamento}</p>
          </div>
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Não Iniciadas */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Não Iniciadas</p>
            <p className="text-2xl font-bold text-gray-700 mt-1">{stats.naoIniciadas}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Críticas */}
      <div className="bg-white rounded-lg p-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-red-600 uppercase">Críticas</p>
            <p className="text-2xl font-bold text-red-700 mt-1">{stats.criticas}</p>
          </div>
          <div className="p-2 bg-red-100 rounded-lg">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Atrasadas */}
      <div className="bg-white rounded-lg p-4 border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-orange-600 uppercase">Atrasadas</p>
            <p className="text-2xl font-bold text-orange-700 mt-1">{stats.atrasadas}</p>
          </div>
          <div className="p-2 bg-orange-100 rounded-lg">
            <svg
              className="w-6 h-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Percentual de Conclusão */}
      <div className="bg-white rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase">Conclusão</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{stats.percentualConclusao}%</p>
          </div>
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
        </div>
        {/* Barra de Progresso */}
        <div className="mt-2 bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${stats.percentualConclusao}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

