/**
 * Testes para cronogramaStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCronogramaStore } from '../cronogramaStore';
import { VisualizacaoCronograma, EscalaTempo, TipoDependencia } from '../../types/cronograma';
import * as cronogramaService from '../../services/cronogramaService';

// Reset store antes de cada teste
beforeEach(() => {
  useCronogramaStore.getState().reset();
  cronogramaService.resetMockData();
});

describe('CronogramaStore', () => {
  // ========================================================================
  // ESTADO INICIAL
  // ========================================================================

  it('deve ter estado inicial correto', () => {
    const state = useCronogramaStore.getState();

    expect(state.atividades).toEqual([]);
    expect(state.dependencias).toEqual([]);
    expect(state.caminhoCritico).toBeNull();
    expect(state.visualizacao).toBe(VisualizacaoCronograma.GANTT);
    expect(state.escala).toBe(EscalaTempo.DIA);
    expect(state.isLoading).toBe(false);
    expect(state.isCalculandoCPM).toBe(false);
    expect(state.erro).toBeNull();
  });

  // ========================================================================
  // ATIVIDADES
  // ========================================================================

  it('deve carregar atividades com sucesso', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');

    expect(state.atividades.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
    expect(state.erro).toBeNull();
  });

  it('deve adicionar nova atividade', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    const atividadesIniciais = state.atividades.length;

    await state.adicionarAtividade({
      projeto_id: 'proj-1',
      nome: 'Nova Atividade Teste',
      tipo: 'Tarefa',
      data_inicio: '2024-12-01',
      data_fim: '2024-12-05',
      duracao_dias: 5,
      progresso: 0,
      status: 'Não Iniciada',
    });

    const stateAtualizado = useCronogramaStore.getState();
    expect(stateAtualizado.atividades.length).toBe(atividadesIniciais + 1);

    const novaAtividade = stateAtualizado.atividades.find((a) => a.nome === 'Nova Atividade Teste');
    expect(novaAtividade).toBeDefined();
    expect(novaAtividade?.status).toBe('Não Iniciada');
  });

  it('deve atualizar atividade existente', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    const atividadeParaAtualizar = state.atividades[0];

    await state.atualizarAtividade(atividadeParaAtualizar.id, {
      progresso: 50,
      status: 'Em Andamento',
    });

    const stateAtualizado = useCronogramaStore.getState();
    const atividadeAtualizada = stateAtualizado.atividades.find((a) => a.id === atividadeParaAtualizar.id);

    expect(atividadeAtualizada?.progresso).toBe(50);
    expect(atividadeAtualizada?.status).toBe('Em Andamento');
  });

  it('deve excluir atividade', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    const atividadeParaExcluir = state.atividades[0];
    const atividadesIniciais = state.atividades.length;

    await state.excluirAtividade(atividadeParaExcluir.id);

    const stateAtualizado = useCronogramaStore.getState();
    expect(stateAtualizado.atividades.length).toBe(atividadesIniciais - 1);
    expect(stateAtualizado.atividades.find((a) => a.id === atividadeParaExcluir.id)).toBeUndefined();
  });

  // ========================================================================
  // DEPENDÊNCIAS
  // ========================================================================

  it('deve carregar dependências com sucesso', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarDependencias('proj-1');

    expect(state.dependencias.length).toBeGreaterThan(0);
    expect(state.isLoading).toBe(false);
  });

  it('deve adicionar nova dependência', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    await state.carregarDependencias('proj-1');

    const origem = state.atividades[0];
    const destino = state.atividades[1];
    const dependenciasIniciais = state.dependencias.length;

    await state.adicionarDependencia({
      atividade_origem_id: origem.id,
      atividade_destino_id: destino.id,
      tipo: TipoDependencia.FS,
      lag_dias: 0,
    });

    const stateAtualizado = useCronogramaStore.getState();
    expect(stateAtualizado.dependencias.length).toBe(dependenciasIniciais + 1);

    const novaDependencia = stateAtualizado.dependencias.find(
      (d) => d.atividade_origem_id === origem.id && d.atividade_destino_id === destino.id
    );
    expect(novaDependencia).toBeDefined();
    expect(novaDependencia?.tipo).toBe(TipoDependencia.FS);
  });

  it('deve excluir dependência', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarDependencias('proj-1');
    const dependenciaParaExcluir = state.dependencias[0];
    const dependenciasIniciais = state.dependencias.length;

    await state.excluirDependencia(dependenciaParaExcluir.id);

    const stateAtualizado = useCronogramaStore.getState();
    expect(stateAtualizado.dependencias.length).toBe(dependenciasIniciais - 1);
  });

  // ========================================================================
  // CAMINHO CRÍTICO
  // ========================================================================

  it('deve calcular caminho crítico', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    await state.carregarDependencias('proj-1');
    await state.calcularCaminhoCritico('proj-1');

    const stateAtualizado = useCronogramaStore.getState();
    expect(stateAtualizado.caminhoCritico).not.toBeNull();
    expect(stateAtualizado.caminhoCritico?.atividades_criticas.length).toBeGreaterThan(0);
    expect(stateAtualizado.caminhoCritico?.duracao_total_projeto).toBeGreaterThan(0);

    // Verifica se as atividades foram marcadas como críticas
    const atividadesCriticas = stateAtualizado.atividades.filter((a) => a.e_critica);
    expect(atividadesCriticas.length).toBe(stateAtualizado.caminhoCritico?.atividades_criticas.length);
  });

  // ========================================================================
  // UI STATE
  // ========================================================================

  it('deve alterar visualização', () => {
    const state = useCronogramaStore.getState();

    expect(state.visualizacao).toBe(VisualizacaoCronograma.GANTT);

    state.setVisualizacao(VisualizacaoCronograma.LISTA);
    const stateAtualizado = useCronogramaStore.getState();

    expect(stateAtualizado.visualizacao).toBe(VisualizacaoCronograma.LISTA);
  });

  it('deve alterar escala', () => {
    const state = useCronogramaStore.getState();

    expect(state.escala).toBe(EscalaTempo.DIA);

    state.setEscala(EscalaTempo.SEMANA);
    const stateAtualizado = useCronogramaStore.getState();

    expect(stateAtualizado.escala).toBe(EscalaTempo.SEMANA);
  });

  it('deve configurar filtros', () => {
    const state = useCronogramaStore.getState();

    state.setFiltros({ busca: 'teste', apenas_criticas: true });
    const stateAtualizado = useCronogramaStore.getState();

    expect(stateAtualizado.filtros.busca).toBe('teste');
    expect(stateAtualizado.filtros.apenas_criticas).toBe(true);
  });

  it('deve limpar filtros', () => {
    const state = useCronogramaStore.getState();

    state.setFiltros({ busca: 'teste', apenas_criticas: true });
    state.limparFiltros();

    const stateAtualizado = useCronogramaStore.getState();

    expect(stateAtualizado.filtros.busca).toBe('');
    expect(stateAtualizado.filtros.apenas_criticas).toBe(false);
  });

  // ========================================================================
  // RESET
  // ========================================================================

  it('deve resetar o estado', async () => {
    const state = useCronogramaStore.getState();

    await state.carregarAtividades('proj-1');
    state.setVisualizacao(VisualizacaoCronograma.LISTA);
    state.setFiltros({ busca: 'teste' });

    state.reset();

    const stateResetado = useCronogramaStore.getState();

    expect(stateResetado.atividades).toEqual([]);
    expect(stateResetado.visualizacao).toBe(VisualizacaoCronograma.GANTT);
    expect(stateResetado.filtros.busca).toBe('');
  });
});

