/**
 * Página principal do Cronograma (Gantt Chart)
 * Usa exclusivamente VisionGantt como engine de cronograma
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCronograma } from '../hooks/useCronograma';
import { useResources } from '../hooks/useResources';
import { VisualizacaoCronograma } from '../types/cronograma';

import { CronogramaToolbar } from '../components/features/cronograma/CronogramaToolbar';
import { CronogramaFilters } from '../components/features/cronograma/CronogramaFilters';
import { VisionGanttWrapper } from '../components/features/cronograma/VisionGanttWrapper';
import { TaskList } from '../components/features/cronograma/TaskList';
import { TaskModal } from '../components/features/cronograma/TaskModal';
import { DependencyModal } from '../components/features/cronograma/DependencyModal';
import { CronogramaStats } from '../components/features/cronograma/CronogramaStats';
import { AtividadeActionsModal } from '../components/features/cronograma/AtividadeActionsModal';
import { ManageDependenciesModal } from '../components/features/cronograma/ManageDependenciesModal';
import { RestricaoModal } from '../components/features/restricoes/RestricaoModal';
import { EpsSelector } from '../components/features/cronograma/EpsSelector';
import { useLPSStore } from '../stores/lpsStore';
import { useAuthStore } from '../stores/authStore';
import { useCronogramaStore } from '../stores/cronogramaStore';
import { RestricaoLPS } from '../types/lps';
import { ArrowLeft } from 'lucide-react';

/**
 * Página do Cronograma - VisionGantt
 */
