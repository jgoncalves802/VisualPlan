import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Upload, 
  Download, 
  LayoutGrid,
  Link2,
  Calendar,
  FileText,
  Settings,
  BarChart3,
  Loader2,
  ChevronRight,
  ChevronDown,
  Search,
  X,
  RefreshCw,
  Edit2,
  Trash2,
  Layers,
  Unlink,
  Save,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { useTakeoffStore } from '../stores/takeoffStore';
import { useEpsStore } from '../stores/epsStore';
import { takeoffService } from '../services/takeoffService';
import { exportarTemplateTakeoff } from '../services/exportService';
import TakeoffGrid from '../components/features/takeoff/TakeoffGrid';
import TakeoffDashboard from '../components/features/takeoff/TakeoffDashboard';
import TakeoffImportModal from '../components/features/takeoff/TakeoffImportModal';
import TakeoffMapaModal from '../components/features/takeoff/TakeoffMapaModal';
import TakeoffDisciplinaModal from '../components/features/takeoff/TakeoffDisciplinaModal';
import TakeoffDocumentoModal from '../components/features/takeoff/TakeoffDocumentoModal';
import TakeoffConfirmDialog from '../components/features/takeoff/TakeoffConfirmDialog';
import type { TakeoffVinculo, TakeoffMedicao, TakeoffDocumento, TakeoffColunaConfig, TakeoffDisciplina, TipoColuna } from '../types/takeoff.types';
import { useToast } from '../components/ui/Toast';

type TabType = 'dashboard' | 'mapas' | 'vinculos' | 'medicoes' | 'documentos' | 'config';

// =====================================================
// VinculosTab Component - Grouped by Mapa with inline editing
// =====================================================
interface VinculosTabProps {
  vinculos: TakeoffVinculo[];
  onRefresh: () => Promise<void>;
}

