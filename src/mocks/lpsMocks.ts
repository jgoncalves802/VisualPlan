/**
 * Dados mockados para LPS (Last Planner System / Planejamento Puxado)
 */

import {
  AtividadeLPS,
  RestricaoLPS,
  AnotacaoLPS,
  StatusAtividadeLPS,
  CategoriaAtividade,
  TipoRestricao,
  TipoAtividadeLPS,
} from '../types/lps';

// Datas de exemplo (baseadas nas fotos)
const hoje = new Date();
const dataInicio = new Date(2024, 10, 10); // 10/11/2024
const dataFim = new Date(2024, 11, 1); // 01/12/2024

/**
 * Atividades mockadas do LPS
 */
export const atividadesMockLPS: Omit<AtividadeLPS, 'id'>[] = [
  {
    codigo: 'ATV-001',
    nome: 'Limpeza Operacional (Prédio JHMA)',
    descricao: 'Limpeza operacional do prédio JHMA',
    data_inicio: new Date(2024, 10, 10),
    data_fim: new Date(2024, 10, 14),
    data_atribuida: new Date(2024, 10, 10),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Vitória',
    apoio: 'Pedro C.',
    tags: ['Limpeza', 'Operacional'],
  },
  {
    codigo: 'ATV-002',
    nome: 'Parada MC117 e MC101',
    descricao: 'Parada dos equipamentos MC117 e MC101',
    data_inicio: new Date(2024, 10, 16),
    data_fim: new Date(2024, 10, 28),
    data_atribuida: new Date(2024, 10, 16),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.CRITICA,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Rafael E.',
    apoio: 'Pedro C.',
    tags: ['Parada', 'Equipamentos'],
  },
  {
    codigo: 'ATV-003',
    nome: 'Escala Operacional (Liberação de APR)',
    descricao: 'Escala operacional para liberação de APR',
    data_inicio: new Date(2024, 10, 11),
    data_fim: new Date(2024, 10, 18),
    data_atribuida: new Date(2024, 10, 11),
    status: StatusAtividadeLPS.EM_ANDAMENTO,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Evaldo/Kennedy',
    apoio: 'Ronaldo',
    tags: ['Escala', 'APR'],
  },
  {
    codigo: 'ATV-004',
    nome: 'DDS Geral',
    descricao: 'Dialogo Diário de Segurança Geral',
    data_inicio: new Date(2024, 10, 14),
    data_fim: new Date(2024, 10, 14),
    data_atribuida: new Date(2024, 10, 14),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.MARCO,
    categoria: CategoriaAtividade.ESPECIAL,
    responsavel: 'Daniela',
    apoio: 'Pedro C.',
    tags: ['DDS', 'Segurança'],
  },
  {
    codigo: 'ATV-005',
    nome: 'Montagem',
    descricao: 'Montagem de equipamentos',
    data_inicio: new Date(2024, 10, 17),
    data_fim: new Date(2024, 10, 20),
    data_atribuida: new Date(2024, 10, 17),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Equipe A',
    tags: ['Montagem'],
  },
  {
    codigo: 'ATV-006',
    nome: 'Revisão',
    descricao: 'Revisão de equipamentos',
    data_inicio: new Date(2024, 10, 21),
    data_fim: new Date(2024, 10, 24),
    data_atribuida: new Date(2024, 10, 21),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Equipe B',
    tags: ['Revisão'],
  },
  {
    codigo: 'ATV-007',
    nome: 'Desmontagem',
    descricao: 'Desmontagem de equipamentos',
    data_inicio: new Date(2024, 10, 25),
    data_fim: new Date(2024, 10, 27),
    data_atribuida: new Date(2024, 10, 25),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.PRINCIPAL,
    responsavel: 'Equipe C',
    tags: ['Desmontagem'],
  },
  {
    codigo: 'ATV-008',
    nome: 'Retirada',
    descricao: 'Retirada de materiais',
    data_inicio: new Date(2024, 10, 11),
    data_fim: new Date(2024, 10, 13),
    data_atribuida: new Date(2024, 10, 11),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.SECUNDARIA,
    responsavel: 'Equipe D',
    tags: ['Retirada', 'Materiais'],
  },
  {
    codigo: 'ATV-009',
    nome: 'Limpeza',
    descricao: 'Limpeza de área',
    data_inicio: new Date(2024, 10, 18),
    data_fim: new Date(2024, 10, 21),
    data_atribuida: new Date(2024, 10, 18),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.NORMAL,
    categoria: CategoriaAtividade.SECUNDARIA,
    responsavel: 'Equipe E',
    tags: ['Limpeza'],
  },
  {
    codigo: 'ATV-010',
    nome: 'Operação Assistida',
    descricao: 'Operação assistida de equipamentos',
    data_inicio: new Date(2024, 11, 1),
    data_fim: new Date(2024, 11, 1),
    data_atribuida: new Date(2024, 11, 1),
    status: StatusAtividadeLPS.PLANEJADA,
    tipo: TipoAtividadeLPS.MARCO,
    categoria: CategoriaAtividade.ESPECIAL,
    responsavel: 'Equipe F',
    tags: ['Operação', 'Assistida'],
  },
];

/**
 * Restrições mockadas do LPS
 */
