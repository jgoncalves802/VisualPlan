import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Target,
  FileText,
  RefreshCw
} from 'lucide-react';
import {
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useTemaStore } from '../stores/temaStore';
import {
  CategoriaIshikawa,
  StatusRestricaoIshikawa,
  RestricaoIshikawa,
  KPIKaizen,
  DadosIshikawa
} from '../types/gestao';
import KPICard from '../components/ui/KPICard';

const CATEGORY_LABELS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: 'MÉTODO',
  [CategoriaIshikawa.MAO_DE_OBRA]: 'MÃO DE OBRA',
  [CategoriaIshikawa.MATERIAL]: 'MATERIAL',
  [CategoriaIshikawa.MAQUINA]: 'MÁQUINA',
  [CategoriaIshikawa.MEDIDA]: 'MEDIDA',
  [CategoriaIshikawa.MEIO_AMBIENTE]: 'MEIO AMBIENTE',
};

const CATEGORY_DESCRIPTIONS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: 'Procedimentos, projetos, erros de planejamento',
  [CategoriaIshikawa.MAO_DE_OBRA]: 'Equipe, treinamento, supervisão',
  [CategoriaIshikawa.MATERIAL]: 'Fornecedores, materiais, especificações',
  [CategoriaIshikawa.MAQUINA]: 'Equipamentos, manutenção, disponibilidade',
  [CategoriaIshikawa.MEDIDA]: 'Controle de qualidade, inspeções, não conformidades',
  [CategoriaIshikawa.MEIO_AMBIENTE]: 'Clima, licenças, fatores externos',
};

const CATEGORY_COLORS: Record<CategoriaIshikawa, string> = {
  [CategoriaIshikawa.METODO]: '#8B5CF6',
  [CategoriaIshikawa.MAO_DE_OBRA]: '#3B82F6',
  [CategoriaIshikawa.MATERIAL]: '#10B981',
  [CategoriaIshikawa.MAQUINA]: '#F59E0B',
  [CategoriaIshikawa.MEDIDA]: '#EC4899',
  [CategoriaIshikawa.MEIO_AMBIENTE]: '#06B6D4',
};

const STATUS_COLORS: Record<StatusRestricaoIshikawa, string> = {
  [StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO]: '#22C55E',
  [StatusRestricaoIshikawa.EM_EXECUCAO]: '#3B82F6',
  [StatusRestricaoIshikawa.NO_PRAZO]: '#EAB308',
  [StatusRestricaoIshikawa.ATRASADA]: '#F97316',
  [StatusRestricaoIshikawa.VENCIDA]: '#EF4444',
};

const STATUS_LABELS: Record<StatusRestricaoIshikawa, string> = {
  [StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO]: 'Concluída',
  [StatusRestricaoIshikawa.EM_EXECUCAO]: 'Em Execução',
  [StatusRestricaoIshikawa.NO_PRAZO]: 'No Prazo',
  [StatusRestricaoIshikawa.ATRASADA]: 'Atrasada',
  [StatusRestricaoIshikawa.VENCIDA]: 'Vencida',
};

