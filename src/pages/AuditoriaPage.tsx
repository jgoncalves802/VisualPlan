import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Plus,
  Search,
  FileCheck,
  CheckCircle,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Camera,
  Eye,
  Edit2,
  Trash2,
  Copy,
  X,
  ClipboardList,
  Download,
  Calendar,
  User,
  FileText,
  Shield,
  Leaf,
  Zap,
  Save,
  Loader2,
} from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { parseDateOnly } from '../utils/dateHelpers';
import { auditoriaService } from '../services/auditoriaService';
import {
  Auditoria,
  ItemAuditoria,
  ChecklistTemplate,
  ItemChecklist,
  StatusAuditoria,
  StatusItemAuditoria,
  SeveridadeNaoConformidade,
  CategoriaChecklist,
} from '../types/gestao';

const getCategoriaIcon = (categoria: CategoriaChecklist) => {
  switch (categoria) {
    case CategoriaChecklist.SEGURANCA:
      return Shield;
    case CategoriaChecklist.QUALIDADE:
      return FileCheck;
    case CategoriaChecklist.AMBIENTAL:
      return Leaf;
    case CategoriaChecklist.DOCUMENTACAO:
      return FileText;
    case CategoriaChecklist.INSTALACOES:
      return Zap;
    default:
      return ClipboardList;
  }
};

const getCategoriaLabel = (categoria: CategoriaChecklist): string => {
  switch (categoria) {
    case CategoriaChecklist.SEGURANCA:
      return 'Segurança';
    case CategoriaChecklist.QUALIDADE:
      return 'Qualidade';
    case CategoriaChecklist.AMBIENTAL:
      return 'Ambiental';
    case CategoriaChecklist.DOCUMENTACAO:
      return 'Documentação';
    case CategoriaChecklist.INSTALACOES:
      return 'Instalações';
    default:
      return categoria;
  }
};