export const restricoesMockLPS: Omit<RestricaoLPS, 'id'>[] = [
  {
    descricao: 'Limpeza Operacional (Prédio JHMA)',
    tipo: TipoRestricao.RESTRICAO,
    responsavel: 'Vitória',
    apoio: 'Pedro C.',
    data_conclusao_planejada: new Date(2024, 10, 14),
    data_conclusao: new Date(2024, 10, 14),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Parada MC117 e MC101',
    tipo: TipoRestricao.RESTRICAO,
    responsavel: 'Rafael E.',
    apoio: 'Pedro C.',
    data_conclusao_planejada: new Date(2024, 10, 16),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Escala Operacional (Liberação de APR)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Evaldo/Kennedy',
    apoio: 'Ronaldo',
    data_conclusao_planejada: new Date(2024, 10, 11),
    data_criacao: new Date(2024, 10, 10),
    status: 'PENDENTE',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Definir antecipação da parada',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Ronaldo',
    apoio: 'Ronaldo',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Consolidar matriz de riscos',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Max',
    apoio: 'Gustavo R.',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Mobilização dos recursos e conteiro',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Shayane',
    apoio: 'Junior',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Consolidar cronograma + PTO',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Pedro C.',
    apoio: 'Pedro C.',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Consolidar jornada de trabalho (Turnos)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Julio',
    apoio: 'Junior',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Planejar limpezas operacionais (JHMA)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Pedro C.',
    apoio: 'Ronaldo',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Definir estratégia de bloqueio (Lógica)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Douglas',
    apoio: 'Ronaldo',
    data_conclusao_planejada: new Date(2024, 10, 10),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'ALTA',
    historico: [],
  },
  {
    descricao: 'Agendar DDS Geral (14/11)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Daniela',
    apoio: 'Pedro C.',
    data_conclusao_planejada: new Date(2024, 10, 12),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Validar plano de rigger',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Victor S.',
    apoio: 'Daniela',
    data_conclusao_planejada: new Date(2024, 10, 11),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Validar projetos de andaime',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Daniela',
    apoio: 'Ronaldo',
    data_conclusao_planejada: new Date(2024, 10, 12),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Providenciar contingências p/ chuva (hora/turno/p.i)',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Daniela',
    apoio: 'Pedro',
    data_conclusao_planejada: new Date(2024, 10, 13),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
  {
    descricao: 'Providenciar carboxímetro no conteiro 503',
    tipo: TipoRestricao.SEM_RESTRICAO,
    responsavel: 'Shayane',
    apoio: 'Junior',
    data_conclusao_planejada: new Date(2024, 10, 11),
    data_criacao: new Date(2024, 10, 10),
    status: 'CONCLUIDA',
    prioridade: 'MEDIA',
    historico: [],
  },
];

/**
 * Anotações mockadas do LPS
 */
export const anotacoesMockLPS: Omit<AnotacaoLPS, 'id'>[] = [
  {
    descricao: 'Limpeza Operacional (Prédio JHMA)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Vitória',
    tags: ['Limpeza', 'Operacional'],
  },
  {
    descricao: 'Parada MC117 e MC101',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Rafael E.',
    tags: ['Parada', 'Equipamentos'],
  },
  {
    descricao: 'Escala Operacional (Liberação de APR)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Evaldo/Kennedy',
    tags: ['Escala', 'APR'],
  },
  {
    descricao: 'Definir antecipação da parada',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Ronaldo',
    tags: ['Antecipação', 'Parada'],
  },
  {
    descricao: 'Consolidar matriz de riscos',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Max',
    tags: ['Riscos', 'Matriz'],
  },
  {
    descricao: 'Mobilização dos recursos e conteiro',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Shayane',
    tags: ['Recursos', 'Mobilização'],
  },
  {
    descricao: 'Consolidar cronograma + PTO',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Pedro C.',
    tags: ['Cronograma', 'PTO'],
  },
  {
    descricao: 'Consolidar jornada de trabalho (Turnos)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Julio',
    tags: ['Jornada', 'Turnos'],
  },
  {
    descricao: 'Planejar limpezas operacionais (JHMA)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Pedro C.',
    tags: ['Limpeza', 'Operacional'],
  },
  {
    descricao: 'Definir estratégia de bloqueio (Lógica)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Douglas',
    tags: ['Bloqueio', 'Lógica'],
  },
  {
    descricao: 'Agendar DDS Geral (14/11)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Daniela',
    tags: ['DDS', 'Segurança'],
  },
  {
    descricao: 'Validar plano de rigger',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Victor S.',
    tags: ['Rigger', 'Validação'],
  },
  {
    descricao: 'Validar projetos de andaime',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Daniela',
    tags: ['Andaime', 'Validação'],
  },
  {
    descricao: 'Providenciar contingências p/ chuva (hora/turno/p.i)',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Daniela',
    tags: ['Contingência', 'Chuva'],
  },
  {
    descricao: 'Providenciar carboxímetro no conteiro 503',
    data_criacao: new Date(2024, 10, 10),
    responsavel: 'Shayane',
    tags: ['Carboxímetro', 'Equipamento'],
  },
];

/**
 * Retornar atividades mockadas (sem IDs, serão gerados pelo store)
 */
export const getAtividadesMockLPS = (): Omit<AtividadeLPS, 'id'>[] => {
  return atividadesMockLPS;
};

/**
 * Retornar restrições mockadas (sem IDs, serão gerados pelo store)
 */
export const getRestricoesMockLPS = (): Omit<RestricaoLPS, 'id'>[] => {
  return restricoesMockLPS;
};

/**
 * Retornar anotações mockadas (sem IDs, serão gerados pelo store)
 */
export const getAnotacoesMockLPS = (): Omit<AnotacaoLPS, 'id'>[] => {
  return anotacoesMockLPS;
};

