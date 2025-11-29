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
  Layers,
  GitBranch,
} from 'lucide-react';
import { useObsStore } from '../stores/obsStore';
import { useProfileStore } from '../stores/profileStore';
import { empresaService } from '../services/empresaService';
import { userService } from '../services/userService';
import { obsService, type ObsNode } from '../services/obsService';
import { profileService, type AccessProfile } from '../services/profileService';
import { hierarchyService, type HierarchyLevel } from '../services/hierarchyService';
import { organizationalUnitService, type OrganizationalUnit, UNIT_TYPES } from '../services/organizationalUnitService';
import { useToast, ConfirmDialog } from '../components/ui';

type TabType = 'obs' | 'perfis' | 'usuarios' | 'hierarquias' | 'unidades';

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

interface OrgUnitTreeItemProps {
  unit: OrganizationalUnit;
  level: number;
  onEdit: (unit: OrganizationalUnit) => void;
  onDelete: (unit: OrganizationalUnit) => void;
  onAddChild: (unit: OrganizationalUnit) => void;
}

function OrgUnitTreeItem({ unit, level, onEdit, onDelete, onAddChild }: OrgUnitTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = unit.children && unit.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        style={{ marginLeft: `${level * 24}px` }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-200 rounded"
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        <div
          className="w-3 h-10 rounded"
          style={{ backgroundColor: unit.cor }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{unit.nome}</span>
            {unit.sigla && (
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{unit.sigla}</span>
            )}
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded capitalize">{unit.tipo}</span>
          </div>
          {unit.descricao && (
            <p className="text-sm text-gray-600 mt-1">{unit.descricao}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddChild(unit)}
            className="p-2 hover:bg-blue-100 rounded text-blue-600"
            title="Adicionar subunidade"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(unit)}
            className="p-2 hover:bg-gray-200 rounded text-gray-600"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(unit)}
            className="p-2 hover:bg-red-100 rounded text-red-600"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div className="mt-2">
          {unit.children!.map((child) => (
            <OrgUnitTreeItem
              key={child.id}
              unit={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
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
  const toast = useToast();

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
  const [selectedProfiles, setSelectedProfiles] = useState<Record<string, string>>({});
  const [assigningProfile, setAssigningProfile] = useState<string | null>(null);
  const [assignedProfiles, setAssignedProfiles] = useState<Record<string, { profileId: string; profileName: string; isPrimary: boolean }[]>>({});

  const [showDeleteProfileModal, setShowDeleteProfileModal] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<AccessProfile | null>(null);
  const [showDefaultProfilesModal, setShowDefaultProfilesModal] = useState(false);
  const [creatingDefaultProfiles, setCreatingDefaultProfiles] = useState(false);
  const [showRemoveAssignmentModal, setShowRemoveAssignmentModal] = useState(false);
  const [assignmentToRemove, setAssignmentToRemove] = useState<{ usuarioId: string; profileId: string; profileName: string; userName: string } | null>(null);
  const [removingAssignment, setRemovingAssignment] = useState(false);

  const [hierarchyLevels, setHierarchyLevels] = useState<HierarchyLevel[]>([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  const [showHierarchyModal, setShowHierarchyModal] = useState(false);
  const [editingHierarchy, setEditingHierarchy] = useState<HierarchyLevel | null>(null);
  const [hierarchyForm, setHierarchyForm] = useState({ nome: '', codigo: '', descricao: '', cor: '#3B82F6' });
  const [showDeleteHierarchyModal, setShowDeleteHierarchyModal] = useState(false);
  const [hierarchyToDelete, setHierarchyToDelete] = useState<HierarchyLevel | null>(null);
  const [deletingHierarchy, setDeletingHierarchy] = useState(false);
  const [creatingDefaultHierarchies, setCreatingDefaultHierarchies] = useState(false);

  const [orgUnits, setOrgUnits] = useState<OrganizationalUnit[]>([]);
  const [orgUnitsLoading, setOrgUnitsLoading] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<OrganizationalUnit | null>(null);
  const [parentUnit, setParentUnit] = useState<OrganizationalUnit | null>(null);
  const [unitForm, setUnitForm] = useState({ nome: '', codigo: '', sigla: '', descricao: '', tipo: 'departamento', cor: '#6366F1' });
  const [showDeleteUnitModal, setShowDeleteUnitModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<OrganizationalUnit | null>(null);
  const [deletingUnit, setDeletingUnit] = useState(false);
  const [creatingDefaultUnits, setCreatingDefaultUnits] = useState(false);

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
      loadAssignedProfiles();
      loadHierarchyLevels();
      loadOrgUnits();
    }
  }, [empresaId]);

  const loadHierarchyLevels = async () => {
    if (!empresaId) return;
    setHierarchyLoading(true);
    try {
      const data = await hierarchyService.getByEmpresa(empresaId);
      setHierarchyLevels(data);
    } catch (error) {
      console.error('Error loading hierarchy levels:', error);
    } finally {
      setHierarchyLoading(false);
    }
  };

  const loadOrgUnits = async () => {
    if (!empresaId) return;
    setOrgUnitsLoading(true);
    try {
      const data = await organizationalUnitService.getTree(empresaId);
      setOrgUnits(data);
    } catch (error) {
      console.error('Error loading organizational units:', error);
    } finally {
      setOrgUnitsLoading(false);
    }
  };

  const loadAssignedProfiles = async () => {
    if (!empresaId) return;
    try {
      const data = await profileService.getAssignedProfilesByEmpresa(empresaId);
      setAssignedProfiles(data);
    } catch (error) {
      console.error('Error loading assigned profiles:', error);
    }
  };

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
      toast.warning('Perfis do sistema não podem ser excluídos.');
      return;
    }
    setProfileToDelete(profile);
    setShowDeleteProfileModal(true);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      await deleteProfile(profileToDelete.id);
      toast.success(`Perfil "${profileToDelete.nome}" excluído com sucesso!`);
      setShowDeleteProfileModal(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Erro ao excluir perfil.');
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
      toast.success('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Erro ao salvar permissões.');
    }
  };

  const handleCreateDefaultProfiles = async () => {
    if (!empresaId) return;
    setShowDefaultProfilesModal(true);
  };

  const confirmCreateDefaultProfiles = async () => {
    if (!empresaId) return;
    setCreatingDefaultProfiles(true);
    try {
      await createDefaultProfiles(empresaId);
      toast.success('Perfis padrão criados com sucesso!');
      setShowDefaultProfilesModal(false);
    } catch (error) {
      console.error('Error creating default profiles:', error);
      toast.error('Erro ao criar perfis padrão.');
    } finally {
      setCreatingDefaultProfiles(false);
    }
  };

  const handleAssignProfileToUser = async (usuarioId: string) => {
    const profileId = selectedProfiles[usuarioId];
    if (!profileId) {
      toast.warning('Selecione um perfil para atribuir.');
      return;
    }

    setAssigningProfile(usuarioId);
    try {
      await profileService.assignProfileToUser({
        usuarioId,
        profileId,
        isPrimary: true,
      });
      setSelectedProfiles(prev => ({ ...prev, [usuarioId]: '' }));
      await loadAssignedProfiles();
      toast.success('Perfil atribuído com sucesso!');
    } catch (error) {
      console.error('Error assigning profile:', error);
      toast.error('Erro ao atribuir perfil. Verifique as permissões.');
    } finally {
      setAssigningProfile(null);
    }
  };

  const handleRemoveAssignment = (usuarioId: string, profileId: string, profileName: string, userName: string) => {
    setAssignmentToRemove({ usuarioId, profileId, profileName, userName });
    setShowRemoveAssignmentModal(true);
  };

  const confirmRemoveAssignment = async () => {
    if (!assignmentToRemove) return;
    setRemovingAssignment(true);
    try {
      await profileService.removeProfileFromUser(assignmentToRemove.usuarioId, assignmentToRemove.profileId);
      await loadAssignedProfiles();
      toast.success(`Perfil "${assignmentToRemove.profileName}" removido com sucesso!`);
      setShowRemoveAssignmentModal(false);
      setAssignmentToRemove(null);
    } catch (error) {
      console.error('Error removing profile assignment:', error);
      toast.error('Erro ao remover atribuição de perfil.');
    } finally {
      setRemovingAssignment(false);
    }
  };

  const openHierarchyAddModal = () => {
    setEditingHierarchy(null);
    setHierarchyForm({ nome: '', codigo: '', descricao: '', cor: '#3B82F6' });
    setShowHierarchyModal(true);
  };

  const openHierarchyEditModal = (level: HierarchyLevel) => {
    setEditingHierarchy(level);
    setHierarchyForm({
      nome: level.nome,
      codigo: level.codigo,
      descricao: level.descricao || '',
      cor: level.cor,
    });
    setShowHierarchyModal(true);
  };

  const handleCreateHierarchy = async () => {
    if (!empresaId || !hierarchyForm.nome || !hierarchyForm.codigo) return;
    try {
      await hierarchyService.create({
        empresaId,
        nome: hierarchyForm.nome,
        codigo: hierarchyForm.codigo,
        descricao: hierarchyForm.descricao || undefined,
        cor: hierarchyForm.cor,
      });
      await loadHierarchyLevels();
      setShowHierarchyModal(false);
      setHierarchyForm({ nome: '', codigo: '', descricao: '', cor: '#3B82F6' });
      toast.success('Nível hierárquico criado com sucesso!');
    } catch (error) {
      console.error('Error creating hierarchy level:', error);
      toast.error('Erro ao criar nível hierárquico.');
    }
  };

  const handleUpdateHierarchy = async () => {
    if (!editingHierarchy || !hierarchyForm.nome) return;
    try {
      await hierarchyService.update(editingHierarchy.id, {
        nome: hierarchyForm.nome,
        codigo: hierarchyForm.codigo,
        descricao: hierarchyForm.descricao,
        cor: hierarchyForm.cor,
      });
      await loadHierarchyLevels();
      setShowHierarchyModal(false);
      setEditingHierarchy(null);
      setHierarchyForm({ nome: '', codigo: '', descricao: '', cor: '#3B82F6' });
      toast.success('Nível hierárquico atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating hierarchy level:', error);
      toast.error('Erro ao atualizar nível hierárquico.');
    }
  };

  const handleDeleteHierarchy = (level: HierarchyLevel) => {
    if (level.isDefault) {
      toast.warning('Níveis padrão do sistema não podem ser excluídos.');
      return;
    }
    setHierarchyToDelete(level);
    setShowDeleteHierarchyModal(true);
  };

  const confirmDeleteHierarchy = async () => {
    if (!hierarchyToDelete) return;
    setDeletingHierarchy(true);
    try {
      await hierarchyService.delete(hierarchyToDelete.id);
      await loadHierarchyLevels();
      toast.success(`Nível "${hierarchyToDelete.nome}" excluído com sucesso!`);
      setShowDeleteHierarchyModal(false);
      setHierarchyToDelete(null);
    } catch (error) {
      console.error('Error deleting hierarchy level:', error);
      toast.error('Erro ao excluir nível hierárquico.');
    } finally {
      setDeletingHierarchy(false);
    }
  };

  const handleCreateDefaultHierarchies = async () => {
    if (!empresaId) return;
    setCreatingDefaultHierarchies(true);
    try {
      await hierarchyService.createDefaults(empresaId);
      await loadHierarchyLevels();
      toast.success('Níveis hierárquicos padrão criados com sucesso!');
    } catch (error) {
      console.error('Error creating default hierarchies:', error);
      toast.error('Erro ao criar níveis padrão. Podem já existir.');
    } finally {
      setCreatingDefaultHierarchies(false);
    }
  };

  const handleMoveHierarchy = async (index: number, direction: 'up' | 'down') => {
    if (!empresaId) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= hierarchyLevels.length) return;

    const newOrder = [...hierarchyLevels];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(newIndex, 0, moved);

    try {
      await hierarchyService.reorder(empresaId, newOrder.map(h => h.id));
      setHierarchyLevels(newOrder);
    } catch (error) {
      console.error('Error reordering hierarchy levels:', error);
      toast.error('Erro ao reordenar níveis.');
    }
  };

  const openUnitAddModal = (parent?: OrganizationalUnit) => {
    setEditingUnit(null);
    setParentUnit(parent || null);
    setUnitForm({ nome: '', codigo: '', sigla: '', descricao: '', tipo: 'departamento', cor: '#6366F1' });
    setShowUnitModal(true);
  };

  const openUnitEditModal = (unit: OrganizationalUnit) => {
    setEditingUnit(unit);
    setParentUnit(null);
    setUnitForm({
      nome: unit.nome,
      codigo: unit.codigo || '',
      sigla: unit.sigla || '',
      descricao: unit.descricao || '',
      tipo: unit.tipo,
      cor: unit.cor,
    });
    setShowUnitModal(true);
  };

  const handleCreateUnit = async () => {
    if (!empresaId || !unitForm.nome) return;
    try {
      await organizationalUnitService.create({
        empresaId,
        parentId: parentUnit?.id || null,
        nome: unitForm.nome,
        codigo: unitForm.codigo || undefined,
        sigla: unitForm.sigla || undefined,
        descricao: unitForm.descricao || undefined,
        tipo: unitForm.tipo,
        cor: unitForm.cor,
      });
      await loadOrgUnits();
      setShowUnitModal(false);
      setUnitForm({ nome: '', codigo: '', sigla: '', descricao: '', tipo: 'departamento', cor: '#6366F1' });
      setParentUnit(null);
      toast.success('Unidade/Setor criado com sucesso!');
    } catch (error) {
      console.error('Error creating organizational unit:', error);
      toast.error('Erro ao criar unidade/setor.');
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit || !unitForm.nome) return;
    try {
      await organizationalUnitService.update(editingUnit.id, {
        nome: unitForm.nome,
        codigo: unitForm.codigo,
        sigla: unitForm.sigla,
        descricao: unitForm.descricao,
        tipo: unitForm.tipo,
        cor: unitForm.cor,
      });
      await loadOrgUnits();
      setShowUnitModal(false);
      setEditingUnit(null);
      setUnitForm({ nome: '', codigo: '', sigla: '', descricao: '', tipo: 'departamento', cor: '#6366F1' });
      toast.success('Unidade/Setor atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating organizational unit:', error);
      toast.error('Erro ao atualizar unidade/setor.');
    }
  };

  const handleDeleteUnit = (unit: OrganizationalUnit) => {
    setUnitToDelete(unit);
    setShowDeleteUnitModal(true);
  };

  const confirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setDeletingUnit(true);
    try {
      await organizationalUnitService.delete(unitToDelete.id);
      await loadOrgUnits();
      toast.success(`Unidade "${unitToDelete.nome}" excluída com sucesso!`);
      setShowDeleteUnitModal(false);
      setUnitToDelete(null);
    } catch (error) {
      console.error('Error deleting organizational unit:', error);
      toast.error('Erro ao excluir unidade/setor.');
    } finally {
      setDeletingUnit(false);
    }
  };

  const handleCreateDefaultUnits = async () => {
    if (!empresaId) return;
    setCreatingDefaultUnits(true);
    try {
      await organizationalUnitService.createDefaults(empresaId);
      await loadOrgUnits();
      toast.success('Unidades padrão criadas com sucesso!');
    } catch (error) {
      console.error('Error creating default units:', error);
      toast.error('Erro ao criar unidades padrão. Podem já existir.');
    } finally {
      setCreatingDefaultUnits(false);
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
        <button
          onClick={() => setActiveTab('hierarquias')}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'hierarquias'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Níveis Hierárquicos</span>
        </button>
        <button
          onClick={() => setActiveTab('unidades')}
          className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'unidades'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <GitBranch className="w-5 h-5" />
          <span>Unidades/Setores</span>
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
                        <div className="flex flex-wrap gap-1">
                          {assignedProfiles[usuario.id]?.length > 0 ? (
                            assignedProfiles[usuario.id].map((ap, idx) => (
                              <span 
                                key={idx}
                                className={`group inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${
                                  ap.isPrimary 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {ap.profileName}
                                {ap.isPrimary && <span className="text-xs">(Principal)</span>}
                                <button
                                  onClick={() => handleRemoveAssignment(usuario.id, ap.profileId, ap.profileName, usuario.nome)}
                                  className="ml-1 p-0.5 rounded hover:bg-red-200 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Remover perfil"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-sm italic">
                              Nenhum perfil atribuído
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          value={selectedProfiles[usuario.id] || ''}
                          onChange={(e) => setSelectedProfiles(prev => ({ ...prev, [usuario.id]: e.target.value }))}
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
                        <button 
                          onClick={() => handleAssignProfileToUser(usuario.id)}
                          disabled={!selectedProfiles[usuario.id] || assigningProfile === usuario.id}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {assigningProfile === usuario.id ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : null}
                          <span>Atribuir</span>
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

      {activeTab === 'hierarquias' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Níveis Hierárquicos</h2>
              <p className="text-sm text-gray-600">
                Defina os níveis verticais da estrutura organizacional (Diretoria, Gerência, Coordenação, etc.)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateDefaultHierarchies}
                disabled={creatingDefaultHierarchies}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {creatingDefaultHierarchies ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                <span>Criar Padrões</span>
              </button>
              <button
                onClick={openHierarchyAddModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Nível</span>
              </button>
            </div>
          </div>

          {hierarchyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : hierarchyLevels.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhum nível hierárquico cadastrado</p>
              <button
                onClick={handleCreateDefaultHierarchies}
                disabled={creatingDefaultHierarchies}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Níveis Padrão
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {hierarchyLevels.map((level, index) => (
                <div
                  key={level.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveHierarchy(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ChevronRight className="w-4 h-4 -rotate-90 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleMoveHierarchy(index, 'down')}
                      disabled={index === hierarchyLevels.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ChevronRight className="w-4 h-4 rotate-90 text-gray-600" />
                    </button>
                  </div>
                  <div
                    className="w-4 h-12 rounded"
                    style={{ backgroundColor: level.cor }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{level.nome}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{level.codigo}</span>
                      {level.isDefault && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Padrão</span>
                      )}
                    </div>
                    {level.descricao && (
                      <p className="text-sm text-gray-600 mt-1">{level.descricao}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openHierarchyEditModal(level)}
                      className="p-2 hover:bg-gray-200 rounded text-gray-600"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHierarchy(level)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'unidades' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Unidades e Setores</h2>
              <p className="text-sm text-gray-600">
                Defina as áreas/departamentos da empresa (Comercial, Logística, RH, etc.)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateDefaultUnits}
                disabled={creatingDefaultUnits}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {creatingDefaultUnits ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
                <span>Criar Padrões</span>
              </button>
              <button
                onClick={() => openUnitAddModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Unidade</span>
              </button>
            </div>
          </div>

          {orgUnitsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orgUnits.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Nenhuma unidade/setor cadastrado</p>
              <button
                onClick={handleCreateDefaultUnits}
                disabled={creatingDefaultUnits}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Unidades Padrão
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orgUnits.map((unit) => (
                <OrgUnitTreeItem
                  key={unit.id}
                  unit={unit}
                  level={0}
                  onEdit={openUnitEditModal}
                  onDelete={handleDeleteUnit}
                  onAddChild={(parent) => openUnitAddModal(parent)}
                />
              ))}
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

      <ConfirmDialog
        isOpen={showDeleteProfileModal}
        onClose={() => {
          setShowDeleteProfileModal(false);
          setProfileToDelete(null);
        }}
        onConfirm={confirmDeleteProfile}
        title="Excluir Perfil"
        message={
          <p>
            Deseja excluir o perfil <strong>"{profileToDelete?.nome}"</strong>? 
            Esta ação não pode ser desfeita.
          </p>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
      />

      <ConfirmDialog
        isOpen={showDefaultProfilesModal}
        onClose={() => setShowDefaultProfilesModal(false)}
        onConfirm={confirmCreateDefaultProfiles}
        title="Criar Perfis Padrão"
        message="Isso irá criar os perfis padrão do sistema para esta empresa. Deseja continuar?"
        confirmText="Criar Perfis"
        cancelText="Cancelar"
        type="info"
        loading={creatingDefaultProfiles}
      />

      <ConfirmDialog
        isOpen={showRemoveAssignmentModal}
        onClose={() => {
          setShowRemoveAssignmentModal(false);
          setAssignmentToRemove(null);
        }}
        onConfirm={confirmRemoveAssignment}
        title="Remover Atribuição de Perfil"
        message={
          <p>
            Deseja remover o perfil <strong>"{assignmentToRemove?.profileName}"</strong> do usuário <strong>{assignmentToRemove?.userName}</strong>?
          </p>
        }
        confirmText="Remover"
        cancelText="Cancelar"
        type="warning"
        loading={removingAssignment}
      />

      <ConfirmDialog
        isOpen={showDeleteHierarchyModal}
        onClose={() => {
          setShowDeleteHierarchyModal(false);
          setHierarchyToDelete(null);
        }}
        onConfirm={confirmDeleteHierarchy}
        title="Excluir Nível Hierárquico"
        message={
          <p>
            Deseja excluir o nível <strong>"{hierarchyToDelete?.nome}"</strong>? 
            Esta ação não pode ser desfeita.
          </p>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deletingHierarchy}
      />

      <ConfirmDialog
        isOpen={showDeleteUnitModal}
        onClose={() => {
          setShowDeleteUnitModal(false);
          setUnitToDelete(null);
        }}
        onConfirm={confirmDeleteUnit}
        title="Excluir Unidade/Setor"
        message={
          <p>
            Deseja excluir a unidade <strong>"{unitToDelete?.nome}"</strong>? 
            Todas as subunidades também serão removidas.
          </p>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        loading={deletingUnit}
      />

      {showHierarchyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingHierarchy ? 'Editar Nível Hierárquico' : 'Novo Nível Hierárquico'}
              </h3>
              <button
                onClick={() => {
                  setShowHierarchyModal(false);
                  setEditingHierarchy(null);
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
                  value={hierarchyForm.nome}
                  onChange={(e) => setHierarchyForm({ ...hierarchyForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Gerência"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={hierarchyForm.codigo}
                  onChange={(e) => setHierarchyForm({ ...hierarchyForm, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: GER"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hierarchyForm.cor}
                    onChange={(e) => setHierarchyForm({ ...hierarchyForm, cor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={hierarchyForm.cor}
                    onChange={(e) => setHierarchyForm({ ...hierarchyForm, cor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={hierarchyForm.descricao}
                  onChange={(e) => setHierarchyForm({ ...hierarchyForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descrição do nível hierárquico"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowHierarchyModal(false);
                  setEditingHierarchy(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingHierarchy ? handleUpdateHierarchy : handleCreateHierarchy}
                disabled={!hierarchyForm.nome || !hierarchyForm.codigo}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingHierarchy ? 'Salvar' : 'Criar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingUnit ? 'Editar Unidade/Setor' : parentUnit ? `Nova Subunidade de "${parentUnit.nome}"` : 'Nova Unidade/Setor'}
              </h3>
              <button
                onClick={() => {
                  setShowUnitModal(false);
                  setEditingUnit(null);
                  setParentUnit(null);
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
                  value={unitForm.nome}
                  onChange={(e) => setUnitForm({ ...unitForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Unidade Comercial"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sigla
                  </label>
                  <input
                    type="text"
                    value={unitForm.sigla}
                    onChange={(e) => setUnitForm({ ...unitForm, sigla: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: COM"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código
                  </label>
                  <input
                    type="text"
                    value={unitForm.codigo}
                    onChange={(e) => setUnitForm({ ...unitForm, codigo: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: COM-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={unitForm.tipo}
                  onChange={(e) => setUnitForm({ ...unitForm, tipo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {UNIT_TYPES.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
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
                    value={unitForm.cor}
                    onChange={(e) => setUnitForm({ ...unitForm, cor: e.target.value })}
                    className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={unitForm.cor}
                    onChange={(e) => setUnitForm({ ...unitForm, cor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={unitForm.descricao}
                  onChange={(e) => setUnitForm({ ...unitForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descrição da unidade/setor"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowUnitModal(false);
                  setEditingUnit(null);
                  setParentUnit(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingUnit ? handleUpdateUnit : handleCreateUnit}
                disabled={!unitForm.nome}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>{editingUnit ? 'Salvar' : 'Criar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