const getCategoriaColor = (categoria: CategoriaChecklist): string => {
  switch (categoria) {
    case CategoriaChecklist.SEGURANCA:
      return '#EF4444';
    case CategoriaChecklist.QUALIDADE:
      return '#3B82F6';
    case CategoriaChecklist.AMBIENTAL:
      return '#22C55E';
    case CategoriaChecklist.DOCUMENTACAO:
      return '#8B5CF6';
    case CategoriaChecklist.INSTALACOES:
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};

const getStatusColor = (status: StatusAuditoria): { bg: string; text: string } => {
  switch (status) {
    case StatusAuditoria.PLANEJADA:
      return { bg: '#E5E7EB', text: '#374151' };
    case StatusAuditoria.EM_ANDAMENTO:
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case StatusAuditoria.CONCLUIDA:
      return { bg: '#D1FAE5', text: '#065F46' };
    case StatusAuditoria.CANCELADA:
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getStatusLabel = (status: StatusAuditoria): string => {
  switch (status) {
    case StatusAuditoria.PLANEJADA:
      return 'Planejada';
    case StatusAuditoria.EM_ANDAMENTO:
      return 'Em Andamento';
    case StatusAuditoria.CONCLUIDA:
      return 'Concluída';
    case StatusAuditoria.CANCELADA:
      return 'Cancelada';
    default:
      return status;
  }
};

const getSeveridadeColor = (severidade: SeveridadeNaoConformidade): { bg: string; text: string } => {
  switch (severidade) {
    case SeveridadeNaoConformidade.MENOR:
      return { bg: '#FEF3C7', text: '#92400E' };
    case SeveridadeNaoConformidade.MAIOR:
      return { bg: '#FED7AA', text: '#C2410C' };
    case SeveridadeNaoConformidade.CRITICA:
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getSeveridadeLabel = (severidade: SeveridadeNaoConformidade): string => {
  switch (severidade) {
    case SeveridadeNaoConformidade.MENOR:
      return 'Menor';
    case SeveridadeNaoConformidade.MAIOR:
      return 'Maior';
    case SeveridadeNaoConformidade.CRITICA:
      return 'Crítica';
    default:
      return severidade;
  }
};

type TabType = 'checklists' | 'auditorias' | 'historico';

interface AuditExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditoria: Auditoria;
  onSave: (items: ItemAuditoria[]) => void;
  onGenerateActions: (nonConformItems: ItemAuditoria[]) => void;
}

const AuditExecutionModal: React.FC<AuditExecutionModalProps> = ({
  isOpen,
  onClose,
  auditoria,
  onSave,
  onGenerateActions,
}) => {
  const { tema } = useTemaStore();
  const [items, setItems] = useState<ItemAuditoria[]>(auditoria.itens);

  React.useEffect(() => {
    setItems(auditoria.itens);
  }, [auditoria]);

  const updateItemStatus = (itemId: string, status: StatusItemAuditoria) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, status, severidade: status === StatusItemAuditoria.NAO_CONFORME ? SeveridadeNaoConformidade.MENOR : undefined }
          : item
      )
    );
  };

  const updateItemSeveridade = (itemId: string, severidade: SeveridadeNaoConformidade) => {
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, severidade } : item))
    );
  };

  const updateItemObservacao = (itemId: string, observacao: string) => {
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, observacao } : item))
    );
  };

  const completedCount = items.filter(i => i.status !== StatusItemAuditoria.PENDENTE).length;
  const progress = (completedCount / items.length) * 100;

  const conformeCount = items.filter(i => i.status === StatusItemAuditoria.CONFORME).length;
  const naoConformeCount = items.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME).length;
  const naCount = items.filter(i => i.status === StatusItemAuditoria.NAO_APLICAVEL).length;
  
  const applicableItems = items.filter(i => i.status !== StatusItemAuditoria.NAO_APLICAVEL && i.status !== StatusItemAuditoria.PENDENTE);
  const conformanceScore = applicableItems.length > 0
    ? (conformeCount / applicableItems.length) * 100
    : 0;

  const nonConformItems = items.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
        style={{ backgroundColor: tema.surface }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: tema.border }}
        >
          <div>
            <h2 className="text-xl font-bold" style={{ color: tema.text }}>
              {auditoria.titulo}
            </h2>
            <p className="text-sm" style={{ color: tema.textSecondary }}>
              {auditoria.codigo} • {auditoria.checklistNome}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: tema.textSecondary }} />
          </button>
        </div>

        <div className="p-4 border-b" style={{ borderColor: tema.border }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: tema.text }}>
              Progresso: {completedCount} de {items.length} itens
            </span>
            <span className="text-sm font-bold" style={{ color: tema.primary }}>
              {progress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: tema.primary }}
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm" style={{ color: tema.text }}>{conformeCount} Conforme</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle size={16} className="text-red-500" />
                <span className="text-sm" style={{ color: tema.text }}>{naoConformeCount} Não Conforme</span>
              </div>
              <div className="flex items-center gap-1">
                <MinusCircle size={16} className="text-gray-400" />
                <span className="text-sm" style={{ color: tema.text }}>{naCount} N/A</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm" style={{ color: tema.textSecondary }}>Conformidade:</span>
              <span
                className="ml-2 text-lg font-bold"
                style={{ color: conformanceScore >= 80 ? '#22C55E' : conformanceScore >= 60 ? '#F59E0B' : '#EF4444' }}
              >
                {conformanceScore.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="p-4 rounded-lg border"
              style={{
                borderColor: item.status === StatusItemAuditoria.NAO_CONFORME ? '#FCA5A5' : tema.border,
                backgroundColor: item.status === StatusItemAuditoria.NAO_CONFORME ? '#FEF2F2' : tema.background,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: tema.primary }}
                    >
                      {idx + 1}
                    </span>
                    <p className="font-medium" style={{ color: tema.text }}>
                      {item.pergunta}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => updateItemStatus(item.id, StatusItemAuditoria.CONFORME)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                        item.status === StatusItemAuditoria.CONFORME
                          ? 'bg-green-100 border-green-500 text-green-700'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle size={16} />
                      <span className="text-sm">Conforme</span>
                    </button>
                    <button
                      onClick={() => updateItemStatus(item.id, StatusItemAuditoria.NAO_CONFORME)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                        item.status === StatusItemAuditoria.NAO_CONFORME
                          ? 'bg-red-100 border-red-500 text-red-700'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <XCircle size={16} />
                      <span className="text-sm">Não Conforme</span>
                    </button>
                    <button
                      onClick={() => updateItemStatus(item.id, StatusItemAuditoria.NAO_APLICAVEL)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${
                        item.status === StatusItemAuditoria.NAO_APLICAVEL
                          ? 'bg-gray-200 border-gray-500 text-gray-700'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <MinusCircle size={16} />
                      <span className="text-sm">N/A</span>
                    </button>
                  </div>

                  {item.status === StatusItemAuditoria.NAO_CONFORME && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-sm font-medium" style={{ color: tema.text }}>
                          Severidade
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {Object.values(SeveridadeNaoConformidade).map(sev => (
                            <button
                              key={sev}
                              onClick={() => updateItemSeveridade(item.id, sev)}
                              className={`px-3 py-1 rounded-lg border text-sm transition-colors ${
                                item.severidade === sev
                                  ? ''
                                  : 'border-gray-300 hover:bg-gray-100'
                              }`}
                              style={
                                item.severidade === sev
                                  ? {
                                      backgroundColor: getSeveridadeColor(sev).bg,
                                      color: getSeveridadeColor(sev).text,
                                      borderColor: getSeveridadeColor(sev).text,
                                    }
                                  : {}
                              }
                            >
                              {getSeveridadeLabel(sev)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium" style={{ color: tema.text }}>
                          Observações
                        </label>
                        <textarea
                          value={item.observacao || ''}
                          onChange={e => updateItemObservacao(item.id, e.target.value)}
                          className="w-full mt-1 p-2 rounded-lg border text-sm"
                          style={{ borderColor: tema.border }}
                          rows={2}
                          placeholder="Descreva a não conformidade..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  className="p-2 rounded-lg border transition-colors hover:bg-gray-100"
                  style={{ borderColor: tema.border }}
                  title="Adicionar evidência"
                >
                  <Camera size={20} style={{ color: tema.textSecondary }} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: tema.border }}
        >
          <button
            onClick={() => onGenerateActions(nonConformItems)}
            disabled={nonConformItems.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: nonConformItems.length > 0 ? '#FEF3C7' : '#E5E7EB',
              color: nonConformItems.length > 0 ? '#92400E' : '#9CA3AF',
            }}
          >
            <AlertTriangle size={18} />
            <span>Gerar Ações 5W2H ({nonConformItems.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: tema.border, color: tema.text }}
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(items)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: tema.primary }}
            >
              <Save size={18} />
              <span>Salvar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Partial<ChecklistTemplate>) => void;
  template?: ChecklistTemplate | null;
}

const TemplateModal: React.FC<TemplateModalProps> = ({ isOpen, onClose, onSave, template }) => {
  const { tema } = useTemaStore();
  const [formData, setFormData] = useState<Partial<ChecklistTemplate>>({
    nome: '',
    categoria: CategoriaChecklist.QUALIDADE,
    versao: '1.0',
    itens: [],
  });
  const [newItemText, setNewItemText] = useState('');

  React.useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        itens: [...template.itens],
      });
    } else {
      setFormData({
        nome: '',
        categoria: CategoriaChecklist.QUALIDADE,
        versao: '1.0',
        itens: [],
      });
    }
  }, [template]);

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ItemChecklist = {
      id: `new-${Date.now()}`,
      descricao: newItemText.trim(),
      obrigatorio: true,
    };
    setFormData(prev => ({
      ...prev,
      itens: [...(prev.itens || []), newItem],
    }));
    setNewItemText('');
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens?.filter(i => i.id !== itemId) || [],
    }));
  };

  const toggleObrigatorio = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens?.map(i => (i.id === itemId ? { ...i, obrigatorio: !i.obrigatorio } : i)) || [],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.itens?.length) {
      alert('Por favor, preencha o nome e adicione pelo menos um item.');
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg shadow-xl"
        style={{ backgroundColor: tema.surface }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: tema.border }}
        >
          <h2 className="text-xl font-bold" style={{ color: tema.text }}>
            {template ? 'Editar Template' : 'Novo Template de Checklist'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: tema.textSecondary }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 130px)' }}>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                Nome do Template *
              </label>
              <input
                type="text"
                value={formData.nome || ''}
                onChange={e => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full p-2 rounded-lg border"
                style={{ borderColor: tema.border }}
                placeholder="Ex: Segurança do Trabalho"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Categoria *
                </label>
                <select
                  value={formData.categoria}
                  onChange={e => setFormData(prev => ({ ...prev, categoria: e.target.value as CategoriaChecklist }))}
                  className="w-full p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                >
                  {Object.values(CategoriaChecklist).map(cat => (
                    <option key={cat} value={cat}>
                      {getCategoriaLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Versão
                </label>
                <input
                  type="text"
                  value={formData.versao || ''}
                  onChange={e => setFormData(prev => ({ ...prev, versao: e.target.value }))}
                  className="w-full p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: tema.text }}>
                Itens do Checklist
              </label>
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  value={newItemText}
                  onChange={e => setNewItemText(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
                  className="flex-1 p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                  placeholder="Adicionar novo item..."
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="p-2 rounded-lg text-white"
                  style={{ backgroundColor: tema.primary }}
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {formData.itens?.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg border"
                    style={{ borderColor: tema.border }}
                  >
                    <span className="text-sm font-medium w-6" style={{ color: tema.textSecondary }}>
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-sm" style={{ color: tema.text }}>
                      {item.descricao}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleObrigatorio(item.id)}
                      className={`px-2 py-1 text-xs rounded ${
                        item.obrigatorio ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {item.obrigatorio ? 'Obrigatório' : 'Opcional'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(!formData.itens || formData.itens.length === 0) && (
                  <p className="text-sm text-center py-4" style={{ color: tema.textSecondary }}>
                    Nenhum item adicionado
                  </p>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-2 p-4 border-t"
            style={{ borderColor: tema.border }}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: tema.border, color: tema.text }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: tema.primary }}
            >
              {template ? 'Salvar Alterações' : 'Criar Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AuditoriaPage: React.FC = () => {
  const { tema } = useTemaStore();
  const { usuario } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('auditorias');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusAuditoria | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [auditorias, setAuditorias] = useState<Auditoria[]>([]);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedAuditoria, setSelectedAuditoria] = useState<Auditoria | null>(null);
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [newAuditForm, setNewAuditForm] = useState({
    titulo: '',
    checklistId: '',
    projetoId: '',
    responsavelId: '',
    dataAuditoria: format(new Date(), 'yyyy-MM-dd'),
  });
  
  const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([]);
  const [auditores, setAuditores] = useState<{ id: string; nome: string }[]>([]);

  const loadData = useCallback(async () => {
    if (!usuario?.empresaId) {
      setTemplates([]);
      setAuditorias([]);
      setProjetos([]);
      setAuditores([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [templatesData, auditoriasData, projetosData, auditoresData] = await Promise.all([
        auditoriaService.getAllTemplates(usuario.empresaId),
        auditoriaService.getAllAuditorias(usuario.empresaId),
        auditoriaService.getProjetosDisponiveis(usuario.empresaId),
        auditoriaService.getAuditoresDisponiveis(usuario.empresaId),
      ]);
      
      setTemplates(templatesData);
      setAuditorias(auditoriasData);
      setProjetos(projetosData);
      setAuditores(auditoresData);
    } catch (error) {
      console.error('Erro ao carregar dados de auditoria:', error);
      setTemplates([]);
      setAuditorias([]);
      setProjetos([]);
      setAuditores([]);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const ongoingAudits = useMemo(() => {
    return auditorias.filter(a => a.status !== StatusAuditoria.CONCLUIDA && a.status !== StatusAuditoria.CANCELADA);
  }, [auditorias]);

  const completedAudits = useMemo(() => {
    return auditorias.filter(a => a.status === StatusAuditoria.CONCLUIDA);
  }, [auditorias]);

  const filteredAuditorias = useMemo(() => {
    const list = activeTab === 'historico' ? completedAudits : ongoingAudits;
    return list.filter(a => {
      const matchesSearch =
        a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activeTab, ongoingAudits, completedAudits, searchTerm, statusFilter]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [templates, searchTerm]);

  const conformanceTrendData = useMemo(() => {
    const months = ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months.map((mes) => ({
      mes,
      conformidade: 75 + Math.random() * 20,
      meta: 90,
    }));
  }, []);

  const handleSaveTemplate = async (templateData: Partial<ChecklistTemplate>) => {
    setIsSaving(true);
    try {
      if (editingTemplate) {
        if (usuario?.empresaId) {
          const updated = await auditoriaService.updateTemplate(editingTemplate.id, templateData);
          if (updated) {
            setTemplates(prev => prev.map(t => t.id === updated.id ? updated : t));
          } else {
            setTemplates(prev =>
              prev.map(t =>
                t.id === editingTemplate.id
                  ? { ...t, ...templateData, dataAtualizacao: new Date() }
                  : t
              )
            );
          }
        } else {
          setTemplates(prev =>
            prev.map(t =>
              t.id === editingTemplate.id
                ? { ...t, ...templateData, dataAtualizacao: new Date() }
                : t
            )
          );
        }
      } else {
        if (usuario?.empresaId) {
          const created = await auditoriaService.createTemplate({
            nome: templateData.nome || '',
            categoria: templateData.categoria || CategoriaChecklist.QUALIDADE,
            versao: templateData.versao || '1.0',
            itens: templateData.itens || [],
            empresaId: usuario.empresaId,
            createdBy: usuario?.id,
          });
          if (created) {
            setTemplates(prev => [...prev, created]);
          }
        } else {
          const newTemplate: ChecklistTemplate = {
            id: `tpl-${Date.now()}`,
            nome: templateData.nome || '',
            categoria: templateData.categoria || CategoriaChecklist.QUALIDADE,
            versao: templateData.versao || '1.0',
            itens: templateData.itens || [],
            dataCriacao: new Date(),
          };
          setTemplates(prev => [...prev, newTemplate]);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      if (editingTemplate) {
        setTemplates(prev =>
          prev.map(t =>
            t.id === editingTemplate.id
              ? { ...t, ...templateData, dataAtualizacao: new Date() }
              : t
          )
        );
      } else {
        const newTemplate: ChecklistTemplate = {
          id: `tpl-${Date.now()}`,
          nome: templateData.nome || '',
          categoria: templateData.categoria || CategoriaChecklist.QUALIDADE,
          versao: templateData.versao || '1.0',
          itens: templateData.itens || [],
          dataCriacao: new Date(),
        };
        setTemplates(prev => [...prev, newTemplate]);
      }
    } finally {
      setIsSaving(false);
    }
    setEditingTemplate(null);
  };

  const handleDuplicateTemplate = async (template: ChecklistTemplate) => {
    setIsSaving(true);
    try {
      if (usuario?.empresaId) {
        const created = await auditoriaService.createTemplate({
          nome: `${template.nome} (Cópia)`,
          categoria: template.categoria,
          versao: '1.0',
          itens: template.itens,
          empresaId: usuario.empresaId,
          createdBy: usuario?.id,
        });
        if (created) {
          setTemplates(prev => [...prev, created]);
        } else {
          const newTemplate: ChecklistTemplate = {
            ...template,
            id: `tpl-${Date.now()}`,
            nome: `${template.nome} (Cópia)`,
            versao: '1.0',
            dataCriacao: new Date(),
            dataAtualizacao: undefined,
          };
          setTemplates(prev => [...prev, newTemplate]);
        }
      } else {
        const newTemplate: ChecklistTemplate = {
          ...template,
          id: `tpl-${Date.now()}`,
          nome: `${template.nome} (Cópia)`,
          versao: '1.0',
          dataCriacao: new Date(),
          dataAtualizacao: undefined,
        };
        setTemplates(prev => [...prev, newTemplate]);
      }
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      const newTemplate: ChecklistTemplate = {
        ...template,
        id: `tpl-${Date.now()}`,
        nome: `${template.nome} (Cópia)`,
        versao: '1.0',
        dataCriacao: new Date(),
        dataAtualizacao: undefined,
      };
      setTemplates(prev => [...prev, newTemplate]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;
    
    setIsSaving(true);
    try {
      if (usuario?.empresaId) {
        await auditoriaService.deleteTemplate(templateId);
      }
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAudit = async () => {
    if (!newAuditForm.titulo || !newAuditForm.checklistId || !newAuditForm.projetoId || !newAuditForm.responsavelId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const template = templates.find(t => t.id === newAuditForm.checklistId);
    const projeto = projetos.find(p => p.id === newAuditForm.projetoId);
    const auditor = auditores.find(a => a.id === newAuditForm.responsavelId);

    const itens = template?.itens.map((item, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      auditoriaId: '',
      itemChecklistId: item.id,
      ordem: idx + 1,
      pergunta: item.descricao,
      status: StatusItemAuditoria.PENDENTE,
    })) || [];

    setIsSaving(true);
    try {
      if (usuario?.empresaId) {
        const codigo = await auditoriaService.generateNextCodigo(usuario.empresaId);
        const created = await auditoriaService.createAuditoria({
          codigo,
          titulo: newAuditForm.titulo,
          checklistId: newAuditForm.checklistId,
          checklistNome: template?.nome,
          projetoId: newAuditForm.projetoId,
          projetoNome: projeto?.nome,
          tipo: template?.categoria || 'Geral',
          responsavel: auditor?.nome || '',
          responsavelId: newAuditForm.responsavelId,
          dataAuditoria: parseDateOnly(newAuditForm.dataAuditoria) || new Date(),
          status: StatusAuditoria.PLANEJADA,
          itens,
          percentualConformidade: 0,
          naoConformidades: 0,
          empresaId: usuario.empresaId,
          createdBy: usuario?.id,
        });
        if (created) {
          setAuditorias(prev => [...prev, created]);
        }
      } else {
        const newAudit: Auditoria = {
          id: `aud-${Date.now()}`,
          codigo: `AUD-${String(auditorias.length + 1).padStart(3, '0')}`,
          titulo: newAuditForm.titulo,
          checklistId: newAuditForm.checklistId,
          checklistNome: template?.nome || '',
          projetoId: newAuditForm.projetoId,
          projetoNome: projeto?.nome || '',
          tipo: template?.categoria || 'Geral',
          responsavel: auditor?.nome || '',
          responsavelId: newAuditForm.responsavelId,
          dataAuditoria: parseDateOnly(newAuditForm.dataAuditoria) || new Date(),
          status: StatusAuditoria.PLANEJADA,
          percentualConformidade: 0,
          naoConformidades: 0,
          dataCriacao: new Date(),
          itens,
        };
        setAuditorias(prev => [...prev, newAudit]);
      }
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
      const newAudit: Auditoria = {
        id: `aud-${Date.now()}`,
        codigo: `AUD-${String(auditorias.length + 1).padStart(3, '0')}`,
        titulo: newAuditForm.titulo,
        checklistId: newAuditForm.checklistId,
        checklistNome: template?.nome || '',
        projetoId: newAuditForm.projetoId,
        projetoNome: projeto?.nome || '',
        tipo: template?.categoria || 'Geral',
        responsavel: auditor?.nome || '',
        responsavelId: newAuditForm.responsavelId,
        dataAuditoria: parseDateOnly(newAuditForm.dataAuditoria) || new Date(),
        status: StatusAuditoria.PLANEJADA,
        percentualConformidade: 0,
        naoConformidades: 0,
        dataCriacao: new Date(),
        itens,
      };
      setAuditorias(prev => [...prev, newAudit]);
    } finally {
      setIsSaving(false);
    }

    setShowNewAuditModal(false);
    setNewAuditForm({
      titulo: '',
      checklistId: '',
      projetoId: '',
      responsavelId: '',
      dataAuditoria: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handleSaveAuditItems = async (items: ItemAuditoria[]) => {
    if (!selectedAuditoria) return;

    const { percentual: conformanceScore, naoConformidades: naoConformeCount } = auditoriaService.calculateConformidade(items);
    const pendingCount = items.filter(i => i.status === StatusItemAuditoria.PENDENTE).length;

    let newStatus = selectedAuditoria.status;
    if (pendingCount === 0) {
      newStatus = StatusAuditoria.CONCLUIDA;
    } else if (pendingCount < items.length) {
      newStatus = StatusAuditoria.EM_ANDAMENTO;
    }

    setIsSaving(true);
    try {
      if (usuario?.empresaId) {
        const updated = await auditoriaService.updateAuditoria(selectedAuditoria.id, {
          itens: items,
          percentualConformidade: conformanceScore,
          naoConformidades: naoConformeCount,
          status: newStatus,
        });
        if (updated) {
          setAuditorias(prev => prev.map(a => a.id === updated.id ? updated : a));
        } else {
          setAuditorias(prev =>
            prev.map(a =>
              a.id === selectedAuditoria.id
                ? {
                    ...a,
                    itens: items,
                    percentualConformidade: conformanceScore,
                    naoConformidades: naoConformeCount,
                    status: newStatus,
                  }
                : a
            )
          );
        }
      } else {
        setAuditorias(prev =>
          prev.map(a =>
            a.id === selectedAuditoria.id
              ? {
                  ...a,
                  itens: items,
                  percentualConformidade: conformanceScore,
                  naoConformidades: naoConformeCount,
                  status: newStatus,
                }
              : a
          )
        );
      }
    } catch (error) {
      console.error('Erro ao salvar itens de auditoria:', error);
      setAuditorias(prev =>
        prev.map(a =>
          a.id === selectedAuditoria.id
            ? {
                ...a,
                itens: items,
                percentualConformidade: conformanceScore,
                naoConformidades: naoConformeCount,
                status: newStatus,
              }
            : a
        )
      );
    } finally {
      setIsSaving(false);
    }
    
    setShowAuditModal(false);
    setSelectedAuditoria(null);
  };

  const handleGenerateActions = (nonConformItems: ItemAuditoria[]) => {
    alert(`${nonConformItems.length} ação(ões) 5W2H seriam geradas para as não conformidades encontradas.`);
  };

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'checklists', label: 'Checklists', count: templates.length },
    { id: 'auditorias', label: 'Auditorias em Andamento', count: ongoingAudits.length },
    { id: 'historico', label: 'Histórico', count: completedAudits.length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: tema.background }}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: tema.primary }} />
          <span style={{ color: tema.text }}>Carregando auditorias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" style={{ backgroundColor: tema.background, minHeight: '100vh' }}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: tema.text }}>
            Auditorias de Qualidade
          </h1>
          <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
            Gerencie checklists e auditorias de qualidade do projeto
          </p>
        </div>
        <button
          onClick={() => setShowNewAuditModal(true)}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-transform hover:scale-105 disabled:opacity-50"
          style={{ backgroundColor: tema.primary }}
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
          <span>Nova Auditoria</span>
        </button>
      </div>

      <div className="flex items-center gap-2 border-b" style={{ borderColor: tema.border }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-current'
                : 'border-transparent hover:border-gray-300'
            }`}
            style={{
              color: activeTab === tab.id ? tema.primary : tema.textSecondary,
              borderColor: activeTab === tab.id ? tema.primary : 'transparent',
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className="ml-2 px-2 py-0.5 text-xs rounded-full"
                style={{
                  backgroundColor: activeTab === tab.id ? tema.primary : '#E5E7EB',
                  color: activeTab === tab.id ? 'white' : tema.textSecondary,
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: tema.textSecondary }}
          />
          <input
            type="text"
            placeholder={activeTab === 'checklists' ? 'Buscar templates...' : 'Buscar auditorias...'}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border"
            style={{ borderColor: tema.border }}
          />
        </div>
        {activeTab !== 'checklists' && (
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusAuditoria | 'all')}
            className="px-4 py-2 rounded-lg border"
            style={{ borderColor: tema.border }}
          >
            <option value="all">Todos os Status</option>
            {Object.values(StatusAuditoria).map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>
        )}
      </div>

      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ color: tema.text }}>
              Templates de Checklist
            </h2>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setShowTemplateModal(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-100"
              style={{ borderColor: tema.border, color: tema.text }}
            >
              <Plus size={16} />
              <span>Novo Template</span>
            </button>
          </div>

          {filteredTemplates.length === 0 ? (
            <div 
              className="p-12 rounded-lg border text-center"
              style={{ borderColor: tema.border, backgroundColor: tema.surface }}
            >
              <ClipboardList size={48} className="mx-auto mb-4 opacity-40" style={{ color: tema.textSecondary }} />
              <p className="font-medium mb-2" style={{ color: tema.text }}>
                Nenhum template de checklist encontrado
              </p>
              <p className="text-sm mb-4" style={{ color: tema.textSecondary }}>
                Crie templates de checklist para usar nas auditorias de qualidade, segurança e meio ambiente.
              </p>
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setShowTemplateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: tema.primary }}
              >
                <Plus size={16} />
                Criar Primeiro Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map(template => {
                const CatIcon = getCategoriaIcon(template.categoria);
                return (
                  <div
                    key={template.id}
                    className="p-4 rounded-lg border transition-shadow hover:shadow-md"
                    style={{ borderColor: tema.border, backgroundColor: tema.surface }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: getCategoriaColor(template.categoria) + '20' }}
                      >
                        <CatIcon size={20} style={{ color: getCategoriaColor(template.categoria) }} />
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTemplate(template);
                            setShowTemplateModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Editar"
                        >
                          <Edit2 size={16} style={{ color: tema.textSecondary }} />
                        </button>
                        <button
                          onClick={() => handleDuplicateTemplate(template)}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Duplicar"
                        >
                          <Copy size={16} style={{ color: tema.textSecondary }} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 rounded hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 size={16} className="text-red-500" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-1" style={{ color: tema.text }}>
                      {template.nome}
                    </h3>
                    <p
                      className="text-sm px-2 py-0.5 rounded inline-block mb-3"
                      style={{
                        backgroundColor: getCategoriaColor(template.categoria) + '20',
                        color: getCategoriaColor(template.categoria),
                      }}
                    >
                      {getCategoriaLabel(template.categoria)}
                    </p>

                    <div className="flex items-center justify-between text-sm" style={{ color: tema.textSecondary }}>
                      <span>{template.itens.length} itens</span>
                      <span>v{template.versao}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(activeTab === 'auditorias' || activeTab === 'historico') && (
        <div className="space-y-4">
          {activeTab === 'historico' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: tema.border, backgroundColor: tema.surface }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: tema.text }}>
                    Tendência de Conformidade
                  </h3>
                  <button
                    className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg border hover:bg-gray-100"
                    style={{ borderColor: tema.border, color: tema.textSecondary }}
                  >
                    <Download size={14} />
                    Exportar
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={conformanceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip formatter={value => [`${Number(value).toFixed(1)}%`, '']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="conformidade"
                      name="Conformidade"
                      stroke={tema.primary}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="meta"
                      name="Meta"
                      stroke="#22C55E"
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div
                className="p-4 rounded-lg border"
                style={{ borderColor: tema.border, backgroundColor: tema.surface }}
              >
                <h3 className="font-semibold mb-4" style={{ color: tema.text }}>
                  Não Conformidades por Categoria
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { categoria: 'Segurança', total: 5 },
                      { categoria: 'Qualidade', total: 8 },
                      { categoria: 'Ambiental', total: 2 },
                      { categoria: 'Instalações', total: 3 },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="categoria" width={80} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#EF4444" name="Não Conformidades" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: tema.border, backgroundColor: tema.surface }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: tema.background }}>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Código
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Título
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Checklist
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Projeto
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Auditor
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Data
                  </th>
                  <th className="text-left p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Status
                  </th>
                  <th className="text-center p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Conformidade
                  </th>
                  <th className="text-center p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    NC
                  </th>
                  <th className="text-right p-3 text-sm font-medium" style={{ color: tema.textSecondary }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditorias.map(auditoria => (
                  <tr
                    key={auditoria.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: tema.border }}
                  >
                    <td className="p-3">
                      <span className="font-mono text-sm font-medium" style={{ color: tema.primary }}>
                        {auditoria.codigo}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium" style={{ color: tema.text }}>
                        {auditoria.titulo}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm" style={{ color: tema.textSecondary }}>
                        {auditoria.checklistNome}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm" style={{ color: tema.textSecondary }}>
                        {auditoria.projetoNome}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User size={14} style={{ color: tema.textSecondary }} />
                        <span className="text-sm" style={{ color: tema.text }}>
                          {auditoria.responsavel}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} style={{ color: tema.textSecondary }} />
                        <span className="text-sm" style={{ color: tema.text }}>
                          {format(auditoria.dataAuditoria, 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: getStatusColor(auditoria.status).bg,
                          color: getStatusColor(auditoria.status).text,
                        }}
                      >
                        {getStatusLabel(auditoria.status)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className="font-bold"
                        style={{
                          color:
                            (auditoria.percentualConformidade || 0) >= 80
                              ? '#22C55E'
                              : (auditoria.percentualConformidade || 0) >= 60
                              ? '#F59E0B'
                              : '#EF4444',
                        }}
                      >
                        {(auditoria.percentualConformidade || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {(auditoria.naoConformidades || 0) > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          {auditoria.naoConformidades}
                        </span>
                      ) : (
                        <span className="text-sm" style={{ color: tema.textSecondary }}>
                          -
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setSelectedAuditoria(auditoria);
                            setShowAuditModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Ver/Editar"
                        >
                          <Eye size={16} style={{ color: tema.textSecondary }} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAuditoria(auditoria);
                            setShowAuditModal(true);
                          }}
                          className="p-1.5 rounded hover:bg-gray-100"
                          title="Executar Auditoria"
                        >
                          <Edit2 size={16} style={{ color: tema.textSecondary }} />
                        </button>
                        {(auditoria.naoConformidades || 0) > 0 && (
                          <button
                            onClick={() => handleGenerateActions(auditoria.itens.filter(i => i.status === StatusItemAuditoria.NAO_CONFORME))}
                            className="p-1.5 rounded hover:bg-yellow-50"
                            title="Gerar Ações 5W2H"
                          >
                            <AlertTriangle size={16} className="text-yellow-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAuditorias.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center" style={{ color: tema.textSecondary }}>
                      <div className="flex flex-col items-center gap-3 py-8">
                        <ClipboardList size={48} className="opacity-40" />
                        <p className="font-medium">Nenhuma auditoria encontrada</p>
                        {templates.length > 0 && projetos.length > 0 ? (
                          <p className="text-sm">Clique em "Nova Auditoria" para programar uma auditoria</p>
                        ) : templates.length === 0 ? (
                          <p className="text-sm">Crie um template de checklist primeiro na aba "Checklists"</p>
                        ) : (
                          <p className="text-sm">Nenhum projeto disponível. Cadastre projetos no sistema.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(null);
        }}
        onSave={handleSaveTemplate}
        template={editingTemplate}
      />

      {selectedAuditoria && (
        <AuditExecutionModal
          isOpen={showAuditModal}
          onClose={() => {
            setShowAuditModal(false);
            setSelectedAuditoria(null);
          }}
          auditoria={selectedAuditoria}
          onSave={handleSaveAuditItems}
          onGenerateActions={handleGenerateActions}
        />
      )}

      {showNewAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="relative w-full max-w-lg rounded-lg shadow-xl"
            style={{ backgroundColor: tema.surface }}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: tema.border }}
            >
              <h2 className="text-xl font-bold" style={{ color: tema.text }}>
                Nova Auditoria
              </h2>
              <button
                onClick={() => setShowNewAuditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} style={{ color: tema.textSecondary }} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Título da Auditoria *
                </label>
                <input
                  type="text"
                  value={newAuditForm.titulo}
                  onChange={e => setNewAuditForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                  placeholder="Ex: Auditoria de Segurança - Bloco B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Template de Checklist *
                </label>
                <select
                  value={newAuditForm.checklistId}
                  onChange={e => setNewAuditForm(prev => ({ ...prev, checklistId: e.target.value }))}
                  className="w-full p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                >
                  <option value="">Selecione um template</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nome} ({t.itens.length} itens)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Projeto *
                </label>
                <select
                  value={newAuditForm.projetoId}
                  onChange={e => setNewAuditForm(prev => ({ ...prev, projetoId: e.target.value }))}
                  className="w-full p-2 rounded-lg border"
                  style={{ borderColor: tema.border }}
                >
                  <option value="">Selecione um projeto</option>
                  {projetos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Auditor *
                  </label>
                  <select
                    value={newAuditForm.responsavelId}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, responsavelId: e.target.value }))}
                    className="w-full p-2 rounded-lg border"
                    style={{ borderColor: tema.border }}
                  >
                    <option value="">Selecione</option>
                    {auditores.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Data da Auditoria *
                  </label>
                  <input
                    type="date"
                    value={newAuditForm.dataAuditoria}
                    onChange={e => setNewAuditForm(prev => ({ ...prev, dataAuditoria: e.target.value }))}
                    className="w-full p-2 rounded-lg border"
                    style={{ borderColor: tema.border }}
                  />
                </div>
              </div>
            </div>

            <div
              className="flex items-center justify-end gap-2 p-4 border-t"
              style={{ borderColor: tema.border }}
            >
              <button
                onClick={() => setShowNewAuditModal(false)}
                className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-100"
                style={{ borderColor: tema.border, color: tema.text }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateAudit}
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: tema.primary }}
              >
                Criar Auditoria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditoriaPage;
