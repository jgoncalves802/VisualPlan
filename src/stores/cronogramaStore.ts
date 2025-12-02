/**
 * Store Zustand para gerenciar estado do Cronograma
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CronogramaState,
  VisualizacaoCronograma,
  EscalaTempo,
  FiltrosCronograma,
  AtividadeMock,
  DependenciaAtividade,
  TipoDependencia,
  UnidadeTempo,
  ConfiguracoesProjeto,
  FormatoData,
  CalendarioProjeto,
  DiaTrabalho,
} from '../types/cronograma';
import * as cronogramaService from '../services/cronogramaService';

const initialFilters: FiltrosCronograma = {
  busca: '',
  status: [],
  responsavel_id: undefined,
  setor_id: undefined,
  apenas_criticas: false,
  apenas_atrasadas: false,
};

/**
 * Calendários padrão do sistema
 */
const calendarioPadrao5x8: CalendarioProjeto = {
  id: 'cal-padrao-5x8',
  nome: 'Padrão 5x8 (Seg-Sex, 8h/dia)',
  descricao: 'Calendário padrão brasileiro: segunda a sexta, 8h às 12h e 13h às 17h',
  dias_trabalho: [
    DiaTrabalho.SEGUNDA,
    DiaTrabalho.TERCA,
    DiaTrabalho.QUARTA,
    DiaTrabalho.QUINTA,
    DiaTrabalho.SEXTA,
  ],
  horas_por_dia: 8,
  horario_inicio: '08:00',
  horario_almoco_inicio: '12:00',
  horario_almoco_fim: '13:00',
  horario_fim: '17:00',
  excecoes: [],
  is_padrao: true,
};

const calendarioIntensivo6x8: CalendarioProjeto = {
  id: 'cal-intensivo-6x8',
  nome: 'Intensivo 6x8 (Seg-Sáb, 8h/dia)',
  descricao: 'Calendário intensivo: segunda a sábado, 8h às 12h e 13h às 17h',
  dias_trabalho: [
    DiaTrabalho.SEGUNDA,
    DiaTrabalho.TERCA,
    DiaTrabalho.QUARTA,
    DiaTrabalho.QUINTA,
    DiaTrabalho.SEXTA,
    DiaTrabalho.SABADO,
  ],
  horas_por_dia: 8,
  horario_inicio: '08:00',
  horario_almoco_inicio: '12:00',
  horario_almoco_fim: '13:00',
  horario_fim: '17:00',
  excecoes: [],
  is_padrao: false,
};

const calendario24x7: CalendarioProjeto = {
  id: 'cal-continuo-24x7',
  nome: 'Contínuo 24x7 (7 dias, 24h/dia)',
  descricao: 'Calendário contínuo: todos os dias da semana, 24 horas',
  dias_trabalho: [
    DiaTrabalho.DOMINGO,
    DiaTrabalho.SEGUNDA,
    DiaTrabalho.TERCA,
    DiaTrabalho.QUARTA,
    DiaTrabalho.QUINTA,
    DiaTrabalho.SEXTA,
    DiaTrabalho.SABADO,
  ],
  horas_por_dia: 24,
  horario_inicio: '00:00',
  horario_almoco_inicio: undefined,
  horario_almoco_fim: undefined,
  horario_fim: '23:59',
  excecoes: [],
  is_padrao: false,
};

const initialCalendarios: CalendarioProjeto[] = [
  calendarioPadrao5x8,
  calendarioIntensivo6x8,
  calendario24x7,
];

