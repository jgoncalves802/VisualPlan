import React, { useEffect, useState, useMemo } from 'react';
import { epsService, EpsNode } from '../../../services/epsService';
import { useAuthStore } from '../../../stores/authStore';
import { 
  ChevronRight, 
  ChevronDown, 
  Loader2,
  Search,
  Building2,
  FolderOpen,
  Folder,
  FileSpreadsheet
} from 'lucide-react';

interface EpsSelectorProps {
  onSelectProject: (projectId: string, projectName: string) => void;
}

const isProjectNode = (node: EpsNode): boolean => {
  return node.nivel === 1;
};

const getLevelColor = (nivel: number, isProject: boolean): string => {
  if (isProject) return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
  if (nivel === 0) return 'bg-green-50 hover:bg-green-100 border-green-200';
  return 'bg-blue-50 hover:bg-blue-100 border-blue-200';
};

interface TreeRowProps {
  node: EpsNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onDoubleClick: (node: EpsNode) => void;
  searchTerm: string;
}

const TreeRow: React.FC<TreeRowProps> = ({ 
  node, 
  level, 
  expandedNodes, 
  onToggle, 
  onDoubleClick,
  searchTerm 
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isProject = isProjectNode(node);
  const levelColor = getLevelColor(node.nivel, isProject);

  const matchesSearch = searchTerm === '' || 
    node.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.codigo.toLowerCase().includes(searchTerm.toLowerCase());

  const hasMatchingDescendants = useMemo(() => {
    if (searchTerm === '') return true;
    
    const checkDescendants = (n: EpsNode): boolean => {
      if (n.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.codigo.toLowerCase().includes(searchTerm.toLowerCase())) {
        return true;
      }
      if (n.children) {
        return n.children.some(checkDescendants);
      }
      return false;
    };
    
    return checkDescendants(node);
  }, [node, searchTerm]);

  if (!matchesSearch && !hasMatchingDescendants) return null;
  
  return (
    <>
      <tr 
        className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${levelColor}`}
        onClick={() => hasChildren && onToggle(node.id)}
        onDoubleClick={() => onDoubleClick(node)}
      >
        <td className="py-2 px-3" style={{ paddingLeft: `${level * 24 + 12}px` }}>
          <div className="flex items-center gap-2">
            {hasChildren ? (
              <button 
                className="p-0.5 rounded hover:bg-black/10"
                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                )}
              </button>
            ) : (
              <span className="w-5" />
            )}
            
            {isProject ? (
              <FileSpreadsheet className="w-4 h-4 text-yellow-600" />
            ) : node.nivel === 0 ? (
              <Building2 className="w-4 h-4 text-green-600" />
            ) : isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500" />
            )}
            
            <span className={`font-medium ${isProject ? 'text-yellow-800' : 'text-gray-800 dark:text-gray-200'}`}>
              {node.nome}
            </span>
          </div>
        </td>
        <td className="py-2 px-3 font-mono text-sm text-gray-600">
          {node.codigo}
        </td>
        <td className="py-2 px-3 text-center text-sm text-gray-500">
          {isProject ? '-' : (node.children?.length || 0)}
        </td>
        <td className="py-2 px-3 text-center">
          {isProject ? (
            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
              Projeto
            </span>
          ) : (
            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
              Nível {node.nivel}
            </span>
          )}
        </td>
        <td className="py-2 px-3 text-center">
          {isProject && (
            <span className="text-xs text-gray-500 italic">
              Duplo clique para abrir
            </span>
          )}
        </td>
      </tr>
      
      {hasChildren && isExpanded && node.children!.map(child => (
        <TreeRow
          key={child.id}
          node={child}
          level={level + 1}
          expandedNodes={expandedNodes}
          onToggle={onToggle}
          onDoubleClick={onDoubleClick}
          searchTerm={searchTerm}
        />
      ))}
    </>
  );
};

export const EpsSelector: React.FC<EpsSelectorProps> = ({ onSelectProject }) => {
  const { usuario } = useAuthStore();
  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadEps = async () => {
      if (!usuario?.empresaId) {
        setError('Empresa não encontrada');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tree = await epsService.getEpsOnlyTree(usuario.empresaId);
        setEpsTree(tree);
        
        const expandAll = (nodes: EpsNode[], ids: Set<string>) => {
          nodes.forEach(node => {
            ids.add(node.id);
            if (node.children) expandAll(node.children, ids);
          });
        };
        const allIds = new Set<string>();
        expandAll(tree, allIds);
        setExpandedNodes(allIds);
      } catch (err) {
        console.error('Error loading EPS:', err);
        setError('Erro ao carregar estrutura de projetos');
      } finally {
        setIsLoading(false);
      }
    };

    loadEps();
  }, [usuario?.empresaId]);

  const handleToggle = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const handleDoubleClick = (node: EpsNode) => {
    if (isProjectNode(node)) {
      onSelectProject(node.id, node.nome);
    }
  };

  const projectCount = useMemo(() => {
    let count = 0;
    const countProjects = (nodes: EpsNode[]) => {
      nodes.forEach(node => {
        if (isProjectNode(node)) count++;
        if (node.children) countProjects(node.children);
      });
    };
    countProjects(epsTree);
    return count;
  }, [epsTree]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando estrutura EPS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (epsTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Crie a estrutura EPS na página de Administração para visualizar os projetos disponíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-600 to-green-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                EPS - Enterprise Project Structure
              </h2>
              <p className="text-sm text-white/80">
                {projectCount} projeto(s) disponível(is) - Duplo clique em um projeto para abrir
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white/90 border-0 text-sm focus:ring-2 focus:ring-white/50 w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 text-sm">
            <tr>
              <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300">
                Nome do Projeto
              </th>
              <th className="text-left py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 w-32">
                Project ID
              </th>
              <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 w-24">
                Filhos
              </th>
              <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 w-24">
                Tipo
              </th>
              <th className="text-center py-3 px-3 font-semibold text-gray-700 dark:text-gray-300 w-40">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {epsTree.map(node => (
              <TreeRow
                key={node.id}
                node={node}
                level={0}
                expandedNodes={expandedNodes}
                onToggle={handleToggle}
                onDoubleClick={handleDoubleClick}
                searchTerm={searchTerm}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
            <span>Raiz EPS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded" />
            <span>Divisão/Pasta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded" />
            <span>Projeto (abre cronograma)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
