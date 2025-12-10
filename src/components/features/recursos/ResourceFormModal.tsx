import { useState, useEffect } from 'react';
import { X, Save, Users, Package, DollarSign, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resourceService, Resource, ResourceType } from '@/services/resourceService';

interface ResourceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resource: Resource) => void;
  empresaId: string;
  editingResource?: Resource;
}

const CATEGORY_OPTIONS = [
  { value: 'WORK', label: 'Mão de Obra', icon: Users, color: '#3B82F6' },
  { value: 'MATERIAL', label: 'Material', icon: Package, color: '#10B981' },
  { value: 'COST', label: 'Custo', icon: DollarSign, color: '#F59E0B' },
  { value: 'GENERIC', label: 'Genérico', icon: Briefcase, color: '#8B5CF6' },
];

const UNIT_OPTIONS = [
  { value: 'HORA', label: 'Hora' },
  { value: 'DIA', label: 'Dia' },
  { value: 'UN', label: 'Unidade' },
  { value: 'M2', label: 'm²' },
  { value: 'M3', label: 'm³' },
  { value: 'KG', label: 'kg' },
  { value: 'TON', label: 'Tonelada' },
];

export function ResourceFormModal({
  isOpen,
  onClose,
  onSave,
  empresaId,
  editingResource,
}: ResourceFormModalProps) {
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    codigo: '',
    nome: '',
    resourceTypeId: '',
    categoria: 'WORK',
    email: '',
    telefone: '',
    cargo: '',
    departamento: '',
    capacidadeDiaria: 8,
    unidadeCapacidade: 'HORA',
    custoPorHora: 0,
    custoPorUso: 0,
    custoHoraExtra: 0,
    custoFixo: 0,
    habilidades: [] as string[],
    disponivelDe: '',
    disponivelAte: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadResourceTypes();
      if (editingResource) {
        setFormData({
          codigo: editingResource.codigo || '',
          nome: editingResource.nome || '',
          resourceTypeId: editingResource.resourceTypeId || '',
          categoria: editingResource.resourceType?.categoria || 'WORK',
          email: editingResource.email || '',
          telefone: editingResource.telefone || '',
          cargo: editingResource.cargo || '',
          departamento: editingResource.departamento || '',
          capacidadeDiaria: editingResource.capacidadeDiaria || 8,
          unidadeCapacidade: editingResource.unidadeCapacidade || 'HORA',
          custoPorHora: editingResource.custoPorHora || 0,
          custoPorUso: editingResource.custoPorUso || 0,
          custoHoraExtra: editingResource.custoHoraExtra || 0,
          custoFixo: editingResource.custoFixo || 0,
          habilidades: editingResource.habilidades || [],
          disponivelDe: editingResource.disponivelDe || '',
          disponivelAte: editingResource.disponivelAte || '',
        });
      } else {
        setFormData({
          codigo: `REC-${Date.now().toString(36).toUpperCase()}`,
          nome: '',
          resourceTypeId: '',
          categoria: 'WORK',
          email: '',
          telefone: '',
          cargo: '',
          departamento: '',
          capacidadeDiaria: 8,
          unidadeCapacidade: 'HORA',
          custoPorHora: 0,
          custoPorUso: 0,
          custoHoraExtra: 0,
          custoFixo: 0,
          habilidades: [],
          disponivelDe: '',
          disponivelAte: '',
        });
      }
    }
  }, [isOpen, editingResource]);

  const loadResourceTypes = async () => {
    setLoading(true);
    try {
      const types = await resourceService.getResourceTypes(empresaId);
      setResourceTypes(types);
      if (types.length > 0 && !editingResource) {
        setFormData(prev => ({ ...prev, resourceTypeId: types[0].id }));
      }
    } catch (error) {
      console.error('Error loading resource types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    
    if (!formData.codigo.trim()) {
      setError('Código é obrigatório');
      return;
    }
    
    setSaving(true);
    try {
      let resource: Resource;
      
      if (editingResource) {
        resource = await resourceService.updateResource(editingResource.id, {
          codigo: formData.codigo,
          nome: formData.nome,
          resourceTypeId: formData.resourceTypeId || undefined,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          cargo: formData.cargo || undefined,
          departamento: formData.departamento || undefined,
          capacidadeDiaria: formData.capacidadeDiaria,
          unidadeCapacidade: formData.unidadeCapacidade,
          custoPorHora: formData.custoPorHora,
          custoPorUso: formData.custoPorUso,
          custoHoraExtra: formData.custoHoraExtra,
          custoFixo: formData.custoFixo,
          habilidades: formData.habilidades,
          disponivelDe: formData.disponivelDe || undefined,
          disponivelAte: formData.disponivelAte || undefined,
        });
      } else {
        resource = await resourceService.createResource({
          empresaId,
          codigo: formData.codigo,
          nome: formData.nome,
          resourceTypeId: formData.resourceTypeId || undefined,
          email: formData.email || undefined,
          telefone: formData.telefone || undefined,
          cargo: formData.cargo || undefined,
          departamento: formData.departamento || undefined,
          capacidadeDiaria: formData.capacidadeDiaria,
          unidadeCapacidade: formData.unidadeCapacidade,
          custoPorHora: formData.custoPorHora,
          custoPorUso: formData.custoPorUso,
          custoHoraExtra: formData.custoHoraExtra,
          custoFixo: formData.custoFixo,
          habilidades: formData.habilidades,
          disponivelDe: formData.disponivelDe || undefined,
          disponivelAte: formData.disponivelAte || undefined,
          ativo: true,
          metadata: {},
        });
      }
      
      onSave(resource);
      onClose();
    } catch (err) {
      console.error('Error saving resource:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar recurso. Verifique os dados e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingResource ? 'Editar Recurso' : 'Novo Recurso'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome do recurso"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = formData.categoria === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, categoria: cat.value }))}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {resourceTypes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Recurso
                  </label>
                  <select
                    value={formData.resourceTypeId}
                    onChange={(e) => setFormData(prev => ({ ...prev, resourceTypeId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {resourceTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo/Função
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Engenheiro Civil"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Engenharia"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Capacidade e Custos</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacidade Diária
                    </label>
                    <input
                      type="number"
                      value={formData.capacidadeDiaria}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacidadeDiaria: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unidade
                    </label>
                    <select
                      value={formData.unidadeCapacidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, unidadeCapacidade: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={unit.value} value={unit.value}>
                          {unit.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo/Hora (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.custoPorHora}
                      onChange={(e) => setFormData(prev => ({ ...prev, custoPorHora: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo Hora Extra (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.custoHoraExtra}
                      onChange={(e) => setFormData(prev => ({ ...prev, custoHoraExtra: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo por Uso (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.custoPorUso}
                      onChange={(e) => setFormData(prev => ({ ...prev, custoPorUso: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo Fixo (R$)
                    </label>
                    <input
                      type="number"
                      value={formData.custoFixo}
                      onChange={(e) => setFormData(prev => ({ ...prev, custoFixo: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Disponibilidade</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disponível de
                    </label>
                    <input
                      type="date"
                      value={formData.disponivelDe}
                      onChange={(e) => setFormData(prev => ({ ...prev, disponivelDe: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disponível até
                    </label>
                    <input
                      type="date"
                      value={formData.disponivelAte}
                      onChange={(e) => setFormData(prev => ({ ...prev, disponivelAte: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
        
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !formData.nome.trim()}>
            {saving ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {editingResource ? 'Salvar Alterações' : 'Criar Recurso'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
