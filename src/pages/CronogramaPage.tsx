/**
 * Página principal do Cronograma (Gantt Chart)
 * Usa exclusivamente VisionGantt como engine de cronograma
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCronograma } from '../hooks/useCronograma';
import { useResources } from '../hooks/useResources';
import { VisualizacaoCronograma } from '../types/cronograma';
import { useToast } from '../components/ui/Toast';

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
import { P6ImportModal } from '../components/features/cronograma/P6ImportModal';
import { P6XmlImportModal } from '../components/features/cronograma/P6XmlImportModal';
import { EpsSelector } from '../components/features/cronograma/EpsSelector';
import { MasterGanttView } from '../components/features/cronograma/MasterGanttView';
import { useLPSStore } from '../stores/lpsStore';
import { useAuthStore } from '../stores/authStore';
import { useCronogramaStore } from '../stores/cronogramaStore';
import { RestricaoLPS } from '../types/lps';
import { ArrowLeft, PanelRightOpen, PanelRightClose, Users, List, BarChart3 } from 'lucide-react';
import { ResourceWorkspace } from '../components/features/cronograma/ResourceWorkspace';
import { resourceService } from '../services/resourceService';
import type { Task } from '../lib/vision-gantt/types';

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
  
  const { carregarAtividades } = useCronogramaStore();

  const { calendarios, calendario_padrao } = useCronogramaStore();
  const { addRestricao, addEvidencia, deleteEvidencia, addAndamento } = useLPSStore();
  const { usuario } = useAuthStore();
  const toast = useToast();
  
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
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [selectedTaskForResources, setSelectedTaskForResources] = useState<Task | null>(null);
  const [masterView, setMasterView] = useState<'list' | 'timeline'>('list');
  const [p6ImportModalOpen, setP6ImportModalOpen] = useState(false);
  const [p6XmlImportModalOpen, setP6XmlImportModalOpen] = useState(false);

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

  const handleAssignResource = async (resourceId: string, taskId: string) => {
    if (!usuario?.empresaId) return;
    
    try {
      const task = todasAtividades.find(a => a.id === taskId);
      const startDate = task?.data_inicio || new Date().toISOString().split('T')[0];
      const endDate = task?.data_fim || new Date().toISOString().split('T')[0];
      
      await resourceService.createAllocation({
        empresaId: usuario.empresaId,
        atividadeId: taskId,
        resourceId,
        dataInicio: startDate,
        dataFim: endDate,
        unidades: 100,
        unidadeTipo: 'PERCENT',
        quantidadePlanejada: 8,
        quantidadeReal: 0,
        custoPlanejado: 0,
        custoReal: 0,
        curvaAlocacao: 'LINEAR',
        status: 'PLANNED',
        ativo: true,
        metadata: {},
      });
    } catch (err) {
      console.error('Error assigning resource:', err);
    }
  };

  const handleUnassignResource = async (allocationId: string) => {
    try {
      await resourceService.deleteAllocation(allocationId);
    } catch (err) {
      console.error('Error unassigning resource:', err);
    }
  };

  
  if (isLoading && atividades.length === 0) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200 bg-gray-100">
              {[40, 180, 100, 100, 80, 1].map((w, i) => (
                <div 
                  key={i}
                  className="h-10 border-r border-gray-200 flex items-center px-2"
                  style={{ width: i === 5 ? 'auto' : w, flex: i === 5 ? 1 : 'none' }}
                >
                  <div className="h-3 bg-gray-300 rounded animate-pulse" style={{ width: '70%' }}></div>
                </div>
              ))}
            </div>
            
            {Array.from({ length: 10 }).map((_, rowIndex) => (
              <div 
                key={rowIndex}
                className={`flex border-b border-gray-100 ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                style={{ height: 36 }}
              >
                {[40, 180, 100, 100, 80].map((w, colIndex) => (
                  <div 
                    key={colIndex}
                    className="border-r border-gray-100 flex items-center px-2"
                    style={{ width: w }}
                  >
                    <div 
                      className="h-3 bg-gray-200 rounded animate-pulse skeleton-shimmer"
                      style={{ 
                        width: colIndex === 0 ? '40%' : colIndex === 1 ? '60%' : '50%',
                        animationDelay: `${rowIndex * 50}ms`
                      }}
                    ></div>
                  </div>
                ))}
                
                <div className="flex-1 flex items-center px-4">
                  <div 
                    className="h-5 bg-blue-100 rounded animate-pulse skeleton-shimmer"
                    style={{ 
                      width: `${25 + (rowIndex % 5) * 10}%`,
                      marginLeft: (rowIndex % 3) * 24,
                      animationDelay: `${rowIndex * 50 + 100}ms`
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { opacity: 0.4; }
            50% { opacity: 0.7; }
            100% { opacity: 0.4; }
          }
          .skeleton-shimmer {
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}</style>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Main Gantt Area */}
        <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ${showResourcePanel ? 'pr-0' : ''}`}>
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
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
                  onAtividadeCreate={async (afterTaskId, parentWbsId) => {
                    try {
                      console.log('[CronogramaPage] Creating activity with projeto_id:', projetoId, 'wbs_id:', parentWbsId);
                      await adicionarAtividade({
                        nome: 'Nova Atividade',
                        projeto_id: projetoId,
                        wbs_id: parentWbsId || undefined,
                        parent_id: undefined,
                        data_inicio: new Date().toISOString().split('T')[0],
                        data_fim: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                        duracao_dias: 1,
                        progresso: 0,
                        status: 'A Fazer',
                        tipo: 'Tarefa',
                      } as any, afterTaskId);
                      toast.success('Atividade criada com sucesso!');
                    } catch (error) {
                      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
                      console.error('[CronogramaPage] Erro ao criar atividade:', errorMsg, error);
                      toast.error(`Erro ao criar atividade: ${errorMsg}`);
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
                  onTaskSelect={setSelectedTaskForResources}
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
                onDeleteMultiple={async (ids) => {
                  let successCount = 0;
                  const errors: string[] = [];
                  
                  for (const id of ids) {
                    try {
                      await excluirAtividade(id);
                      successCount++;
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
                      errors.push(msg);
                    }
                  }
                  
                  if (successCount > 0) {
                    toast.success(`${successCount} atividade(s) excluída(s) com sucesso!`);
                  }
                  if (errors.length > 0) {
                    toast.error(`${errors.length} atividade(s) não foram excluídas.`);
                  }
                }}
              />
            )}
          </div>
        )}
        </div>
        
        {/* Resource Panel - Split View (P6 Style) */}
        {showResourcePanel && usuario?.empresaId && (
          <div className="w-80 flex-shrink-0 h-full">
            <ResourceWorkspace
              empresaId={usuario.empresaId}
              selectedTask={selectedTaskForResources}
              projectCalendarId={calendario_padrao}
              onAssignResource={handleAssignResource}
              onUnassignResource={handleUnassignResource}
            />
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
          try {
            if (atividadeSelecionada) {
              await atualizarAtividade(atividadeSelecionada, dados);
              toast.success('Atividade atualizada com sucesso!');
            } else {
              console.log('[CronogramaPage] TaskModal: Creating activity with projeto_id:', projetoId);
              await adicionarAtividade({
                ...dados,
                projeto_id: projetoId,
              } as any);
              toast.success('Atividade criada com sucesso!');
            }
            setModalTaskOpen(false);
            setAtividadeSelecionada(null);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error('[CronogramaPage] Erro ao salvar atividade:', errorMsg, error);
            toast.error(`Erro ao salvar atividade: ${errorMsg}`);
          }
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
            onImportP6={() => setP6ImportModalOpen(true)}
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
                {masterView === 'list' 
                  ? 'Selecione um projeto da estrutura EPS para abrir o cronograma'
                  : 'Visão consolidada de todos os projetos no tempo'
                }
              </p>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMasterView('list')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  masterView === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
                Lista
              </button>
              <button
                onClick={() => setMasterView('timeline')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  masterView === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Timeline Master
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-auto">
          {masterView === 'list' ? (
            <EpsSelector 
              onSelectProject={handleSelectProject}
              onCreateNew={() => {
                toast.info('Crie um novo projeto na página de Administração (EPS)');
              }}
              onImportP6={() => setP6ImportModalOpen(true)}
              onImportXml={() => setP6XmlImportModalOpen(true)}
            />
          ) : (
            <MasterGanttView onSelectProject={handleSelectProject} />
          )}
        </div>
        
        <P6ImportModal
          isOpen={p6ImportModalOpen}
          onClose={() => setP6ImportModalOpen(false)}
          projetoId={undefined}
          empresaId={usuario?.empresaId || ''}
          userId={usuario?.id || ''}
          onImportComplete={(result, newProjetoId) => {
            setP6ImportModalOpen(false);
            toast.success(`Importação concluída: ${result.tasksImported} atividades e ${result.dependenciesImported} dependências importadas.`);
            if (newProjetoId) {
              setSelectedProjetoId(newProjetoId);
              carregarAtividades(newProjetoId);
            }
          }}
        />
        
        <P6XmlImportModal
          isOpen={p6XmlImportModalOpen}
          onClose={() => setP6XmlImportModalOpen(false)}
          projetoId={undefined}
          empresaId={usuario?.empresaId || ''}
          onImportComplete={(newProjetoId) => {
            setP6XmlImportModalOpen(false);
            toast.success('Importação XML concluída com sucesso!');
            if (newProjetoId) {
              setSelectedProjetoId(newProjetoId);
              carregarAtividades(newProjetoId);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full w-full bg-gray-50">
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
          
          {/* Resource Panel Toggle Button */}
          <button
            onClick={() => setShowResourcePanel(!showResourcePanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showResourcePanel 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={showResourcePanel ? 'Ocultar painel de recursos' : 'Mostrar painel de recursos'}
          >
            {showResourcePanel ? (
              <PanelRightClose className="w-5 h-5" />
            ) : (
              <PanelRightOpen className="w-5 h-5" />
            )}
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Recursos</span>
          </button>
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
          onImportP6={() => setP6ImportModalOpen(true)}
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

      <P6ImportModal
        isOpen={p6ImportModalOpen}
        onClose={() => setP6ImportModalOpen(false)}
        projetoId={projetoId}
        empresaId={usuario?.empresaId || ''}
        userId={usuario?.id || ''}
        onImportComplete={(result, newProjetoId) => {
          setP6ImportModalOpen(false);
          toast.success(`Importação concluída: ${result.tasksImported} atividades e ${result.dependenciesImported} dependências importadas.`);
          const targetProjetoId = newProjetoId || projetoId;
          if (targetProjetoId) {
            carregarAtividades(targetProjetoId);
            if (!projetoId && newProjetoId) {
              setSelectedProjetoId(newProjetoId);
            }
          }
        }}
      />
      
      <P6XmlImportModal
        isOpen={p6XmlImportModalOpen}
        onClose={() => setP6XmlImportModalOpen(false)}
        projetoId={projetoId}
        empresaId={usuario?.empresaId || ''}
        onImportComplete={(newProjetoId) => {
          setP6XmlImportModalOpen(false);
          toast.success('Importação XML concluída com sucesso!');
          const targetProjetoId = newProjetoId || projetoId;
          if (targetProjetoId) {
            carregarAtividades(targetProjetoId);
            if (!projetoId && newProjetoId) {
              setSelectedProjetoId(newProjetoId);
            }
          }
        }}
      />
    </div>
  );
};
