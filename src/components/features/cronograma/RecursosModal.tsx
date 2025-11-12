/**
 * Modal para Gerenciamento de Recursos
 * Permite criar, editar e alocar recursos às tarefas
 */

import React, { useState, useEffect } from 'react';

interface Recurso {
  id: string;
  nome: string;
  tipo: 'Humano' | 'Material' | 'Equipamento';
  unidade: string;
  custo_hora?: number;
  disponibilidade: number; // Percentual 0-100
  cor?: string;
}

interface AlocacaoRecurso {
  recurso_id: string;
  atividade_id: string;
  quantidade: number;
  percentual_alocacao: number;
}

interface RecursosModalProps {
  open: boolean;
  onClose: () => void;
}

export const RecursosModal: React.FC<RecursosModalProps> = ({ open, onClose }) => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [alocacoes, setAlocacoes] = useState<AlocacaoRecurso[]>([]);
  const [tabAtiva, setTabAtiva] = useState<'recursos' | 'alocacoes'>('recursos');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
  
  const [formData, setFormData] = useState<Partial<Recurso>>({
    nome: '',
    tipo: 'Humano',
    unidade: 'h',
    custo_hora: 0,
    disponibilidade: 100,
    cor: '#3B82F6',
  });

  useEffect(() => {
    // Carregar recursos do localStorage
    const savedRecursos = localStorage.getItem('recursos');
    if (savedRecursos) {
      setRecursos(JSON.parse(savedRecursos));
    } else {
      // Recursos padrão
      const recursosDefault: Recurso[] = [
        { id: 'rec-1', nome: 'Engenheiro Civil', tipo: 'Humano', unidade: 'h', custo_hora: 150, disponibilidade: 100, cor: '#3B82F6' },
        { id: 'rec-2', nome: 'Pedreiro', tipo: 'Humano', unidade: 'h', custo_hora: 80, disponibilidade: 100, cor: '#10B981' },
        { id: 'rec-3', nome: 'Eletricista', tipo: 'Humano', unidade: 'h', custo_hora: 90, disponibilidade: 100, cor: '#F59E0B' },
        { id: 'rec-4', nome: 'Cimento (sc)', tipo: 'Material', unidade: 'sc', custo_hora: 35, disponibilidade: 100, cor: '#6B7280' },
        { id: 'rec-5', nome: 'Betoneira', tipo: 'Equipamento', unidade: 'h', custo_hora: 50, disponibilidade: 100, cor: '#8B5CF6' },
      ];
      setRecursos(recursosDefault);
      localStorage.setItem('recursos', JSON.stringify(recursosDefault));
    }

    const savedAlocacoes = localStorage.getItem('alocacoes-recursos');
    if (savedAlocacoes) {
      setAlocacoes(JSON.parse(savedAlocacoes));
    }
  }, []);

  const salvarRecurso = () => {
    if (!formData.nome?.trim()) {
      alert('Digite um nome para o recurso');
      return;
    }

    if (recursoEditando) {
      // Editar recurso existente
      const novosRecursos = recursos.map((r) =>
        r.id === recursoEditando.id ? { ...r, ...formData } : r
      );
      setRecursos(novosRecursos);
      localStorage.setItem('recursos', JSON.stringify(novosRecursos));
    } else {
      // Criar novo recurso
      const novoRecurso: Recurso = {
        id: `rec-${Date.now()}`,
        nome: formData.nome!,
        tipo: formData.tipo || 'Humano',
        unidade: formData.unidade || 'h',
        custo_hora: formData.custo_hora || 0,
        disponibilidade: formData.disponibilidade || 100,
        cor: formData.cor || '#3B82F6',
      };

      const novosRecursos = [...recursos, novoRecurso];
      setRecursos(novosRecursos);
      localStorage.setItem('recursos', JSON.stringify(novosRecursos));
    }

    limparForm();
  };

  const editarRecurso = (recurso: Recurso) => {
    setRecursoEditando(recurso);
    setFormData(recurso);
    setMostrarForm(true);
  };

  const excluirRecurso = (recurso: Recurso) => {
    if (!confirm(`Deseja realmente excluir o recurso "${recurso.nome}"?`)) {
      return;
    }

    const novosRecursos = recursos.filter((r) => r.id !== recurso.id);
    setRecursos(novosRecursos);
    localStorage.setItem('recursos', JSON.stringify(novosRecursos));

    // Remover alocações deste recurso
    const novasAlocacoes = alocacoes.filter((a) => a.recurso_id !== recurso.id);
    setAlocacoes(novasAlocacoes);
    localStorage.setItem('alocacoes-recursos', JSON.stringify(novasAlocacoes));
  };

  const limparForm = () => {
    setFormData({
      nome: '',
      tipo: 'Humano',
      unidade: 'h',
      custo_hora: 0,
      disponibilidade: 100,
      cor: '#3B82F6',
    });
    setRecursoEditando(null);
    setMostrarForm(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">Gerenciamento de Recursos</h2>
              <p className="text-sm text-purple-100">Gerencia recursos humanos, materiais e equipamentos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-purple-800 rounded-lg p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTabAtiva('recursos')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              tabAtiva === 'recursos'
                ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Recursos ({recursos.length})
            </span>
          </button>
          <button
            onClick={() => setTabAtiva('alocacoes')}
            className={`flex-1 px-6 py-3 font-medium transition ${
              tabAtiva === 'alocacoes'
                ? 'text-purple-700 border-b-2 border-purple-700 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Alocações ({alocacoes.length})
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {tabAtiva === 'recursos' ? (
            <div>
              {/* Form de novo recurso */}
              {!mostrarForm ? (
                <button
                  onClick={() => setMostrarForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border-2 border-dashed border-purple-300 mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">Adicionar Novo Recurso</span>
                </button>
              ) : (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {recursoEditando ? 'Editar Recurso' : 'Novo Recurso'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input
                        type="text"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Ex: Engenheiro Civil"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Humano">Humano</option>
                        <option value="Material">Material</option>
                        <option value="Equipamento">Equipamento</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                      <input
                        type="text"
                        value={formData.unidade}
                        onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                        placeholder="h, un, m³, kg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custo/Hora (R$)</label>
                      <input
                        type="number"
                        value={formData.custo_hora}
                        onChange={(e) => setFormData({ ...formData, custo_hora: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Disponibilidade (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.disponibilidade}
                        onChange={(e) => setFormData({ ...formData, disponibilidade: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                      <input
                        type="color"
                        value={formData.cor}
                        onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                        className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={salvarRecurso}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                    >
                      {recursoEditando ? 'Salvar Alterações' : 'Criar Recurso'}
                    </button>
                    <button
                      onClick={limparForm}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Lista de Recursos */}
              {recursos.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">Nenhum recurso cadastrado</p>
                  <p className="text-sm text-gray-500 mt-1">Adicione recursos para alocar às tarefas</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {recursos.map((recurso) => (
                    <div
                      key={recurso.id}
                      className="border border-gray-300 rounded-lg p-4 hover:border-purple-400 transition flex items-center gap-4"
                    >
                      <div
                        className="w-12 h-12 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: recurso.cor }}
                      ></div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{recurso.nome}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Tipo:</span> {recurso.tipo}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Unidade:</span> {recurso.unidade}
                          </span>
                          {recurso.custo_hora && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">Custo:</span> R$ {recurso.custo_hora.toFixed(2)}/{recurso.unidade}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="font-medium">Disponível:</span> {recurso.disponibilidade}%
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editarRecurso(recurso)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => excluirRecurso(recurso)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-600 font-medium">Alocar recursos às tarefas</p>
                <p className="text-sm text-gray-500 mt-1">
                  Ao criar/editar uma tarefa, você poderá alocar recursos a ela
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

