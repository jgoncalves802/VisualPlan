import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  GitBranch,
  Plus,
  Eye,
  Check,
  X,
  Clock,
  Search,
  Filter,
  User,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  MessageSquare,
  Paperclip,
  History,
} from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';
import {
  SolicitacaoMudanca,
  StatusMudanca,
  TipoMudanca,
  ImpactoMudanca,
  PrioridadeAcao,
} from '../types/gestao';

const MOCK_PROJETOS = [
  { id: 'proj-1', nome: 'Edifício Corporativo Alpha' },
  { id: 'proj-2', nome: 'Residencial Vista Verde' },
  { id: 'proj-3', nome: 'Shopping Center Plaza' },
];

const generateMockSolicitacoes = (): SolicitacaoMudanca[] => {
  const hoje = new Date();
  return [
    {
      id: 'sm-1',
      codigo: 'SM-001',
      titulo: 'Alteração do layout do pavimento tipo',
      descricao: 'Necessidade de alterar o layout do pavimento tipo para adequação às novas exigências do cliente, incluindo reorganização das áreas comuns e redimensionamento dos escritórios.',
      justificativa: 'Cliente solicitou maior área de circulação e salas de reunião adicionais para atender o novo modelo de trabalho híbrido.',
      tipoMudanca: TipoMudanca.ESCOPO,
      prioridade: PrioridadeAcao.ALTA,
      solicitante: 'João Silva',
      solicitanteId: '1',
      dataSolicitacao: new Date(hoje.getTime() - 5 * 24 * 60 * 60 * 1000),
      status: StatusMudanca.EM_ANALISE,
      projetoId: 'proj-1',
      projetoNome: 'Edifício Corporativo Alpha',
      impactoCronograma: 15,
      impactoCusto: 250000,
      impactoQualidade: 'Melhoria na funcionalidade e conforto dos ambientes',
      recursosNecessarios: 'Equipe de projeto (2 arquitetos), Equipe de execução adicional',
      riscos: ['Atraso na entrega do pavimento tipo', 'Conflito com instalações já executadas'],
      impactoEstimado: ImpactoMudanca.ALTO,
      aprovadores: [
        { id: 'apr-1', nome: 'Carlos Lima', cargo: 'Gerente de Projetos', status: 'APROVADO', dataDecisao: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), comentario: 'Aprovado com ressalvas quanto ao prazo' },
        { id: 'apr-2', nome: 'Maria Santos', cargo: 'Diretora de Engenharia', status: 'PENDENTE' },
      ],
      historico: [
        { id: 'h-1', data: new Date(hoje.getTime() - 5 * 24 * 60 * 60 * 1000), usuario: 'João Silva', acao: 'Criou a solicitação' },
        { id: 'h-2', data: new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000), usuario: 'João Silva', acao: 'Submeteu para análise' },
        { id: 'h-3', data: new Date(hoje.getTime() - 2 * 24 * 60 * 60 * 1000), usuario: 'Carlos Lima', acao: 'Aprovou a solicitação', detalhes: 'Aprovado com ressalvas quanto ao prazo' },
      ],
      anexos: ['Planta_Alterada_v2.pdf', 'Orçamento_Adicional.xlsx'],
    },
    {
      id: 'sm-2',
      codigo: 'SM-002',
      titulo: 'Extensão do prazo de fundações',
      descricao: 'Solicitação de extensão do prazo para conclusão das fundações devido a condições climáticas adversas.',
      justificativa: 'Período de chuvas intensas nos últimos 20 dias impediu a continuidade dos trabalhos de escavação e concretagem.',
      tipoMudanca: TipoMudanca.PRAZO,
      prioridade: PrioridadeAcao.ALTA,
      solicitante: 'Maria Santos',
      solicitanteId: '2',
      dataSolicitacao: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: StatusMudanca.APROVADA,
      projetoId: 'proj-2',
      projetoNome: 'Residencial Vista Verde',
      impactoCronograma: 20,
      impactoCusto: 0,
      impactoEstimado: ImpactoMudanca.MEDIO,
      aprovadores: [
        { id: 'apr-3', nome: 'Carlos Lima', cargo: 'Gerente de Projetos', status: 'APROVADO', dataDecisao: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), comentario: 'Condições climáticas comprovadas' },
      ],
      historico: [
        { id: 'h-4', data: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000), usuario: 'Maria Santos', acao: 'Criou a solicitação' },
        { id: 'h-5', data: new Date(hoje.getTime() - 3 * 24 * 60 * 60 * 1000), usuario: 'Maria Santos', acao: 'Submeteu para análise' },
        { id: 'h-6', data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), usuario: 'Carlos Lima', acao: 'Aprovou a solicitação' },
      ],
    },
    {
      id: 'sm-3',
      codigo: 'SM-003',
      titulo: 'Substituição de fornecedor de aço',
      descricao: 'Troca do fornecedor de aço devido a problemas de qualidade e entrega.',
      justificativa: 'Fornecedor atual apresentou 3 lotes com defeito e atrasos recorrentes.',
      tipoMudanca: TipoMudanca.RECURSO,
      prioridade: PrioridadeAcao.MEDIA,
      solicitante: 'Ana Costa',
      solicitanteId: '4',
      dataSolicitacao: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000),
      status: StatusMudanca.SUBMETIDA,
      projetoId: 'proj-1',
      projetoNome: 'Edifício Corporativo Alpha',
      impactoCronograma: 0,
      impactoCusto: 50000,
      impactoEstimado: ImpactoMudanca.BAIXO,
      aprovadores: [
        { id: 'apr-4', nome: 'Carlos Lima', cargo: 'Gerente de Projetos', status: 'PENDENTE' },
      ],
      historico: [
        { id: 'h-7', data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), usuario: 'Ana Costa', acao: 'Criou a solicitação' },
        { id: 'h-8', data: new Date(hoje.getTime() - 1 * 24 * 60 * 60 * 1000), usuario: 'Ana Costa', acao: 'Submeteu para análise' },
      ],
    },
    {
      id: 'sm-4',
      codigo: 'SM-004',
      titulo: 'Aumento do orçamento de acabamentos',
      descricao: 'Solicitação de aumento de 15% no orçamento de acabamentos devido a valorização de materiais.',
      justificativa: 'Inflação nos insumos de construção, especialmente porcelanatos e metais.',
      tipoMudanca: TipoMudanca.CUSTO,
      prioridade: PrioridadeAcao.ALTA,
      solicitante: 'Carlos Lima',
      solicitanteId: '3',
      dataSolicitacao: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000),
      status: StatusMudanca.REJEITADA,
      projetoId: 'proj-3',
      projetoNome: 'Shopping Center Plaza',
      impactoCronograma: 0,
      impactoCusto: 180000,
      impactoEstimado: ImpactoMudanca.ALTO,
      aprovadores: [
        { id: 'apr-5', nome: 'Maria Santos', cargo: 'Diretora de Engenharia', status: 'REJEITADO', dataDecisao: new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000), comentario: 'Buscar alternativas de materiais com melhor custo-benefício' },
      ],
      historico: [
        { id: 'h-9', data: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000), usuario: 'Carlos Lima', acao: 'Criou a solicitação' },
        { id: 'h-10', data: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000), usuario: 'Carlos Lima', acao: 'Submeteu para análise' },
        { id: 'h-11', data: new Date(hoje.getTime() - 4 * 24 * 60 * 60 * 1000), usuario: 'Maria Santos', acao: 'Rejeitou a solicitação', detalhes: 'Buscar alternativas de materiais com melhor custo-benefício' },
      ],
    },
    {
      id: 'sm-5',
      codigo: 'SM-005',
      titulo: 'Revisão dos critérios de qualidade',
      descricao: 'Proposta de revisão dos critérios de aceitação para serviços de alvenaria.',
      justificativa: 'Os critérios atuais são muito restritivos e geram retrabalho desnecessário.',
      tipoMudanca: TipoMudanca.QUALIDADE,
      prioridade: PrioridadeAcao.BAIXA,
      solicitante: 'João Silva',
      solicitanteId: '1',
      dataSolicitacao: new Date(),
      status: StatusMudanca.RASCUNHO,
      projetoId: 'proj-2',
      projetoNome: 'Residencial Vista Verde',
      impactoCronograma: -5,
      impactoCusto: -20000,
      impactoEstimado: ImpactoMudanca.BAIXO,
      aprovadores: [],
      historico: [
        { id: 'h-12', data: new Date(), usuario: 'João Silva', acao: 'Criou a solicitação (rascunho)' },
      ],
    },
  ];
};

