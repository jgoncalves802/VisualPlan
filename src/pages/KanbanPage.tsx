import React, { useState } from 'react';
import { StatusTarefa, TarefaUsuario } from '../types';
import { Clock, User, AlertCircle } from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';

const KanbanPage: React.FC = () => {
  const { tema } = useTemaStore();
  
  // Mock data
  const [tarefas, setTarefas] = useState<TarefaUsuario[]>([
    {
      id: '1',
      titulo: 'Concretagem Laje P3',
      descricao: 'Executar concretagem da laje do 3º pavimento',
      status: StatusTarefa.A_FAZER,
      usuarioId: '1',
      prioridade: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      titulo: 'Resolver restrição de material',
      descricao: 'Providenciar entrega de aço atrasada',
      status: StatusTarefa.FAZENDO,
      usuarioId: '1',
      prioridade: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      titulo: 'Inspeção de qualidade P2',
      descricao: 'Fiscalização aprovar laje P2',
      status: StatusTarefa.CONCLUIDO,
      usuarioId: '1',
      prioridade: 0,
      dataCheckIn: new Date(),
      dataCheckOut: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const columns = [
    { id: StatusTarefa.A_FAZER, title: 'A Fazer', color: tema.info },
    { id: StatusTarefa.FAZENDO, title: 'Fazendo', color: tema.warning },
    { id: StatusTarefa.CONCLUIDO, title: 'Concluído', color: tema.success }
  ];

  const getTarefasPorStatus = (status: StatusTarefa) => {
    return tarefas.filter(t => t.status === status);
  };

  const handleCheckIn = (tarefaId: string) => {
    setTarefas(tarefas.map(t => 
      t.id === tarefaId 
        ? { ...t, status: StatusTarefa.FAZENDO, dataCheckIn: new Date() }
        : t
    ));
  };

  const handleCheckOut = (tarefaId: string) => {
    setTarefas(tarefas.map(t => 
      t.id === tarefaId 
        ? { ...t, status: StatusTarefa.CONCLUIDO, dataCheckOut: new Date() }
        : t
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold theme-text">Minhas Tarefas</h1>
        <p className="text-sm theme-text-secondary mt-1">
          Gerencie suas atividades e ações de tratativa
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">A Fazer</p>
              <p className="text-2xl font-bold theme-text">
                {getTarefasPorStatus(StatusTarefa.A_FAZER).length}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.info}20`, color: tema.info }}
            >
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Em Andamento</p>
              <p className="text-2xl font-bold theme-text">
                {getTarefasPorStatus(StatusTarefa.FAZENDO).length}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.warning}20`, color: tema.warning }}
            >
              <Clock size={24} />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Concluídas</p>
              <p className="text-2xl font-bold theme-text">
                {getTarefasPorStatus(StatusTarefa.CONCLUIDO).length}
              </p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.success}20`, color: tema.success }}
            >
              <User size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(column => {
          const columnTarefas = getTarefasPorStatus(column.id);
          
          return (
            <div key={column.id} className="kanban-column">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-semibold theme-text">{column.title}</h3>
                </div>
                <span 
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: `${column.color}20`,
                    color: column.color
                  }}
                >
                  {columnTarefas.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTarefas.map(tarefa => (
                  <div key={tarefa.id} className="kanban-card">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium theme-text text-sm">
                        {tarefa.titulo}
                      </h4>
                      {tarefa.prioridade > 0 && (
                        <span className="badge badge-danger text-xs">
                          P{tarefa.prioridade}
                        </span>
                      )}
                    </div>
                    
                    {tarefa.descricao && (
                      <p className="text-xs theme-text-secondary mb-3">
                        {tarefa.descricao}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs theme-text-secondary">
                        <Clock size={14} />
                        <span>{new Date(tarefa.createdAt).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      {tarefa.status === StatusTarefa.A_FAZER && (
                        <button
                          onClick={() => handleCheckIn(tarefa.id)}
                          className="text-xs font-medium px-3 py-1 rounded"
                          style={{ 
                            backgroundColor: `${tema.warning}20`,
                            color: tema.warning
                          }}
                        >
                          Check-In
                        </button>
                      )}
                      
                      {tarefa.status === StatusTarefa.FAZENDO && (
                        <button
                          onClick={() => handleCheckOut(tarefa.id)}
                          className="text-xs font-medium px-3 py-1 rounded"
                          style={{ 
                            backgroundColor: `${tema.success}20`,
                            color: tema.success
                          }}
                        >
                          Check-Out
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KanbanPage;
