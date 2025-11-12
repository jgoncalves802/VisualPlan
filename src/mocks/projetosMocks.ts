/**
 * Dados mocados para Projetos (WBS)
 */

import { atividadesMock } from './cronogramaMocks';

export interface ProjetoMock {
  id: string;
  nome: string;
  codigo: string;
  descricao: string;
  cliente: string;
  gerente: string;
  data_inicio: string;
  data_fim: string;
  data_fim_prevista: string;
  status: 'Em Andamento' | 'Concluído' | 'Atrasado' | 'Não Iniciado' | 'Paralisado';
  progresso: number; // 0-100
  orcamento: number;
  custo_real: number;
  cor: string; // cor para o Gantt
  prioridade: 'Alta' | 'Média' | 'Baixa';
  tags: string[];
  num_atividades: number;
  num_atividades_concluidas: number;
  num_atividades_atrasadas: number;
  created_at: string;
  updated_at: string;
}

/**
 * Projetos mockados
 */
export const projetosMock: ProjetoMock[] = [
  {
    id: 'proj-1',
    nome: 'Sistema VisionPlan',
    codigo: 'VPLAN-2024',
    descricao: 'Desenvolvimento do sistema de planejamento e gestão de obras',
    cliente: 'Construtora Alpha',
    gerente: 'João Silva',
    data_inicio: '2024-11-01',
    data_fim: '2024-12-31',
    data_fim_prevista: '2024-12-31',
    status: 'Em Andamento',
    progresso: 35,
    orcamento: 500000,
    custo_real: 180000,
    cor: '#3b82f6', // blue-500
    prioridade: 'Alta',
    tags: ['Software', 'Web', 'React', 'TypeScript'],
    num_atividades: 12,
    num_atividades_concluidas: 2,
    num_atividades_atrasadas: 1,
    created_at: '2024-10-01T10:00:00Z',
    updated_at: '2024-11-18T16:00:00Z',
  },
  {
    id: 'proj-2',
    nome: 'Manutenção Emergencial - API',
    codigo: 'ME-API-2024',
    descricao: 'Correção de bug crítico na API de autenticação',
    cliente: 'Interno',
    gerente: 'Roberto Tech',
    data_inicio: '2024-11-20T08:00:00',
    data_fim: '2024-11-21T11:00:00',
    data_fim_prevista: '2024-11-21T11:00:00',
    status: 'Em Andamento',
    progresso: 60,
    orcamento: 15000,
    custo_real: 9000,
    cor: '#ef4444', // red-500
    prioridade: 'Alta',
    tags: ['Hotfix', 'API', 'Emergencial'],
    num_atividades: 7,
    num_atividades_concluidas: 2,
    num_atividades_atrasadas: 0,
    created_at: '2024-11-20T07:00:00Z',
    updated_at: '2024-11-20T19:00:00Z',
  },
  {
    id: 'proj-3',
    nome: 'Construção Edifício Comercial',
    codigo: 'EC-2024-001',
    descricao: 'Obra de construção de edifício comercial de 15 andares',
    cliente: 'Imobiliária Beta',
    gerente: 'Maria Santos',
    data_inicio: '2024-01-15',
    data_fim: '2025-12-30',
    data_fim_prevista: '2025-10-30',
    status: 'Em Andamento',
    progresso: 42,
    orcamento: 12000000,
    custo_real: 5200000,
    cor: '#10b981', // green-500
    prioridade: 'Alta',
    tags: ['Construção Civil', 'Edifício', 'Comercial'],
    num_atividades: 48,
    num_atividades_concluidas: 18,
    num_atividades_atrasadas: 3,
    created_at: '2024-01-01T08:00:00Z',
    updated_at: '2024-11-15T17:00:00Z',
  },
  {
    id: 'proj-4',
    nome: 'Reforma Shopping Center',
    codigo: 'RSC-2024-002',
    descricao: 'Reforma e modernização do shopping center',
    cliente: 'Shopping Mega',
    gerente: 'Pedro Costa',
    data_inicio: '2024-09-01',
    data_fim: '2024-11-30',
    data_fim_prevista: '2024-12-15',
    status: 'Atrasado',
    progresso: 75,
    orcamento: 3500000,
    custo_real: 2800000,
    cor: '#f59e0b', // amber-500
    prioridade: 'Média',
    tags: ['Reforma', 'Shopping', 'Comercial'],
    num_atividades: 24,
    num_atividades_concluidas: 16,
    num_atividades_atrasadas: 5,
    created_at: '2024-08-15T09:00:00Z',
    updated_at: '2024-11-18T14:00:00Z',
  },
  {
    id: 'proj-5',
    nome: 'Infraestrutura de TI - Datacenter',
    codigo: 'DC-2024-003',
    descricao: 'Implantação de novo datacenter corporativo',
    cliente: 'TechCorp Industries',
    gerente: 'Fernanda Ops',
    data_inicio: '2024-08-01',
    data_fim: '2024-10-31',
    data_fim_prevista: '2024-10-31',
    status: 'Concluído',
    progresso: 100,
    orcamento: 8000000,
    custo_real: 7850000,
    cor: '#8b5cf6', // violet-500
    prioridade: 'Alta',
    tags: ['TI', 'Datacenter', 'Infraestrutura'],
    num_atividades: 32,
    num_atividades_concluidas: 32,
    num_atividades_atrasadas: 0,
    created_at: '2024-07-15T10:00:00Z',
    updated_at: '2024-10-31T18:00:00Z',
  },
  {
    id: 'proj-6',
    nome: 'Ponte Rodoviária - Acesso Norte',
    codigo: 'PR-AN-2024',
    descricao: 'Construção de ponte rodoviária de 450 metros',
    cliente: 'Governo Estadual',
    gerente: 'Carlos Oliveira',
    data_inicio: '2024-03-01',
    data_fim: '2025-08-30',
    data_fim_prevista: '2025-09-15',
    status: 'Em Andamento',
    progresso: 28,
    orcamento: 45000000,
    custo_real: 12800000,
    cor: '#06b6d4', // cyan-500
    prioridade: 'Alta',
    tags: ['Infraestrutura', 'Ponte', 'Rodoviário', 'Governo'],
    num_atividades: 64,
    num_atividades_concluidas: 15,
    num_atividades_atrasadas: 2,
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-11-17T16:00:00Z',
  },
  {
    id: 'proj-7',
    nome: 'Condomínio Residencial Jardins',
    codigo: 'CRJ-2024-004',
    descricao: 'Construção de condomínio com 8 blocos residenciais',
    cliente: 'Construtora Jardins Ltda',
    gerente: 'Ana Lima',
    data_inicio: '2025-01-10',
    data_fim: '2026-12-20',
    data_fim_prevista: '2026-11-30',
    status: 'Não Iniciado',
    progresso: 0,
    orcamento: 28000000,
    custo_real: 0,
    cor: '#84cc16', // lime-500
    prioridade: 'Média',
    tags: ['Residencial', 'Condomínio', 'Multi-blocos'],
    num_atividades: 96,
    num_atividades_concluidas: 0,
    num_atividades_atrasadas: 0,
    created_at: '2024-11-01T10:00:00Z',
    updated_at: '2024-11-01T10:00:00Z',
  },
];

