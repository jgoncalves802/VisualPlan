import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Palette,
  Shield,
  ToggleLeft,
  ToggleRight,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { empresaService, Empresa, CreateEmpresaData } from '../services/empresaService';

const AdminEmpresasPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState<CreateEmpresaData>({
    nome: '',
    cnpj: '',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadEmpresas = async () => {
    setIsLoading(true);
    const { data, error } = await empresaService.getAll();
    if (!error) {
      setEmpresas(data);
    } else {
      showNotification('error', 'Erro ao carregar empresas');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  const filteredEmpresas = empresas.filter(empresa => 
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (empresa.cnpj && empresa.cnpj.includes(searchTerm))
  );

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      showNotification('error', 'O nome da empresa é obrigatório');
      return;
    }

    const { data, error } = await empresaService.create(formData);
    if (!error && data) {
      showNotification('success', 'Empresa criada com sucesso!');
      setShowCreateModal(false);
      setFormData({ nome: '', cnpj: '' });
      loadEmpresas();
    } else {
      showNotification('error', 'Erro ao criar empresa. Verifique se o CNPJ já existe.');
    }
  };

  const handleEdit = async () => {
    if (!selectedEmpresa || !formData.nome.trim()) {
      showNotification('error', 'O nome da empresa é obrigatório');
      return;
    }

    const { error } = await empresaService.update(selectedEmpresa.id, formData);
    if (!error) {
      showNotification('success', 'Empresa atualizada com sucesso!');
      setShowEditModal(false);
      setSelectedEmpresa(null);
      setFormData({ nome: '', cnpj: '' });
      loadEmpresas();
    } else {
      showNotification('error', 'Erro ao atualizar empresa');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmpresa) return;

    const { error } = await empresaService.delete(selectedEmpresa.id);
    if (!error) {
      showNotification('success', 'Empresa excluída com sucesso!');
      setShowDeleteModal(false);
      setSelectedEmpresa(null);
      loadEmpresas();
    } else {
      showNotification('error', 'Erro ao excluir empresa. Verifique se não há usuários vinculados.');
    }
  };

  const handleToggleAtivo = async (empresa: Empresa) => {
    const { error } = await empresaService.toggleAtivo(empresa.id, !empresa.ativo);
    if (!error) {
      showNotification('success', `Empresa ${!empresa.ativo ? 'ativada' : 'desativada'} com sucesso!`);
      loadEmpresas();
    } else {
      showNotification('error', 'Erro ao alterar status da empresa');
    }
  };

  const openEditModal = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setFormData({ nome: empresa.nome, cnpj: empresa.cnpj || '' });
    setShowEditModal(true);
  };

  const openDeleteModal = (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setShowDeleteModal(true);
  };

  const goToPersonalization = (empresa: Empresa) => {
    navigate(`/admin/temas?empresaId=${empresa.id}`);
  };

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  const stats = {
    total: empresas.length,
    ativas: empresas.filter(e => e.ativo).length,
    inativas: empresas.filter(e => !e.ativo).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: 'white',
          }}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold theme-text">Gestão de Empresas</h1>
          <p className="text-sm theme-text-secondary mt-1">
            Gerencie as empresas cadastradas no sistema
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nova Empresa</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total de Empresas</p>
              <p className="text-3xl font-bold mt-1">{stats.total}</p>
            </div>
            <Building2 size={40} className="text-blue-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Empresas Ativas</p>
              <p className="text-3xl font-bold mt-1">{stats.ativas}</p>
            </div>
            <ToggleRight size={40} className="text-green-200" />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-gray-500 to-gray-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm">Empresas Inativas</p>
              <p className="text-3xl font-bold mt-1">{stats.inativas}</p>
            </div>
            <ToggleLeft size={40} className="text-gray-200" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold theme-text">Lista de Empresas</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-64"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredEmpresas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto theme-text-secondary mb-4" size={48} />
            <p className="theme-text-secondary">
              {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b theme-border-primary">
                  <th className="text-left py-3 px-4 theme-text-secondary font-medium">Logo</th>
                  <th className="text-left py-3 px-4 theme-text-secondary font-medium">Nome</th>
                  <th className="text-left py-3 px-4 theme-text-secondary font-medium">CNPJ</th>
                  <th className="text-left py-3 px-4 theme-text-secondary font-medium">Status</th>
                  <th className="text-left py-3 px-4 theme-text-secondary font-medium">Criado em</th>
                  <th className="text-right py-3 px-4 theme-text-secondary font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmpresas.map((empresa) => (
                  <tr 
                    key={empresa.id} 
                    className="border-b theme-border-primary hover:bg-secondary-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      {empresa.logoUrl ? (
                        <img 
                          src={empresa.logoUrl} 
                          alt={empresa.nome}
                          className="w-10 h-10 rounded-lg object-contain bg-gray-100"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="text-primary" size={20} />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium theme-text">{empresa.nome}</span>
                    </td>
                    <td className="py-3 px-4 theme-text-secondary">
                      {empresa.cnpj || '-'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAtivo(empresa)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          empresa.ativo 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {empresa.ativo ? (
                          <>
                            <ToggleRight size={14} />
                            Ativa
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={14} />
                            Inativa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-4 theme-text-secondary text-sm">
                      {empresa.createdAt.toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => goToPersonalization(empresa)}
                          className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                          title="Personalizar tema e logo"
                        >
                          <Palette size={18} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/perfis?empresaId=${empresa.id}`)}
                          className="p-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors"
                          title="Perfis de Acesso"
                        >
                          <Shield size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(empresa)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Editar empresa"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(empresa)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          title="Excluir empresa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold theme-text">Nova Empresa</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ nome: '', cnpj: '' });
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X size={20} className="theme-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium theme-text mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input w-full"
                  placeholder="Ex: Construtora ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                  className="input w-full"
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ nome: '', cnpj: '' });
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
              >
                Criar Empresa
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold theme-text">Editar Empresa</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmpresa(null);
                  setFormData({ nome: '', cnpj: '' });
                }}
                className="p-2 hover:bg-secondary-100 rounded-lg transition-colors"
              >
                <X size={20} className="theme-text-secondary" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium theme-text mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="input w-full"
                  placeholder="Ex: Construtora ABC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium theme-text mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: formatCnpj(e.target.value) })}
                  className="input w-full"
                  placeholder="00.000.000/0001-00"
                  maxLength={18}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmpresa(null);
                  setFormData({ nome: '', cnpj: '' });
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleEdit}
                className="btn btn-primary"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedEmpresa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold theme-text">Excluir Empresa</h2>
                <p className="text-sm theme-text-secondary">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <p className="theme-text mb-6">
              Tem certeza que deseja excluir a empresa <strong>{selectedEmpresa.nome}</strong>?
              <br />
              <span className="text-sm theme-text-secondary">
                Todos os dados associados serão removidos permanentemente.
              </span>
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedEmpresa(null);
                }}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir Empresa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEmpresasPage;
