import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Calendar,
  User,
  Tag,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  GitBranch,
  ClipboardList,
  TrendingDown,
  ArrowUpDown,
  Clock,
  Target,
  MoreVertical,
  Link,
  FileText,
} from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { parseDateOnly, getInputDateValue } from '../utils/dateHelpers';
import { acoes5w2hService } from '../services/acoes5w2hService';
import { userService } from '../services/userService';
import { restricao5w2hSyncService } from '../services/restricao5w2hSyncService';
import {
  Acao5W2H,
  StatusAcao5W2H,
  PrioridadeAcao,
  OrigemAcao,
} from '../types/gestao';

const MOCK_RESPONSAVEIS = [
  { id: '1', nome: 'João Silva' },
  { id: '2', nome: 'Maria Santos' },
  { id: '3', nome: 'Carlos Lima' },
  { id: '4', nome: 'Ana Costa' },
  { id: '5', nome: 'Pedro Souza' },
];

const MOCK_ATIVIDADES_GANTT = [
  { id: 'act-1', nome: '1.2.3.1 - Fundação Bloco A' },
  { id: 'act-2', nome: '1.3.2.4 - Estrutura Metálica P2' },
  { id: 'act-3', nome: '2.1.1.3 - Instalações Elétricas' },
];

const MOCK_RESTRICOES_LPS = [
  { id: 'rest-1', descricao: 'RES-001 - Falta de material para fundação' },
  { id: 'rest-2', descricao: 'RES-002 - Equipamento indisponível' },
  { id: 'rest-3', descricao: 'RES-003 - Aprovação de projeto pendente' },
];

const getOrigemIcon = (origem: OrigemAcao) => {
  switch (origem) {
    case OrigemAcao.RESTRICAO_LPS:
      return AlertTriangle;
    case OrigemAcao.AUDITORIA:
      return FileCheck;
    case OrigemAcao.MUDANCA:
      return GitBranch;
    case OrigemAcao.PDCA:
      return RefreshCw;
    case OrigemAcao.MANUAL:
      return ClipboardList;
    case OrigemAcao.KPI_DESVIO:
      return TrendingDown;
    default:
      return FileText;
  }
};

const getOrigemColor = (origem: OrigemAcao): string => {
  switch (origem) {
    case OrigemAcao.RESTRICAO_LPS:
      return '#F97316';
    case OrigemAcao.AUDITORIA:
      return '#EF4444';
    case OrigemAcao.MUDANCA:
      return '#EAB308';
    case OrigemAcao.PDCA:
      return '#8B5CF6';
    case OrigemAcao.MANUAL:
      return '#6B7280';
    case OrigemAcao.KPI_DESVIO:
      return '#EC4899';
    default:
      return '#6B7280';
  }
};

const getOrigemLabel = (origem: OrigemAcao): string => {
  switch (origem) {
    case OrigemAcao.RESTRICAO_LPS:
      return 'Restrição LPS';
    case OrigemAcao.AUDITORIA:
      return 'Auditoria';
    case OrigemAcao.MUDANCA:
      return 'Mudança';
    case OrigemAcao.PDCA:
      return 'PDCA';
    case OrigemAcao.MANUAL:
      return 'Manual';
    case OrigemAcao.KPI_DESVIO:
      return 'KPI Desvio';
    default:
      return origem;
  }
};