/**
 * Helper para obter projeto por ID
 */
export const getProjetoById = (id: string): ProjetoMock | undefined => {
  return projetosMock.find((p) => p.id === id);
};

/**
 * Helper para obter projetos ativos (não concluídos)
 */
export const getProjetosAtivos = (): ProjetoMock[] => {
  return projetosMock.filter((p) => p.status !== 'Concluído');
};

/**
 * Helper para obter projetos concluídos
 */
export const getProjetosConcluidos = (): ProjetoMock[] => {
  return projetosMock.filter((p) => p.status === 'Concluído');
};

/**
 * Helper para obter projetos atrasados
 */
export const getProjetosAtrasados = (): ProjetoMock[] => {
  return projetosMock.filter((p) => p.status === 'Atrasado');
};

/**
 * Calcula a duração real de um projeto com base em suas atividades
 */
export const calcularDuracaoRealProjeto = (projetoId: string): { data_inicio: string; data_fim: string; duracao_dias: number } | null => {
  const atividades = atividadesMock.filter((a) => a.projeto_id === projetoId);
  
  if (atividades.length === 0) {
    return null;
  }

  // Encontra a data de início mais cedo e a data de fim mais tarde
  const datasInicio = atividades.map((a) => new Date(a.data_inicio));
  const datasFim = atividades.map((a) => new Date(a.data_fim));

  const dataInicio = new Date(Math.min(...datasInicio.map((d) => d.getTime())));
  const dataFim = new Date(Math.max(...datasFim.map((d) => d.getTime())));

  // Calcula a duração em dias
  const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
  const duracaoDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    data_inicio: dataInicio.toISOString().split('T')[0],
    data_fim: dataFim.toISOString().split('T')[0],
    duracao_dias: duracaoDias,
  };
};

/**
 * Atualiza um projeto com as datas reais baseadas em suas atividades
 */
export const getProjetoComDuracaoReal = (projeto: ProjetoMock): ProjetoMock => {
  const duracaoReal = calcularDuracaoRealProjeto(projeto.id);
  
  if (!duracaoReal) {
    return projeto;
  }

  return {
    ...projeto,
    data_inicio: duracaoReal.data_inicio,
    data_fim: duracaoReal.data_fim,
  };
};

/**
 * Retorna todos os projetos com suas durações reais calculadas
 */
export const getProjetosComDuracaoReal = (): ProjetoMock[] => {
  return projetosMock.map(getProjetoComDuracaoReal);
};

