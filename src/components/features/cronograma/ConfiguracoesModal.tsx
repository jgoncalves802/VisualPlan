/**
 * Modal de Configurações do Projeto/Cronograma
 * Permite personalizar formatos de data, cores, comportamentos, etc.
 */

import React, { useState } from 'react';
import { X, Calendar, Eye, Palette, Settings } from 'lucide-react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { FormatoData } from '../../../types/cronograma';
import { getFormatosDisponiveis, formatarData } from '../../../utils/dateFormatter';

interface ConfiguracoesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AbaAtiva = 'datas' | 'exibicao' | 'cores' | 'comportamento';

export const ConfiguracoesModal: React.FC<ConfiguracoesModalProps> = ({ isOpen, onClose }) => {
  const { configuracoes, setConfiguracoes } = useCronogramaStore();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('datas');

  const formatosDisponiveis = getFormatosDisponiveis();
  const dataExemplo = new Date(2009, 0, 28, 12, 33); // 28 de janeiro de 2009, 12:33

  if (!isOpen) return null;

  const handleSalvar = () => {
    onClose();
  };

  const handleRestaurarPadroes = () => {
    if (confirm('Deseja realmente restaurar todas as configurações para os valores padrão?')) {
      // Restaura valores padrão
      setConfiguracoes({
        formato_data_tabela: FormatoData.SEMANA_DIA_MES_ANO,
        formato_data_gantt: FormatoData.DIA_MES,
        formato_data_tooltip: FormatoData.SEMANA_DIA_MES_EXTENSO,
        mostrar_codigo_atividade: true,
        mostrar_progresso_percentual: true,
        destacar_caminho_critico: true,
        permitir_edicao_drag: true,
        auto_calcular_progresso: false,
        cor_tarefa_normal: '#3b82f6',
        cor_tarefa_critica: '#dc2626',
        cor_tarefa_concluida: '#10b981',
        cor_marco: '#8b5cf6',
        cor_fase: '#f59e0b',
      });
    }
  };

  // Agrupa formatos por categoria
  const formatosPorCategoria = formatosDisponiveis.reduce((acc, formato) => {
    if (!acc[formato.categoria]) {
      acc[formato.categoria] = [];
    }
    acc[formato.categoria].push(formato);
    return acc;
  }, {} as Record<string, typeof formatosDisponiveis>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Configurações do Projeto</h2>
              <p className="text-sm text-gray-500">Personalize a visualização e comportamento do cronograma</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setAbaAtiva('datas')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'datas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Formatos de Data
          </button>
          <button
            onClick={() => setAbaAtiva('exibicao')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'exibicao'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Exibição
          </button>
          <button
            onClick={() => setAbaAtiva('cores')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'cores'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            Cores e Tema
          </button>
          <button
            onClick={() => setAbaAtiva('comportamento')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'comportamento'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            Comportamento
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* ABA: Formatos de Data */}
          {abaAtiva === 'datas' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600">
                Configure como as datas serão exibidas na tabela, no Gantt e nos tooltips.
                Escolha formatos diferentes para cada área para melhor aproveitamento do espaço.
              </p>

              {/* Formato da Tabela */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato na Tabela de Atividades
                </label>
                <select
                  value={configuracoes.formato_data_tabela}
                  onChange={(e) =>
                    setConfiguracoes({ formato_data_tabela: e.target.value as FormatoData })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(formatosPorCategoria).map(([categoria, formatos]) => (
                    <optgroup key={categoria} label={categoria}>
                      {formatos.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label} - {f.exemplo}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800 font-medium mb-1">Preview:</p>
                  <p className="text-sm text-blue-900">
                    {formatarData(dataExemplo, configuracoes.formato_data_tabela)}
                  </p>
                </div>
              </div>

              {/* Formato do Gantt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato no Gantt (Timeline)
                </label>
                <select
                  value={configuracoes.formato_data_gantt}
                  onChange={(e) =>
                    setConfiguracoes({ formato_data_gantt: e.target.value as FormatoData })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(formatosPorCategoria).map(([categoria, formatos]) => (
                    <optgroup key={categoria} label={categoria}>
                      {formatos.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label} - {f.exemplo}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-800 font-medium mb-1">Preview:</p>
                  <p className="text-sm text-green-900">
                    {formatarData(dataExemplo, configuracoes.formato_data_gantt)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Recomendado usar formato compacto para economia de espaço no timeline
                </p>
              </div>

              {/* Formato do Tooltip */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato nos Tooltips
                </label>
                <select
                  value={configuracoes.formato_data_tooltip}
                  onChange={(e) =>
                    setConfiguracoes({ formato_data_tooltip: e.target.value as FormatoData })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(formatosPorCategoria).map(([categoria, formatos]) => (
                    <optgroup key={categoria} label={categoria}>
                      {formatos.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label} - {f.exemplo}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs text-purple-800 font-medium mb-1">Preview:</p>
                  <p className="text-sm text-purple-900">
                    {formatarData(dataExemplo, configuracoes.formato_data_tooltip)}
                  </p>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  💡 Recomendado usar formato por extenso para melhor legibilidade
                </p>
              </div>
            </div>
          )}

          {/* ABA: Exibição */}
          {abaAtiva === 'exibicao' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-6">
                Configure quais elementos serão exibidos no cronograma.
              </p>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_codigo_atividade}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_codigo_atividade: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Mostrar código da atividade</p>
                  <p className="text-sm text-gray-600">
                    Exibe o código junto com o nome (ex: "A001 - Planejamento")
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_progresso_percentual}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_progresso_percentual: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Mostrar progresso percentual</p>
                  <p className="text-sm text-gray-600">
                    Exibe o percentual de conclusão nas barras do Gantt
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.destacar_caminho_critico}
                  onChange={(e) =>
                    setConfiguracoes({ destacar_caminho_critico: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Destacar caminho crítico</p>
                  <p className="text-sm text-gray-600">
                    Aplica cor diferenciada para atividades no caminho crítico
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* ABA: Cores e Tema */}
          {abaAtiva === 'cores' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-6">
                Personalize as cores das atividades no cronograma.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarefa Normal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={configuracoes.cor_tarefa_normal}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_normal: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={configuracoes.cor_tarefa_normal}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_normal: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarefa Crítica
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={configuracoes.cor_tarefa_critica}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_critica: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={configuracoes.cor_tarefa_critica}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_critica: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#dc2626"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tarefa Concluída
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={configuracoes.cor_tarefa_concluida}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_concluida: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={configuracoes.cor_tarefa_concluida}
                      onChange={(e) => setConfiguracoes({ cor_tarefa_concluida: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marco</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={configuracoes.cor_marco}
                      onChange={(e) => setConfiguracoes({ cor_marco: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={configuracoes.cor_marco}
                      onChange={(e) => setConfiguracoes({ cor_marco: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fase/Grupo
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={configuracoes.cor_fase}
                      onChange={(e) => setConfiguracoes({ cor_fase: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={configuracoes.cor_fase}
                      onChange={(e) => setConfiguracoes({ cor_fase: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: Comportamento */}
          {abaAtiva === 'comportamento' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-6">
                Configure como o cronograma se comporta durante a interação.
              </p>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.permitir_edicao_drag}
                  onChange={(e) =>
                    setConfiguracoes({ permitir_edicao_drag: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Permitir edição por arrastar</p>
                  <p className="text-sm text-gray-600">
                    Permite arrastar as barras do Gantt para alterar datas e duração
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.auto_calcular_progresso}
                  onChange={(e) =>
                    setConfiguracoes({ auto_calcular_progresso: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Auto-calcular progresso</p>
                  <p className="text-sm text-gray-600">
                    Calcula automaticamente o progresso baseado nas atividades filhas (hierarquia)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleRestaurarPadroes}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Restaurar Padrões
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

