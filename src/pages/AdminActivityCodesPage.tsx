import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Tag,
  Palette,
  FolderTree,
  Save,
  X,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { 
  activityCodeService, 
  type ActivityCodeType, 
  type ActivityCodeValue,
  type ActivityCodeScope
} from '../services/activityCodeService';

interface NewTypeForm {
  nome: string;
  escopo: ActivityCodeScope;
  maxLength: number;
  descricao: string;
}

interface NewValueForm {
  valor: string;
  descricao: string;
  cor: string;
  parentId: string | null;
}

const AdminActivityCodesPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  
  const [types, setTypes] = useState<ActivityCodeType[]>([]);
  const [selectedType, setSelectedType] = useState<ActivityCodeType | null>(null);
  const [values, setValues] = useState<ActivityCodeValue[]>([]);
  const [expandedValues, setExpandedValues] = useState<Set<string>>(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showNewTypeModal, setShowNewTypeModal] = useState(false);
  const [showNewValueModal, setShowNewValueModal] = useState(false);
  
  const [newTypeForm, setNewTypeForm] = useState<NewTypeForm>({
    nome: '',
    escopo: 'global',
    maxLength: 20,
    descricao: ''
  });
  
  const [newValueForm, setNewValueForm] = useState<NewValueForm>({
    valor: '',
    descricao: '',
    cor: '#3B82F6',
    parentId: null
  });

  const empresaId = usuario?.empresaId;

  useEffect(() => {
    if (empresaId) {
      loadTypes();
    }
  }, [empresaId]);

  useEffect(() => {
    if (selectedType) {
      loadValues(selectedType.id);
    }
  }, [selectedType]);

  const loadTypes = async () => {
    if (!empresaId) return;
    
    try {
      setLoading(true);
      const data = await activityCodeService.getTypes(empresaId);
      setTypes(data);
      if (data.length > 0 && !selectedType) {
        setSelectedType(data[0]);
      }
    } catch (err) {
      setError('Erro ao carregar tipos de código');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadValues = async (typeId: string) => {
    try {
      const data = await activityCodeService.getValues(typeId);
      setValues(data);
    } catch (err) {
      console.error('Erro ao carregar valores:', err);
    }
  };

  const handleCreateType = async () => {
    if (!empresaId || !newTypeForm.nome) return;
    
    try {
      const newType = await activityCodeService.createType(empresaId, {
        nome: newTypeForm.nome,
        escopo: newTypeForm.escopo,
        descricao: newTypeForm.descricao || undefined
      });
      
      setTypes([...types, newType]);
      setShowNewTypeModal(false);
      setNewTypeForm({ nome: '', escopo: 'global', maxLength: 20, descricao: '' });
      
      if (!selectedType) {
        setSelectedType(newType);
      }
    } catch (err) {
      setError('Erro ao criar tipo de código');
      console.error(err);
    }
  };

  const handleCreateValue = async () => {
    if (!selectedType || !newValueForm.valor) return;
    
    try {
      const newValue = await activityCodeService.createValue(selectedType.id, {
        valor: newValueForm.valor,
        descricao: newValueForm.descricao || undefined,
        cor: newValueForm.cor,
        parentId: newValueForm.parentId || undefined
      });
      
      setValues([...values, newValue]);
      setShowNewValueModal(false);
      setNewValueForm({ valor: '', descricao: '', cor: '#3B82F6', parentId: null });
    } catch (err) {
      setError('Erro ao criar valor');
      console.error(err);
    }
  };

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo? Todos os valores associados serão removidos.')) {
      return;
    }
    
    try {
      await activityCodeService.deleteType(typeId);
      setTypes(types.filter(t => t.id !== typeId));
      if (selectedType?.id === typeId) {
        setSelectedType(types.find(t => t.id !== typeId) || null);
      }
    } catch (err) {
      setError('Erro ao excluir tipo de código');
      console.error(err);
    }
  };

  const handleDeleteValue = async (valueId: string) => {
    if (!confirm('Tem certeza que deseja excluir este valor?')) {
      return;
    }
    
    try {
      await activityCodeService.deleteValue(valueId);
      setValues(values.filter(v => v.id !== valueId));
    } catch (err) {
      setError('Erro ao excluir valor');
      console.error(err);
    }
  };

  const toggleValueExpand = (valueId: string) => {
    setExpandedValues(prev => {
      const next = new Set(prev);
      if (next.has(valueId)) {
        next.delete(valueId);
      } else {
        next.add(valueId);
      }
      return next;
    });
  };

  const getChildValues = (parentId: string) => {
    return values.filter(v => v.parentId === parentId);
  };

  const getRootValues = () => {
    return values.filter(v => !v.parentId);
  };

  const renderValueTree = (value: ActivityCodeValue, level: number = 0) => {
    const children = getChildValues(value.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedValues.has(value.id);
    
    return (
      <div key={value.id}>
        <div 
          className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded-lg group"
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button 
                onClick={() => toggleValueExpand(value.id)}
                className="p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-5" />
            )}
            
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: value.cor || '#6B7280' }}
            />
            
            <span className="font-mono text-sm font-medium text-gray-800">
              {value.valor}
            </span>
            
            {value.descricao && (
              <span className="text-sm text-gray-500">
                - {value.descricao}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setNewValueForm({
                  valor: '',
                  descricao: '',
                  cor: '#3B82F6',
                  parentId: value.id
                });
                setShowNewValueModal(true);
              }}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded"
              title="Adicionar sub-valor"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteValue(value.id)}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {isExpanded && children.map(child => renderValueTree(child, level + 1))}
      </div>
    );
  };

  const colorPresets = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Tag className="w-7 h-7 text-amber-500" />
              Códigos de Atividade
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie tipos e valores de códigos de atividade (estilo Primavera P6)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-500" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-gray-500" />
              Tipos de Código
            </h2>
            <button
              onClick={() => setShowNewTypeModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Tipo
            </button>
          </div>

          <div className="space-y-2">
            {types.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhum tipo de código cadastrado
              </p>
            ) : (
              types.map(type => (
                <div
                  key={type.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                    selectedType?.id === type.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800">{type.nome}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          type.escopo === 'global' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {type.escopo === 'global' ? 'Global' : 'Projeto'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Max: {type.maxLength} chars
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!type.isSecure && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteType(type.id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {type.descricao && (
                    <p className="text-xs text-gray-500 mt-2">{type.descricao}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="col-span-8 bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Palette className="w-5 h-5 text-gray-500" />
              Valores do Código
              {selectedType && (
                <span className="text-sm font-normal text-gray-500">
                  ({selectedType.nome})
                </span>
              )}
            </h2>
            {selectedType && (
              <button
                onClick={() => {
                  setNewValueForm({ valor: '', descricao: '', cor: '#3B82F6', parentId: null });
                  setShowNewValueModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Valor
              </button>
            )}
          </div>

          {!selectedType ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Selecione um tipo de código para ver seus valores</p>
            </div>
          ) : values.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum valor cadastrado para este tipo</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {getRootValues().map(value => renderValueTree(value))}
            </div>
          )}
        </div>
      </div>

      {showNewTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Novo Tipo de Código</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={newTypeForm.nome}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Disciplina, Área, Fase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escopo
                </label>
                <select
                  value={newTypeForm.escopo}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, escopo: e.target.value as ActivityCodeScope })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="global">Global (todos os projetos)</option>
                  <option value="project">Por Projeto</option>
                  <option value="eps">Por EPS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamanho Máximo
                </label>
                <input
                  type="number"
                  value={newTypeForm.maxLength}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, maxLength: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={1}
                  max={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newTypeForm.descricao}
                  onChange={(e) => setNewTypeForm({ ...newTypeForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewTypeModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateType}
                disabled={!newTypeForm.nome}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showNewValueModal && selectedType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Novo Valor - {selectedType.nome}
              {newValueForm.parentId && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (Sub-valor)
                </span>
              )}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={newValueForm.valor}
                  onChange={(e) => setNewValueForm({ ...newValueForm, valor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="Ex: CIV, MEC, ELE"
                  maxLength={selectedType.maxLength}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Máximo {selectedType.maxLength} caracteres
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={newValueForm.descricao}
                  onChange={(e) => setNewValueForm({ ...newValueForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Civil, Mecânica, Elétrica"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newValueForm.cor}
                    onChange={(e) => setNewValueForm({ ...newValueForm, cor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <div className="flex gap-1">
                    {colorPresets.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewValueForm({ ...newValueForm, cor: color })}
                        className={`w-6 h-6 rounded transition-transform ${
                          newValueForm.cor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewValueModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateValue}
                disabled={!newValueForm.valor}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivityCodesPage;
