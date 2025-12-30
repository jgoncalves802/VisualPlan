/**
 * RestricaoModal - Modal para cadastrar/editar restrição
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  RestricaoLPS,
  TipoRestricao,
  TipoRestricaoDetalhado,
  TipoResponsabilidade,
} from '../../../types/lps';
import { useAuthStore } from '../../../stores/authStore';
import { X, Save, AlertTriangle, Upload, FileText, Image } from 'lucide-react';
import { restricoesLpsService } from '../../../services/restricoesLpsService';
import { parseDateOnly } from '../../../utils/dateHelpers';

interface RestricaoModalProps {
  restricao: RestricaoLPS | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (restricao: Omit<RestricaoLPS, 'id'> | Partial<RestricaoLPS>) => void;
  atividadeId?: string; // ID da atividade relacionada (quando criado a partir de uma atividade)
  onAddEvidencia?: (restricaoId: string, arquivo: File) => void;
  onDeleteEvidencia?: (restricaoId: string, evidenciaId: string) => void;
  onAddAndamento?: (restricaoId: string, descricao: string) => void;
}

export const RestricaoModal: React.FC<RestricaoModalProps> = ({
  restricao,
  isOpen,
  onClose,
  onSave,
  atividadeId,
  onAddEvidencia,
  onDeleteEvidencia,
  onAddAndamento,
}) => {
  const { usuario } = useAuthStore();

  // Helper para converter para Date
  const parseDate = (date: any): Date => {
    try {
      if (!date) return new Date();
      if (date instanceof Date) {
        // Verificar se a Date é válida
        if (isNaN(date.getTime())) {
          return new Date();
        }
        // Verificar se os métodos existem
        if (typeof date.getFullYear !== 'function') {
          return new Date();
        }
        return date;
      }
      if (typeof date === 'string') {
        // Use parseDateOnly for date-only strings (yyyy-MM-dd)
        const localParsed = parseDateOnly(date);
        if (localParsed) return localParsed;
        // Fallback for datetime strings
        const parsed = new Date(date);
        if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
          return new Date();
        }
        return parsed;
      }
      if (typeof date === 'number') {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime()) || typeof parsed.getFullYear !== 'function') {
          return new Date();
        }
        return parsed;
      }
      return new Date();
    } catch (error) {
      // Em caso de qualquer erro, retornar data atual
      return new Date();
    }
  };

  const [formData, setFormData] = useState({
    descricao: '',
    tipo: TipoRestricao.RESTRICAO as TipoRestricao,
    tipo_detalhado: TipoRestricaoDetalhado.METODO as TipoRestricaoDetalhado | undefined,
    tipo_responsabilidade: undefined as TipoResponsabilidade | undefined,
    responsavel: '',
    apoio: '',
    data_conclusao_planejada: new Date(),
    prazo_resolucao: undefined as Date | undefined,
    status: 'PENDENTE' as RestricaoLPS['status'],
    prioridade: 'MEDIA' as 'ALTA' | 'MEDIA' | 'BAIXA',
    observacoes: '',
    categoria: '',
    impacto_previsto: '',
    atividade_id: atividadeId || undefined,
    paralisar_obra: false,
    projeto_id: undefined as string | undefined,
    wbs_id: undefined as string | undefined,
  });

  const [tipoDetalhadoAlterado, setTipoDetalhadoAlterado] = useState(false);

  const [projetos, setProjetos] = useState<{ id: string; nome: string }[]>([]);
  const [wbsNodes, setWbsNodes] = useState<{ id: string; nome: string; codigo: string }[]>([]);
  const [atividades, setAtividades] = useState<{ id: string; nome: string; codigo: string }[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const loadProjetos = useCallback(async () => {
    if (!usuario?.empresaId) return;
    const data = await restricoesLpsService.getProjetos(usuario.empresaId);
    setProjetos(data);
  }, [usuario?.empresaId]);

  const loadWbsNodes = useCallback(async (projetoId: string) => {
    if (!projetoId) {
      setWbsNodes([]);
      return;
    }
    const data = await restricoesLpsService.getWbsNodes(projetoId);
    setWbsNodes(data);
  }, []);

  const loadAtividades = useCallback(async (projetoId: string) => {
    if (!projetoId) {
      setAtividades([]);
      return;
    }
    const data = await restricoesLpsService.getAtividadesByProjeto(projetoId);
    setAtividades(data);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoadingData(true);
      loadProjetos().finally(() => setLoadingData(false));
    }
  }, [isOpen, loadProjetos]);

  useEffect(() => {
    if (formData.projeto_id) {
      loadWbsNodes(formData.projeto_id);
      loadAtividades(formData.projeto_id);
    }
  }, [formData.projeto_id, loadWbsNodes, loadAtividades]);

  useEffect(() => {
    const loadAtividadeData = async () => {
      if (atividadeId && isOpen && !restricao) {
        const atividade = await restricoesLpsService.getAtividadeById(atividadeId);
        if (atividade) {
          setFormData(prev => ({
            ...prev,
            atividade_id: atividade.id,
            projeto_id: atividade.projeto_id,
            wbs_id: atividade.wbs_id || undefined,
          }));
        }
      }
    };
    loadAtividadeData();
  }, [atividadeId, isOpen, restricao]);

  useEffect(() => {
    try {
      if (restricao) {
        // Garantir que as datas sejam válidas
        let dataConclusao = parseDate(restricao.data_conclusao_planejada);
        if (!(dataConclusao instanceof Date) || isNaN(dataConclusao.getTime())) {
          dataConclusao = new Date();
        }
        
        let prazoResolucao: Date | undefined = undefined;
        if (restricao.prazo_resolucao) {
          prazoResolucao = parseDate(restricao.prazo_resolucao);
          if (!(prazoResolucao instanceof Date) || isNaN(prazoResolucao.getTime())) {
            prazoResolucao = undefined;
          }
        }
        
        setFormData({
          descricao: restricao.descricao || '',
          tipo: restricao.tipo || TipoRestricao.RESTRICAO,
          tipo_detalhado: restricao.tipo_detalhado || TipoRestricaoDetalhado.METODO,
          tipo_responsabilidade: restricao.tipo_responsabilidade,
          responsavel: restricao.responsavel || '',
          apoio: restricao.apoio || '',
          data_conclusao_planejada: dataConclusao,
          prazo_resolucao: prazoResolucao,
          status: restricao.status || 'PENDENTE',
          prioridade: restricao.prioridade || 'MEDIA',
          observacoes: restricao.observacoes || '',
          categoria: restricao.categoria || '',
          impacto_previsto: restricao.impacto_previsto || '',
          atividade_id: restricao.atividade_id || atividadeId || undefined,
          paralisar_obra: restricao.paralisar_obra || false,
          projeto_id: restricao.projeto_id || undefined,
          wbs_id: restricao.wbs_id || undefined,
        });
        setTipoDetalhadoAlterado(false);
      } else {
        setFormData({
          descricao: '',
          tipo: TipoRestricao.RESTRICAO,
          tipo_detalhado: TipoRestricaoDetalhado.METODO,
          tipo_responsabilidade: undefined,
          responsavel: '',
          apoio: '',
          data_conclusao_planejada: new Date(),
          prazo_resolucao: undefined,
          status: 'PENDENTE',
          prioridade: 'MEDIA',
          observacoes: '',
          categoria: '',
          impacto_previsto: '',
          atividade_id: atividadeId || undefined,
          paralisar_obra: false,
          projeto_id: undefined,
          wbs_id: undefined,
        });
        setTipoDetalhadoAlterado(false);
      }
    } catch (error) {
      console.error('Erro ao inicializar formData:', error);
      setFormData({
        descricao: '',
        tipo: TipoRestricao.RESTRICAO,
        tipo_detalhado: TipoRestricaoDetalhado.METODO,
        tipo_responsabilidade: undefined,
        responsavel: '',
        apoio: '',
        data_conclusao_planejada: new Date(),
        prazo_resolucao: undefined,
        status: 'PENDENTE',
        prioridade: 'MEDIA',
        observacoes: '',
        categoria: '',
        impacto_previsto: '',
        atividade_id: atividadeId || undefined,
        paralisar_obra: false,
        projeto_id: undefined,
        wbs_id: undefined,
      });
    }
  }, [restricao, isOpen, atividadeId]);

  // Se paralisar_obra for true, aplicar prioridade máxima
  useEffect(() => {
    if (formData.paralisar_obra && !tipoDetalhadoAlterado) {
      setFormData((prev) => ({
        ...prev,
        prioridade: 'ALTA',
      }));
      setTipoDetalhadoAlterado(true);
    }
  }, [formData.paralisar_obra, tipoDetalhadoAlterado]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedAtividade = atividades.find(a => a.id === formData.atividade_id);
    const selectedWbs = wbsNodes.find(w => w.id === formData.wbs_id);
    
    const dataToSave: any = {
      ...formData,
      data_conclusao_planejada: formData.data_conclusao_planejada,
      prazo_resolucao: formData.prazo_resolucao,
      atividade_id: formData.atividade_id,
      atividade_nome: selectedAtividade?.nome,
      wbs_nome: selectedWbs?.nome,
    };

    console.log('[RestricaoModal] handleSubmit - formData:', {
      data_conclusao_planejada: formData.data_conclusao_planejada,
      prazo_resolucao: formData.prazo_resolucao,
      isDate_conclusao: formData.data_conclusao_planejada instanceof Date,
      isDate_prazo: formData.prazo_resolucao instanceof Date,
    });
    console.log('[RestricaoModal] handleSubmit - dataToSave:', dataToSave);

    if (restricao) {
      onSave({
        ...dataToSave,
        id: restricao.id,
      });
    } else {
      onSave({
        ...dataToSave,
        data_criacao: new Date(),
        criado_por: usuario?.id || '',
        criado_por_nome: usuario?.nome || '',
        historico: [],
        evidencias: [],
        andamento: [],
        paralisar_obra: formData.paralisar_obra,
        data_inicio_latencia: formData.paralisar_obra ? new Date() : undefined,
      } as Omit<RestricaoLPS, 'id'>);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {restricao ? 'Editar Restrição' : 'Nova Restrição'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form id="restricao-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows={3}
                required
                placeholder="Descreva a restrição..."
              />
            </div>

            {/* Tipo e Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as TipoRestricao })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value={TipoRestricao.SEM_RESTRICAO}>Sem Restrição (N)</option>
                  <option value={TipoRestricao.RESTRICAO}>Com Restrição (S)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as RestricaoLPS['status'] })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="PENDENTE">Pendente</option>
                  <option value="CONCLUIDA">Concluída</option>
                  <option value="ATRASADA">Atrasada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Tipo Detalhado e Tipo de Responsabilidade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Detalhado <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo_detalhado || ''}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setFormData({
                      ...formData,
                      tipo_detalhado: valor ? (valor as TipoRestricaoDetalhado) : undefined,
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value={TipoRestricaoDetalhado.MATERIAL}>Material</option>
                  <option value={TipoRestricaoDetalhado.MAO_DE_OBRA}>Mão de Obra</option>
                  <option value={TipoRestricaoDetalhado.MAQUINA}>Máquina/Equipamento</option>
                  <option value={TipoRestricaoDetalhado.METODO}>Método</option>
                  <option value={TipoRestricaoDetalhado.MEIO_AMBIENTE}>Meio Ambiente</option>
                  <option value={TipoRestricaoDetalhado.MEDIDA}>Medida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Responsabilidade <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tipo_responsabilidade || ''}
                  onChange={(e) => {
                    const valor = e.target.value;
                    setFormData({
                      ...formData,
                      tipo_responsabilidade: valor ? (valor as TipoResponsabilidade) : undefined,
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value={TipoResponsabilidade.PREPONENTE}>Preponente</option>
                  <option value={TipoResponsabilidade.FISCALIZACAO}>Fiscalização</option>
                  <option value={TipoResponsabilidade.CONTRATADA}>Contratada</option>
                </select>
              </div>
            </div>

            {/* Paralisar Obra */}
            <div className="p-3 border border-gray-200 rounded bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paralisar_obra}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData({
                      ...formData,
                      paralisar_obra: checked,
                      prioridade: checked ? 'ALTA' : formData.prioridade,
                    });
                    setTipoDetalhadoAlterado(false);
                  }}
                  className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <span className="font-medium text-gray-900">Paralisar Obra</span>
                  <p className="text-sm text-gray-500">
                    Restrição crítica que paralisa a execução da obra
                  </p>
                </div>
              </label>
              {formData.paralisar_obra && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>
                    Prioridade máxima ativada. A latência do cronograma será contada a partir de agora.
                  </span>
                </div>
              )}
            </div>

            {/* Projeto, WBS e Atividade */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Projeto</label>
                <select
                  value={formData.projeto_id || ''}
                  onChange={(e) => {
                    const projetoId = e.target.value || undefined;
                    setFormData({
                      ...formData,
                      projeto_id: projetoId,
                      wbs_id: undefined,
                      atividade_id: undefined,
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={loadingData || !!atividadeId}
                >
                  <option value="">Selecione...</option>
                  {projetos.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WBS</label>
                <select
                  value={formData.wbs_id || ''}
                  onChange={(e) => setFormData({ ...formData, wbs_id: e.target.value || undefined })}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={!formData.projeto_id}
                >
                  <option value="">Selecione...</option>
                  {wbsNodes.map((w) => (
                    <option key={w.id} value={w.id}>{w.codigo} - {w.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atividade</label>
                <select
                  value={formData.atividade_id || ''}
                  onChange={(e) => setFormData({ ...formData, atividade_id: e.target.value || undefined })}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={!formData.projeto_id || !!atividadeId}
                >
                  <option value="">Selecione...</option>
                  {atividades.map((a) => (
                    <option key={a.id} value={a.id}>{a.codigo} - {a.nome}</option>
                  ))}
                </select>
                {atividadeId && (
                  <p className="text-xs text-gray-500 mt-1">Atividade pré-selecionada</p>
                )}
              </div>
            </div>

            {/* Prioridade e Categoria */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={formData.prioridade}
                  onChange={(e) =>
                    setFormData({ ...formData, prioridade: e.target.value as 'ALTA' | 'MEDIA' | 'BAIXA' })
                  }
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={formData.paralisar_obra}
                >
                  <option value="BAIXA">Baixa</option>
                  <option value="MEDIA">Média</option>
                  <option value="ALTA">Alta</option>
                </select>
                {formData.paralisar_obra && (
                  <p className="text-xs text-gray-500 mt-1">Bloqueado: Paralisar Obra ativo</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <input
                  type="text"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Ex: Operacional, Segurança..."
                />
              </div>
            </div>

            {/* Responsável e Apoio */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input
                  type="text"
                  value={formData.responsavel}
                  onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Nome do responsável"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apoio</label>
                <input
                  type="text"
                  value={formData.apoio}
                  onChange={(e) => setFormData({ ...formData, apoio: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                  placeholder="Nome do apoio"
                />
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Conclusão Planejada <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={(() => {
                    try {
                      let data: Date;
                      if (!formData.data_conclusao_planejada) {
                        data = new Date();
                      } else {
                        data = parseDate(formData.data_conclusao_planejada);
                      }
                      // Verificação final
                      if (!(data instanceof Date) || isNaN(data.getTime()) || typeof data.getFullYear !== 'function') {
                        data = new Date();
                      }
                      return formatDateForInput(data);
                    } catch (error) {
                      return formatDateForInput(new Date());
                    }
                  })()}
                  onChange={(e) => {
                    try {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const novaData = new Date(year, month - 1, day, 12, 0, 0);
                        if (!isNaN(novaData.getTime()) && typeof novaData.getFullYear === 'function') {
                          setFormData({
                            ...formData,
                            data_conclusao_planejada: novaData,
                          });
                        }
                      } else {
                        setFormData({
                          ...formData,
                          data_conclusao_planejada: new Date(),
                        });
                      }
                    } catch (error) {
                      // Ignorar erro, manter valor anterior
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prazo de Resolução (definido pelo responsável)
                </label>
                <input
                  type="date"
                  value={(() => {
                    try {
                      if (!formData.prazo_resolucao) {
                        return '';
                      }
                      let data = parseDate(formData.prazo_resolucao);
                      // Verificação final
                      if (!(data instanceof Date) || isNaN(data.getTime()) || typeof data.getFullYear !== 'function') {
                        return '';
                      }
                      return formatDateForInput(data);
                    } catch (error) {
                      return '';
                    }
                  })()}
                  onChange={(e) => {
                    try {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-').map(Number);
                        const novaData = new Date(year, month - 1, day, 12, 0, 0);
                        if (!isNaN(novaData.getTime()) && typeof novaData.getFullYear === 'function') {
                          setFormData({
                            ...formData,
                            prazo_resolucao: novaData,
                          });
                        }
                      } else {
                        setFormData({
                          ...formData,
                          prazo_resolucao: undefined,
                        });
                      }
                    } catch (error) {
                      // Ignorar erro, manter valor anterior
                    }
                  }}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            {/* Informação sobre criador (apenas visualização se editando) */}
            {restricao && restricao.criado_por_nome && (
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Criado por:</span> {restricao.criado_por_nome}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Apenas o criador pode marcar esta restrição como concluída.
                </p>
              </div>
            )}

            {/* Impacto Previsto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impacto Previsto (se não concluída)
              </label>
              <textarea
                value={formData.impacto_previsto}
                onChange={(e) => setFormData({ ...formData, impacto_previsto: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows={2}
                placeholder="Descreva o impacto esperado se esta restrição não for concluída..."
              />
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded resize-none"
                rows={3}
                placeholder="Observações adicionais..."
              />
            </div>

            {/* Seção de Andamento (apenas para edição) */}
            {restricao && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Andamento e Evidências</h3>
                
                {/* Campo de Andamento */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registrar Andamento
                  </label>
                  <textarea
                    id={`andamento-text-${restricao.id}`}
                    className="w-full p-2 border border-gray-300 rounded resize-none"
                    rows={3}
                    placeholder="Descreva o andamento da restrição..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const andamentoText = (document.getElementById(`andamento-text-${restricao.id}`) as HTMLTextAreaElement)?.value;
                      if (andamentoText && andamentoText.trim() && onAddAndamento && restricao.id) {
                        onAddAndamento(restricao.id, andamentoText.trim());
                        (document.getElementById(`andamento-text-${restricao.id}`) as HTMLTextAreaElement).value = '';
                      }
                    }}
                    className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm"
                  >
                    Adicionar Andamento
                  </button>
                </div>

                {/* Lista de Andamentos (se houver) */}
                {restricao.andamento && restricao.andamento.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Histórico de Andamento:</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {restricao.andamento
                        .sort((a, b) => {
                          const dataA = a.data instanceof Date ? a.data.getTime() : new Date(a.data).getTime();
                          const dataB = b.data instanceof Date ? b.data.getTime() : new Date(b.data).getTime();
                          return dataB - dataA;
                        })
                        .map((andamento) => (
                          <div
                            key={andamento.id}
                            className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-500">
                                {andamento.data instanceof Date
                                  ? andamento.data.toLocaleDateString('pt-BR')
                                  : new Date(andamento.data).toLocaleDateString('pt-BR')}
                              </span>
                              {andamento.responsavel && (
                                <span className="text-xs text-gray-500">{andamento.responsavel}</span>
                              )}
                            </div>
                            <p className="text-gray-700">{andamento.descricao}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Upload de Evidências */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidências (PDFs e Fotos)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Arraste arquivos aqui ou clique para selecionar
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          const filesArray = Array.from(files);
                          filesArray.forEach((file) => {
                            if (onAddEvidencia && restricao.id) {
                              onAddEvidencia(restricao.id, file);
                            }
                          });
                        }
                      }}
                      className="hidden"
                      id={`evidencia-upload-${restricao.id}`}
                    />
                    <label
                      htmlFor={`evidencia-upload-${restricao.id}`}
                      className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors cursor-pointer text-sm"
                    >
                      Selecionar Arquivos
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos aceitos: PDF, JPG, PNG, GIF (máx. 10MB por arquivo)
                    </p>
                  </div>

                  {/* Lista de Evidências (se houver) */}
                  {restricao.evidencias && restricao.evidencias.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Evidências Anexadas:</p>
                      {restricao.evidencias.map((evidencia) => (
                        <div
                          key={evidencia.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            {evidencia.tipo_arquivo === 'PDF' ? (
                              <FileText size={16} className="text-red-600" />
                            ) : (
                              <Image size={16} className="text-blue-600" />
                            )}
                            <span className="text-sm text-gray-700">{evidencia.nome_arquivo}</span>
                            {evidencia.tamanho && (
                              <span className="text-xs text-gray-500">
                                ({(evidencia.tamanho / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={evidencia.url_arquivo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Ver
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Deseja realmente excluir esta evidência?') && onDeleteEvidencia && restricao.id) {
                                  onDeleteEvidencia(restricao.id, evidencia.id);
                                }
                              }}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="restricao-form"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper para formatar data para input
function formatDateForInput(date: any): string {
  // Converter para Date se necessário
  let dateObj: Date;
  
  try {
    if (!date) {
      dateObj = new Date();
    } else if (date instanceof Date) {
      // Verificar se a Date é válida
      if (isNaN(date.getTime())) {
        dateObj = new Date();
      } else {
        dateObj = date;
      }
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
    } else if (typeof date === 'number') {
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }
    } else {
      dateObj = new Date();
    }
    
    // Verificação final de segurança
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
  } catch (error) {
    // Em caso de qualquer erro, usar data atual
    dateObj = new Date();
  }

  // Verificação final antes de usar métodos da Date
  if (typeof dateObj.getFullYear !== 'function') {
    dateObj = new Date();
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

