import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Network,
  Shield,
  Users,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
  Save,
  X,
  Check,
  AlertCircle,
  Building2,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { useObsStore } from '../stores/obsStore';
import { useProfileStore } from '../stores/profileStore';
import { empresaService } from '../services/empresaService';
import { userService } from '../services/userService';
import { obsService, type ObsNode } from '../services/obsService';
import type { AccessProfile } from '../services/profileService';

type TabType = 'obs' | 'perfis' | 'usuarios';

const CAMADA_OPTIONS = [
  { value: 'PROPONENTE', label: 'Proponente' },
  { value: 'FISCALIZACAO', label: 'Fiscalização' },
  { value: 'CONTRATADA', label: 'Contratada' },
];

const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Obras',
  planning: 'Planejamento',
  activities: 'Atividades',
  lps: 'Last Planner System',
  restrictions: 'Restrições',
  quality: 'Qualidade',
  reports: 'Relatórios',
  '4d': 'Visualização 4D',
  kanban: 'Kanban',
  users: 'Usuários',
  companies: 'Empresas',
  obs: 'Estrutura Organizacional',
  profiles: 'Perfis de Acesso',
  settings: 'Configurações',
  logs: 'Logs de Atividade',
};

interface ObsTreeNodeProps {
  node: ObsNode;
  level: number;
  onSelect: (node: ObsNode) => void;
  onEdit: (node: ObsNode) => void;
  onDelete: (node: ObsNode) => void;
  onAddChild: (node: ObsNode) => void;
  onAssignManager?: (node: ObsNode) => void;
  selectedId: string | null;
  showManagerBadge?: boolean;
}