const getStatusColor = (status: StatusMudanca): { bg: string; text: string } => {
  switch (status) {
    case StatusMudanca.RASCUNHO:
      return { bg: '#E5E7EB', text: '#374151' };
    case StatusMudanca.SUBMETIDA:
      return { bg: '#FEF3C7', text: '#92400E' };
    case StatusMudanca.EM_ANALISE:
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case StatusMudanca.APROVADA:
      return { bg: '#D1FAE5', text: '#065F46' };
    case StatusMudanca.REJEITADA:
      return { bg: '#FEE2E2', text: '#991B1B' };
    case StatusMudanca.IMPLEMENTADA:
      return { bg: '#E0E7FF', text: '#3730A3' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getStatusLabel = (status: StatusMudanca): string => {
  switch (status) {
    case StatusMudanca.RASCUNHO:
      return 'Rascunho';
    case StatusMudanca.SUBMETIDA:
      return 'Submetida';
    case StatusMudanca.EM_ANALISE:
      return 'Em Análise';
    case StatusMudanca.APROVADA:
      return 'Aprovada';
    case StatusMudanca.REJEITADA:
      return 'Rejeitada';
    case StatusMudanca.IMPLEMENTADA:
      return 'Implementada';
    default:
      return status;
  }
};

const getTipoColor = (tipo: TipoMudanca): { bg: string; text: string } => {
  switch (tipo) {
    case TipoMudanca.ESCOPO:
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case TipoMudanca.PRAZO:
      return { bg: '#FEF3C7', text: '#92400E' };
    case TipoMudanca.CUSTO:
      return { bg: '#D1FAE5', text: '#065F46' };
    case TipoMudanca.QUALIDADE:
      return { bg: '#E0E7FF', text: '#3730A3' };
    case TipoMudanca.RECURSO:
      return { bg: '#FCE7F3', text: '#9D174D' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getTipoLabel = (tipo: TipoMudanca): string => {
  switch (tipo) {
    case TipoMudanca.ESCOPO:
      return 'Escopo';
    case TipoMudanca.PRAZO:
      return 'Prazo';
    case TipoMudanca.CUSTO:
      return 'Custo';
    case TipoMudanca.QUALIDADE:
      return 'Qualidade';
    case TipoMudanca.RECURSO:
      return 'Recurso';
    default:
      return tipo;
  }
};

const getImpactoColor = (impacto: ImpactoMudanca): { bg: string; text: string } => {
  switch (impacto) {
    case ImpactoMudanca.BAIXO:
      return { bg: '#D1FAE5', text: '#065F46' };
    case ImpactoMudanca.MEDIO:
      return { bg: '#FEF3C7', text: '#92400E' };
    case ImpactoMudanca.ALTO:
      return { bg: '#FED7AA', text: '#C2410C' };
    case ImpactoMudanca.CRITICO:
      return { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return { bg: '#E5E7EB', text: '#374151' };
  }
};

const getImpactoLabel = (impacto: ImpactoMudanca): string => {
  switch (impacto) {
    case ImpactoMudanca.BAIXO:
      return 'Baixo';
    case ImpactoMudanca.MEDIO:
      return 'Médio';
    case ImpactoMudanca.ALTO:
      return 'Alto';
    case ImpactoMudanca.CRITICO:
      return 'Crítico';
    default:
      return impacto;
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

interface MudancaModalProps {
  isOpen: boolean;
  onClose: () => void;
  solicitacao: SolicitacaoMudanca | null;
  mode: 'view' | 'create' | 'edit';
  onSave: (solicitacao: Partial<SolicitacaoMudanca>) => void;
  onSubmit?: (solicitacao: SolicitacaoMudanca) => void;
  onApprove?: (solicitacao: SolicitacaoMudanca) => void;
  onReject?: (solicitacao: SolicitacaoMudanca) => void;
}

const MudancaModal: React.FC<MudancaModalProps> = ({
  isOpen,
  onClose,
  solicitacao,
  mode,
  onSave,
  onSubmit,
  onApprove,
  onReject,
}) => {
  const { tema } = useTemaStore();
  const [activeSection, setActiveSection] = useState<number>(1);
  const [formData, setFormData] = useState<Partial<SolicitacaoMudanca>>({
    titulo: '',
    tipoMudanca: TipoMudanca.ESCOPO,
    projetoId: '',
    prioridade: PrioridadeAcao.MEDIA,
    descricao: '',
    justificativa: '',
    impactoCronograma: 0,
    impactoCusto: 0,
    impactoQualidade: '',
    recursosNecessarios: '',
    riscos: [],
    impactoEstimado: ImpactoMudanca.MEDIO,
  });
  const [newRisco, setNewRisco] = useState('');

  React.useEffect(() => {
    if (solicitacao && (mode === 'view' || mode === 'edit')) {
      setFormData(solicitacao);
    } else if (mode === 'create') {
      setFormData({
        titulo: '',
        tipoMudanca: TipoMudanca.ESCOPO,
        projetoId: '',
        prioridade: PrioridadeAcao.MEDIA,
        descricao: '',
        justificativa: '',
        impactoCronograma: 0,
        impactoCusto: 0,
        impactoQualidade: '',
        recursosNecessarios: '',
        riscos: [],
        impactoEstimado: ImpactoMudanca.MEDIO,
      });
    }
  }, [solicitacao, mode]);

  const addRisco = () => {
    if (newRisco.trim()) {
      setFormData(prev => ({
        ...prev,
        riscos: [...(prev.riscos || []), newRisco.trim()],
      }));
      setNewRisco('');
    }
  };

  const removeRisco = (index: number) => {
    setFormData(prev => ({
      ...prev,
      riscos: (prev.riscos || []).filter((_, i) => i !== index),
    }));
  };

  const isReadOnly = mode === 'view';

  if (!isOpen) return null;

  const sections = [
    { id: 1, title: 'Identificação', icon: FileText },
    { id: 2, title: 'Descrição', icon: MessageSquare },
    { id: 3, title: 'Análise de Impacto', icon: AlertTriangle },
    { id: 4, title: 'Workflow', icon: GitBranch },
  ];

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
          <div className="flex items-center gap-3">
            <GitBranch size={24} style={{ color: tema.primary }} />
            <div>
              <h2 className="text-xl font-bold" style={{ color: tema.text }}>
                {mode === 'create' ? 'Nova Solicitação de Mudança' : solicitacao?.titulo}
              </h2>
              {solicitacao && (
                <p className="text-sm" style={{ color: tema.textSecondary }}>
                  {solicitacao.codigo}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} style={{ color: tema.textSecondary }} />
          </button>
        </div>

        <div className="flex border-b" style={{ borderColor: tema.border }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeSection === section.id ? 'border-current' : 'border-transparent'
              }`}
              style={{
                color: activeSection === section.id ? tema.primary : tema.textSecondary,
              }}
            >
              <section.icon size={16} />
              {section.title}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {activeSection === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.titulo || ''}
                  onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                  placeholder="Descreva brevemente a mudança"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Tipo de Mudança *
                  </label>
                  <select
                    value={formData.tipoMudanca || ''}
                    onChange={e => setFormData(prev => ({ ...prev, tipoMudanca: e.target.value as TipoMudanca }))}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: tema.border,
                      backgroundColor: isReadOnly ? tema.background : tema.surface,
                      color: tema.text,
                    }}
                  >
                    {Object.values(TipoMudanca).map(tipo => (
                      <option key={tipo} value={tipo}>
                        {getTipoLabel(tipo)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Projeto *
                  </label>
                  <select
                    value={formData.projetoId || ''}
                    onChange={e => setFormData(prev => ({ ...prev, projetoId: e.target.value }))}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: tema.border,
                      backgroundColor: isReadOnly ? tema.background : tema.surface,
                      color: tema.text,
                    }}
                  >
                    <option value="">Selecione um projeto</option>
                    {MOCK_PROJETOS.map(proj => (
                      <option key={proj.id} value={proj.id}>
                        {proj.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Prioridade
                </label>
                <select
                  value={formData.prioridade || PrioridadeAcao.MEDIA}
                  onChange={e => setFormData(prev => ({ ...prev, prioridade: e.target.value as PrioridadeAcao }))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                >
                  {Object.values(PrioridadeAcao).map(prio => (
                    <option key={prio} value={prio}>
                      {getPrioridadeLabel(prio)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeSection === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Descrição Detalhada *
                </label>
                <textarea
                  value={formData.descricao || ''}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  disabled={isReadOnly}
                  rows={5}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                  placeholder="Descreva em detalhes a mudança proposta..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Justificativa *
                </label>
                <textarea
                  value={formData.justificativa || ''}
                  onChange={e => setFormData(prev => ({ ...prev, justificativa: e.target.value }))}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                  placeholder="Justifique a necessidade desta mudança..."
                />
              </div>
            </div>
          )}

          {activeSection === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Impacto no Cronograma (dias)
                  </label>
                  <input
                    type="number"
                    value={formData.impactoCronograma || 0}
                    onChange={e => setFormData(prev => ({ ...prev, impactoCronograma: parseInt(e.target.value) || 0 }))}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: tema.border,
                      backgroundColor: isReadOnly ? tema.background : tema.surface,
                      color: tema.text,
                    }}
                    placeholder="Positivo = atraso, Negativo = adiantamento"
                  />
                  <p className="text-xs mt-1" style={{ color: tema.textSecondary }}>
                    Positivo = atraso, Negativo = adiantamento
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                    Impacto no Custo (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.impactoCusto || 0}
                    onChange={e => setFormData(prev => ({ ...prev, impactoCusto: parseInt(e.target.value) || 0 }))}
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    style={{
                      borderColor: tema.border,
                      backgroundColor: isReadOnly ? tema.background : tema.surface,
                      color: tema.text,
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Impacto na Qualidade
                </label>
                <textarea
                  value={formData.impactoQualidade || ''}
                  onChange={e => setFormData(prev => ({ ...prev, impactoQualidade: e.target.value }))}
                  disabled={isReadOnly}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                  placeholder="Descreva o impacto na qualidade do projeto..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Recursos Necessários
                </label>
                <textarea
                  value={formData.recursosNecessarios || ''}
                  onChange={e => setFormData(prev => ({ ...prev, recursosNecessarios: e.target.value }))}
                  disabled={isReadOnly}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                  placeholder="Liste os recursos necessários..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Riscos
                </label>
                {!isReadOnly && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newRisco}
                      onChange={e => setNewRisco(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addRisco()}
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                      style={{
                        borderColor: tema.border,
                        color: tema.text,
                      }}
                      placeholder="Adicionar risco..."
                    />
                    <button
                      onClick={addRisco}
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: tema.primary }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {(formData.riscos || []).map((risco, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg"
                      style={{ backgroundColor: tema.background }}
                    >
                      <span className="text-sm" style={{ color: tema.text }}>
                        {risco}
                      </span>
                      {!isReadOnly && (
                        <button
                          onClick={() => removeRisco(idx)}
                          className="p-1 rounded hover:bg-red-100"
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: tema.text }}>
                  Impacto Estimado Geral
                </label>
                <select
                  value={formData.impactoEstimado || ImpactoMudanca.MEDIO}
                  onChange={e => setFormData(prev => ({ ...prev, impactoEstimado: e.target.value as ImpactoMudanca }))}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  style={{
                    borderColor: tema.border,
                    backgroundColor: isReadOnly ? tema.background : tema.surface,
                    color: tema.text,
                  }}
                >
                  {Object.values(ImpactoMudanca).map(imp => (
                    <option key={imp} value={imp}>
                      {getImpactoLabel(imp)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeSection === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4" style={{ color: tema.text }}>
                  Fluxo de Aprovação
                </h3>
                <div className="relative">
                  <div
                    className="absolute left-4 top-0 bottom-0 w-0.5"
                    style={{ backgroundColor: tema.border }}
                  />
                  <div className="space-y-4">
                    {[
                      { status: StatusMudanca.RASCUNHO, label: 'Rascunho' },
                      { status: StatusMudanca.SUBMETIDA, label: 'Submetida' },
                      { status: StatusMudanca.EM_ANALISE, label: 'Em Análise' },
                      { status: StatusMudanca.APROVADA, label: 'Aprovada / Rejeitada' },
                      { status: StatusMudanca.IMPLEMENTADA, label: 'Implementada' },
                    ].map((step, idx) => {
                      const currentStatus = solicitacao?.status || StatusMudanca.RASCUNHO;
                      const statusOrder = [StatusMudanca.RASCUNHO, StatusMudanca.SUBMETIDA, StatusMudanca.EM_ANALISE, StatusMudanca.APROVADA, StatusMudanca.IMPLEMENTADA];
                      const currentIdx = statusOrder.indexOf(currentStatus);
                      const stepIdx = idx;
                      const isCompleted = stepIdx < currentIdx || (currentStatus === StatusMudanca.REJEITADA && stepIdx <= 3);
                      const isCurrent = (stepIdx === currentIdx) || (currentStatus === StatusMudanca.REJEITADA && stepIdx === 3);

                      return (
                        <div key={step.status} className="relative flex items-center gap-4 ml-4">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                              isCompleted ? 'bg-green-500' : isCurrent ? 'bg-blue-500' : 'bg-gray-300'
                            }`}
                          >
                            {isCompleted ? (
                              <Check size={16} className="text-white" />
                            ) : (
                              <span className="text-white text-sm">{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <p
                              className="font-medium"
                              style={{ color: isCurrent ? tema.primary : tema.text }}
                            >
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {solicitacao?.aprovadores && solicitacao.aprovadores.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: tema.text }}>
                    Aprovadores
                  </h3>
                  <div className="space-y-3">
                    {solicitacao.aprovadores.map(aprovador => (
                      <div
                        key={aprovador.id}
                        className="p-4 rounded-lg border"
                        style={{ borderColor: tema.border, backgroundColor: tema.background }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: tema.primary + '20' }}
                            >
                              <User size={20} style={{ color: tema.primary }} />
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: tema.text }}>
                                {aprovador.nome}
                              </p>
                              <p className="text-sm" style={{ color: tema.textSecondary }}>
                                {aprovador.cargo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {aprovador.status === 'APROVADO' && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle size={14} /> Aprovado
                              </span>
                            )}
                            {aprovador.status === 'REJEITADO' && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle size={14} /> Rejeitado
                              </span>
                            )}
                            {aprovador.status === 'PENDENTE' && (
                              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                <Clock size={14} /> Pendente
                              </span>
                            )}
                          </div>
                        </div>
                        {aprovador.comentario && (
                          <p
                            className="mt-2 text-sm p-2 rounded"
                            style={{ backgroundColor: tema.surface, color: tema.textSecondary }}
                          >
                            "{aprovador.comentario}"
                          </p>
                        )}
                        {aprovador.dataDecisao && (
                          <p className="text-xs mt-2" style={{ color: tema.textSecondary }}>
                            {format(new Date(aprovador.dataDecisao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {solicitacao?.anexos && solicitacao.anexos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: tema.text }}>
                    <Paperclip size={18} /> Anexos
                  </h3>
                  <div className="space-y-2">
                    {solicitacao.anexos.map((anexo, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ backgroundColor: tema.background }}
                      >
                        <FileText size={16} style={{ color: tema.primary }} />
                        <span className="text-sm" style={{ color: tema.text }}>
                          {anexo}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {solicitacao?.historico && solicitacao.historico.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: tema.text }}>
                    <History size={18} /> Histórico de Alterações
                  </h3>
                  <div className="space-y-3">
                    {solicitacao.historico.map(hist => (
                      <div
                        key={hist.id}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: tema.background }}
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: tema.primary + '20' }}
                        >
                          <Clock size={14} style={{ color: tema.primary }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: tema.text }}>
                            {hist.usuario}
                          </p>
                          <p className="text-sm" style={{ color: tema.textSecondary }}>
                            {hist.acao}
                          </p>
                          {hist.detalhes && (
                            <p className="text-sm mt-1 italic" style={{ color: tema.textSecondary }}>
                              "{hist.detalhes}"
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: tema.textSecondary }}>
                            {format(new Date(hist.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: tema.border }}
        >
          <div className="flex items-center gap-2">
            {mode === 'view' && solicitacao?.status === StatusMudanca.RASCUNHO && (
              <button
                onClick={() => onSubmit?.(solicitacao)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: tema.primary }}
              >
                <Send size={16} /> Submeter
              </button>
            )}
            {mode === 'view' && (solicitacao?.status === StatusMudanca.SUBMETIDA || solicitacao?.status === StatusMudanca.EM_ANALISE) && (
              <>
                <button
                  onClick={() => onApprove?.(solicitacao)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-green-500 hover:bg-green-600"
                >
                  <Check size={16} /> Aprovar
                </button>
                <button
                  onClick={() => onReject?.(solicitacao)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600"
                >
                  <X size={16} /> Rejeitar
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
              style={{ borderColor: tema.border, color: tema.text }}
            >
              {mode === 'view' ? 'Fechar' : 'Cancelar'}
            </button>
            {(mode === 'create' || mode === 'edit') && (
              <button
                onClick={() => onSave(formData)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                style={{ backgroundColor: tema.primary }}
              >
                Salvar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GestaoMudancaPage: React.FC = () => {
  const { tema } = useTemaStore();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoMudanca[]>(() => generateMockSolicitacoes());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');
  const [projetoFilter, setProjetoFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoMudanca | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');

  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter(sol => {
      const matchesSearch = sol.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sol.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || sol.status === statusFilter;
      const matchesTipo = tipoFilter === 'all' || sol.tipoMudanca === tipoFilter;
      const matchesPrioridade = prioridadeFilter === 'all' || sol.prioridade === prioridadeFilter;
      const matchesProjeto = projetoFilter === 'all' || sol.projetoId === projetoFilter;
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(sol.dataSolicitacao) >= new Date(dateFrom);
      }
      if (dateTo) {
        matchesDate = matchesDate && new Date(sol.dataSolicitacao) <= new Date(dateTo);
      }

      return matchesSearch && matchesStatus && matchesTipo && matchesPrioridade && matchesProjeto && matchesDate;
    });
  }, [solicitacoes, searchTerm, statusFilter, tipoFilter, prioridadeFilter, projetoFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    return {
      total: solicitacoes.length,
      pendentes: solicitacoes.filter(s => s.status === StatusMudanca.SUBMETIDA).length,
      emAnalise: solicitacoes.filter(s => s.status === StatusMudanca.EM_ANALISE).length,
      aprovadas: solicitacoes.filter(s => s.status === StatusMudanca.APROVADA).length,
      rejeitadas: solicitacoes.filter(s => s.status === StatusMudanca.REJEITADA).length,
    };
  }, [solicitacoes]);

  const openModal = (solicitacao: SolicitacaoMudanca | null, mode: 'view' | 'create' | 'edit') => {
    setSelectedSolicitacao(solicitacao);
    setModalMode(mode);
    setModalOpen(true);
  };

  const handleSave = (data: Partial<SolicitacaoMudanca>) => {
    if (modalMode === 'create') {
      const newSolicitacao: SolicitacaoMudanca = {
        ...data as SolicitacaoMudanca,
        id: `sm-${Date.now()}`,
        codigo: `SM-${String(solicitacoes.length + 1).padStart(3, '0')}`,
        solicitante: 'Usuário Atual',
        dataSolicitacao: new Date(),
        status: StatusMudanca.RASCUNHO,
        projetoNome: MOCK_PROJETOS.find(p => p.id === data.projetoId)?.nome || '',
        aprovadores: [],
        historico: [
          { id: `h-${Date.now()}`, data: new Date(), usuario: 'Usuário Atual', acao: 'Criou a solicitação (rascunho)' },
        ],
      };
      setSolicitacoes(prev => [...prev, newSolicitacao]);
    }
    setModalOpen(false);
  };

  const handleSubmit = (solicitacao: SolicitacaoMudanca) => {
    setSolicitacoes(prev =>
      prev.map(s =>
        s.id === solicitacao.id
          ? {
              ...s,
              status: StatusMudanca.SUBMETIDA,
              historico: [
                ...(s.historico || []),
                { id: `h-${Date.now()}`, data: new Date(), usuario: 'Usuário Atual', acao: 'Submeteu para análise' },
              ],
            }
          : s
      )
    );
    setModalOpen(false);
  };

  const handleApprove = (solicitacao: SolicitacaoMudanca) => {
    setSolicitacoes(prev =>
      prev.map(s =>
        s.id === solicitacao.id
          ? {
              ...s,
              status: StatusMudanca.APROVADA,
              dataAprovacao: new Date(),
              historico: [
                ...(s.historico || []),
                { id: `h-${Date.now()}`, data: new Date(), usuario: 'Usuário Atual', acao: 'Aprovou a solicitação' },
              ],
            }
          : s
      )
    );
    setModalOpen(false);
  };

  const handleReject = (solicitacao: SolicitacaoMudanca) => {
    setSolicitacoes(prev =>
      prev.map(s =>
        s.id === solicitacao.id
          ? {
              ...s,
              status: StatusMudanca.REJEITADA,
              dataAprovacao: new Date(),
              historico: [
                ...(s.historico || []),
                { id: `h-${Date.now()}`, data: new Date(), usuario: 'Usuário Atual', acao: 'Rejeitou a solicitação' },
              ],
            }
          : s
      )
    );
    setModalOpen(false);
  };

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: tema.background }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GitBranch size={28} style={{ color: tema.primary }} />
          <h1 className="text-2xl font-bold" style={{ color: tema.text }}>
            Gestão da Mudança
          </h1>
        </div>
        <button
          onClick={() => openModal(null, 'create')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors"
          style={{ backgroundColor: tema.primary }}
        >
          <Plus size={20} />
          Solicitar Mudança
        </button>
      </div>

      <div
        className="p-4 rounded-lg mb-6"
        style={{ backgroundColor: tema.surface, border: `1px solid ${tema.border}` }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} style={{ color: tema.textSecondary }} />
          <span className="font-medium" style={{ color: tema.text }}>
            Filtros
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: tema.textSecondary }}
            />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: tema.border, color: tema.text }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <option value="all">Todos Status</option>
            {Object.values(StatusMudanca).map(status => (
              <option key={status} value={status}>
                {getStatusLabel(status)}
              </option>
            ))}
          </select>

          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <option value="all">Todos Tipos</option>
            {Object.values(TipoMudanca).map(tipo => (
              <option key={tipo} value={tipo}>
                {getTipoLabel(tipo)}
              </option>
            ))}
          </select>

          <select
            value={prioridadeFilter}
            onChange={e => setPrioridadeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <option value="all">Todas Prioridades</option>
            {Object.values(PrioridadeAcao).map(prio => (
              <option key={prio} value={prio}>
                {getPrioridadeLabel(prio)}
              </option>
            ))}
          </select>

          <select
            value={projetoFilter}
            onChange={e => setProjetoFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ borderColor: tema.border, color: tema.text }}
          >
            <option value="all">Todos Projetos</option>
            {MOCK_PROJETOS.map(proj => (
              <option key={proj.id} value={proj.id}>
                {proj.nome}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{ borderColor: tema.border, color: tema.text }}
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
              style={{ borderColor: tema.border, color: tema.text }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: tema.surface, border: `1px solid ${tema.border}` }}
        >
          <p className="text-sm" style={{ color: tema.textSecondary }}>
            Total Solicitações
          </p>
          <p className="text-2xl font-bold" style={{ color: tema.text }}>
            {stats.total}
          </p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}
        >
          <p className="text-sm text-yellow-800">Pendentes de Análise</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pendentes}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#DBEAFE', border: '1px solid #93C5FD' }}
        >
          <p className="text-sm text-blue-800">Em Análise</p>
          <p className="text-2xl font-bold text-blue-900">{stats.emAnalise}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#D1FAE5', border: '1px solid #6EE7B7' }}
        >
          <p className="text-sm text-green-800">Aprovadas</p>
          <p className="text-2xl font-bold text-green-900">{stats.aprovadas}</p>
        </div>
        <div
          className="p-4 rounded-lg"
          style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5' }}
        >
          <p className="text-sm text-red-800">Rejeitadas</p>
          <p className="text-2xl font-bold text-red-900">{stats.rejeitadas}</p>
        </div>
      </div>

      <div
        className="rounded-lg overflow-hidden"
        style={{ backgroundColor: tema.surface, border: `1px solid ${tema.border}` }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: tema.background }}>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Código
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Título
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Projeto
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Solicitante
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Data
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: tema.text }}>
                  Impacto
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold" style={{ color: tema.text }}>
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSolicitacoes.map(sol => {
                const statusColor = getStatusColor(sol.status);
                const tipoColor = getTipoColor(sol.tipoMudanca);
                const impactoColor = getImpactoColor(sol.impactoEstimado);

                return (
                  <tr
                    key={sol.id}
                    className="border-t hover:bg-gray-50 transition-colors"
                    style={{ borderColor: tema.border }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium" style={{ color: tema.primary }}>
                        {sol.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: tema.text }}>
                        {sol.titulo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tipoColor.bg, color: tipoColor.text }}
                      >
                        {getTipoLabel(sol.tipoMudanca)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: tema.textSecondary }}>
                        {sol.projetoNome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: tema.text }}>
                        {sol.solicitante}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm" style={{ color: tema.textSecondary }}>
                        {format(new Date(sol.dataSolicitacao), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {getStatusLabel(sol.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: impactoColor.bg, color: impactoColor.text }}
                      >
                        {getImpactoLabel(sol.impactoEstimado)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openModal(sol, 'view')}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye size={16} style={{ color: tema.textSecondary }} />
                        </button>
                        {(sol.status === StatusMudanca.SUBMETIDA || sol.status === StatusMudanca.EM_ANALISE) && (
                          <>
                            <button
                              onClick={() => handleApprove(sol)}
                              className="p-1.5 rounded hover:bg-green-100 transition-colors"
                              title="Aprovar"
                            >
                              <Check size={16} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => handleReject(sol)}
                              className="p-1.5 rounded hover:bg-red-100 transition-colors"
                              title="Rejeitar"
                            >
                              <X size={16} className="text-red-600" />
                            </button>
                          </>
                        )}
                        {sol.status === StatusMudanca.RASCUNHO && (
                          <button
                            onClick={() => handleSubmit(sol)}
                            className="p-1.5 rounded hover:bg-blue-100 transition-colors"
                            title="Submeter"
                          >
                            <Send size={16} className="text-blue-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSolicitacoes.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center">
                    <p style={{ color: tema.textSecondary }}>
                      Nenhuma solicitação encontrada
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <MudancaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        solicitacao={selectedSolicitacao}
        mode={modalMode}
        onSave={handleSave}
        onSubmit={handleSubmit}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default GestaoMudancaPage;
