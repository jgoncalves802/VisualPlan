/**
 * Hook customizado para gerenciar funcionalidades do Cronograma
 */

import { useEffect, useMemo, useCallback } from 'react';
import { ViewMode } from 'gantt-task-react';
import { useCronogramaStore } from '../stores/cronogramaStore';
import {
  TaskGantt,
  EscalaTempo,
  AtividadeMock,
  TipoTarefa,
} from '../types/cronograma';

/**
 * Hook principal do Cronograma
 */
export const useCronograma = (projetoId: string) => {
  const {
    atividades,
    dependencias,
    caminhoCritico,
    visualizacao,
    escala,
    filtros,
    isLoading,
    isCalculandoCPM,
    erro,
    carregarAtividades,
    carregarDependencias,
    adicionarAtividade,
    atualizarAtividade,
    excluirAtividade,
    adicionarDependencia,
    atualizarDependencia,
    excluirDependencia,
    calcularCaminhoCritico,
    setVisualizacao,
    setEscala,
    setFiltros,
    limparFiltros,
  } = useCronogramaStore();

  // ========================================================================
  // CARREGAMENTO INICIAL
  // ========================================================================

  useEffect(() => {
    if (projetoId) {
      carregarAtividades(projetoId);
      carregarDependencias(projetoId);
    }
  }, [projetoId, carregarAtividades, carregarDependencias]);

  // ========================================================================
  // FILTROS
  // ========================================================================

  /**
   * Aplica filtros nas atividades
   */
  const atividadesFiltradas = useMemo(() => {
    let resultado = [...atividades];

    // Filtro de busca
    if (filtros.busca) {
      const termo = filtros.busca.toLowerCase();
      resultado = resultado.filter(
        (a) =>
          a.nome.toLowerCase().includes(termo) ||
          a.codigo?.toLowerCase().includes(termo) ||
          a.descricao?.toLowerCase().includes(termo)
      );
    }

    // Filtro de status
    if (filtros.status && filtros.status.length > 0) {
      resultado = resultado.filter((a) => filtros.status!.includes(a.status));
    }

    // Filtro de responsável
    if (filtros.responsavel_id) {
      resultado = resultado.filter((a) => a.responsavel_id === filtros.responsavel_id);
    }

    // Filtro de setor
    if (filtros.setor_id) {
      resultado = resultado.filter((a) => a.setor_id === filtros.setor_id);
    }

    // Filtro de apenas críticas
    if (filtros.apenas_criticas) {
      resultado = resultado.filter((a) => a.e_critica === true);
    }

    // Filtro de apenas atrasadas
    if (filtros.apenas_atrasadas) {
      const hoje = new Date();
      resultado = resultado.filter((a) => {
        const dataFim = new Date(a.data_fim);
        return dataFim < hoje && a.progresso < 100;
      });
    }

    // Filtro de data início
    if (filtros.data_inicio) {
      resultado = resultado.filter((a) => {
        const dataInicio = new Date(a.data_inicio);
        return dataInicio >= filtros.data_inicio!;
      });
    }

    // Filtro de data fim
    if (filtros.data_fim) {
      resultado = resultado.filter((a) => {
        const dataFim = new Date(a.data_fim);
        return dataFim <= filtros.data_fim!;
      });
    }

    return resultado;
  }, [atividades, filtros]);

  // ========================================================================
  // TRANSFORMAÇÃO PARA GANTT
  // ========================================================================

  /**
   * Converte atividades para formato do gantt-task-react
   */
  const tasks: TaskGantt[] = useMemo(() => {
    return atividadesFiltradas.map((atividade) => {
      const tipo = mapTipoToGantt(atividade.tipo);
      const styles = getTaskStyles(atividade);

      // Busca dependências baseadas em relacionamentos
      const deps = dependencias
        .filter((d) => d.atividade_destino_id === atividade.id)
        .map((d) => d.atividade_origem_id);

      // Adiciona parent_id como dependência se existir (para hierarquia)
      if (atividade.parent_id) {
        // Verifica se o parent existe nas atividades filtradas
        const parentExists = atividadesFiltradas.some((a) => a.id === atividade.parent_id);
        if (parentExists && !deps.includes(atividade.parent_id)) {
          deps.push(atividade.parent_id);
        }
      }

      return {
        id: atividade.id,
        type: tipo,
        name: atividade.nome,
        start: new Date(atividade.data_inicio),
        end: new Date(atividade.data_fim),
        progress: atividade.progresso,
        dependencies: deps.length > 0 ? deps : undefined,
        project: atividade.parent_id, // Define o parent para hierarquia visual
        parent: atividade.parent_id,
        styles,
        // Campos customizados
        tipo: atividade.tipo as 'Tarefa' | 'Marco' | 'Fase',
        status: atividade.status,
        responsavel: atividade.responsavel_nome,
        e_critica: atividade.e_critica,
        folga_total: atividade.folga_total,
        codigo: atividade.codigo,
        edt: atividade.edt,
        duracao_horas: atividade.duracao_horas,
        calendario_id: atividade.calendario_id,
        // Custos e Valores
        custo_planejado: atividade.custo_planejado,
        custo_real: atividade.custo_real,
        valor_planejado: atividade.valor_planejado,
        valor_real: atividade.valor_real,
        custo_unitario: atividade.custo_unitario,
        quantidade_planejada: atividade.quantidade_planejada,
        quantidade_real: atividade.quantidade_real,
        unidade_medida: atividade.unidade_medida,
      };
    });
  }, [atividadesFiltradas, dependencias]);

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Handler para mudança de data (drag & drop)
   */
  const handleTaskChange = useCallback(
    async (task: TaskGantt) => {
      try {
        await atualizarAtividade(task.id, {
          data_inicio: task.start.toISOString().split('T')[0],
          data_fim: task.end.toISOString().split('T')[0],
          progresso: task.progress,
        });
      } catch (error) {
        console.error('Erro ao atualizar atividade:', error);
      }
    },
    [atualizarAtividade]
  );

  /**
   * Handler para exclusão de tarefa
   */
  const handleTaskDelete = useCallback(
    async (task: TaskGantt) => {
      if (window.confirm(`Deseja realmente excluir a atividade "${task.name}"?`)) {
        try {
          await excluirAtividade(task.id);
        } catch (error) {
          console.error('Erro ao excluir atividade:', error);
        }
      }
    },
    [excluirAtividade]
  );

  /**
   * Converte escala para ViewMode do Gantt
   */
  const viewMode: ViewMode = useMemo(() => {
    switch (escala) {
      case EscalaTempo.HORA:
        return ViewMode.Hour;
      case EscalaTempo.DIA:
        return ViewMode.Day;
      case EscalaTempo.SEMANA:
        return ViewMode.Week;
      case EscalaTempo.MES:
        return ViewMode.Month;
      case EscalaTempo.ANO:
        return ViewMode.Year;
      default:
        return ViewMode.Day;
    }
  }, [escala]);

  // ========================================================================
  // ESTATÍSTICAS
  // ========================================================================

  const estatisticas = useMemo(() => {
    const total = atividades.length;
    const concluidas = atividades.filter((a) => a.progresso === 100).length;
    const emAndamento = atividades.filter(
      (a) => a.progresso > 0 && a.progresso < 100
    ).length;
    const naoIniciadas = atividades.filter((a) => a.progresso === 0).length;
    const criticas = atividades.filter((a) => a.e_critica).length;
    const atrasadas = atividades.filter((a) => {
      const dataFim = new Date(a.data_fim);
      const hoje = new Date();
      return dataFim < hoje && a.progresso < 100;
    }).length;

    return {
      total,
      concluidas,
      emAndamento,
      naoIniciadas,
      criticas,
      atrasadas,
      percentualConclusao: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    };
  }, [atividades]);

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    // Dados
    atividades: atividadesFiltradas,
    todasAtividades: atividades,
    dependencias,
    caminhoCritico,
    tasks,

    // UI State
    visualizacao,
    escala,
    viewMode,
    filtros,

    // Loading
    isLoading,
    isCalculandoCPM,
    erro,

    // Estatísticas
    estatisticas,

    // Actions - CRUD Atividades
    adicionarAtividade,
    atualizarAtividade,
    excluirAtividade,

    // Actions - CRUD Dependências
    adicionarDependencia,
    atualizarDependencia,
    excluirDependencia,

    // Actions - Caminho Crítico
    calcularCaminhoCritico,

    // Actions - UI
    setVisualizacao,
    setEscala,
    setFiltros,
    limparFiltros,

    // Handlers
    handleTaskChange,
    handleTaskDelete,
  };
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Mapeia tipo de atividade para tipo do Gantt
 */
