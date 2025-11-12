/**
 * Modal para gerenciar Linhas de Base (Baselines)
 * Permite salvar, visualizar e comparar versões do cronograma
 */

import React, { useState, useEffect } from 'react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';

interface BaselineModalProps {
  open: boolean;
  onClose: () => void;
  projetoId: string;
}

interface Baseline {
  id: string;
  nome: string;
  descricao?: string;
  data_criacao: string;
  criado_por?: string;
  ativo: boolean;
}

export const BaselineModal: React.FC<BaselineModalProps> = ({ open, onClose, projetoId }) => {
  const { atividades } = useCronogramaStore();
  const [baselines, setBaselines] = useState<Baseline[]>([]);
  const [novaBaseline, setNovaBaseline] = useState({ nome: '', descricao: '' });
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    // Carregar baselines salvas do localStorage
    const savedBaselines = localStorage.getItem(`baselines-${projetoId}`);
    if (savedBaselines) {
      setBaselines(JSON.parse(savedBaselines));
    }
  }, [projetoId]);

  const salvarBaseline = () => {
    if (!novaBaseline.nome.trim()) {
      alert('Digite um nome para a linha de base');
      return;
    }

    // Criar snapshot das atividades atuais
    const snapshot = atividades.map((ativ) => ({
      id: ativ.id,
      nome: ativ.nome,
      data_inicio: ativ.data_inicio,
      data_fim: ativ.data_fim,
      duracao: ativ.duracao,
      progresso: ativ.progresso,
    }));

    const novaBaselineObj: Baseline = {
      id: `baseline-${Date.now()}`,
      nome: novaBaseline.nome,
      descricao: novaBaseline.descricao,
      data_criacao: new Date().toISOString(),
      criado_por: 'Usuário Atual', // Substituir com usuário real
      ativo: true,
    };

    // Salvar snapshot no localStorage
    localStorage.setItem(
      `baseline-snapshot-${novaBaselineObj.id}`,
      JSON.stringify(snapshot)
    );

    const novasBaselines = [...baselines, novaBaselineObj];
    setBaselines(novasBaselines);
    localStorage.setItem(`baselines-${projetoId}`, JSON.stringify(novasBaselines));

    // Aplicar baseline às atividades atuais
    aplicarBaselineAAtividades(snapshot);

    setNovaBaseline({ nome: '', descricao: '' });
    setMostrarForm(false);
    alert('Linha de base salva com sucesso!');
  };

  const aplicarBaselineAAtividades = (snapshot: any[]) => {
    // Atualizar as atividades com dados de baseline
    atividades.forEach((ativ) => {
      const baselineData = snapshot.find((s) => s.id === ativ.id);
      if (baselineData) {
        // Adicionar campos de baseline à atividade
        (ativ as any).baseline_start = baselineData.data_inicio;
        (ativ as any).baseline_end = baselineData.data_fim;
        (ativ as any).baseline_duration = baselineData.duracao;
      }
    });
  };

  const ativarBaseline = (baseline: Baseline) => {
    const snapshot = localStorage.getItem(`baseline-snapshot-${baseline.id}`);
    if (snapshot) {
      aplicarBaselineAAtividades(JSON.parse(snapshot));

      // Marcar como ativa
      const novasBaselines = baselines.map((b) => ({
        ...b,
        ativo: b.id === baseline.id,
      }));
      setBaselines(novasBaselines);
      localStorage.setItem(`baselines-${projetoId}`, JSON.stringify(novasBaselines));

      alert(`Linha de base "${baseline.nome}" ativada!`);
      window.location.reload(); // Recarregar para aplicar mudanças
    }
  };

  const excluirBaseline = (baseline: Baseline) => {
    if (!confirm(`Deseja realmente excluir a linha de base "${baseline.nome}"?`)) {
      return;
    }

    // Remover snapshot
    localStorage.removeItem(`baseline-snapshot-${baseline.id}`);

    // Remover baseline
    const novasBaselines = baselines.filter((b) => b.id !== baseline.id);
    setBaselines(novasBaselines);
    localStorage.setItem(`baselines-${projetoId}`, JSON.stringify(novasBaselines));
  };

  const limparTodasBaselines = () => {
    if (!confirm('Deseja realmente limpar todas as linhas de base? Esta ação não pode ser desfeita.')) {
      return;
    }

    // Remover todos os snapshots
    baselines.forEach((b) => {
      localStorage.removeItem(`baseline-snapshot-${b.id}`);
    });

    // Limpar lista
    setBaselines([]);
    localStorage.removeItem(`baselines-${projetoId}`);

    // Remover baseline das atividades
    atividades.forEach((ativ) => {
      delete (ativ as any).baseline_start;
      delete (ativ as any).baseline_end;
      delete (ativ as any).baseline_duration;
    });

    alert('Todas as linhas de base foram removidas.');
    window.location.reload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <div>
              <h2 className="text-xl font-bold">Linhas de Base (Baselines)</h2>
              <p className="text-sm text-blue-100">Salve e compare versões do cronograma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Nova Baseline */}
          {!mostrarForm ? (
            <button
              onClick={() => setMostrarForm(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border-2 border-dashed border-blue-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">Salvar Nova Linha de Base</span>
            </button>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-3">Nova Linha de Base</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Linha de Base *
                  </label>
                  <input
                    type="text"
                    value={novaBaseline.nome}
                    onChange={(e) => setNovaBaseline({ ...novaBaseline, nome: e.target.value })}
                    placeholder="Ex: Planejamento Inicial, Revisão 1, etc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição (opcional)
                  </label>
                  <textarea
                    value={novaBaseline.descricao}
                    onChange={(e) => setNovaBaseline({ ...novaBaseline, descricao: e.target.value })}
                    placeholder="Descreva o motivo desta linha de base..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={salvarBaseline}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setNovaBaseline({ nome: '', descricao: '' });
                      setMostrarForm(false);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de Baselines */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Linhas de Base Salvas ({baselines.length})</h3>
              {baselines.length > 0 && (
                <button
                  onClick={limparTodasBaselines}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Limpar Todas
                </button>
              )}
            </div>

            {baselines.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-600 font-medium">Nenhuma linha de base salva</p>
                <p className="text-sm text-gray-500 mt-1">
                  Salve uma versão do cronograma para comparar mais tarde
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {baselines.map((baseline) => (
                  <div
                    key={baseline.id}
                    className={`border rounded-lg p-4 ${
                      baseline.ativo
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-white hover:border-gray-400'
                    } transition`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{baseline.nome}</h4>
                          {baseline.ativo && (
                            <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full font-medium">
                              Ativa
                            </span>
                          )}
                        </div>
                        {baseline.descricao && (
                          <p className="text-sm text-gray-600 mb-2">{baseline.descricao}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(baseline.data_criacao).toLocaleString('pt-BR')}
                          </span>
                          {baseline.criado_por && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {baseline.criado_por}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {!baseline.ativo && (
                          <button
                            onClick={() => ativarBaseline(baseline)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
                            title="Ativar esta linha de base"
                          >
                            Ativar
                          </button>
                        )}
                        <button
                          onClick={() => excluirBaseline(baseline)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition"
                          title="Excluir linha de base"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ O que é uma Linha de Base?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Snapshot do cronograma em um momento específico</li>
              <li>• Permite comparar planejado vs. realizado</li>
              <li>• Essencial para análise de variações</li>
              <li>• Pode salvar múltiplas versões (revisões)</li>
            </ul>
          </div>
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

