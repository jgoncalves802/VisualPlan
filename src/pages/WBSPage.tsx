/**
 * Página WBS - Work Breakdown Structure
 * Visualização da timeline de todos os projetos
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjetosComDuracaoReal } from '../mocks/projetosMocks';
import { WBSGantt, WBSProject } from '../components/features/wbs/WBSGantt';

export const WBSPage: React.FC = () => {
  const navigate = useNavigate();
  type WBSViewMode = 'Day' | 'Week' | 'Month' | 'Year';
  const [viewMode, setViewMode] = useState<WBSViewMode>('Month');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [buscaNome, setBuscaNome] = useState('');

  // Obter projetos com duração real calculada baseada nas atividades
  const projetosMock = useMemo(() => getProjetosComDuracaoReal(), []);

  // Filtrar projetos
  const projetosFiltrados = useMemo(() => {
    let projetos = [...projetosMock];

    // Filtro por status
    if (filtroStatus !== 'todos') {
      projetos = projetos.filter((p) => {
        if (filtroStatus === 'ativo') return p.status === 'Em Andamento';
        if (filtroStatus === 'concluido') return p.status === 'Concluído';
        if (filtroStatus === 'atrasado') return p.status === 'Atrasado';
        return true;
      });
    }

    // Filtro por nome
    if (buscaNome.trim()) {
      projetos = projetos.filter((p) =>
        p.nome.toLowerCase().includes(buscaNome.toLowerCase()) ||
        p.codigo.toLowerCase().includes(buscaNome.toLowerCase())
      );
    }

    return projetos;
  }, [filtroStatus, buscaNome]);

  const wbsProjetos: WBSProject[] = useMemo(() => {
    return projetosFiltrados.map((projeto) => ({
      id: projeto.id,
      nome: projeto.nome,
      codigo: projeto.codigo,
      gerente: projeto.gerente,
      data_inicio: projeto.data_inicio,
      data_fim: projeto.data_fim,
      status: projeto.status,
      progresso: projeto.progresso,
      cor: projeto.cor,
      categoria: projeto.tags?.[0],
      cliente: projeto.cliente,
    }));
  }, [projetosFiltrados]);

  const handleProjetoClick = (projetoId: string) => {
    const projeto = projetosMock.find((p) => p.id === projetoId);
    if (projeto) {
      navigate(`/cronograma/${projeto.id}`);
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: projetosMock.length,
      emAndamento: projetosMock.filter((p) => p.status === 'Em Andamento').length,
      concluidos: projetosMock.filter((p) => p.status === 'Concluído').length,
      atrasados: projetosMock.filter((p) => p.status === 'Atrasado').length,
      naoIniciados: projetosMock.filter((p) => p.status === 'Não Iniciado').length,
    };
  }, [projetosMock]);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WBS - Visão Geral de Projetos</h1>
            <p className="text-sm text-gray-500 mt-1">
              Timeline de todos os projetos em execução e concluídos
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-5 gap-4">
          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-gray-200 rounded-full p-2">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          {/* Em Andamento */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{stats.emAndamento}</p>
              </div>
              <div className="bg-blue-200 rounded-full p-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Concluídos */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-600 uppercase">Concluídos</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{stats.concluidos}</p>
              </div>
              <div className="bg-green-200 rounded-full p-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Atrasados */}
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase">Atrasados</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{stats.atrasados}</p>
              </div>
              <div className="bg-orange-200 rounded-full p-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Não Iniciados */}
          <div className="bg-gray-100 rounded-lg p-4 border border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Não Iniciados</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.naoIniciados}</p>
              </div>
              <div className="bg-gray-300 rounded-full p-2">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            {/* Busca */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar projeto..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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

            {/* Filtro Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Em Andamento</option>
              <option value="concluido">Concluídos</option>
              <option value="atrasado">Atrasados</option>
            </select>
          </div>

          {/* Escala de Tempo */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Escala:</span>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as WBSViewMode)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Day">Dia</option>
              <option value="Week">Semana</option>
              <option value="Month">Mês</option>
              <option value="Year">Ano</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Gantt */}
      <div className="flex-1 overflow-auto p-6">
        {wbsProjetos.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum projeto encontrado</h3>
              <p className="text-gray-500">Tente ajustar os filtros.</p>
            </div>
          </div>
        ) : (
          <div className="bg-transparent">
            <WBSGantt projetos={wbsProjetos} escala={viewMode} onProjetoClick={handleProjetoClick} />
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Software</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span>Construção Civil</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Reforma</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Emergencial</span>
          </div>
          <span className="ml-auto text-xs italic">💡 Clique em um projeto para ver seu cronograma detalhado</span>
        </div>
      </div>
    </div>
  );
};

