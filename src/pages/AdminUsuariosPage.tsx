import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Power,
  PowerOff,
  RefreshCw,
  Filter,
  X,
  Mail,
  Shield,
  Building2,
  UserCheck,
  UserX,
  Key,
} from 'lucide-react';
import { Usuario, CamadaGovernanca, PerfilAcesso } from '../types';
import { useAuthStore } from '../stores/authStore';
import {
  userService,
  CreateUserDTO,
  UpdateUserDTO,
  CAMADA_GOVERNANCA_LABELS,
  PERFIL_ACESSO_LABELS,
  PERFIS_POR_CAMADA,
} from '../services/userService';
import { empresaService, Empresa } from '../services/empresaService';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDTO | UpdateUserDTO, isEdit: boolean) => Promise<void>;
  user?: Usuario | null;
  empresas: Empresa[];
  defaultEmpresaId: string;
  isLoading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  empresas,
  defaultEmpresaId,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresaId: defaultEmpresaId,
    camadaGovernanca: CamadaGovernanca.CONTRATADA,
    perfilAcesso: PerfilAcesso.COLABORADOR,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        nome: user.nome,
        email: user.email,
        senha: '',
        confirmarSenha: '',
        empresaId: user.empresaId || defaultEmpresaId,
        camadaGovernanca: user.camadaGovernanca,
        perfilAcesso: user.perfilAcesso,
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        empresaId: defaultEmpresaId,
        camadaGovernanca: CamadaGovernanca.CONTRATADA,
        perfilAcesso: PerfilAcesso.COLABORADOR,
      });
    }
    setErrors({});
  }, [user, isOpen, defaultEmpresaId]);

  const availablePerfis = useMemo(() => {
    return PERFIS_POR_CAMADA[formData.camadaGovernanca] || [];
  }, [formData.camadaGovernanca]);

  useEffect(() => {
    if (!availablePerfis.includes(formData.perfilAcesso)) {
      setFormData(prev => ({
        ...prev,
        perfilAcesso: availablePerfis[0] || PerfilAcesso.COLABORADOR,
      }));
    }
  }, [availablePerfis, formData.perfilAcesso]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!isEdit) {
      if (!formData.email.trim()) {
        newErrors.email = 'E-mail é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'E-mail inválido';
      }

      if (!formData.senha) {
        newErrors.senha = 'Senha é obrigatória';
      } else if (formData.senha.length < 8) {
        newErrors.senha = 'Senha deve ter no mínimo 8 caracteres';
      }

      if (formData.senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'Senhas não conferem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (isEdit) {
      const updateData: UpdateUserDTO = {
        nome: formData.nome,
        camadaGovernanca: formData.camadaGovernanca,
        perfilAcesso: formData.perfilAcesso,
      };
      await onSave(updateData, true);
    } else {
      const createData: CreateUserDTO = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        empresaId: formData.empresaId,
        camadaGovernanca: formData.camadaGovernanca,
        perfilAcesso: formData.perfilAcesso,
      };
      await onSave(createData, false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.nome ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Digite o nome completo"
            />
            {errors.nome && <p className="text-sm mt-1 text-red-500">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isEdit}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="email@exemplo.com"
            />
            {errors.email && <p className="text-sm mt-1 text-red-500">{errors.email}</p>}
            {isEdit && (
              <p className="text-xs mt-1 text-gray-500">
                O e-mail não pode ser alterado após a criação.
              </p>
            )}
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Senha *
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.senha ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.senha && <p className="text-sm mt-1 text-red-500">{errors.senha}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 ${errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Repita a senha"
                />
                {errors.confirmarSenha && (
                  <p className="text-sm mt-1 text-red-500">{errors.confirmarSenha}</p>
                )}
              </div>
            </>
          )}

          {!isEdit && empresas.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Empresa *
              </label>
              <select
                value={formData.empresaId}
                onChange={(e) => setFormData({ ...formData, empresaId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Selecione uma empresa</option>
                {empresas.filter(e => e.ativo).map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
              <p className="text-xs mt-1 text-gray-500">
                O usuário será vinculado a esta empresa.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Camada de Governança *
              </label>
              <select
                value={formData.camadaGovernanca}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    camadaGovernanca: e.target.value as CamadaGovernanca,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                {Object.entries(CAMADA_GOVERNANCA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Perfil de Acesso *
              </label>
              <select
                value={formData.perfilAcesso}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    perfilAcesso: e.target.value as PerfilAcesso,
                  })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                {availablePerfis.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {PERFIL_ACESSO_LABELS[perfil]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 rounded-lg border-l-4 bg-blue-50 border-l-blue-500">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Permissões de Acesso
                </p>
                <p className="text-xs mt-1 text-gray-600">
                  O perfil selecionado determina quais funcionalidades o usuário poderá acessar na plataforma.
                  Os perfis estão organizados por camada de governança conforme a documentação do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Sobre as Permissões</p>
            <p className="text-xs text-gray-600">
              O sistema possui 3 camadas de governança (Proponente, Fiscalização, Contratada) e 10 perfis de acesso. 
              Cada perfil determina quais funcionalidades o usuário pode acessar. 
              Administradores têm acesso completo, enquanto colaboradores têm acesso restrito às suas tarefas.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Salvar Alterações' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsuariosPage: React.FC = () => {
  const { usuario: currentUser } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    camadaGovernanca: '' as CamadaGovernanca | '',
    perfilAcesso: '' as PerfilAcesso | '',
    ativo: '' as 'true' | 'false' | '',
    empresaId: '' as string,
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadEmpresas = async () => {
    const { data } = await empresaService.getAll();
    setEmpresas(data);
  };

  const loadUsuarios = async () => {
    setIsLoading(true);
    const filterParams: Record<string, unknown> = {
      camadaGovernanca: filters.camadaGovernanca || undefined,
      perfilAcesso: filters.perfilAcesso || undefined,
      ativo: filters.ativo === '' ? undefined : filters.ativo === 'true',
      search: search || undefined,
    };
    
    if (filters.empresaId) {
      filterParams.empresaId = filters.empresaId;
    } else if (currentUser?.empresaId) {
      filterParams.empresaId = currentUser.empresaId;
    }

    const { data, error } = await userService.getAll(filterParams as { empresaId?: string; camadaGovernanca?: CamadaGovernanca; perfilAcesso?: PerfilAcesso; ativo?: boolean; search?: string });

    if (error) {
      showNotification('error', 'Erro ao carregar usuários: ' + error.message);
    } else {
      setUsuarios(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    loadUsuarios();
  }, [filters, currentUser?.empresaId]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadUsuarios();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSaveUser = async (data: CreateUserDTO | UpdateUserDTO, isEdit: boolean) => {
    setIsSaving(true);
    try {
      if (isEdit && editingUser) {
        const { error } = await userService.update(editingUser.id, data as UpdateUserDTO);
        if (error) throw error;
        showNotification('success', 'Usuário atualizado com sucesso!');
      } else {
        const { error } = await userService.create(data as CreateUserDTO);
        if (error) throw error;
        showNotification('success', 'Usuário criado com sucesso! Um e-mail de confirmação foi enviado.');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      loadUsuarios();
    } catch (error) {
      showNotification('error', 'Erro ao salvar usuário: ' + (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (user: Usuario) => {
    const action = user.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${action} o usuário ${user.nome}?`)) return;

    const { error } = await userService.toggleActive(user.id, !user.ativo);
    if (error) {
      showNotification('error', `Erro ao ${action} usuário: ${error.message}`);
    } else {
      showNotification('success', `Usuário ${user.ativo ? 'desativado' : 'ativado'} com sucesso!`);
      loadUsuarios();
    }
  };

  const handleResetPassword = async (user: Usuario) => {
    if (!confirm(`Enviar e-mail de redefinição de senha para ${user.email}?`)) return;

    const { error } = await userService.resetPassword(user.email);
    if (error) {
      showNotification('error', 'Erro ao enviar e-mail: ' + error.message);
    } else {
      showNotification('success', 'E-mail de redefinição de senha enviado!');
    }
  };

  const openEditModal = (user: Usuario) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    const total = usuarios.length;
    const ativos = usuarios.filter((u) => u.ativo).length;
    const inativos = total - ativos;
    const porCamada = {
      [CamadaGovernanca.PROPONENTE]: usuarios.filter((u) => u.camadaGovernanca === CamadaGovernanca.PROPONENTE).length,
      [CamadaGovernanca.FISCALIZACAO]: usuarios.filter((u) => u.camadaGovernanca === CamadaGovernanca.FISCALIZACAO).length,
      [CamadaGovernanca.CONTRATADA]: usuarios.filter((u) => u.camadaGovernanca === CamadaGovernanca.CONTRATADA).length,
    };
    return { total, ativos, inativos, porCamada };
  }, [usuarios]);

  const filteredUsers = useMemo(() => {
    return usuarios;
  }, [usuarios]);

  return (
    <div className="space-y-6 animate-fade-in">
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in"
          style={{
            backgroundColor: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: 'white',
          }}
        >
          {notification.type === 'success' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gestão de Usuários
          </h1>
          <p className="text-sm mt-1 text-gray-600">
            Gerencie os usuários e suas permissões de acesso à plataforma
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white transition-colors flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
              <p className="text-sm text-gray-600">
                Total de Usuários
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.ativos}
              </p>
              <p className="text-sm text-gray-600">
                Usuários Ativos
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-100">
              <UserX className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.inativos}
              </p>
              <p className="text-sm text-gray-600">
                Usuários Inativos
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-cyan-100">
              <Building2 className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                3
              </p>
              <p className="text-sm text-gray-600">
                Camadas de Governança
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-6 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
          <button
            onClick={loadUsuarios}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 transition-colors flex items-center gap-2 hover:bg-gray-50"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg mb-6 bg-gray-50">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Empresa
              </label>
              <select
                value={filters.empresaId}
                onChange={(e) => setFilters({ ...filters, empresaId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Todas</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Camada de Governança
              </label>
              <select
                value={filters.camadaGovernanca}
                onChange={(e) =>
                  setFilters({ ...filters, camadaGovernanca: e.target.value as CamadaGovernanca | '' })
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Todas</option>
                {Object.entries(CAMADA_GOVERNANCA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Perfil de Acesso
              </label>
              <select
                value={filters.perfilAcesso}
                onChange={(e) => setFilters({ ...filters, perfilAcesso: e.target.value as PerfilAcesso | '' })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Todos</option>
                {Object.entries(PERFIL_ACESSO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Status
              </label>
              <select
                value={filters.ativo}
                onChange={(e) => setFilters({ ...filters, ativo: e.target.value as 'true' | 'false' | '' })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="">Todos</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30 text-gray-400" />
            <p className="text-lg font-medium text-gray-900">
              Nenhum usuário encontrado
            </p>
            <p className="text-sm text-gray-600">
              Tente ajustar os filtros ou criar um novo usuário
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Empresa
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Camada
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Perfil
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${user.ativo ? 'bg-blue-600' : 'bg-gray-400'}`}
                        >
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.nome}
                          </p>
                          <p className="text-sm flex items-center gap-1 text-gray-500">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {empresas.find(e => e.id === user.empresaId)?.nome || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          user.camadaGovernanca === CamadaGovernanca.PROPONENTE
                            ? 'bg-blue-100 text-blue-700'
                            : user.camadaGovernanca === CamadaGovernanca.FISCALIZACAO
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        {CAMADA_GOVERNANCA_LABELS[user.camadaGovernanca]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">
                          {PERFIL_ACESSO_LABELS[user.perfilAcesso]}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${
                          user.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.ativo ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Editar usuário"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Redefinir senha"
                        >
                          <Key className="w-4 h-4 text-amber-600" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.ativo ? (
                            <PowerOff className="w-4 h-4 text-red-600" />
                          ) : (
                            <Power className="w-4 h-4 text-green-600" />
                          )}
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

      <div className="p-4 rounded-xl border-l-4 bg-blue-50 border-l-blue-500">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">
              Sobre as Permissões
            </h3>
            <p className="text-sm mt-1 text-gray-600">
              O sistema possui 3 camadas de governança (Proponente, Fiscalização, Contratada) e 10 perfis de acesso.
              Cada perfil determina quais funcionalidades o usuário pode acessar. Administradores têm acesso completo,
              enquanto colaboradores têm acesso restrito às suas tarefas.
            </p>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSave={handleSaveUser}
        user={editingUser}
        empresas={empresas}
        defaultEmpresaId={currentUser?.empresaId || ''}
        isLoading={isSaving}
      />
    </div>
  );
};

export default AdminUsuariosPage;