function ObsTreeNode({ node, level, onSelect, onEdit, onDelete, onAddChild, onAssignManager, selectedId, showManagerBadge = true }: ObsTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          selectedId === node.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'
        }`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onSelect(node)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        <FolderTree className="w-4 h-4 text-blue-600" />
        <div className="flex-1 flex items-center gap-2">
          <span className="font-medium text-gray-900">{node.nome}</span>
          {node.codigo && <span className="text-xs text-gray-500">({node.codigo})</span>}
          {showManagerBadge && node.responsibleManager && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
              <UserCheck className="w-3 h-3" />
              {node.responsibleManager.nome}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onAssignManager && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignManager(node);
              }}
              className="p-1 hover:bg-green-100 rounded text-green-600"
              title="Atribuir Responsible Manager"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node);
            }}
            className="p-1 hover:bg-blue-100 rounded text-blue-600"
            title="Adicionar filho"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="p-1 hover:bg-gray-200 rounded text-gray-600"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="p-1 hover:bg-red-100 rounded text-red-600"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <ObsTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAssignManager={onAssignManager}
              selectedId={selectedId}
              showManagerBadge={showManagerBadge}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPerfisPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const empresaId = searchParams.get('empresaId');

  const [activeTab, setActiveTab] = useState<TabType>('obs');
  const [empresa, setEmpresa] = useState<{ id: string; nome: string } | null>(null);
  const [usuarios, setUsuarios] = useState<Array<{
    id: string;
    nome: string;
    email: string;
    perfilAcesso: string;
  }>>([]);

  const { tree, selectedNode, isLoading: obsLoading, loadTree, createNode, updateNode, deleteNode, selectNode } = useObsStore();
  const { profiles, selectedProfile, permissionsByModule, profilePermissions, isLoading: profileLoading, loadProfiles, loadPermissions, loadProfileWithPermissions, createProfile, updateProfile, deleteProfile, setProfilePermissions, selectProfile, createDefaultProfiles } = useProfileStore();

  const [showObsModal, setShowObsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [editingObs, setEditingObs] = useState<ObsNode | null>(null);
  const [parentObs, setParentObs] = useState<ObsNode | null>(null);
  const [editingProfile, setEditingProfile] = useState<AccessProfile | null>(null);
  const [managerNode, setManagerNode] = useState<ObsNode | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [assigningManager, setAssigningManager] = useState(false);
  const [managerError, setManagerError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<ObsNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [obsForm, setObsForm] = useState({ nome: '', codigo: '', descricao: '' });
  const [profileForm, setProfileForm] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    camadaGovernanca: '',
    cor: '#3B82F6',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (empresaId) {
      loadEmpresa();
      loadTree(empresaId);
      loadProfiles(empresaId);
      loadPermissions();
      loadUsuarios();
    }
  }, [empresaId]);

  const loadEmpresa = async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await empresaService.getById(empresaId);
      if (error) throw error;
      if (data) {
        setEmpresa({ id: data.id, nome: data.nome });
      }
    } catch (error) {
      console.error('Error loading empresa:', error);
    }
  };

  const loadUsuarios = async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await userService.getAll({ empresaId });
      if (error) throw error;
      setUsuarios((data || []).map(u => ({
        id: u.id,
        nome: u.nome,
        email: u.email,
        perfilAcesso: u.perfilAcesso,
      })));
    } catch (error) {
      console.error('Error loading usuarios:', error);
    }
  };

  const handleCreateObs = async () => {
    if (!empresaId || !obsForm.nome) return;
    try {
      await createNode({
        empresaId,
        parentId: parentObs?.id || null,
        nome: obsForm.nome,
        codigo: obsForm.codigo || undefined,
        descricao: obsForm.descricao || undefined,
      });
      setShowObsModal(false);
      setObsForm({ nome: '', codigo: '', descricao: '' });
      setParentObs(null);
    } catch (error) {
      console.error('Error creating OBS node:', error);
    }
  };

  const handleUpdateObs = async () => {
    if (!editingObs || !obsForm.nome) return;
    try {
      await updateNode(editingObs.id, {
        nome: obsForm.nome,
        codigo: obsForm.codigo,
        descricao: obsForm.descricao,
      });
      setShowObsModal(false);
      setEditingObs(null);
      setObsForm({ nome: '', codigo: '', descricao: '' });
    } catch (error) {
      console.error('Error updating OBS node:', error);
    }
  };

  const handleDeleteObs = (node: ObsNode) => {
    setNodeToDelete(node);
    setShowDeleteModal(true);
  };

  const confirmDeleteObs = async () => {
    if (!nodeToDelete) return;
    setDeleting(true);
    try {
      await deleteNode(nodeToDelete.id);
      setShowDeleteModal(false);
      setNodeToDelete(null);
    } catch (error) {
      console.error('Error deleting OBS node:', error);
    } finally {
      setDeleting(false);
    }
  };

  const openObsEditModal = (node: ObsNode) => {
    setEditingObs(node);
    setObsForm({
      nome: node.nome,
      codigo: node.codigo || '',
      descricao: node.descricao || '',
    });
    setShowObsModal(true);
  };

  const openObsAddChildModal = (parent: ObsNode) => {
    setParentObs(parent);
    setEditingObs(null);
    setObsForm({ nome: '', codigo: '', descricao: '' });
    setShowObsModal(true);
  };

  const openObsAddRootModal = () => {
    setParentObs(null);
    setEditingObs(null);
    setObsForm({ nome: '', codigo: '', descricao: '' });
    setShowObsModal(true);
  };

  const openManagerModal = (node: ObsNode) => {
    setManagerNode(node);
    setSelectedManagerId(node.responsibleManagerId || '');
    setManagerError(null);
    setShowManagerModal(true);
  };

  const handleAssignManager = async () => {
    if (!managerNode || !empresaId) return;
    setAssigningManager(true);
    setManagerError(null);
    try {
      await obsService.assignResponsibleManager(
        managerNode.id,
        selectedManagerId || null
      );
      await loadTree(empresaId);
      setShowManagerModal(false);
      setManagerNode(null);
      setSelectedManagerId('');
    } catch (error: unknown) {
      console.error('Error assigning manager:', error);
      if (error instanceof Error) {
        setManagerError(error.message);
      } else {
        setManagerError('Erro ao atribuir Responsible Manager. Verifique se a migração SQL foi executada.');
      }
    } finally {
      setAssigningManager(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!empresaId || !profileForm.nome || !profileForm.codigo) return;
    try {
      const profile = await createProfile({
        empresaId,
        nome: profileForm.nome,
        codigo: profileForm.codigo,
        descricao: profileForm.descricao || undefined,
        camadaGovernanca: profileForm.camadaGovernanca || undefined,
        cor: profileForm.cor,
      });
      setShowProfileModal(false);
      setProfileForm({ nome: '', codigo: '', descricao: '', camadaGovernanca: '', cor: '#3B82F6' });
      selectProfile(profile);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile || !profileForm.nome) return;
    try {
      await updateProfile(editingProfile.id, {
        nome: profileForm.nome,
        codigo: profileForm.codigo,
        descricao: profileForm.descricao,
        camadaGovernanca: profileForm.camadaGovernanca,
        cor: profileForm.cor,
      });
      setShowProfileModal(false);
      setEditingProfile(null);
      setProfileForm({ nome: '', codigo: '', descricao: '', camadaGovernanca: '', cor: '#3B82F6' });
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleDeleteProfile = async (profile: AccessProfile) => {
    if (profile.isSystem) {
      alert('Perfis do sistema não podem ser excluídos.');
      return;
    }
    if (!confirm(`Deseja excluir o perfil "${profile.nome}"?`)) return;
    try {
      await deleteProfile(profile.id);
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const openProfileEditModal = (profile: AccessProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      nome: profile.nome,
      codigo: profile.codigo,
      descricao: profile.descricao || '',
      camadaGovernanca: profile.camadaGovernanca || '',
      cor: profile.cor,
    });
    setShowProfileModal(true);
  };

  const openProfileAddModal = () => {
    setEditingProfile(null);
    setProfileForm({ nome: '', codigo: '', descricao: '', camadaGovernanca: '', cor: '#3B82F6' });
    setShowProfileModal(true);
  };

  const handleSelectProfile = async (profile: AccessProfile) => {
    await loadProfileWithPermissions(profile.id);
    const perms: Record<string, string> = {};
    profilePermissions.forEach(p => {
      perms[p.permissionCode] = p.nivel;
    });
    setSelectedPermissions(perms);
  };

  useEffect(() => {
    if (profilePermissions.length > 0) {
      const perms: Record<string, string> = {};
      profilePermissions.forEach(p => {
        perms[p.permissionCode] = p.nivel;
      });
      setSelectedPermissions(perms);
    }
  }, [profilePermissions]);

  const handlePermissionChange = (permissionCode: string, nivel: string) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [permissionCode]: nivel,
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedProfile) return;
    try {
      const perms = Object.entries(selectedPermissions)
        .filter(([_, nivel]) => nivel !== 'none')
        .map(([permissionCode, nivel]) => ({ permissionCode, nivel }));
      await setProfilePermissions(selectedProfile.id, perms);
      alert('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Erro ao salvar permissões.');
    }
  };

  const handleCreateDefaultProfiles = async () => {
    if (!empresaId) return;
    if (!confirm('Isso irá criar os perfis padrão do sistema. Deseja continuar?')) return;
    try {
      await createDefaultProfiles(empresaId);
      alert('Perfis padrão criados com sucesso!');
    } catch (error) {
      console.error('Error creating default profiles:', error);
    }
  };

  const isLoading = obsLoading || profileLoading;

  if (!empresaId) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">Nenhuma empresa selecionada. Volte para a lista de empresas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate('/admin/empresas')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Voltar para Empresas</span>
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Perfis de Acesso - {empresa?.nome || 'Carregando...'}
            </h1>
            <p className="text-sm text-gray-600">
              Configure a estrutura organizacional (OBS) e perfis de acesso
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('obs')}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'obs'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Network className="w-5 h-5" />
          <span>Estrutura Organizacional</span>
        </button>
        <button
          onClick={() => setActiveTab('perfis')}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'perfis'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span>Perfis e Permissões</span>
        </button>
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'usuarios'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Atribuição de Usuários</span>
        </button>
      </div>

      {activeTab === 'obs' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Estrutura Organizacional (OBS)</h2>
              <p className="text-sm text-gray-600">
                Defina a hierarquia organizacional da empresa para controle de acesso granular
              </p>
            </div>
            <button
              onClick={openObsAddRootModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar Nível</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : tree.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Network className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Nenhuma estrutura definida</p>
              <p className="text-sm text-gray-500 mb-4">
                Comece criando o primeiro nível da estrutura organizacional
              </p>
              <button
                onClick={openObsAddRootModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Criar Primeiro Nível</span>
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map((node) => (
                <div key={node.id} className="group">
                  <ObsTreeNode
                    node={node}
                    level={0}
                    onSelect={selectNode}
                    onEdit={openObsEditModal}
                    onDelete={handleDeleteObs}
                    onAddChild={openObsAddChildModal}
                    onAssignManager={openManagerModal}
                    selectedId={selectedNode?.id || null}
                    showManagerBadge={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'perfis' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Perfis de Acesso</h2>
              <div className="flex gap-2">
                {profiles.length === 0 && (
                  <button
                    onClick={handleCreateDefaultProfiles}
                    className="px-3 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Criar Padrões
                  </button>
                )}
                <button
                  onClick={openProfileAddModal}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {profiles.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                <Shield className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">Nenhum perfil criado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => handleSelectProfile(profile)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                      selectedProfile?.id === profile.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: profile.cor }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{profile.nome}</p>
                        <p className="text-xs text-gray-500">{profile.codigo}</p>
                      </div>
                      {profile.isSystem && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          Sistema
                        </span>
                      )}
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openProfileEditModal(profile);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600" />
                        </button>
                        {!profile.isSystem && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProfile(profile);
                            }}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Permissões {selectedProfile && `- ${selectedProfile.nome}`}
              </h2>
              {selectedProfile && (
                <button
                  onClick={handleSavePermissions}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Salvar Permissões</span>
                </button>
              )}
            </div>

            {!selectedProfile ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecione um perfil para configurar suas permissões</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module} className="border border-gray-200 rounded-lg">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">
                        {MODULE_LABELS[module] || module}
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {perms.map((perm) => (
                        <div key={perm.permissionCode} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{perm.action}</p>
                            <p className="text-xs text-gray-500">{perm.description}</p>
                          </div>
                          <select
                            value={selectedPermissions[perm.permissionCode] || 'none'}
                            onChange={(e) => handlePermissionChange(perm.permissionCode, e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="none">Sem Acesso</option>
                            <option value="read">Leitura</option>
                            <option value="write">Escrita</option>
                            <option value="admin">Administrador</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usuarios' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Atribuição de Perfis a Usuários</h2>
              <p className="text-sm text-gray-600">
                Gerencie quais perfis de acesso cada usuário possui
              </p>
            </div>
          </div>

          {usuarios.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum usuário encontrado nesta empresa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuário</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">E-mail</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Perfil Atual</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Novo Perfil</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {usuario.nome.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{usuario.nome}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{usuario.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {usuario.perfilAcesso}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          defaultValue=""
                        >
                          <option value="">Selecionar perfil...</option>
                          {profiles.map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.nome}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                          Atribuir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showObsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingObs ? 'Editar Nível' : parentObs ? `Adicionar Filho em "${parentObs.nome}"` : 'Adicionar Nível Raiz'}
              </h3>
              <button
                onClick={() => {
                  setShowObsModal(false);
                  setEditingObs(null);
                  setParentObs(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={obsForm.nome}
                  onChange={(e) => setObsForm({ ...obsForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Diretoria de Engenharia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={obsForm.codigo}
                  onChange={(e) => setObsForm({ ...obsForm, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: DIR-ENG"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={obsForm.descricao}
                  onChange={(e) => setObsForm({ ...obsForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descrição do nível organizacional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowObsModal(false);
                  setEditingObs(null);
                  setParentObs(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingObs ? handleUpdateObs : handleCreateObs}
                disabled={!obsForm.nome}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingObs ? 'Salvar' : 'Criar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProfile ? 'Editar Perfil' : 'Novo Perfil de Acesso'}
              </h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setEditingProfile(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={profileForm.nome}
                  onChange={(e) => setProfileForm({ ...profileForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Gerente de Projeto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={profileForm.codigo}
                  onChange={(e) => setProfileForm({ ...profileForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: GERENTE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Camada de Governança
                </label>
                <select
                  value={profileForm.camadaGovernanca}
                  onChange={(e) => setProfileForm({ ...profileForm, camadaGovernanca: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecionar...</option>
                  {CAMADA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={profileForm.cor}
                    onChange={(e) => setProfileForm({ ...profileForm, cor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={profileForm.cor}
                    onChange={(e) => setProfileForm({ ...profileForm, cor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={profileForm.descricao}
                  onChange={(e) => setProfileForm({ ...profileForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descrição do perfil de acesso"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setEditingProfile(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                disabled={!profileForm.nome || !profileForm.codigo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingProfile ? 'Salvar' : 'Criar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showManagerModal && managerNode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Atribuir Responsible Manager
              </h3>
              <button
                onClick={() => {
                  setShowManagerModal(false);
                  setManagerNode(null);
                  setSelectedManagerId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Nível OBS:</strong> {managerNode.nome}
                  {managerNode.codigo && <span className="ml-1">({managerNode.codigo})</span>}
                </p>
                {managerNode.responsibleManager && (
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Responsável atual:</strong> {managerNode.responsibleManager.nome}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecionar Responsible Manager
                </label>
                <select
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nenhum (remover responsável)</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.nome} - {usuario.email}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  O Responsible Manager terá acesso aos projetos vinculados a este nível da OBS.
                </p>
              </div>

              {managerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{managerError}</p>
                  <p className="text-xs text-red-600 mt-1">
                    Execute o SQL no Supabase para adicionar o campo responsible_manager_id.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowManagerModal(false);
                  setManagerNode(null);
                  setSelectedManagerId('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignManager}
                disabled={assigningManager}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {assigningManager ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <UserCheck className="w-5 h-5" />
                )}
                <span>Atribuir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && nodeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Excluir Estrutura
                </h3>
                <p className="text-sm text-gray-500">Esta ação não pode ser desfeita</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{nodeToDelete.nome}</p>
                {nodeToDelete.codigo && (
                  <p className="text-sm text-gray-600">Código: {nodeToDelete.codigo}</p>
                )}
                {nodeToDelete.children && nodeToDelete.children.length > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {nodeToDelete.children.length} item(ns) filho(s) também serão excluídos
                  </p>
                )}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Ao excluir este nível da estrutura organizacional, 
                  todos os itens filhos também serão removidos permanentemente.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setNodeToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteObs}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5" />
                )}
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
