/**
 * LPSPage - Página do Last Planner System / Planejamento Puxado
 * Visualização de planejamento em formato de calendário com post-its
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarView } from '../components/features/lps/CalendarView';
import { AnotacoesSection } from '../components/features/lps/AnotacoesSection';
import { RestricoesSection } from '../components/features/lps/RestricoesSection';
import { ActivityActionsModal } from '../components/features/lps/ActivityActionsModal';
import { RestricaoModal } from '../components/features/restricoes/RestricaoModal';
import { useLPSStore } from '../stores/lpsStore';
import { useAuthStore } from '../stores/authStore';
import {
  AtividadeLPS,
  RestricaoLPS,
  AnotacaoLPS,
  StatusAtividadeLPS,
  CategoriaAtividade,
  TipoRestricao,
  TipoAtividadeLPS,
} from '../types/lps';
import { useCronogramaStore } from '../stores/cronogramaStore';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Download,
  Settings,
  Filter,
} from 'lucide-react';

export const LPSPage: React.FC = () => {
  const { projetoId } = useParams<{ projetoId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const projetoIdParam = projetoId || searchParams.get('projeto') || 'proj-1';

  // Store LPS
  const {
    atividades,
    restricoes,
    anotacoes,
    dataInicio,
    dataFim,
    loading,
    error,
    setPeriodo,
    addAtividade,
    updateAtividade,
    deleteAtividade,
    moveAtividade,
    addRestricao,
    updateRestricao,
    deleteRestricao,
    addAnotacao,
    updateAnotacao,
    deleteAnotacao,
    syncComCronograma,
    syncComRecursos,
    addEvidencia,
    deleteEvidencia,
    addAndamento,
  } = useLPSStore();

  // Auth store
  const { usuario } = useAuthStore();

  // Store Cronograma (para integração)
  const { atividades: atividadesCronograma, carregarAtividades } = useCronogramaStore();

  // Estado local
  const [mostrarFinsDeSemana, setMostrarFinsDeSemana] = useState(true);
  const [viewMode, setViewMode] = useState<'semana' | 'mes'>('semana');
  const [activityActionsModalOpen, setActivityActionsModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<AtividadeLPS | null>(null);
  const [restricaoModalOpen, setRestricaoModalOpen] = useState(false);
  const [restricaoModalAtividadeId, setRestricaoModalAtividadeId] = useState<string | undefined>(undefined);

  // Carregar atividades do cronograma
  useEffect(() => {
    if (projetoIdParam) {
      carregarAtividades(projetoIdParam);
    }
  }, [projetoIdParam, carregarAtividades]);

  // Carregar dados mockados se não houver dados (apenas uma vez)
  useEffect(() => {
    // Verificar se dataInicio é uma Date válida
    if (!(dataInicio instanceof Date) || isNaN(dataInicio.getTime())) {
      // Se não for uma Date válida, definir período inicial
      const inicio = new Date(2024, 10, 10); // 10/11/2024
      const fim = new Date(2024, 11, 1); // 01/12/2024
      inicio.setHours(0, 0, 0, 0);
      fim.setHours(23, 59, 59, 999);
      setPeriodo(inicio, fim);
      return;
    }

    // Verificar se já foi inicializado (usando dataInicio como indicador)
    const dataInicial = new Date(2024, 10, 10); // 10/11/2024
    dataInicial.setHours(0, 0, 0, 0);
    const dataInicioZero = new Date(dataInicio);
    dataInicioZero.setHours(0, 0, 0, 0);
    
    const jaInicializado = dataInicioZero.getTime() === dataInicial.getTime() && atividades.length > 0;
    
    if (!jaInicializado && atividades.length === 0 && restricoes.length === 0 && anotacoes.length === 0) {
      // Importar dados mockados
      import('../mocks/lpsMocks').then((module) => {
        const atividadesMock = module.getAtividadesMockLPS();
        const restricoesMock = module.getRestricoesMockLPS();
        const anotacoesMock = module.getAnotacoesMockLPS();

        // Adicionar atividades ao store
        atividadesMock.forEach((atividade) => {
          addAtividade(atividade);
        });

        // Adicionar restrições ao store
        restricoesMock.forEach((restricao) => {
          addRestricao(restricao);
        });

        // Adicionar anotações ao store
        anotacoesMock.forEach((anotacao) => {
          addAnotacao(anotacao);
        });

        // Definir período inicial (baseado nas fotos: 10/11 a 01/12)
        const inicio = new Date(2024, 10, 10); // 10/11/2024
        const fim = new Date(2024, 11, 1); // 01/12/2024
        inicio.setHours(0, 0, 0, 0);
        fim.setHours(23, 59, 59, 999);
        setPeriodo(inicio, fim);
      });
    }
  }, [atividades.length, restricoes.length, anotacoes.length, dataInicio, addAtividade, addRestricao, addAnotacao, setPeriodo]);

  // Sincronizar atividades do cronograma com LPS (quando disponível)
  useEffect(() => {
    // Verificar se dataInicio é uma Date válida antes de continuar
    if (!(dataInicio instanceof Date) || isNaN(dataInicio.getTime())) {
      return;
    }

    if (atividadesCronograma.length > 0 && projetoIdParam) {
      // Converter atividades do cronograma para LPS
      const atividadesLPS: AtividadeLPS[] = atividadesCronograma
        .filter((atividade) => {
          // Verificar se a atividade já não existe no LPS
          return !atividades.some((a) => a.atividade_cronograma_id === atividade.id);
        })
        .map((atividade) => ({
          id: `lps-${atividade.id}`,
          codigo: atividade.codigo,
          nome: atividade.nome,
          descricao: atividade.descricao,
          data_inicio: new Date(atividade.data_inicio),
          data_fim: new Date(atividade.data_fim),
          data_atribuida: new Date(atividade.data_inicio),
          status: StatusAtividadeLPS.PLANEJADA,
          tipo: atividade.e_critica ? TipoAtividadeLPS.CRITICA : TipoAtividadeLPS.NORMAL,
          categoria: CategoriaAtividade.PRINCIPAL,
          responsavel: atividade.responsavel_nome,
          atividade_cronograma_id: atividade.id,
        }));

      // Adicionar atividades ao store
      atividadesLPS.forEach((atividade) => {
        addAtividade(atividade);
      });
    }
  }, [atividadesCronograma, atividades, projetoIdParam, dataInicio, addAtividade]);

  // Ajustar período baseado no viewMode
  useEffect(() => {
    const hoje = new Date();
    if (viewMode === 'semana') {
      const inicio = startOfWeek(hoje, { locale: ptBR });
      const fim = endOfWeek(hoje, { locale: ptBR });
      setPeriodo(inicio, fim);
    } else {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      setPeriodo(inicio, fim);
    }
  }, [viewMode, setPeriodo]);

  // Handlers
  const handleActivityMove = (atividadeId: string, novaData: Date) => {
    // Garantir que novaData é uma Date válida
    const data = novaData instanceof Date ? novaData : new Date(novaData);
    moveAtividade(atividadeId, data);
  };

  const handleActivityClick = (atividade: AtividadeLPS) => {
    setSelectedActivity(atividade);
    setActivityActionsModalOpen(true);
  };

  const handleAddRestricaoFromActivity = (atividadeId: string) => {
    setRestricaoModalAtividadeId(atividadeId);
    setRestricaoModalOpen(true);
    setActivityActionsModalOpen(false);
  };

  const handleSaveRestricao = (restricao: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS> | RestricaoLPS) => {
    // Se tem id, é edição
    if ('id' in restricao && restricao.id) {
      // Editar restrição
      const { id, ...rest } = restricao;
      updateRestricao(id, rest);
    } else {
      // Nova restrição
      addRestricao(restricao as Omit<RestricaoLPS, 'id'>);
    }
    setRestricaoModalOpen(false);
    setRestricaoModalAtividadeId(undefined);
  };

  const handleAddAnotacao = (descricao: string) => {
    addAnotacao({
      descricao,
      data_criacao: new Date(),
    });
  };

  const handleEditAnotacao = (id: string, descricao: string) => {
    updateAnotacao(id, { descricao });
  };

  const handleDeleteAnotacao = (id: string) => {
    deleteAnotacao(id);
  };

  const handleAddRestricao = (restricao: Omit<RestricaoLPS, 'id'>) => {
    addRestricao(restricao);
  };

  const handleEditRestricao = (id: string, restricao: Partial<RestricaoLPS>) => {
    updateRestricao(id, restricao);
  };

  const handleDeleteRestricao = (id: string) => {
    deleteRestricao(id);
  };

  const handleToggleRestricao = (id: string) => {
    const restricao = restricoes.find((r) => r.id === id);
    if (restricao) {
      updateRestricao(id, {
        status: restricao.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA',
        data_conclusao:
          restricao.status === 'CONCLUIDA' ? undefined : new Date(),
      });
    }
  };

  const handleSyncCronograma = async () => {
    if (projetoIdParam) {
      await syncComCronograma(projetoIdParam);
    }
  };

  const handleSyncRecursos = async () => {
    if (projetoIdParam) {
      await syncComRecursos(projetoIdParam);
    }
  };

  const handlePreviousPeriod = () => {
    const dias = viewMode === 'semana' ? 7 : 30;
    const novaInicio = addDays(dataInicio, -dias);
    const novaFim = addDays(dataFim, -dias);
    setPeriodo(novaInicio, novaFim);
  };

  const handleNextPeriod = () => {
    const dias = viewMode === 'semana' ? 7 : 30;
    const novaInicio = addDays(dataInicio, dias);
    const novaFim = addDays(dataFim, dias);
    setPeriodo(novaInicio, novaFim);
  };

  const handleToday = () => {
    // Voltar para o período inicial (10/11 a 01/12)
    const inicio = new Date(2024, 10, 10); // 10/11/2024
    const fim = new Date(2024, 11, 1); // 01/12/2024
    setPeriodo(inicio, fim);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Last Planner System - Planejamento Puxado
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualização de planejamento em formato de calendário com atividades e restrições
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCronograma}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              title="Sincronizar com Cronograma"
            >
              <RefreshCw size={16} />
              <span className="text-sm">Sincronizar Cronograma</span>
            </button>
            <button
              onClick={handleSyncRecursos}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              title="Sincronizar com Recursos"
            >
              <RefreshCw size={16} />
              <span className="text-sm">Sincronizar Recursos</span>
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <Download size={16} />
              <span className="text-sm">Exportar</span>
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <Settings size={16} />
              <span className="text-sm">Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPeriod}
                className="p-2 hover:bg-gray-100 rounded"
                title="Período anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleToday}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Hoje
              </button>
              <button
                onClick={handleNextPeriod}
                className="p-2 hover:bg-gray-100 rounded"
                title="Próximo período"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {dataInicio instanceof Date && !isNaN(dataInicio.getTime()) && dataFim instanceof Date && !isNaN(dataFim.getTime())
                ? `${format(dataInicio, "dd 'de' MMMM", { locale: ptBR })} - ${format(dataFim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`
                : 'Carregando...'}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('semana')}
                className={`px-4 py-2 rounded text-sm ${
                  viewMode === 'semana'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setViewMode('mes')}
                className={`px-4 py-2 rounded text-sm ${
                  viewMode === 'mes'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Mês
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={mostrarFinsDeSemana}
                onChange={(e) => setMostrarFinsDeSemana(e.target.checked)}
                className="rounded"
              />
              <span>Mostrar fins de semana</span>
            </label>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Seção de Anotações (lateral esquerda) */}
        <div className="w-80 flex-shrink-0">
          <AnotacoesSection
            anotacoes={anotacoes}
            restricoes={restricoes}
            onAddAnotacao={handleAddAnotacao}
            onEditAnotacao={handleEditAnotacao}
            onDeleteAnotacao={handleDeleteAnotacao}
          />
        </div>

        {/* Calendário (centro) */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CalendarView
            dataInicio={dataInicio}
            dataFim={dataFim}
            atividades={atividades}
            onActivityMove={handleActivityMove}
            onActivityClick={handleActivityClick}
            mostrarFinsDeSemana={mostrarFinsDeSemana}
          />
        </div>

        {/* Seção de Restrições (lateral direita) */}
        <div className="w-96 flex-shrink-0 border-l border-gray-300">
          {dataInicio instanceof Date && !isNaN(dataInicio.getTime()) && dataFim instanceof Date && !isNaN(dataFim.getTime()) ? (
            <RestricoesSection
              restricoes={restricoes}
              dataInicio={dataInicio}
              dataFim={dataFim}
              onAddRestricao={handleAddRestricao}
              onEditRestricao={handleEditRestricao}
              onDeleteRestricao={handleDeleteRestricao}
              onToggleRestricao={handleToggleRestricao}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Carregando restrições...</div>
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="animate-spin" size={24} />
              <span className="text-lg font-medium">Carregando...</span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <p className="font-medium">Erro:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Modal de Ações da Atividade */}
      <ActivityActionsModal
        atividade={selectedActivity}
        isOpen={activityActionsModalOpen}
        onClose={() => {
          setActivityActionsModalOpen(false);
          setSelectedActivity(null);
        }}
        onAddRestricao={handleAddRestricaoFromActivity}
        onEditAtividade={(atividadeId) => {
          console.log('Editar atividade:', atividadeId);
          // TODO: Implementar edição de atividade
        }}
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

