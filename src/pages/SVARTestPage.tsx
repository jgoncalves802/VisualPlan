/**
 * Página de teste para SVAR Gantt Integration
 * Valida funcionalidades de indent/outdent antes de substituir VisionGantt
 */

import React from 'react';
import { SVARGanttWrapper } from '../lib/svar-gantt/SVARGanttWrapper';
import type { AtividadeMock, DependenciaAtividade } from '../types/cronograma';
import { TipoDependencia } from '../types/cronograma';

const mockAtividades: AtividadeMock[] = [
  {
    id: '1',
    projeto_id: 'proj-1',
    nome: 'Fase 1 - Planejamento',
    tipo: 'Fase',
    data_inicio: '2025-01-01',
    data_fim: '2025-01-31',
    duracao_dias: 30,
    progresso: 50,
    status: 'Em Andamento',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    projeto_id: 'proj-1',
    nome: 'Atividade 1.1 - Levantamento',
    tipo: 'Tarefa',
    parent_id: '1',
    data_inicio: '2025-01-01',
    data_fim: '2025-01-15',
    duracao_dias: 15,
    progresso: 100,
    status: 'Concluída',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    projeto_id: 'proj-1',
    nome: 'Atividade 1.2 - Documentação',
    tipo: 'Tarefa',
    parent_id: '1',
    data_inicio: '2025-01-16',
    data_fim: '2025-01-31',
    duracao_dias: 15,
    progresso: 30,
    status: 'Em Andamento',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    projeto_id: 'proj-1',
    nome: 'Fase 2 - Execução',
    tipo: 'Fase',
    data_inicio: '2025-02-01',
    data_fim: '2025-03-31',
    duracao_dias: 60,
    progresso: 0,
    status: 'A Fazer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    projeto_id: 'proj-1',
    nome: 'Atividade 2.1 - Fundações',
    tipo: 'Tarefa',
    parent_id: '4',
    data_inicio: '2025-02-01',
    data_fim: '2025-02-28',
    duracao_dias: 28,
    progresso: 0,
    status: 'A Fazer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    projeto_id: 'proj-1',
    nome: 'Milestone: Estrutura Concluída',
    tipo: 'Marco',
    data_inicio: '2025-03-01',
    data_fim: '2025-03-01',
    duracao_dias: 0,
    progresso: 0,
    status: 'A Fazer',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockDependencias: DependenciaAtividade[] = [
  {
    id: 'dep-1',
    atividade_origem_id: '2',
    atividade_destino_id: '3',
    tipo: TipoDependencia.FS,
    lag_dias: 0,
  },
  {
    id: 'dep-2',
    atividade_origem_id: '3',
    atividade_destino_id: '4',
    tipo: TipoDependencia.FS,
    lag_dias: 0,
  },
];

export const SVARTestPage: React.FC = () => {
  const handleAtividadeUpdate = (atividade: AtividadeMock, changes: Partial<AtividadeMock>) => {
    console.log('Atividade atualizada:', atividade.id, changes);
  };

  const handleDependenciaCreate = (dep: DependenciaAtividade) => {
    console.log('Dependência criada:', dep);
  };

  const handleDependenciaUpdate = async (depId: string, updates: { tipo: TipoDependencia; lag_dias: number }) => {
    console.log('Dependência atualizada:', depId, updates);
  };

  const handleDependenciaDelete = (depId: string) => {
    console.log('Dependência excluída:', depId);
  };

  const handleAtividadeClick = (atividade: AtividadeMock) => {
    console.log('Atividade clicada:', atividade);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">SVAR Gantt - Teste de Integração</h1>
        <p className="text-gray-600 mb-6">
          Teste as funcionalidades de indent/outdent com <span className="font-mono bg-gray-200 px-1 rounded">Shift+→</span> e <span className="font-mono bg-gray-200 px-1 rounded">Shift+←</span>
        </p>

        <SVARGanttWrapper
          atividades={mockAtividades}
          dependencias={mockDependencias}
          projetoId="proj-1"
          onAtividadeUpdate={handleAtividadeUpdate}
          onDependenciaCreate={handleDependenciaCreate}
          onDependenciaUpdate={handleDependenciaUpdate}
          onDependenciaDelete={handleDependenciaDelete}
          onAtividadeClick={handleAtividadeClick}
          height={500}
        />

        <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Instruções de Teste:</h3>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Selecione uma tarefa clicando nela</li>
            <li>Use <strong>Shift+→</strong> para indentar (tornar subtarefa)</li>
            <li>Use <strong>Shift+←</strong> para desidentar (mover para nível superior)</li>
            <li>Observe as mudanças no console do navegador</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SVARTestPage;
