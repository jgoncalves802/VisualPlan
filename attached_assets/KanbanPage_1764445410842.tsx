/**
 * KanbanPage - Kanban Integrado conforme PMBOK
 * Integra atividades do cronograma, LPS, restrições e ações de tratativa
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Clock, 
  User, 
  AlertCircle, 
  FileText, 
  Image, 
  CheckCircle2, 
  PlayCircle,
  Filter,
  Search,
  X,
  Upload,
  Eye,
  Calendar,
  Tag,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useTemaStore } from '../stores/temaStore';
import { useAuthStore } from '../stores/authStore';
import { useCronogramaStore } from '../stores/cronogramaStore';
import { useLPSStore } from '../stores/lpsStore';
import { 
  ItemKanban, 
  TipoItemKanban, 
  StatusKanban, 
  PrioridadeKanban,
  FiltrosKanban 
} from '../types/kanban';
import { StatusAtividade } from '../types';
import { StatusAtividadeLPS } from '../types/lps';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TaskModal } from '../components/features/cronograma/TaskModal';
import { RestricaoModal } from '../components/features/restricoes/RestricaoModal';
import { AtividadeLPSModal } from '../components/features/lps/AtividadeLPSModal';

const KanbanPage: React.FC = () => {
  const { tema } = useTemaStore();
  const { usuario } = useAuthStore();
  const { projetoId } = useParams<{ projetoId?: string }>();
  
  // Stores
  const { atividades, carregarAtividades, atualizarAtividade } = useCronogramaStore();
  const { 
    atividades: atividadesLPS, 
    restricoes, 
    updateAtividade: updateAtividadeLPS,
    updateRestricao 
  } = useLPSStore();

  // Estado local
  const [filtros, setFiltros] = useState<FiltrosKanban>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<ItemKanban | null>(null);
  
  // Estados para modais
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [restricaoModalOpen, setRestricaoModalOpen] = useState(false);
  const [atividadeLPSModalOpen, setAtividadeLPSModalOpen] = useState(false);
  const [atividadeIdParaModal, setAtividadeIdParaModal] = useState<string | null>(null);
  const [restricaoParaModal, setRestricaoParaModal] = useState<any | null>(null);
  const [atividadeLPSParaModal, setAtividadeLPSParaModal] = useState<any | null>(null);
  
  // Estados para drag and drop
  const [itemSendoArrastado, setItemSendoArrastado] = useState<ItemKanban | null>(null);
  const [colunaSobreposta, setColunaSobreposta] = useState<StatusKanban | null>(null);

  // Carregar atividades do cronograma
  useEffect(() => {
    if (projetoId) {
      carregarAtividades(projetoId);
    }
  }, [projetoId, carregarAtividades]);

  // Helper para parsear datas (compartilhado)
  const parseDate = (dateStr: string | Date | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) {
      // Verificar se é uma Date válida
      if (isNaN(dateStr.getTime())) return undefined;
      return dateStr;
    }
    try {
      const parsed = new Date(dateStr);
      return isNaN(parsed.getTime()) ? undefined : parsed;
    } catch {
      return undefined;
    }
  };

  // Converter atividades do cronograma para itens do Kanban
  const converterAtividadeCronograma = (atividade: any): ItemKanban => {
    // Mapear status string para enum
    const statusStr = atividade.status?.toUpperCase() || 'NAO_INICIADA';
    let status: StatusKanban;
    if (statusStr === 'NAO_INICIADA' || statusStr === StatusAtividade.NAO_INICIADA) {
      status = StatusKanban.PLANEJAMENTO;
    } else if (statusStr === 'EM_ANDAMENTO' || statusStr === StatusAtividade.EM_ANDAMENTO) {
      status = StatusKanban.EXECUCAO;
    } else if (statusStr === 'CONCLUIDA' || statusStr === StatusAtividade.CONCLUIDA) {
      status = StatusKanban.ENCERRAMENTO;
    } else if (statusStr === 'PARALISADA' || statusStr === StatusAtividade.PARALISADA) {
      status = StatusKanban.CONTROLE;
    } else {
      status = StatusKanban.PLANEJAMENTO;
    }

    const prioridade = atividade.e_critica 
      ? PrioridadeKanban.CRITICA 
      : atividade.prioridade === '1' || atividade.prioridade === 1
      ? PrioridadeKanban.ALTA 
      : atividade.prioridade === '2' || atividade.prioridade === 2
      ? PrioridadeKanban.MEDIA 
      : PrioridadeKanban.BAIXA;

    return {
      id: `cronograma-${atividade.id}`,
      tipo: TipoItemKanban.ATIVIDADE_CRONOGRAMA,
      status,
      titulo: atividade.nome || atividade.titulo || 'Sem título',
      descricao: atividade.descricao,
      responsavel: atividade.responsavel_nome,
      responsavel_id: atividade.responsavel_id,
      prioridade,
      dataCriacao: parseDate(atividade.created_at) || new Date(),
      dataVencimento: parseDate(atividade.data_fim),
      dataInicio: parseDate(atividade.data_inicio),
      dataFim: parseDate(atividade.data_fim),
      percentualConcluido: atividade.progresso || atividade.percentual_concluido || 0,
      origemAtividade: atividade,
      atividadeId: atividade.id,
      projetoId: atividade.projeto_id,
      caminhoCritico: atividade.e_critica,
      podeCheckIn: statusStr === 'NAO_INICIADA' || statusStr === StatusAtividade.NAO_INICIADA,
      podeCheckOut: statusStr === 'EM_ANDAMENTO' || statusStr === StatusAtividade.EM_ANDAMENTO,
      podeConcluir: statusStr !== 'CONCLUIDA' && statusStr !== StatusAtividade.CONCLUIDA,
    };
  };

  // Converter atividades LPS para itens do Kanban
  const converterAtividadeLPS = (atividade: any): ItemKanban => {
    let status: StatusKanban;
    if (atividade.status === StatusAtividadeLPS.PLANEJADA) {
      status = StatusKanban.PLANEJAMENTO;
    } else if (atividade.status === StatusAtividadeLPS.EM_ANDAMENTO) {
      status = StatusKanban.EXECUCAO;
    } else if (atividade.status === StatusAtividadeLPS.CONCLUIDA) {
      status = StatusKanban.ENCERRAMENTO;
    } else if (atividade.status === StatusAtividadeLPS.BLOQUEADA) {
      status = StatusKanban.CONTROLE;
    } else {
      status = StatusKanban.PLANEJAMENTO;
    }

    const prioridade = atividade.tipo === 'CRITICA' 
      ? PrioridadeKanban.CRITICA 
      : PrioridadeKanban.MEDIA;

    return {
      id: `lps-${atividade.id}`,
      tipo: TipoItemKanban.ATIVIDADE_LPS,
      status,
      titulo: atividade.nome,
      descricao: atividade.descricao,
      responsavel: atividade.responsavel,
      responsavel_id: atividade.responsavel_id,
      prioridade,
      dataCriacao: parseDate(atividade.data_atribuida) || parseDate(atividade.data_inicio) || new Date(),
      dataVencimento: parseDate(atividade.data_fim),
      dataInicio: parseDate(atividade.data_inicio),
      dataFim: parseDate(atividade.data_fim),
      origemAtividadeLPS: atividade,
      atividadeId: atividade.id,
      podeCheckIn: atividade.status === StatusAtividadeLPS.PLANEJADA,
      podeCheckOut: atividade.status === StatusAtividadeLPS.EM_ANDAMENTO,
      podeConcluir: atividade.status !== StatusAtividadeLPS.CONCLUIDA,
    };
  };

  // Converter restrições para itens do Kanban
  const converterRestricao = (restricao: any): ItemKanban => {
    let status: StatusKanban;
    if (restricao.status === 'PENDENTE') {
      status = StatusKanban.PLANEJAMENTO;
    } else if (restricao.status === 'ATRASADA') {
      status = StatusKanban.CONTROLE;
    } else if (restricao.status === 'CONCLUIDA') {
      status = StatusKanban.ENCERRAMENTO;
    } else {
      status = StatusKanban.EXECUCAO;
    }

    const prioridade = restricao.prioridade === 'ALTA' || restricao.tipo_detalhado === 'PARALISAR_OBRA'
      ? PrioridadeKanban.CRITICA
      : restricao.prioridade === 'MEDIA'
      ? PrioridadeKanban.MEDIA
      : PrioridadeKanban.BAIXA;

    const evidencias = restricao.evidencias?.map((ev: any) => ({
      id: ev.id,
      nome: ev.nome_arquivo,
      tipo: ev.tipo_arquivo,
      url: ev.url_arquivo,
    })) || [];

    return {
      id: `restricao-${restricao.id}`,
      tipo: TipoItemKanban.RESTRICAO,
      status,
      titulo: restricao.descricao,
      descricao: restricao.observacoes,
      responsavel: restricao.responsavel,
      responsavel_id: restricao.responsavel_id,
      prioridade,
      dataCriacao: parseDate(restricao.data_criacao) || new Date(),
      dataVencimento: parseDate(restricao.prazo_resolucao) || parseDate(restricao.data_conclusao_planejada),
      evidencias,
      quantidadeEvidencias: evidencias.length,
      origemRestricao: restricao,
      restricaoId: restricao.id,
      atividadeId: restricao.atividade_id,
      podeAdicionarEvidencia: true,
      podeConcluir: restricao.status !== 'CONCLUIDA' && restricao.criado_por === usuario?.id,
      tags: [restricao.tipo_detalhado || restricao.tipo, restricao.tipo_responsabilidade].filter(Boolean),
    };
  };

  // Consolidar todos os itens
  const todosItens = useMemo(() => {
    const itens: ItemKanban[] = [];

    // Atividades do cronograma
    atividades.forEach((atividade) => {
      // Filtrar apenas atividades do usuário ou sem responsável específico
      if (!filtros.responsavelId || atividade.responsavel_id === filtros.responsavelId || !atividade.responsavel_id) {
        itens.push(converterAtividadeCronograma(atividade));
      }
    });

    // Atividades LPS
    atividadesLPS.forEach((atividade) => {
      if (!filtros.responsavelId || atividade.responsavel_id === filtros.responsavelId || !atividade.responsavel_id) {
        itens.push(converterAtividadeLPS(atividade));
      }
    });

    // Restrições
    restricoes.forEach((restricao) => {
      if (!filtros.responsavelId || restricao.responsavel_id === filtros.responsavelId || !restricao.responsavel_id) {
        itens.push(converterRestricao(restricao));
      }
    });

    return itens;
  }, [atividades, atividadesLPS, restricoes, filtros.responsavelId, usuario?.id]);

  // Aplicar filtros
  const itensFiltrados = useMemo(() => {
    let filtrados = [...todosItens];

    // Filtro por tipo
    if (filtros.tipos && filtros.tipos.length > 0) {
      filtrados = filtrados.filter((item) => filtros.tipos!.includes(item.tipo));
    }

    // Filtro por busca
    if (filtros.busca) {
      const buscaLower = filtros.busca.toLowerCase();
      filtrados = filtrados.filter(
        (item) =>
          item.titulo.toLowerCase().includes(buscaLower) ||
          item.descricao?.toLowerCase().includes(buscaLower)
      );
    }

    // Filtro por prioridade mínima
    if (filtros.prioridadeMinima !== undefined) {
      filtrados = filtrados.filter((item) => item.prioridade >= filtros.prioridadeMinima!);
    }

    // Filtro apenas críticas
    if (filtros.apenasCriticas) {
      filtrados = filtrados.filter((item) => item.caminhoCritico || item.prioridade === PrioridadeKanban.CRITICA);
    }

    // Filtro apenas com evidências
    if (filtros.apenasComEvidencias) {
      filtrados = filtrados.filter((item) => (item.quantidadeEvidencias || 0) > 0);
    }

    return filtrados;
  }, [todosItens, filtros]);

  // Agrupar por status
  const itensPorStatus = useMemo(() => {
    const agrupados: Record<StatusKanban, ItemKanban[]> = {
      [StatusKanban.PLANEJAMENTO]: [],
      [StatusKanban.EXECUCAO]: [],
      [StatusKanban.CONTROLE]: [],
      [StatusKanban.ENCERRAMENTO]: [],
    };

    itensFiltrados.forEach((item) => {
      agrupados[item.status].push(item);
    });

    // Ordenar por prioridade (maior primeiro) e depois por data
    Object.keys(agrupados).forEach((status) => {
      agrupados[status as StatusKanban].sort((a, b) => {
        if (b.prioridade !== a.prioridade) {
          return b.prioridade - a.prioridade;
        }
        // Garantir que as datas sejam Date válidas antes de usar getTime
        const dataA = a.dataVencimento instanceof Date && !isNaN(a.dataVencimento.getTime()) 
          ? a.dataVencimento 
          : parseDate(a.dataVencimento);
        const dataB = b.dataVencimento instanceof Date && !isNaN(b.dataVencimento.getTime()) 
          ? b.dataVencimento 
          : parseDate(b.dataVencimento);
        const timeA = dataA?.getTime() || 0;
        const timeB = dataB?.getTime() || 0;
        return timeA - timeB;
      });
    });

    return agrupados;
  }, [itensFiltrados]);

  // Colunas do Kanban
  const colunas = [
    {
      id: StatusKanban.PLANEJAMENTO,
      titulo: 'Planejamento',
      subtitulo: 'A Fazer',
      cor: tema.info,
      icone: Calendar,
    },
    {
      id: StatusKanban.EXECUCAO,
      titulo: 'Execução',
      subtitulo: 'Fazendo',
      cor: tema.warning,
      icone: PlayCircle,
    },
    {
      id: StatusKanban.CONTROLE,
      titulo: 'Controle',
      subtitulo: 'Em Revisão',
      cor: tema.danger,
      icone: AlertTriangle,
    },
    {
      id: StatusKanban.ENCERRAMENTO,
      titulo: 'Encerramento',
      subtitulo: 'Concluído',
      cor: tema.success,
      icone: CheckCircle2,
    },
  ];

  // Handlers
  const handleCheckIn = async (item: ItemKanban) => {
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA && item.origemAtividade) {
      await atualizarAtividade(item.origemAtividade.id, {
        status: StatusAtividade.EM_ANDAMENTO,
        progresso: 0,
      });
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS && item.origemAtividadeLPS) {
      updateAtividadeLPS(item.origemAtividadeLPS.id, {
        status: StatusAtividadeLPS.EM_ANDAMENTO,
      });
    }
  };

  const handleCheckOut = async (item: ItemKanban) => {
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA && item.origemAtividade) {
      await atualizarAtividade(item.origemAtividade.id, {
        status: StatusAtividade.CONCLUIDA,
        progresso: 100,
      });
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS && item.origemAtividadeLPS) {
      updateAtividadeLPS(item.origemAtividadeLPS.id, {
        status: StatusAtividadeLPS.CONCLUIDA,
      });
    }
  };

  const handleMoverStatus = async (item: ItemKanban, novoStatus: StatusKanban) => {
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA && item.origemAtividade) {
      let novoStatusStr: string;
      if (novoStatus === StatusKanban.PLANEJAMENTO) {
        novoStatusStr = StatusAtividade.NAO_INICIADA;
      } else if (novoStatus === StatusKanban.EXECUCAO) {
        novoStatusStr = StatusAtividade.EM_ANDAMENTO;
      } else if (novoStatus === StatusKanban.ENCERRAMENTO) {
        novoStatusStr = StatusAtividade.CONCLUIDA;
      } else {
        novoStatusStr = StatusAtividade.PARALISADA;
      }
      await atualizarAtividade(item.origemAtividade.id, { status: novoStatusStr });
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS && item.origemAtividadeLPS) {
      let novoStatusLPS: StatusAtividadeLPS;
      if (novoStatus === StatusKanban.PLANEJAMENTO) {
        novoStatusLPS = StatusAtividadeLPS.PLANEJADA;
      } else if (novoStatus === StatusKanban.EXECUCAO) {
        novoStatusLPS = StatusAtividadeLPS.EM_ANDAMENTO;
      } else if (novoStatus === StatusKanban.ENCERRAMENTO) {
        novoStatusLPS = StatusAtividadeLPS.CONCLUIDA;
      } else {
        novoStatusLPS = StatusAtividadeLPS.BLOQUEADA;
      }
      updateAtividadeLPS(item.origemAtividadeLPS.id, { status: novoStatusLPS });
    } else if (item.tipo === TipoItemKanban.RESTRICAO && item.origemRestricao) {
      // Para restrições, apenas atualizar status se não for concluída
      if (novoStatus === StatusKanban.ENCERRAMENTO && item.podeConcluir) {
        // Conclusão de restrição é tratada separadamente
        return;
      }
      let novoStatusRestricao: 'PENDENTE' | 'ATRASADA' | 'CONCLUIDA' | 'CANCELADA';
      if (novoStatus === StatusKanban.ENCERRAMENTO) {
        novoStatusRestricao = 'CONCLUIDA';
      } else if (novoStatus === StatusKanban.CONTROLE) {
        novoStatusRestricao = 'ATRASADA';
      } else {
        novoStatusRestricao = 'PENDENTE';
      }
      updateRestricao(item.origemRestricao.id, { status: novoStatusRestricao });
    }
  };

  // Handlers para drag and drop
  const handleDragStart = (e: React.DragEvent, item: ItemKanban) => {
    setItemSendoArrastado(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent, status: StatusKanban) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setColunaSobreposta(status);
  };

  const handleDragLeave = () => {
    setColunaSobreposta(null);
  };

  const handleDrop = async (e: React.DragEvent, novoStatus: StatusKanban) => {
    e.preventDefault();
    setColunaSobreposta(null);
    
    if (itemSendoArrastado && itemSendoArrastado.status !== novoStatus) {
      await handleMoverStatus(itemSendoArrastado, novoStatus);
    }
    
    setItemSendoArrastado(null);
  };

  // Handler para abrir modal ao clicar em item
  const handleItemClick = (item: ItemKanban) => {
    setItemSelecionado(item);
    
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA && item.atividadeId) {
      setAtividadeIdParaModal(item.atividadeId);
      setTaskModalOpen(true);
    } else if (item.tipo === TipoItemKanban.RESTRICAO && item.origemRestricao) {
      setRestricaoParaModal(item.origemRestricao);
      setRestricaoModalOpen(true);
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS && item.origemAtividadeLPS) {
      setAtividadeLPSParaModal(item.origemAtividadeLPS);
      setAtividadeLPSModalOpen(true);
    }
  };

  // Handler para limpar filtros
  const handleLimparFiltros = () => {
    setFiltros({});
  };

  // Handler para salvar atividade no TaskModal
  const handleSaveAtividade = async (dados: any) => {
    if (atividadeIdParaModal) {
      await atualizarAtividade(atividadeIdParaModal, dados);
    }
    setTaskModalOpen(false);
    setAtividadeIdParaModal(null);
  };

  // Handler para salvar restrição no RestricaoModal
  const handleSaveRestricao = (restricao: any) => {
    if (restricaoParaModal?.id) {
      updateRestricao(restricaoParaModal.id, restricao);
    }
    setRestricaoModalOpen(false);
    setRestricaoParaModal(null);
  };

  // Handler para salvar atividade LPS
  const handleSaveAtividadeLPS = (atividade: any) => {
    if (atividadeLPSParaModal?.id) {
      updateAtividadeLPS(atividadeLPSParaModal.id, atividade);
    }
    setAtividadeLPSModalOpen(false);
    setAtividadeLPSParaModal(null);
  };

  // Estatísticas
  const estatisticas = useMemo(() => {
    return {
      planejamento: itensPorStatus[StatusKanban.PLANEJAMENTO].length,
      execucao: itensPorStatus[StatusKanban.EXECUCAO].length,
      controle: itensPorStatus[StatusKanban.CONTROLE].length,
      encerramento: itensPorStatus[StatusKanban.ENCERRAMENTO].length,
      total: itensFiltrados.length,
      criticas: itensFiltrados.filter((i) => i.prioridade === PrioridadeKanban.CRITICA).length,
    };
  }, [itensPorStatus, itensFiltrados]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-3xl font-bold theme-text">Kanban de Execução</h1>
        <p className="text-sm theme-text-secondary mt-1">
            Gerencie atividades, restrições e ações conforme PMBOK
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter size={16} />
            Filtros
          </button>
          {(filtros.busca || filtros.tipos?.length || filtros.apenasCriticas || filtros.apenasComEvidencias) && (
            <button
              onClick={handleLimparFiltros}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-2 text-sm"
              title="Limpar filtros"
            >
              <RotateCcw size={16} />
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold theme-text">Filtros</h3>
            <button
              onClick={() => setMostrarFiltros(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium theme-text mb-1">Buscar</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busca || ''}
                  onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                  placeholder="Buscar por título ou descrição..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium theme-text mb-1">Tipos</label>
              <select
                multiple
                value={filtros.tipos || []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions, (option) => option.value as TipoItemKanban);
                  setFiltros({ ...filtros, tipos: selected.length > 0 ? selected : undefined });
                }}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value={TipoItemKanban.ATIVIDADE_CRONOGRAMA}>Atividades Cronograma</option>
                <option value={TipoItemKanban.ATIVIDADE_LPS}>Atividades LPS</option>
                <option value={TipoItemKanban.RESTRICAO}>Restrições</option>
                <option value={TipoItemKanban.ACAO_TRATATIVA}>Ações de Tratativa</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.apenasCriticas || false}
                  onChange={(e) => setFiltros({ ...filtros, apenasCriticas: e.target.checked || undefined })}
                />
                <span className="text-sm theme-text">Apenas críticas</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.apenasComEvidencias || false}
                  onChange={(e) => setFiltros({ ...filtros, apenasComEvidencias: e.target.checked || undefined })}
                />
                <span className="text-sm theme-text">Com evidências</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Planejamento</p>
              <p className="text-2xl font-bold theme-text">{estatisticas.planejamento}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.info}20`, color: tema.info }}
            >
              <Calendar size={24} />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Execução</p>
              <p className="text-2xl font-bold theme-text">{estatisticas.execucao}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.warning}20`, color: tema.warning }}
            >
              <PlayCircle size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Controle</p>
              <p className="text-2xl font-bold theme-text">{estatisticas.controle}</p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.danger}20`, color: tema.danger }}
            >
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Encerramento</p>
              <p className="text-2xl font-bold theme-text">{estatisticas.encerramento}</p>
            </div>
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.success}20`, color: tema.success }}
            >
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm theme-text-secondary">Críticas</p>
              <p className="text-2xl font-bold theme-text">{estatisticas.criticas}</p>
            </div>
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${tema.danger}20`, color: tema.danger }}
            >
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {colunas.map((coluna) => {
          const Icone = coluna.icone;
          const itensColuna = itensPorStatus[coluna.id];
          const isColunaSobreposta = colunaSobreposta === coluna.id;

          return (
            <div
              key={coluna.id}
              className={`kanban-column ${isColunaSobreposta ? 'border-2 border-dashed' : ''}`}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
              style={{
                borderColor: isColunaSobreposta ? coluna.cor : undefined,
                backgroundColor: isColunaSobreposta ? `${coluna.cor}10` : undefined,
                transition: 'all 0.2s',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: coluna.cor }}
                  />
                  <div>
                    <h3 className="font-semibold theme-text text-sm">{coluna.titulo}</h3>
                    <p className="text-xs theme-text-secondary">{coluna.subtitulo}</p>
                  </div>
                </div>
                <span
                  className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{
                    backgroundColor: `${coluna.cor}20`,
                    color: coluna.cor,
                  }}
                >
                  {itensColuna.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                {itensColuna.map((item) => (
                  <div
                    key={item.id}
                    className="kanban-card cursor-pointer hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => handleItemClick(item)}
                    style={{
                      opacity: itemSendoArrastado?.id === item.id ? 0.5 : 1,
                      cursor: 'grab',
                    }}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium theme-text text-sm truncate">
                            {item.titulo}
                      </h4>
                          {item.prioridade === PrioridadeKanban.CRITICA && (
                            <span className="badge badge-danger text-xs flex-shrink-0">CRÍTICA</span>
                          )}
                          {item.prioridade === PrioridadeKanban.ALTA && (
                            <span className="badge badge-warning text-xs flex-shrink-0">ALTA</span>
                          )}
                        </div>
                        {item.tipo === TipoItemKanban.RESTRICAO && (
                          <span className="text-xs theme-text-secondary">
                            {item.tags?.join(' • ')}
                        </span>
                      )}
                      </div>
                    </div>
                    
                    {/* Descrição */}
                    {item.descricao && (
                      <p className="text-xs theme-text-secondary mb-3 line-clamp-2">
                        {item.descricao}
                      </p>
                    )}

                    {/* Metadados */}
                    <div className="space-y-2 mb-3">
                      {item.responsavel && (
                        <div className="flex items-center gap-2 text-xs theme-text-secondary">
                          <User size={12} />
                          <span className="truncate">{item.responsavel}</span>
                        </div>
                      )}
                      {item.dataVencimento && (
                        <div className="flex items-center gap-2 text-xs theme-text-secondary">
                          <Clock size={12} />
                          <span>
                            {format(item.dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      {item.percentualConcluido !== undefined && (
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${item.percentualConcluido}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Evidências */}
                    {item.quantidadeEvidencias && item.quantidadeEvidencias > 0 && (
                      <div className="flex items-center gap-2 text-xs theme-text-secondary mb-2">
                        <FileText size={12} />
                        <span>{item.quantidadeEvidencias} evidência(s)</span>
                      </div>
                    )}

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {item.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 theme-text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex items-center space-x-2 text-xs theme-text-secondary">
                        {item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA && (
                          <Tag size={12} />
                        )}
                        {item.tipo === TipoItemKanban.ATIVIDADE_LPS && (
                          <Calendar size={12} />
                        )}
                        {item.tipo === TipoItemKanban.RESTRICAO && (
                          <AlertCircle size={12} />
                        )}
                        <span className="text-xs capitalize">
                          {item.tipo.replace('_', ' ').toLowerCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {item.podeCheckIn && (
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(item);
                            }}
                            className="text-xs font-medium px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${tema.warning}20`,
                              color: tema.warning,
                          }}
                        >
                            Iniciar
                        </button>
                      )}
                        {item.podeCheckOut && (
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckOut(item);
                            }}
                            className="text-xs font-medium px-2 py-1 rounded"
                          style={{ 
                            backgroundColor: `${tema.success}20`,
                              color: tema.success,
                          }}
                        >
                            Concluir
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modais */}
      {taskModalOpen && (
        <TaskModal
          open={taskModalOpen}
          onClose={() => {
            setTaskModalOpen(false);
            setAtividadeIdParaModal(null);
          }}
          atividadeId={atividadeIdParaModal}
          projetoId={projetoId || 'proj-1'}
          onSave={handleSaveAtividade}
        />
      )}

      {restricaoModalOpen && (
        <RestricaoModal
          restricao={restricaoParaModal}
          isOpen={restricaoModalOpen}
          onClose={() => {
            setRestricaoModalOpen(false);
            setRestricaoParaModal(null);
          }}
          onSave={handleSaveRestricao}
          atividadeId={restricaoParaModal?.atividade_id}
          onAddEvidencia={(restricaoId, arquivo) => {
            const { addEvidencia } = useLPSStore.getState();
            addEvidencia(restricaoId, arquivo);
          }}
          onDeleteEvidencia={(restricaoId, evidenciaId) => {
            const { deleteEvidencia } = useLPSStore.getState();
            deleteEvidencia(restricaoId, evidenciaId);
          }}
          onAddAndamento={(restricaoId, descricao) => {
            const { addAndamento } = useLPSStore.getState();
            addAndamento(restricaoId, descricao);
          }}
        />
      )}

      {atividadeLPSModalOpen && (
        <AtividadeLPSModal
          atividade={atividadeLPSParaModal}
          isOpen={atividadeLPSModalOpen}
          onClose={() => {
            setAtividadeLPSModalOpen(false);
            setAtividadeLPSParaModal(null);
          }}
          onSave={handleSaveAtividadeLPS}
        />
      )}
    </div>
  );
};

export default KanbanPage;