const VinculosTab: React.FC<VinculosTabProps> = ({ vinculos, onRefresh }) => {
  const toast = useToast();
  const [expandedMapas, setExpandedMapas] = useState<Set<string>>(new Set(['__no_mapa__']));
  const [editingVinculoId, setEditingVinculoId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ peso: number }>({ peso: 100 });
  const [isSaving, setIsSaving] = useState(false);

  // Group vinculos by mapa
  const vinculosByMapa = React.useMemo(() => {
    const grouped: Record<string, { mapaNome: string; vinculos: TakeoffVinculo[] }> = {};
    
    vinculos.forEach(v => {
      const mapaId = v.mapa?.id || '__no_mapa__';
      const mapaNome = v.mapa?.nome || 'Sem Mapa';
      
      if (!grouped[mapaId]) {
        grouped[mapaId] = { mapaNome, vinculos: [] };
      }
      grouped[mapaId].vinculos.push(v);
    });
    
    return grouped;
  }, [vinculos]);

  const toggleMapa = (mapaId: string) => {
    setExpandedMapas(prev => {
      const next = new Set(prev);
      if (next.has(mapaId)) {
        next.delete(mapaId);
      } else {
        next.add(mapaId);
      }
      return next;
    });
  };

  const handleStartEdit = (vinculo: TakeoffVinculo) => {
    setEditingVinculoId(vinculo.id);
    setEditValues({ peso: vinculo.peso });
  };

  const handleCancelEdit = () => {
    setEditingVinculoId(null);
    setEditValues({ peso: 100 });
  };

  const handleSaveEdit = async (vinculoId: string) => {
    setIsSaving(true);
    try {
      await takeoffService.updateVinculo(vinculoId, { peso: editValues.peso });
      await onRefresh();
      setEditingVinculoId(null);
      toast.success('Peso atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar vínculo:', err);
      toast.error('Erro ao atualizar peso');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteVinculo = async (vinculoId: string) => {
    if (!window.confirm('Deseja remover este vínculo?')) return;
    
    setIsSaving(true);
    try {
      await takeoffService.deleteVinculo(vinculoId);
      await onRefresh();
      toast.success('Vínculo removido!');
    } catch (err) {
      console.error('Erro ao excluir vínculo:', err);
      toast.error('Erro ao remover vínculo');
    } finally {
      setIsSaving(false);
    }
  };

  const mapaIds = Object.keys(vinculosByMapa);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium theme-text">Vínculos com Cronograma</h3>
          <p className="text-sm theme-text-secondary mt-1">{vinculos.length} vínculos em {mapaIds.length} mapa(s)</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-1.5 text-sm theme-text-secondary hover:theme-text rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {mapaIds.map(mapaId => {
        const { mapaNome, vinculos: mapaVinculos } = vinculosByMapa[mapaId];
        const isExpanded = expandedMapas.has(mapaId);
        
        return (
          <div key={mapaId} className="theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
            {/* Mapa Header */}
            <button
              onClick={() => toggleMapa(mapaId)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 theme-text-secondary" />
                ) : (
                  <ChevronRight className="w-5 h-5 theme-text-secondary" />
                )}
                <Layers className="w-5 h-5 theme-text-secondary" />
                <span className="font-medium theme-text">{mapaNome}</span>
                <span className="px-2 py-0.5 text-xs rounded-full theme-text-secondary" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                  {mapaVinculos.length} itens
                </span>
              </div>
            </button>

            {/* Mapa Content */}
            {isExpanded && (
              <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                      <th className="text-left py-2 px-4 font-medium theme-text-secondary">Item Take-off</th>
                      <th className="text-left py-2 px-4 font-medium theme-text-secondary">Código</th>
                      <th className="text-left py-2 px-4 font-medium theme-text-secondary">Atividade</th>
                      <th className="text-right py-2 px-4 font-medium theme-text-secondary">Peso (%)</th>
                      <th className="text-right py-2 px-4 font-medium theme-text-secondary">Peso (Un.)</th>
                      <th className="text-right py-2 px-4 font-medium theme-text-secondary">Progresso</th>
                      <th className="text-center py-2 px-4 font-medium theme-text-secondary w-24">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mapaVinculos.map((v) => {
                      const isEditing = editingVinculoId === v.id;
                      const pesoUnidades = v.item ? (v.item.qtdPrevista * v.peso / 100) : 0;
                      
                      return (
                        <tr key={v.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="py-2 px-4 theme-text max-w-[200px] truncate" title={v.item?.descricao}>
                            {v.item?.descricao || v.itemId}
                          </td>
                          <td className="py-2 px-4">
                            <span className="px-2 py-0.5 text-xs font-mono rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                              {v.atividade?.codigo || '-'}
                            </span>
                          </td>
                          <td className="py-2 px-4 theme-text-secondary max-w-[180px] truncate" title={v.atividade?.nome}>
                            {v.atividade?.nome || v.atividadeId.slice(0, 8) + '...'}
                          </td>
                          <td className="py-2 px-4 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editValues.peso}
                                onChange={(e) => setEditValues({ peso: Number(e.target.value) })}
                                className="w-16 px-2 py-1 text-right text-sm border rounded theme-text"
                                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                              />
                            ) : (
                              <span className="theme-text">{v.peso}%</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-right theme-text-secondary">
                            {isEditing 
                              ? ((v.item?.qtdPrevista || 0) * editValues.peso / 100).toFixed(2)
                              : pesoUnidades.toFixed(2)
                            } {v.item?.unidade}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                              {v.item?.percentualExecutado?.toFixed(1) || 0}%
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(v.id)}
                                    disabled={isSaving}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                                    title="Salvar"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition"
                                    title="Cancelar"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(v)}
                                    className="p-1.5 theme-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                                    title="Editar peso"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteVinculo(v.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                                    title="Remover vínculo"
                                  >
                                    <Unlink className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
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
  );
};

const TakeoffPage: React.FC = () => {
  const { usuario } = useAuthStore();
  const toast = useToast();
  const { 
    disciplinas, 
    mapas,
    selectedDisciplinaId,
    selectedMapaId,
    selectedProjetoId,
    isLoading,
    loadDisciplinas,
    initializeDisciplinas,
    loadMapas,
    setSelectedDisciplina,
    setSelectedMapa,
    setSelectedProjeto,
  } = useTakeoffStore();
  
  const { projetos, loadProjetos } = useEpsStore();

  const [activeTab, setActiveTab] = useState<TabType>('mapas');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMapaModal, setShowMapaModal] = useState(false);
  const [showDisciplinaModal, setShowDisciplinaModal] = useState(false);
  const [showDocumentoModal, setShowDocumentoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingDisciplina, setEditingDisciplina] = useState<TakeoffDisciplina | null>(null);
  const [deletingDisciplinaId, setDeletingDisciplinaId] = useState<string | null>(null);
  const [editingDocumento, setEditingDocumento] = useState<TakeoffDocumento | null>(null);
  const [deletingDocumentoId, setDeletingDocumentoId] = useState<string | null>(null);
  const [showDeleteDocumentoConfirm, setShowDeleteDocumentoConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [vinculos, setVinculos] = useState<TakeoffVinculo[]>([]);
  const [medicoes, setMedicoes] = useState<TakeoffMedicao[]>([]);
  const [documentos, setDocumentos] = useState<TakeoffDocumento[]>([]);
  const [colunasConfig, setColunasConfig] = useState<TakeoffColunaConfig[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  
  // Estados para edição de colunas
  const [editingColuna, setEditingColuna] = useState<(TakeoffColunaConfig & { isNew?: boolean }) | null>(null);
  const [savingColuna, setSavingColuna] = useState(false);
  const [deletingColunaId, setDeletingColunaId] = useState<string | null>(null);
  const [showDeleteColunaConfirm, setShowDeleteColunaConfirm] = useState(false);

  const tiposColuna: { value: TipoColuna; label: string }[] = [
    { value: 'text', label: 'Texto' },
    { value: 'number', label: 'Número' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'date', label: 'Data' },
    { value: 'select', label: 'Lista' },
    { value: 'calculated', label: 'Fórmula' },
    { value: 'percentage', label: 'Percentual' },
    { value: 'reference', label: 'Referência' },
  ];

  useEffect(() => {
    if (usuario?.empresaId) {
      loadDisciplinas(usuario.empresaId);
      loadProjetos(usuario.empresaId);
    }
  }, [usuario?.empresaId, loadDisciplinas, loadProjetos]);

  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'vinculos') {
        setLoadingTab(true);
        try {
          const data = await takeoffService.getAllVinculos();
          setVinculos(data);
        } catch (error) {
          console.error('Erro ao carregar vínculos:', error);
          setVinculos([]);
        } finally {
          setLoadingTab(false);
        }
      } else if (activeTab === 'medicoes') {
        setLoadingTab(true);
        try {
          const data = await takeoffService.getAllMedicoes();
          setMedicoes(data);
        } catch (error) {
          console.error('Erro ao carregar medições:', error);
          setMedicoes([]);
        } finally {
          setLoadingTab(false);
        }
      } else if (activeTab === 'documentos') {
        if (!selectedProjetoId) {
          setDocumentos([]);
          return;
        }
        setLoadingTab(true);
        try {
          const data = await takeoffService.getDocumentos(selectedProjetoId, selectedDisciplinaId || undefined);
          setDocumentos(data);
        } catch (error) {
          console.error('Erro ao carregar documentos:', error);
          setDocumentos([]);
        } finally {
          setLoadingTab(false);
        }
      } else if (activeTab === 'config') {
        if (!selectedDisciplinaId) {
          setColunasConfig([]);
          return;
        }
        setLoadingTab(true);
        try {
          const data = await takeoffService.getColunasConfig(selectedDisciplinaId);
          setColunasConfig(data);
        } catch (error) {
          console.error('Erro ao carregar colunas:', error);
          setColunasConfig([]);
        } finally {
          setLoadingTab(false);
        }
      }
    };
    loadTabData();
  }, [activeTab, selectedProjetoId, selectedDisciplinaId]);

  const handleInitializeDisciplinas = async () => {
    if (usuario?.empresaId) {
      await initializeDisciplinas(usuario.empresaId);
    }
  };

  const handleProjetoChange = (projetoId: string) => {
    setSelectedProjeto(projetoId);
    loadMapas(projetoId, selectedDisciplinaId || undefined);
  };

  const handleDisciplinaChange = (disciplinaId: string | null) => {
    setSelectedDisciplina(disciplinaId);
    if (selectedProjetoId) {
      loadMapas(selectedProjetoId, disciplinaId || undefined);
    }
  };

  const handleMapaSelect = (mapaId: string) => {
    setSelectedMapa(mapaId);
    setActiveTab('mapas');
  };

  const handleDisciplinaSave = (_disciplina: TakeoffDisciplina) => {
    if (usuario?.empresaId) {
      loadDisciplinas(usuario.empresaId);
    }
    setEditingDisciplina(null);
  };

  const handleEditDisciplina = (disciplina: TakeoffDisciplina) => {
    setEditingDisciplina(disciplina);
    setShowDisciplinaModal(true);
  };

  const handleDeleteDisciplinaClick = (disciplinaId: string) => {
    setDeletingDisciplinaId(disciplinaId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteDisciplina = async () => {
    if (!deletingDisciplinaId) return;
    
    setIsDeleting(true);
    try {
      const success = await takeoffService.deleteDisciplina(deletingDisciplinaId);
      if (success && usuario?.empresaId) {
        loadDisciplinas(usuario.empresaId);
        if (selectedDisciplinaId === deletingDisciplinaId) {
          setSelectedDisciplina(null);
        }
      }
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingDisciplinaId(null);
    }
  };

  const handleDocumentoSave = (documento: TakeoffDocumento) => {
    if (editingDocumento) {
      setDocumentos((prev) => prev.map(d => d.id === documento.id ? documento : d));
      setEditingDocumento(null);
    } else {
      setDocumentos((prev) => [documento, ...prev]);
    }
  };

  // Handlers para edição de colunas
  const handleNewColuna = () => {
    if (!selectedDisciplinaId) return;
    setEditingColuna({
      id: '',
      disciplinaId: selectedDisciplinaId,
      nome: '',
      codigo: '',
      tipo: 'text',
      formula: undefined,
      opcoes: undefined,
      unidade: undefined,
      casasDecimais: 2,
      obrigatoria: false,
      visivel: true,
      ordem: colunasConfig.length + 1,
      largura: 100,
      isNew: true,
    });
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
    const codigoDuplicado = colunasConfig.find(
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
      // Recarregar colunas
      const data = await takeoffService.getColunasConfig(editingColuna.disciplinaId);
      setColunasConfig(data);
      setEditingColuna(null);
    } catch (error) {
      console.error('Erro ao salvar coluna:', error);
      alert('Erro ao salvar coluna. Tente novamente.');
    } finally {
      setSavingColuna(false);
    }
  };

  const handleDeleteColunaClick = (colunaId: string) => {
    setDeletingColunaId(colunaId);
    setShowDeleteColunaConfirm(true);
  };

  const handleConfirmDeleteColuna = async () => {
    if (!deletingColunaId || !selectedDisciplinaId) return;
    
    setIsDeleting(true);
    try {
      await takeoffService.deleteColunaConfig(deletingColunaId);
      const data = await takeoffService.getColunasConfig(selectedDisciplinaId);
      setColunasConfig(data);
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      alert('Erro ao excluir coluna. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setShowDeleteColunaConfirm(false);
      setDeletingColunaId(null);
    }
  };

  const handleEditDocumento = (documento: TakeoffDocumento) => {
    setEditingDocumento(documento);
    setShowDocumentoModal(true);
  };

  const handleDeleteDocumentoClick = (documentoId: string) => {
    setDeletingDocumentoId(documentoId);
    setShowDeleteDocumentoConfirm(true);
  };

  const handleConfirmDeleteDocumento = async () => {
    if (!deletingDocumentoId || !selectedProjetoId) return;
    
    setIsDeleting(true);
    try {
      const success = await takeoffService.deleteDocumento(deletingDocumentoId, selectedProjetoId);
      if (success) {
        setDocumentos((prev) => prev.filter(d => d.id !== deletingDocumentoId));
      }
    } catch (error) {
      console.error('Erro ao excluir documento:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDocumentoConfirm(false);
      setDeletingDocumentoId(null);
    }
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: BarChart3 },
    { id: 'mapas' as TabType, label: 'Mapas de Controle', icon: LayoutGrid },
    { id: 'vinculos' as TabType, label: 'Vínculos', icon: Link2 },
    { id: 'medicoes' as TabType, label: 'Medições', icon: Calendar },
    { id: 'documentos' as TabType, label: 'Documentos', icon: FileText },
    { id: 'config' as TabType, label: 'Configurações', icon: Settings },
  ];

  const filteredMapas = mapas.filter(mapa => 
    !searchTerm || 
    mapa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mapa.disciplina?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 theme-surface border-b theme-divide px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 theme-text-secondary" />
            <div>
              <h1 className="text-xl font-bold theme-text">Take-off / Levantamento de Quantidades</h1>
              <p className="text-sm theme-text-secondary">Gestão de quantitativos e avanço físico</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedMapaId && (
              <>
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm theme-text rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Upload className="w-4 h-4" />
                  Importar Excel
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-2 text-sm theme-text rounded-lg hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: 'var(--color-surface-secondary)', border: '1px solid var(--color-border)' }}
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </>
            )}

            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                disabled={!selectedProjetoId}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-opacity theme-text disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
                title={!selectedProjetoId ? 'Selecione um projeto para habilitar' : 'Criar novo item'}
              >
                <Plus className="w-4 h-4" />
                Adicionar
                <ChevronDown className={`w-4 h-4 transition-transform ${showAddMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAddMenu && selectedProjetoId && (
                <div 
                  className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg border z-50 py-1"
                  style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                >
                  <button
                    onClick={() => {
                      if (selectedDisciplinaId) {
                        setShowMapaModal(true);
                        setShowAddMenu(false);
                      }
                    }}
                    disabled={!selectedDisciplinaId}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <LayoutGrid className="w-4 h-4 theme-text-secondary" />
                    <div className="flex-1">
                      <span className="theme-text">Novo Mapa de Controle</span>
                      {!selectedDisciplinaId && (
                        <p className="text-xs theme-text-secondary">Selecione uma disciplina</p>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setShowDocumentoModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <FileText className="w-4 h-4 theme-text-secondary" />
                    <span className="theme-text">Novo Documento</span>
                  </button>

                  <div className="border-t my-1" style={{ borderColor: 'var(--color-border)' }} />

                  <button
                    onClick={() => {
                      setEditingDisciplina(null);
                      setShowDisciplinaModal(true);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <Layers className="w-4 h-4 theme-text-secondary" />
                    <span className="theme-text">Nova Disciplina</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium theme-text-secondary">Projeto:</label>
            <select
              value={selectedProjetoId || ''}
              onChange={(e) => handleProjetoChange(e.target.value)}
              className="px-3 py-1.5 text-sm border rounded-lg theme-text"
              style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
            >
              <option value="">Selecione um projeto</option>
              {projetos.map((projeto) => (
                <option key={projeto.id} value={projeto.id}>
                  {projeto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium theme-text-secondary">Disciplina:</label>
            <select
              value={selectedDisciplinaId || ''}
              onChange={(e) => handleDisciplinaChange(e.target.value || null)}
              className="px-3 py-1.5 text-sm border rounded-lg theme-text"
              style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
              disabled={!selectedProjetoId}
            >
              <option value="">Todas</option>
              {disciplinas.map((disc) => (
                <option key={disc.id} value={disc.id}>
                  {disc.nome}
                </option>
              ))}
            </select>
          </div>

          {disciplinas.length === 0 && !isLoading && (
            <button
              onClick={handleInitializeDisciplinas}
              className="flex items-center gap-2 px-3 py-1.5 text-sm theme-text-secondary hover:theme-text rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-surface-secondary)' }}
            >
              <RefreshCw className="w-4 h-4" />
              Inicializar Disciplinas
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-4 border-b theme-divide -mb-4 -mx-6 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'theme-text'
                  : 'border-transparent theme-text-secondary hover:theme-text'
              }`}
              style={{ borderBottomColor: activeTab === tab.id ? 'var(--color-text)' : 'transparent' }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'mapas' && (
          <>
            <div className="w-72 flex-shrink-0 border-r theme-divide theme-surface overflow-y-auto">
              <div className="p-3 border-b theme-divide">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 theme-text-secondary" />
                  <input
                    type="text"
                    placeholder="Buscar mapa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg theme-text"
                    style={{ backgroundColor: 'var(--color-surface-secondary)', borderColor: 'var(--color-border)' }}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 theme-text-secondary hover:theme-text" />
                    </button>
                  )}
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 theme-text-secondary animate-spin" />
                </div>
              ) : !selectedProjetoId ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-50" />
                  <p className="text-sm theme-text-secondary">
                    Selecione um projeto para ver os mapas de controle
                  </p>
                </div>
              ) : filteredMapas.length === 0 ? (
                <div className="p-6 text-center">
                  <Package className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-50" />
                  <p className="text-sm theme-text-secondary mb-4">
                    Nenhum mapa encontrado
                  </p>
                  {selectedDisciplinaId && (
                    <button
                      onClick={() => setShowMapaModal(true)}
                      className="text-sm theme-text-secondary hover:theme-text hover:underline"
                    >
                      Criar primeiro mapa
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y theme-divide">
                  {filteredMapas.map((mapa) => (
                    <button
                      key={mapa.id}
                      onClick={() => handleMapaSelect(mapa.id)}
                      className={`w-full p-3 text-left transition-colors ${
                        selectedMapaId === mapa.id ? 'border-l-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: selectedMapaId === mapa.id ? 'var(--color-surface-secondary)' : 'transparent',
                        borderColor: selectedMapaId === mapa.id ? 'var(--color-text)' : 'transparent'
                      }}
                      onMouseEnter={(e) => { if (selectedMapaId !== mapa.id) e.currentTarget.style.backgroundColor = 'var(--color-surface-secondary)'; }}
                      onMouseLeave={(e) => { if (selectedMapaId !== mapa.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: mapa.disciplina?.cor || '#6B7280' }}
                            />
                            <span className="text-sm font-medium theme-text truncate">
                              {mapa.nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs theme-text-secondary">
                              {mapa.disciplina?.nome}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded theme-text-secondary" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                              v{mapa.versao}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 theme-text-secondary flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedMapaId ? (
                <TakeoffGrid mapaId={selectedMapaId} disciplinaId={selectedDisciplinaId} projetoId={selectedProjetoId} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <LayoutGrid className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
                    <h3 className="text-lg font-medium theme-text mb-2">
                      Selecione um Mapa de Controle
                    </h3>
                    <p className="text-sm theme-text-secondary max-w-md">
                      Escolha um mapa na lista à esquerda para visualizar e editar os itens de take-off
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex-1 overflow-auto p-6">
            <TakeoffDashboard projetoId={selectedProjetoId} disciplinaId={selectedDisciplinaId} />
          </div>
        )}

        {activeTab === 'vinculos' && (
          <div className="flex-1 overflow-auto p-6">
            {loadingTab ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin theme-text-secondary" />
              </div>
            ) : vinculos.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
                <h3 className="text-lg font-medium theme-text mb-2">Vínculos com Cronograma</h3>
                <p className="text-sm theme-text-secondary">
                  Associe itens de take-off às atividades do cronograma para calcular avanço físico automaticamente
                </p>
              </div>
            ) : (
              <VinculosTab 
                vinculos={vinculos} 
                onRefresh={async () => {
                  setLoadingTab(true);
                  const data = await takeoffService.getAllVinculos();
                  setVinculos(data);
                  setLoadingTab(false);
                }}
              />
            )}
          </div>
        )}

        {activeTab === 'medicoes' && (
          <div className="flex-1 overflow-auto p-6">
            {loadingTab ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin theme-text-secondary" />
              </div>
            ) : medicoes.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
                <h3 className="text-lg font-medium theme-text mb-2">Medições por Período</h3>
                <p className="text-sm theme-text-secondary">
                  Registre quantidades executadas por período para acompanhar o avanço físico
                </p>
              </div>
            ) : (
              <div className="theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <h3 className="text-lg font-medium theme-text">Medições por Período</h3>
                  <p className="text-sm theme-text-secondary mt-1">{medicoes.length} medições registradas</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Item</th>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Período</th>
                        <th className="text-right py-3 px-4 font-medium theme-text-secondary">Qtd. Período</th>
                        <th className="text-right py-3 px-4 font-medium theme-text-secondary">Qtd. Acumulada</th>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Observações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {medicoes.map((m) => (
                        <tr key={m.id} className="border-b hover:bg-opacity-50" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="py-3 px-4 theme-text">{m.item?.descricao || m.itemId}</td>
                          <td className="py-3 px-4 theme-text-secondary">
                            {format(new Date(m.periodoInicio), 'dd/MM/yy', { locale: ptBR })} - {format(new Date(m.periodoFim), 'dd/MM/yy', { locale: ptBR })}
                          </td>
                          <td className="py-3 px-4 text-right theme-text">{m.qtdPeriodo.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-right theme-text font-medium">{m.qtdAcumulada?.toLocaleString('pt-BR') || '-'}</td>
                          <td className="py-3 px-4 theme-text-secondary text-xs max-w-[200px] truncate">{m.observacoes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="flex-1 overflow-auto p-6">
            {loadingTab ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin theme-text-secondary" />
              </div>
            ) : documentos.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 theme-text-secondary opacity-30" />
                <h3 className="text-lg font-medium theme-text mb-2">Documentos de Projeto</h3>
                <p className="text-sm theme-text-secondary mb-4">
                  Gerencie isométricos, plantas e desenhos de referência
                </p>
                {selectedProjetoId && (
                  <button
                    onClick={() => setShowDocumentoModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg theme-text hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Documento
                  </button>
                )}
              </div>
            ) : (
              <div className="theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div>
                    <h3 className="text-lg font-medium theme-text">Documentos de Projeto</h3>
                    <p className="text-sm theme-text-secondary mt-1">{documentos.length} documentos cadastrados</p>
                  </div>
                  <button
                    onClick={() => setShowDocumentoModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg theme-text hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Novo Documento
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Código</th>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Título</th>
                        <th className="text-center py-3 px-4 font-medium theme-text-secondary">Revisão</th>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Tipo</th>
                        <th className="text-center py-3 px-4 font-medium theme-text-secondary">Status</th>
                        <th className="text-left py-3 px-4 font-medium theme-text-secondary">Emissão</th>
                        <th className="text-right py-3 px-4 font-medium theme-text-secondary">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((d) => (
                        <tr key={d.id} className="border-b hover:bg-opacity-50 group" style={{ borderColor: 'var(--color-border)' }}>
                          <td className="py-3 px-4 font-mono text-xs theme-text">{d.codigo}</td>
                          <td className="py-3 px-4 theme-text">{d.titulo || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 text-xs rounded font-medium" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                              Rev. {d.revisao}
                            </span>
                          </td>
                          <td className="py-3 px-4 theme-text-secondary capitalize">{d.tipo || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-1 text-xs rounded theme-text" style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
                              {d.status === 'aprovado' ? 'Aprovado' : d.status === 'em_revisao' ? 'Em Revisão' : d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 theme-text-secondary">
                            {d.dataEmissao ? format(new Date(d.dataEmissao), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditDocumento(d)}
                                className="p-1.5 rounded hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5 theme-text-secondary" />
                              </button>
                              <button
                                onClick={() => handleDeleteDocumentoClick(d.id)}
                                className="p-1.5 rounded hover:opacity-80 transition-opacity"
                                style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-6 max-w-5xl">
              <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium theme-text">Disciplinas Configuradas</h3>
                  <button
                    onClick={() => {
                      setEditingDisciplina(null);
                      setShowDisciplinaModal(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg theme-text hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border)' }}
                  >
                    <Plus className="w-4 h-4" />
                    Nova Disciplina
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {disciplinas.map((disc) => (
                    <div
                      key={disc.id}
                      className="flex items-center gap-3 p-3 theme-surface rounded-lg border group"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: disc.cor }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium theme-text truncate">{disc.nome}</div>
                        <div className="text-xs theme-text-secondary">{disc.codigo}</div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditDisciplina(disc)}
                          className="p-1.5 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5 theme-text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDeleteDisciplinaClick(disc.id)}
                          className="p-1.5 rounded hover:opacity-80 transition-opacity"
                          style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5 theme-text-secondary" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDisciplinaId && (
                <div className="theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <h3 className="text-lg font-medium theme-text">Colunas Configuradas</h3>
                      <p className="text-sm theme-text-secondary mt-1">
                        {colunasConfig.length} colunas para {disciplinas.find(d => d.id === selectedDisciplinaId)?.nome || 'disciplina selecionada'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const disc = disciplinas.find(d => d.id === selectedDisciplinaId);
                          if (disc && colunasConfig.length > 0) {
                            try {
                              exportarTemplateTakeoff(disc.nome, colunasConfig);
                              toast?.success('Template exportado com sucesso!');
                            } catch (error) {
                              console.error('Erro ao exportar template:', error);
                              toast?.error('Erro ao exportar template. Tente novamente.');
                            }
                          } else {
                            toast?.warning('Configure ao menos uma coluna antes de exportar.');
                          }
                        }}
                        disabled={colunasConfig.length === 0}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ 
                          backgroundColor: 'var(--color-surface-tertiary)', 
                          border: '1px solid var(--color-border)' 
                        }}
                        title="Exportar template Excel para preenchimento"
                      >
                        <Download className="w-4 h-4 theme-text" />
                        <span className="theme-text">Exportar Template</span>
                      </button>
                      <button
                        onClick={handleNewColuna}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Coluna
                      </button>
                    </div>
                  </div>
                  
                  {/* Formulário de Edição de Coluna */}
                  {editingColuna && (
                    <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium theme-text">
                          {editingColuna.isNew ? 'Nova Coluna' : 'Editar Coluna'}
                        </h4>
                        <button
                          onClick={() => setEditingColuna(null)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 theme-text-secondary" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Nome *</label>
                          <input
                            type="text"
                            value={editingColuna.nome}
                            onChange={(e) => setEditingColuna({ ...editingColuna, nome: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                            placeholder="Nome da coluna"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Código *</label>
                          <input
                            type="text"
                            value={editingColuna.codigo}
                            onChange={(e) => setEditingColuna({ ...editingColuna, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface font-mono text-sm"
                            style={{ borderColor: 'var(--color-border)' }}
                            placeholder="codigo_coluna"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Tipo</label>
                          <select
                            value={editingColuna.tipo}
                            onChange={(e) => setEditingColuna({ ...editingColuna, tipo: e.target.value as TipoColuna })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                          >
                            {tiposColuna.map(tipo => (
                              <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Unidade</label>
                          <input
                            type="text"
                            value={editingColuna.unidade || ''}
                            onChange={(e) => setEditingColuna({ ...editingColuna, unidade: e.target.value || undefined })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                            placeholder="kg, m², un..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Casas Decimais</label>
                          <input
                            type="number"
                            min="0"
                            max="6"
                            value={editingColuna.casasDecimais ?? ''}
                            onChange={(e) => setEditingColuna({ ...editingColuna, casasDecimais: e.target.value ? parseInt(e.target.value) : 0 })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium theme-text mb-1">Largura (px)</label>
                          <input
                            type="number"
                            min="50"
                            max="500"
                            value={editingColuna.largura}
                            onChange={(e) => setEditingColuna({ ...editingColuna, largura: parseInt(e.target.value) || 100 })}
                            className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        </div>
                        
                        {editingColuna.tipo === 'select' && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium theme-text mb-1">Opções (separadas por vírgula)</label>
                            <input
                              type="text"
                              value={editingColuna.opcoes?.join(', ') || ''}
                              onChange={(e) => setEditingColuna({ ...editingColuna, opcoes: e.target.value ? e.target.value.split(',').map(o => o.trim()).filter(Boolean) : undefined })}
                              className="w-full px-3 py-2 border rounded-lg theme-text theme-surface"
                              style={{ borderColor: 'var(--color-border)' }}
                              placeholder="Opção 1, Opção 2, Opção 3"
                            />
                          </div>
                        )}
                        
                        {editingColuna.tipo === 'calculated' && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-sm font-medium theme-text mb-1">Fórmula</label>
                            <input
                              type="text"
                              value={editingColuna.formula || ''}
                              onChange={(e) => setEditingColuna({ ...editingColuna, formula: e.target.value || undefined })}
                              className="w-full px-3 py-2 border rounded-lg theme-text theme-surface font-mono text-sm"
                              style={{ borderColor: 'var(--color-border)' }}
                              placeholder="=comprimento * largura * altura"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 mt-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingColuna.obrigatoria}
                            onChange={(e) => setEditingColuna({ ...editingColuna, obrigatoria: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm theme-text">Obrigatória</span>
                        </label>
                        
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingColuna.visivel}
                            onChange={(e) => setEditingColuna({ ...editingColuna, visivel: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm theme-text">Visível</span>
                        </label>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={() => setEditingColuna(null)}
                          className="px-4 py-2 text-sm font-medium theme-text-secondary hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveColuna}
                          disabled={savingColuna}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {savingColuna ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Salvar
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {loadingTab ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin theme-text-secondary" />
                    </div>
                  ) : colunasConfig.length === 0 && !editingColuna ? (
                    <div className="p-6 text-center theme-text-secondary">
                      Nenhuma coluna configurada para esta disciplina
                    </div>
                  ) : colunasConfig.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-secondary)' }}>
                            <th className="text-left py-3 px-4 font-medium theme-text-secondary">Nome</th>
                            <th className="text-left py-3 px-4 font-medium theme-text-secondary">Código</th>
                            <th className="text-center py-3 px-4 font-medium theme-text-secondary">Tipo</th>
                            <th className="text-center py-3 px-4 font-medium theme-text-secondary">Obrigatória</th>
                            <th className="text-right py-3 px-4 font-medium theme-text-secondary">Largura</th>
                            <th className="text-right py-3 px-4 font-medium theme-text-secondary">Ordem</th>
                            <th className="text-center py-3 px-4 font-medium theme-text-secondary">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {colunasConfig.map((col) => (
                            <tr key={col.id} className="border-b group hover:bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
                              <td className="py-3 px-4 theme-text font-medium">{col.nome}</td>
                              <td className="py-3 px-4 font-mono text-xs theme-text-secondary">{col.codigo}</td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-1 text-xs rounded" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                                  {tiposColuna.find(t => t.value === col.tipo)?.label || col.tipo}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {col.obrigatoria ? (
                                  <span className="theme-text font-medium">Sim</span>
                                ) : (
                                  <span className="theme-text-secondary">Não</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right theme-text-secondary">{col.largura}px</td>
                              <td className="py-3 px-4 text-right theme-text-secondary">{col.ordem}</td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditColuna(col)}
                                    className="p-1.5 rounded hover:bg-blue-100 transition-colors"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteColunaClick(col.id)}
                                    className="p-1.5 rounded hover:bg-red-100 transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              )}

              {!selectedDisciplinaId && (
                <div className="p-6 text-center theme-surface rounded-lg border" style={{ borderColor: 'var(--color-border)' }}>
                  <Settings className="w-12 h-12 mx-auto mb-3 theme-text-secondary opacity-30" />
                  <p className="theme-text-secondary">Selecione uma disciplina para ver as colunas configuradas</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showImportModal && selectedMapaId && (
        <TakeoffImportModal
          mapaId={selectedMapaId}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showMapaModal && selectedProjetoId && selectedDisciplinaId && (
        <TakeoffMapaModal
          projetoId={selectedProjetoId}
          disciplinaId={selectedDisciplinaId}
          onClose={() => setShowMapaModal(false)}
        />
      )}

      {showDisciplinaModal && usuario?.empresaId && (
        <TakeoffDisciplinaModal
          isOpen={showDisciplinaModal}
          onClose={() => {
            setShowDisciplinaModal(false);
            setEditingDisciplina(null);
          }}
          onSave={handleDisciplinaSave}
          disciplina={editingDisciplina}
          empresaId={usuario.empresaId}
        />
      )}

      {showDocumentoModal && selectedProjetoId && (
        <TakeoffDocumentoModal
          isOpen={showDocumentoModal}
          onClose={() => {
            setShowDocumentoModal(false);
            setEditingDocumento(null);
          }}
          onSave={handleDocumentoSave}
          projetoId={selectedProjetoId}
          disciplinas={disciplinas}
          selectedDisciplinaId={selectedDisciplinaId}
          documento={editingDocumento}
        />
      )}

      <TakeoffConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingDisciplinaId(null);
        }}
        onConfirm={handleConfirmDeleteDisciplina}
        title="Excluir Disciplina"
        message="Tem certeza que deseja excluir esta disciplina? Esta ação não pode ser desfeita e todos os mapas e itens associados serão removidos."
        confirmLabel="Excluir"
        isLoading={isDeleting}
        variant="danger"
      />

      <TakeoffConfirmDialog
        isOpen={showDeleteDocumentoConfirm}
        onClose={() => {
          setShowDeleteDocumentoConfirm(false);
          setDeletingDocumentoId(null);
        }}
        onConfirm={handleConfirmDeleteDocumento}
        title="Excluir Documento"
        message="Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        isLoading={isDeleting}
        variant="danger"
      />

      <TakeoffConfirmDialog
        isOpen={showDeleteColunaConfirm}
        onClose={() => {
          setShowDeleteColunaConfirm(false);
          setDeletingColunaId(null);
        }}
        onConfirm={handleConfirmDeleteColuna}
        title="Excluir Coluna"
        message="Tem certeza que deseja excluir esta coluna? Esta ação não pode ser desfeita e os dados associados serão removidos."
        confirmLabel="Excluir"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default TakeoffPage;
