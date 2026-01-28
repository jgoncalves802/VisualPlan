import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  History,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type {
  CriterioMedicao,
  CriterioMedicaoEtapa,
  AvancoEtapa,
  AvancoAprovacao,
  PeriodoTipo,
} from '../../../types/criteriosMedicao.types';

interface EtapasAvancoPanelProps {
  itemCriterioId: string;
  criterio: CriterioMedicao;
  etapas: CriterioMedicaoEtapa[];
  quantidadeItem: number;
  unidade: string;
  onUpdate?: () => void;
  usuarioId: string;
  usuarioNome: string;
  podeAprovar?: boolean;
}

interface AvancoFormData {
  etapaId: string;
  percentualAvanco: number;
  periodoTipo: PeriodoTipo;
  periodoInicio: string;
  periodoFim: string;
  observacoes: string;
}

const EtapasAvancoPanel: React.FC<EtapasAvancoPanelProps> = ({
  itemCriterioId,
  criterio,
  etapas,
  quantidadeItem,
  unidade,
  onUpdate,
  usuarioId,
  usuarioNome,
  podeAprovar = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loadingAvancos, setLoadingAvancos] = useState(false);
  const [avancosPorEtapa, setAvancosPorEtapa] = useState<Record<string, AvancoEtapa[]>>({});
  const [showAddAvanco, setShowAddAvanco] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);
  const [formData, setFormData] = useState<AvancoFormData>({
    etapaId: '',
    percentualAvanco: 0,
    periodoTipo: 'dia',
    periodoInicio: format(new Date(), 'yyyy-MM-dd'),
    periodoFim: format(new Date(), 'yyyy-MM-dd'),
    observacoes: '',
  });

  useEffect(() => {
    if (isExpanded && etapas.length > 0) {
      loadAvancos();
    }
  }, [isExpanded, etapas]);

  const loadAvancos = async () => {
    setLoadingAvancos(true);
    try {
      const avancosMap: Record<string, AvancoEtapa[]> = {};
      await Promise.all(
        etapas.map(async (etapa) => {
          const avancos = await criteriosMedicaoService.getAvancosEtapa(itemCriterioId, etapa.id);
          avancosMap[etapa.id] = avancos;
        })
      );
      setAvancosPorEtapa(avancosMap);
    } catch (error) {
      console.error('Erro ao carregar avanços:', error);
    } finally {
      setLoadingAvancos(false);
    }
  };

  const calcularProgressoEtapa = (etapaId: string): number => {
    const avancos = avancosPorEtapa[etapaId] || [];
    const avancosAprovados = avancos.filter((a) => a.status === 'aprovado');
    return avancosAprovados.reduce((acc, a) => acc + a.percentualAvancado, 0);
  };

  const calcularProgressoTotal = (): number => {
    let progressoTotal = 0;
    etapas.forEach((etapa) => {
      const progressoEtapa = calcularProgressoEtapa(etapa.id);
      progressoTotal += (progressoEtapa / 100) * etapa.percentual;
    });
    return progressoTotal;
  };

  const handleOpenAddAvanco = (etapaId: string) => {
    setFormData({
      etapaId,
      percentualAvanco: 0,
      periodoTipo: 'dia',
      periodoInicio: format(new Date(), 'yyyy-MM-dd'),
      periodoFim: format(new Date(), 'yyyy-MM-dd'),
      observacoes: '',
    });
    setShowAddAvanco(etapaId);
  };

  const handleSaveAvanco = async () => {
    if (!formData.etapaId || formData.percentualAvanco <= 0) return;

    setSaving(true);
    try {
      await criteriosMedicaoService.registrarAvanco({
        itemCriterioId,
        etapaId: formData.etapaId,
        percentualAvancado: formData.percentualAvanco,
        periodoTipo: formData.periodoTipo,
        periodoInicio: new Date(formData.periodoInicio),
        periodoFim: new Date(formData.periodoFim),
        observacoes: formData.observacoes || undefined,
        registradoPor: usuarioId,
        registradoPorNome: usuarioNome,
      });

      setShowAddAvanco(null);
      await loadAvancos();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao registrar avanço:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAprovarAvanco = async (avancoId: string, nivel: AvancoAprovacao['nivel']) => {
    try {
      await criteriosMedicaoService.aprovarAvanco(avancoId, usuarioId, usuarioNome, nivel);
      await loadAvancos();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao aprovar avanço:', error);
    }
  };

  const handleRejeitarAvanco = async (avancoId: string, nivel: AvancoAprovacao['nivel'], motivo: string) => {
    try {
      await criteriosMedicaoService.rejeitarAvanco(avancoId, usuarioId, usuarioNome, nivel, motivo);
      await loadAvancos();
      onUpdate?.();
    } catch (error) {
      console.error('Erro ao rejeitar avanço:', error);
    }
  };

  const getStatusIcon = (status: AvancoEtapa['status']) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejeitado':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: AvancoEtapa['status']) => {
    switch (status) {
      case 'aprovado':
        return 'Aprovado';
      case 'pendente':
        return 'Pendente';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  const progressoTotal = calcularProgressoTotal();
  const quantidadeExecutada = (progressoTotal / 100) * quantidadeItem;

  return (
    <div className="border rounded-lg" style={{ borderColor: 'var(--color-border)' }}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:opacity-80 transition-opacity"
        style={{ backgroundColor: 'var(--color-surface-secondary)' }}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 theme-text-secondary" />
          ) : (
            <ChevronRight className="w-4 h-4 theme-text-secondary" />
          )}
          <div className="text-left">
            <span className="text-sm font-medium theme-text">{criterio.codigo}</span>
            <span className="text-xs theme-text-secondary ml-2">{criterio.descritivo}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-sm font-medium theme-text">{progressoTotal.toFixed(1)}%</span>
            <span className="text-xs theme-text-secondary ml-2">
              ({quantidadeExecutada.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {unidade})
            </span>
          </div>
          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(progressoTotal, 100)}%`,
                backgroundColor: progressoTotal >= 100 ? '#10B981' : '#3B82F6',
              }}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          {loadingAvancos ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin theme-text-secondary" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-medium theme-text-secondary uppercase tracking-wider mb-2">
                Etapas ({etapas.length})
              </div>
              {etapas.map((etapa) => {
                const progressoEtapa = calcularProgressoEtapa(etapa.id);
                const avancos = avancosPorEtapa[etapa.id] || [];
                const quantidadeEtapa = (etapa.percentual / 100) * quantidadeItem;
                const quantidadeEtapaExecutada = (progressoEtapa / 100) * quantidadeEtapa;

                return (
                  <div
                    key={etapa.id}
                    className="border rounded-lg p-3"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
                            Etapa {etapa.numeroEtapa}
                          </span>
                          <span className="text-sm theme-text">{etapa.descritivo}</span>
                        </div>
                        {etapa.descritivoDocumento && (
                          <div className="text-xs theme-text-secondary mt-1">{etapa.descritivoDocumento}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs theme-text-secondary">
                            Peso: {etapa.percentual}%
                          </div>
                          <div className="text-sm font-medium theme-text">
                            {progressoEtapa.toFixed(1)}%
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenAddAvanco(etapa.id)}
                            className="p-1.5 rounded hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: 'var(--color-surface-tertiary)' }}
                            title="Registrar Avanço"
                          >
                            <Plus className="w-4 h-4 theme-text-secondary" />
                          </button>
                          <button
                            onClick={() => setShowHistorico(showHistorico === etapa.id ? null : etapa.id)}
                            className="p-1.5 rounded hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: showHistorico === etapa.id ? 'var(--color-primary)' : 'var(--color-surface-tertiary)' }}
                            title="Ver Histórico"
                          >
                            <History className="w-4 h-4" style={{ color: showHistorico === etapa.id ? 'white' : 'var(--color-text-secondary)' }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--color-border)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(progressoEtapa, 100)}%`,
                          backgroundColor: progressoEtapa >= 100 ? '#10B981' : '#3B82F6',
                        }}
                      />
                    </div>

                    <div className="text-xs theme-text-secondary">
                      {quantidadeEtapaExecutada.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {quantidadeEtapa.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {unidade}
                    </div>

                    {showAddAvanco === etapa.id && (
                      <div className="mt-3 p-3 border rounded-lg" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                        <div className="text-sm font-medium theme-text mb-3">Registrar Avanço</div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs theme-text-secondary mb-1">Percentual (%)</label>
                            <input
                              type="number"
                              min="0"
                              max={100 - progressoEtapa}
                              step="0.1"
                              value={formData.percentualAvanco}
                              onChange={(e) => setFormData({ ...formData, percentualAvanco: parseFloat(e.target.value) || 0 })}
                              className="w-full px-2 py-1.5 text-sm rounded border theme-text"
                              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs theme-text-secondary mb-1">Tipo de Período</label>
                            <select
                              value={formData.periodoTipo}
                              onChange={(e) => setFormData({ ...formData, periodoTipo: e.target.value as PeriodoTipo })}
                              className="w-full px-2 py-1.5 text-sm rounded border theme-text"
                              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                            >
                              <option value="hora">Hora</option>
                              <option value="dia">Dia</option>
                              <option value="semana">Semana</option>
                              <option value="mes">Mês</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className="block text-xs theme-text-secondary mb-1">Data Início</label>
                            <input
                              type="date"
                              value={formData.periodoInicio}
                              onChange={(e) => setFormData({ ...formData, periodoInicio: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm rounded border theme-text"
                              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                            />
                          </div>
                          <div>
                            <label className="block text-xs theme-text-secondary mb-1">Data Fim</label>
                            <input
                              type="date"
                              value={formData.periodoFim}
                              onChange={(e) => setFormData({ ...formData, periodoFim: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm rounded border theme-text"
                              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="block text-xs theme-text-secondary mb-1">Observações</label>
                          <textarea
                            value={formData.observacoes}
                            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                            rows={2}
                            className="w-full px-2 py-1.5 text-sm rounded border theme-text resize-none"
                            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowAddAvanco(null)}
                            className="px-3 py-1.5 text-sm rounded theme-text-secondary hover:opacity-80 transition-opacity"
                            style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleSaveAvanco}
                            disabled={saving || formData.percentualAvanco <= 0}
                            className="px-3 py-1.5 text-sm rounded text-white hover:opacity-80 transition-opacity disabled:opacity-50"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    )}

                    {showHistorico === etapa.id && avancos.length > 0 && (
                      <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="text-xs font-medium theme-text-secondary mb-2">Histórico de Avanços</div>
                        <div className="space-y-2">
                          {avancos.map((avanco) => (
                            <div
                              key={avanco.id}
                              className="flex items-center justify-between p-2 rounded text-sm"
                              style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(avanco.status)}
                                <div>
                                  <span className="font-medium theme-text">{avanco.percentualAvancado}%</span>
                                  <span className="text-xs theme-text-secondary ml-2">
                                    {format(new Date(avanco.periodoInicio), 'dd/MM', { locale: ptBR })} - {format(new Date(avanco.periodoFim), 'dd/MM/yy', { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  avanco.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                                  avanco.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {getStatusLabel(avanco.status)}
                                </span>
                                {podeAprovar && avanco.status === 'pendente' && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleAprovarAvanco(avanco.id, 'producao')}
                                      className="p-1 rounded hover:bg-green-100 transition-colors"
                                      title="Aprovar"
                                    >
                                      <Check className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => handleRejeitarAvanco(avanco.id, 'producao', 'Rejeitado')}
                                      className="p-1 rounded hover:bg-red-100 transition-colors"
                                      title="Rejeitar"
                                    >
                                      <X className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showHistorico === etapa.id && avancos.length === 0 && (
                      <div className="mt-3 text-center py-3 text-xs theme-text-secondary">
                        Nenhum avanço registrado para esta etapa
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EtapasAvancoPanel;
