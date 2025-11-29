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

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateUserDTO | UpdateUserDTO, isEdit: boolean) => Promise<void>;
  user?: Usuario | null;
  empresaId: string;
  isLoading: boolean;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  user,
  empresaId,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
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
        camadaGovernanca: user.camadaGovernanca,
        perfilAcesso: user.perfilAcesso,
      });
    } else {
      setFormData({
        nome: '',
        email: '',
        senha: '',
        confirmarSenha: '',
        camadaGovernanca: CamadaGovernanca.CONTRATADA,
        perfilAcesso: PerfilAcesso.COLABORADOR,
      });
    }
    setErrors({});
  }, [user, isOpen]);

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
        empresaId,
        camadaGovernanca: formData.camadaGovernanca,
        perfilAcesso: formData.perfilAcesso,
      };
      await onSave(createData, false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--color-secondary-200)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              Nome Completo *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: errors.nome ? 'var(--color-danger)' : 'var(--color-secondary-200)',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="Digite o nome completo"
            />
            {errors.nome && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
              E-mail *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isEdit}
              className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: errors.email ? 'var(--color-danger)' : 'var(--color-secondary-200)',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="email@exemplo.com"
            />
            {errors.email && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.email}</p>}
            {isEdit && (
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                O e-mail não pode ser alterado após a criação.
              </p>
            )}
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Senha *
                </label>
                <input
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.senha ? 'var(--color-danger)' : 'var(--color-secondary-200)',
                    backgroundColor: 'var(--color-bg-main)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.senha && <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.senha}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Confirmar Senha *
                </label>
                <input
                  type="password"
                  value={formData.confirmarSenha}
                  onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                  style={{
                    borderColor: errors.confirmarSenha ? 'var(--color-danger)' : 'var(--color-secondary-200)',
                    backgroundColor: 'var(--color-bg-main)',
                    color: 'var(--color-text-primary)',
                  }}
                  placeholder="Repita a senha"
                />
                {errors.confirmarSenha && (
                  <p className="text-sm mt-1" style={{ color: 'var(--color-danger)' }}>{errors.confirmarSenha}</p>
                )}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
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
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-secondary-200)',
                  backgroundColor: 'var(--color-bg-main)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {Object.entries(CAMADA_GOVERNANCA_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
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
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-secondary-200)',
                  backgroundColor: 'var(--color-bg-main)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {availablePerfis.map((perfil) => (
                  <option key={perfil} value={perfil}>
                    {PERFIL_ACESSO_LABELS[perfil]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: 'var(--color-info)10',
              borderLeftColor: 'var(--color-info)',
            }}
          >
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  Permissões de Acesso
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  O perfil selecionado determina quais funcionalidades o usuário poderá acessar na plataforma.
                  Os perfis estão organizados por camada de governança conforme a documentação do sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{
                borderColor: 'var(--color-secondary-200)',
                color: 'var(--color-text-primary)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary-500)' }}
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
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadUsuarios = async () => {
    setIsLoading(true);
    const { data, error } = await userService.getAll({
      empresaId: currentUser?.empresaId,
      camadaGovernanca: filters.camadaGovernanca || undefined,
      perfilAcesso: filters.perfilAcesso || undefined,
      ativo: filters.ativo === '' ? undefined : filters.ativo === 'true',
      search: search || undefined,
    });

    if (error) {
      showNotification('error', 'Erro ao carregar usuários: ' + error.message);
    } else {
      setUsuarios(data || []);
    }
    setIsLoading(false);
  };

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
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Gestão de Usuários
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Gerencie os usuários e suas permissões de acesso à plataforma
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 hover:opacity-90"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          <Plus className="w-5 h-5" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-secondary-200)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-500)20' }}
            >
              <Users className="w-6 h-6" style={{ color: 'var(--color-primary-500)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stats.total}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Total de Usuários
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-secondary-200)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-success)20' }}
            >
              <UserCheck className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stats.ativos}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Usuários Ativos
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-secondary-200)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-warning)20' }}
            >
              <UserX className="w-6 h-6" style={{ color: 'var(--color-warning)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {stats.inativos}
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Usuários Inativos
              </p>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-xl"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-secondary-200)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-info)20' }}
            >
              <Building2 className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                3
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Camadas de Governança
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-secondary-200)' }}
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--color-text-secondary)' }}
            />
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'var(--color-secondary-200)',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-primary)',
              }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-primary-50' : ''
            }`}
            style={{
              borderColor: showFilters ? 'var(--color-primary-500)' : 'var(--color-secondary-200)',
              color: showFilters ? 'var(--color-primary-500)' : 'var(--color-text-primary)',
            }}
          >
            <Filter className="w-5 h-5" />
            <span>Filtros</span>
          </button>
          <button
            onClick={loadUsuarios}
            className="px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 hover:bg-gray-50"
            style={{
              borderColor: 'var(--color-secondary-200)',
              color: 'var(--color-text-primary)',
            }}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {showFilters && (
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg mb-6"
            style={{ backgroundColor: 'var(--color-bg-main)' }}
          >
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Camada de Governança
              </label>
              <select
                value={filters.camadaGovernanca}
                onChange={(e) =>
                  setFilters({ ...filters, camadaGovernanca: e.target.value as CamadaGovernanca | '' })
                }
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-secondary-200)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Perfil de Acesso
              </label>
              <select
                value={filters.perfilAcesso}
                onChange={(e) => setFilters({ ...filters, perfilAcesso: e.target.value as PerfilAcesso | '' })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-secondary-200)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
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
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Status
              </label>
              <select
                value={filters.ativo}
                onChange={(e) => setFilters({ ...filters, ativo: e.target.value as 'true' | 'false' | '' })}
                className="w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-secondary-200)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                }}
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
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary-500)' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Nenhum usuário encontrado
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Tente ajustar os filtros ou criar um novo usuário
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-secondary-200)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Camada
                  </th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Perfil
                  </th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Status
                  </th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                    style={{ borderBottom: '1px solid var(--color-secondary-200)' }}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                          style={{
                            backgroundColor: user.ativo ? 'var(--color-primary-500)' : 'var(--color-secondary-400)',
                          }}
                        >
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                            {user.nome}
                          </p>
                          <p className="text-sm flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor:
                            user.camadaGovernanca === CamadaGovernanca.PROPONENTE
                              ? 'var(--color-primary-500)15'
                              : user.camadaGovernanca === CamadaGovernanca.FISCALIZACAO
                              ? 'var(--color-warning)15'
                              : 'var(--color-info)15',
                          color:
                            user.camadaGovernanca === CamadaGovernanca.PROPONENTE
                              ? 'var(--color-primary-500)'
                              : user.camadaGovernanca === CamadaGovernanca.FISCALIZACAO
                              ? 'var(--color-warning)'
                              : 'var(--color-info)',
                        }}
                      >
                        {CAMADA_GOVERNANCA_LABELS[user.camadaGovernanca]}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Shield className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
                        <span style={{ color: 'var(--color-text-primary)' }}>
                          {PERFIL_ACESSO_LABELS[user.perfilAcesso]}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className="px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit"
                        style={{
                          backgroundColor: user.ativo ? 'var(--color-success)15' : 'var(--color-danger)15',
                          color: user.ativo ? 'var(--color-success)' : 'var(--color-danger)',
                        }}
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
                          <Edit2 className="w-4 h-4" style={{ color: 'var(--color-primary-500)' }} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title="Redefinir senha"
                        >
                          <Key className="w-4 h-4" style={{ color: 'var(--color-warning)' }} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={user.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                          disabled={user.id === currentUser?.id}
                        >
                          {user.ativo ? (
                            <PowerOff className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
                          ) : (
                            <Power className="w-4 h-4" style={{ color: 'var(--color-success)' }} />
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

      <div
        className="p-4 rounded-xl border-l-4"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderLeftColor: 'var(--color-info)',
        }}
      >
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Sobre as Permissões
            </h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
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
        empresaId={currentUser?.empresaId || ''}
        isLoading={isSaving}
      />
    </div>
  );
};

export default AdminUsuariosPage;
