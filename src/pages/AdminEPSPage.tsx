import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FolderTree,
  Users,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  ChevronDown,
  Save,
  X,
  UserCheck,
  Shield,
  Building2,
  Network,
  Link,
  Unlink,
  Briefcase,
  Layers,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { empresaService } from '../services/empresaService';
import { userService } from '../services/userService';
import { epsService, type EpsNode } from '../services/epsService';
import { epsCreatorService, type EpsCreator } from '../services/epsCreatorService';
import { userObsAssignmentService, type UserObsAssignment } from '../services/userObsAssignmentService';
import { obsService, type ObsNode } from '../services/obsService';
import { profileService } from '../services/profileService';

interface AccessProfile {
  id: string;
  nome: string;
}
import { useToast, ConfirmDialog } from '../components/ui';

type TabType = 'eps' | 'creators' | 'assignments';

interface EpsTreeNodeProps {
  node: EpsNode;
  level: number;
  onSelect: (node: EpsNode) => void;
  onEdit: (node: EpsNode) => void;
  onDelete: (node: EpsNode) => void;
  onAddChild: (node: EpsNode) => void;
  onAssignManager: (node: EpsNode) => void;
  onUpdateWeight: (node: EpsNode, weight: number) => void;
  selectedId: string | null;
}

function EpsTreeNode({ node, level, onSelect, onEdit, onDelete, onAddChild, onAssignManager, onUpdateWeight, selectedId }: EpsTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightValue, setWeightValue] = useState(((node.pesoEstimado || 1) * 100).toFixed(1));
  const hasChildren = node.children && node.children.length > 0;
  const isEps = node.nivel === 0;
  const isWbs = node.nivel > 0;

  const childrenWeightSum = hasChildren 
    ? node.children!.reduce((sum, child) => sum + (child.pesoEstimado || 1), 0)
    : 0;
  const weightValid = !hasChildren || Math.abs(childrenWeightSum - 1) < 0.001;

  const handleWeightSave = () => {
    const newWeight = parseFloat(weightValue) / 100;
    if (!isNaN(newWeight) && newWeight >= 0 && newWeight <= 1) {
      onUpdateWeight(node, newWeight);
    }
    setEditingWeight(false);
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          selectedId === node.id 
            ? isEps ? 'bg-purple-100 border border-purple-300' : 'bg-blue-100 border border-blue-300'
            : 'hover:bg-gray-100'
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
        <div className="w-3 h-8 rounded" style={{ backgroundColor: node.cor }} />
        
        {isEps ? (
          <Briefcase className="w-4 h-4 text-purple-600" />
        ) : (
          <Layers className="w-4 h-4 text-blue-600" />
        )}
        
        <div className="flex-1 flex items-center gap-2">
          <span className="font-medium text-gray-900">{node.nome}</span>
          <span className="text-xs text-gray-500">({node.codigo})</span>
          
          {isEps ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              <Briefcase className="w-3 h-3" />
              PROJETO (EPS)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
              <Layers className="w-3 h-3" />
              WBS
            </span>
          )}
          
          {node.responsibleManager && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
              <Link className="w-3 h-3" />
              {node.responsibleManager.nome}
            </span>
          )}

          {isEps && hasChildren && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
              weightValid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {weightValid ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              Peso: {(childrenWeightSum * 100).toFixed(1)}%
            </span>
          )}
        </div>

        {isWbs && (
          <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
            {editingWeight ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWeightSave();
                    if (e.key === 'Escape') setEditingWeight(false);
                  }}
                />
                <span className="text-xs text-gray-500">%</span>
                <button
                  onClick={handleWeightSave}
                  className="p-1 hover:bg-green-100 rounded text-green-600"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingWeight(true)}
                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700"
                title="Editar peso estimado"
              >
                {((node.pesoEstimado || 1) * 100).toFixed(1)}%
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEps && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignManager(node);
              }}
              className={`p-1 hover:bg-green-100 rounded ${node.responsibleManager ? 'text-green-600' : 'text-gray-400'}`}
              title="Vincular Responsible Manager (OBS)"
            >
              <Link className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node);
            }}
            className="p-1 hover:bg-blue-100 rounded text-blue-600"
            title={isEps ? "Adicionar WBS" : "Adicionar Subnó WBS"}
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
            <EpsTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onAssignManager={onAssignManager}
              onUpdateWeight={onUpdateWeight}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminEPSPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const empresaId = searchParams.get('empresaId');
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('eps');
  const [empresa, setEmpresa] = useState<{ id: string; nome: string } | null>(null);
  const [usuarios, setUsuarios] = useState<Array<{
    id: string;
    nome: string;
    email: string;
    perfilAcesso: string;
  }>>([]);

  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [selectedEps, setSelectedEps] = useState<EpsNode | null>(null);

  const [creators, setCreators] = useState<EpsCreator[]>([]);
  const [creatorsLoading, setCreatorsLoading] = useState(false);

  const [assignments, setAssignments] = useState<UserObsAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  const [obsNodes, setObsNodes] = useState<ObsNode[]>([]);
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);

  const [showEpsModal, setShowEpsModal] = useState(false);
  const [editingEps, setEditingEps] = useState<EpsNode | null>(null);
  const [parentEps, setParentEps] = useState<EpsNode | null>(null);
  const [epsForm, setEpsForm] = useState({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
  const [availableWeight, setAvailableWeight] = useState<number>(100);

  const [showDeleteEpsModal, setShowDeleteEpsModal] = useState(false);
  const [epsToDelete, setEpsToDelete] = useState<EpsNode | null>(null);
  const [deletingEps, setDeletingEps] = useState(false);

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [epsToLink, setEpsToLink] = useState<EpsNode | null>(null);
  const [selectedObsId, setSelectedObsId] = useState<string>('');
  const [linking, setLinking] = useState(false);

  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [creatorPermissions, setCreatorPermissions] = useState({
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canAssignResponsible: true,
  });

  const [showDeleteCreatorModal, setShowDeleteCreatorModal] = useState(false);
  const [creatorToDelete, setCreatorToDelete] = useState<EpsCreator | null>(null);
  const [deletingCreator, setDeletingCreator] = useState(false);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    usuarioId: '',
    obsNodeId: '',
    profileId: '',
    isPrimary: false,
  });

  const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<UserObsAssignment | null>(null);
  const [deletingAssignment, setDeletingAssignment] = useState(false);

  useEffect(() => {
    if (empresaId) {
      loadEmpresa();
      loadUsuarios();
      loadEpsTree();
      loadCreators();
      loadAssignments();
      loadObsNodes();
      loadProfiles();
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

  const loadEpsTree = async () => {
    if (!empresaId) return;
    setEpsLoading(true);
    try {
      const data = await epsService.getTree(empresaId);
      setEpsTree(data);
    } catch (error) {
      console.error('Error loading EPS tree:', error);
    } finally {
      setEpsLoading(false);
    }
  };

  const loadCreators = async () => {
    if (!empresaId) return;
    setCreatorsLoading(true);
    try {
      const data = await epsCreatorService.getByEmpresa(empresaId);
      setCreators(data);
    } catch (error) {
      console.error('Error loading EPS creators:', error);
    } finally {
      setCreatorsLoading(false);
    }
  };

  const loadAssignments = async () => {
    if (!empresaId) return;
    setAssignmentsLoading(true);
    try {
      const data = await userObsAssignmentService.getByEmpresa(empresaId);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading OBS assignments:', error);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const loadObsNodes = async () => {
    if (!empresaId) return;
    try {
      const data = await obsService.getByEmpresa(empresaId);
      setObsNodes(data);
    } catch (error) {
      console.error('Error loading OBS nodes:', error);
    }
  };

  const loadProfiles = async () => {
    if (!empresaId) return;
    try {
      const data = await profileService.getProfilesByEmpresa(empresaId);
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleCreateEps = async () => {
    if (!empresaId || !epsForm.codigo || !epsForm.nome) return;
    try {
      const pesoEstimado = parseFloat(epsForm.pesoEstimado) / 100;
      await epsService.create({
        empresaId,
        parentId: parentEps?.id || null,
        codigo: epsForm.codigo,
        nome: epsForm.nome,
        descricao: epsForm.descricao || undefined,
        cor: epsForm.cor,
        pesoEstimado: parentEps ? pesoEstimado : 1.0,
      });
      toast.success(parentEps ? 'WBS criado com sucesso!' : 'Projeto (EPS) criado com sucesso!');
      setShowEpsModal(false);
      setEpsForm({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
      setParentEps(null);
      loadEpsTree();
    } catch (error) {
      console.error('Error creating EPS node:', error);
      toast.error('Erro ao criar nó');
    }
  };

  const handleUpdateEps = async () => {
    if (!editingEps || !epsForm.codigo || !epsForm.nome) return;
    try {
      const pesoEstimado = parseFloat(epsForm.pesoEstimado) / 100;
      await epsService.update(editingEps.id, {
        codigo: epsForm.codigo,
        nome: epsForm.nome,
        descricao: epsForm.descricao || null,
        cor: epsForm.cor,
        pesoEstimado: editingEps.nivel > 0 ? pesoEstimado : 1.0,
      });
      toast.success('Nó atualizado!');
      setShowEpsModal(false);
      setEditingEps(null);
      setEpsForm({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
      loadEpsTree();
    } catch (error) {
      console.error('Error updating EPS node:', error);
      toast.error('Erro ao atualizar nó');
    }
  };

  const handleUpdateWeight = async (node: EpsNode, weight: number) => {
    try {
      await epsService.update(node.id, { pesoEstimado: weight });
      toast.success('Peso atualizado!');
      loadEpsTree();
    } catch (error) {
      console.error('Error updating weight:', error);
      toast.error('Erro ao atualizar peso');
    }
  };

  const handleDeleteEps = (node: EpsNode) => {
    setEpsToDelete(node);
    setShowDeleteEpsModal(true);
  };

  const confirmDeleteEps = async () => {
    if (!epsToDelete) return;
    setDeletingEps(true);
    try {
      await epsService.delete(epsToDelete.id);
      toast.success(epsToDelete.nivel === 0 ? 'Projeto excluído!' : 'WBS excluído!');
      setShowDeleteEpsModal(false);
      setEpsToDelete(null);
      loadEpsTree();
    } catch (error) {
      console.error('Error deleting EPS node:', error);
      toast.error('Erro ao excluir');
    } finally {
      setDeletingEps(false);
    }
  };

  const openEpsEditModal = (node: EpsNode) => {
    setEditingEps(node);
    if (node.parentId) {
      const parent = findNodeById(epsTree, node.parentId);
      if (parent) {
        const currentSum = parent.children?.reduce((sum, child) => 
          sum + (child.id === node.id ? 0 : (child.pesoEstimado || 1)), 0) || 0;
        const remaining = Math.max(0, (1 - currentSum) * 100);
        setAvailableWeight(remaining);
      }
    }
    setEpsForm({
      codigo: node.codigo,
      nome: node.nome,
      descricao: node.descricao || '',
      cor: node.cor,
      pesoEstimado: ((node.pesoEstimado || 1) * 100).toFixed(1),
    });
    setShowEpsModal(true);
  };

  const findNodeById = (nodes: EpsNode[], id: string): EpsNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const openEpsAddChildModal = (parent: EpsNode) => {
    setParentEps(parent);
    setEditingEps(null);
    const currentSum = parent.children?.reduce((sum, child) => sum + (child.pesoEstimado || 1), 0) || 0;
    const remaining = Math.max(0, (1 - currentSum) * 100);
    setAvailableWeight(remaining);
    setEpsForm({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: remaining.toFixed(1) });
    setShowEpsModal(true);
  };

  const openEpsAddRootModal = () => {
    setParentEps(null);
    setEditingEps(null);
    setAvailableWeight(100);
    setEpsForm({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
    setShowEpsModal(true);
  };

  const openLinkModal = (node: EpsNode) => {
    setEpsToLink(node);
    setSelectedObsId(node.responsibleManagerId || '');
    setShowLinkModal(true);
  };

  const handleLinkResponsibleManager = async () => {
    if (!epsToLink) return;
    setLinking(true);
    try {
      await epsService.assignResponsibleManager(epsToLink.id, selectedObsId || null);
      toast.success(selectedObsId ? 'Responsible Manager vinculado!' : 'Vínculo removido!');
      setShowLinkModal(false);
      setEpsToLink(null);
      setSelectedObsId('');
      loadEpsTree();
    } catch (error) {
      console.error('Error linking responsible manager:', error);
      toast.error('Erro ao vincular Responsible Manager');
    } finally {
      setLinking(false);
    }
  };

  const handleAddCreator = async () => {
    if (!empresaId || !selectedUserId) return;
    try {
      await epsCreatorService.create({
        empresaId,
        usuarioId: selectedUserId,
        ...creatorPermissions,
      });
      toast.success('Criador de EPS adicionado!');
      setShowCreatorModal(false);
      setSelectedUserId('');
      setCreatorPermissions({
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAssignResponsible: true,
      });
      loadCreators();
    } catch (error) {
      console.error('Error adding EPS creator:', error);
      toast.error('Erro ao adicionar criador de EPS');
    }
  };

  const handleDeleteCreator = (creator: EpsCreator) => {
    setCreatorToDelete(creator);
    setShowDeleteCreatorModal(true);
  };

  const confirmDeleteCreator = async () => {
    if (!creatorToDelete) return;
    setDeletingCreator(true);
    try {
      await epsCreatorService.delete(creatorToDelete.id);
      toast.success('Criador de EPS removido!');
      setShowDeleteCreatorModal(false);
      setCreatorToDelete(null);
      loadCreators();
    } catch (error) {
      console.error('Error deleting EPS creator:', error);
      toast.error('Erro ao remover criador de EPS');
    } finally {
      setDeletingCreator(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!empresaId || !assignmentForm.usuarioId || !assignmentForm.obsNodeId) return;
    try {
      await userObsAssignmentService.create({
        empresaId,
        usuarioId: assignmentForm.usuarioId,
        obsNodeId: assignmentForm.obsNodeId,
        profileId: assignmentForm.profileId || null,
        isPrimary: assignmentForm.isPrimary,
      });
      toast.success('Atribuição de Responsible Manager criada!');
      setShowAssignmentModal(false);
      setAssignmentForm({ usuarioId: '', obsNodeId: '', profileId: '', isPrimary: false });
      loadAssignments();
    } catch (error) {
      console.error('Error adding OBS assignment:', error);
      toast.error('Erro ao criar atribuição');
    }
  };

  const handleDeleteAssignment = (assignment: UserObsAssignment) => {
    setAssignmentToDelete(assignment);
    setShowDeleteAssignmentModal(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    setDeletingAssignment(true);
    try {
      await userObsAssignmentService.delete(assignmentToDelete.id);
      toast.success('Atribuição removida!');
      setShowDeleteAssignmentModal(false);
      setAssignmentToDelete(null);
      loadAssignments();
    } catch (error) {
      console.error('Error deleting OBS assignment:', error);
      toast.error('Erro ao remover atribuição');
    } finally {
      setDeletingAssignment(false);
    }
  };

  const togglePrimary = async (assignment: UserObsAssignment) => {
    try {
      await userObsAssignmentService.update(assignment.id, { isPrimary: !assignment.isPrimary });
      toast.success(assignment.isPrimary ? 'Removido como principal' : 'Definido como principal');
      loadAssignments();
    } catch (error) {
      console.error('Error toggling primary:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const availableUsersForCreator = usuarios.filter(
    u => !creators.some(c => c.usuarioId === u.id)
  );

  const isCreatingWbs = parentEps !== null;

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'eps', label: 'Estrutura EPS/WBS', icon: <FolderTree className="w-4 h-4" /> },
    { id: 'creators', label: 'Criadores de EPS', icon: <Shield className="w-4 h-4" /> },
    { id: 'assignments', label: 'Atribuição de OBS (Responsible Manager)', icon: <UserCheck className="w-4 h-4" /> },
  ];

  if (!empresaId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Selecione uma empresa para gerenciar a EPS.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/empresas')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Empresas
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Network className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enterprise Project Structure (EPS) & WBS
            </h1>
            {empresa && (
              <p className="text-gray-600 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {empresa.nome}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Conceito Primavera P6</h3>
        <p className="text-sm text-blue-800 mb-2">
          <strong>EPS</strong> (Enterprise Project Structure) representa o <strong>PROJETO</strong> em si (nó raiz). 
          <strong> WBS</strong> (Work Breakdown Structure) representa a <strong>estrutura hierárquica de trabalho</strong> abaixo de cada projeto.
        </p>
        <p className="text-sm text-blue-800">
          Cada nó WBS possui um <strong>Peso Estimado</strong> (default 100%). A soma dos pesos dos sub-níveis deve totalizar 100% no nível do projeto para ponderar corretamente os recursos.
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'eps' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Estrutura Hierárquica de Projetos</h2>
              <p className="text-sm text-gray-600">
                Clique em <strong>+ Adicionar Projeto</strong> para criar um EPS. Dentro de cada projeto, adicione a WBS.
              </p>
            </div>
            <button
              onClick={openEpsAddRootModal}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Adicionar Projeto (EPS)
            </button>
          </div>

          {epsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : epsTree.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum projeto cadastrado.</p>
              <p className="text-sm">Clique em "Adicionar Projeto (EPS)" para começar.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {epsTree.map((node) => (
                <EpsTreeNode
                  key={node.id}
                  node={node}
                  level={0}
                  onSelect={setSelectedEps}
                  onEdit={openEpsEditModal}
                  onDelete={handleDeleteEps}
                  onAddChild={openEpsAddChildModal}
                  onAssignManager={openLinkModal}
                  onUpdateWeight={handleUpdateWeight}
                  selectedId={selectedEps?.id || null}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'creators' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Criadores de EPS</h2>
              <p className="text-sm text-gray-600">
                Apenas o ADMIN pode atribuir permissão de criação de EPS a usuários.
              </p>
            </div>
            <button
              onClick={() => setShowCreatorModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              disabled={availableUsersForCreator.length === 0}
            >
              <Plus className="w-4 h-4" />
              Adicionar Criador
            </button>
          </div>

          {creatorsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhum criador de EPS cadastrado.</p>
              <p className="text-sm">Adicione usuários para gerenciar a estrutura EPS.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {creators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{creator.usuario?.nome}</p>
                      <p className="text-sm text-gray-500">{creator.usuario?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {creator.canCreate && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">Criar</span>
                      )}
                      {creator.canEdit && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Editar</span>
                      )}
                      {creator.canDelete && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Excluir</span>
                      )}
                      {creator.canAssignResponsible && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Vincular</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCreator(creator)}
                      className="p-2 hover:bg-red-100 rounded text-red-600"
                      title="Remover permissão"
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

      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Atribuição de Responsible Manager (OBS)</h2>
              <p className="text-sm text-gray-600">
                Vincule usuários a nós OBS para determinar quais projetos eles podem visualizar.
              </p>
            </div>
            <button
              onClick={() => setShowAssignmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Atribuição
            </button>
          </div>

          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma atribuição de OBS cadastrada.</p>
              <p className="text-sm">Usuários sem atribuição não verão projetos.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Usuário</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nó OBS</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Perfil</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Principal</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{assignment.usuario?.nome}</p>
                          <p className="text-sm text-gray-500">{assignment.usuario?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          <FolderTree className="w-3 h-3" />
                          {assignment.obsNode?.nome}
                          {assignment.obsNode?.codigo && (
                            <span className="text-blue-500">({assignment.obsNode.codigo})</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {assignment.profile ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                            {assignment.profile.nome}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePrimary(assignment)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            assignment.isPrimary
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {assignment.isPrimary ? 'Sim' : 'Não'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(assignment)}
                          className="p-2 hover:bg-red-100 rounded text-red-600"
                          title="Remover atribuição"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {showEpsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingEps 
                  ? (editingEps.nivel === 0 ? 'Editar Projeto (EPS)' : 'Editar WBS')
                  : (isCreatingWbs ? `Adicionar WBS em: ${parentEps?.nome}` : 'Novo Projeto (EPS)')
                }
              </h3>
              <button onClick={() => setShowEpsModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={epsForm.codigo}
                  onChange={(e) => setEpsForm({ ...epsForm, codigo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={isCreatingWbs ? "Ex: 1, 1.1, 1.1.1" : "Ex: PRJ-001"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={epsForm.nome}
                  onChange={(e) => setEpsForm({ ...epsForm, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder={isCreatingWbs ? "Nome do item WBS" : "Nome do Projeto"}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={epsForm.descricao}
                  onChange={(e) => setEpsForm({ ...epsForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                  placeholder="Descrição opcional"
                />
              </div>
              
              {(isCreatingWbs || (editingEps && editingEps.nivel > 0)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso Estimado (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={epsForm.pesoEstimado}
                      onChange={(e) => setEpsForm({ ...epsForm, pesoEstimado: e.target.value })}
                      className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                        parseFloat(epsForm.pesoEstimado) > availableWeight 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className={`text-xs ${parseFloat(epsForm.pesoEstimado) > availableWeight ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {parseFloat(epsForm.pesoEstimado) > availableWeight 
                        ? `Peso excede o disponível! Máximo: ${availableWeight.toFixed(1)}%`
                        : `Peso disponível: ${availableWeight.toFixed(1)}%`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      A soma dos pesos dos sub-níveis deve totalizar 100% no projeto.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                <input
                  type="color"
                  value={epsForm.cor}
                  onChange={(e) => setEpsForm({ ...epsForm, cor: e.target.value })}
                  className="w-full h-10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEpsModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingEps ? handleUpdateEps : handleCreateEps}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={
                  !epsForm.codigo || 
                  !epsForm.nome || 
                  (isCreatingWbs && parseFloat(epsForm.pesoEstimado) > availableWeight) ||
                  Boolean(editingEps && editingEps.nivel > 0 && parseFloat(epsForm.pesoEstimado) > availableWeight)
                }
              >
                <Save className="w-4 h-4" />
                {editingEps ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showLinkModal && epsToLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vincular Responsible Manager</h3>
              <button onClick={() => setShowLinkModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Vinculando: <strong>{epsToLink.nome}</strong> ({epsToLink.codigo})
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nó OBS (Responsible Manager)</label>
                <select
                  value={selectedObsId}
                  onChange={(e) => setSelectedObsId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Sem vínculo --</option>
                  {obsNodes.map((obs) => (
                    <option key={obs.id} value={obs.id}>
                      {obs.nome} {obs.codigo && `(${obs.codigo})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Usuários atribuídos a este nó OBS poderão ver projetos sob este nó EPS.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              {selectedObsId && epsToLink.responsibleManagerId && (
                <button
                  onClick={() => setSelectedObsId('')}
                  className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Unlink className="w-4 h-4" />
                  Remover Vínculo
                </button>
              )}
              <button
                onClick={handleLinkResponsibleManager}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                disabled={linking}
              >
                {linking ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Link className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Adicionar Criador de EPS</h3>
              <button onClick={() => setShowCreatorModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecione um usuário</option>
                  {availableUsersForCreator.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissões</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={creatorPermissions.canCreate}
                      onChange={(e) => setCreatorPermissions({ ...creatorPermissions, canCreate: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Pode criar nós EPS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={creatorPermissions.canEdit}
                      onChange={(e) => setCreatorPermissions({ ...creatorPermissions, canEdit: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Pode editar nós EPS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={creatorPermissions.canDelete}
                      onChange={(e) => setCreatorPermissions({ ...creatorPermissions, canDelete: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Pode excluir nós EPS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={creatorPermissions.canAssignResponsible}
                      onChange={(e) => setCreatorPermissions({ ...creatorPermissions, canAssignResponsible: e.target.checked })}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">Pode vincular Responsible Manager</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreatorModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddCreator}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                disabled={!selectedUserId}
              >
                <Save className="w-4 h-4" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Atribuição de OBS</h3>
              <button onClick={() => setShowAssignmentModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                <select
                  value={assignmentForm.usuarioId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, usuarioId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecione um usuário</option>
                  {usuarios.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nó OBS (Responsible Manager) *</label>
                <select
                  value={assignmentForm.obsNodeId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, obsNodeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Selecione um nó OBS</option>
                  {obsNodes.map((obs) => (
                    <option key={obs.id} value={obs.id}>
                      {obs.nome} {obs.codigo && `(${obs.codigo})`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  O usuário verá projetos vinculados a este nó OBS ou seus filhos.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil de Projeto (opcional)</label>
                <select
                  value={assignmentForm.profileId}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, profileId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Sem perfil específico</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.nome}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assignmentForm.isPrimary}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, isPrimary: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">Atribuição principal</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddAssignment}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                disabled={!assignmentForm.usuarioId || !assignmentForm.obsNodeId}
              >
                <Save className="w-4 h-4" />
                Criar Atribuição
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteEpsModal}
        onClose={() => setShowDeleteEpsModal(false)}
        onConfirm={confirmDeleteEps}
        title={epsToDelete?.nivel === 0 ? "Excluir Projeto (EPS)" : "Excluir WBS"}
        message={`Tem certeza que deseja excluir "${epsToDelete?.nome}"? Esta ação não pode ser desfeita e todos os sub-níveis serão removidos.`}
        confirmText="Excluir"
        type="danger"
        loading={deletingEps}
      />

      <ConfirmDialog
        isOpen={showDeleteCreatorModal}
        onClose={() => setShowDeleteCreatorModal(false)}
        onConfirm={confirmDeleteCreator}
        title="Remover Criador de EPS"
        message={`Tem certeza que deseja remover a permissão de criador de EPS de "${creatorToDelete?.usuario?.nome}"?`}
        confirmText="Remover"
        type="danger"
        loading={deletingCreator}
      />

      <ConfirmDialog
        isOpen={showDeleteAssignmentModal}
        onClose={() => setShowDeleteAssignmentModal(false)}
        onConfirm={confirmDeleteAssignment}
        title="Remover Atribuição de OBS"
        message={`Tem certeza que deseja remover a atribuição de "${assignmentToDelete?.usuario?.nome}" ao nó OBS "${assignmentToDelete?.obsNode?.nome}"? O usuário pode perder acesso a projetos.`}
        confirmText="Remover"
        type="danger"
        loading={deletingAssignment}
      />
    </div>
  );
}