const initialConfiguracoes: ConfiguracoesProjeto = {
  // Formatos de Data (padrões semelhantes ao MS Project)
  formato_data_tabela: FormatoData.SEMANA_DIA_MES_ANO,      // qua 28/01/09
  formato_data_gantt: FormatoData.DIA_MES,                   // 28/01
  formato_data_tooltip: FormatoData.SEMANA_DIA_MES_EXTENSO,  // qua, 28 de janeiro
  escala_topo: 'week',
  escala_sub: 'day',
  
  // Configurações de Exibição
  mostrar_codigo_atividade: true,
  mostrar_progresso_percentual: true,
  destacar_caminho_critico: true,
  mostrar_grid: true,
  mostrar_linha_hoje: true,
  mostrar_links: true,
  mostrar_rotulo_barras: true,
  mostrar_coluna_predecessores: true,
  mostrar_coluna_sucessores: true,
  expandir_grupos: true,
  largura_grid: 360,
  altura_linha: 32,
  colunas: [
    { field: 'text', label: 'Nome', width: 200, align: 'left', tree: true },
    { field: 'edt', label: 'EDT', width: 80, align: 'left', tree: false },
    { field: 'start_date', label: 'Início', width: 100, align: 'center', tree: false },
    { field: 'end_date', label: 'Fim', width: 100, align: 'center', tree: false },
    { field: 'duration', label: 'Duração', width: 80, align: 'center', tree: false },
    { field: 'progress', label: 'Progresso', width: 80, align: 'center', tree: false },
  ],
  
  // Configurações de Comportamento
  permitir_edicao_drag: true,
  auto_calcular_progresso: false,
  habilitar_auto_scheduling: true,
  
  // ========================================================================
  // EXTENSÕES DHTMLX GANTT (Novos Recursos)
  // ========================================================================
  
  // Extensões Principais
  habilitar_quick_info: true,             // Quick Info ao clicar em tarefa
  habilitar_tooltip: true,                // Tooltip ao passar mouse
  habilitar_critical_path: true,          // Destaque do caminho crítico
  habilitar_keyboard_navigation: true,    // Navegação por teclado
  habilitar_undo_redo: true,              // Desfazer/Refazer ações
  habilitar_multiselect: true,            // Seleção múltipla de tarefas
  
  // Funcionalidades Avançadas
  habilitar_edicao_inline: true,          // Edição inline na grid
  mostrar_colunas_custo_valor: true,      // Mostrar colunas de custo e valores à direita
  habilitar_drag_timeline: false,         // Arrastar timeline com Ctrl (desabilitado por padrão)
  habilitar_markers: true,                // Marcadores verticais (hoje, etc)
  habilitar_baselines: false,             // Linhas de base (requer campo planned_start/end)
  habilitar_deadlines: false,             // Marcadores de deadline (requer campo deadline)
  habilitar_split_tasks: false,           // Tarefas divididas
  habilitar_grouping: true,               // Agrupamento de tarefas
  habilitar_resources: true,              // Gerenciamento de recursos
  habilitar_constraints: true,            // Restrições (ASAP, ALAP, etc)
  habilitar_wbs_codes: true,              // Códigos WBS automáticos
  
  // Configurações de Cores
  cor_tarefa_normal: '#3b82f6',    // blue-500
  cor_tarefa_critica: '#dc2626',   // red-600
  cor_tarefa_concluida: '#10b981', // green-500
  cor_marco: '#8b5cf6',            // violet-500
  cor_fase: '#f59e0b',             // amber-500
};

