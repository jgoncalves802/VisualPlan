/**
 * Service para gerenciar dados do Cronograma
 * Versão mocada para desenvolvimento sem Supabase
 */

import { AtividadeMock, DependenciaAtividade, CaminhoCritico, TipoDependencia } from '../types/cronograma';
import { atividadesMock, dependenciasMock } from '../mocks/cronogramaMocks';

// Simular delay de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Armazenamento em memória (simula banco de dados)
let atividadesDB = [...atividadesMock];
let dependenciasDB = [...dependenciasMock];

// ============================================================================
// ATIVIDADES
// ============================================================================

/**
 * Busca todas as atividades de um projeto
 */
export const getAtividades = async (projetoId: string): Promise<AtividadeMock[]> => {
  await delay(300); // Simula latência de rede
  
  return atividadesDB.filter(ativ => ativ.projeto_id === projetoId);
};

/**
 * Cria uma nova atividade
 */
export const createAtividade = async (
  atividade: Omit<AtividadeMock, 'id' | 'created_at' | 'updated_at'>
): Promise<AtividadeMock> => {
  await delay(200);

  const novaAtividade: AtividadeMock = {
    ...atividade,
    id: `ativ-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  atividadesDB.push(novaAtividade);
  return novaAtividade;
};

/**
 * Atualiza uma atividade existente
 */
export const updateAtividade = async (
  id: string,
  dados: Partial<AtividadeMock>
): Promise<AtividadeMock> => {
  await delay(200);

  const index = atividadesDB.findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error(`Atividade ${id} não encontrada`);
  }

  atividadesDB[index] = {
    ...atividadesDB[index],
    ...dados,
    updated_at: new Date().toISOString(),
  };

  return atividadesDB[index];
};

/**
 * Exclui uma atividade
 */
export const deleteAtividade = async (id: string): Promise<void> => {
  await delay(200);

  const index = atividadesDB.findIndex(a => a.id === id);
  if (index === -1) {
    throw new Error(`Atividade ${id} não encontrada`);
  }

  // Remove a atividade
  atividadesDB.splice(index, 1);

  // Remove dependências relacionadas
  dependenciasDB = dependenciasDB.filter(
    d => d.atividade_origem_id !== id && d.atividade_destino_id !== id
  );
};

// ============================================================================
// DEPENDÊNCIAS
// ============================================================================

/**
 * Busca todas as dependências de um projeto
 */
export const getDependencias = async (projetoId: string): Promise<DependenciaAtividade[]> => {
  await delay(200);

  // Filtra dependências cujas atividades pertencem ao projeto
  const atividadesIds = atividadesDB
    .filter(a => a.projeto_id === projetoId)
    .map(a => a.id);

  return dependenciasDB.filter(
    d => atividadesIds.includes(d.atividade_origem_id) && atividadesIds.includes(d.atividade_destino_id)
  );
};

/**
 * Cria uma nova dependência
 */
export const createDependencia = async (
  dependencia: Omit<DependenciaAtividade, 'id' | 'created_at'>
): Promise<DependenciaAtividade> => {
  await delay(200);

  // Validações
  if (dependencia.atividade_origem_id === dependencia.atividade_destino_id) {
    throw new Error('Uma atividade não pode depender de si mesma');
  }

  // Verifica se já existe essa dependência
  const existe = dependenciasDB.some(
    d => 
      d.atividade_origem_id === dependencia.atividade_origem_id &&
      d.atividade_destino_id === dependencia.atividade_destino_id
  );

  if (existe) {
    throw new Error('Esta dependência já existe');
  }

  // TODO: Detectar dependências circulares (simplificado)
  const temCiclo = verificarDependenciaCircular(
    dependencia.atividade_origem_id,
    dependencia.atividade_destino_id
  );

  if (temCiclo) {
    throw new Error('Esta dependência criaria um ciclo (dependência circular)');
  }

  const novaDependencia: DependenciaAtividade = {
    ...dependencia,
    id: `dep-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  dependenciasDB.push(novaDependencia);
  return novaDependencia;
};

/**
 * Exclui uma dependência
 */
export const deleteDependencia = async (id: string): Promise<void> => {
  await delay(200);

  const index = dependenciasDB.findIndex(d => d.id === id);
  if (index === -1) {
    throw new Error(`Dependência ${id} não encontrada`);
  }

  dependenciasDB.splice(index, 1);
};

/**
 * Verifica se criar uma dependência causaria um ciclo
 * Algoritmo simplificado (DFS)
 */
const verificarDependenciaCircular = (origemId: string, destinoId: string): boolean => {
  const visitados = new Set<string>();
  const pilha = [destinoId];

  while (pilha.length > 0) {
    const atual = pilha.pop()!;
    
    if (atual === origemId) {
      return true; // Encontrou ciclo
    }

    if (visitados.has(atual)) {
      continue;
    }

    visitados.add(atual);

    // Adiciona dependências do nó atual na pilha
    const dependentes = dependenciasDB
      .filter(d => d.atividade_origem_id === atual)
      .map(d => d.atividade_destino_id);

    pilha.push(...dependentes);
  }

  return false;
};

// ============================================================================
// CAMINHO CRÍTICO (CPM - Critical Path Method)
// ============================================================================

/**
 * Calcula o caminho crítico do projeto
 * Implementação do algoritmo CPM (Critical Path Method)
 */
export const calcularCaminhoCritico = async (projetoId: string): Promise<CaminhoCritico> => {
  await delay(500); // Simulando processamento

  const atividades = await getAtividades(projetoId);
  const dependencias = await getDependencias(projetoId);

  if (atividades.length === 0) {
    return {
      atividades_criticas: [],
      duracao_total_projeto: 0,
      folgas: {},
      calculado_em: new Date().toISOString(),
    };
  }

  // 1. FORWARD PASS - Calcular Early Start e Early Finish
  const earlyDates = new Map<string, { start: Date; finish: Date }>();
  const processadas = new Set<string>();

  // Função para calcular early dates de uma atividade
  const calcularEarlyDates = (atividadeId: string) => {
    if (processadas.has(atividadeId)) return;

    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) return;

    // Encontra dependências dessa atividade (predecessores)
    const predecessores = dependencias.filter(d => d.atividade_destino_id === atividadeId);

    if (predecessores.length === 0) {
      // Atividade inicial - começa na data de início do projeto
      const dataInicio = new Date(atividade.data_inicio);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + atividade.duracao_dias);

      earlyDates.set(atividadeId, {
        start: dataInicio,
        finish: dataFim,
      });
    } else {
      // Calcula baseado nos predecessores
      let maxFinish = new Date(0); // Data mais cedo possível

      for (const pred of predecessores) {
        // Garante que o predecessor foi processado
        if (!processadas.has(pred.atividade_origem_id)) {
          calcularEarlyDates(pred.atividade_origem_id);
        }

        const predDates = earlyDates.get(pred.atividade_origem_id);
        if (!predDates) continue;

        let dataBase: Date;
        switch (pred.tipo) {
          case TipoDependencia.FS: // Finish-to-Start
            dataBase = new Date(predDates.finish);
            break;
          case TipoDependencia.SS: // Start-to-Start
            dataBase = new Date(predDates.start);
            break;
          case TipoDependencia.FF: // Finish-to-Finish
            dataBase = new Date(predDates.finish);
            break;
          case TipoDependencia.SF: // Start-to-Finish
            dataBase = new Date(predDates.start);
            break;
          default:
            dataBase = new Date(predDates.finish);
        }

        // Aplica lag
        if (pred.lag_dias) {
          dataBase.setDate(dataBase.getDate() + pred.lag_dias);
        }

        if (dataBase > maxFinish) {
          maxFinish = dataBase;
        }
      }

      const earlyStart = maxFinish;
      const earlyFinish = new Date(earlyStart);
      earlyFinish.setDate(earlyFinish.getDate() + atividade.duracao_dias);

      earlyDates.set(atividadeId, {
        start: earlyStart,
        finish: earlyFinish,
      });
    }

    processadas.add(atividadeId);
  };

  // Processa todas as atividades
  atividades.forEach(a => calcularEarlyDates(a.id));

  // 2. BACKWARD PASS - Calcular Late Start e Late Finish
  const lateDates = new Map<string, { start: Date; finish: Date }>();

  // Encontra a data de término do projeto (maior early finish)
  let maxDataFim = new Date(0);
  earlyDates.forEach(dates => {
    if (dates.finish > maxDataFim) {
      maxDataFim = dates.finish;
    }
  });

  // Atividades finais (sem sucessores)
  const atividadesFinais = atividades.filter(a => {
    return !dependencias.some(d => d.atividade_origem_id === a.id);
  });

  // Define late dates para atividades finais
  atividadesFinais.forEach(ativ => {
    const early = earlyDates.get(ativ.id);
    if (early) {
      lateDates.set(ativ.id, {
        finish: new Date(maxDataFim),
        start: new Date(new Date(maxDataFim).getTime() - ativ.duracao_dias * 24 * 60 * 60 * 1000),
      });
    }
  });

  // Calcula late dates para as demais atividades (backward)
  const calcularLateDates = (atividadeId: string): void => {
    if (lateDates.has(atividadeId)) return;

    const atividade = atividades.find(a => a.id === atividadeId);
    if (!atividade) return;

    // Encontra sucessores
    const sucessores = dependencias.filter(d => d.atividade_origem_id === atividadeId);

    if (sucessores.length === 0) {
      // Já deve ter sido processado como atividade final
      return;
    }

    let minStart = new Date(maxDataFim);

    for (const suc of sucessores) {
      // Garante que sucessor foi processado
      if (!lateDates.has(suc.atividade_destino_id)) {
        calcularLateDates(suc.atividade_destino_id);
      }

      const sucDates = lateDates.get(suc.atividade_destino_id);
      if (!sucDates) continue;

      let dataBase: Date;
      switch (suc.tipo) {
        case TipoDependencia.FS:
          dataBase = new Date(sucDates.start);
          break;
        case TipoDependencia.SS:
          dataBase = new Date(sucDates.start);
          break;
        case TipoDependencia.FF:
          dataBase = new Date(sucDates.finish);
          break;
        case TipoDependencia.SF:
          dataBase = new Date(sucDates.finish);
          break;
        default:
          dataBase = new Date(sucDates.start);
      }

      // Aplica lag (reverso)
      if (suc.lag_dias) {
        dataBase.setDate(dataBase.getDate() - suc.lag_dias);
      }

      if (dataBase < minStart) {
        minStart = dataBase;
      }
    }

    const lateFinish = minStart;
    const lateStart = new Date(lateFinish);
    lateStart.setDate(lateStart.getDate() - atividade.duracao_dias);

    lateDates.set(atividadeId, {
      start: lateStart,
      finish: lateFinish,
    });
  };

  // Processa backward
  atividades.forEach(a => calcularLateDates(a.id));

  // 3. CALCULAR FOLGAS E IDENTIFICAR CAMINHO CRÍTICO
  const folgas: Record<string, any> = {};
  const atividadesCriticas: string[] = [];

  atividades.forEach(ativ => {
    const early = earlyDates.get(ativ.id);
    const late = lateDates.get(ativ.id) || early; // Fallback

    if (!early) return;

    const folgaTotal = late 
      ? (late.start.getTime() - early.start.getTime()) / (24 * 60 * 60 * 1000)
      : 0;

    const eCritica = folgaTotal <= 0.1; // Tolerância de 0.1 dia

    if (eCritica) {
      atividadesCriticas.push(ativ.id);
    }

    folgas[ativ.id] = {
      atividade_id: ativ.id,
      early_start: early.start,
      early_finish: early.finish,
      late_start: late?.start || early.start,
      late_finish: late?.finish || early.finish,
      folga_total: Math.max(0, folgaTotal),
      folga_livre: 0, // Simplificado
      e_critica: eCritica,
    };
  });

  // Calcula duração total
  const duracaoTotal = Math.ceil(
    (maxDataFim.getTime() - new Date(atividades[0].data_inicio).getTime()) / (24 * 60 * 60 * 1000)
  );

  return {
    atividades_criticas: atividadesCriticas,
    duracao_total_projeto: duracaoTotal,
    folgas,
    calculado_em: new Date().toISOString(),
  };
};

// ============================================================================
// RESET (para testes)
// ============================================================================

/**
 * Reseta os dados para o estado inicial (apenas para desenvolvimento/testes)
 */
export const resetMockData = () => {
  atividadesDB = [...atividadesMock];
  dependenciasDB = [...dependenciasMock];
};

