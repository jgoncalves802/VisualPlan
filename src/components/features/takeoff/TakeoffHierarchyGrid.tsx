import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  Eye,
  X,
} from 'lucide-react';
import { useTakeoffStore } from '../../../stores/takeoffStore';
import { takeoffItemEtapasService } from '../../../services/takeoffItemEtapasService';
import { criteriosMedicaoService } from '../../../services/criteriosMedicaoService';
import type { TakeoffItem } from '../../../types/takeoff.types';
import type { TakeoffItemEtapa, CriterioMedicaoEtapa, CriterioMedicao } from '../../../types/criteriosMedicao.types';

interface TakeoffHierarchyGridProps {
  mapaId: string;
  onBatchUpdate?: () => void;
}

interface EtapaExtendida extends TakeoffItemEtapa {
  etapa: CriterioMedicaoEtapa;
  dataInicio?: Date;
  dataTermino?: Date;
  dataAvanco?: Date;
  dataAprovacao?: Date;
  usuarioAvanco?: { id: string; nome: string };
  usuarioAprovacao?: { id: string; nome: string };
}

interface ItemComEtapasState {
  item: TakeoffItem;
  criterio?: CriterioMedicao;
  etapas: EtapaExtendida[];
  percentualConcluido: number;
  isExpanded: boolean;
}

interface ApprovalModalData {
  etapas: EtapaExtendida[];
  selectedEtapaId?: string;
  item: TakeoffItem;
  criterio?: CriterioMedicao;
}

interface ColumnFilter {
  field: string;
  value: string;
}

