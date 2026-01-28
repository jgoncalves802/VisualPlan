import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { CriterioMedicao, CriterioMedicaoEtapa } from '../../../types/criteriosMedicao.types';

interface CriteriosMedicaoListPanelProps {
  empresaId: string;
  projetoId?: string;
  onClose?: () => void;
}

const CriteriosMedicaoListPanel: React.FC<CriteriosMedicaoListPanelProps> = ({
  empresaId,
  projetoId,
  onClose,
}) => {
  const [criterios, setCriterios] = useState<CriterioMedicao[]>([]);
  const [etapasMap, setEtapasMap] = useState<Record<string, CriterioMedicaoEtapa[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedCriterios, setExpandedCriterios] = useState<Set<string>>(new Set());
  const [editingCriterio, setEditingCriterio] = useState<string | null>(null);
  const [editingEtapa, setEditingEtapa] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CriterioMedicao>>({});
  const [editEtapaForm, setEditEtapaForm] = useState<Partial<CriterioMedicaoEtapa>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCriterios();
  }, [empresaId, projetoId]);

  const loadCriterios = async () => {
    setLoading(true);
    try {
      const data = await criteriosMedicaoService.getCriterios({
        empresaId,
        projetoId,
      });
      setCriterios(data);

      const etapas: Record<string, CriterioMedicaoEtapa[]> = {};
      for (const criterio of data) {
        const criterioEtapas = await criteriosMedicaoService.getEtapasByCriterio(criterio.id);
        etapas[criterio.id] = criterioEtapas;
      }
      setEtapasMap(etapas);
    } catch (error) {
      console.error('Erro ao carregar critérios:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (criterioId: string) => {
    const newExpanded = new Set(expandedCriterios);
    if (newExpanded.has(criterioId)) {
      newExpanded.delete(criterioId);
    } else {
      newExpanded.add(criterioId);
    }
    setExpandedCriterios(newExpanded);
  };

  const startEditCriterio = (criterio: CriterioMedicao) => {
    setEditingCriterio(criterio.id);
    setEditForm({
      codigo: criterio.codigo,
      descritivo: criterio.descritivo,
    });
  };

  const cancelEditCriterio = () => {
    setEditingCriterio(null);
    setEditForm({});
  };

  const saveCriterio = async (criterioId: string) => {
    setSaving(true);
    try {
      await criteriosMedicaoService.updateCriterio(criterioId, editForm);
      await loadCriterios();
      setEditingCriterio(null);
      setEditForm({});
    } catch (error) {
      console.error('Erro ao salvar critério:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteCriterio = async (criterioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este critério e todas as suas etapas?')) {
      return;
    }
    try {
      await criteriosMedicaoService.deleteCriterio(criterioId);
      await loadCriterios();
    } catch (error) {
      console.error('Erro ao excluir critério:', error);
    }
  };

  const startEditEtapa = (etapa: CriterioMedicaoEtapa) => {
    setEditingEtapa(etapa.id);
    setEditEtapaForm({
      numeroEtapa: etapa.numeroEtapa,
      descritivo: etapa.descritivo,
      percentual: etapa.percentual,
    });
  };

  const cancelEditEtapa = () => {
    setEditingEtapa(null);
    setEditEtapaForm({});
  };

  const saveEtapa = async (etapaId: string) => {
    setSaving(true);
    try {
      await criteriosMedicaoService.updateEtapa(etapaId, editEtapaForm);
      await loadCriterios();
      setEditingEtapa(null);
      setEditEtapaForm({});
    } catch (error) {
      console.error('Erro ao salvar etapa:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteEtapa = async (etapaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta etapa?')) {
      return;
    }
    try {
      await criteriosMedicaoService.deleteEtapa(etapaId);
      await loadCriterios();
    } catch (error) {
      console.error('Erro ao excluir etapa:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin theme-text-secondary" />
      </div>
    );
  }

  return (
    <div className="theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
        <div>
          <h3 className="text-lg font-medium theme-text">Critérios de Medição</h3>
          <p className="text-sm theme-text-secondary mt-1">{criterios.length} critérios cadastrados</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--color-surface-tertiary)' }}
          >
            <X className="w-4 h-4 theme-text" />
          </button>
        )}
      </div>

      {criterios.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm theme-text-secondary">Nenhum critério de medição cadastrado.</p>
          <p className="text-sm theme-text-secondary mt-1">Use o botão "Importar Critérios de Medição" para adicionar.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {criterios.map((criterio) => {
            const isExpanded = expandedCriterios.has(criterio.id);
            const etapas = etapasMap[criterio.id] || [];
            const isEditing = editingCriterio === criterio.id;

            return (
              <div key={criterio.id}>
                <div
                  className="p-4 flex items-center gap-3 hover:bg-opacity-50 cursor-pointer"
                  style={{ backgroundColor: isExpanded ? 'var(--color-surface-secondary)' : 'transparent' }}
                >
                  <button
                    onClick={() => toggleExpand(criterio.id)}
                    className="p-1 rounded hover:opacity-80"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 theme-text-secondary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 theme-text-secondary" />
                    )}
                  </button>

                  {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editForm.codigo || ''}
                        onChange={(e) => setEditForm({ ...editForm, codigo: e.target.value })}
                        className="px-2 py-1 text-sm rounded border theme-text"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        placeholder="Código"
                      />
                      <input
                        type="text"
                        value={editForm.descritivo || ''}
                        onChange={(e) => setEditForm({ ...editForm, descritivo: e.target.value })}
                        className="flex-1 px-2 py-1 text-sm rounded border theme-text"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                        placeholder="Descritivo"
                      />
                      <button
                        onClick={() => saveCriterio(criterio.id)}
                        disabled={saving}
                        className="p-1 rounded text-green-600 hover:bg-green-50"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditCriterio}
                        className="p-1 rounded text-gray-500 hover:bg-gray-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1" onClick={() => toggleExpand(criterio.id)}>
                        <span className="font-medium theme-text">{criterio.codigo}</span>
                        <span className="mx-2 theme-text-secondary">-</span>
                        <span className="theme-text">{criterio.descritivo}</span>
                        <span className="ml-2 text-xs theme-text-secondary">({etapas.length} etapas)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditCriterio(criterio); }}
                          className="p-1 rounded hover:bg-opacity-80 theme-text-secondary hover:theme-text"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCriterio(criterio.id); }}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isExpanded && etapas.length > 0 && (
                  <div className="pl-12 pr-4 pb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                          <th className="text-left py-2 px-2 font-medium theme-text-secondary">Etapa</th>
                          <th className="text-left py-2 px-2 font-medium theme-text-secondary">Descrição</th>
                          <th className="text-right py-2 px-2 font-medium theme-text-secondary">Percentual</th>
                          <th className="text-right py-2 px-2 font-medium theme-text-secondary w-20">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {etapas.map((etapa) => {
                          const isEditingThisEtapa = editingEtapa === etapa.id;

                          return (
                            <tr key={etapa.id} className="border-b hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)' }}>
                              {isEditingThisEtapa ? (
                                <>
                                  <td className="py-2 px-2">
                                    <input
                                      type="number"
                                      value={editEtapaForm.numeroEtapa || 0}
                                      onChange={(e) => setEditEtapaForm({ ...editEtapaForm, numeroEtapa: parseInt(e.target.value) })}
                                      className="w-full px-2 py-1 text-sm rounded border theme-text"
                                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                                    />
                                  </td>
                                  <td className="py-2 px-2">
                                    <input
                                      type="text"
                                      value={editEtapaForm.descritivo || ''}
                                      onChange={(e) => setEditEtapaForm({ ...editEtapaForm, descritivo: e.target.value })}
                                      className="w-full px-2 py-1 text-sm rounded border theme-text"
                                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-right">
                                    <input
                                      type="number"
                                      value={editEtapaForm.percentual || 0}
                                      onChange={(e) => setEditEtapaForm({ ...editEtapaForm, percentual: parseFloat(e.target.value) })}
                                      className="w-20 px-2 py-1 text-sm rounded border theme-text text-right"
                                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                                      step="0.01"
                                      min="0"
                                      max="100"
                                    />
                                  </td>
                                  <td className="py-2 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => saveEtapa(etapa.id)}
                                        disabled={saving}
                                        className="p-1 rounded text-green-600 hover:bg-green-50"
                                      >
                                        <Save className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelEditEtapa}
                                        className="p-1 rounded text-gray-500 hover:bg-gray-100"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-2 px-2 theme-text">{etapa.numeroEtapa}</td>
                                  <td className="py-2 px-2 theme-text">{etapa.descritivo || '-'}</td>
                                  <td className="py-2 px-2 text-right theme-text">{etapa.percentual.toFixed(2)}%</td>
                                  <td className="py-2 px-2 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        onClick={() => startEditEtapa(etapa)}
                                        className="p-1 rounded hover:bg-opacity-80 theme-text-secondary hover:theme-text"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => deleteEtapa(etapa.id)}
                                        className="p-1 rounded text-red-500 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CriteriosMedicaoListPanel;
