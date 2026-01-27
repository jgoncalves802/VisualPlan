/**
 * Modal de Configurações do Projeto/Cronograma
 * Permite personalizar formatos de data, cores, comportamentos, etc.
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, Eye, Palette, Settings, Keyboard, RotateCcw, Layers, Plus, Trash2, ChevronDown, ChevronRight, Edit2, Save } from 'lucide-react';
import { useCronogramaStore } from '../../../stores/cronogramaStore';
import { useKeyboardShortcutsStore, SHORTCUT_CATEGORIES, KeyboardShortcut } from '../../../stores/keyboardShortcutsStore';
import { FormatoData } from '../../../types/cronograma';
import { getFormatosDisponiveis, formatarData } from '../../../utils/dateFormatter';
import { takeoffService } from '../../../services/takeoffService';
import { useAuthStore } from '../../../stores/authStore';
import type { TakeoffDisciplina, TakeoffColunaConfig, TipoColuna } from '../../../types/takeoff.types';

interface ConfiguracoesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AbaAtiva = 'datas' | 'exibicao' | 'cores' | 'comportamento' | 'atalhos' | 'disciplinas';

interface EditingColuna extends TakeoffColunaConfig {
  isNew?: boolean;
}

export const ConfiguracoesModal: React.FC<ConfiguracoesModalProps> = ({ isOpen, onClose }) => {
  const { configuracoes, setConfiguracoes } = useCronogramaStore();
  const { toggleShortcut, resetShortcut, resetAllShortcuts, formatShortcut, getShortcutsByCategory } = useKeyboardShortcutsStore();
  const { usuario } = useAuthStore();
  const [abaAtiva, setAbaAtiva] = useState<AbaAtiva>('datas');
  
  // Estado para aba de disciplinas
  const [disciplinas, setDisciplinas] = useState<TakeoffDisciplina[]>([]);
  const [disciplinaExpandida, setDisciplinaExpandida] = useState<string | null>(null);
  const [colunasMap, setColunasMap] = useState<Record<string, TakeoffColunaConfig[]>>({});
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);
  const [editingColuna, setEditingColuna] = useState<EditingColuna | null>(null);
  const [savingColuna, setSavingColuna] = useState(false);

  const formatosDisponiveis = getFormatosDisponiveis();
  const dataExemplo = new Date(2009, 0, 28, 12, 33); // 28 de janeiro de 2009, 12:33

  // Carregar disciplinas quando aba for selecionada
  useEffect(() => {
    if (abaAtiva === 'disciplinas' && usuario?.empresaId && disciplinas.length === 0) {
      loadDisciplinas();
    }
  }, [abaAtiva, usuario?.empresaId]);

  const loadDisciplinas = async () => {
    if (!usuario?.empresaId) return;
    setLoadingDisciplinas(true);
    try {
      const data = await takeoffService.getDisciplinas(usuario.empresaId);
      setDisciplinas(data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoadingDisciplinas(false);
    }
  };

  const loadColunas = async (disciplinaId: string) => {
    try {
      const colunas = await takeoffService.getColunasConfig(disciplinaId);
      setColunasMap(prev => ({ ...prev, [disciplinaId]: colunas }));
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
    }
  };

  const handleExpandDisciplina = async (disciplinaId: string) => {
    if (disciplinaExpandida === disciplinaId) {
      setDisciplinaExpandida(null);
    } else {
      setDisciplinaExpandida(disciplinaId);
      if (!colunasMap[disciplinaId]) {
        await loadColunas(disciplinaId);
      }
    }
  };

  const handleAddColuna = (disciplinaId: string) => {
    const colunas = colunasMap[disciplinaId] || [];
    const newColuna: EditingColuna = {
      id: `new-${Date.now()}`,
      disciplinaId,
      nome: '',
      codigo: '',
      tipo: 'text' as TipoColuna,
      casasDecimais: 0,
      obrigatoria: false,
      visivel: true,
      ordem: colunas.length + 1,
      largura: 100,
      isNew: true,
    };
    setEditingColuna(newColuna);
  };

  const handleEditColuna = (coluna: TakeoffColunaConfig) => {
    setEditingColuna({ ...coluna, isNew: false });
  };

  const handleSaveColuna = async () => {
    if (!editingColuna) return;
    
    // Validação
    if (!editingColuna.nome.trim()) {
      alert('O nome da coluna é obrigatório.');
      return;
    }
    if (!editingColuna.codigo.trim()) {
      alert('O código da coluna é obrigatório.');
      return;
    }
    
    // Verificar código único na disciplina
    const colunasExistentes = colunasMap[editingColuna.disciplinaId] || [];
    const codigoDuplicado = colunasExistentes.find(
      c => c.codigo === editingColuna.codigo && c.id !== editingColuna.id
    );
    if (codigoDuplicado) {
      alert(`Já existe uma coluna com o código "${editingColuna.codigo}" nesta disciplina.`);
      return;
    }
    
    setSavingColuna(true);
    try {
      if (editingColuna.isNew) {
        await takeoffService.createColunaConfig({
          disciplinaId: editingColuna.disciplinaId,
          nome: editingColuna.nome,
          codigo: editingColuna.codigo,
          tipo: editingColuna.tipo,
          formula: editingColuna.formula,
          opcoes: editingColuna.opcoes,
          unidade: editingColuna.unidade,
          casasDecimais: editingColuna.casasDecimais,
          obrigatoria: editingColuna.obrigatoria,
          visivel: editingColuna.visivel,
          ordem: editingColuna.ordem,
          largura: editingColuna.largura,
        });
      } else {
        await takeoffService.updateColunaConfig(editingColuna.id, {
          nome: editingColuna.nome,
          codigo: editingColuna.codigo,
          tipo: editingColuna.tipo,
          formula: editingColuna.formula,
          opcoes: editingColuna.opcoes,
          unidade: editingColuna.unidade,
          casasDecimais: editingColuna.casasDecimais,
          obrigatoria: editingColuna.obrigatoria,
          visivel: editingColuna.visivel,
          ordem: editingColuna.ordem,
          largura: editingColuna.largura,
        });
      }
      await loadColunas(editingColuna.disciplinaId);
      setEditingColuna(null);
    } catch (error) {
      console.error('Erro ao salvar coluna:', error);
    } finally {
      setSavingColuna(false);
    }
  };

  const handleDeleteColuna = async (coluna: TakeoffColunaConfig) => {
    if (!confirm(`Deseja realmente excluir a coluna "${coluna.nome}"?`)) return;
    try {
      await takeoffService.deleteColunaConfig(coluna.id);
      await loadColunas(coluna.disciplinaId);
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
    }
  };

  const tiposColuna: { value: TipoColuna; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número Inteiro' },
    { value: 'decimal', label: 'Número Decimal' },
    { value: 'select', label: 'Lista de Opções' },
    { value: 'date', label: 'Data' },
    { value: 'percentage', label: 'Percentual' },
    { value: 'calculated', label: 'Calculado (Fórmula)' },
  ];

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
        escala_topo: 'week',
        escala_sub: 'day',
        mostrar_codigo_atividade: true,
        mostrar_progresso_percentual: true,
        destacar_caminho_critico: true,
        mostrar_grid: true,
        mostrar_linha_hoje: true,
        mostrar_links: true,
        mostrar_rotulo_barras: true,
        mostrar_coluna_predecessores: true,
        mostrar_coluna_sucessores: true,
        expandir_grupos: true,
        largura_grid: 360,
        altura_linha: 32,
        permitir_edicao_drag: true,
        auto_calcular_progresso: false,
        habilitar_auto_scheduling: true,
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
          <button
            onClick={() => setAbaAtiva('atalhos')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'atalhos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Atalhos
          </button>
          <button
            onClick={() => setAbaAtiva('disciplinas')}
            className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
              abaAtiva === 'disciplinas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Disciplinas
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
                Configure os elementos visuais da timeline e da grid do cronograma.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Escala do Gráfico</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Escala Principal
                      </label>
                      <select
                        value={configuracoes.escala_topo}
                        onChange={(e) =>
                          setConfiguracoes({ escala_topo: e.target.value as typeof configuracoes.escala_topo })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="hour">Horas</option>
                        <option value="day">Dias</option>
                        <option value="week">Semanas</option>
                        <option value="month">Meses</option>
                        <option value="year">Anos</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Subdivisão
                      </label>
                      <select
                        value={configuracoes.escala_sub}
                        onChange={(e) =>
                          setConfiguracoes({ escala_sub: e.target.value as typeof configuracoes.escala_sub })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="none">Sem subdivisão</option>
                        <option value="minute">Minutos</option>
                        <option value="hour">Horas</option>
                        <option value="day">Dias</option>
                        <option value="week">Semanas</option>
                        <option value="month">Meses</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Layout da Grid</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Largura da Grid (px)
                      </label>
                      <input
                        type="range"
                        min={240}
                        max={520}
                        step={10}
                        value={configuracoes.largura_grid}
                        onChange={(e) => setConfiguracoes({ largura_grid: Number(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Atual: <span className="font-semibold">{configuracoes.largura_grid}px</span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Altura das Linhas (px)
                      </label>
                      <input
                        type="range"
                        min={24}
                        max={48}
                        step={2}
                        value={configuracoes.altura_linha}
                        onChange={(e) => setConfiguracoes({ altura_linha: Number(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Atual: <span className="font-semibold">{configuracoes.altura_linha}px</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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
                  checked={configuracoes.mostrar_grid}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_grid: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Exibir grid lateral</p>
                  <p className="text-sm text-gray-600">
                    Mostra a tabela com colunas e hierarquia das atividades.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_linha_hoje}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_linha_hoje: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Destacar data de hoje</p>
                  <p className="text-sm text-gray-600">
                    Exibe uma linha vertical indicando o dia atual na timeline.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_links}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_links: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Mostrar setas de dependência</p>
                  <p className="text-sm text-gray-600">
                    Exibe visualmente as relações entre as atividades (predecessoras e sucessoras).
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
                    Exibe o percentual de conclusão nas barras do Gantt.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_rotulo_barras}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_rotulo_barras: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Exibir rótulo nas barras</p>
                  <p className="text-sm text-gray-600">
                    Mostra o nome ou percentual diretamente dentro das barras do Gantt.
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
                    Aplica cor diferenciada para atividades no caminho crítico.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_coluna_predecessores}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_coluna_predecessores: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Coluna de predecessoras</p>
                  <p className="text-sm text-gray-600">
                    Exibe as atividades que antecedem diretamente cada linha.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.mostrar_coluna_sucessores}
                  onChange={(e) =>
                    setConfiguracoes({ mostrar_coluna_sucessores: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Coluna de sucessoras</p>
                  <p className="text-sm text-gray-600">
                    Exibe as atividades que dependem diretamente da atividade atual.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.expandir_grupos}
                  onChange={(e) =>
                    setConfiguracoes({ expandir_grupos: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Expandir hierarquia ao carregar</p>
                  <p className="text-sm text-gray-600">
                    Mantém fases e subgrupos abertos automaticamente na inicialização.
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

              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={configuracoes.habilitar_auto_scheduling}
                  onChange={(e) =>
                    setConfiguracoes({ habilitar_auto_scheduling: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Auto-ajustar dependências</p>
                  <p className="text-sm text-gray-600">
                    Recalcula datas automaticamente quando dependências são alteradas (Auto Scheduling)
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* ABA: Atalhos de Teclado */}
          {abaAtiva === 'atalhos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Configure os atalhos de teclado para navegação e edição do cronograma.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Deseja restaurar todos os atalhos para os valores padrão?')) {
                      resetAllShortcuts();
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar Padrões
                </button>
              </div>

              {(Object.keys(SHORTCUT_CATEGORIES) as Array<keyof typeof SHORTCUT_CATEGORIES>).map((category) => {
                const categoryShortcuts = getShortcutsByCategory(category);
                if (categoryShortcuts.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      {SHORTCUT_CATEGORIES[category].label}
                    </h4>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut) => (
                        <div
                          key={shortcut.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            shortcut.enabled 
                              ? 'bg-white border-gray-200' 
                              : 'bg-gray-50 border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex-1">
                            <p className={`font-medium ${shortcut.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                              {shortcut.name}
                            </p>
                            <p className="text-xs text-gray-500">{shortcut.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              {shortcut.modifiers.ctrl && (
                                <span className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">Ctrl</span>
                              )}
                              {shortcut.modifiers.alt && (
                                <span className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">Alt</span>
                              )}
                              {shortcut.modifiers.shift && (
                                <span className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-700 rounded">Shift</span>
                              )}
                              <span className="px-2 py-0.5 text-xs font-mono bg-blue-50 text-blue-700 rounded border border-blue-200">
                                {formatShortcut({ ...shortcut, modifiers: {} } as KeyboardShortcut)}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={shortcut.enabled}
                                onChange={(e) => toggleShortcut(shortcut.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                            <button
                              onClick={() => resetShortcut(shortcut.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Restaurar padrão"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700">
                  <strong>Dica:</strong> Use Alt + Scroll do mouse sobre a timeline para fazer zoom. 
                  Use clique direito em uma atividade para abrir o menu de contexto.
                </p>
              </div>
            </div>
          )}

          {/* ABA: Disciplinas */}
          {abaAtiva === 'disciplinas' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configure as colunas disponíveis para cada disciplina de levantamento. 
                Você pode adicionar, editar ou remover colunas conforme necessário.
              </p>

              {loadingDisciplinas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : disciplinas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma disciplina encontrada.</p>
                  <p className="text-sm">As disciplinas serão criadas automaticamente ao acessar o módulo de Levantamento.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {disciplinas.map((disciplina) => (
                    <div key={disciplina.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleExpandDisciplina(disciplina.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: disciplina.cor }}
                          />
                          <span className="font-medium text-gray-900">{disciplina.nome}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                            {disciplina.codigo}
                          </span>
                        </div>
                        {disciplinaExpandida === disciplina.id ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {disciplinaExpandida === disciplina.id && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-700">Colunas Configuradas</h4>
                            <button
                              onClick={() => handleAddColuna(disciplina.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Nova Coluna
                            </button>
                          </div>

                          {!colunasMap[disciplina.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            </div>
                          ) : colunasMap[disciplina.id].length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">Nenhuma coluna configurada.</p>
                          ) : (
                            <div className="space-y-2">
                              {colunasMap[disciplina.id].map((coluna) => (
                                <div
                                  key={coluna.id}
                                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg"
                                >
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">{coluna.nome}</span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs text-gray-500">{coluna.codigo}</span>
                                        <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">
                                          {tiposColuna.find(t => t.value === coluna.tipo)?.label || coluna.tipo}
                                        </span>
                                        {coluna.obrigatoria && (
                                          <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-600 rounded">Obrigatória</span>
                                        )}
                                        {!coluna.visivel && (
                                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-600 rounded">Oculta</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditColuna(coluna)}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteColuna(coluna)}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal de Edição de Coluna */}
              {editingColuna && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {editingColuna.isNew ? 'Nova Coluna' : 'Editar Coluna'}
                      </h3>
                      <button
                        onClick={() => setEditingColuna(null)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                          <input
                            type="text"
                            value={editingColuna.nome}
                            onChange={(e) => setEditingColuna({ ...editingColuna, nome: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Diâmetro"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                          <input
                            type="text"
                            value={editingColuna.codigo}
                            onChange={(e) => setEditingColuna({ ...editingColuna, codigo: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: diametro"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                          <select
                            value={editingColuna.tipo}
                            onChange={(e) => setEditingColuna({ ...editingColuna, tipo: e.target.value as TipoColuna })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {tiposColuna.map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Largura (px)</label>
                          <input
                            type="number"
                            value={editingColuna.largura}
                            onChange={(e) => setEditingColuna({ ...editingColuna, largura: Number(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={50}
                            max={400}
                          />
                        </div>
                      </div>

                      {(editingColuna.tipo === 'decimal' || editingColuna.tipo === 'percentage') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Casas Decimais</label>
                            <input
                              type="number"
                              value={editingColuna.casasDecimais}
                              onChange={(e) => setEditingColuna({ ...editingColuna, casasDecimais: Number(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              min={0}
                              max={6}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                            <input
                              type="text"
                              value={editingColuna.unidade || ''}
                              onChange={(e) => setEditingColuna({ ...editingColuna, unidade: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ex: m, kg, un"
                            />
                          </div>
                        </div>
                      )}

                      {editingColuna.tipo === 'select' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Opções (uma por linha)
                          </label>
                          <textarea
                            value={(editingColuna.opcoes || []).join('\n')}
                            onChange={(e) => setEditingColuna({ 
                              ...editingColuna, 
                              opcoes: e.target.value.split('\n').filter(o => o.trim()) 
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                          />
                        </div>
                      )}

                      {editingColuna.tipo === 'calculated' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fórmula
                          </label>
                          <input
                            type="text"
                            value={editingColuna.formula || ''}
                            onChange={(e) => setEditingColuna({ ...editingColuna, formula: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: diametro * soldas"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Use os códigos das outras colunas para criar a fórmula.
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingColuna.obrigatoria}
                            onChange={(e) => setEditingColuna({ ...editingColuna, obrigatoria: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Obrigatória</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingColuna.visivel}
                            onChange={(e) => setEditingColuna({ ...editingColuna, visivel: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Visível</span>
                        </label>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                        <input
                          type="number"
                          value={editingColuna.ordem}
                          onChange={(e) => setEditingColuna({ ...editingColuna, ordem: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min={1}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setEditingColuna(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveColuna}
                        disabled={savingColuna || !editingColuna.nome || !editingColuna.codigo}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        {savingColuna ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