const mapTipoToGantt = (tipo: string): TipoTarefa => {
  switch (tipo) {
    case 'Marco':
      return TipoTarefa.MARCO;
    case 'Fase':
      return TipoTarefa.PROJETO;
    case 'Tarefa':
    default:
      return TipoTarefa.TAREFA;
  }
};

/**
 * Retorna estilos baseados no status e se é crítica
 */
const getTaskStyles = (atividade: AtividadeMock) => {
  let backgroundColor = '#3b82f6'; // Azul padrão
  let progressColor = '#1e40af';

  // Cor baseada em status
  switch (atividade.status) {
    case 'Não Iniciada':
      backgroundColor = '#9ca3af'; // Cinza
      progressColor = '#6b7280';
      break;
    case 'Em Andamento':
      backgroundColor = '#3b82f6'; // Azul
      progressColor = '#1e40af';
      break;
    case 'Concluída':
      backgroundColor = '#10b981'; // Verde
      progressColor = '#059669';
      break;
    case 'Paralisada':
      backgroundColor = '#f59e0b'; // Laranja
      progressColor = '#d97706';
      break;
    case 'Atrasada':
      backgroundColor = '#ef4444'; // Vermelho
      progressColor = '#dc2626';
      break;
  }

  // Se for crítica, usa vermelho intenso
  if (atividade.e_critica) {
    backgroundColor = '#dc2626';
    progressColor = '#991b1b';
  }

  return {
    backgroundColor,
    backgroundSelectedColor: progressColor,
    progressColor,
    progressSelectedColor: '#7f1d1d',
  };
};

