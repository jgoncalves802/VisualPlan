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
  UnidadeTempo,
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
          set({ atividades, isLoading: false });
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
      }),
    }
  )
);