const getStatusColor = (status: StatusAcao5W2H): { bg: string; text: string } => {
  switch (status) {
    case StatusAcao5W2H.PENDENTE:
      return { bg: '#FEF3C7', text: '#92400E' };
    case StatusAcao5W2H.EM_ANDAMENTO:
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case StatusAcao5W2H.CONCLUIDA:
      return { bg: '#D1FAE5', text: '#065F46' };
    case StatusAcao5W2H.ATRASADA:
      return { bg: '#FEE2E2', text: '#991B1B' };
    case StatusAcao5W2H.CANCELADA:
      return { bg: '#E5E7EB', text: '#374151' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getStatusLabel = (status: StatusAcao5W2H): string => {
  switch (status) {
    case StatusAcao5W2H.PENDENTE:
      return 'Pendente';
    case StatusAcao5W2H.EM_ANDAMENTO:
      return 'Em Andamento';
    case StatusAcao5W2H.CONCLUIDA:
      return 'Concluída';
    case StatusAcao5W2H.ATRASADA:
      return 'Atrasada';
    case StatusAcao5W2H.CANCELADA:
      return 'Cancelada';
    default:
      return status;
  }
};

const getPrioridadeColor = (prioridade: PrioridadeAcao): { bg: string; text: string } => {
  switch (prioridade) {
    case PrioridadeAcao.ALTA:
      return { bg: '#FEE2E2', text: '#991B1B' };
    case PrioridadeAcao.MEDIA:
      return { bg: '#FEF3C7', text: '#92400E' };
    case PrioridadeAcao.BAIXA:
      return { bg: '#D1FAE5', text: '#065F46' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getPrioridadeLabel = (prioridade: PrioridadeAcao): string => {
  switch (prioridade) {
    case PrioridadeAcao.ALTA:
      return 'Alta';
    case PrioridadeAcao.MEDIA:
      return 'Média';
    case PrioridadeAcao.BAIXA:
      return 'Baixa';
    default:
      return prioridade;
  }
};

type SortField = 'codigo' | 'oQue' | 'quem' | 'quando' | 'status' | 'origem' | 'prioridade';
type SortDirection = 'asc' | 'desc';

interface AcaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (acao: Partial<Acao5W2H>) => void;
  acao?: Acao5W2H | null;
  responsaveis?: { id: string; nome: string }[];
  isLoading?: boolean;
}

const AcaoModal: React.FC<AcaoModalProps> = ({ isOpen, onClose, onSave, acao, responsaveis = [] }) => {
  const { tema } = useTemaStore();
  const [formData, setFormData] = useState<Partial<Acao5W2H>>({
    codigo: acao?.codigo || '',
    oQue: acao?.oQue || '',
    porQue: acao?.porQue || '',
    onde: acao?.onde || '',
    quando: acao?.quando || new Date(),
    quem: acao?.quem || '',
    quemId: acao?.quemId || '',
    como: acao?.como || '',
    quanto: acao?.quanto || 0,
    quantoDescricao: acao?.quantoDescricao || '',
    status: acao?.status || StatusAcao5W2H.PENDENTE,
    prioridade: acao?.prioridade || PrioridadeAcao.MEDIA,
    origem: acao?.origem || OrigemAcao.MANUAL,
    origemDescricao: acao?.origemDescricao || '',
    atividadeGanttId: acao?.atividadeGanttId || '',
    restricaoLpsId: acao?.restricaoLpsId || '',
    observacoes: acao?.observacoes || '',
    tags: acao?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');

  React.useEffect(() => {
    if (acao) {
      setFormData({
        ...acao,
        quando: acao.quando instanceof Date ? acao.quando : new Date(acao.quando),
      });
    } else {
      setFormData({
        codigo: '',
        oQue: '',
        porQue: '',
        onde: '',
        quando: new Date(),
        quem: '',
        quemId: '',
        como: '',
        quanto: 0,
        quantoDescricao: '',
        status: StatusAcao5W2H.PENDENTE,
        prioridade: PrioridadeAcao.MEDIA,
        origem: OrigemAcao.MANUAL,
        origemDescricao: '',
        atividadeGanttId: '',
        restricaoLpsId: '',
        observacoes: '',
        tags: [],
      });
    }
  }, [acao]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.oQue || !formData.porQue || !formData.quem || !formData.quando) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSave(formData);
  };

  const handleResponsavelChange = (id: string) => {
    const responsavel = responsaveis.find((r) => r.id === id);
    setFormData({
      ...formData,
      quemId: id,
      quem: responsavel?.nome || '',
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ backgroundColor: tema.primary + '10' }}
        >
          <h2 className="text-xl font-bold" style={{ color: tema.primary }}>
            {acao ? 'Editar Ação 5W2H' : 'Nova Ação 5W2H'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código
              </label>
              <input
                type="text"
                value={formData.codigo}
                disabled
                className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                O QUÊ (What) - Ação a ser executada *
              </label>
              <textarea
                value={formData.oQue}
                onChange={(e) => setFormData({ ...formData, oQue: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none"
                style={{ outlineColor: tema.primary }}
                placeholder="Descreva a ação que deve ser executada..."
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                POR QUÊ (Why) - Justificativa *
              </label>
              <textarea
                value={formData.porQue}
                onChange={(e) => setFormData({ ...formData, porQue: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none"
                placeholder="Por que esta ação é necessária..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ONDE (Where) - Local
              </label>
              <input
                type="text"
                value={formData.onde || ''}
                onChange={(e) => setFormData({ ...formData, onde: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="Local de execução..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QUANDO (When) - Prazo *
              </label>
              <input
                type="date"
                value={formData.quando ? getInputDateValue(formData.quando) : ''}
                onChange={(e) =>
                  setFormData({ ...formData, quando: e.target.value ? parseDateOnly(e.target.value) ?? undefined : undefined })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QUEM (Who) - Responsável *
              </label>
              <select
                value={formData.quemId || ''}
                onChange={(e) => handleResponsavelChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                required
              >
                <option value="">Selecione o responsável...</option>
                {responsaveis.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridade *
              </label>
              <select
                value={formData.prioridade || PrioridadeAcao.MEDIA}
                onChange={(e) =>
                  setFormData({ ...formData, prioridade: e.target.value as PrioridadeAcao })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value={PrioridadeAcao.ALTA}>Alta</option>
                <option value={PrioridadeAcao.MEDIA}>Média</option>
                <option value={PrioridadeAcao.BAIXA}>Baixa</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                COMO (How) - Método de execução
              </label>
              <textarea
                value={formData.como || ''}
                onChange={(e) => setFormData({ ...formData, como: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none"
                placeholder="Descreva como a ação será executada..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QUANTO (How Much) - Custo
              </label>
              <input
                type="number"
                value={formData.quanto || 0}
                onChange={(e) =>
                  setFormData({ ...formData, quanto: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição do Custo
              </label>
              <input
                type="text"
                value={formData.quantoDescricao || ''}
                onChange={(e) => setFormData({ ...formData, quantoDescricao: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="Ex: Custo de material adicional..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origem
              </label>
              <select
                value={formData.origem || OrigemAcao.MANUAL}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value as OrigemAcao })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value={OrigemAcao.MANUAL}>Manual</option>
                <option value={OrigemAcao.RESTRICAO_LPS}>Restrição LPS</option>
                <option value={OrigemAcao.AUDITORIA}>Auditoria</option>
                <option value={OrigemAcao.MUDANCA}>Mudança</option>
                <option value={OrigemAcao.PDCA}>PDCA</option>
                <option value={OrigemAcao.KPI_DESVIO}>KPI Desvio</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status || StatusAcao5W2H.PENDENTE}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as StatusAcao5W2H })
                }
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value={StatusAcao5W2H.PENDENTE}>Pendente</option>
                <option value={StatusAcao5W2H.EM_ANDAMENTO}>Em Andamento</option>
                <option value={StatusAcao5W2H.CONCLUIDA}>Concluída</option>
                <option value={StatusAcao5W2H.ATRASADA}>Atrasada</option>
                <option value={StatusAcao5W2H.CANCELADA}>Cancelada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link size={14} className="inline mr-1" />
                Vincular a Atividade Gantt
              </label>
              <select
                value={formData.atividadeGanttId || ''}
                onChange={(e) => setFormData({ ...formData, atividadeGanttId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="">Nenhuma</option>
                {MOCK_ATIVIDADES_GANTT.map((ativ) => (
                  <option key={ativ.id} value={ativ.id}>
                    {ativ.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link size={14} className="inline mr-1" />
                Vincular a Restrição LPS
              </label>
              <select
                value={formData.restricaoLpsId || ''}
                onChange={(e) => setFormData({ ...formData, restricaoLpsId: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="">Nenhuma</option>
                {MOCK_RESTRICOES_LPS.map((rest) => (
                  <option key={rest.id} value={rest.id}>
                    {rest.descricao}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm"
                    style={{ backgroundColor: tema.primary + '20', color: tema.primary }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 hover:opacity-70"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="Adicionar tag..."
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: tema.primary }}
                >
                  Adicionar
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={formData.observacoes || ''}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none"
                placeholder="Observações adicionais..."
              />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg text-white"
            style={{ backgroundColor: tema.primary }}
          >
            {acao ? 'Salvar Alterações' : 'Criar Ação'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'restriction' | 'audit' | 'kpi') => void;
}

const QuickActionMenu: React.FC<QuickActionMenuProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-20">
      <div className="p-2">
        <button
          onClick={() => {
            onSelect('restriction');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg text-left"
        >
          <AlertTriangle size={20} className="text-orange-500" />
          <div>
            <p className="font-medium text-gray-900">De Restrição LPS</p>
            <p className="text-xs text-gray-500">Criar ação a partir de restrição</p>
          </div>
        </button>
        <button
          onClick={() => {
            onSelect('audit');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg text-left"
        >
          <FileCheck size={20} className="text-red-500" />
          <div>
            <p className="font-medium text-gray-900">De Auditoria</p>
            <p className="text-xs text-gray-500">Criar ação de não conformidade</p>
          </div>
        </button>
        <button
          onClick={() => {
            onSelect('kpi');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 rounded-lg text-left"
        >
          <TrendingDown size={20} className="text-pink-500" />
          <div>
            <p className="font-medium text-gray-900">De Desvio de KPI</p>
            <p className="text-xs text-gray-500">Criar ação corretiva de indicador</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export const Acoes5W2HPage: React.FC = () => {
  const { tema } = useTemaStore();
  const { usuario } = useAuthStore();
  const { projetoSelecionado } = useProjetoStore();
  const [acoes, setAcoes] = useState<Acao5W2H[]>([]);
  const [responsaveis, setResponsaveis] = useState<{ id: string; nome: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOrigem, setFilterOrigem] = useState<OrigemAcao | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<StatusAcao5W2H | 'ALL'>('ALL');
  const [filterPrioridade, setFilterPrioridade] = useState<PrioridadeAcao | 'ALL'>('ALL');
  const [filterResponsavel, setFilterResponsavel] = useState<string>('ALL');
  const [filterDataInicio, setFilterDataInicio] = useState<string>('');
  const [filterDataFim, setFilterDataFim] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('codigo');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [modalAberto, setModalAberto] = useState(false);
  const [acaoSelecionada, setAcaoSelecionada] = useState<Acao5W2H | null>(null);
  const [quickActionMenuOpen, setQuickActionMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncRestricoes = async () => {
    if (!usuario?.empresaId) return;
    
    setIsSyncing(true);
    try {
      const result = await restricao5w2hSyncService.syncAllRestricoesSemAcao(usuario.empresaId);
      if (result.created > 0) {
        alert(`Sincronização concluída! ${result.created} ações criadas.`);
        loadAcoes();
      } else if (result.errors > 0) {
        alert(`Sincronização com erros: ${result.errors} falhas.`);
      } else {
        alert('Todas as restrições já possuem ações 5W2H vinculadas.');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar restrições.');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadAcoes = useCallback(async () => {
    if (!usuario?.empresaId) return;
    
    setIsLoading(true);
    try {
      const data = await acoes5w2hService.getAll(usuario.empresaId, projetoSelecionado?.id);
      setAcoes(data);
    } catch (error) {
      console.error('Erro ao carregar ações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId, projetoSelecionado?.id]);

  const loadResponsaveis = useCallback(async () => {
    if (!usuario?.empresaId) return;
    
    try {
      const { data } = await userService.getAll({ empresaId: usuario.empresaId, ativo: true });
      setResponsaveis((data || []).map(u => ({ id: u.id, nome: u.nome })));
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
      setResponsaveis(MOCK_RESPONSAVEIS);
    }
  }, [usuario?.empresaId]);

  useEffect(() => {
    loadAcoes();
    loadResponsaveis();
  }, [loadAcoes, loadResponsaveis]);

  const estatisticas = useMemo(() => {
    return {
      total: acoes.length,
      pendentes: acoes.filter((a) => a.status === StatusAcao5W2H.PENDENTE).length,
      emAndamento: acoes.filter((a) => a.status === StatusAcao5W2H.EM_ANDAMENTO).length,
      concluidas: acoes.filter((a) => a.status === StatusAcao5W2H.CONCLUIDA).length,
      atrasadas: acoes.filter((a) => a.status === StatusAcao5W2H.ATRASADA).length,
    };
  }, [acoes]);

  const acoesFiltradas = useMemo(() => {
    let resultado = [...acoes];

    if (searchTerm) {
      const termo = searchTerm.toLowerCase();
      resultado = resultado.filter(
        (a) =>
          a.codigo.toLowerCase().includes(termo) ||
          a.oQue.toLowerCase().includes(termo) ||
          a.porQue.toLowerCase().includes(termo) ||
          a.quem.toLowerCase().includes(termo)
      );
    }

    if (filterOrigem !== 'ALL') {
      resultado = resultado.filter((a) => a.origem === filterOrigem);
    }

    if (filterStatus !== 'ALL') {
      resultado = resultado.filter((a) => a.status === filterStatus);
    }

    if (filterPrioridade !== 'ALL') {
      resultado = resultado.filter((a) => a.prioridade === filterPrioridade);
    }

    if (filterResponsavel !== 'ALL') {
      resultado = resultado.filter((a) => a.quemId === filterResponsavel);
    }

    if (filterDataInicio) {
      const dataInicio = new Date(filterDataInicio);
      resultado = resultado.filter((a) => a.quando >= dataInicio);
    }

    if (filterDataFim) {
      const dataFim = new Date(filterDataFim);
      resultado = resultado.filter((a) => a.quando <= dataFim);
    }

    resultado.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'codigo':
          comparison = a.codigo.localeCompare(b.codigo);
          break;
        case 'oQue':
          comparison = a.oQue.localeCompare(b.oQue);
          break;
        case 'quem':
          comparison = a.quem.localeCompare(b.quem);
          break;
        case 'quando':
          comparison = new Date(a.quando).getTime() - new Date(b.quando).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'origem':
          comparison = a.origem.localeCompare(b.origem);
          break;
        case 'prioridade':
          const prioridadeOrder = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
          comparison = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return resultado;
  }, [acoes, searchTerm, filterOrigem, filterStatus, filterPrioridade, filterResponsavel, filterDataInicio, filterDataFim, sortField, sortDirection]);

  const getNextCodigo = async (): Promise<string> => {
    if (!usuario?.empresaId) {
      const maxNum = acoes.reduce((max, a) => {
        const num = parseInt(a.codigo.replace('5W2H-', ''));
        return num > max ? num : max;
      }, 0);
      return `5W2H-${String(maxNum + 1).padStart(3, '0')}`;
    }
    return acoes5w2hService.generateNextCodigo(usuario.empresaId);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleNovaAcao = () => {
    setAcaoSelecionada(null);
    setModalAberto(true);
  };

  const handleEditarAcao = (acao: Acao5W2H) => {
    setAcaoSelecionada(acao);
    setModalAberto(true);
  };

  const handleExcluirAcao = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação?')) {
      try {
        await acoes5w2hService.delete(id);
        setAcoes(acoes.filter((a) => a.id !== id));
      } catch (error) {
        console.error('Erro ao excluir ação:', error);
        alert('Erro ao excluir ação. Tente novamente.');
      }
    }
  };

  const handleConcluirAcao = async (id: string) => {
    try {
      const acao = acoes.find(a => a.id === id);
      const updateData = {
        status: StatusAcao5W2H.CONCLUIDA,
        dataConclusao: new Date(),
        percentualConcluido: 100,
      };
      
      const updated = acao?.restricaoLpsId && usuario?.empresaId
        ? await acoes5w2hService.updateWithSync(id, updateData, usuario.empresaId)
        : await acoes5w2hService.update(id, updateData);
        
      if (updated) {
        setAcoes(acoes.map((a) => (a.id === id ? updated : a)));
      }
    } catch (error) {
      console.error('Erro ao concluir ação:', error);
      setAcoes(
        acoes.map((a) =>
          a.id === id
            ? { ...a, status: StatusAcao5W2H.CONCLUIDA, dataConclusao: new Date(), percentualConcluido: 100 }
            : a
        )
      );
    }
  };

  const handleSaveAcao = async (acaoData: Partial<Acao5W2H>) => {
    if (!usuario?.empresaId) return;
    
    setIsSaving(true);
    try {
      if (acaoSelecionada?.id && !acaoSelecionada.id.startsWith('temp-')) {
        const updated = acaoSelecionada.restricaoLpsId
          ? await acoes5w2hService.updateWithSync(acaoSelecionada.id, acaoData, usuario.empresaId)
          : await acoes5w2hService.update(acaoSelecionada.id, acaoData);
        if (updated) {
          setAcoes(acoes.map((a) => (a.id === acaoSelecionada.id ? updated : a)));
        }
      } else {
        const codigo = await getNextCodigo();
        const created = await acoes5w2hService.create({
          ...acaoData,
          codigo,
          oQue: acaoData.oQue || '',
          porQue: acaoData.porQue || '',
          quando: acaoData.quando || new Date(),
          quem: acaoData.quem || '',
          status: acaoData.status || StatusAcao5W2H.PENDENTE,
          prioridade: acaoData.prioridade || PrioridadeAcao.MEDIA,
          origem: acaoData.origem || OrigemAcao.MANUAL,
          empresaId: usuario.empresaId,
          createdBy: usuario.id,
        });
        if (created) {
          setAcoes([created, ...acoes]);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar ação:', error);
      alert('Erro ao salvar ação. Tente novamente.');
    } finally {
      setIsSaving(false);
      setModalAberto(false);
      setAcaoSelecionada(null);
    }
  };

  const handleQuickAction = (type: 'restriction' | 'audit' | 'kpi') => {
    const prefilledData: Partial<Acao5W2H> = {
      id: `temp-${Date.now()}`,
      status: StatusAcao5W2H.PENDENTE,
      prioridade: PrioridadeAcao.ALTA,
      dataCriacao: new Date(),
    };

    switch (type) {
      case 'restriction':
        prefilledData.origem = OrigemAcao.RESTRICAO_LPS;
        prefilledData.oQue = 'Ação para remover restrição: ';
        prefilledData.porQue = 'Restrição identificada no planejamento LPS';
        break;
      case 'audit':
        prefilledData.origem = OrigemAcao.AUDITORIA;
        prefilledData.oQue = 'Ação corretiva para não conformidade: ';
        prefilledData.porQue = 'Não conformidade identificada em auditoria';
        break;
      case 'kpi':
        prefilledData.origem = OrigemAcao.KPI_DESVIO;
        prefilledData.oQue = 'Ação corretiva para desvio de indicador: ';
        prefilledData.porQue = 'Indicador fora da meta estabelecida';
        break;
    }

    setAcaoSelecionada(prefilledData as Acao5W2H);
    setModalAberto(true);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    );
  };

  const getDateIndicator = (data: Date, status: StatusAcao5W2H) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataAcao = new Date(data);
    dataAcao.setHours(0, 0, 0, 0);

    if (status === StatusAcao5W2H.CONCLUIDA) {
      return { color: tema.success, icon: CheckCircle };
    }

    const diffDays = Math.ceil((dataAcao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { color: tema.danger, icon: AlertTriangle };
    } else if (diffDays <= 3) {
      return { color: tema.warning, icon: Clock };
    } else {
      return { color: tema.success, icon: Calendar };
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: tema.text }}>
                Plano de Ação 5W2H
              </h1>
              <p className="text-sm mt-1" style={{ color: tema.textSecondary }}>
                Gestão de ações corretivas e preventivas
              </p>
            </div>
            <ProjetoSelector compact />
          </div>
          <div className="flex items-center gap-3 relative">
            <button
              onClick={handleSyncRestricoes}
              disabled={isSyncing}
              className="px-4 py-2 border rounded-lg hover:bg-orange-50 flex items-center gap-2 text-orange-600 border-orange-300 disabled:opacity-50"
              title="Criar ações 5W2H para restrições que ainda não possuem"
            >
              <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
              <span className="text-sm">{isSyncing ? 'Sincronizando...' : 'Sincronizar Restrições'}</span>
            </button>
            <button
              onClick={() => setQuickActionMenuOpen(!quickActionMenuOpen)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <MoreVertical size={18} />
              <span className="text-sm">Criar de...</span>
            </button>
            <QuickActionMenu
              isOpen={quickActionMenuOpen}
              onClose={() => setQuickActionMenuOpen(false)}
              onSelect={handleQuickAction}
            />
            <button
              onClick={handleNovaAcao}
              className="px-4 py-2 text-white rounded-lg flex items-center gap-2"
              style={{ backgroundColor: tema.primary }}
            >
              <Plus size={18} />
              <span className="text-sm font-medium">Nova Ação</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
              </div>
              <Target size={24} className="text-gray-400" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-900">{estatisticas.pendentes}</p>
              </div>
              <Clock size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-900">{estatisticas.emAndamento}</p>
              </div>
              <RefreshCw size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Concluídas</p>
                <p className="text-2xl font-bold text-green-900">{estatisticas.concluidas}</p>
              </div>
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Atrasadas</p>
                <p className="text-2xl font-bold text-red-900">{estatisticas.atrasadas}</p>
              </div>
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, descrição ou responsável..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              showFilters ? 'bg-blue-50 border-blue-300' : ''
            }`}
          >
            <Filter size={18} />
            <span className="text-sm">Filtros</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Origem</label>
              <select
                value={filterOrigem}
                onChange={(e) => setFilterOrigem(e.target.value as OrigemAcao | 'ALL')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ALL">Todas</option>
                <option value={OrigemAcao.RESTRICAO_LPS}>Restrição LPS</option>
                <option value={OrigemAcao.AUDITORIA}>Auditoria</option>
                <option value={OrigemAcao.MUDANCA}>Mudança</option>
                <option value={OrigemAcao.PDCA}>PDCA</option>
                <option value={OrigemAcao.MANUAL}>Manual</option>
                <option value={OrigemAcao.KPI_DESVIO}>KPI Desvio</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusAcao5W2H | 'ALL')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ALL">Todos</option>
                <option value={StatusAcao5W2H.PENDENTE}>Pendente</option>
                <option value={StatusAcao5W2H.EM_ANDAMENTO}>Em Andamento</option>
                <option value={StatusAcao5W2H.CONCLUIDA}>Concluída</option>
                <option value={StatusAcao5W2H.ATRASADA}>Atrasada</option>
                <option value={StatusAcao5W2H.CANCELADA}>Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Prioridade</label>
              <select
                value={filterPrioridade}
                onChange={(e) => setFilterPrioridade(e.target.value as PrioridadeAcao | 'ALL')}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ALL">Todas</option>
                <option value={PrioridadeAcao.ALTA}>Alta</option>
                <option value={PrioridadeAcao.MEDIA}>Média</option>
                <option value={PrioridadeAcao.BAIXA}>Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Responsável</label>
              <select
                value={filterResponsavel}
                onChange={(e) => setFilterResponsavel(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="ALL">Todos</option>
                {responsaveis.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
              <input
                type="date"
                value={filterDataInicio}
                onChange={(e) => setFilterDataInicio(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
              <input
                type="date"
                value={filterDataFim}
                onChange={(e) => setFilterDataFim(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white rounded-lg border h-full flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Carregando ações...</p>
              </div>
            </div>
          ) : acoesFiltradas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ClipboardList size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Nenhuma ação encontrada
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm || filterOrigem !== 'ALL' || filterStatus !== 'ALL'
                    ? 'Tente ajustar os filtros de busca'
                    : 'Clique em "Nova Ação" para criar sua primeira ação 5W2H'}
                </p>
                <button
                  onClick={handleNovaAcao}
                  className="px-4 py-2 text-white rounded-lg inline-flex items-center gap-2"
                  style={{ backgroundColor: tema.primary }}
                >
                  <Plus size={18} />
                  Nova Ação
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('codigo')}
                    >
                      <div className="flex items-center gap-1">
                        Código
                        <SortIcon field="codigo" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('oQue')}
                    >
                      <div className="flex items-center gap-1">
                        O QUÊ
                        <SortIcon field="oQue" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      POR QUÊ
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('quem')}
                    >
                      <div className="flex items-center gap-1">
                        QUEM
                        <SortIcon field="quem" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('quando')}
                    >
                      <div className="flex items-center gap-1">
                        QUANDO
                        <SortIcon field="quando" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        STATUS
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('origem')}
                    >
                      <div className="flex items-center gap-1">
                        ORIGEM
                        <SortIcon field="origem" />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('prioridade')}
                    >
                      <div className="flex items-center gap-1">
                        PRIORIDADE
                        <SortIcon field="prioridade" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AÇÕES
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {acoesFiltradas.map((acao) => {
                    const OrigemIcon = getOrigemIcon(acao.origem);
                    const dateIndicator = getDateIndicator(acao.quando, acao.status);
                    const DateIcon = dateIndicator.icon;
                    const statusColors = getStatusColor(acao.status);
                    const prioridadeColors = getPrioridadeColor(acao.prioridade);

                    return (
                      <tr key={acao.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="font-mono text-sm font-medium" style={{ color: tema.primary }}>
                            {acao.codigo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 line-clamp-2">{acao.oQue}</p>
                            {acao.tags && acao.tags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {acao.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                                    style={{ backgroundColor: tema.primary + '15', color: tema.primary }}
                                  >
                                    <Tag size={10} className="mr-1" />
                                    {tag}
                                  </span>
                                ))}
                                {acao.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{acao.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">{acao.porQue}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-900">{acao.quem}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <DateIcon size={14} style={{ color: dateIndicator.color }} />
                            <span className="text-sm text-gray-900">
                              {format(new Date(acao.quando), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {getStatusLabel(acao.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: getOrigemColor(acao.origem) }}
                          >
                            <OrigemIcon size={12} />
                            {getOrigemLabel(acao.origem)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: prioridadeColors.bg, color: prioridadeColors.text }}
                          >
                            {getPrioridadeLabel(acao.prioridade)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditarAcao(acao)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Visualizar/Editar"
                            >
                              <Eye size={16} className="text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleEditarAcao(acao)}
                              className="p-1.5 hover:bg-blue-50 rounded"
                              title="Editar"
                            >
                              <Edit2 size={16} className="text-blue-500" />
                            </button>
                            {acao.status !== StatusAcao5W2H.CONCLUIDA && (
                              <button
                                onClick={() => handleConcluirAcao(acao.id)}
                                className="p-1.5 hover:bg-green-50 rounded"
                                title="Marcar como concluída"
                              >
                                <CheckCircle size={16} className="text-green-500" />
                              </button>
                            )}
                            <button
                              onClick={() => handleExcluirAcao(acao.id)}
                              className="p-1.5 hover:bg-red-50 rounded"
                              title="Excluir"
                            >
                              <Trash2 size={16} className="text-red-500" />
                            </button>
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
      </div>

      <AcaoModal
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setAcaoSelecionada(null);
        }}
        onSave={handleSaveAcao}
        acao={acaoSelecionada}
        responsaveis={responsaveis}
        isLoading={isSaving}
      />
    </div>
  );
};

export default Acoes5W2HPage;
