/**
 * Store Zustand para LPS (Last Planner System / Planejamento Puxado)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AtividadeLPS,
  RestricaoLPS,
  AnotacaoLPS,
  WBSLPS,
  PlanejamentoLPS,
  StatusAtividadeLPS,
  TipoRestricao,
  TipoRestricaoDetalhado,
  RestricaoHistorico,
  RestricaoEvidencia,
  RestricaoAndamento,
  AtividadeHistoricoConclusao,
} from '../types/lps';

interface LPSState {
  // Estado
  planejamentoAtual: PlanejamentoLPS | null;
  atividades: AtividadeLPS[];
  restricoes: RestricaoLPS[];
  anotacoes: AnotacaoLPS[];
  wbsList: WBSLPS[];
  dataInicio: Date;
  dataFim: Date;
  loading: boolean;
  error: string | null;

  // Ações
  setPlanejamentoAtual: (planejamento: PlanejamentoLPS | null) => void;
  setPeriodo: (dataInicio: Date, dataFim: Date) => void;
  setWbsList: (wbsList: WBSLPS[]) => void;
  addAtividade: (atividade: Omit<AtividadeLPS, 'id'>) => void;
  updateAtividade: (id: string, atividade: Partial<AtividadeLPS>) => void;
  deleteAtividade: (id: string) => void;
  moveAtividade: (id: string, novaData: Date) => void;
  addRestricao: (restricao: Omit<RestricaoLPS, 'id'>) => void;
  updateRestricao: (id: string, restricao: Partial<RestricaoLPS>) => void;
  deleteRestricao: (id: string) => void;
  addAnotacao: (anotacao: Omit<AnotacaoLPS, 'id'>) => void;
  updateAnotacao: (id: string, anotacao: Partial<AnotacaoLPS>) => void;
  deleteAnotacao: (id: string) => void;
  reagendarRestricao: (id: string, novaData: Date, motivo?: string, impacto?: string) => void;
  getRestricoesPorPeriodo: (dataInicio: Date, dataFim: Date) => RestricaoLPS[];
  getRestricoesAtrasadas: () => RestricaoLPS[];
  getRestricoesCriticas: () => RestricaoLPS[];
  addEvidencia: (restricaoId: string, evidencia: Omit<RestricaoEvidencia, 'id' | 'restricao_id'>) => void;
  deleteEvidencia: (restricaoId: string, evidenciaId: string) => void;
  addAndamento: (restricaoId: string, andamento: Omit<RestricaoAndamento, 'id' | 'restricao_id'>) => void;
  concluirRestricao: (id: string, userId: string) => boolean; // Retorna true se pode concluir, false caso contrário
  podeConcluirRestricao: (restricaoId: string, userId: string) => boolean;
  syncComCronograma: (projetoId: string) => Promise<void>;
  syncComRecursos: (projetoId: string) => Promise<void>;
  concluirAtividade: (id: string, userId: string, motivo?: string) => void;
  atualizarStatusAtividadeComHistorico: (id: string, novoStatus: StatusAtividadeLPS, userId: string, motivo?: string) => void;
}

// Gerar ID único
const generateId = (): string => {
  return `lps-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useLPSStore = create<LPSState>()(
  persist(
    (set, get) => {
      // Helper para converter strings em Date
      const parseDate = (date: any): Date => {
        if (!date) return new Date();
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return new Date();
      };

      // Helper para converter array de objetos com datas
      const parseAtividades = (atividades: any[]): AtividadeLPS[] => {
        return atividades.map((atividade) => ({
          ...atividade,
          data_inicio: parseDate(atividade.data_inicio),
          data_fim: parseDate(atividade.data_fim),
          data_atribuida: atividade.data_atribuida ? parseDate(atividade.data_atribuida) : undefined,
        }));
      };

      // Helper para converter array de restrições com datas
      const parseRestricoes = (restricoes: any[]): RestricaoLPS[] => {
        return restricoes.map((restricao) => ({
          ...restricao,
          data_conclusao: restricao.data_conclusao ? parseDate(restricao.data_conclusao) : undefined,
          data_conclusao_planejada: restricao.data_conclusao_planejada
            ? parseDate(restricao.data_conclusao_planejada)
            : undefined,
          data_criacao: parseDate(restricao.data_criacao || new Date()),
          prazo_resolucao: restricao.prazo_resolucao ? parseDate(restricao.prazo_resolucao) : undefined,
          data_inicio_latencia: restricao.data_inicio_latencia ? parseDate(restricao.data_inicio_latencia) : undefined,
          data_fim_latencia: restricao.data_fim_latencia ? parseDate(restricao.data_fim_latencia) : undefined,
          historico: restricao.historico
            ? restricao.historico.map((h: any) => ({
                ...h,
                data_anterior: parseDate(h.data_anterior),
                data_nova: parseDate(h.data_nova),
                data_reagendamento: parseDate(h.data_reagendamento),
              }))
            : [],
          evidencias: restricao.evidencias
            ? restricao.evidencias.map((e: any) => ({
                ...e,
                data_upload: parseDate(e.data_upload),
              }))
            : [],
          andamento: restricao.andamento
            ? restricao.andamento.map((a: any) => ({
                ...a,
                data: parseDate(a.data),
              }))
            : [],
        }));
      };

      // Helper para converter array de anotações com datas
      const parseAnotacoes = (anotacoes: any[]): AnotacaoLPS[] => {
        return anotacoes.map((anotacao) => ({
          ...anotacao,
          data_criacao: parseDate(anotacao.data_criacao),
        }));
      };

      return {
        // Estado inicial
        planejamentoAtual: null,
        atividades: [],
        restricoes: [],
        anotacoes: [],
        wbsList: [],
        dataInicio: new Date(2024, 10, 10), // 10/11/2024
        dataFim: new Date(2024, 11, 1), // 01/12/2024
        loading: false,
        error: null,

      // Ações
      setPlanejamentoAtual: (planejamento) => {
        set({
          planejamentoAtual: planejamento,
          atividades: planejamento?.atividades ? parseAtividades(planejamento.atividades) : [],
          restricoes: planejamento?.restricoes ? parseRestricoes(planejamento.restricoes) : [],
          anotacoes: planejamento?.anotacoes ? parseAnotacoes(planejamento.anotacoes) : [],
          dataInicio: planejamento?.data_inicio ? parseDate(planejamento.data_inicio) : new Date(2024, 10, 10),
          dataFim: planejamento?.data_fim ? parseDate(planejamento.data_fim) : new Date(2024, 11, 1),
        });
      },

      setPeriodo: (dataInicio, dataFim) => {
        set({
          dataInicio: parseDate(dataInicio),
          dataFim: parseDate(dataFim),
        });
      },

      setWbsList: (wbsList) => {
        set({ wbsList });
      },

      addAtividade: (atividade) => {
        const novaAtividade: AtividadeLPS = {
          ...atividade,
          id: generateId(),
          data_inicio: parseDate(atividade.data_inicio),
          data_fim: parseDate(atividade.data_fim),
          data_atribuida: atividade.data_atribuida ? parseDate(atividade.data_atribuida) : undefined,
        };
        set((state) => ({
          atividades: [...state.atividades, novaAtividade],
        }));
      },

      updateAtividade: (id, atividade) => {
        set((state) => {
          const atividadeAtualizada = { ...atividade };
          // Converter datas se existirem
          if (atividade.data_inicio) {
            atividadeAtualizada.data_inicio = parseDate(atividade.data_inicio);
          }
          if (atividade.data_fim) {
            atividadeAtualizada.data_fim = parseDate(atividade.data_fim);
          }
          if (atividade.data_atribuida) {
            atividadeAtualizada.data_atribuida = parseDate(atividade.data_atribuida);
          }
          return {
            atividades: state.atividades.map((a) =>
              a.id === id ? { ...a, ...atividadeAtualizada } : a
            ),
          };
        });
      },

      deleteAtividade: (id) => {
        set((state) => ({
          atividades: state.atividades.filter((a) => a.id !== id),
        }));
      },

      moveAtividade: (id, novaData) => {
        set((state) => {
          const dataParsed = parseDate(novaData);
          return {
            atividades: state.atividades.map((a) => {
              if (a.id === id) {
                return {
                  ...a,
                  data_atribuida: dataParsed,
                  data_inicio: dataParsed,
                };
              }
              return a;
            }),
          };
        });
      },

      addRestricao: (restricao) => {
        // Se tipo é PARALISAR_OBRA, aplicar prioridade máxima e iniciar latência
        const tipoDetalhado = restricao.tipo_detalhado;
        const prioridade = tipoDetalhado === TipoRestricaoDetalhado.PARALISAR_OBRA ? 'ALTA' : restricao.prioridade || 'MEDIA';
        const dataInicioLatencia = tipoDetalhado === TipoRestricaoDetalhado.PARALISAR_OBRA ? new Date() : undefined;
        
        const novaRestricao: RestricaoLPS = {
          ...restricao,
          id: generateId(),
          tipo_detalhado: tipoDetalhado,
          prioridade,
          data_criacao: parseDate(restricao.data_criacao || new Date()),
          data_conclusao: restricao.data_conclusao ? parseDate(restricao.data_conclusao) : undefined,
          data_conclusao_planejada: restricao.data_conclusao_planejada
            ? parseDate(restricao.data_conclusao_planejada)
            : undefined,
          prazo_resolucao: restricao.prazo_resolucao ? parseDate(restricao.prazo_resolucao) : undefined,
          data_inicio_latencia: dataInicioLatencia,
          historico: restricao.historico
            ? restricao.historico.map((h: any) => ({
                ...h,
                data_anterior: parseDate(h.data_anterior),
                data_nova: parseDate(h.data_nova),
                data_reagendamento: parseDate(h.data_reagendamento),
              }))
            : [],
          evidencias: restricao.evidencias || [],
          andamento: restricao.andamento || [],
        };
        set((state) => ({
          restricoes: [...state.restricoes, novaRestricao],
        }));
      },

      updateRestricao: (id, restricao) => {
        set((state) => {
          const restricaoAtualizada = { ...restricao };
          const restricaoExistente = state.restricoes.find((r) => r.id === id);
          
          // Converter datas se existirem
          if (restricao.data_conclusao) {
            restricaoAtualizada.data_conclusao = parseDate(restricao.data_conclusao);
          }
          if (restricao.data_conclusao_planejada) {
            restricaoAtualizada.data_conclusao_planejada = parseDate(restricao.data_conclusao_planejada);
          }
          if (restricao.data_criacao) {
            restricaoAtualizada.data_criacao = parseDate(restricao.data_criacao);
          }
          if (restricao.prazo_resolucao) {
            restricaoAtualizada.prazo_resolucao = parseDate(restricao.prazo_resolucao);
          }
          
          // Se restrição está sendo concluída e é do tipo PARALISAR_OBRA, finalizar latência
          if (restricao.status === 'CONCLUIDA' && restricaoExistente?.tipo_detalhado === TipoRestricaoDetalhado.PARALISAR_OBRA) {
            if (restricaoExistente.data_inicio_latencia) {
              const dataFimLatencia = new Date();
              const diasLatencia = Math.ceil(
                (dataFimLatencia.getTime() - restricaoExistente.data_inicio_latencia.getTime()) / (1000 * 60 * 60 * 24)
              );
              restricaoAtualizada.data_fim_latencia = dataFimLatencia;
              restricaoAtualizada.dias_latencia = diasLatencia;
            }
          }
          
          return {
            restricoes: state.restricoes.map((r) =>
              r.id === id ? { ...r, ...restricaoAtualizada } : r
            ),
          };
        });
      },

      deleteRestricao: (id) => {
        set((state) => ({
          restricoes: state.restricoes.filter((r) => r.id !== id),
        }));
      },

      addAnotacao: (anotacao) => {
        const novaAnotacao: AnotacaoLPS = {
          ...anotacao,
          id: generateId(),
          data_criacao: parseDate(anotacao.data_criacao || new Date()),
        };
        set((state) => ({
          anotacoes: [...state.anotacoes, novaAnotacao],
        }));
      },

      updateAnotacao: (id, anotacao) => {
        set((state) => ({
          anotacoes: state.anotacoes.map((a) =>
            a.id === id ? { ...a, ...anotacao } : a
          ),
        }));
      },

      deleteAnotacao: (id) => {
        set((state) => ({
          anotacoes: state.anotacoes.filter((a) => a.id !== id),
        }));
      },

      reagendarRestricao: (id, novaData, motivo, impacto) => {
        set((state) => {
          const restricao = state.restricoes.find((r) => r.id === id);
          if (!restricao) return state;

          const dataAnterior = restricao.data_conclusao_planejada || new Date();
          const novaDataParsed = parseDate(novaData);
          const hoje = new Date();
          hoje.setHours(0, 0, 0, 0);
          const novaDataParsedZero = new Date(novaDataParsed);
          novaDataParsedZero.setHours(0, 0, 0, 0);

          const novoHistorico: RestricaoHistorico = {
            id: generateId(),
            restricao_id: id,
            data_anterior: parseDate(dataAnterior),
            data_nova: novaDataParsed,
            motivo,
            impacto,
            data_reagendamento: new Date(),
            responsavel: restricao.responsavel,
          };

          const historicoAtualizado = [...(restricao.historico || []), novoHistorico];

          return {
            restricoes: state.restricoes.map((r) =>
              r.id === id
                ? {
                    ...r,
                    data_conclusao_planejada: novaDataParsed,
                    historico: historicoAtualizado,
                    status:
                      novaDataParsedZero < hoje
                        ? 'ATRASADA'
                        : r.status === 'CONCLUIDA'
                        ? r.status
                        : 'PENDENTE',
                    impacto_previsto: impacto || r.impacto_previsto,
                  }
                : r
            ),
          };
        });
      },

      getRestricoesPorPeriodo: (dataInicio, dataFim) => {
        const state = get();
        const inicio = parseDate(dataInicio);
        const fim = parseDate(dataFim);
        return state.restricoes.filter((r) => {
          if (!r.data_conclusao_planejada) return false;
          const data = parseDate(r.data_conclusao_planejada);
          return data >= inicio && data <= fim;
        });
      },

      getRestricoesAtrasadas: () => {
        const state = get();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return state.restricoes.filter((r) => {
          if (r.status === 'CONCLUIDA' || r.status === 'CANCELADA') return false;
          if (!r.data_conclusao_planejada) return false;
          const data = parseDate(r.data_conclusao_planejada);
          data.setHours(0, 0, 0, 0);
          return data < hoje;
        });
      },

      getRestricoesCriticas: () => {
        const state = get();
        return state.restricoes.filter(
          (r) =>
            r.prioridade === 'ALTA' &&
            r.status !== 'CONCLUIDA' &&
            r.status !== 'CANCELADA' &&
            r.tipo === TipoRestricao.RESTRICAO
        );
      },

      addEvidencia: (restricaoId, evidencia) => {
        set((state) => {
          const evidenciaCompleta: RestricaoEvidencia = {
            ...evidencia,
            id: generateId(),
            restricao_id: restricaoId,
            data_upload: parseDate(evidencia.data_upload || new Date()),
          };
          return {
            restricoes: state.restricoes.map((r) =>
              r.id === restricaoId
                ? {
                    ...r,
                    evidencias: [...(r.evidencias || []), evidenciaCompleta],
                  }
                : r
            ),
          };
        });
      },

      deleteEvidencia: (restricaoId, evidenciaId) => {
        set((state) => {
          return {
            restricoes: state.restricoes.map((r) =>
              r.id === restricaoId
                ? {
                    ...r,
                    evidencias: (r.evidencias || []).filter((e) => e.id !== evidenciaId),
                  }
                : r
            ),
          };
        });
      },

      addAndamento: (restricaoId, andamento) => {
        set((state) => {
          const andamentoCompleto: RestricaoAndamento = {
            ...andamento,
            id: generateId(),
            restricao_id: restricaoId,
            data: parseDate(andamento.data || new Date()),
          };
          return {
            restricoes: state.restricoes.map((r) =>
              r.id === restricaoId
                ? {
                    ...r,
                    andamento: [...(r.andamento || []), andamentoCompleto],
                  }
                : r
            ),
          };
        });
      },

      podeConcluirRestricao: (restricaoId, userId) => {
        const state = get();
        const restricao = state.restricoes.find((r) => r.id === restricaoId);
        if (!restricao) return false;
        // Apenas quem criou a restrição pode concluí-la
        return restricao.criado_por === userId;
      },

      concluirRestricao: (id, userId) => {
        const state = get();
        const restricao = state.restricoes.find((r) => r.id === id);
        if (!restricao) return false;
        
        // Verificar se o usuário pode concluir
        if (restricao.criado_por !== userId) {
          return false;
        }
        
        // Atualizar restrição como concluída
        const updateData: Partial<RestricaoLPS> = {
          status: 'CONCLUIDA',
          data_conclusao: new Date(),
        };
        
        // Se é do tipo PARALISAR_OBRA, finalizar latência
        if (restricao.tipo_detalhado === TipoRestricaoDetalhado.PARALISAR_OBRA && restricao.data_inicio_latencia) {
          const dataFimLatencia = new Date();
          const diasLatencia = Math.ceil(
            (dataFimLatencia.getTime() - restricao.data_inicio_latencia.getTime()) / (1000 * 60 * 60 * 24)
          );
          updateData.data_fim_latencia = dataFimLatencia;
          updateData.dias_latencia = diasLatencia;
        }
        
        get().updateRestricao(id, updateData);
        return true;
      },

      // Sincronizar com cronograma
      syncComCronograma: async (projetoId: string) => {
        set({ loading: true, error: null });
        try {
          // TODO: Implementar sincronização com dados do cronograma
          // Por enquanto, apenas simular
          console.log('Sincronizando com cronograma do projeto:', projetoId);
          set({ loading: false });
        } catch (error: any) {
          set({ loading: false, error: error.message || 'Erro ao sincronizar com cronograma' });
        }
      },

      // Sincronizar com recursos
      syncComRecursos: async (projetoId: string) => {
        set({ loading: true, error: null });
        try {
          console.log('Sincronizando com recursos do projeto:', projetoId);
          set({ loading: false });
        } catch (error: any) {
          set({ loading: false, error: error.message || 'Erro ao sincronizar com recursos' });
        }
      },

      concluirAtividade: (id, userId, motivo) => {
        const state = get();
        const atividade = state.atividades.find((a) => a.id === id);
        if (!atividade) return;

        const novoHistorico: AtividadeHistoricoConclusao = {
          id: generateId(),
          atividade_id: id,
          status_anterior: atividade.status,
          status_novo: StatusAtividadeLPS.CONCLUIDA,
          data_alteracao: new Date(),
          responsavel_id: userId,
          motivo,
        };

        set((state) => ({
          atividades: state.atividades.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: StatusAtividadeLPS.CONCLUIDA,
                  data_conclusao: new Date(),
                  historico_conclusao: [...(a.historico_conclusao || []), novoHistorico],
                }
              : a
          ),
        }));
      },

      atualizarStatusAtividadeComHistorico: (id, novoStatus, userId, motivo) => {
        const state = get();
        const atividade = state.atividades.find((a) => a.id === id);
        if (!atividade || atividade.status === novoStatus) return;

        const novoHistorico: AtividadeHistoricoConclusao = {
          id: generateId(),
          atividade_id: id,
          status_anterior: atividade.status,
          status_novo: novoStatus,
          data_alteracao: new Date(),
          responsavel_id: userId,
          motivo,
        };

        const atualizacoes: Partial<AtividadeLPS> = {
          status: novoStatus,
          historico_conclusao: [...(atividade.historico_conclusao || []), novoHistorico],
        };

        if (novoStatus === StatusAtividadeLPS.CONCLUIDA) {
          atualizacoes.data_conclusao = new Date();
        }

        set((state) => ({
          atividades: state.atividades.map((a) =>
            a.id === id ? { ...a, ...atualizacoes } : a
          ),
        }));
      },
    };
    },
    {
      name: 'lps-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            atividades: [],
            restricoes: [],
            anotacoes: [],
            dataInicio: new Date(2024, 10, 10).toISOString(),
            dataFim: new Date(2024, 11, 1).toISOString(),
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        atividades: state.atividades,
        restricoes: state.restricoes,
        anotacoes: state.anotacoes,
        dataInicio: state.dataInicio instanceof Date ? state.dataInicio.toISOString() : new Date(2024, 10, 10).toISOString(),
        dataFim: state.dataFim instanceof Date ? state.dataFim.toISOString() : new Date(2024, 11, 1).toISOString(),
      }),
      // Converter strings de volta para Date ao carregar do localStorage
      onRehydrateStorage: (state) => {
        if (!state) return;
        
        // Helper para converter strings em Date
        const parseDateInRehydrate = (date: any): Date => {
          if (!date) return new Date(2024, 10, 10);
          if (date instanceof Date) return date;
          if (typeof date === 'string') {
            const parsed = new Date(date);
            return isNaN(parsed.getTime()) ? new Date(2024, 10, 10) : parsed;
          }
          return new Date(2024, 10, 10);
        };

        // Converter datas do período
        if (state.dataInicio) {
          state.dataInicio = parseDateInRehydrate(state.dataInicio);
        } else {
          state.dataInicio = new Date(2024, 10, 10);
        }
        if (state.dataFim) {
          state.dataFim = parseDateInRehydrate(state.dataFim);
        } else {
          state.dataFim = new Date(2024, 11, 1);
        }

        // Converter datas das atividades
        if (state.atividades && Array.isArray(state.atividades)) {
          state.atividades = state.atividades.map((atividade: any) => ({
            ...atividade,
            data_inicio: parseDateInRehydrate(atividade.data_inicio),
            data_fim: parseDateInRehydrate(atividade.data_fim),
            data_atribuida: atividade.data_atribuida ? parseDateInRehydrate(atividade.data_atribuida) : undefined,
          }));
        }

        // Converter datas das restrições
        if (state.restricoes && Array.isArray(state.restricoes)) {
          state.restricoes = state.restricoes.map((restricao: any) => ({
            ...restricao,
            data_conclusao: restricao.data_conclusao ? parseDateInRehydrate(restricao.data_conclusao) : undefined,
            data_conclusao_planejada: restricao.data_conclusao_planejada
              ? parseDateInRehydrate(restricao.data_conclusao_planejada)
              : undefined,
            data_criacao: parseDateInRehydrate(restricao.data_criacao || new Date()),
            prazo_resolucao: restricao.prazo_resolucao ? parseDateInRehydrate(restricao.prazo_resolucao) : undefined,
            data_inicio_latencia: restricao.data_inicio_latencia ? parseDateInRehydrate(restricao.data_inicio_latencia) : undefined,
            data_fim_latencia: restricao.data_fim_latencia ? parseDateInRehydrate(restricao.data_fim_latencia) : undefined,
            historico: restricao.historico
              ? restricao.historico.map((h: any) => ({
                  ...h,
                  data_anterior: parseDateInRehydrate(h.data_anterior),
                  data_nova: parseDateInRehydrate(h.data_nova),
                  data_reagendamento: parseDateInRehydrate(h.data_reagendamento),
                }))
              : [],
            evidencias: restricao.evidencias
              ? restricao.evidencias.map((e: any) => ({
                  ...e,
                  data_upload: parseDateInRehydrate(e.data_upload),
                }))
              : [],
            andamento: restricao.andamento
              ? restricao.andamento.map((a: any) => ({
                  ...a,
                  data: parseDateInRehydrate(a.data),
                }))
              : [],
          }));
        }

        // Converter datas das anotações
        if (state.anotacoes && Array.isArray(state.anotacoes)) {
          state.anotacoes = state.anotacoes.map((anotacao: any) => ({
            ...anotacao,
            data_criacao: parseDateInRehydrate(anotacao.data_criacao || new Date()),
          }));
        }
      },
    }
  )
);

