/**
 * Testes para useCronograma hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCronograma } from '../useCronograma';
import { useCronogramaStore } from '../../stores/cronogramaStore';
import * as cronogramaService from '../../services/cronogramaService';

beforeEach(() => {
  useCronogramaStore.getState().reset();
  cronogramaService.resetMockData();
});

describe('useCronograma', () => {
  it('deve carregar atividades ao montar', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    // Inicialmente deve estar carregando
    expect(result.current.isLoading).toBe(true);

    // Aguarda carregamento
    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    expect(result.current.isLoading).toBe(false);
  });

  it('deve transformar atividades em tasks do Gantt', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.tasks.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const task = result.current.tasks[0];
    expect(task).toHaveProperty('id');
    expect(task).toHaveProperty('name');
    expect(task).toHaveProperty('start');
    expect(task).toHaveProperty('end');
    expect(task).toHaveProperty('progress');
    expect(task).toHaveProperty('type');
    expect(task).toHaveProperty('styles');
  });

  it('deve aplicar filtros nas atividades', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const totalAtividades = result.current.atividades.length;

    // Aplica filtro de busca
    result.current.setFiltros({ busca: 'Planejamento' });

    await waitFor(() => {
      expect(result.current.atividades.length).toBeLessThan(totalAtividades);
      expect(result.current.atividades.some((a) => a.nome.includes('Planejamento'))).toBe(true);
    });
  });

  it('deve calcular estatísticas corretamente', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.estatisticas.total).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const { estatisticas } = result.current;

    expect(estatisticas).toHaveProperty('total');
    expect(estatisticas).toHaveProperty('concluidas');
    expect(estatisticas).toHaveProperty('emAndamento');
    expect(estatisticas).toHaveProperty('naoIniciadas');
    expect(estatisticas).toHaveProperty('criticas');
    expect(estatisticas).toHaveProperty('atrasadas');
    expect(estatisticas).toHaveProperty('percentualConclusao');

    // Soma deve ser igual ao total
    expect(
      estatisticas.concluidas + estatisticas.emAndamento + estatisticas.naoIniciadas
    ).toBe(estatisticas.total);

    // Percentual deve estar entre 0 e 100
    expect(estatisticas.percentualConclusao).toBeGreaterThanOrEqual(0);
    expect(estatisticas.percentualConclusao).toBeLessThanOrEqual(100);
  });

  it('deve filtrar apenas atividades críticas', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Calcula caminho crítico primeiro
    await result.current.calcularCaminhoCritico('proj-1');

    await waitFor(() => {
      expect(result.current.caminhoCritico).not.toBeNull();
    });

    // Aplica filtro de críticas
    result.current.setFiltros({ apenas_criticas: true });

    await waitFor(() => {
      const todasCriticas = result.current.atividades.every((a) => a.e_critica);
      expect(todasCriticas).toBe(true);
    });
  });

  it('deve limpar filtros', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const totalAtividades = result.current.atividades.length;

    // Aplica filtros
    result.current.setFiltros({ busca: 'teste', apenas_criticas: true });

    await waitFor(() => {
      expect(result.current.filtros.busca).toBe('teste');
      expect(result.current.filtros.apenas_criticas).toBe(true);
    });

    // Limpa filtros
    result.current.limparFiltros();

    await waitFor(() => {
      expect(result.current.filtros.busca).toBe('');
      expect(result.current.filtros.apenas_criticas).toBe(false);
      expect(result.current.atividades.length).toBe(totalAtividades);
    });
  });

  it('deve adicionar atividade', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const totalInicial = result.current.atividades.length;

    await result.current.adicionarAtividade({
      projeto_id: 'proj-1',
      nome: 'Nova Atividade Hook',
      tipo: 'Tarefa',
      data_inicio: '2024-12-01',
      data_fim: '2024-12-05',
      duracao_dias: 5,
      progresso: 0,
      status: 'Não Iniciada',
    });

    await waitFor(() => {
      expect(result.current.atividades.length).toBe(totalInicial + 1);
    });
  });

  it('deve atualizar atividade', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const atividadeOriginal = result.current.atividades[0];

    await result.current.atualizarAtividade(atividadeOriginal.id, {
      progresso: 80,
      status: 'Em Andamento',
    });

    await waitFor(() => {
      const atividadeAtualizada = result.current.atividades.find((a) => a.id === atividadeOriginal.id);
      expect(atividadeAtualizada?.progresso).toBe(80);
      expect(atividadeAtualizada?.status).toBe('Em Andamento');
    });
  });

  it('deve excluir atividade', async () => {
    const { result } = renderHook(() => useCronograma('proj-1'));

    await waitFor(
      () => {
        expect(result.current.atividades.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    const totalInicial = result.current.atividades.length;
    const atividadeParaExcluir = result.current.atividades[0];

    await result.current.excluirAtividade(atividadeParaExcluir.id);

    await waitFor(() => {
      expect(result.current.atividades.length).toBe(totalInicial - 1);
      expect(result.current.atividades.find((a) => a.id === atividadeParaExcluir.id)).toBeUndefined();
    });
  });
});