const TakeoffHierarchyGrid: React.FC<TakeoffHierarchyGridProps> = ({
  mapaId,
  onBatchUpdate,
}) => {
  const { itens, isLoadingItens, loadItens } = useTakeoffStore();

  const [itemsComEtapas, setItemsComEtapas] = useState<ItemComEtapasState[]>([]);
  const [isLoadingEtapas, setIsLoadingEtapas] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [selectedEtapaIds, setSelectedEtapaIds] = useState<Set<string>>(new Set());
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [etapasError, setEtapasError] = useState<string | null>(null);
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData | null>(null);

  useEffect(() => {
    loadItens({ mapaId });
  }, [mapaId, loadItens]);

  useEffect(() => {
    const loadItemsComEtapas = async () => {
      if (itens.length === 0) {
        setItemsComEtapas([]);
        return;
      }

      setIsLoadingEtapas(true);
      try {
        const itemIds = itens.map((i) => i.id);
        const supabase = (await import('../../../services/supabase')).supabase;
        
        let vinculos: { item_id: string; criterio_id: string }[] = [];
        let etapasItem: { 
          id: string; 
          item_id: string; 
          etapa_id: string; 
          concluido: boolean; 
          data_conclusao?: string; 
          updated_at?: string;
          data_inicio?: string;
          data_termino?: string;
          data_avanco?: string;
          data_aprovacao?: string;
          usuario_avanco_id?: string;
          usuario_aprovacao_id?: string;
        }[] = [];
        
        if (itemIds.length > 0) {
          const BATCH_SIZE = 50;
          
          for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
            const batchIds = itemIds.slice(i, i + BATCH_SIZE);
            
            const [vinculosResult, etapasItemResult] = await Promise.all([
              supabase.from('item_criterio_medicao').select('item_id, criterio_id').in('item_id', batchIds),
              supabase.from('takeoff_item_etapas').select('*').in('item_id', batchIds),
            ]);

            if (vinculosResult.error) {
              console.error('Erro ao carregar vínculos:', vinculosResult.error);
            } else {
              vinculos = vinculos.concat(vinculosResult.data || []);
            }
            
            if (etapasItemResult.error) {
              const errorMsg = etapasItemResult.error.message || 'Erro ao carregar etapas';
              if (errorMsg.includes('does not exist') || etapasItemResult.error.code === '42P01') {
                setEtapasError('Tabela de etapas não encontrada. Execute a migration SQL.');
              } else {
                console.error('Erro ao carregar etapas dos itens:', etapasItemResult.error);
              }
            } else {
              setEtapasError(null);
              etapasItem = etapasItem.concat(etapasItemResult.data || []);
            }
          }
        } else {
          setEtapasError(null);
        }

        const vinculoMap = new Map<string, string>();
        const criterioIds = new Set<string>();
        for (const v of vinculos) {
          vinculoMap.set(v.item_id, v.criterio_id);
          criterioIds.add(v.criterio_id);
        }

        const etapasItemMap = new Map<string, Map<string, { 
          concluido: boolean; 
          id: string; 
          dataConclusao?: Date; 
          updatedAt?: Date;
          dataInicio?: Date;
          dataTermino?: Date;
          dataAvanco?: Date;
          dataAprovacao?: Date;
          usuarioAvancoId?: string;
          usuarioAprovacaoId?: string;
        }>>();
        for (const e of etapasItem) {
          if (!etapasItemMap.has(e.item_id)) {
            etapasItemMap.set(e.item_id, new Map());
          }
          etapasItemMap.get(e.item_id)!.set(e.etapa_id, { 
            concluido: e.concluido, 
            id: e.id,
            dataConclusao: e.data_conclusao ? new Date(e.data_conclusao) : undefined,
            updatedAt: e.updated_at ? new Date(e.updated_at) : undefined,
            dataInicio: e.data_inicio ? new Date(e.data_inicio) : undefined,
            dataTermino: e.data_termino ? new Date(e.data_termino) : undefined,
            dataAvanco: e.data_avanco ? new Date(e.data_avanco) : undefined,
            dataAprovacao: e.data_aprovacao ? new Date(e.data_aprovacao) : undefined,
            usuarioAvancoId: e.usuario_avanco_id,
            usuarioAprovacaoId: e.usuario_aprovacao_id,
          });
        }

        let criteriosMap = new Map<string, CriterioMedicao>();
        let etapasCriterioMap = new Map<string, CriterioMedicaoEtapa[]>();
        
        const allUserIds = new Set<string>();
        for (const e of etapasItem) {
          if (e.usuario_avanco_id) allUserIds.add(e.usuario_avanco_id);
          if (e.usuario_aprovacao_id) allUserIds.add(e.usuario_aprovacao_id);
        }

        let usersMap = new Map<string, string>();
        if (allUserIds.size > 0) {
          const { data: usersData } = await supabase
            .from('usuarios')
            .select('id, nome')
            .in('id', Array.from(allUserIds));
          
          for (const u of usersData || []) {
            usersMap.set(u.id, u.nome);
          }
        }

        if (criterioIds.size > 0) {
          const criterioIdArray = Array.from(criterioIds);
          const [criteriosResult, etapasCriterioResult] = await Promise.all([
            criteriosMedicaoService.getCriterios({}),
            supabase.from('criterios_medicao_etapas').select('*').in('criterio_id', criterioIdArray).order('ordem', { ascending: true }),
          ]);

          for (const c of criteriosResult) {
            if (criterioIds.has(c.id)) {
              criteriosMap.set(c.id, c);
            }
          }

          for (const e of etapasCriterioResult.data || []) {
            if (!etapasCriterioMap.has(e.criterio_id)) {
              etapasCriterioMap.set(e.criterio_id, []);
            }
            etapasCriterioMap.get(e.criterio_id)!.push({
              id: e.id,
              criterioId: e.criterio_id,
              numeroEtapa: e.numero_etapa,
              descritivo: e.descritivo,
              descritivoDocumento: e.descritivo_documento,
              percentual: Number(e.percentual) || 0,
              ordem: e.ordem,
              createdAt: new Date(e.created_at),
              updatedAt: new Date(e.updated_at),
            });
          }
        }

        const result: ItemComEtapasState[] = itens.map((item) => {
          const criterioId = vinculoMap.get(item.id);
          const criterio = criterioId ? criteriosMap.get(criterioId) : undefined;
          const etapasCriterio = criterioId ? etapasCriterioMap.get(criterioId) || [] : [];
          const itemEtapasStatus = etapasItemMap.get(item.id) || new Map();

          const etapas = etapasCriterio.map((etapa) => {
            const status = itemEtapasStatus.get(etapa.id);
            return {
              id: status?.id || '',
              itemId: item.id,
              etapaId: etapa.id,
              concluido: status?.concluido || false,
              dataConclusao: status?.dataConclusao,
              createdAt: new Date(),
              updatedAt: status?.updatedAt || new Date(),
              dataInicio: status?.dataInicio,
              dataTermino: status?.dataTermino,
              dataAvanco: status?.dataAvanco,
              dataAprovacao: status?.dataAprovacao,
              usuarioAvanco: status?.usuarioAvancoId ? { id: status.usuarioAvancoId, nome: usersMap.get(status.usuarioAvancoId) || 'Usuário' } : undefined,
              usuarioAprovacao: status?.usuarioAprovacaoId ? { id: status.usuarioAprovacaoId, nome: usersMap.get(status.usuarioAprovacaoId) || 'Usuário' } : undefined,
              etapa,
            };
          });

          const totalPercentual = etapas.reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);
          const percentualDone = etapas
            .filter((e) => e.concluido)
            .reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);
          const percentualConcluido = totalPercentual > 0 ? Math.round((percentualDone / totalPercentual) * 100) : 0;

          return {
            item,
            criterio,
            etapas,
            percentualConcluido,
            isExpanded: false,
          };
        });

        setItemsComEtapas(result);
      } catch (error) {
        console.error('Erro ao carregar itens com etapas:', error);
        setItemsComEtapas(itens.map((item) => ({
          item,
          criterio: undefined,
          etapas: [],
          percentualConcluido: 0,
          isExpanded: false,
        })));
      } finally {
        setIsLoadingEtapas(false);
      }
    };

    loadItemsComEtapas();
  }, [itens]);

  const filteredItems = useMemo(() => {
    if (columnFilters.length === 0) return itemsComEtapas;

    return itemsComEtapas.filter((itemState) => {
      return columnFilters.every((filter) => {
        if (filter.field === 'criterio') {
          const criterioValue = itemState.criterio?.codigo || itemState.criterio?.descritivo || '';
          if (!criterioValue) return filter.value === '';
          return criterioValue.toLowerCase().includes(filter.value.toLowerCase());
        }
        
        const value = itemState.item[filter.field as keyof TakeoffItem];
        if (value === undefined || value === null) return filter.value === '';
        return String(value).toLowerCase().includes(filter.value.toLowerCase());
      });
    });
  }, [itemsComEtapas, columnFilters]);

  const toggleExpand = (itemId: string) => {
    setItemsComEtapas((prev) =>
      prev.map((i) =>
        i.item.id === itemId ? { ...i, isExpanded: !i.isExpanded } : i
      )
    );
  };

  const toggleSelectItem = (itemId: string) => {
    const itemState = itemsComEtapas.find((i) => i.item.id === itemId);
    const isCurrentlySelected = selectedItemIds.has(itemId);
    
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlySelected) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    if (itemState) {
      setSelectedEtapaIds((prev) => {
        const newSet = new Set(prev);
        
        itemState.etapas.forEach((e) => {
          const key = `${itemId}|${e.etapaId}`;
          if (isCurrentlySelected) {
            newSet.delete(key);
          } else {
            newSet.add(key);
          }
        });
        
        return newSet;
      });
    }
  };

  const toggleSelectEtapa = (etapaKey: string) => {
    setSelectedEtapaIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(etapaKey)) {
        newSet.delete(etapaKey);
      } else {
        newSet.add(etapaKey);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
      setSelectedEtapaIds(new Set());
    } else {
      const allItemIds = new Set(filteredItems.map((i) => i.item.id));
      const allEtapaKeys = new Set<string>();
      
      filteredItems.forEach((itemState) => {
        itemState.etapas.forEach((e) => {
          allEtapaKeys.add(`${itemState.item.id}|${e.etapaId}`);
        });
      });
      
      setSelectedItemIds(allItemIds);
      setSelectedEtapaIds(allEtapaKeys);
    }
  };

  const handleToggleEtapa = useCallback(async (itemId: string, etapaId: string) => {
    setIsUpdating(true);
    try {
      await takeoffItemEtapasService.toggleEtapa(itemId, etapaId);
      await takeoffItemEtapasService.atualizarPercentualItem(itemId);

      setItemsComEtapas((prev) =>
        prev.map((itemState) => {
          if (itemState.item.id !== itemId) return itemState;

          const updatedEtapas = itemState.etapas.map((e) =>
            e.etapaId === etapaId ? { ...e, concluido: !e.concluido } : e
          );

          const totalPercentual = updatedEtapas.reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);
          const percentualDone = updatedEtapas
            .filter((e) => e.concluido)
            .reduce((sum, e) => sum + (e.etapa?.percentual || 0), 0);
          const percentualConcluido = totalPercentual > 0 ? Math.round((percentualDone / totalPercentual) * 100) : 0;

          return { ...itemState, etapas: updatedEtapas, percentualConcluido };
        })
      );
    } catch (error) {
      console.error('Erro ao toggle etapa:', error);
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const handleMarcarEtapaSelecionadas = async (concluido: boolean) => {
    if (selectedEtapaIds.size === 0) return;

    setIsUpdating(true);
    try {
      const updates: Array<{ itemId: string; etapaId: string; concluido: boolean }> = [];
      
      selectedEtapaIds.forEach((key) => {
        const [itemId, etapaId] = key.split('|');
        updates.push({ itemId, etapaId, concluido });
      });

      await takeoffItemEtapasService.marcarEtapasPorIdEmLote(updates);

      const itemIdsToUpdate = new Set(updates.map((u) => u.itemId));
      for (const itemId of itemIdsToUpdate) {
        await takeoffItemEtapasService.atualizarPercentualItem(itemId);
      }

      loadItens({ mapaId });
      setSelectedEtapaIds(new Set());
      onBatchUpdate?.();
    } catch (error) {
      console.error('Erro ao marcar etapas em lote:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setColumnFilters((prev) => {
      const existing = prev.find((f) => f.field === field);
      if (existing) {
        if (value === '') {
          return prev.filter((f) => f.field !== field);
        }
        return prev.map((f) => (f.field === field ? { ...f, value } : f));
      }
      if (value === '') return prev;
      return [...prev, { field, value }];
    });
  };

  const getFilterValue = (field: string): string => {
    return columnFilters.find((f) => f.field === field)?.value || '';
  };

  const columns = [
    { key: 'area', label: 'Área', width: 80 },
    { key: 'tag', label: 'TAG', width: 100 },
    { key: 'descricao', label: 'Descrição', width: 250 },
    { key: 'unidade', label: 'Und.', width: 60 },
    { key: 'qtdPrevista', label: 'Qtd Prev.', width: 90, type: 'number' },
  ];

  if (isLoadingItens || isLoadingEtapas) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" style={{ color: 'var(--color-primary)' }} />
        <span className="theme-text">Carregando itens...</span>
      </div>
    );
  }

  if (etapasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="p-4 rounded-lg bg-yellow-100 border border-yellow-300 text-yellow-800 max-w-md text-center">
          <p className="font-medium mb-2">Configuração Pendente</p>
          <p className="text-sm">{etapasError}</p>
          <p className="text-xs mt-2 opacity-75">Execute o arquivo sql/takeoff_item_etapas_migration.sql no banco de dados Supabase.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showFilters ? 'bg-primary text-white' : 'theme-text hover:opacity-80'
            }`}
            style={!showFilters ? { backgroundColor: 'var(--color-surface-secondary)' } : {}}
          >
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          {columnFilters.length > 0 && (
            <button
              onClick={() => setColumnFilters([])}
              className="text-xs px-2 py-1 rounded theme-text hover:opacity-80"
              style={{ backgroundColor: 'var(--color-surface-secondary)' }}
            >
              Limpar ({columnFilters.length})
            </button>
          )}
        </div>

        {(selectedItemIds.size > 0 || selectedEtapaIds.size > 0) && (
          <div className="flex items-center gap-2">
            {selectedEtapaIds.size > 0 && (
              <>
                <button
                  onClick={() => handleMarcarEtapaSelecionadas(true)}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir ({selectedEtapaIds.size})
                </button>
                <button
                  onClick={() => handleMarcarEtapaSelecionadas(false)}
                  disabled={isUpdating}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg theme-text hover:opacity-80"
                  style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                >
                  <Circle className="w-4 h-4" />
                  Desfazer
                </button>
              </>
            )}
            <span className="text-xs theme-text-secondary">
              {selectedItemIds.size} itens | {selectedEtapaIds.size} etapas
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-surface)' }}>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="p-2 text-left w-8">
                <button onClick={toggleSelectAll} className="theme-text hover:opacity-80">
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-2 text-left w-8"></th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2 text-left font-medium theme-text"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="p-2 text-left font-medium theme-text" style={{ width: 120 }}>
                Critério
              </th>
              <th className="p-2 text-left font-medium theme-text" style={{ width: 100 }}>
                % Concluído
              </th>
              <th className="p-2 text-center font-medium theme-text" style={{ width: 85 }}>
                Início
              </th>
              <th className="p-2 text-center font-medium theme-text" style={{ width: 85 }}>
                Término
              </th>
              <th className="p-2 text-center font-medium theme-text" style={{ width: 85 }}>
                Avanço
              </th>
              <th className="p-2 text-center font-medium theme-text" style={{ width: 85 }}>
                Aprovação
              </th>
              <th className="p-2 text-center font-medium theme-text" style={{ width: 60 }}>
                Ação
              </th>
            </tr>
            {showFilters && (
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <th className="p-1"></th>
                <th className="p-1"></th>
                {columns.map((col) => (
                  <th key={`filter-${col.key}`} className="p-1">
                    <input
                      type="text"
                      value={getFilterValue(col.key)}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      placeholder={`Filtrar ${col.label}`}
                      className="w-full px-2 py-1 text-xs rounded theme-text"
                      style={{
                        backgroundColor: 'var(--color-surface-secondary)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </th>
                ))}
                <th className="p-1">
                  <input
                    type="text"
                    value={getFilterValue('criterio')}
                    onChange={(e) => handleFilterChange('criterio', e.target.value)}
                    placeholder="Filtrar Critério"
                    className="w-full px-2 py-1 text-xs rounded theme-text"
                    style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      border: '1px solid var(--color-border)',
                    }}
                  />
                </th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
                <th className="p-1"></th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 9} className="p-8 text-center theme-text-secondary">
                  Nenhum item encontrado
                </td>
              </tr>
            ) : (
              filteredItems.map((itemState) => (
                <React.Fragment key={itemState.item.id}>
                  <tr
                    className="hover:opacity-90 cursor-pointer"
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      backgroundColor: selectedItemIds.has(itemState.item.id)
                        ? 'var(--color-primary-light)'
                        : 'var(--color-surface)',
                    }}
                  >
                    <td className="p-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectItem(itemState.item.id);
                        }}
                        className="theme-text hover:opacity-80"
                      >
                        {selectedItemIds.has(itemState.item.id) ? (
                          <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-2">
                      {itemState.etapas.length > 0 && (
                        <button
                          onClick={() => toggleExpand(itemState.item.id)}
                          className="theme-text hover:opacity-80"
                        >
                          {itemState.isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="p-2 theme-text"
                        onClick={() => toggleExpand(itemState.item.id)}
                      >
                        {col.type === 'number'
                          ? (itemState.item[col.key as keyof TakeoffItem] as number)?.toLocaleString('pt-BR')
                          : (itemState.item[col.key as keyof TakeoffItem] as string) || '-'}
                      </td>
                    ))}
                    <td className="p-2 theme-text" onClick={() => toggleExpand(itemState.item.id)}>
                      {itemState.criterio?.codigo || '-'}
                    </td>
                    <td className="p-2" onClick={() => toggleExpand(itemState.item.id)}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className={`h-full rounded-full transition-all ${
                              itemState.percentualConcluido >= 100
                                ? 'bg-green-500'
                                : itemState.percentualConcluido > 0
                                ? 'bg-blue-500'
                                : ''
                            }`}
                            style={{ width: `${itemState.percentualConcluido}%` }}
                          />
                        </div>
                        <span className="text-xs w-10 text-right theme-text">
                          {itemState.percentualConcluido}%
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center theme-text-secondary text-xs" onClick={() => toggleExpand(itemState.item.id)}>
                      {(() => {
                        const datas = itemState.etapas.filter(e => e.dataInicio).map(e => e.dataInicio!.getTime());
                        if (datas.length === 0) return '-';
                        return new Date(Math.min(...datas)).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="p-2 text-center theme-text-secondary text-xs" onClick={() => toggleExpand(itemState.item.id)}>
                      {(() => {
                        const datas = itemState.etapas.filter(e => e.dataTermino).map(e => e.dataTermino!.getTime());
                        if (datas.length === 0) return '-';
                        return new Date(Math.max(...datas)).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="p-2 text-center theme-text-secondary text-xs" onClick={() => toggleExpand(itemState.item.id)}>
                      {(() => {
                        const datas = itemState.etapas.filter(e => e.dataAvanco).map(e => e.dataAvanco!.getTime());
                        if (datas.length === 0) return '-';
                        return new Date(Math.max(...datas)).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="p-2 text-center theme-text-secondary text-xs" onClick={() => toggleExpand(itemState.item.id)}>
                      {(() => {
                        const datas = itemState.etapas.filter(e => e.dataAprovacao).map(e => e.dataAprovacao!.getTime());
                        if (datas.length === 0) return '-';
                        return new Date(Math.max(...datas)).toLocaleDateString('pt-BR');
                      })()}
                    </td>
                    <td className="p-2 text-center">
                      {itemState.etapas.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setApprovalModal({
                              etapas: itemState.etapas,
                              item: itemState.item,
                              criterio: itemState.criterio,
                            });
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title="Ver fluxo de aprovação"
                        >
                          <Eye className="w-4 h-4 theme-text-secondary" />
                        </button>
                      )}
                    </td>
                  </tr>
                  {itemState.isExpanded && itemState.etapas.length > 0 && (
                    <>
                      {itemState.etapas.map((etapaState) => {
                        const etapaKey = `${itemState.item.id}|${etapaState.etapaId}`;
                        return (
                          <tr
                            key={etapaKey}
                            className="hover:opacity-90"
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                              backgroundColor: selectedEtapaIds.has(etapaKey)
                                ? 'var(--color-primary-light)'
                                : 'var(--color-surface-secondary)',
                            }}
                          >
                            <td className="p-2 pl-4">
                              <button
                                onClick={() => toggleSelectEtapa(etapaKey)}
                                className="theme-text hover:opacity-80"
                              >
                                {selectedEtapaIds.has(etapaKey) ? (
                                  <CheckSquare className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="p-2">
                              <div className="w-4 h-4 border-l-2 border-b-2 ml-1" style={{ borderColor: 'var(--color-border)' }} />
                            </td>
                            <td colSpan={columns.length - 1} className="p-2 theme-text">
                              <div className="flex items-center gap-2">
                                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-border)' }}>
                                  Etapa {etapaState.etapa?.numeroEtapa}
                                </span>
                                <span>{etapaState.etapa?.descritivo}</span>
                              </div>
                            </td>
                            <td className="p-2 text-right theme-text-secondary text-xs">
                              {etapaState.etapa?.percentual}%
                            </td>
                            <td className="p-2 text-center theme-text-secondary text-xs">
                              {etapaState.dataInicio?.toLocaleDateString('pt-BR') || '-'}
                            </td>
                            <td className="p-2 text-center theme-text-secondary text-xs">
                              {etapaState.dataTermino?.toLocaleDateString('pt-BR') || '-'}
                            </td>
                            <td className="p-2 text-center theme-text-secondary text-xs">
                              {etapaState.dataAvanco?.toLocaleDateString('pt-BR') || '-'}
                            </td>
                            <td className="p-2 text-center theme-text-secondary text-xs">
                              {etapaState.dataAprovacao?.toLocaleDateString('pt-BR') || '-'}
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleEtapa(itemState.item.id, etapaState.etapaId)}
                                  disabled={isUpdating}
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                                    etapaState.concluido
                                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  }`}
                                >
                                  {etapaState.concluido ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      Concluída
                                    </>
                                  ) : (
                                    <>
                                      <Circle className="w-3 h-3" />
                                      Pendente
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => setApprovalModal({
                                    etapas: itemState.etapas,
                                    selectedEtapaId: etapaState.etapaId,
                                    item: itemState.item,
                                    criterio: itemState.criterio,
                                  })}
                                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  title="Ver fluxo de aprovação"
                                >
                                  <Eye className="w-3 h-3 theme-text-secondary" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {approvalModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setApprovalModal(null)}
        >
          <div 
            className="rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h3 className="text-lg font-semibold theme-text">
                Fluxo de Aprovação
              </h3>
              <button
                onClick={() => setApprovalModal(null)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 theme-text" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
                <p className="text-xs theme-text-secondary mb-1">Item</p>
                <p className="font-medium theme-text">{approvalModal.item.tag}</p>
                <p className="text-sm theme-text-secondary">{approvalModal.item.descricao}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium theme-text">Histórico de Aprovação por Etapa</h4>
                
                {approvalModal.etapas.map((etapa) => (
                  <div 
                    key={etapa.etapaId} 
                    className={`p-3 rounded-lg border ${
                      approvalModal.selectedEtapaId === etapa.etapaId 
                        ? 'border-blue-500' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: 'var(--color-surface-secondary)',
                      borderColor: approvalModal.selectedEtapaId !== etapa.etapaId ? 'var(--color-border)' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded mr-2" style={{ backgroundColor: 'var(--color-border)' }}>
                          Etapa {etapa.etapa?.numeroEtapa}
                        </span>
                        <span className="text-sm font-medium theme-text">{etapa.etapa?.descritivo}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        etapa.concluido 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {etapa.concluido ? 'Concluída' : 'Pendente'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <p className="theme-text-secondary">Início (Produção)</p>
                        <p className={`font-medium ${etapa.dataInicio ? 'text-blue-600' : 'theme-text-secondary'}`}>
                          {etapa.dataInicio?.toLocaleDateString('pt-BR') || '-'}
                        </p>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <p className="theme-text-secondary">Término (Produção)</p>
                        <p className={`font-medium ${etapa.dataTermino ? 'text-blue-600' : 'theme-text-secondary'}`}>
                          {etapa.dataTermino?.toLocaleDateString('pt-BR') || '-'}
                        </p>
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <p className="theme-text-secondary">Avanço (Planejamento)</p>
                        <p className={`font-medium ${etapa.dataAvanco ? 'text-green-600' : 'theme-text-secondary'}`}>
                          {etapa.dataAvanco?.toLocaleDateString('pt-BR') || '-'}
                        </p>
                        {etapa.usuarioAvanco && (
                          <p className="theme-text-secondary text-[10px]">Por: {etapa.usuarioAvanco.nome}</p>
                        )}
                      </div>
                      <div className="p-2 rounded" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <p className="theme-text-secondary">Aprovação (Fiscalização)</p>
                        <p className={`font-medium ${etapa.dataAprovacao ? 'text-green-600' : 'theme-text-secondary'}`}>
                          {etapa.dataAprovacao?.toLocaleDateString('pt-BR') || '-'}
                        </p>
                        {etapa.usuarioAprovacao && (
                          <p className="theme-text-secondary text-[10px]">Por: {etapa.usuarioAprovacao.nome}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setApprovalModal(null)}
                className="px-4 py-2 text-sm rounded-lg theme-text hover:opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--color-surface-secondary)' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeoffHierarchyGrid;
