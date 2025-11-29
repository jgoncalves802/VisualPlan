/**
 * RestricoesPage - Página de gerenciamento completo de restrições
 * Visualização em calendário (post-its) e tabela, com histórico e relatórios
 */

import React, { useState, useMemo, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RestricoesCalendarView } from '../components/features/restricoes/RestricoesCalendarView';
import { RestricoesTableView } from '../components/features/restricoes/RestricoesTableView';
import { RestricaoModal } from '../components/features/restricoes/RestricaoModal';
import { RestricaoHistoryModal } from '../components/features/restricoes/RestricaoHistoryModal';
import { ReagendarRestricaoModal } from '../components/features/restricoes/ReagendarRestricaoModal';
import { useLPSStore } from '../stores/lpsStore';
import { useAuthStore } from '../stores/authStore';
import { RestricaoLPS } from '../types/lps';
import {
  Calendar,
  Table,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const RestricoesPage: React.FC = () => {

  // Store
  const {
    restricoes,
    addRestricao,
    updateRestricao,
    deleteRestricao,
    reagendarRestricao,
    getRestricoesPorPeriodo,
    getRestricoesAtrasadas,
    getRestricoesCriticas,
    podeConcluirRestricao,
    concluirRestricao,
    addEvidencia,
    deleteEvidencia,
    addAndamento,
  } = useLPSStore();

  // Auth store
  const { usuario } = useAuthStore();

  // Estado local
  const [viewMode, setViewMode] = useState<'calendario' | 'tabela'>('calendario');
  const [mostrarFinsDeSemana, setMostrarFinsDeSemana] = useState(true);
  const [restricaoSelecionada, setRestricaoSelecionada] = useState<RestricaoLPS | null>(null);
  const [modalAberto, setModalAberto] = useState<'criar' | 'editar' | 'historico' | 'reagendar' | null>(null);

  // Período atual (semana atual por padrão)
  const [periodoAtual, setPeriodoAtual] = useState(() => {
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { locale: ptBR });
    const fim = endOfWeek(hoje, { locale: ptBR });
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    return { inicio, fim };
  });

  // Atualizar restrição selecionada quando restricoes mudarem
  useEffect(() => {
    if (restricaoSelecionada) {
      const restricaoAtualizada = restricoes.find((r) => r.id === restricaoSelecionada.id);
      if (restricaoAtualizada) {
        setRestricaoSelecionada(restricaoAtualizada);
      }
    }
  }, [restricoes, restricaoSelecionada?.id]);

  // Restrição atualizada para o modal (sempre busca do store)
  const restricaoParaModal = useMemo(() => {
    if (modalAberto === 'editar' && restricaoSelecionada) {
      return restricoes.find((r) => r.id === restricaoSelecionada.id) || restricaoSelecionada;
    }
    return null;
  }, [modalAberto, restricaoSelecionada?.id, restricoes]);

  // Filtrar restrições por período
  const restricoesFiltradas = useMemo(() => {
    return getRestricoesPorPeriodo(periodoAtual.inicio, periodoAtual.fim);
  }, [restricoes, periodoAtual.inicio, periodoAtual.fim, getRestricoesPorPeriodo]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const atrasadas = getRestricoesAtrasadas();
    const criticas = getRestricoesCriticas();
    const pendentes = restricoes.filter((r) => r.status === 'PENDENTE');
    const concluidas = restricoes.filter((r) => r.status === 'CONCLUIDA');

    return {
      total: restricoes.length,
      pendentes: pendentes.length,
      concluidas: concluidas.length,
      atrasadas: atrasadas.length,
      criticas: criticas.length,
      comHistorico: restricoes.filter((r) => r.historico && r.historico.length > 0).length,
    };
  }, [restricoes, getRestricoesAtrasadas, getRestricoesCriticas]);

  // Handlers
  const handleAddRestricao = () => {
    setRestricaoSelecionada(null);
    setModalAberto('criar');
  };

  const handleEditRestricao = (restricao: RestricaoLPS) => {
    setRestricaoSelecionada(restricao);
    setModalAberto('editar');
  };

  const handleDeleteRestricao = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta restrição?')) {
      deleteRestricao(id);
    }
  };

  const handleToggleStatus = (id: string) => {
    const restricao = restricoes.find((r) => r.id === id);
    if (!restricao) return;

    // Se está tentando concluir, verificar permissão
    if (restricao.status !== 'CONCLUIDA' && usuario) {
      if (podeConcluirRestricao(id, usuario.id)) {
        // Usar método concluirRestricao que já faz a verificação e atualiza corretamente
        const sucesso = concluirRestricao(id, usuario.id);
        if (!sucesso) {
          alert('Apenas o criador da restrição pode marcá-la como concluída.');
        }
      } else {
        alert('Apenas o criador da restrição pode marcá-la como concluída.');
      }
    } else {
      // Se está desfazendo conclusão, apenas atualizar status
      updateRestricao(id, {
        status: 'PENDENTE',
        data_conclusao: undefined,
      });
    }
  };

  const handleViewHistory = (restricao: RestricaoLPS) => {
    setRestricaoSelecionada(restricao);
    setModalAberto('historico');
  };

  const handleReagendar = (restricao: RestricaoLPS) => {
    setRestricaoSelecionada(restricao);
    setModalAberto('reagendar');
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
    setModalAberto(null);
    setRestricaoSelecionada(null);
  };

  const handleReagendarRestricao = (restricaoId: string, novaData: Date, motivo?: string, impacto?: string) => {
    reagendarRestricao(restricaoId, novaData, motivo, impacto);
    setModalAberto(null);
    setRestricaoSelecionada(null);
  };

  const handleMoveRestricao = (restricaoId: string, novaData: Date) => {
    // Garantir que novaData é uma Date válida
    const data = novaData instanceof Date ? novaData : new Date(novaData);
    reagendarRestricao(restricaoId, data, 'Movida via drag and drop', undefined);
  };

  const handlePreviousWeek = () => {
    const inicio = subWeeks(periodoAtual.inicio, 1);
    const fim = subWeeks(periodoAtual.fim, 1);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    setPeriodoAtual({ inicio, fim });
  };

  const handleNextWeek = () => {
    const inicio = addWeeks(periodoAtual.inicio, 1);
    const fim = addWeeks(periodoAtual.fim, 1);
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    setPeriodoAtual({ inicio, fim });
  };

  const handleToday = () => {
    const hoje = new Date();
    const inicio = startOfWeek(hoje, { locale: ptBR });
    const fim = endOfWeek(hoje, { locale: ptBR });
    inicio.setHours(0, 0, 0, 0);
    fim.setHours(23, 59, 59, 999);
    setPeriodoAtual({ inicio, fim });
  };

  const handleExportRelatorio = () => {
    // TODO: Implementar exportação de relatório
    console.log('Exportar relatório de restrições');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestão de Restrições</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cadastro, controle e análise de restrições do projeto
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRelatorio}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <Download size={16} />
              <span className="text-sm">Exportar Relatório</span>
            </button>
            <button
              onClick={handleAddRestricao}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Nova Restrição</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-2xl font-bold text-gray-900">{estatisticas.total}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600">Pendentes</div>
            <div className="text-2xl font-bold text-blue-900">{estatisticas.pendentes}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600">Concluídas</div>
            <div className="text-2xl font-bold text-green-900">{estatisticas.concluidas}</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-sm text-red-600">Atrasadas</div>
            <div className="text-2xl font-bold text-red-900">{estatisticas.atrasadas}</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-orange-600">Críticas</div>
            <div className="text-2xl font-bold text-orange-900">{estatisticas.criticas}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3">
            <div className="text-sm text-yellow-600">Com Histórico</div>
            <div className="text-2xl font-bold text-yellow-900">{estatisticas.comHistorico}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousWeek}
                className="p-2 hover:bg-gray-100 rounded"
                title="Semana anterior"
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
                onClick={handleNextWeek}
                className="p-2 hover:bg-gray-100 rounded"
                title="Próxima semana"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="text-sm font-medium text-gray-700">
              {format(periodoAtual.inicio, "dd 'de' MMMM", { locale: ptBR })} -{' '}
              {format(periodoAtual.fim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('calendario')}
                className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
                  viewMode === 'calendario'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Calendar size={16} />
                Calendário
              </button>
              <button
                onClick={() => setViewMode('tabela')}
                className={`px-4 py-2 rounded text-sm flex items-center gap-2 ${
                  viewMode === 'tabela'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Table size={16} />
                Tabela
              </button>
            </div>
            {viewMode === 'calendario' && (
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={mostrarFinsDeSemana}
                  onChange={(e) => setMostrarFinsDeSemana(e.target.checked)}
                  className="rounded"
                />
                <span>Mostrar fins de semana</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'calendario' ? (
          periodoAtual.inicio instanceof Date && !isNaN(periodoAtual.inicio.getTime()) &&
          periodoAtual.fim instanceof Date && !isNaN(periodoAtual.fim.getTime()) ? (
            <RestricoesCalendarView
              dataInicio={periodoAtual.inicio}
              dataFim={periodoAtual.fim}
              restricoes={restricoesFiltradas}
              onRestricaoClick={handleEditRestricao}
              onRestricaoMove={handleMoveRestricao}
              mostrarFinsDeSemana={mostrarFinsDeSemana}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Carregando calendário...</div>
            </div>
          )
        ) : (
          <RestricoesTableView
            restricoes={restricoes}
            onEdit={handleEditRestricao}
            onDelete={handleDeleteRestricao}
            onToggleStatus={handleToggleStatus}
            onViewHistory={handleViewHistory}
            onReagendar={handleReagendar}
            podeConcluir={
              usuario
                ? (restricaoId: string) => podeConcluirRestricao(restricaoId, usuario.id)
                : undefined
            }
          />
        )}
      </div>

      {/* Modais */}
      <RestricaoModal
        restricao={restricaoParaModal}
        isOpen={modalAberto === 'criar' || modalAberto === 'editar'}
        onClose={() => {
          setModalAberto(null);
          setRestricaoSelecionada(null);
        }}
        onSave={handleSaveRestricao}
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
          // O useEffect vai atualizar restricaoSelecionada quando restricoes mudar
        }}
        onDeleteEvidencia={(restricaoId, evidenciaId) => {
          deleteEvidencia(restricaoId, evidenciaId);
          // O useEffect vai atualizar restricaoSelecionada quando restricoes mudar
        }}
        onAddAndamento={(restricaoId, descricao) => {
          addAndamento(restricaoId, {
            descricao,
            data: new Date(),
            responsavel: usuario?.id,
          });
          // O useEffect vai atualizar restricaoSelecionada quando restricoes mudar
        }}
      />

      <RestricaoHistoryModal
        restricao={restricaoSelecionada}
        isOpen={modalAberto === 'historico'}
        onClose={() => {
          setModalAberto(null);
          setRestricaoSelecionada(null);
        }}
      />

      <ReagendarRestricaoModal
        restricao={restricaoSelecionada}
        isOpen={modalAberto === 'reagendar'}
        onClose={() => {
          setModalAberto(null);
          setRestricaoSelecionada(null);
        }}
        onReagendar={handleReagendarRestricao}
      />
    </div>
  );
};

