/**
 * Testes para cronogramaService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as cronogramaService from '../cronogramaService';
import { TipoDependencia } from '../../types/cronograma';

beforeEach(() => {
  cronogramaService.resetMockData();
});

describe('CronogramaService', () => {
  // ========================================================================
  // ATIVIDADES
  // ========================================================================

  describe('getAtividades', () => {
    it('deve retornar atividades do projeto', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');

      expect(atividades).toBeInstanceOf(Array);
      expect(atividades.length).toBeGreaterThan(0);
      expect(atividades[0]).toHaveProperty('id');
      expect(atividades[0]).toHaveProperty('nome');
      expect(atividades[0].projeto_id).toBe('proj-1');
    });

    it('deve filtrar por projeto_id', async () => {
      const atividades = await cronogramaService.getAtividades('proj-999');

      expect(atividades).toEqual([]);
    });
  });

  describe('createAtividade', () => {
    it('deve criar nova atividade', async () => {
      const novaAtividade = {
        projeto_id: 'proj-1',
        nome: 'Atividade Teste',
        tipo: 'Tarefa' as const,
        data_inicio: '2024-12-01',
        data_fim: '2024-12-05',
        duracao_dias: 5,
        progresso: 0,
        status: 'Não Iniciada',
      };

      const resultado = await cronogramaService.createAtividade(novaAtividade);

      expect(resultado).toHaveProperty('id');
      expect(resultado.nome).toBe('Atividade Teste');
      expect(resultado).toHaveProperty('created_at');
      expect(resultado).toHaveProperty('updated_at');
    });

    it('deve gerar ID único', async () => {
      const atividade1 = await cronogramaService.createAtividade({
        projeto_id: 'proj-1',
        nome: 'Atividade 1',
        tipo: 'Tarefa' as const,
        data_inicio: '2024-12-01',
        data_fim: '2024-12-05',
        duracao_dias: 5,
        progresso: 0,
        status: 'Não Iniciada',
      });

      const atividade2 = await cronogramaService.createAtividade({
        projeto_id: 'proj-1',
        nome: 'Atividade 2',
        tipo: 'Tarefa' as const,
        data_inicio: '2024-12-01',
        data_fim: '2024-12-05',
        duracao_dias: 5,
        progresso: 0,
        status: 'Não Iniciada',
      });

      expect(atividade1.id).not.toBe(atividade2.id);
    });
  });

  describe('updateAtividade', () => {
    it('deve atualizar atividade existente', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');
      const atividadeOriginal = atividades[0];

      const atualizada = await cronogramaService.updateAtividade(atividadeOriginal.id, {
        progresso: 75,
        status: 'Em Andamento',
      });

      expect(atualizada.progresso).toBe(75);
      expect(atualizada.status).toBe('Em Andamento');
      expect(atualizada.id).toBe(atividadeOriginal.id);
      expect(atualizada.updated_at).not.toBe(atividadeOriginal.updated_at);
    });

    it('deve lançar erro para ID inexistente', async () => {
      await expect(
        cronogramaService.updateAtividade('id-inexistente', { progresso: 50 })
      ).rejects.toThrow('não encontrada');
    });
  });

  describe('deleteAtividade', () => {
    it('deve excluir atividade', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');
      const atividadeParaExcluir = atividades[0];

      await cronogramaService.deleteAtividade(atividadeParaExcluir.id);

      const atividadesAposExclusao = await cronogramaService.getAtividades('proj-1');
      expect(atividadesAposExclusao.find((a) => a.id === atividadeParaExcluir.id)).toBeUndefined();
    });

    it('deve remover dependências relacionadas ao excluir atividade', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');
      const atividadeParaExcluir = atividades[0];

      // Cria dependência
      await cronogramaService.createDependencia({
        atividade_origem_id: atividadeParaExcluir.id,
        atividade_destino_id: atividades[1].id,
        tipo: TipoDependencia.FS,
      });

      const dependenciasAntes = await cronogramaService.getDependencias('proj-1');
      const temDependencia = dependenciasAntes.some(
        (d) => d.atividade_origem_id === atividadeParaExcluir.id
      );
      expect(temDependencia).toBe(true);

      // Exclui atividade
      await cronogramaService.deleteAtividade(atividadeParaExcluir.id);

      // Verifica que dependências foram removidas
      const dependenciasDepois = await cronogramaService.getDependencias('proj-1');
      const temDependenciaDepois = dependenciasDepois.some(
        (d) =>
          d.atividade_origem_id === atividadeParaExcluir.id ||
          d.atividade_destino_id === atividadeParaExcluir.id
      );
      expect(temDependenciaDepois).toBe(false);
    });
  });

  // ========================================================================
  // DEPENDÊNCIAS
  // ========================================================================

  describe('getDependencias', () => {
    it('deve retornar dependências do projeto', async () => {
      const dependencias = await cronogramaService.getDependencias('proj-1');

      expect(dependencias).toBeInstanceOf(Array);
      expect(dependencias.length).toBeGreaterThan(0);
      expect(dependencias[0]).toHaveProperty('atividade_origem_id');
      expect(dependencias[0]).toHaveProperty('atividade_destino_id');
      expect(dependencias[0]).toHaveProperty('tipo');
    });
  });

  describe('createDependencia', () => {
    it('deve criar nova dependência', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');

      const novaDependencia = await cronogramaService.createDependencia({
        atividade_origem_id: atividades[0].id,
        atividade_destino_id: atividades[1].id,
        tipo: TipoDependencia.SS,
        lag_dias: 2,
      });

      expect(novaDependencia).toHaveProperty('id');
      expect(novaDependencia.tipo).toBe(TipoDependencia.SS);
      expect(novaDependencia.lag_dias).toBe(2);
    });

    it('deve impedir auto-dependência', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');

      await expect(
        cronogramaService.createDependencia({
          atividade_origem_id: atividades[0].id,
          atividade_destino_id: atividades[0].id,
          tipo: TipoDependencia.FS,
        })
      ).rejects.toThrow('não pode depender de si mesma');
    });

    it('deve impedir dependência duplicada', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');

      await cronogramaService.createDependencia({
        atividade_origem_id: atividades[0].id,
        atividade_destino_id: atividades[1].id,
        tipo: TipoDependencia.FS,
      });

      await expect(
        cronogramaService.createDependencia({
          atividade_origem_id: atividades[0].id,
          atividade_destino_id: atividades[1].id,
          tipo: TipoDependencia.FS,
        })
      ).rejects.toThrow('já existe');
    });
  });

  // ========================================================================
  // CAMINHO CRÍTICO
  // ========================================================================

  describe('calcularCaminhoCritico', () => {
    it('deve calcular caminho crítico', async () => {
      const resultado = await cronogramaService.calcularCaminhoCritico('proj-1');

      expect(resultado).toHaveProperty('atividades_criticas');
      expect(resultado).toHaveProperty('duracao_total_projeto');
      expect(resultado).toHaveProperty('folgas');
      expect(resultado).toHaveProperty('calculado_em');

      expect(resultado.atividades_criticas.length).toBeGreaterThan(0);
      expect(resultado.duracao_total_projeto).toBeGreaterThan(0);
    });

    it('deve retornar folgas para todas as atividades', async () => {
      const atividades = await cronogramaService.getAtividades('proj-1');
      const resultado = await cronogramaService.calcularCaminhoCritico('proj-1');

      atividades.forEach((atividade) => {
        expect(resultado.folgas[atividade.id]).toBeDefined();
        expect(resultado.folgas[atividade.id]).toHaveProperty('early_start');
        expect(resultado.folgas[atividade.id]).toHaveProperty('early_finish');
        expect(resultado.folgas[atividade.id]).toHaveProperty('folga_total');
        expect(resultado.folgas[atividade.id]).toHaveProperty('e_critica');
      });
    });

    it('atividades críticas devem ter folga zero ou próxima', async () => {
      const resultado = await cronogramaService.calcularCaminhoCritico('proj-1');

      resultado.atividades_criticas.forEach((atividadeId) => {
        const folga = resultado.folgas[atividadeId];
        expect(folga.e_critica).toBe(true);
        expect(folga.folga_total).toBeLessThanOrEqual(0.1);
      });
    });

    it('deve retornar estrutura vazia para projeto sem atividades', async () => {
      const resultado = await cronogramaService.calcularCaminhoCritico('proj-vazio');

      expect(resultado.atividades_criticas).toEqual([]);
      expect(resultado.duracao_total_projeto).toBe(0);
      expect(resultado.folgas).toEqual({});
    });
  });
});