const generateMockRestrictions = (): RestricaoIshikawa[] => {
  const restrictions: RestricaoIshikawa[] = [
    { id: '1', codigo: 'REST-001', descricao: 'Falta de detalhamento no projeto estrutural', categoria: CategoriaIshikawa.METODO, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A001', atividadeNome: 'Fundação Bloco A', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-01'), dataPrevista: new Date('2024-10-15'), responsavel: 'João Silva', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 15, diasAtraso: 12, scoreImpacto: 59, reincidente: true },
    { id: '2', codigo: 'REST-002', descricao: 'Erro no cronograma de execução', categoria: CategoriaIshikawa.METODO, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A002', atividadeNome: 'Montagem Estrutura', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-10'), dataPrevista: new Date('2024-11-01'), responsavel: 'Maria Santos', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 20, diasAtraso: 8, scoreImpacto: 55, reincidente: false },
    { id: '3', codigo: 'REST-003', descricao: 'Sequenciamento incorreto das atividades', categoria: CategoriaIshikawa.METODO, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A003', atividadeNome: 'Alvenaria', wbsId: 'WBS-02', wbsNome: 'Vedação', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-01'), dataPrevista: new Date('2024-12-01'), responsavel: 'Carlos Lima', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 10, diasAtraso: 0, scoreImpacto: 22, reincidente: false },
    { id: '4', codigo: 'REST-004', descricao: 'Falta de procedimento para concretagem', categoria: CategoriaIshikawa.METODO, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A004', atividadeNome: 'Concretagem Laje', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-15'), dataPrevista: new Date('2024-12-15'), responsavel: 'Ana Costa', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 5, diasAtraso: 0, scoreImpacto: 34, reincidente: false },
    { id: '5', codigo: 'REST-005', descricao: 'Projeto incompatível com execução', categoria: CategoriaIshikawa.METODO, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A005', atividadeNome: 'Instalações Hidráulicas', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-01'), dataPrevista: new Date('2024-09-20'), dataConclusao: new Date('2024-09-18'), responsavel: 'Pedro Souza', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 8, diasAtraso: 0, scoreImpacto: 16, reincidente: false },
    
    { id: '6', codigo: 'REST-006', descricao: 'Equipe insuficiente para demanda', categoria: CategoriaIshikawa.MAO_DE_OBRA, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A006', atividadeNome: 'Pintura Externa', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-05'), dataPrevista: new Date('2024-10-20'), responsavel: 'Lucas Ferreira', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 12, diasAtraso: 15, scoreImpacto: 62, reincidente: true },
    { id: '7', codigo: 'REST-007', descricao: 'Falta de treinamento em altura', categoria: CategoriaIshikawa.MAO_DE_OBRA, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A007', atividadeNome: 'Fachada', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-20'), dataPrevista: new Date('2024-11-10'), responsavel: 'Marina Oliveira', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 10, diasAtraso: 5, scoreImpacto: 27, reincidente: false },
    { id: '8', codigo: 'REST-008', descricao: 'Rotatividade alta de pedreiros', categoria: CategoriaIshikawa.MAO_DE_OBRA, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A008', atividadeNome: 'Alvenaria Interna', wbsId: 'WBS-02', wbsNome: 'Vedação', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-05'), dataPrevista: new Date('2024-12-05'), responsavel: 'Roberto Dias', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 18, diasAtraso: 0, scoreImpacto: 39, reincidente: true },
    { id: '9', codigo: 'REST-009', descricao: 'Supervisor ausente', categoria: CategoriaIshikawa.MAO_DE_OBRA, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A009', atividadeNome: 'Impermeabilização', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-20'), dataPrevista: new Date('2024-12-20'), responsavel: 'Fernanda Gomes', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 6, diasAtraso: 0, scoreImpacto: 12, reincidente: false },
    { id: '10', codigo: 'REST-010', descricao: 'Equipe não qualificada para tarefa específica', categoria: CategoriaIshikawa.MAO_DE_OBRA, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A010', atividadeNome: 'Instalações Elétricas', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-15'), dataPrevista: new Date('2024-10-01'), dataConclusao: new Date('2024-09-28'), responsavel: 'Thiago Martins', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 14, diasAtraso: 0, scoreImpacto: 38, reincidente: false },
    
    { id: '11', codigo: 'REST-011', descricao: 'Atraso na entrega de aço', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A001', atividadeNome: 'Fundação Bloco A', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-01'), dataPrevista: new Date('2024-10-10'), responsavel: 'João Silva', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 15, diasAtraso: 20, scoreImpacto: 68, reincidente: true },
    { id: '12', codigo: 'REST-012', descricao: 'Concreto fora da especificação', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A011', atividadeNome: 'Concretagem Pilar', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-15'), dataPrevista: new Date('2024-10-25'), responsavel: 'Maria Santos', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 8, diasAtraso: 10, scoreImpacto: 51, reincidente: false },
    { id: '13', codigo: 'REST-013', descricao: 'Falta de tijolos cerâmicos', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A012', atividadeNome: 'Alvenaria Bloco B', wbsId: 'WBS-02', wbsNome: 'Vedação', epsId: 'EPS-02', epsNome: 'Bloco B', dataCriacao: new Date('2024-11-01'), dataPrevista: new Date('2024-11-20'), responsavel: 'Carlos Lima', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 12, diasAtraso: 0, scoreImpacto: 24, reincidente: false },
    { id: '14', codigo: 'REST-014', descricao: 'Fornecedor de esquadrias atrasado', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A013', atividadeNome: 'Instalação Esquadrias', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-10'), dataPrevista: new Date('2024-12-10'), responsavel: 'Ana Costa', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 10, diasAtraso: 0, scoreImpacto: 20, reincidente: false },
    { id: '15', codigo: 'REST-015', descricao: 'Material de impermeabilização incorreto', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A014', atividadeNome: 'Impermeabilização Laje', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-20'), dataPrevista: new Date('2024-10-05'), dataConclusao: new Date('2024-10-03'), responsavel: 'Pedro Souza', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 6, diasAtraso: 0, scoreImpacto: 31, reincidente: false },
    { id: '16', codigo: 'REST-016', descricao: 'Tubulação PVC fora de estoque', categoria: CategoriaIshikawa.MATERIAL, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A015', atividadeNome: 'Instalações Hidrossanitárias', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-02', epsNome: 'Bloco B', dataCriacao: new Date('2024-11-15'), dataPrevista: new Date('2024-11-25'), responsavel: 'Lucas Ferreira', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 8, diasAtraso: 6, scoreImpacto: 22, reincidente: false },
    
    { id: '17', codigo: 'REST-017', descricao: 'Escavadeira em manutenção corretiva', categoria: CategoriaIshikawa.MAQUINA, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A016', atividadeNome: 'Escavação', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-25'), dataPrevista: new Date('2024-10-05'), responsavel: 'Marina Oliveira', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 10, diasAtraso: 18, scoreImpacto: 58, reincidente: false },
    { id: '18', codigo: 'REST-018', descricao: 'Grua com capacidade insuficiente', categoria: CategoriaIshikawa.MAQUINA, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A017', atividadeNome: 'Montagem Estrutura Metálica', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-20'), dataPrevista: new Date('2024-11-05'), responsavel: 'Roberto Dias', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 20, diasAtraso: 7, scoreImpacto: 54, reincidente: true },
    { id: '19', codigo: 'REST-019', descricao: 'Betoneira quebrada', categoria: CategoriaIshikawa.MAQUINA, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A018', atividadeNome: 'Concretagem Geral', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-02', epsNome: 'Bloco B', dataCriacao: new Date('2024-11-10'), dataPrevista: new Date('2024-12-01'), responsavel: 'Fernanda Gomes', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 8, diasAtraso: 0, scoreImpacto: 16, reincidente: false },
    { id: '20', codigo: 'REST-020', descricao: 'Elevador de carga indisponível', categoria: CategoriaIshikawa.MAQUINA, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A019', atividadeNome: 'Transporte Vertical', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-25'), dataPrevista: new Date('2024-12-15'), responsavel: 'Thiago Martins', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 5, diasAtraso: 0, scoreImpacto: 10, reincidente: false },
    { id: '21', codigo: 'REST-021', descricao: 'Compressor de ar com vazamento', categoria: CategoriaIshikawa.MAQUINA, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A020', atividadeNome: 'Pintura', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-01'), dataPrevista: new Date('2024-10-15'), dataConclusao: new Date('2024-10-12'), responsavel: 'João Silva', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 6, diasAtraso: 0, scoreImpacto: 12, reincidente: false },
    
    { id: '22', codigo: 'REST-022', descricao: 'Inspeção reprovada pela fiscalização', categoria: CategoriaIshikawa.MEDIDA, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A021', atividadeNome: 'Liberação Estrutural', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-10'), dataPrevista: new Date('2024-10-20'), responsavel: 'Maria Santos', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 12, diasAtraso: 14, scoreImpacto: 62, reincidente: true },
    { id: '23', codigo: 'REST-023', descricao: 'Não conformidade no teste de estanqueidade', categoria: CategoriaIshikawa.MEDIDA, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A022', atividadeNome: 'Teste Hidráulico', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-01'), dataPrevista: new Date('2024-11-15'), responsavel: 'Carlos Lima', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 5, diasAtraso: 4, scoreImpacto: 14, reincidente: false },
    { id: '24', codigo: 'REST-024', descricao: 'Falta de laudo técnico de solo', categoria: CategoriaIshikawa.MEDIDA, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A023', atividadeNome: 'Sondagem', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-02', epsNome: 'Bloco B', dataCriacao: new Date('2024-11-20'), dataPrevista: new Date('2024-12-10'), responsavel: 'Ana Costa', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 8, diasAtraso: 0, scoreImpacto: 36, reincidente: false },
    { id: '25', codigo: 'REST-025', descricao: 'Calibração de instrumentos pendente', categoria: CategoriaIshikawa.MEDIDA, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A024', atividadeNome: 'Medições Topográficas', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-25'), dataPrevista: new Date('2024-12-20'), responsavel: 'Pedro Souza', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 4, diasAtraso: 0, scoreImpacto: 8, reincidente: false },
    { id: '26', codigo: 'REST-026', descricao: 'Ensaio de resistência do concreto pendente', categoria: CategoriaIshikawa.MEDIDA, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A025', atividadeNome: 'Controle Tecnológico', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-15'), dataPrevista: new Date('2024-09-30'), dataConclusao: new Date('2024-09-28'), responsavel: 'Lucas Ferreira', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 10, diasAtraso: 0, scoreImpacto: 32, reincidente: false },
    
    { id: '27', codigo: 'REST-027', descricao: 'Chuvas intensas paralisando obra', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.VENCIDA, atividadeId: 'A026', atividadeNome: 'Terraplenagem', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-10-05'), dataPrevista: new Date('2024-10-25'), responsavel: 'Marina Oliveira', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 15, diasAtraso: 10, scoreImpacto: 55, reincidente: false },
    { id: '28', codigo: 'REST-028', descricao: 'Licença ambiental pendente', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A027', atividadeNome: 'Supressão Vegetal', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-02', epsNome: 'Bloco B', dataCriacao: new Date('2024-10-15'), dataPrevista: new Date('2024-11-01'), responsavel: 'Roberto Dias', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 8, diasAtraso: 9, scoreImpacto: 25, reincidente: true },
    { id: '29', codigo: 'REST-029', descricao: 'Interferência de rede elétrica aérea', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.EM_EXECUCAO, atividadeId: 'A028', atividadeNome: 'Içamento de Peças', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-10'), dataPrevista: new Date('2024-12-05'), responsavel: 'Fernanda Gomes', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 12, diasAtraso: 0, scoreImpacto: 34, reincidente: false },
    { id: '30', codigo: 'REST-030', descricao: 'Embargo por reclamação de vizinhos', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.NO_PRAZO, atividadeId: 'A029', atividadeNome: 'Operações Noturnas', wbsId: 'WBS-04', wbsNome: 'Acabamento', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-20'), dataPrevista: new Date('2024-12-15'), responsavel: 'Thiago Martins', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 5, diasAtraso: 0, scoreImpacto: 10, reincidente: false },
    { id: '31', codigo: 'REST-031', descricao: 'Temperatura alta afetando cura do concreto', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO, atividadeId: 'A030', atividadeNome: 'Concretagem Verão', wbsId: 'WBS-01', wbsNome: 'Estrutura', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-09-01'), dataPrevista: new Date('2024-09-15'), dataConclusao: new Date('2024-09-14'), responsavel: 'João Silva', impactoCaminhoCritico: true, duracaoAtividadeImpactada: 8, diasAtraso: 0, scoreImpacto: 31, reincidente: false },
    { id: '32', codigo: 'REST-032', descricao: 'Autorização do corpo de bombeiros pendente', categoria: CategoriaIshikawa.MEIO_AMBIENTE, status: StatusRestricaoIshikawa.ATRASADA, atividadeId: 'A031', atividadeNome: 'Sistema Incêndio', wbsId: 'WBS-03', wbsNome: 'Instalações', epsId: 'EPS-01', epsNome: 'Edifício Principal', dataCriacao: new Date('2024-11-05'), dataPrevista: new Date('2024-11-20'), responsavel: 'Maria Santos', impactoCaminhoCritico: false, duracaoAtividadeImpactada: 10, diasAtraso: 3, scoreImpacto: 23, reincidente: false },
  ];
  
  return restrictions;
};

const mockEPS = [
  { id: 'EPS-01', nome: 'Edifício Principal' },
  { id: 'EPS-02', nome: 'Bloco B' },
  { id: 'EPS-03', nome: 'Estacionamento' },
];

const mockWBS: Record<string, Array<{ id: string; nome: string }>> = {
  'EPS-01': [
    { id: 'WBS-01', nome: 'Estrutura' },
    { id: 'WBS-02', nome: 'Vedação' },
    { id: 'WBS-03', nome: 'Instalações' },
    { id: 'WBS-04', nome: 'Acabamento' },
  ],
  'EPS-02': [
    { id: 'WBS-01', nome: 'Estrutura' },
    { id: 'WBS-02', nome: 'Vedação' },
    { id: 'WBS-03', nome: 'Instalações' },
  ],
  'EPS-03': [
    { id: 'WBS-05', nome: 'Pavimentação' },
    { id: 'WBS-06', nome: 'Sinalização' },
  ],
};

const mockActivities: Record<string, Array<{ id: string; nome: string }>> = {
  'WBS-01': [
    { id: 'A001', nome: 'Fundação Bloco A' },
    { id: 'A002', nome: 'Montagem Estrutura' },
    { id: 'A004', nome: 'Concretagem Laje' },
  ],
  'WBS-02': [
    { id: 'A003', nome: 'Alvenaria' },
    { id: 'A008', nome: 'Alvenaria Interna' },
  ],
  'WBS-03': [
    { id: 'A005', nome: 'Instalações Hidráulicas' },
    { id: 'A010', nome: 'Instalações Elétricas' },
  ],
  'WBS-04': [
    { id: 'A006', nome: 'Pintura Externa' },
    { id: 'A007', nome: 'Fachada' },
  ],
};

const trendData = [
  { mes: 'Jul', total: 28, concluidas: 8, atrasadas: 12 },
  { mes: 'Ago', total: 32, concluidas: 10, atrasadas: 14 },
  { mes: 'Set', total: 30, concluidas: 12, atrasadas: 10 },
  { mes: 'Out', total: 35, concluidas: 14, atrasadas: 13 },
  { mes: 'Nov', total: 33, concluidas: 11, atrasadas: 15 },
  { mes: 'Dez', total: 32, concluidas: 8, atrasadas: 16 },
];

interface CategoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoriaIshikawa | null;
  restrictions: RestricaoIshikawa[];
  dadosCategoria: DadosIshikawa | null;
}

const CategoryDetailModal: React.FC<CategoryDetailModalProps> = ({
  isOpen,
  onClose,
  category,
  restrictions,
  dadosCategoria
}) => {
  
  if (!isOpen || !category || !dadosCategoria) return null;

  const statusDistribution = [
    { name: 'Concluídas', value: dadosCategoria.concluidas, color: STATUS_COLORS[StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO] },
    { name: 'Em Execução', value: dadosCategoria.emExecucao, color: STATUS_COLORS[StatusRestricaoIshikawa.EM_EXECUCAO] },
    { name: 'No Prazo', value: dadosCategoria.noPrazo, color: STATUS_COLORS[StatusRestricaoIshikawa.NO_PRAZO] },
    { name: 'Atrasadas', value: dadosCategoria.atrasadas, color: STATUS_COLORS[StatusRestricaoIshikawa.ATRASADA] },
    { name: 'Vencidas', value: dadosCategoria.vencidas, color: STATUS_COLORS[StatusRestricaoIshikawa.VENCIDA] },
  ].filter(item => item.value > 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: CATEGORY_COLORS[category] }}>
          <div>
            <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[category]}</h2>
            <p className="text-sm text-white opacity-80">{CATEGORY_DESCRIPTIONS[category]}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X size={24} className="text-white" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribuição por Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="lg:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">{dadosCategoria.concluidas}</div>
                  <div className="text-xs text-green-700">Concluídas</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">{dadosCategoria.emExecucao}</div>
                  <div className="text-xs text-blue-700">Em Execução</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-orange-600">{dadosCategoria.atrasadas}</div>
                  <div className="text-xs text-orange-700">Atrasadas</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">{dadosCategoria.vencidas}</div>
                  <div className="text-xs text-red-700">Vencidas</div>
                </div>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-gray-700 mb-3">Restrições ({restrictions.length})</h3>
          <div className="space-y-2">
            {restrictions.map((rest) => (
              <div
                key={rest.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-md transition-shadow"
                style={{ borderLeftWidth: 4, borderLeftColor: STATUS_COLORS[rest.status] }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-gray-500">{rest.codigo}</span>
                    {rest.reincidente && (
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Reincidente</span>
                    )}
                    {rest.impactoCaminhoCritico && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded">Crítico</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 mt-1">{rest.descricao}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{rest.atividadeNome}</span>
                    <span>•</span>
                    <span>{rest.responsavel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: `${STATUS_COLORS[rest.status]}20`, color: STATUS_COLORS[rest.status] }}
                  >
                    {STATUS_LABELS[rest.status]}
                  </span>
                  {rest.diasAtraso > 0 && (
                    <p className="text-xs text-red-600 mt-1">{rest.diasAtraso} dias atraso</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface IshikawaDiagramProps {
  dadosPorCategoria: DadosIshikawa[];
  onCategoryClick: (category: CategoriaIshikawa) => void;
  totalRestricoes: number;
}

const IshikawaDiagram: React.FC<IshikawaDiagramProps> = ({
  dadosPorCategoria,
  onCategoryClick,
  totalRestricoes
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<CategoriaIshikawa | null>(null);
  const { tema } = useTemaStore();
  
  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';
  
  const spineColor = isDarkMode ? '#64748b' : '#374151';
  
  const topCategories = [
    { cat: CategoriaIshikawa.METODO, label: 'Método' },
    { cat: CategoriaIshikawa.MATERIAL, label: 'Material' },
    { cat: CategoriaIshikawa.MAQUINA, label: 'Máquina' },
  ];
  const bottomCategories = [
    { cat: CategoriaIshikawa.MAO_DE_OBRA, label: 'Mão de Obra' },
    { cat: CategoriaIshikawa.MEIO_AMBIENTE, label: 'Meio Ambiente' },
    { cat: CategoriaIshikawa.MEDIDA, label: 'Medida' },
  ];
  
  const getCategoryData = (cat: CategoriaIshikawa) => dadosPorCategoria.find(d => d.categoria === cat);

  const renderBranch = (
    category: CategoriaIshikawa,
    label: string,
    spineX: number,
    spineY: number,
    isTop: boolean
  ) => {
    const dados = getCategoryData(category);
    const isHovered = hoveredCategory === category;
    const categoryColor = CATEGORY_COLORS[category];
    
    const mainBoneLength = 140;
    const angle = isTop ? -50 : 50;
    const angleRad = (angle * Math.PI) / 180;
    
    const endX = spineX - Math.cos(angleRad) * mainBoneLength;
    const endY = spineY + Math.sin(angleRad) * mainBoneLength;
    
    const labelX = isTop ? endX - 50 : endX - 50;
    const labelY = isTop ? endY - 20 : endY + 20;
    
    return (
      <g 
        key={category}
        className="cursor-pointer"
        onClick={() => onCategoryClick(category)}
        onMouseEnter={() => setHoveredCategory(category)}
        onMouseLeave={() => setHoveredCategory(null)}
      >
        <line
          x1={spineX}
          y1={spineY}
          x2={endX}
          y2={endY}
          stroke={isHovered ? categoryColor : spineColor}
          strokeWidth={isHovered ? 5 : 4}
          strokeLinecap="round"
        />
        
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-55}
            y={-14}
            width={110}
            height={28}
            rx={14}
            fill={categoryColor}
            stroke={isHovered ? 'white' : 'transparent'}
            strokeWidth={2}
            filter={isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}
          />
          <text
            x={0}
            y={5}
            textAnchor="middle"
            fill="white"
            fontSize={12}
            fontWeight="600"
          >
            {label}
          </text>
        </g>
        
        {dados && (
          <g transform={`translate(${labelX + 70}, ${labelY})`}>
            <circle
              r={16}
              fill={dados.vencidas > 0 || dados.atrasadas > 0 ? '#EF4444' : categoryColor}
              stroke="white"
              strokeWidth={2}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            />
            <text
              textAnchor="middle"
              y={5}
              fill="white"
              fontSize={12}
              fontWeight="bold"
            >
              {dados.total}
            </text>
          </g>
        )}
        
        {isHovered && dados && (
          <g transform={`translate(${labelX}, ${isTop ? labelY - 85 : labelY + 55})`}>
            <rect
              x={-75}
              y={-5}
              width={150}
              height={70}
              rx={8}
              fill={isDarkMode ? '#1e293b' : 'white'}
              stroke={categoryColor}
              strokeWidth={2}
              filter="drop-shadow(0 4px 12px rgba(0,0,0,0.2))"
            />
            <text x={-65} y={14} fontSize={11} fill="#22C55E" fontWeight="500">
              Concluídas: {dados.concluidas}
            </text>
            <text x={-65} y={30} fontSize={11} fill="#3B82F6" fontWeight="500">
              Em Execução: {dados.emExecucao}
            </text>
            <text x={-65} y={46} fontSize={11} fill="#EAB308" fontWeight="500">
              No Prazo: {dados.noPrazo}
            </text>
            <text x={25} y={14} fontSize={11} fill="#F97316" fontWeight="500">
              Atrasadas: {dados.atrasadas}
            </text>
            <text x={25} y={30} fontSize={11} fill="#EF4444" fontWeight="500">
              Vencidas: {dados.vencidas}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full rounded-xl overflow-hidden" style={{ backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }}>
      <svg viewBox="0 0 950 400" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 12 4, 0 8" fill="#DC2626" />
          </marker>
        </defs>
        
        <line 
          x1={50} 
          y1={200} 
          x2={780} 
          y2={200} 
          stroke={spineColor}
          strokeWidth={6}
          markerEnd="url(#arrowhead)"
          strokeLinecap="round"
        />
        
        {topCategories.map(({ cat, label }, i) => {
          const spineX = 180 + i * 220;
          return renderBranch(cat, label, spineX, 200, true);
        })}
        
        {bottomCategories.map(({ cat, label }, i) => {
          const spineX = 180 + i * 220;
          return renderBranch(cat, label, spineX, 200, false);
        })}
        
        <g transform="translate(800, 200)">
          <rect
            x={0}
            y={-40}
            width={130}
            height={80}
            rx={8}
            fill="#DC2626"
            filter="drop-shadow(0 4px 12px rgba(220, 38, 38, 0.4))"
          />
          <text
            x={65}
            y={-10}
            textAnchor="middle"
            fill="white"
            fontSize={13}
            fontWeight="600"
          >
            PROBLEMA
          </text>
          <text
            x={65}
            y={25}
            textAnchor="middle"
            fill="white"
            fontSize={26}
            fontWeight="bold"
          >
            {totalRestricoes}
          </text>
        </g>
        
        <text
          x={475}
          y={385}
          textAnchor="middle"
          fill={isDarkMode ? '#64748b' : '#94a3b8'}
          fontSize={11}
          fontStyle="italic"
        >
          Clique em uma categoria para ver detalhes
        </text>
      </svg>
    </div>
  );
};

const AnaliseIshikawaPage: React.FC = () => {
  const { tema } = useTemaStore();
  const [restrictions] = useState<RestricaoIshikawa[]>(generateMockRestrictions());
  
  const [selectedEPS, setSelectedEPS] = useState<string>('');
  const [selectedWBS, setSelectedWBS] = useState<string>('');
  const [selectedActivity, setSelectedActivity] = useState<string>('');
  const [statusFilters, setStatusFilters] = useState<StatusRestricaoIshikawa[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [tableExpanded, setTableExpanded] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<CategoriaIshikawa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const availableWBS = selectedEPS ? mockWBS[selectedEPS] || [] : [];
  const availableActivities = selectedWBS ? mockActivities[selectedWBS] || [] : [];

  const filteredRestrictions = useMemo(() => {
    return restrictions.filter(r => {
      if (selectedEPS && r.epsId !== selectedEPS) return false;
      if (selectedWBS && r.wbsId !== selectedWBS) return false;
      if (selectedActivity && r.atividadeId !== selectedActivity) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(r.status)) return false;
      if (dateFrom && new Date(r.dataPrevista) < new Date(dateFrom)) return false;
      if (dateTo && new Date(r.dataPrevista) > new Date(dateTo)) return false;
      return true;
    });
  }, [restrictions, selectedEPS, selectedWBS, selectedActivity, statusFilters, dateFrom, dateTo]);

  const dadosPorCategoria = useMemo((): DadosIshikawa[] => {
    const categories = Object.values(CategoriaIshikawa);
    return categories.map(cat => {
      const catRestrictions = filteredRestrictions.filter(r => r.categoria === cat);
      return {
        categoria: cat,
        total: catRestrictions.length,
        concluidas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO).length,
        emExecucao: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.EM_EXECUCAO).length,
        noPrazo: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.NO_PRAZO).length,
        atrasadas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA).length,
        vencidas: catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.VENCIDA).length,
        percentualProblemas: catRestrictions.length > 0
          ? ((catRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA || r.status === StatusRestricaoIshikawa.VENCIDA).length / catRestrictions.length) * 100)
          : 0,
        restricoes: catRestrictions,
      };
    });
  }, [filteredRestrictions]);

  const kpis = useMemo((): KPIKaizen => {
    const concluidas = filteredRestrictions.filter(r => r.status === StatusRestricaoIshikawa.CONCLUIDA_NO_PRAZO);
    const atrasadas = filteredRestrictions.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA || r.status === StatusRestricaoIshikawa.VENCIDA);
    const criticas = filteredRestrictions.filter(r => r.impactoCaminhoCritico);
    const reincidentes = filteredRestrictions.filter(r => r.reincidente);
    
    const tmr = concluidas.length > 0
      ? concluidas.reduce((acc, r) => {
          const dias = r.dataConclusao
            ? Math.ceil((r.dataConclusao.getTime() - r.dataCriacao.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          return acc + dias;
        }, 0) / concluidas.length
      : 0;

    return {
      tmr: Math.round(tmr * 10) / 10,
      trc: filteredRestrictions.length > 0 ? Math.round((criticas.length / filteredRestrictions.length) * 100) : 0,
      irp: filteredRestrictions.length > 0 ? Math.round((reincidentes.length / filteredRestrictions.length) * 100) : 0,
      eficacia: filteredRestrictions.length > 0 ? Math.round((concluidas.length / filteredRestrictions.length) * 100) : 0,
      totalRestricoes: filteredRestrictions.length,
      restricoesConcluidas: concluidas.length,
      restricoesAtrasadas: atrasadas.filter(r => r.status === StatusRestricaoIshikawa.ATRASADA).length,
      restricoesVencidas: atrasadas.filter(r => r.status === StatusRestricaoIshikawa.VENCIDA).length,
    };
  }, [filteredRestrictions]);

  const paretoData = useMemo(() => {
    const sorted = [...dadosPorCategoria].sort((a, b) => b.total - a.total);
    let cumulative = 0;
    const total = sorted.reduce((acc, d) => acc + d.total, 0);
    
    return sorted.map(d => {
      cumulative += d.total;
      return {
        categoria: CATEGORY_LABELS[d.categoria],
        quantidade: d.total,
        acumulado: total > 0 ? Math.round((cumulative / total) * 100) : 0,
        fill: CATEGORY_COLORS[d.categoria],
      };
    });
  }, [dadosPorCategoria]);

  const handleCategoryClick = (category: CategoriaIshikawa) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const clearFilters = () => {
    setSelectedEPS('');
    setSelectedWBS('');
    setSelectedActivity('');
    setStatusFilters([]);
    setDateFrom('');
    setDateTo('');
  };

  const toggleStatusFilter = (status: StatusRestricaoIshikawa) => {
    setStatusFilters(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const sortedRestrictions = useMemo(() => {
    return [...filteredRestrictions].sort((a, b) => b.scoreImpacto - a.scoreImpacto);
  }, [filteredRestrictions]);

  const selectedCategoryData = selectedCategory
    ? dadosPorCategoria.find(d => d.categoria === selectedCategory)
    : null;
  
  const selectedCategoryRestrictions = selectedCategory
    ? filteredRestrictions.filter(r => r.categoria === selectedCategory)
    : [];

  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ backgroundColor: tema.background }}>
      <div>
        <h1 className="text-3xl font-bold" style={{ color: tema.text }}>
          Análise Ishikawa - Causa e Efeito
        </h1>
        <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
          Análise de Restrições por Categoria (Metodologia Kaizen - 6M)
        </p>
      </div>

      <div className="rounded-xl shadow-sm border p-4" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>EPS</label>
            <select
              value={selectedEPS}
              onChange={(e) => {
                setSelectedEPS(e.target.value);
                setSelectedWBS('');
                setSelectedActivity('');
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
            >
              <option value="">Todos os EPS</option>
              {mockEPS.map(eps => (
                <option key={eps.id} value={eps.id}>{eps.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>WBS</label>
            <select
              value={selectedWBS}
              onChange={(e) => {
                setSelectedWBS(e.target.value);
                setSelectedActivity('');
              }}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
              disabled={!selectedEPS}
            >
              <option value="">Todos os WBS</option>
              {availableWBS.map(wbs => (
                <option key={wbs.id} value={wbs.id}>{wbs.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>Atividade</label>
            <select
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
              disabled={!selectedWBS}
            >
              <option value="">Todas as Atividades</option>
              {availableActivities.map(act => (
                <option key={act.id} value={act.id}>{act.nome}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>Data Início</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium mb-1" style={{ color: tema.textSecondary }}>Data Fim</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: tema.border, backgroundColor: tema.surface, color: tema.text }}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: tema.border }}>
          <span className="text-sm font-medium" style={{ color: tema.text }}>Status:</span>
          <div className="flex flex-wrap gap-2">
            {Object.values(StatusRestricaoIshikawa).map(status => (
              <button
                key={status}
                onClick={() => toggleStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilters.includes(status) ? 'ring-2 ring-offset-1' : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: `${STATUS_COLORS[status]}20`,
                  color: STATUS_COLORS[status],
                  boxShadow: statusFilters.includes(status) ? `0 0 0 2px ${STATUS_COLORS[status]}` : 'none',
                }}
              >
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
          
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
            style={{ color: tema.textSecondary }}
          >
            <RefreshCw size={16} />
            Limpar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="TMR"
          value={`${kpis.tmr} dias`}
          icon={Clock}
          color={kpis.tmr <= 5 ? 'success' : kpis.tmr <= 7 ? 'warning' : 'danger'}
          subtitle="Tempo Médio Remoção | Meta: < 5 dias"
        />
        <KPICard
          title="TRC"
          value={`${kpis.trc}%`}
          icon={AlertTriangle}
          color={kpis.trc <= 15 ? 'success' : kpis.trc <= 25 ? 'warning' : 'danger'}
          subtitle="Taxa Restrições Críticas | Meta: < 15%"
        />
        <KPICard
          title="IRP"
          value={`${kpis.irp}%`}
          icon={RefreshCw}
          color={kpis.irp <= 5 ? 'success' : kpis.irp <= 10 ? 'warning' : 'danger'}
          subtitle="Índice Reincidência | Meta: < 5%"
        />
        <KPICard
          title="Eficácia Tratativa"
          value={`${kpis.eficacia}%`}
          icon={Target}
          color={kpis.eficacia >= 85 ? 'success' : kpis.eficacia >= 70 ? 'warning' : 'danger'}
          subtitle={`Meta: > 85% | ${kpis.restricoesConcluidas}/${kpis.totalRestricoes}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
          <div className="p-4 border-b" style={{ borderColor: tema.border }}>
            <h2 className="text-lg font-bold" style={{ color: tema.text }}>Diagrama Ishikawa - 6M</h2>
            <p className="text-xs" style={{ color: tema.textSecondary }}>Método, Mão de Obra, Material, Máquina, Medida, Meio Ambiente</p>
          </div>
          <div className="p-4" style={{ height: 420 }}>
            <IshikawaDiagram
              dadosPorCategoria={dadosPorCategoria}
              onCategoryClick={handleCategoryClick}
              totalRestricoes={filteredRestrictions.length}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
            <div className="p-4 border-b" style={{ borderColor: tema.border }}>
              <h2 className="text-lg font-bold" style={{ color: tema.text }}>Pareto - Categorias</h2>
            </div>
            <div className="p-4" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="categoria" tick={{ fontSize: 9, fill: tema.textSecondary }} angle={-15} textAnchor="end" height={50} />
                  <YAxis yAxisId="left" orientation="left" tick={{ fill: tema.textSecondary }} />
                  <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fill: tema.textSecondary }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: tema.surface, 
                      borderColor: tema.border,
                      color: tema.text 
                    }} 
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
                    {paretoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#6366f1" strokeWidth={2} name="Acumulado %" dot={{ fill: '#6366f1' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
            <div className="p-4 border-b" style={{ borderColor: tema.border }}>
              <h2 className="text-lg font-bold" style={{ color: tema.text }}>Tendência Mensal</h2>
            </div>
            <div className="p-4" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e5e7eb'} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: tema.textSecondary }} />
                  <YAxis tick={{ fill: tema.textSecondary }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: tema.surface, 
                      borderColor: tema.border,
                      color: tema.text 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2} name="Total" dot={{ fill: '#6366f1' }} />
                  <Line type="monotone" dataKey="concluidas" stroke="#22c55e" strokeWidth={2} name="Concluídas" dot={{ fill: '#22c55e' }} />
                  <Line type="monotone" dataKey="atrasadas" stroke="#ef4444" strokeWidth={2} name="Atrasadas" dot={{ fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl shadow-sm border overflow-hidden" style={{ backgroundColor: tema.surface, borderColor: tema.border }}>
        <button
          onClick={() => setTableExpanded(!tableExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          style={{ backgroundColor: isDarkMode ? 'transparent' : undefined }}
        >
          <div className="flex items-center gap-3">
            <FileText size={20} style={{ color: tema.primary }} />
            <h2 className="text-lg font-bold" style={{ color: tema.text }}>
              Ranking de Restrições por Impacto ({sortedRestrictions.length})
            </h2>
          </div>
          {tableExpanded ? <ChevronUp size={20} style={{ color: tema.textSecondary }} /> : <ChevronDown size={20} style={{ color: tema.textSecondary }} />}
        </button>
        
        {tableExpanded && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f9fafb' }}>
                <tr>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Código</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Descrição</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Categoria</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Status</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Atividade</th>
                  <th className="text-left p-3 font-medium" style={{ color: tema.textSecondary }}>Responsável</th>
                  <th className="text-center p-3 font-medium" style={{ color: tema.textSecondary }}>Score</th>
                  <th className="text-center p-3 font-medium" style={{ color: tema.textSecondary }}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {sortedRestrictions.slice(0, 15).map((rest, idx) => (
                  <tr 
                    key={rest.id} 
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: tema.border, backgroundColor: isDarkMode && idx % 2 === 0 ? '#1e293b' : 'transparent' }}
                  >
                    <td className="p-3 font-mono text-xs" style={{ color: tema.textSecondary }}>{rest.codigo}</td>
                    <td className="p-3 max-w-xs truncate" style={{ color: tema.text }}>{rest.descricao}</td>
                    <td className="p-3">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: CATEGORY_COLORS[rest.categoria] }}
                      >
                        {CATEGORY_LABELS[rest.categoria]}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${STATUS_COLORS[rest.status]}20`, color: STATUS_COLORS[rest.status] }}
                      >
                        {STATUS_LABELS[rest.status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs" style={{ color: tema.textSecondary }}>{rest.atividadeNome}</td>
                    <td className="p-3 text-xs" style={{ color: tema.textSecondary }}>{rest.responsavel}</td>
                    <td className="p-3 text-center">
                      <span 
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white ${
                          rest.scoreImpacto >= 50 ? 'bg-red-500' : rest.scoreImpacto >= 30 ? 'bg-orange-500' : 'bg-yellow-500'
                        }`}
                      >
                        {rest.scoreImpacto}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rest.impactoCaminhoCritico && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded" title="Caminho Crítico">CC</span>
                        )}
                        {rest.reincidente && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded" title="Reincidente">R</span>
                        )}
                        {rest.diasAtraso > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded" title={`${rest.diasAtraso} dias de atraso`}>
                            {rest.diasAtraso}d
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CategoryDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={selectedCategory}
        restrictions={selectedCategoryRestrictions}
        dadosCategoria={selectedCategoryData || null}
      />
    </div>
  );
};

export default AnaliseIshikawaPage;