export const useCronogramaStore = create<CronogramaState>()(
  persist(
    (set, get) => ({
      // ========================================================================
      // ESTADO INICIAL
      // ========================================================================
      atividades: [],
      dependencias: [],
      caminhoCritico: null,
      visualizacao: VisualizacaoCronograma.GANTT,
      escala: EscalaTempo.DIA,
      filtros: initialFilters,
      unidadeTempoPadrao: UnidadeTempo.DIAS,
      configuracoes: initialConfiguracoes,
      calendarios: initialCalendarios,
      calendario_padrao: 'cal-padrao-5x8',
      isLoading: false,
      isCalculandoCPM: false,
      erro: null,

      // ========================================================================
      // ACTIONS - CRUD ATIVIDADES
      // ========================================================================

      /**
       * Carrega atividades de um projeto
       */
      carregarAtividades: async (projetoId: string) => {
        set({ isLoading: true, erro: null });

        try {
          const atividades = await cronogramaService.getAtividades(projetoId);
          
          // Detecta automaticamente se deve usar HORAS
          const atividadesComHoras = atividades.filter((a) => a.unidade_tempo === UnidadeTempo.HORAS);
          const usarHoras = atividadesComHoras.length > atividades.length / 2; // Mais de 50% em horas
          
          // Ajusta escala e unidade automaticamente
          if (usarHoras) {
            set({ 
              atividades, 
              isLoading: false,
              escala: EscalaTempo.HORA,
              unidadeTempoPadrao: UnidadeTempo.HORAS,
            });
          } else {
            set({ atividades, isLoading: false });
          }
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao carregar atividades';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Adiciona uma nova atividade
       */
      adicionarAtividade: async (atividade) => {
        set({ isLoading: true, erro: null });

        try {
          const novaAtividade = await cronogramaService.createAtividade(atividade);
          set((state) => ({
            atividades: [...state.atividades, novaAtividade],
            isLoading: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao adicionar atividade';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Atualiza uma atividade existente
       */
      atualizarAtividade: async (id: string, dados: Partial<AtividadeMock>) => {
        set({ isLoading: true, erro: null });

        try {
          const atividadeAtualizada = await cronogramaService.updateAtividade(id, dados);
          set((state) => ({
            atividades: state.atividades.map((a) =>
              a.id === id ? atividadeAtualizada : a
            ),
            isLoading: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar atividade';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Exclui uma atividade
       */
      excluirAtividade: async (id: string) => {
        set({ isLoading: true, erro: null });

        try {
          await cronogramaService.deleteAtividade(id);
          set((state) => ({
            atividades: state.atividades.filter((a) => a.id !== id),
            dependencias: state.dependencias.filter(
              (d) => d.atividade_origem_id !== id && d.atividade_destino_id !== id
            ),
            isLoading: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao excluir atividade';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      // ========================================================================
      // ACTIONS - CRUD DEPENDÊNCIAS
      // ========================================================================

      /**
       * Carrega dependências de um projeto
       */
      carregarDependencias: async (projetoId: string) => {
        set({ isLoading: true, erro: null });

        try {
          const dependencias = await cronogramaService.getDependencias(projetoId);
          set({ dependencias, isLoading: false });
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao carregar dependências';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Adiciona uma nova dependência
       */
      adicionarDependencia: async (dependencia) => {
        set({ isLoading: true, erro: null });

        try {
          const novaDependencia = await cronogramaService.createDependencia(dependencia);
          set((state) => ({
            dependencias: [...state.dependencias, novaDependencia],
            isLoading: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao adicionar dependência';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Atualiza uma dependência existente (tipo e lag)
       */
      atualizarDependencia: async (id: string, updates: { tipo?: TipoDependencia; lag_dias?: number }) => {
        set({ isLoading: true, erro: null });

        try {
          // Atualiza localmente primeiro para resposta imediata
          set((state) => ({
            dependencias: state.dependencias.map((d) =>
              d.id === id
                ? {
                    ...d,
                    tipo: updates.tipo ?? d.tipo,
                    lag_dias: updates.lag_dias ?? d.lag_dias,
                  }
                : d
            ),
            isLoading: false,
          }));
          
          // TODO: Persistir no backend quando service estiver disponível
          // await cronogramaService.updateDependencia(id, updates);
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao atualizar dependência';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      /**
       * Exclui uma dependência
       */
      excluirDependencia: async (id: string) => {
        set({ isLoading: true, erro: null });

        try {
          await cronogramaService.deleteDependencia(id);
          set((state) => ({
            dependencias: state.dependencias.filter((d) => d.id !== id),
            isLoading: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao excluir dependência';
          set({ erro: mensagem, isLoading: false });
          throw error;
        }
      },

      // ========================================================================
      // ACTIONS - CAMINHO CRÍTICO
      // ========================================================================

      /**
       * Calcula o caminho crítico do projeto
       */
      calcularCaminhoCritico: async (projetoId: string) => {
        set({ isCalculandoCPM: true, erro: null });

        try {
          const caminhoCritico = await cronogramaService.calcularCaminhoCritico(projetoId);
          
          // Atualiza flags de atividades críticas
          set((state) => ({
            caminhoCritico,
            atividades: state.atividades.map((a) => ({
              ...a,
              e_critica: caminhoCritico.atividades_criticas.includes(a.id),
              folga_total: caminhoCritico.folgas[a.id]?.folga_total ?? a.folga_total,
            })),
            isCalculandoCPM: false,
          }));
        } catch (error) {
          const mensagem = error instanceof Error ? error.message : 'Erro ao calcular caminho crítico';
          set({ erro: mensagem, isCalculandoCPM: false });
          throw error;
        }
      },

      // ========================================================================
      // ACTIONS - UI
      // ========================================================================

      /**
       * Define o modo de visualização
       */
      setVisualizacao: (visualizacao: VisualizacaoCronograma) => {
        set({ visualizacao });
      },

      /**
       * Define a escala de tempo
       */
      setEscala: (escala: EscalaTempo) => {
        set({ escala });
      },

      /**
       * Define filtros (merge com filtros existentes)
       */
      setFiltros: (filtros: Partial<FiltrosCronograma>) => {
        set((state) => ({
          filtros: { ...state.filtros, ...filtros },
        }));
      },

      /**
       * Limpa todos os filtros
       */
      limparFiltros: () => {
        set({ filtros: initialFilters });
      },

      /**
       * Define a unidade de tempo padrão (DIAS ou HORAS)
       */
      setUnidadeTempoPadrao: (unidade: UnidadeTempo) => {
        set({ unidadeTempoPadrao: unidade });
      },

      /**
       * Atualiza configurações do projeto (merge com configurações existentes)
       */
      setConfiguracoes: (configuracoes: Partial<ConfiguracoesProjeto>) => {
        set((state) => ({
          configuracoes: { ...state.configuracoes, ...configuracoes },
        }));
      },

      // ========================================================================
      // ACTIONS - CALENDÁRIOS
      // ========================================================================

      /**
       * Adiciona um novo calendário
       */
      adicionarCalendario: (calendario: Omit<CalendarioProjeto, 'id'>) => {
        const novoCalendario: CalendarioProjeto = {
          ...calendario,
          id: `cal-${Date.now()}`,
        };
        set((state) => ({
          calendarios: [...state.calendarios, novoCalendario],
        }));
      },

      /**
       * Atualiza um calendário existente
       */
      atualizarCalendario: (id: string, dados: Partial<CalendarioProjeto>) => {
        set((state) => ({
          calendarios: state.calendarios.map((c) =>
            c.id === id ? { ...c, ...dados } : c
          ),
        }));
      },

      /**
       * Remove um calendário
       */
      removerCalendario: (id: string) => {
        set((state) => {
          // Não permite remover o calendário padrão
          const calendario = state.calendarios.find((c) => c.id === id);
          if (calendario?.is_padrao) {
            throw new Error('Não é possível remover o calendário padrão');
          }

          // Se o calendário removido era o padrão do projeto, define outro como padrão
          const novoCalendarioPadrao =
            state.calendario_padrao === id
              ? state.calendarios.find((c) => c.id !== id)?.id
              : state.calendario_padrao;

          return {
            calendarios: state.calendarios.filter((c) => c.id !== id),
            calendario_padrao: novoCalendarioPadrao,
          };
        });
      },

      /**
       * Define o calendário padrão do projeto
       */
      setCalendarioPadrao: (calendarioId: string) => {
        set({ calendario_padrao: calendarioId });
      },

      // ========================================================================
      // ACTIONS - RESET
      // ========================================================================

      /**
       * Reseta o estado do store
       */
      reset: () => {
        set({
          atividades: [],
          dependencias: [],
          caminhoCritico: null,
          visualizacao: VisualizacaoCronograma.GANTT,
          escala: EscalaTempo.DIA,
          filtros: initialFilters,
          unidadeTempoPadrao: UnidadeTempo.DIAS,
          configuracoes: initialConfiguracoes,
          calendarios: initialCalendarios,
          calendario_padrao: 'cal-padrao-5x8',
          isLoading: false,
          isCalculandoCPM: false,
          erro: null,
        });
      },
    }),
    {
      name: 'cronograma-storage', // Nome no localStorage
      partialize: (state) => ({
        // Persiste apenas preferências de UI
        visualizacao: state.visualizacao,
        escala: state.escala,
        filtros: state.filtros,
        unidadeTempoPadrao: state.unidadeTempoPadrao,
        configuracoes: state.configuracoes, // Persiste configurações do usuário
        calendarios: state.calendarios, // Persiste calendários customizados
        calendario_padrao: state.calendario_padrao, // Persiste calendário padrão do projeto
      }),
    }
  )
);

