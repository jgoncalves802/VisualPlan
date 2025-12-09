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
  CheckCircle2, 
  PlayCircle,
  Filter,
  Search,
  Calendar,
  Tag,
  AlertTriangle,
  RotateCcw,
  ClipboardList,
  FileCheck,
  GitBranch,
  RefreshCw,
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
  FiltrosKanban,
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
  
  const { atividades, carregarAtividades, atualizarAtividade } = useCronogramaStore();
  const { 
    atividades: atividadesLPS, 
    restricoes, 
    updateAtividade: updateAtividadeLPS,
    updateRestricao 
  } = useLPSStore();

  const [filtros, setFiltros] = useState<FiltrosKanban>({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [_itemSelecionado, setItemSelecionado] = useState<ItemKanban | null>(null);
  
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [restricaoModalOpen, setRestricaoModalOpen] = useState(false);
  const [atividadeLPSModalOpen, setAtividadeLPSModalOpen] = useState(false);
  const [atividadeIdParaModal, setAtividadeIdParaModal] = useState<string | null>(null);
  const [restricaoParaModal, setRestricaoParaModal] = useState<any | null>(null);
  const [atividadeLPSParaModal, setAtividadeLPSParaModal] = useState<any | null>(null);
  
  const [itemSendoArrastado, setItemSendoArrastado] = useState<ItemKanban | null>(null);
  const [colunaSobreposta, setColunaSobreposta] = useState<StatusKanban | null>(null);

  useEffect(() => {
    if (projetoId) {
      carregarAtividades(projetoId);
    }
  }, [projetoId, carregarAtividades]);

  const parseDate = (dateStr: string | Date | undefined): Date | undefined => {
    if (!dateStr) return undefined;
    if (dateStr instanceof Date) {
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

  const converterAtividadeCronograma = (atividade: any): ItemKanban => {
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

  const todosItens = useMemo(() => {
    const itens: ItemKanban[] = [];

    atividades.forEach((atividade) => {
      if (!filtros.responsavelId || atividade.responsavel_id === filtros.responsavelId || !atividade.responsavel_id) {
        itens.push(converterAtividadeCronograma(atividade));
      }
    });

    atividadesLPS.forEach((atividade) => {
      if (!filtros.responsavelId || atividade.responsavel_id === filtros.responsavelId || !atividade.responsavel_id) {
        itens.push(converterAtividadeLPS(atividade));
      }
    });

    restricoes.forEach((restricao) => {
      if (!filtros.responsavelId || restricao.responsavel_id === filtros.responsavelId || !restricao.responsavel_id) {
        itens.push(converterRestricao(restricao));
      }
    });

    return itens;
  }, [atividades, atividadesLPS, restricoes, filtros.responsavelId, usuario?.id]);

  const itensFiltrados = useMemo(() => {
    let filtrados = [...todosItens];

    if (filtros.tipos && filtros.tipos.length > 0) {
      filtrados = filtrados.filter((item) => filtros.tipos!.includes(item.tipo));
    }

    if (filtros.busca) {
      const buscaLower = filtros.busca.toLowerCase();
      filtrados = filtrados.filter(
        (item) =>
          item.titulo.toLowerCase().includes(buscaLower) ||
          item.descricao?.toLowerCase().includes(buscaLower)
      );
    }

    if (filtros.prioridadeMinima !== undefined) {
      filtrados = filtrados.filter((item) => item.prioridade >= filtros.prioridadeMinima!);
    }

    if (filtros.apenasCriticas) {
      filtrados = filtrados.filter((item) => item.caminhoCritico || item.prioridade === PrioridadeKanban.CRITICA);
    }

    if (filtros.apenasComEvidencias) {
      filtrados = filtrados.filter((item) => (item.quantidadeEvidencias || 0) > 0);
    }

    return filtrados;
  }, [todosItens, filtros]);

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

    Object.keys(agrupados).forEach((status) => {
      agrupados[status as StatusKanban].sort((a, b) => {
        if (b.prioridade !== a.prioridade) {
          return b.prioridade - a.prioridade;
        }
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

  const estatisticas = useMemo(() => {
    const criticas = itensFiltrados.filter(
      (item) => item.caminhoCritico || item.prioridade === PrioridadeKanban.CRITICA
    ).length;

    return {
      planejamento: itensPorStatus[StatusKanban.PLANEJAMENTO].length,
      execucao: itensPorStatus[StatusKanban.EXECUCAO].length,
      controle: itensPorStatus[StatusKanban.CONTROLE].length,
      encerramento: itensPorStatus[StatusKanban.ENCERRAMENTO].length,
      criticas,
    };
  }, [itensFiltrados, itensPorStatus]);

  const handleDragStart = (e: React.DragEvent, item: ItemKanban) => {
    setItemSendoArrastado(item);
    e.dataTransfer.effectAllowed = 'move';
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

    if (!itemSendoArrastado) return;

    if (itemSendoArrastado.status === novoStatus) {
      setItemSendoArrastado(null);
      return;
    }

    try {
      if (itemSendoArrastado.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA) {
        let novoStatusAtividade: StatusAtividade;
        if (novoStatus === StatusKanban.PLANEJAMENTO) {
          novoStatusAtividade = StatusAtividade.NAO_INICIADA;
        } else if (novoStatus === StatusKanban.EXECUCAO) {
          novoStatusAtividade = StatusAtividade.EM_ANDAMENTO;
        } else if (novoStatus === StatusKanban.CONTROLE) {
          novoStatusAtividade = StatusAtividade.PARALISADA;
        } else {
          novoStatusAtividade = StatusAtividade.CONCLUIDA;
        }
        await atualizarAtividade(itemSendoArrastado.atividadeId!, { status: novoStatusAtividade });
      } else if (itemSendoArrastado.tipo === TipoItemKanban.ATIVIDADE_LPS) {
        let novoStatusLPS: StatusAtividadeLPS;
        if (novoStatus === StatusKanban.PLANEJAMENTO) {
          novoStatusLPS = StatusAtividadeLPS.PLANEJADA;
        } else if (novoStatus === StatusKanban.EXECUCAO) {
          novoStatusLPS = StatusAtividadeLPS.EM_ANDAMENTO;
        } else if (novoStatus === StatusKanban.CONTROLE) {
          novoStatusLPS = StatusAtividadeLPS.BLOQUEADA;
        } else {
          novoStatusLPS = StatusAtividadeLPS.CONCLUIDA;
        }
        updateAtividadeLPS(itemSendoArrastado.atividadeId!, { status: novoStatusLPS });
      } else if (itemSendoArrastado.tipo === TipoItemKanban.RESTRICAO) {
        let novoStatusRestricao: 'PENDENTE' | 'CONCLUIDA' | 'ATRASADA' | 'CANCELADA';
        if (novoStatus === StatusKanban.PLANEJAMENTO) {
          novoStatusRestricao = 'PENDENTE';
        } else if (novoStatus === StatusKanban.CONTROLE) {
          novoStatusRestricao = 'ATRASADA';
        } else if (novoStatus === StatusKanban.ENCERRAMENTO) {
          novoStatusRestricao = 'CONCLUIDA';
        } else {
          novoStatusRestricao = 'PENDENTE';
        }
        updateRestricao(itemSendoArrastado.restricaoId!, { status: novoStatusRestricao });
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }

    setItemSendoArrastado(null);
  };

  const handleItemClick = (item: ItemKanban) => {
    setItemSelecionado(item);
    
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA) {
      setAtividadeIdParaModal(item.atividadeId || null);
      setTaskModalOpen(true);
    } else if (item.tipo === TipoItemKanban.RESTRICAO) {
      setRestricaoParaModal(item.origemRestricao);
      setRestricaoModalOpen(true);
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS) {
      setAtividadeLPSParaModal(item.origemAtividadeLPS);
      setAtividadeLPSModalOpen(true);
    }
  };

  const handleCheckIn = async (item: ItemKanban) => {
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA) {
      await atualizarAtividade(item.atividadeId!, { status: StatusAtividade.EM_ANDAMENTO });
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS) {
      updateAtividadeLPS(item.atividadeId!, { status: StatusAtividadeLPS.EM_ANDAMENTO });
    }
  };

  const handleConcluir = async (item: ItemKanban) => {
    if (item.tipo === TipoItemKanban.ATIVIDADE_CRONOGRAMA) {
      await atualizarAtividade(item.atividadeId!, { status: StatusAtividade.CONCLUIDA });
    } else if (item.tipo === TipoItemKanban.ATIVIDADE_LPS) {
      updateAtividadeLPS(item.atividadeId!, { status: StatusAtividadeLPS.CONCLUIDA });
    } else if (item.tipo === TipoItemKanban.RESTRICAO) {
      updateRestricao(item.restricaoId!, { status: 'CONCLUIDA' });
    }
  };

  const getPrioridadeColor = (prioridade: PrioridadeKanban) => {
    switch (prioridade) {
      case PrioridadeKanban.CRITICA:
        return 'bg-red-100 text-red-800 border-red-200';
      case PrioridadeKanban.ALTA:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case PrioridadeKanban.MEDIA:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case PrioridadeKanban.BAIXA:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPrioridadeLabel = (prioridade: PrioridadeKanban) => {
    switch (prioridade) {
      case PrioridadeKanban.CRITICA:
        return 'CRÍTICA';
      case PrioridadeKanban.ALTA:
        return 'Alta';
      case PrioridadeKanban.MEDIA:
        return 'Média';
      case PrioridadeKanban.BAIXA:
        return 'Baixa';
      default:
        return 'Normal';
    }
  };

  const getTipoIcon = (tipo: TipoItemKanban) => {
    switch (tipo) {
      case TipoItemKanban.ATIVIDADE_CRONOGRAMA:
        return <Calendar size={14} className="text-blue-500" />;
      case TipoItemKanban.ATIVIDADE_LPS:
        return <PlayCircle size={14} className="text-purple-500" />;
      case TipoItemKanban.RESTRICAO:
        return <AlertCircle size={14} className="text-red-500" />;
      case TipoItemKanban.ACAO_5W2H:
        return <ClipboardList size={14} className="text-orange-500" />;
      case TipoItemKanban.AUDITORIA:
        return <FileCheck size={14} className="text-teal-500" />;
      case TipoItemKanban.MUDANCA:
        return <GitBranch size={14} className="text-indigo-500" />;
      case TipoItemKanban.PDCA:
        return <RefreshCw size={14} className="text-green-500" />;
      default:
        return <Tag size={14} className="text-gray-500" />;
    }
  };

  const getTipoLabel = (tipo: TipoItemKanban) => {
    switch (tipo) {
      case TipoItemKanban.ATIVIDADE_CRONOGRAMA:
        return 'Atividade Gantt';
      case TipoItemKanban.ATIVIDADE_LPS:
        return 'Atividade LPS';
      case TipoItemKanban.RESTRICAO:
        return 'Restrição';
      case TipoItemKanban.ACAO_5W2H:
        return 'Ação 5W2H';
      case TipoItemKanban.AUDITORIA:
        return 'Auditoria';
      case TipoItemKanban.MUDANCA:
        return 'Mudança';
      case TipoItemKanban.PDCA:
        return 'Ciclo PDCA';
      default:
        return 'Item';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kanban de Execução</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gerencie atividades, restrições e ações conforme PMBOK
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarFiltros(!mostrarFiltros)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-2"
            >
              <Filter size={16} />
              <span className="text-sm">Filtros</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          {colunas.map((coluna) => (
            <div
              key={coluna.id}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg"
            >
              <coluna.icone size={20} style={{ color: coluna.cor }} />
              <div>
                <div className="text-sm font-medium text-gray-700">{coluna.titulo}</div>
                <div className="text-lg font-bold" style={{ color: coluna.cor }}>
                  {itensPorStatus[coluna.id].length}
                </div>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-lg ml-auto">
            <AlertCircle size={20} className="text-red-500" />
            <div>
              <div className="text-sm font-medium text-red-700">Críticas</div>
              <div className="text-lg font-bold text-red-600">{estatisticas.criticas}</div>
            </div>
          </div>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={filtros.busca || ''}
                onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filtros.apenasCriticas || false}
                onChange={(e) => setFiltros({ ...filtros, apenasCriticas: e.target.checked })}
                className="rounded border-gray-300"
              />
              Apenas Críticas
            </label>
            <button
              onClick={() => setFiltros({})}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <RotateCcw size={14} />
              Limpar Filtros
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 h-full min-w-max">
          {colunas.map((coluna) => (
            <div
              key={coluna.id}
              className={`w-80 flex flex-col bg-gray-50 rounded-lg ${
                colunaSobreposta === coluna.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, coluna.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna.id)}
            >
              <div
                className="px-4 py-3 rounded-t-lg flex items-center justify-between"
                style={{ backgroundColor: `${coluna.cor}20` }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: coluna.cor }}
                  />
                  <span className="font-medium text-gray-800">{coluna.titulo}</span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: coluna.cor, color: 'white' }}
                >
                  {itensPorStatus[coluna.id].length}
                </span>
              </div>
              <div className="text-xs text-gray-500 px-4 py-1">{coluna.subtitulo}</div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {itensPorStatus[coluna.id].map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item)}
                    onClick={() => handleItemClick(item)}
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow ${
                      itemSendoArrastado?.id === item.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {getTipoIcon(item.tipo)}
                        <span className="text-xs text-gray-500">{getTipoLabel(item.tipo)}</span>
                      </div>
                      {item.prioridade >= PrioridadeKanban.ALTA && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs font-medium border ${getPrioridadeColor(
                            item.prioridade
                          )}`}
                        >
                          {getPrioridadeLabel(item.prioridade)}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {item.titulo}
                    </h4>
                    
                    {item.descricao && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.descricao}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        <span>{item.responsavel || 'Sem responsável'}</span>
                      </div>
                      {item.dataVencimento && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{format(item.dataVencimento, 'dd/MM/yyyy', { locale: ptBR })}</span>
                        </div>
                      )}
                    </div>
                    
                    {(item.podeCheckIn || item.podeConcluir) && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                        {item.podeCheckIn && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(item);
                            }}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                          >
                            Iniciar
                          </button>
                        )}
                        {item.podeConcluir && item.status === StatusKanban.EXECUCAO && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConcluir(item);
                            }}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                          >
                            Concluir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                
                {itensPorStatus[coluna.id].length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {taskModalOpen && atividadeIdParaModal && (
        <TaskModal
          atividadeId={atividadeIdParaModal}
          open={taskModalOpen}
          projetoId={projetoId || ''}
          onClose={() => {
            setTaskModalOpen(false);
            setAtividadeIdParaModal(null);
            setItemSelecionado(null);
          }}
          onSave={async (dados) => {
            if (atividadeIdParaModal) {
              await atualizarAtividade(atividadeIdParaModal, dados);
            }
            setTaskModalOpen(false);
            setAtividadeIdParaModal(null);
            setItemSelecionado(null);
          }}
        />
      )}

      {restricaoModalOpen && restricaoParaModal && (
        <RestricaoModal
          restricao={restricaoParaModal}
          isOpen={restricaoModalOpen}
          onClose={() => {
            setRestricaoModalOpen(false);
            setRestricaoParaModal(null);
            setItemSelecionado(null);
          }}
          onSave={(data) => {
            updateRestricao(restricaoParaModal.id, data);
            setRestricaoModalOpen(false);
            setRestricaoParaModal(null);
            setItemSelecionado(null);
          }}
        />
      )}

      {atividadeLPSModalOpen && atividadeLPSParaModal && (
        <AtividadeLPSModal
          atividade={atividadeLPSParaModal}
          isOpen={atividadeLPSModalOpen}
          onClose={() => {
            setAtividadeLPSModalOpen(false);
            setAtividadeLPSParaModal(null);
            setItemSelecionado(null);
          }}
          onSave={(data) => {
            updateAtividadeLPS(atividadeLPSParaModal.id, data);
            setAtividadeLPSModalOpen(false);
            setAtividadeLPSParaModal(null);
            setItemSelecionado(null);
          }}
        />
      )}
    </div>
  );
};

export default KanbanPage;
