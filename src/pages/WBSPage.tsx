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
  Users,
  Eye
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
        className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-colors ${
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

  const empresaId = usuario?.empresaId;
  const isAdmin = usuario?.perfilAcesso === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!empresaId || !usuario?.id) return;
    
    setLoading(true);
    try {
      const [tree, editors, assignments] = await Promise.all([
        epsService.getTree(empresaId),
        wbsEditorService.getByUser(usuario.id),
        userObsAssignmentService.getByUser(usuario.id),
      ]);
      
      setEpsTree(tree);
      setWbsEditors(editors);
      setUserAssignments(assignments);
      
      const rootIds = tree.map(node => node.id);
      setExpandedNodes(new Set(rootIds));
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
    <div className="flex flex-col h-full -m-6">
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
              <p className="text-gray-500">
                {searchTerm || filterProject !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Crie um projeto na página de administração EPS/WBS.'}
              </p>
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
    </div>
  );
};
