import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, Users, DollarSign, Clock, Calendar, ChevronDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { resourceService, Resource, ResourceCurve, ResourceRate, ResourceAllocationP6 } from '@/services/resourceService';

interface ResourceAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  atividadeId: string;
  atividadeNome: string;
  empresaId: string;
  startDate: string;
  endDate: string;
  duration: number;
  existingAllocations?: ResourceAllocationP6[];
  onSave: (allocations: ResourceAllocationP6[]) => void;
}

interface AllocationDraft {
  id?: string;
  resourceId: string;
  resource?: Resource;
  unidades: number;
  unitsPerTime: number;
  budgetedUnits: number;
  rateType: number;
  curveId?: string;
  curve?: ResourceCurve;
  dataInicio: string;
  dataFim: string;
  calculatedCost: number;
  isNew?: boolean;
}

const RATE_TYPE_LABELS: Record<number, string> = {
  1: 'Padrão',
  2: 'Hora Extra',
  3: 'Externo',
  4: 'Especial',
  5: 'Emergência',
};

export function ResourceAssignmentModal({
  isOpen,
  onClose,
  atividadeId,
  atividadeNome,
  empresaId,
  startDate,
  endDate,
  duration,
  existingAllocations = [],
  onSave,
}: ResourceAssignmentModalProps) {
  const [allocations, setAllocations] = useState<AllocationDraft[]>([]);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [availableCurves, setAvailableCurves] = useState<ResourceCurve[]>([]);
  const [resourceRates, setResourceRates] = useState<Map<string, ResourceRate[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'allocations' | 'summary'>('allocations');
  const [showResourcePicker, setShowResourcePicker] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, empresaId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load resources first - this is required
      let resources: Resource[] = [];
      try {
        resources = await resourceService.getResources(empresaId);
        setAvailableResources(resources);
      } catch (err) {
        console.error('Error fetching resources:', err);
        setAvailableResources([]);
      }
      
      // Load curves - optional, fail gracefully if table doesn't exist
      try {
        const curves = await resourceService.getResourceCurves(empresaId);
        setAvailableCurves(curves);
      } catch (err) {
        console.warn('Resource curves not available:', err);
        // Provide default curves when table doesn't exist
        setAvailableCurves([
          {
            id: 'default-linear',
            codigo: 'LINEAR',
            nome: 'Linear',
            curveType: 'LINEAR',
            distributionPoints: Array(21).fill(100 / 21),
            isSystemDefault: true,
            cor: '#3B82F6',
            ativo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]);
      }

      const drafts: AllocationDraft[] = existingAllocations.map(alloc => ({
        id: alloc.id,
        resourceId: alloc.resourceId,
        resource: alloc.resource as Resource,
        unidades: alloc.unidades,
        unitsPerTime: alloc.unitsPerTime,
        budgetedUnits: alloc.budgetedUnits,
        rateType: alloc.rateType,
        curveId: alloc.curveId,
        curve: alloc.curve,
        dataInicio: alloc.dataInicio,
        dataFim: alloc.dataFim,
        calculatedCost: alloc.budgetedCost,
        isNew: false,
      }));
      
      setAllocations(drafts);

      // Load rates - optional, fail gracefully per resource
      const ratesMap = new Map<string, ResourceRate[]>();
      for (const resource of resources) {
        try {
          const rates = await resourceService.getResourceRates(resource.id);
          ratesMap.set(resource.id, rates);
        } catch {
          ratesMap.set(resource.id, []);
        }
      }
      setResourceRates(ratesMap);
    } catch (error) {
      console.error('Error loading resource data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addResource = (resource: Resource) => {
    const linearCurve = availableCurves.find(c => c.curveType === 'LINEAR');
    
    const newAllocation: AllocationDraft = {
      resourceId: resource.id,
      resource,
      unidades: 100,
      unitsPerTime: resource.capacidadeDiaria,
      budgetedUnits: duration * resource.capacidadeDiaria,
      rateType: 1,
      curveId: linearCurve?.id,
      curve: linearCurve,
      dataInicio: startDate,
      dataFim: endDate,
      calculatedCost: duration * resource.capacidadeDiaria * resource.custoPorHora,
      isNew: true,
    };
    
    setAllocations(prev => [...prev, newAllocation]);
    setShowResourcePicker(false);
  };

  const removeAllocation = (index: number) => {
    setAllocations(prev => prev.filter((_, i) => i !== index));
  };

  const updateAllocation = (index: number, updates: Partial<AllocationDraft>) => {
    setAllocations(prev => prev.map((alloc, i) => {
      if (i !== index) return alloc;
      
      const updated = { ...alloc, ...updates };
      
      if (updates.unidades !== undefined || updates.unitsPerTime !== undefined) {
        const resource = updated.resource;
        if (resource) {
          const unitsPerDay = (updated.unidades / 100) * updated.unitsPerTime;
          updated.budgetedUnits = duration * unitsPerDay;
          
          const rates = resourceRates.get(resource.id) || [];
          const rate = rates.find(r => r.rateType === updated.rateType);
          const pricePerUnit = rate?.pricePerUnit ?? resource.custoPorHora;
          
          updated.calculatedCost = updated.budgetedUnits * pricePerUnit;
        }
      }
      
      if (updates.rateType !== undefined) {
        const resource = updated.resource;
        if (resource) {
          const rates = resourceRates.get(resource.id) || [];
          const rate = rates.find(r => r.rateType === updates.rateType);
          const pricePerUnit = rate?.pricePerUnit ?? resource.custoPorHora;
          updated.calculatedCost = updated.budgetedUnits * pricePerUnit;
        }
      }
      
      return updated;
    }));
  };

  const totalCost = useMemo(() => {
    return allocations.reduce((sum, alloc) => sum + alloc.calculatedCost, 0);
  }, [allocations]);

  const totalHours = useMemo(() => {
    return allocations.reduce((sum, alloc) => sum + alloc.budgetedUnits, 0);
  }, [allocations]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const savedAllocations: ResourceAllocationP6[] = [];
      
      for (const draft of allocations) {
        const allocationData = {
          empresaId,
          atividadeId,
          resourceId: draft.resourceId,
          dataInicio: draft.dataInicio,
          dataFim: draft.dataFim,
          unidades: draft.unidades,
          unidadeTipo: 'PERCENT' as const,
          quantidadePlanejada: draft.budgetedUnits,
          quantidadeReal: 0,
          custoPlanejado: draft.calculatedCost,
          custoReal: 0,
          curvaAlocacao: draft.curve?.curveType || 'LINEAR',
          status: 'PLANNED' as const,
          notas: '',
          metadata: {},
          ativo: true,
          curveId: draft.curveId,
          rateType: draft.rateType,
          unitsPerTime: draft.unitsPerTime,
          budgetedUnits: draft.budgetedUnits,
          actualUnits: 0,
          remainingUnits: draft.budgetedUnits,
          atCompletionUnits: draft.budgetedUnits,
          budgetedCost: draft.calculatedCost,
          actualCost: 0,
          remainingCost: draft.calculatedCost,
          atCompletionCost: draft.calculatedCost,
        };
        
        if (draft.id && !draft.isNew) {
          const updated = await resourceService.updateAllocationP6(draft.id, allocationData);
          savedAllocations.push(updated);
        } else {
          const created = await resourceService.createAllocationP6(allocationData);
          savedAllocations.push(created);
        }
      }
      
      onSave(savedAllocations);
      onClose();
    } catch (error) {
      console.error('Error saving allocations:', error);
    } finally {
      setSaving(false);
    }
  };

  const availableToAdd = useMemo(() => {
    const assignedIds = new Set(allocations.map(a => a.resourceId));
    return availableResources.filter(r => !assignedIds.has(r.id));
  }, [availableResources, allocations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-semibold text-white">Alocação de Recursos</h2>
              <p className="text-sm text-blue-100 truncate max-w-md">{atividadeNome}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('allocations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'allocations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recursos Alocados ({allocations.length})
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Resumo de Custos
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'allocations' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {startDate} - {endDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {duration} dias
                  </span>
                </div>
                
                <div className="relative">
                  <Button
                    onClick={() => setShowResourcePicker(!showResourcePicker)}
                    className="flex items-center gap-2"
                    disabled={availableToAdd.length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Recurso
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  
                  {showResourcePicker && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-white border rounded-lg shadow-lg z-10 max-h-64 overflow-auto">
                      {availableToAdd.map(resource => (
                        <button
                          key={resource.id}
                          onClick={() => addResource(resource)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b last:border-0"
                        >
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: resource.resourceType?.cor || '#3B82F6' }}
                          >
                            {resource.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900 truncate">{resource.nome}</div>
                            <div className="text-xs text-gray-500">
                              {resource.resourceType?.nome || resource.cargo || 'Recurso'}
                              {' • '}
                              R$ {resource.custoPorHora.toFixed(2)}/h
                            </div>
                          </div>
                        </button>
                      ))}
                      {availableToAdd.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Todos os recursos já foram alocados
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {allocations.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum recurso alocado</p>
                  <p className="text-sm text-gray-400 mt-1">Clique em "Adicionar Recurso" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allocations.map((alloc, index) => (
                    <div 
                      key={alloc.id || index}
                      className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shrink-0"
                          style={{ backgroundColor: alloc.resource?.resourceType?.cor || '#3B82F6' }}
                        >
                          {alloc.resource?.nome.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium text-gray-900">{alloc.resource?.nome}</h4>
                              <p className="text-xs text-gray-500">
                                {alloc.resource?.resourceType?.nome || alloc.resource?.cargo}
                              </p>
                            </div>
                            <button
                              onClick={() => removeAllocation(index)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Unidades (%)
                              </label>
                              <input
                                type="number"
                                value={alloc.unidades}
                                onChange={(e) => updateAllocation(index, { unidades: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min={0}
                                max={200}
                                step={5}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Unidades/Tempo (h/dia)
                              </label>
                              <input
                                type="number"
                                value={alloc.unitsPerTime}
                                onChange={(e) => updateAllocation(index, { unitsPerTime: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min={0}
                                max={24}
                                step={0.5}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Tipo de Taxa
                              </label>
                              <select
                                value={alloc.rateType}
                                onChange={(e) => updateAllocation(index, { rateType: parseInt(e.target.value) })}
                                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                {[1, 2, 3, 4, 5].map(rt => (
                                  <option key={rt} value={rt}>
                                    {RATE_TYPE_LABELS[rt]}
                                  </option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">
                                Curva de Distribuição
                              </label>
                              <select
                                value={alloc.curveId || ''}
                                onChange={(e) => {
                                  const curve = availableCurves.find(c => c.id === e.target.value);
                                  updateAllocation(index, { curveId: e.target.value, curve });
                                }}
                                className="w-full px-3 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Linear (Padrão)</option>
                                {availableCurves.map(curve => (
                                  <option key={curve.id} value={curve.id}>
                                    {curve.nome}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t">
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-4 h-4" />
                                {alloc.budgetedUnits.toFixed(1)} horas
                              </span>
                              {alloc.unidades > 100 && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  Sobre-alocação
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-green-600">
                              <DollarSign className="w-4 h-4" />
                              R$ {alloc.calculatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Total de Recursos</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{allocations.length}</p>
                </div>
                
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Total de Horas</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {totalHours.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  </p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-sm font-medium">Custo Total</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recurso</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unidades</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Horas</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxa</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Custo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allocations.map((alloc, index) => (
                      <tr key={alloc.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                              style={{ backgroundColor: alloc.resource?.resourceType?.cor || '#3B82F6' }}
                            >
                              {alloc.resource?.nome.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{alloc.resource?.nome}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {alloc.resource?.resourceType?.nome || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <Badge variant={alloc.unidades > 100 ? 'danger' : 'default'}>
                            {alloc.unidades}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                          {alloc.budgetedUnits.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500">
                          {RATE_TYPE_LABELS[alloc.rateType]}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                          R$ {alloc.calculatedCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-700">Total</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {totalHours.toFixed(1)}
                      </td>
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-green-700">
                        R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {allocations.length} recurso(s) alocado(s)
            </span>
            {totalCost > 0 && (
              <span className="font-medium text-green-600">
                Custo Total: R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alocações'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceAssignmentModal;
