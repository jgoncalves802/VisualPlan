import React, { useState, useEffect } from 'react';
import {
  StatusCondicaoProntidao,
  CoresCondicaoProntidao,
  LabelsCondicaoProntidao,
  CondicaoProntidao,
  ResumoProntidao,
  TipoCondicaoProntidao,
  AtividadeLPS,
  StatusAtividadeLPS,
} from '../../../types/lps';
import { condicoesProntidaoService } from '../../../services/condicoesProntidaoService';
import { Check, Minus, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface CondicoesProntidaoChecklistProps {
  atividadeId: string;
  empresaId: string;
  onProntidaoChange?: (resumo: ResumoProntidao) => void;
  readOnly?: boolean;
  compact?: boolean;
  atividade?: AtividadeLPS | null;
  todasAtividades?: AtividadeLPS[];
}

export const CondicoesProntidaoChecklist: React.FC<CondicoesProntidaoChecklistProps> = ({
  atividadeId,
  empresaId,
  onProntidaoChange,
  readOnly = false,
  compact = false,
  atividade,
  todasAtividades = [],
}) => {
  const [condicoes, setCondicoes] = useState<CondicaoProntidao[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const verificarPredecessorasConcluidas = (): boolean => {
    if (!atividade?.dependencias || atividade.dependencias.length === 0) {
      return true;
    }
    
    return atividade.dependencias.every(depId => {
      const predecessora = todasAtividades.find(a => a.id === depId);
      return predecessora?.status === StatusAtividadeLPS.CONCLUIDA;
    });
  };

  const atualizarCondicaoPredecessoraAutomaticamente = async (condicoesAtuais: CondicaoProntidao[]) => {
    const predecessorasConcluidas = verificarPredecessorasConcluidas();
    const condicaoPredecessora = condicoesAtuais.find(
      c => c.tipoCondicao === TipoCondicaoProntidao.PREDECESSORA
    );
    
    if (condicaoPredecessora) {
      const semDependencias = !atividade?.dependencias || atividade.dependencias.length === 0;
      
      if (semDependencias && condicaoPredecessora.status === StatusCondicaoProntidao.PENDENTE) {
        const atualizada = await condicoesProntidaoService.atualizarStatus(
          condicaoPredecessora.id,
          StatusCondicaoProntidao.NAO_APLICAVEL
        );
        if (atualizada) {
          return condicoesAtuais.map(c => c.id === condicaoPredecessora.id ? atualizada : c);
        }
      } else if (predecessorasConcluidas && condicaoPredecessora.status === StatusCondicaoProntidao.PENDENTE) {
        const atualizada = await condicoesProntidaoService.atualizarStatus(
          condicaoPredecessora.id,
          StatusCondicaoProntidao.ATENDIDA
        );
        if (atualizada) {
          return condicoesAtuais.map(c => c.id === condicaoPredecessora.id ? atualizada : c);
        }
      } else if (!predecessorasConcluidas && !semDependencias && condicaoPredecessora.status === StatusCondicaoProntidao.ATENDIDA) {
        const atualizada = await condicoesProntidaoService.atualizarStatus(
          condicaoPredecessora.id,
          StatusCondicaoProntidao.PENDENTE
        );
        if (atualizada) {
          return condicoesAtuais.map(c => c.id === condicaoPredecessora.id ? atualizada : c);
        }
      }
    }
    return condicoesAtuais;
  };

  useEffect(() => {
    loadCondicoes();
  }, [atividadeId, empresaId]);

  useEffect(() => {
    if (condicoes.length > 0 && atividade) {
      atualizarCondicaoPredecessoraAutomaticamente(condicoes).then(novasCondicoes => {
        if (novasCondicoes !== condicoes) {
          setCondicoes(novasCondicoes);
          notifyChange(novasCondicoes);
        }
      });
    }
  }, [atividade, todasAtividades]);

  const loadCondicoes = async () => {
    setLoading(true);
    try {
      let condicoesExistentes = await condicoesProntidaoService.getByAtividade(atividadeId, empresaId);
      
      if (condicoesExistentes.length === 0) {
        condicoesExistentes = await condicoesProntidaoService.inicializarCondicoes(atividadeId, empresaId);
      }
      
      if (atividade) {
        condicoesExistentes = await atualizarCondicaoPredecessoraAutomaticamente(condicoesExistentes);
      }
      
      setCondicoes(condicoesExistentes);
      notifyChange(condicoesExistentes);
    } catch (error) {
      console.error('Erro ao carregar condições de prontidão:', error);
    } finally {
      setLoading(false);
    }
  };

  const notifyChange = (condicoesAtuais: CondicaoProntidao[]) => {
    if (!onProntidaoChange) return;
    
    const condicoesAtendidas = condicoesAtuais.filter(c => c.status === StatusCondicaoProntidao.ATENDIDA).length;
    const condicoesPendentes = condicoesAtuais.filter(c => c.status === StatusCondicaoProntidao.PENDENTE).length;
    const condicoesNaoAplicaveis = condicoesAtuais.filter(c => c.status === StatusCondicaoProntidao.NAO_APLICAVEL).length;
    const totalCondicoes = condicoesAtuais.length;
    const condicoesRelevantes = totalCondicoes - condicoesNaoAplicaveis;
    
    onProntidaoChange({
      atividadeId,
      totalCondicoes,
      condicoesAtendidas,
      condicoesPendentes,
      condicoesNaoAplicaveis,
      percentualProntidao: condicoesRelevantes > 0 ? Math.round((condicoesAtendidas / condicoesRelevantes) * 100) : 100,
      prontaParaExecucao: condicoesPendentes === 0,
      condicoes: condicoesAtuais,
    });
  };

  const handleStatusChange = async (condicao: CondicaoProntidao, novoStatus: StatusCondicaoProntidao) => {
    if (readOnly) return;
    
    setUpdating(condicao.id);
    try {
      const condicaoAtualizada = await condicoesProntidaoService.atualizarStatus(condicao.id, novoStatus);
      
      if (condicaoAtualizada) {
        const novasCondicoes = condicoes.map(c => 
          c.id === condicao.id ? condicaoAtualizada : c
        );
        setCondicoes(novasCondicoes);
        notifyChange(novasCondicoes);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const cycleStatus = (condicao: CondicaoProntidao) => {
    const nextStatus: Record<StatusCondicaoProntidao, StatusCondicaoProntidao> = {
      [StatusCondicaoProntidao.PENDENTE]: StatusCondicaoProntidao.ATENDIDA,
      [StatusCondicaoProntidao.ATENDIDA]: StatusCondicaoProntidao.NAO_APLICAVEL,
      [StatusCondicaoProntidao.NAO_APLICAVEL]: StatusCondicaoProntidao.PENDENTE,
    };
    handleStatusChange(condicao, nextStatus[condicao.status]);
  };

  const getStatusIcon = (status: StatusCondicaoProntidao) => {
    switch (status) {
      case StatusCondicaoProntidao.ATENDIDA:
        return <Check className="w-3.5 h-3.5 text-white" />;
      case StatusCondicaoProntidao.NAO_APLICAVEL:
        return <Minus className="w-3.5 h-3.5 text-white" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status: StatusCondicaoProntidao, corBase: string) => {
    switch (status) {
      case StatusCondicaoProntidao.ATENDIDA:
        return corBase;
      case StatusCondicaoProntidao.NAO_APLICAVEL:
        return '#9CA3AF';
      default:
        return 'transparent';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const condicoesAtendidas = condicoes.filter(c => c.status === StatusCondicaoProntidao.ATENDIDA).length;
  const condicoesRelevantes = condicoes.filter(c => c.status !== StatusCondicaoProntidao.NAO_APLICAVEL).length;
  const prontaParaExecucao = condicoes.every(c => c.status !== StatusCondicaoProntidao.PENDENTE);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {condicoes.map((condicao) => (
          <button
            key={condicao.id}
            onClick={(e) => {
              e.stopPropagation();
              if (!readOnly) cycleStatus(condicao);
            }}
            disabled={readOnly || updating === condicao.id}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              updating === condicao.id ? 'opacity-50' : ''
            } ${!readOnly ? 'hover:scale-110 cursor-pointer' : ''}`}
            style={{
              borderColor: CoresCondicaoProntidao[condicao.tipoCondicao],
              backgroundColor: getStatusBgColor(condicao.status, CoresCondicaoProntidao[condicao.tipoCondicao]),
            }}
            title={`${LabelsCondicaoProntidao[condicao.tipoCondicao]}: ${
              condicao.status === StatusCondicaoProntidao.ATENDIDA ? 'Atendida' :
              condicao.status === StatusCondicaoProntidao.NAO_APLICAVEL ? 'N/A' : 'Pendente'
            }`}
          >
            {updating === condicao.id ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              getStatusIcon(condicao.status)
            )}
          </button>
        ))}
        <span className={`ml-1 text-xs font-medium ${prontaParaExecucao ? 'text-green-600' : 'text-amber-600'}`}>
          {condicoesAtendidas}/{condicoesRelevantes}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Condições de Prontidão</h4>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
          prontaParaExecucao 
            ? 'bg-green-100 text-green-700' 
            : 'bg-amber-100 text-amber-700'
        }`}>
          {prontaParaExecucao ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          {condicoesAtendidas}/{condicoesRelevantes}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {condicoes.map((condicao) => (
          <button
            key={condicao.id}
            onClick={() => !readOnly && cycleStatus(condicao)}
            disabled={readOnly || updating === condicao.id}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
              condicao.status === StatusCondicaoProntidao.ATENDIDA
                ? 'bg-opacity-10 border-opacity-50'
                : condicao.status === StatusCondicaoProntidao.NAO_APLICAVEL
                ? 'bg-gray-50 border-gray-200 opacity-60'
                : 'bg-white border-gray-200 hover:border-gray-300'
            } ${!readOnly ? 'cursor-pointer hover:shadow-sm' : ''}`}
            style={{
              backgroundColor: condicao.status === StatusCondicaoProntidao.ATENDIDA 
                ? `${CoresCondicaoProntidao[condicao.tipoCondicao]}15` 
                : undefined,
              borderColor: condicao.status === StatusCondicaoProntidao.ATENDIDA 
                ? CoresCondicaoProntidao[condicao.tipoCondicao] 
                : undefined,
            }}
          >
            <div
              className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{
                borderColor: CoresCondicaoProntidao[condicao.tipoCondicao],
                backgroundColor: getStatusBgColor(condicao.status, CoresCondicaoProntidao[condicao.tipoCondicao]),
              }}
            >
              {updating === condicao.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : (
                getStatusIcon(condicao.status)
              )}
            </div>
            <span className={`text-xs font-medium ${
              condicao.status === StatusCondicaoProntidao.NAO_APLICAVEL 
                ? 'text-gray-400 line-through' 
                : 'text-gray-700'
            }`}>
              {LabelsCondicaoProntidao[condicao.tipoCondicao]}
            </span>
          </button>
        ))}
      </div>

      {prontaParaExecucao && (
        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs font-medium text-green-700">Pronta para Execução</span>
        </div>
      )}
    </div>
  );
};

export const CondicoesProntidaoBadge: React.FC<{
  atividadeId: string;
  empresaId: string;
  onClick?: () => void;
}> = ({ atividadeId, empresaId, onClick }) => {
  const [resumo, setResumo] = useState<ResumoProntidao | null>(null);

  useEffect(() => {
    loadResumo();
  }, [atividadeId, empresaId]);

  const loadResumo = async () => {
    try {
      const result = await condicoesProntidaoService.getResumoProntidao(atividadeId, empresaId);
      setResumo(result);
    } catch (error) {
      console.error('Erro ao carregar resumo de prontidão:', error);
    }
  };

  if (!resumo || resumo.totalCondicoes === 0) return null;

  const condicoesRelevantes = resumo.totalCondicoes - resumo.condicoesNaoAplicaveis;
  
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
        resumo.prontaParaExecucao
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
      }`}
      title={`${resumo.condicoesAtendidas}/${condicoesRelevantes} condições atendidas`}
    >
      {resumo.prontaParaExecucao ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <AlertTriangle className="w-3 h-3" />
      )}
      {resumo.condicoesAtendidas}/{condicoesRelevantes}
    </button>
  );
};
