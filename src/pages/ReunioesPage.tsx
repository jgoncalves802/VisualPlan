import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Plus,
  Calendar,
  Settings,
  History,
  Clock,
  Users,
  MapPin,
  Video,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  TrendingDown,
  ClipboardList,
  FileWarning,
  GripVertical,
  Sparkles,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { useProjetoStore } from '../stores/projetoStore';
import ProjetoSelector from '../components/ui/ProjetoSelector';
import { reunioesService } from '../services/reunioesService';
import { TipoReuniao } from '../types/gestao';

export enum StatusItemPauta {
  PENDENTE = 'PENDENTE',
  DISCUTIDO = 'DISCUTIDO',
  APROVADO = 'APROVADO',
  ADIADO = 'ADIADO',
}

export enum StatusReuniao {
  AGENDADA = 'AGENDADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export interface ItemPauta {
  id: string;
  titulo: string;
  tipo: 'RESTRICAO' | 'KPI' | 'ACAO' | 'INFORMATIVO' | 'DELIBERATIVO' | 'AUDITORIA';
  origemId?: string;
  descricao?: string;
  responsavel?: string;
  duracaoEstimada?: number;
  status: StatusItemPauta;
  decisao?: string;
  incluido: boolean;
}

export interface ConfiguracaoReuniao {
  tipo: TipoReuniao;
  nome: string;
  duracao: number;
  frequencia: string;
  participantesCount: number;
  participantesPadrao: string[];
  autoAgendaRegras: string[];
  ativo: boolean;
  cor: string;
  horarioPadrao?: string;
  diaSemana?: number;
}

export interface Reuniao {
  id: string;
  tipo: TipoReuniao;
  titulo: string;
  descricao?: string;
  data: Date;
  duracao: number;
  local?: string;
  link?: string;
  participantes: string[];
  participantesPresentes?: string[];
  itensPauta: ItemPauta[];
  gerarPautaAuto: boolean;
  status: StatusReuniao;
  notas?: string;
  decisoes?: string[];
  acoesGeradas?: string[];
}

const TIPO_REUNIAO_CONFIG: Record<TipoReuniao, ConfiguracaoReuniao> = {
  [TipoReuniao.DAILY]: {
    tipo: TipoReuniao.DAILY,
    nome: 'Reunião Diária',
    duracao: 15,
    frequencia: 'Todos os dias',
    participantesCount: 8,
    participantesPadrao: ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa'],
    autoAgendaRegras: [
      'Top 5 restrições vencendo hoje/amanhã',
      'Tarefas incompletas de ontem',
      'Alertas críticos do dia',
    ],
    ativo: true,
    cor: '#3B82F6',
    horarioPadrao: '08:00',
  },
  [TipoReuniao.WEEKLY]: {
    tipo: TipoReuniao.WEEKLY,
    nome: 'Reunião Semanal',
    duracao: 60,
    frequencia: '1x por semana',
    participantesCount: 12,
    participantesPadrao: ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Souza'],
    autoAgendaRegras: [
      'Revisão do PPC semanal',
      'Todas as restrições pendentes',
      'Tendências de KPIs',
      'Ações 5W2H atrasadas',
    ],
    ativo: true,
    cor: '#22C55E',
    horarioPadrao: '14:00',
    diaSemana: 1,
  },
  [TipoReuniao.QUINZENAL]: {
    tipo: TipoReuniao.QUINZENAL,
    nome: 'Reunião Quinzenal',
    duracao: 120,
    frequencia: 'A cada 2 semanas',
    participantesCount: 15,
    participantesPadrao: ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Souza', 'Lucas Ferreira'],
    autoAgendaRegras: [
      'Análise de EVM',
      'Conflitos de recursos',
      'Registro de riscos',
      'Revisão de cronograma',
    ],
    ativo: true,
    cor: '#F59E0B',
    horarioPadrao: '09:00',
  },
  [TipoReuniao.MENSAL]: {
    tipo: TipoReuniao.MENSAL,
    nome: 'Reunião Mensal',
    duracao: 180,
    frequencia: '1x por mês',
    participantesCount: 20,
    participantesPadrao: ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Pedro Souza', 'Diretor Geral'],
    autoAgendaRegras: [
      'Revisão completa do dashboard',
      'Itens estratégicos',
      'Lições aprendidas',
      'Planejamento do próximo mês',
    ],
    ativo: true,
    cor: '#8B5CF6',
    horarioPadrao: '10:00',
  },
  [TipoReuniao.EXTRAORDINARIA]: {
    tipo: TipoReuniao.EXTRAORDINARIA,
    nome: 'Reunião Extraordinária',
    duracao: 60,
    frequencia: 'Sob demanda',
    participantesCount: 0,
    participantesPadrao: [],
    autoAgendaRegras: [
      'Pauta definida manualmente',
      'Urgências e imprevistos',
    ],
    ativo: true,
    cor: '#EF4444',
  },
};


