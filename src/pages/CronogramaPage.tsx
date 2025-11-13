/**
 * Página principal do Cronograma (Gantt Chart)
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCronograma } from '../hooks/useCronograma';
import { VisualizacaoCronograma } from '../types/cronograma';

// Componentes (serão criados)
import { CronogramaToolbar } from '../components/features/cronograma/CronogramaToolbar';
import { GanttExtensionsToolbar } from '../components/features/cronograma/GanttExtensionsToolbar';
import { CronogramaFilters } from '../components/features/cronograma/CronogramaFilters';
import { GanttChart } from '../components/features/cronograma/GanttChart';
import { TaskList } from '../components/features/cronograma/TaskList';
import { TaskModal } from '../components/features/cronograma/TaskModal';
import { DependencyModal } from '../components/features/cronograma/DependencyModal';
import { CronogramaStats } from '../components/features/cronograma/CronogramaStats';
import { AtividadeActionsModal } from '../components/features/cronograma/AtividadeActionsModal';
import { RestricaoModal } from '../components/features/restricoes/RestricaoModal';
import { useLPSStore } from '../stores/lpsStore';
import { useAuthStore } from '../stores/authStore';
import { RestricaoLPS } from '../types/lps';

/**
 * Página do Cronograma
 */
export const CronogramaPage: React.FC = () => {
  const { projetoId } = useParams<{ projetoId: string }>();
  const {
    atividades,
    todasAtividades,
    dependencias,
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
    calcularCaminhoCritico,
    handleTaskChange,
    handleTaskDelete,
  } = useCronograma(projetoId || 'proj-1');

  // Estados para modais
  const [modalTaskOpen, setModalTaskOpen] = useState(false);
  const [modalDependencyOpen, setModalDependencyOpen] = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activityActionsModalOpen, setActivityActionsModalOpen] = useState(false);
  const [atividadeParaAcoes, setAtividadeParaAcoes] = useState<any | null>(null);
  const [restricaoModalOpen, setRestricaoModalOpen] = useState(false);
  const [restricaoModalAtividadeId, setRestricaoModalAtividadeId] = useState<string | undefined>(undefined);

  // Store LPS para criar restrições
  const { addRestricao, addEvidencia, deleteEvidencia, addAndamento } = useLPSStore();
  
  // Auth store
  const { usuario } = useAuthStore();

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

  const handleAtividadeClick = (atividadeId: string) => {
    const atividade = todasAtividades.find((a) => a.id === atividadeId);
    if (atividade) {
      setAtividadeParaAcoes(atividade);
      setActivityActionsModalOpen(true);
    }
  };

  const handleAddRestricaoFromAtividade = (atividadeId: string) => {
    setRestricaoModalAtividadeId(atividadeId);
    setRestricaoModalOpen(true);
    setActivityActionsModalOpen(false);
  };

  const handleSaveRestricao = (restricao: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS> | RestricaoLPS) => {
    // Se tem id, é edição (não deve acontecer aqui, mas por segurança)
    if ('id' in restricao && restricao.id) {
      // Edição não é suportada aqui
      return;
    } else {
      // Nova restrição vinculada à atividade do cronograma
      addRestricao({
        ...restricao,
        atividade_id: restricaoModalAtividadeId, // ID da atividade do cronograma
      } as Omit<RestricaoLPS, 'id'>);
    }
    setRestricaoModalOpen(false);
    setRestricaoModalAtividadeId(undefined);
  };

  const handleNovaDependencia = () => {
    setModalDependencyOpen(true);
  };

  const togglePresentationMode = () => {
    setPresentationMode(!presentationMode);
    if (!presentationMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading && atividades.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  // ========================================================================
  // ERROR STATE
  // ========================================================================

  if (erro) {
    return (
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
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  // Conteúdo do cronograma
  const CronogramaContent = () => (
    <>
      {/* Toolbar de Extensões Avançadas do DHTMLX Gantt */}
      <GanttExtensionsToolbar />

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-hidden p-6">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            {visualizacao === VisualizacaoCronograma.GANTT ? (
              <div className="flex-1 min-h-[600px]">
                <GanttChart
                  tasks={tasks}
                  viewMode={viewMode}
                  onTaskChange={handleTaskChange}
                  onTaskDelete={handleTaskDelete}
                  onTaskDoubleClick={(task) => handleAtividadeClick(task.id)}
                />
              </div>
            ) : (
              <TaskList
                atividades={atividades}
                todasAtividades={todasAtividades}
                dependencias={dependencias}
                onEdit={(id) => handleAtividadeClick(id)}
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
            } as any);
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
    </>
  );

  // Modo Apresentação
  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
        {/* Toolbar compacta */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <CronogramaToolbar
            onNovaAtividade={handleNovaAtividade}
            onNovaDependencia={handleNovaDependencia}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            projetoNome="Projeto VisionPlan"
            presentationMode={presentationMode}
            onTogglePresentationMode={togglePresentationMode}
          />
        </div>

        {/* Filtros (se abertos) */}
        {showFilters && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <CronogramaFilters />
          </div>
        )}

        <CronogramaContent />

        {/* Modal de Ações da Atividade */}
        <AtividadeActionsModal
          atividade={atividadeParaAcoes}
          isOpen={activityActionsModalOpen}
          onClose={() => {
            setActivityActionsModalOpen(false);
            setAtividadeParaAcoes(null);
          }}
          onAddRestricao={handleAddRestricaoFromAtividade}
          onEditAtividade={handleEditarAtividade}
          onViewDetails={(atividadeId) => {
            console.log('Ver detalhes da atividade:', atividadeId);
            // TODO: Implementar visualização de detalhes
          }}
        />

        {/* Modal de Restrição */}
        <RestricaoModal
          restricao={null}
          isOpen={restricaoModalOpen}
          onClose={() => {
            setRestricaoModalOpen(false);
            setRestricaoModalAtividadeId(undefined);
          }}
          onSave={handleSaveRestricao}
          atividadeId={restricaoModalAtividadeId}
          onAddEvidencia={(restricaoId, arquivo) => {
            // Criar URL temporária para o arquivo (em produção, fazer upload real)
            const url = URL.createObjectURL(arquivo);
            const tipoArquivo = arquivo.type.startsWith('image/') ? 'IMAGEM' : arquivo.type === 'application/pdf' ? 'PDF' : 'OUTRO';
            addEvidencia(restricaoId, {
              nome_arquivo: arquivo.name,
              tipo_arquivo: tipoArquivo,
              url_arquivo: url,
              tamanho: arquivo.size,
              data_upload: new Date(),
              upload_por: usuario?.id,
            });
          }}
          onDeleteEvidencia={(restricaoId, evidenciaId) => {
            deleteEvidencia(restricaoId, evidenciaId);
          }}
          onAddAndamento={(restricaoId, descricao) => {
            addAndamento(restricaoId, {
              descricao,
              data: new Date(),
              responsavel: usuario?.id,
            });
          }}
        />
      </div>
    );
  }

  // Modo Normal
  return (
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
          presentationMode={presentationMode}
          onTogglePresentationMode={togglePresentationMode}
        />
      </div>

      {/* Filtros (colapsável) */}
      {showFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CronogramaFilters />
        </div>
      )}

      <CronogramaContent />

      {/* Modal de Ações da Atividade */}
      <AtividadeActionsModal
        atividade={atividadeParaAcoes}
        isOpen={activityActionsModalOpen}
        onClose={() => {
          setActivityActionsModalOpen(false);
          setAtividadeParaAcoes(null);
        }}
        onAddRestricao={handleAddRestricaoFromAtividade}
        onEditAtividade={handleEditarAtividade}
        onViewDetails={(atividadeId) => {
          console.log('Ver detalhes da atividade:', atividadeId);
          // TODO: Implementar visualização de detalhes
        }}
      />

      {/* Modal de Restrição */}
      <RestricaoModal
        restricao={null}
        isOpen={restricaoModalOpen}
        onClose={() => {
          setRestricaoModalOpen(false);
          setRestricaoModalAtividadeId(undefined);
        }}
        onSave={handleSaveRestricao}
        atividadeId={restricaoModalAtividadeId}
        onAddEvidencia={(restricaoId, arquivo) => {
          // Criar URL temporária para o arquivo (em produção, fazer upload real)
          const url = URL.createObjectURL(arquivo);
          const tipoArquivo = arquivo.type.startsWith('image/') ? 'IMAGEM' : arquivo.type === 'application/pdf' ? 'PDF' : 'OUTRO';
          addEvidencia(restricaoId, {
            nome_arquivo: arquivo.name,
            tipo_arquivo: tipoArquivo,
            url_arquivo: url,
            tamanho: arquivo.size,
            data_upload: new Date(),
            upload_por: usuario?.id,
          });
        }}
        onDeleteEvidencia={(restricaoId, evidenciaId) => {
          deleteEvidencia(restricaoId, evidenciaId);
        }}
        onAddAndamento={(restricaoId, descricao) => {
          addAndamento(restricaoId, {
            descricao,
            data: new Date(),
            responsavel: usuario?.id,
          });
        }}
      />
    </div>
  );
};

