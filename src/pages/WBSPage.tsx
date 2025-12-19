/**
 * Página WBS - Work Breakdown Structure
 * Visualização hierárquica de todos os projetos e suas WBS
 * Com filtro de visibilidade baseado em atribuições OBS
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Briefcase, 
  Layers, 
  Search,
  Filter,
  Edit2,
  Save,
  X,
  AlertCircle,
  AlertTriangle,
  Users,
  Eye,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { epsService, EpsNode } from '../services/epsService';
import { wbsEditorService, WbsEditor } from '../services/wbsEditorService';
import { userObsAssignmentService, UserObsAssignment } from '../services/userObsAssignmentService';
import { useToast } from '../components/ui/Toast';

interface WBSTreeNodeProps {
  node: EpsNode;
  depth: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  editingWeight: string | null;
  setEditingWeight: (id: string | null) => void;
  tempWeight: string;
  setTempWeight: (value: string) => void;
  onSaveWeight: (id: string, weight: number) => Promise<void>;
  canEditWbs: boolean;
  onNavigate: (id: string) => void;
  visibleNodeIds: Set<string>;
  isAdmin: boolean;
  onAddChild?: (node: EpsNode) => void;
  onEdit?: (node: EpsNode) => void;
  onDelete?: (node: EpsNode) => void;
}

const WBSTreeNode: React.FC<WBSTreeNodeProps> = ({
  node,
  depth,
  expandedNodes,
  toggleNode,
  editingWeight,
  setEditingWeight,
  tempWeight,
  setTempWeight,
  onSaveWeight,
  canEditWbs,
  onNavigate,
  visibleNodeIds,
  isAdmin,
  onAddChild,
  onEdit,
  onDelete,
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const isProject = node.nivel === 0;
  const isVisible = isAdmin || visibleNodeIds.has(node.id);
  
  if (!isVisible) return null;
  
  const visibleChildren = node.children?.filter(child => 
    isAdmin || visibleNodeIds.has(child.id)
  ) || [];

  const handleWeightEdit = () => {
    if (canEditWbs && !isProject) {
      setEditingWeight(node.id);
      setTempWeight((node.pesoEstimado * 100).toFixed(1));
    }
  };

  const handleWeightSave = async () => {
    const weight = parseFloat(tempWeight);
    if (!isNaN(weight) && weight >= 0 && weight <= 100) {
      await onSaveWeight(node.id, weight / 100);
    }
    setEditingWeight(null);
  };

  const handleWeightCancel = () => {
    setEditingWeight(null);
  };

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
          isProject 
            ? 'bg-purple-50 hover:bg-purple-100 border border-purple-200' 
            : 'hover:bg-gray-100'
        }`}
        style={{ marginLeft: depth * 24 }}
      >
        {hasChildren || visibleChildren.length > 0 ? (
          <button
            onClick={() => toggleNode(node.id)}
            className="p-1 rounded hover:bg-gray-200"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <div
          className={`w-8 h-8 rounded flex items-center justify-center ${
            isProject ? 'bg-purple-200' : 'bg-blue-100'
          }`}
        >
          {isProject ? (
            <Briefcase className={`w-4 h-4 ${isProject ? 'text-purple-600' : 'text-blue-600'}`} />
          ) : (
            <Layers className="w-4 h-4 text-blue-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium truncate ${isProject ? 'text-purple-900' : 'text-gray-900'}`}>
              {node.nome}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              isProject ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {node.codigo}
            </span>
            {isProject && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-500 text-white">
                PROJETO
              </span>
            )}
            {!isProject && (
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white">
                WBS
              </span>
            )}
          </div>
          {node.descricao && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{node.descricao}</p>
          )}
        </div>

        {!isProject && (
          <div className="flex items-center gap-2">
            {editingWeight === node.id ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempWeight}
                  onChange={(e) => setTempWeight(e.target.value)}
                  className="w-16 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleWeightSave();
                    if (e.key === 'Escape') handleWeightCancel();
                  }}
                />
                <span className="text-sm text-gray-500">%</span>
                <button
                  onClick={handleWeightSave}
                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  onClick={handleWeightCancel}
                  className="p-1 text-red-600 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  canEditWbs ? 'cursor-pointer hover:bg-blue-50' : ''
                }`}
                onClick={handleWeightEdit}
                title={canEditWbs ? 'Clique para editar o peso' : 'Peso estimado'}
              >
                <span className="text-sm font-medium text-gray-700">
                  {(node.pesoEstimado * 100).toFixed(1)}%
                </span>
                {canEditWbs && (
                  <Edit2 className="w-3 h-3 text-gray-400" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {canEditWbs && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onAddChild?.(node); }}
              className="p-1.5 text-green-600 hover:bg-green-100 rounded"
              title="Adicionar WBS filho"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(node); }}
              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(node); }}
              className="p-1.5 text-red-600 hover:bg-red-100 rounded"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {isProject && (
          <button
            onClick={() => onNavigate(node.id)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 hover:bg-purple-100 rounded transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver Detalhes
          </button>
        )}

        {node.responsibleManager && (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
            <Users className="w-3 h-3" />
            {node.responsibleManager.nome}
          </div>
        )}
      </div>

      {isExpanded && visibleChildren.length > 0 && (
        <div>
          {visibleChildren.map((child) => (
            <WBSTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              editingWeight={editingWeight}
              setEditingWeight={setEditingWeight}
              tempWeight={tempWeight}
              setTempWeight={setTempWeight}
              onSaveWeight={onSaveWeight}
              canEditWbs={canEditWbs}
              onNavigate={onNavigate}
              visibleNodeIds={visibleNodeIds}
              isAdmin={isAdmin}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const WBSPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuthStore();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [wbsEditors, setWbsEditors] = useState<WbsEditor[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserObsAssignment[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [editingWeight, setEditingWeight] = useState<string | null>(null);
  const [tempWeight, setTempWeight] = useState<string>('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [parentNode, setParentNode] = useState<EpsNode | null>(null);
  const [editingNode, setEditingNode] = useState<EpsNode | null>(null);
  const [formData, setFormData] = useState({ codigo: '', nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<EpsNode | null>(null);
  const [saving, setSaving] = useState(false);

  const empresaId = usuario?.empresaId;
  const isAdmin = usuario?.perfilAcesso === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!empresaId || !usuario?.id) return;
    
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        epsService.getTree(empresaId),
        wbsEditorService.getByUser(usuario.id),
        userObsAssignmentService.getByUser(usuario.id),
      ]);
      
      const tree = results[0].status === 'fulfilled' ? results[0].value : [];
      const editors = results[1].status === 'fulfilled' ? results[1].value : [];
      const assignments = results[2].status === 'fulfilled' ? results[2].value : [];
      
      setEpsTree(tree);
      setWbsEditors(editors);
      setUserAssignments(assignments);
      
      const rootIds = tree.map(node => node.id);
      setExpandedNodes(new Set(rootIds));
      
      const hasErrors = results.some(r => r.status === 'rejected');
      if (hasErrors && tree.length === 0) {
        toast.error('Erro ao carregar dados do WBS. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('Error loading WBS data:', error);
      toast.error('Erro ao carregar dados do WBS');
    } finally {
      setLoading(false);
    }
  }, [empresaId, usuario?.id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const visibleNodeIds = useMemo(() => {
    if (isAdmin) return new Set<string>();
    
    const visible = new Set<string>();
    
    const obsNodeIds = userAssignments.map(a => a.obsNodeId);
    
    const addVisibleNodes = (node: EpsNode) => {
      if (node.responsibleManagerId && obsNodeIds.includes(node.responsibleManagerId)) {
        visible.add(node.id);
        const addAllChildren = (n: EpsNode) => {
          visible.add(n.id);
          n.children?.forEach(addAllChildren);
        };
        node.children?.forEach(addAllChildren);
      }
      
      node.children?.forEach(addVisibleNodes);
    };
    
    epsTree.forEach(addVisibleNodes);
    
    const addParentChain = (nodes: EpsNode[], targetId: string, chain: string[] = []): string[] | null => {
      for (const node of nodes) {
        if (node.id === targetId) {
          return chain;
        }
        if (node.children) {
          const result = addParentChain(node.children, targetId, [...chain, node.id]);
          if (result) return result;
        }
      }
      return null;
    };
    
    const currentVisible = new Set(visible);
    currentVisible.forEach(nodeId => {
      const parentChain = addParentChain(epsTree, nodeId);
      if (parentChain) {
        parentChain.forEach(id => visible.add(id));
      }
    });
    
    return visible;
  }, [isAdmin, userAssignments, epsTree]);

  const canEditWbsForProject = useCallback((projectId: string): boolean => {
    if (isAdmin) return true;
    return wbsEditors.some(editor => 
      editor.epsNodeId === projectId && (editor.canEdit || editor.canCreate)
    );
  }, [isAdmin, wbsEditors]);

  const projects = useMemo(() => {
    return epsTree.filter(node => node.nivel === 0);
  }, [epsTree]);

  const filteredTree = useMemo(() => {
    let tree = [...epsTree];
    
    if (filterProject !== 'all') {
      tree = tree.filter(node => node.id === filterProject);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      const filterNode = (node: EpsNode): EpsNode | null => {
        const matches = 
          node.nome.toLowerCase().includes(search) ||
          node.codigo.toLowerCase().includes(search) ||
          node.descricao?.toLowerCase().includes(search);
        
        const filteredChildren = node.children
          ?.map(filterNode)
          .filter((n): n is EpsNode => n !== null) || [];
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      };
      
      tree = tree.map(filterNode).filter((n): n is EpsNode => n !== null);
    }
    
    return tree;
  }, [epsTree, filterProject, searchTerm]);

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    const addAllIds = (nodes: EpsNode[]) => {
      nodes.forEach(node => {
        allIds.add(node.id);
        if (node.children) addAllIds(node.children);
      });
    };
    addAllIds(epsTree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const handleSaveWeight = async (nodeId: string, weight: number) => {
    try {
      await epsService.update(nodeId, { pesoEstimado: weight });
      await loadData();
      toast.success('Peso atualizado com sucesso');
    } catch (error) {
      console.error('Error updating weight:', error);
      toast.error('Erro ao atualizar o peso');
    }
  };

  const handleNavigate = (projectId: string) => {
    navigate(`/cronograma/${projectId}`);
  };

  // Generate EDT code automatically
  const generateEdtCode = (parent: EpsNode | null): string => {
    if (!parent) {
      // For EPS (root level projects), find the next sequential number
      const existingCodes = epsTree
        .map(node => parseInt(node.codigo, 10))
        .filter(num => !isNaN(num));
      const nextNum = existingCodes.length > 0 ? Math.max(...existingCodes) + 1 : 1;
      return nextNum.toString();
    } else {
      // For WBS (child nodes), use parent.code + "." + next sequential number
      const siblings = parent.children || [];
      const parentCode = parent.codigo;
      
      // Extract the last number from sibling codes that start with parentCode
      const siblingNumbers = siblings
        .map(s => {
          const match = s.codigo.match(new RegExp(`^${parentCode.replace(/\./g, '\\.')}\\.?(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
      
      const nextNum = siblingNumbers.length > 0 ? Math.max(...siblingNumbers) + 1 : 1;
      return `${parentCode}.${nextNum}`;
    }
  };

  // Modal handlers
  const openCreateModal = (parent: EpsNode | null = null) => {
    const autoCode = generateEdtCode(parent);
    setModalMode('create');
    setParentNode(parent);
    setEditingNode(null);
    setFormData({ codigo: autoCode, nome: '', descricao: '', cor: '#3B82F6', pesoEstimado: '100' });
    setShowModal(true);
  };

  const openEditModal = (node: EpsNode) => {
    setModalMode('edit');
    setParentNode(null);
    setEditingNode(node);
    setFormData({
      codigo: node.codigo,
      nome: node.nome,
      descricao: node.descricao || '',
      cor: node.cor || '#3B82F6',
      pesoEstimado: ((node.pesoEstimado || 1) * 100).toFixed(1),
    });
    setShowModal(true);
  };

  const openDeleteModal = (node: EpsNode) => {
    setNodeToDelete(node);
    setShowDeleteModal(true);
  };

  const handleSubmit = async () => {
    if (!empresaId || !formData.codigo || !formData.nome) {
      toast.error('Código e nome são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const pesoEstimado = parseFloat(formData.pesoEstimado) / 100;
      if (modalMode === 'create') {
        await epsService.create({
          empresaId,
          parentId: parentNode?.id || null,
          codigo: formData.codigo,
          nome: formData.nome,
          descricao: formData.descricao || undefined,
          cor: formData.cor,
          pesoEstimado: parentNode ? pesoEstimado : 1.0,
        });
        toast.success(parentNode ? 'WBS criado com sucesso!' : 'Projeto (EPS) criado com sucesso!');
      } else if (editingNode) {
        await epsService.update(editingNode.id, {
          codigo: formData.codigo,
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor,
          pesoEstimado: editingNode.nivel > 0 ? pesoEstimado : 1.0,
        });
        toast.success('Atualizado com sucesso!');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!nodeToDelete) return;
    setSaving(true);
    try {
      await epsService.delete(nodeToDelete.id);
      toast.success(nodeToDelete.nivel === 0 ? 'Projeto excluído!' : 'WBS excluído!');
      setShowDeleteModal(false);
      setNodeToDelete(null);
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Erro ao excluir');
    } finally {
      setSaving(false);
    }
  };

  const isCreatingWbs = parentNode !== null;

  const stats = useMemo(() => {
    const countNodes = (nodes: EpsNode[]): { projects: number; wbs: number } => {
      let projects = 0;
      let wbs = 0;
      nodes.forEach(node => {
        if (isAdmin || visibleNodeIds.has(node.id)) {
          if (node.nivel === 0) {
            projects++;
          } else {
            wbs++;
          }
          if (node.children) {
            const childCounts = countNodes(node.children);
            projects += childCounts.projects;
            wbs += childCounts.wbs;
          }
        }
      });
      return { projects, wbs };
    };
    return countNodes(epsTree);
  }, [epsTree, visibleNodeIds, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando estrutura WBS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FolderTree className="w-7 h-7 text-purple-600" />
              WBS - Todos os Projetos
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Estrutura hierárquica de projetos e pacotes de trabalho
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-lg">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">{stats.projects} Projetos</span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">{stats.wbs} Itens WBS</span>
            </div>
            <button
              onClick={() => openCreateModal(null)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Projeto (EPS)
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-72"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Todos os Projetos</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.nome} ({project.codigo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Expandir Tudo
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Recolher Tudo
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredTree.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm || filterProject !== 'all' 
                  ? 'Nenhum resultado encontrado'
                  : 'Nenhum projeto cadastrado'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterProject !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Crie um projeto na página de administração EPS/WBS.'}
              </p>
              {!searchTerm && filterProject === 'all' && (
                <button
                  onClick={() => openCreateModal(null)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar Projeto (EPS)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-1">
            {filteredTree.map((node) => (
              <WBSTreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                editingWeight={editingWeight}
                setEditingWeight={setEditingWeight}
                tempWeight={tempWeight}
                setTempWeight={setTempWeight}
                onSaveWeight={handleSaveWeight}
                canEditWbs={canEditWbsForProject(node.id)}
                onNavigate={handleNavigate}
                visibleNodeIds={visibleNodeIds}
                isAdmin={isAdmin}
                onAddChild={openCreateModal}
                onEdit={openEditModal}
                onDelete={openDeleteModal}
              />
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-200 rounded flex items-center justify-center">
              <Briefcase className="w-3 h-3 text-purple-600" />
            </div>
            <span>Projeto (EPS)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <Layers className="w-3 h-3 text-blue-600" />
            </div>
            <span>Item WBS</span>
          </div>
          <span className="ml-auto text-xs italic">
            {isAdmin 
              ? 'Como administrador, você pode ver todos os projetos e WBS'
              : 'Você vê apenas os projetos e WBS atribuídos a você via OBS'}
          </span>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === 'create' 
                  ? (isCreatingWbs ? `Novo WBS em ${parentNode?.nome}` : 'Novo Projeto (EPS)')
                  : `Editar ${editingNode?.nivel === 0 ? 'Projeto' : 'WBS'}`}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código EDT {modalMode === 'create' && <span className="text-xs text-gray-500">(gerado automaticamente)</span>}
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  readOnly={modalMode === 'create'}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    modalMode === 'create' 
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed' 
                      : 'focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder={isCreatingWbs ? 'Ex: Fundações, Estrutura' : 'Ex: Construção Edifício A'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                  <input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
                {(isCreatingWbs || (editingNode && editingNode.nivel > 0)) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.pesoEstimado}
                      onChange={(e) => setFormData({ ...formData, pesoEstimado: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !formData.codigo || !formData.nome}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {modalMode === 'create' ? 'Criar' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && nodeToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-gray-900">
                    Tem certeza que deseja excluir <strong>{nodeToDelete.nome}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {nodeToDelete.children && nodeToDelete.children.length > 0
                      ? 'Todos os itens filhos também serão excluídos.'
                      : 'Esta ação não pode ser desfeita.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
