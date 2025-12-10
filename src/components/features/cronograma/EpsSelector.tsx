import React, { useEffect, useState } from 'react';
import { epsService, EpsNode } from '../../../services/epsService';
import { useAuthStore } from '../../../stores/authStore';
import { 
  FolderTree, 
  ChevronRight, 
  ChevronDown, 
  Calendar,
  Building2,
  Loader2,
  FolderOpen
} from 'lucide-react';

interface EpsSelectorProps {
  onSelectProject: (projectId: string, projectName: string) => void;
}

interface TreeNodeProps {
  node: EpsNode;
  level: number;
  expandedNodes: Set<string>;
  onToggle: (nodeId: string) => void;
  onDoubleClick: (node: EpsNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({ 
  node, 
  level, 
  expandedNodes, 
  onToggle, 
  onDoubleClick 
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isProject = node.nivel === 1;
  
  return (
    <div className="select-none">
      <div
        className={`
          flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer
          transition-colors duration-150
          ${isProject 
            ? 'hover:bg-primary/10 border border-transparent hover:border-primary/30' 
            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => hasChildren && onToggle(node.id)}
        onDoubleClick={() => onDoubleClick(node)}
      >
        {hasChildren ? (
          <button 
            className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}
        
        {isProject ? (
          <Calendar className="w-5 h-5 text-primary" />
        ) : node.nivel === 0 ? (
          <Building2 className="w-5 h-5 text-blue-600" />
        ) : isExpanded ? (
          <FolderOpen className="w-5 h-5 text-amber-500" />
        ) : (
          <FolderTree className="w-5 h-5 text-amber-500" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {node.codigo}
            </span>
            <span className={`font-medium truncate ${isProject ? 'text-primary' : 'text-gray-800 dark:text-gray-200'}`}>
              {node.nome}
            </span>
          </div>
          {node.descricao && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {node.descricao}
            </p>
          )}
        </div>
        
        {isProject && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            Duplo clique para abrir
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onDoubleClick={onDoubleClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EpsSelector: React.FC<EpsSelectorProps> = ({ onSelectProject }) => {
  const { usuario } = useAuthStore();
  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadEps = async () => {
      if (!usuario?.empresaId) {
        setError('Empresa não encontrada');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const tree = await epsService.getTree(usuario.empresaId);
        setEpsTree(tree);
        
        const rootIds = tree.map(node => node.id);
        setExpandedNodes(new Set(rootIds));
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
    if (node.nivel === 1) {
      onSelectProject(node.id, node.nome);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando estrutura de projetos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FolderTree className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (epsTree.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <FolderTree className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Crie a estrutura EPS/WBS na página de Estrutura de Projetos para visualizar os cronogramas disponíveis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Selecione um Projeto
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Dê duplo clique em um projeto para abrir o cronograma
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {epsTree.map(node => (
          <TreeNode
            key={node.id}
            node={node}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={handleToggle}
            onDoubleClick={handleDoubleClick}
          />
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 text-primary" />
          <span>Projetos (nível 1) podem ser abertos como cronogramas</span>
        </div>
      </div>
    </div>
  );
};