const generateAutoAgendaItems = (tipo: TipoReuniao): ItemPauta[] => {
  const items: ItemPauta[] = [];
  
  if (tipo === TipoReuniao.DAILY) {
    items.push(
      { id: 'demo-auto-1', titulo: '3 restrições pendentes para discussão', tipo: 'RESTRICAO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 5, responsavel: 'Carlos Lima' },
      { id: 'demo-auto-2', titulo: '2 tarefas incompletas de ontem', tipo: 'ACAO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 3, responsavel: 'Maria Santos' },
      { id: 'demo-auto-3', titulo: 'Alerta: Entrega de materiais atrasada', tipo: 'INFORMATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 2 },
    );
  } else if (tipo === TipoReuniao.WEEKLY) {
    items.push(
      { id: 'demo-auto-1', titulo: 'Revisão PPC Semanal: 78%', tipo: 'KPI', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 10, responsavel: 'Pedro Souza' },
      { id: 'demo-auto-2', titulo: '8 restrições pendentes para discussão', tipo: 'RESTRICAO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 15, responsavel: 'Carlos Lima' },
      { id: 'demo-auto-3', titulo: '2 indicadores com desvio', tipo: 'KPI', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 10, responsavel: 'Ana Costa' },
      { id: 'demo-auto-4', titulo: '5 ações 5W2H atrasadas', tipo: 'ACAO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 10, responsavel: 'João Silva' },
      { id: 'demo-auto-5', titulo: '1 não conformidade aberta', tipo: 'AUDITORIA', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 5, responsavel: 'Ana Costa' },
    );
  } else if (tipo === TipoReuniao.QUINZENAL) {
    items.push(
      { id: 'demo-auto-1', titulo: 'Análise EVM: CPI 0.92 / SPI 0.88', tipo: 'KPI', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 20, responsavel: 'Pedro Souza' },
      { id: 'demo-auto-2', titulo: '3 conflitos de recursos identificados', tipo: 'RESTRICAO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 15, responsavel: 'Roberto Dias' },
      { id: 'demo-auto-3', titulo: 'Revisão do registro de riscos', tipo: 'DELIBERATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 20, responsavel: 'João Silva' },
      { id: 'demo-auto-4', titulo: 'Atualização do cronograma físico', tipo: 'INFORMATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 15 },
    );
  } else if (tipo === TipoReuniao.MENSAL) {
    items.push(
      { id: 'demo-auto-1', titulo: 'Dashboard Executivo - Visão Geral', tipo: 'KPI', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 30, responsavel: 'João Silva' },
      { id: 'demo-auto-2', titulo: 'Indicadores de Desempenho do Mês', tipo: 'KPI', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 20, responsavel: 'Pedro Souza' },
      { id: 'demo-auto-3', titulo: 'Itens Estratégicos Pendentes', tipo: 'DELIBERATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 30, responsavel: 'João Silva' },
      { id: 'demo-auto-4', titulo: 'Lições Aprendidas do Período', tipo: 'INFORMATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 15 },
      { id: 'demo-auto-5', titulo: 'Planejamento do Próximo Mês', tipo: 'DELIBERATIVO', status: StatusItemPauta.PENDENTE, incluido: true, duracaoEstimada: 25, responsavel: 'João Silva' },
    );
  }
  
  return items;
};

const hoje = new Date();

const mapTipoToFrequenciaDB = (tipo: TipoReuniao): string => {
  const frequenciaMap: Record<TipoReuniao, string> = {
    [TipoReuniao.DAILY]: 'diaria',
    [TipoReuniao.WEEKLY]: 'semanal',
    [TipoReuniao.QUINZENAL]: 'quinzenal',
    [TipoReuniao.MENSAL]: 'mensal',
    [TipoReuniao.EXTRAORDINARIA]: 'unica',
  };
  return frequenciaMap[tipo] || 'unica';
};

const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DURACOES = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
];

const STATUS_ITEM_COLORS: Record<StatusItemPauta, string> = {
  [StatusItemPauta.PENDENTE]: '#6B7280',
  [StatusItemPauta.DISCUTIDO]: '#3B82F6',
  [StatusItemPauta.APROVADO]: '#22C55E',
  [StatusItemPauta.ADIADO]: '#F59E0B',
};

const TIPO_ITEM_ICONS: Record<string, React.ReactNode> = {
  RESTRICAO: <AlertTriangle className="w-4 h-4" />,
  KPI: <TrendingDown className="w-4 h-4" />,
  ACAO: <ClipboardList className="w-4 h-4" />,
  INFORMATIVO: <FileText className="w-4 h-4" />,
  DELIBERATIVO: <Users className="w-4 h-4" />,
  AUDITORIA: <FileWarning className="w-4 h-4" />,
};

export const ReunioesPage: React.FC = () => {
  const { tema } = useTemaStore();
  const { usuario } = useAuthStore();
  const { projetoSelecionado } = useProjetoStore();
  const [activeTab, setActiveTab] = useState<'calendario' | 'configuracao' | 'historico'>('calendario');
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [participantesDisponiveis, setParticipantesDisponiveis] = useState<{ id: string; nome: string; cargo?: string }[]>([]);
  const [projetosDisponiveis, setProjetosDisponiveis] = useState<{ id: string; nome: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configuracoes, setConfiguracoes] = useState<Record<TipoReuniao, ConfiguracaoReuniao>>(TIPO_REUNIAO_CONFIG);
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(hoje, { weekStartsOn: 1 }));
  const [showModal, setShowModal] = useState(false);
  const [showMinutasModal, setShowMinutasModal] = useState(false);
  const [editingReuniao, setEditingReuniao] = useState<Reuniao | null>(null);
  const [viewingReuniao, setViewingReuniao] = useState<Reuniao | null>(null);
  
  const [formData, setFormData] = useState<Partial<Reuniao>>({
    tipo: TipoReuniao.DAILY,
    titulo: '',
    data: new Date(),
    duracao: 60,
    local: '',
    link: '',
    participantes: [],
    itensPauta: [],
    gerarPautaAuto: true,
    status: StatusReuniao.AGENDADA,
  });

  const loadData = useCallback(async () => {
    if (!usuario?.empresaId) {
      setReunioes([]);
      setParticipantesDisponiveis([]);
      setProjetosDisponiveis([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [reunioesData, participantesData, projetosData] = await Promise.all([
        reunioesService.getAllReunioes(usuario.empresaId, projetoSelecionado?.id),
        reunioesService.getParticipantesDisponiveis(usuario.empresaId),
        reunioesService.getProjetosDisponiveis(usuario.empresaId),
      ]);

      setParticipantesDisponiveis(participantesData);
      setProjetosDisponiveis(projetosData);
      
      const mappedReunioes: Reuniao[] = reunioesData.map(r => ({
        id: r.id,
        tipo: r.tipo,
        titulo: r.titulo,
        descricao: r.descricao,
        data: r.proximaData || new Date(),
        duracao: r.duracao || 60,
        local: r.local,
        link: undefined,
        participantes: r.participantes || [],
        itensPauta: [],
        gerarPautaAuto: true,
        status: r.ativo ? StatusReuniao.AGENDADA : StatusReuniao.CANCELADA,
      }));
      setReunioes(mappedReunioes);
    } catch (error) {
      console.error('Erro ao carregar reuniões:', error);
      setReunioes([]);
    } finally {
      setIsLoading(false);
    }
  }, [usuario?.empresaId, projetoSelecionado?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const hoursOfDay = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 7);
  }, []);

  const reunioesNaSemana = useMemo(() => {
    return reunioes.filter(r => {
      const reuniaoDate = new Date(r.data);
      return weekDays.some(day => isSameDay(day, reuniaoDate));
    });
  }, [reunioes, weekDays]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const handleOpenModal = (reuniao?: Reuniao) => {
    if (reuniao) {
      setEditingReuniao(reuniao);
      setFormData({ ...reuniao });
    } else {
      setEditingReuniao(null);
      const defaultConfig = configuracoes[TipoReuniao.DAILY];
      setFormData({
        tipo: TipoReuniao.DAILY,
        titulo: '',
        data: new Date(),
        duracao: defaultConfig.duracao,
        local: '',
        link: '',
        participantes: [...defaultConfig.participantesPadrao],
        itensPauta: generateAutoAgendaItems(TipoReuniao.DAILY),
        gerarPautaAuto: true,
        status: StatusReuniao.AGENDADA,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReuniao(null);
  };

  const handleTipoChange = (tipo: TipoReuniao) => {
    const config = configuracoes[tipo];
    setFormData(prev => ({
      ...prev,
      tipo,
      duracao: config.duracao,
      participantes: [...config.participantesPadrao],
      itensPauta: prev?.gerarPautaAuto ? generateAutoAgendaItems(tipo) : [],
    }));
  };

  const handleToggleAutoAgenda = (enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      gerarPautaAuto: enabled,
      itensPauta: enabled ? generateAutoAgendaItems(prev?.tipo || TipoReuniao.DAILY) : [],
    }));
  };

  const handleToggleItemIncluido = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      itensPauta: prev?.itensPauta?.map(item =>
        item.id === itemId ? { ...item, incluido: !item.incluido } : item
      ),
    }));
  };

  const handleAddManualItem = () => {
    const newItem: ItemPauta = {
      id: `manual-${Date.now()}`,
      titulo: 'Novo item de pauta',
      tipo: 'INFORMATIVO',
      status: StatusItemPauta.PENDENTE,
      incluido: true,
      duracaoEstimada: 10,
    };
    setFormData(prev => ({
      ...prev,
      itensPauta: [...(prev?.itensPauta || []), newItem],
    }));
  };

  const handleSaveReuniao = async () => {
    if (!formData.titulo || !formData.data) return;

    const newReuniao: Reuniao = {
      id: editingReuniao?.id || generateUUID(),
      tipo: formData.tipo!,
      titulo: formData.titulo,
      descricao: formData.descricao,
      data: new Date(formData.data),
      duracao: formData.duracao!,
      local: formData.local,
      link: formData.link,
      participantes: formData.participantes || [],
      itensPauta: formData.itensPauta || [],
      gerarPautaAuto: formData.gerarPautaAuto!,
      status: formData.status!,
      notas: formData.notas,
      decisoes: formData.decisoes,
    };

    if (!usuario?.empresaId) {
      if (editingReuniao) {
        setReunioes(prev => prev.map(r => r.id === editingReuniao.id ? newReuniao : r));
      } else {
        setReunioes(prev => [...prev, newReuniao]);
      }
      handleCloseModal();
      return;
    }

    setIsSaving(true);
    try {
      if (editingReuniao) {
        await reunioesService.updateReuniao(editingReuniao.id, {
          tipo: formData.tipo,
          titulo: formData.titulo,
          descricao: formData.descricao,
          proximaData: new Date(formData.data),
          duracao: formData.duracao,
          local: formData.local,
          participantes: formData.participantes,
          ativo: formData.status !== StatusReuniao.CANCELADA,
        });
        setReunioes(prev => prev.map(r => r.id === editingReuniao.id ? newReuniao : r));
      } else {
        const created = await reunioesService.createReuniao({
          tipo: formData.tipo!,
          titulo: formData.titulo,
          descricao: formData.descricao,
          frequencia: mapTipoToFrequenciaDB(formData.tipo!),
          participantes: formData.participantes || [],
          proximaData: new Date(formData.data),
          duracao: formData.duracao,
          local: formData.local,
          ativo: true,
          empresaId: usuario.empresaId,
          createdBy: usuario?.id,
        });
        if (created) {
          const mappedReuniao: Reuniao = {
            id: created.id,
            tipo: created.tipo,
            titulo: created.titulo,
            descricao: created.descricao,
            data: created.proximaData || new Date(),
            duracao: created.duracao || 60,
            local: created.local,
            link: undefined,
            participantes: created.participantes || [],
            itensPauta: [],
            gerarPautaAuto: true,
            status: StatusReuniao.AGENDADA,
          };
          setReunioes(prev => [...prev, mappedReuniao]);
        } else {
          setReunioes(prev => [...prev, newReuniao]);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar reunião:', error);
      if (editingReuniao) {
        setReunioes(prev => prev.map(r => r.id === editingReuniao.id ? newReuniao : r));
      } else {
        setReunioes(prev => [...prev, newReuniao]);
      }
    } finally {
      setIsSaving(false);
    }

    handleCloseModal();
  };


  const handleToggleConfig = (tipo: TipoReuniao) => {
    setConfiguracoes(prev => ({
      ...prev,
      [tipo]: { ...prev[tipo], ativo: !prev[tipo].ativo },
    }));
  };

  const handleViewMinutas = (reuniao: Reuniao) => {
    setViewingReuniao(reuniao);
    setShowMinutasModal(true);
  };

  const getReuniaoPosition = (reuniao: Reuniao) => {
    const hour = new Date(reuniao.data).getHours();
    const minutes = new Date(reuniao.data).getMinutes();
    const top = ((hour - 7) * 60 + minutes) * (60 / 60);
    const height = reuniao.duracao;
    return { top, height };
  };

  const historicoCompleto = useMemo(() => {
    const passadas = reunioes.filter(r => r.status === StatusReuniao.CONCLUIDA);
    return passadas.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [reunioes]);

  const estatisticasHistorico = useMemo(() => {
    const total = historicoCompleto.length;
    const realizadas = historicoCompleto.filter(r => r.status === StatusReuniao.CONCLUIDA).length;
    const taxaCumprimento = total > 0 ? Math.round((realizadas / total) * 100) : 0;
    const mediaParticipacao = historicoCompleto.reduce((acc, r) => {
      if (r.participantesPresentes && r.participantes.length > 0) {
        return acc + (r.participantesPresentes.length / r.participantes.length);
      }
      return acc;
    }, 0) / (historicoCompleto.length || 1) * 100;
    
    return { total, realizadas, taxaCumprimento, mediaParticipacao: Math.round(mediaParticipacao) };
  }, [historicoCompleto]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: tema.primary }} />
          <span style={{ color: 'var(--color-text)' }}>Carregando reuniões...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Matriz de Reuniões
          </h1>
          <ProjetoSelector compact />
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ backgroundColor: tema.primary }}
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Agendar Reunião
        </button>
      </div>

      <div className="flex border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
        {[
          { id: 'calendario', label: 'Calendário', icon: Calendar },
          { id: 'configuracao', label: 'Configuração', icon: Settings },
          { id: 'historico', label: 'Histórico', icon: History },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-current' : 'border-transparent'
            }`}
            style={{
              color: activeTab === tab.id ? tema.primary : 'var(--color-text-secondary)',
              borderColor: activeTab === tab.id ? tema.primary : 'transparent',
            }}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'calendario' && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousWeek}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: 'var(--color-text)' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
                {format(currentWeekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(currentWeekStart, 6), "d 'de' MMMM, yyyy", { locale: ptBR })}
              </h2>
              <button
                onClick={handleNextWeek}
                className="p-2 rounded-lg hover:bg-gray-100"
                style={{ color: 'var(--color-text)' }}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <div className="p-2 text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  Hora
                </div>
                {weekDays.map((day, i) => (
                  <div
                    key={i}
                    className={`p-2 text-center border-l ${isSameDay(day, hoje) ? 'bg-blue-50' : ''}`}
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </div>
                    <div
                      className={`text-lg font-bold ${isSameDay(day, hoje) ? 'text-blue-600' : ''}`}
                      style={{ color: isSameDay(day, hoje) ? tema.primary : 'var(--color-text)' }}
                    >
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative" style={{ height: '600px', overflowY: 'auto' }}>
                <div className="absolute inset-0">
                  {hoursOfDay.map(hour => (
                    <div key={hour} className="grid grid-cols-8" style={{ height: '60px' }}>
                      <div
                        className="p-1 text-xs text-right pr-2 border-r"
                        style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}
                      >
                        {hour}:00
                      </div>
                      {weekDays.map((_, dayIdx) => (
                        <div
                          key={dayIdx}
                          className="border-l border-b"
                          style={{ borderColor: 'var(--color-border)' }}
                        />
                      ))}
                    </div>
                  ))}

                  {reunioesNaSemana.map(reuniao => {
                    const reuniaoDate = new Date(reuniao.data);
                    const dayIndex = weekDays.findIndex(d => isSameDay(d, reuniaoDate));
                    if (dayIndex === -1) return null;

                    const { top, height } = getReuniaoPosition(reuniao);
                    const config = configuracoes[reuniao.tipo];

                    return (
                      <div
                        key={reuniao.id}
                        onClick={() => handleOpenModal(reuniao)}
                        className="absolute rounded-md p-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                        style={{
                          left: `calc(12.5% + ${dayIndex * 12.5}% + 2px)`,
                          width: 'calc(12.5% - 4px)',
                          top: `${top}px`,
                          height: `${Math.max(height, 30)}px`,
                          backgroundColor: config.cor,
                          color: 'white',
                        }}
                      >
                        <div className="text-xs font-semibold truncate">{reuniao.titulo}</div>
                        <div className="text-xs opacity-80 truncate">
                          {format(reuniaoDate, 'HH:mm')} - {reuniao.duracao}min
                        </div>
                        {height > 40 && (
                          <div className="text-xs opacity-80 truncate flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" />
                            {reuniao.participantes.length}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {reunioesNaSemana.length === 0 && reunioes.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ left: '12.5%' }}>
                      <div className="text-center p-8">
                        <Calendar size={48} className="mx-auto mb-4 opacity-40" style={{ color: tema.textSecondary }} />
                        <p className="font-medium mb-2" style={{ color: tema.text }}>
                          Nenhuma reunião cadastrada
                        </p>
                        <p className="text-sm mb-4" style={{ color: tema.textSecondary }}>
                          Clique em "Nova Reunião" para agendar sua primeira reunião
                        </p>
                      </div>
                    </div>
                  )}

                  {reunioesNaSemana.length === 0 && reunioes.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{ left: '12.5%' }}>
                      <div className="text-center p-8">
                        <Calendar size={48} className="mx-auto mb-4 opacity-40" style={{ color: tema.textSecondary }} />
                        <p className="font-medium mb-2" style={{ color: tema.text }}>
                          Nenhuma reunião nesta semana
                        </p>
                        <p className="text-sm" style={{ color: tema.textSecondary }}>
                          Navegue para outras semanas ou agende uma nova reunião
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              {Object.values(configuracoes).filter(c => c.ativo).map(config => (
                <div key={config.tipo} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: config.cor }} />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{config.nome}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'configuracao' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(configuracoes).map(config => (
              <div
                key={config.tipo}
                className="rounded-lg border p-4"
                style={{
                  borderColor: config.ativo ? config.cor : 'var(--color-border)',
                  backgroundColor: 'var(--color-surface)',
                  opacity: config.ativo ? 1 : 0.6,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: config.cor }} />
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--color-text)' }}>{config.nome}</h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{config.frequencia}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleConfig(config.tipo)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${config.ativo ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.ativo ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Clock className="w-4 h-4" />
                    <span>{config.duracao} minutos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Users className="w-4 h-4" />
                    <span>{config.participantesCount} participantes padrão</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Regras de auto-pauta:
                  </p>
                  <ul className="space-y-1">
                    {config.autoAgendaRegras.map((regra, idx) => (
                      <li key={idx} className="text-xs flex items-start gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: config.cor }} />
                        {regra}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar Configuração
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold" style={{ color: tema.primary }}>{estatisticasHistorico.total}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Total de Reuniões</div>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold" style={{ color: tema.success }}>{estatisticasHistorico.realizadas}</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Realizadas</div>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold" style={{ color: tema.info }}>{estatisticasHistorico.taxaCumprimento}%</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Taxa de Cumprimento</div>
              </div>
              <div className="rounded-lg border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                <div className="text-2xl font-bold" style={{ color: tema.warning }}>{estatisticasHistorico.mediaParticipacao}%</div>
                <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Média de Presença</div>
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Data</th>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Título</th>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Duração</th>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Presença</th>
                    <th className="px-4 py-3 text-left text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoCompleto.map(reuniao => {
                    const config = configuracoes[reuniao.tipo];
                    const presenca = reuniao.participantesPresentes
                      ? `${reuniao.participantesPresentes.length}/${reuniao.participantes.length}`
                      : '-';
                    return (
                      <tr key={reuniao.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text)' }}>
                          {format(new Date(reuniao.data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
                            style={{ backgroundColor: config.cor }}
                          >
                            {config.nome}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                          {reuniao.titulo}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {reuniao.duracao} min
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {presenca}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewMinutas(reuniao)}
                            className="flex items-center gap-1 text-sm font-medium hover:underline"
                            style={{ color: tema.primary }}
                          >
                            <Eye className="w-4 h-4" />
                            Ver Ata
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                {editingReuniao ? 'Editar Reunião' : 'Agendar Nova Reunião'}
              </h2>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Título *
                  </label>
                  <input
                    type="text"
                    value={formData.titulo || ''}
                    onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                    placeholder="Nome da reunião"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Tipo de Reunião
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={e => handleTipoChange(e.target.value as TipoReuniao)}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    {Object.values(configuracoes).map(config => (
                      <option key={config.tipo} value={config.tipo}>{config.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Data e Hora *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.data ? format(new Date(formData.data), "yyyy-MM-dd'T'HH:mm") : ''}
                    onChange={e => setFormData(prev => ({ ...prev, data: new Date(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Duração
                  </label>
                  <select
                    value={formData.duracao}
                    onChange={e => setFormData(prev => ({ ...prev, duracao: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    {DURACOES.map(d => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Local
                  </label>
                  <input
                    type="text"
                    value={formData.local || ''}
                    onChange={e => setFormData(prev => ({ ...prev, local: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                    placeholder="Sala de reunião, escritório, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    <Video className="w-4 h-4 inline mr-1" />
                    Link da Videochamada
                  </label>
                  <input
                    type="url"
                    value={formData.link || ''}
                    onChange={e => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  Participantes
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                  {formData.participantes?.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                      style={{ backgroundColor: tema.primary + '20', color: tema.primary }}
                    >
                      {p}
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          participantes: prev.participantes?.filter(x => x !== p),
                        }))}
                        className="hover:bg-black/10 rounded-full"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={e => {
                      const nome = e.target.value;
                      if (nome && !formData.participantes?.includes(nome)) {
                        setFormData(prev => ({
                          ...prev,
                          participantes: [...(prev.participantes || []), nome],
                        }));
                      }
                      e.target.value = '';
                    }}
                    className="px-2 py-1 rounded border-none bg-transparent text-sm"
                    style={{ color: tema.primary }}
                  >
                    <option value="">+ Adicionar</option>
                    {participantesDisponiveis.filter(p => !formData.participantes?.includes(p.nome)).map(p => (
                      <option key={p.id} value={p.nome}>{p.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" style={{ color: tema.primary }} />
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Pauta da Reunião</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gerarPautaAuto}
                      onChange={e => handleToggleAutoAgenda(e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Gerar pauta automaticamente
                    </span>
                  </label>
                </div>

                {formData.gerarPautaAuto && formData.itensPauta && formData.itensPauta.length > 0 && (
                  <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: tema.primary + '10' }}>
                    <p className="text-sm font-medium mb-2" style={{ color: tema.primary }}>
                      Itens sugeridos automaticamente:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {formData.itensPauta.filter(i => i.tipo === 'RESTRICAO').length > 0 && (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          {formData.itensPauta.filter(i => i.tipo === 'RESTRICAO').length} restrições pendentes
                        </div>
                      )}
                      {formData.itensPauta.filter(i => i.tipo === 'KPI').length > 0 && (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <TrendingDown className="w-4 h-4 text-red-500" />
                          {formData.itensPauta.filter(i => i.tipo === 'KPI').length} indicadores com desvio
                        </div>
                      )}
                      {formData.itensPauta.filter(i => i.tipo === 'ACAO').length > 0 && (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <ClipboardList className="w-4 h-4 text-blue-500" />
                          {formData.itensPauta.filter(i => i.tipo === 'ACAO').length} ações atrasadas
                        </div>
                      )}
                      {formData.itensPauta.filter(i => i.tipo === 'AUDITORIA').length > 0 && (
                        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
                          <FileWarning className="w-4 h-4 text-red-500" />
                          {formData.itensPauta.filter(i => i.tipo === 'AUDITORIA').length} não conformidades abertas
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {formData.itensPauta?.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${item.incluido ? '' : 'opacity-50'}`}
                      style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                    >
                      <GripVertical className="w-4 h-4 cursor-grab" style={{ color: 'var(--color-text-secondary)' }} />
                      <input
                        type="checkbox"
                        checked={item.incluido}
                        onChange={() => handleToggleItemIncluido(item.id)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex-shrink-0" style={{ color: STATUS_ITEM_COLORS[item.status] }}>
                        {TIPO_ITEM_ICONS[item.tipo]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.titulo}
                          onChange={e => setFormData(prev => ({
                            ...prev,
                            itensPauta: prev.itensPauta?.map(i =>
                              i.id === item.id ? { ...i, titulo: e.target.value } : i
                            ),
                          }))}
                          className="w-full bg-transparent border-none text-sm font-medium"
                          style={{ color: 'var(--color-text)' }}
                        />
                        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.duracaoEstimada && <span>{item.duracaoEstimada} min</span>}
                          {item.responsavel && <span>{item.responsavel}</span>}
                        </div>
                      </div>
                      <select
                        value={item.status}
                        onChange={e => setFormData(prev => ({
                          ...prev,
                          itensPauta: prev.itensPauta?.map(i =>
                            i.id === item.id ? { ...i, status: e.target.value as StatusItemPauta } : i
                          ),
                        }))}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: STATUS_ITEM_COLORS[item.status] }}
                      >
                        <option value={StatusItemPauta.PENDENTE}>Pendente</option>
                        <option value={StatusItemPauta.DISCUTIDO}>Discutido</option>
                        <option value={StatusItemPauta.APROVADO}>Aprovado</option>
                        <option value={StatusItemPauta.ADIADO}>Adiado</option>
                      </select>
                      <button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          itensPauta: prev.itensPauta?.filter(i => i.id !== item.id),
                        }))}
                        className="p-1 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAddManualItem}
                  className="mt-3 flex items-center gap-2 text-sm font-medium"
                  style={{ color: tema.primary }}
                >
                  <Plus className="w-4 h-4" />
                  Adicionar item manualmente
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  Notas / Observações
                </label>
                <textarea
                  value={formData.notas || ''}
                  onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border resize-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  placeholder="Anotações da reunião, decisões tomadas, próximos passos..."
                />
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg border font-medium"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveReuniao}
                disabled={!formData.titulo}
                className="px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: tema.primary }}
              >
                {editingReuniao ? 'Salvar Alterações' : 'Agendar Reunião'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showMinutasModal && viewingReuniao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Ata de Reunião
              </h2>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-gray-100" title="Download PDF">
                  <Download className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
                <button onClick={() => setShowMinutasModal(false)} className="p-2 rounded-lg hover:bg-gray-100">
                  <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="text-center pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{viewingReuniao.titulo}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {format(new Date(viewingReuniao.data), "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Duração: {viewingReuniao.duracao} minutos | Local: {viewingReuniao.local || 'Não especificado'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                  <Users className="w-4 h-4" />
                  Participantes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {viewingReuniao.participantes.map(p => {
                    const presente = viewingReuniao.participantesPresentes?.includes(p);
                    return (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm"
                        style={{
                          backgroundColor: presente ? tema.success + '20' : tema.danger + '20',
                          color: presente ? tema.success : tema.danger,
                        }}
                      >
                        {presente ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {p}
                      </span>
                    );
                  })}
                </div>
                {viewingReuniao.participantesPresentes && (
                  <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Presença: {viewingReuniao.participantesPresentes.length}/{viewingReuniao.participantes.length} ({Math.round((viewingReuniao.participantesPresentes.length / viewingReuniao.participantes.length) * 100)}%)
                  </p>
                )}
              </div>

              {viewingReuniao.decisoes && viewingReuniao.decisoes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <CheckCircle className="w-4 h-4" style={{ color: tema.success }} />
                    Decisões Tomadas
                  </h4>
                  <ul className="space-y-2">
                    {viewingReuniao.decisoes.map((decisao, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text)' }}>
                        <span className="w-5 h-5 flex items-center justify-center rounded-full text-xs font-medium text-white" style={{ backgroundColor: tema.success }}>
                          {idx + 1}
                        </span>
                        {decisao}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {viewingReuniao.acoesGeradas && viewingReuniao.acoesGeradas.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <ClipboardList className="w-4 h-4" style={{ color: tema.primary }} />
                    Ações Geradas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingReuniao.acoesGeradas.map(acao => (
                      <span
                        key={acao}
                        className="px-2 py-1 rounded text-sm font-mono"
                        style={{ backgroundColor: tema.primary + '20', color: tema.primary }}
                      >
                        {acao}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingReuniao.notas && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                    <FileText className="w-4 h-4" />
                    Notas da Reunião
                  </h4>
                  <p className="text-sm whitespace-pre-wrap p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
                    {viewingReuniao.notas}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReunioesPage;