export const CronogramaPage: React.FC = () => {
  const { projetoId: urlProjetoId } = useParams<{ projetoId: string }>();
  
  const [selectedProjetoId, setSelectedProjetoId] = useState<string | null>(urlProjetoId || null);
  const [selectedProjetoNome, setSelectedProjetoNome] = useState<string>('');
  
  const projetoId = selectedProjetoId || urlProjetoId;
  
  const {
    atividades,
    todasAtividades,
    dependencias,
    visualizacao,
    isLoading,
    erro,
    estatisticas,
    adicionarAtividade,
    atualizarAtividade,
    excluirAtividade,
    adicionarDependencia,
    atualizarDependencia,
    excluirDependencia,
    calcularCaminhoCritico,
  } = useCronograma(projetoId || '');

  const { calendarios } = useCronogramaStore();
  const { addRestricao, addEvidencia, deleteEvidencia, addAndamento } = useLPSStore();
  const { usuario } = useAuthStore();
  
  const handleSelectProject = (projectId: string, projectName: string) => {
    setSelectedProjetoId(projectId);
    setSelectedProjetoNome(projectName);
  };
  
  const handleBackToSelection = () => {
    setSelectedProjetoId(null);
    setSelectedProjetoNome('');
  };
  
  const { 
    resources, 
    allocations,
  } = useResources(usuario?.empresaId || '', projetoId);

  const [modalTaskOpen, setModalTaskOpen] = useState(false);
  const [modalDependencyOpen, setModalDependencyOpen] = useState(false);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [activityActionsModalOpen, setActivityActionsModalOpen] = useState(false);
  const [atividadeParaAcoes, setAtividadeParaAcoes] = useState<any | null>(null);
  const [restricaoModalOpen, setRestricaoModalOpen] = useState(false);
  const [restricaoModalAtividadeId, setRestricaoModalAtividadeId] = useState<string | undefined>(undefined);
  const [manageDepsModalOpen, setManageDepsModalOpen] = useState(false);
  const [manageDepsAtividadeId, setManageDepsAtividadeId] = useState<string | null>(null);

  useEffect(() => {
    if (projetoId && atividades.length > 0) {
      calcularCaminhoCritico(projetoId);
    }
  }, [projetoId, atividades.length]);

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

  const handleManageDependencies = (atividadeId: string) => {
    setManageDepsAtividadeId(atividadeId);
    setManageDepsModalOpen(true);
    setActivityActionsModalOpen(false);
  };

  const handleSaveRestricao = (restricao: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS> | RestricaoLPS) => {
    if ('id' in restricao && restricao.id) {
      return;
    } else {
      addRestricao({
        ...restricao,
        atividade_id: restricaoModalAtividadeId,
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

  if (isLoading && atividades.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex items-center justify-center h-full">
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

  const CronogramaContent = () => (
    <>
      <div className="flex-1 overflow-hidden p-6">
        {atividades.length === 0 ? (
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
            {visualizacao === VisualizacaoCronograma.GANTT ? (
              <div className="flex-1 min-h-[600px]">
                <VisionGanttWrapper
                  atividades={todasAtividades}
                  dependencias={dependencias}
                  projetoId={projetoId!}
                  empresaId={usuario?.empresaId}
                  resources={resources}
                  allocations={allocations}
                  calendarios={calendarios}
                  onAtividadeUpdate={async (atividade, changes) => {
                    await atualizarAtividade(atividade.id, changes);
                  }}
                  onAtividadeCreate={async (_afterTaskId, parentWbsId) => {
                    try {
                      // When creating under a WBS node, set wbs_id but leave parent_id NULL
                      // (parent_id FK only allows references to atividades_cronograma, not eps_nodes)
                      await adicionarAtividade({
                        nome: 'Nova Atividade',
                        projeto_id: projetoId,
                        wbs_id: parentWbsId || undefined,
                        parent_id: undefined, // NULL - WBS nodes are not activity parents
                        data_inicio: new Date().toISOString().split('T')[0],
                        data_fim: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        duracao_dias: 1,
                        progresso: 0,
                        status: 'A Fazer',
                        tipo: 'Atividade',
                      } as any);
                    } catch (error) {
                      console.error('Erro ao criar atividade:', error);
                    }
                  }}
                  onDependenciaCreate={async (dep) => {
                    await adicionarDependencia(dep);
                  }}
                  onDependenciaDelete={async (depId) => {
                    await excluirDependencia(depId);
                  }}
                  onAtividadeClick={(atividade) => handleAtividadeClick(atividade.id)}
                  onManageDependencies={handleManageDependencies}
                  height={600}
                  gridWidth={500}
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

      <TaskModal
        open={modalTaskOpen}
        onClose={() => {
          setModalTaskOpen(false);
          setAtividadeSelecionada(null);
        }}
        atividadeId={atividadeSelecionada}
        projetoId={projetoId!}
        onSave={async (dados) => {
          if (atividadeSelecionada) {
            await atualizarAtividade(atividadeSelecionada, dados);
          } else {
            await adicionarAtividade({
              ...dados,
              projeto_id: projetoId,
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

  if (presentationMode) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col">
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

        {showFilters && (
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <CronogramaFilters />
          </div>
        )}

        <CronogramaContent />

        <AtividadeActionsModal
          atividade={atividadeParaAcoes}
          isOpen={activityActionsModalOpen}
          onClose={() => {
            setActivityActionsModalOpen(false);
            setAtividadeParaAcoes(null);
          }}
          onAddRestricao={handleAddRestricaoFromAtividade}
          onEditAtividade={handleEditarAtividade}
          onManageDependencies={handleManageDependencies}
          onViewDetails={(atividadeId) => {
            console.log('Ver detalhes da atividade:', atividadeId);
          }}
        />

        {manageDepsAtividadeId && (
          <ManageDependenciesModal
            open={manageDepsModalOpen}
            onClose={() => {
              setManageDepsModalOpen(false);
              setManageDepsAtividadeId(null);
            }}
            atividadeId={manageDepsAtividadeId}
            atividades={todasAtividades}
            dependencias={dependencias}
            onAddDependencia={adicionarDependencia}
            onUpdateDependencia={atualizarDependencia}
            onRemoveDependencia={excluirDependencia}
          />
        )}

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

  if (!projetoId) {
    return (
      <div className="flex flex-col h-full w-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cronograma</h1>
              <p className="text-sm text-gray-500 mt-1">
                Selecione um projeto da estrutura EPS para abrir o cronograma
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          <EpsSelector onSelectProject={handleSelectProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToSelection}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voltar para seleção de projetos"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cronograma</h1>
              <p className="text-sm text-gray-500 mt-1">
                {selectedProjetoNome || 'Gerencie o cronograma do projeto com VisionGantt'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <CronogramaStats stats={estatisticas} />
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <CronogramaToolbar
          onNovaAtividade={handleNovaAtividade}
          onNovaDependencia={handleNovaDependencia}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showFilters={showFilters}
          projetoNome={selectedProjetoNome || "Projeto VisionPlan"}
          presentationMode={presentationMode}
          onTogglePresentationMode={togglePresentationMode}
        />
      </div>

      {showFilters && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <CronogramaFilters />
        </div>
      )}

      <CronogramaContent />

      <AtividadeActionsModal
        atividade={atividadeParaAcoes}
        isOpen={activityActionsModalOpen}
        onClose={() => {
          setActivityActionsModalOpen(false);
          setAtividadeParaAcoes(null);
        }}
        onAddRestricao={handleAddRestricaoFromAtividade}
        onEditAtividade={handleEditarAtividade}
        onManageDependencies={handleManageDependencies}
        onViewDetails={(atividadeId) => {
          console.log('Ver detalhes da atividade:', atividadeId);
        }}
      />

      {manageDepsAtividadeId && (
        <ManageDependenciesModal
          open={manageDepsModalOpen}
          onClose={() => {
            setManageDepsModalOpen(false);
            setManageDepsAtividadeId(null);
          }}
          atividadeId={manageDepsAtividadeId}
          atividades={todasAtividades}
          dependencias={dependencias}
          onAddDependencia={adicionarDependencia}
          onUpdateDependencia={atualizarDependencia}
          onRemoveDependencia={excluirDependencia}
        />
      )}

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
