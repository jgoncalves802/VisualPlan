/**
 * Página principal do Cronograma (Gantt Chart)
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useCronograma } from '../hooks/useCronograma';
import { VisualizacaoCronograma } from '../types/cronograma';

// Componentes (serão criados)
import { CronogramaToolbar } from '../components/features/cronograma/CronogramaToolbar';
import { CronogramaFilters } from '../components/features/cronograma/CronogramaFilters';
import { GanttChart } from '../components/features/cronograma/GanttChart';
import { TaskList } from '../components/features/cronograma/TaskList';
import { TaskModal } from '../components/features/cronograma/TaskModal';
import { DependencyModal } from '../components/features/cronograma/DependencyModal';
import { CronogramaStats } from '../components/features/cronograma/CronogramaStats';

/**
 * Página do Cronograma
 */
export const CronogramaPage: React.FC = () => {
  const { projetoId } = useParams<{ projetoId: string }>();
  const {
    atividades,
    todasAtividades,
    tasks,
    visualizacao,
    viewMode,
    isLoading,
    erro,
    estatisticas,
    adicionarAtividade,
    atualizarAtividade,
    excluirAtividade,
    adicionarDependencia,
    excluirDependencia,
    calcularCaminhoCritico,
    handleTaskChange,
    handleTaskDelete,
  } = useCronograma(projetoId || 'proj-1');

  // Estados para modais
  const [modalTaskOpen, setModalTaskOpen] = useState(false);
  const [modalDependencyOpen, setModalDependencyOpen] = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Calcula caminho crítico automaticamente ao carregar
  useEffect(() => {
    if (projetoId && atividades.length > 0) {
      calcularCaminhoCritico(projetoId);
    }
  }, [projetoId, atividades.length]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleNovaAtividade = () => {
    setAtividadeSelecionada(null);
    setModalTaskOpen(true);
  };

  const handleEditarAtividade = (atividadeId: string) => {
    setAtividadeSelecionada(atividadeId);
    setModalTaskOpen(true);
  };

  const handleNovaDependencia = () => {
    setModalDependencyOpen(true);
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading && atividades.length === 0) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando cronograma...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (erro) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <div className="flex items-center mb-4">
              <svg
                className="w-6 h-6 text-red-500 mr-2"
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
              <h3 className="text-lg font-semibold text-red-800">Erro ao carregar</h3>
            </div>
            <p className="text-red-700">{erro}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <MainLayout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cronograma</h1>
              <p className="text-sm text-gray-500 mt-1">
                Gerencie o cronograma do projeto com visualização Gantt
              </p>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <CronogramaStats stats={estatisticas} />
        </div>

        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <CronogramaToolbar
            onNovaAtividade={handleNovaAtividade}
            onNovaDependencia={handleNovaDependencia}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            projetoNome="Projeto VisionPlan"
          />
        </div>

        {/* Filtros (colapsável) */}
        {showFilters && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <CronogramaFilters />
          </div>
        )}

        {/* Conteúdo Principal */}
        <div className="flex-1 overflow-auto p-6">
          {atividades.length === 0 ? (
            // Empty State
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 2 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma atividade encontrada
                </h3>
                <p className="text-gray-500 mb-6">
                  Comece adicionando atividades ao seu cronograma.
                </p>
                <button
                  onClick={handleNovaAtividade}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Adicionar Primeira Atividade
                </button>
              </div>
            </div>
          ) : (
            // Visualizações
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {visualizacao === VisualizacaoCronograma.GANTT ? (
                <GanttChart
                  tasks={tasks}
                  viewMode={viewMode}
                  onTaskChange={handleTaskChange}
                  onTaskDelete={handleTaskDelete}
                  onTaskDoubleClick={(task) => handleEditarAtividade(task.id)}
                />
              ) : (
                <TaskList
                  atividades={atividades}
                  onEdit={handleEditarAtividade}
                  onDelete={async (id) => {
                    if (window.confirm('Deseja realmente excluir esta atividade?')) {
                      await excluirAtividade(id);
                    }
                  }}
                />
              )}
            </div>
          )}
        </div>

        {/* Modais */}
        <TaskModal
          open={modalTaskOpen}
          onClose={() => {
            setModalTaskOpen(false);
            setAtividadeSelecionada(null);
          }}
          atividadeId={atividadeSelecionada}
          projetoId={projetoId || 'proj-1'}
          onSave={async (dados) => {
            if (atividadeSelecionada) {
              await atualizarAtividade(atividadeSelecionada, dados);
            } else {
              await adicionarAtividade({
                ...dados,
                projeto_id: projetoId || 'proj-1',
              });
            }
            setModalTaskOpen(false);
            setAtividadeSelecionada(null);
          }}
        />

        <DependencyModal
          open={modalDependencyOpen}
          onClose={() => setModalDependencyOpen(false)}
          atividades={todasAtividades}
          onSave={async (dependencia) => {
            await adicionarDependencia(dependencia);
            setModalDependencyOpen(false);
          }}
        />
      </div>
    </MainLayout>
  );
};

