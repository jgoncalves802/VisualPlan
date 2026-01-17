import React, { useEffect, useState } from 'react';
import { epsService, EpsNode } from '../../../services/epsService';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../services/supabase';
import { 
  Loader2,
  Search,
  Building2,
  FileSpreadsheet,
  Calendar,
  Plus,
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface EpsSelectorProps {
  onSelectProject: (projectId: string, projectName: string) => void;
  onCreateNew?: () => void;
  onImportP6?: () => void;
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  projectName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error?: string | null;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  projectName,
  onConfirm,
  onCancel,
  isDeleting,
  error
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Confirmar Exclusão
          </h3>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Tem certeza que deseja excluir o cronograma:
        </p>
        <p className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          "{projectName}"
        </p>
        <p className="text-sm text-red-600 dark:text-red-400 mb-6">
          Esta ação excluirá todas as atividades e dependências associadas. Esta ação não pode ser desfeita.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const EpsSelector: React.FC<EpsSelectorProps> = ({ onSelectProject, onCreateNew, onImportP6 }) => {
  const { usuario } = useAuthStore();
  const [projects, setProjects] = useState<EpsNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<EpsNode | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const loadProjects = async () => {
      if (!usuario?.empresaId) {
        setError('Empresa não encontrada');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const projectList = await epsService.getEpsOnlyTree(usuario.empresaId);
        setProjects(projectList);
      } catch (err) {
        console.error('Error loading projects:', err);
        setError('Erro ao carregar projetos');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [usuario?.empresaId]);

  const handleDoubleClick = (project: EpsNode) => {
    onSelectProject(project.id, project.nome);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: EpsNode) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      const { data: activities } = await supabase
        .from('atividades_cronograma')
        .select('id')
        .eq('projeto_id', projectToDelete.id);

      if (activities && activities.length > 0) {
        const activityIds = activities.map(a => a.id);
        
        const { error: depError1 } = await supabase
          .from('dependencias_atividades')
          .delete()
          .in('atividade_origem_id', activityIds);

        if (depError1) {
          console.warn('Error deleting dependencies (origem):', depError1);
        }

        const { error: depError2 } = await supabase
          .from('dependencias_atividades')
          .delete()
          .in('atividade_destino_id', activityIds);

        if (depError2) {
          console.warn('Error deleting dependencies (destino):', depError2);
        }
      }

      const { error: activitiesError } = await supabase
        .from('atividades_cronograma')
        .delete()
        .eq('projeto_id', projectToDelete.id);

      if (activitiesError) {
        throw new Error(`Erro ao excluir atividades: ${activitiesError.message}`);
      }

      const collectDescendantIds = async (parentId: string): Promise<string[]> => {
        const { data: children, error: queryError } = await supabase
          .from('eps_nodes')
          .select('id')
          .eq('parent_id', parentId);
        
        if (queryError) {
          console.warn('Error querying WBS children:', queryError);
          return [];
        }
        
        if (!children || children.length === 0) return [];
        
        const childIds = children.map(c => c.id);
        const grandchildIds: string[] = [];
        
        for (const childId of childIds) {
          const descendants = await collectDescendantIds(childId);
          grandchildIds.push(...descendants);
        }
        
        return [...childIds, ...grandchildIds];
      };

      const wbsIdsToDelete = await collectDescendantIds(projectToDelete.id);
      
      if (wbsIdsToDelete.length > 0) {
        const { error: wbsError } = await supabase
          .from('eps_nodes')
          .delete()
          .in('id', wbsIdsToDelete);

        if (wbsError) {
          throw new Error(`Erro ao excluir estrutura WBS: ${wbsError.message}`);
        }
      }

      setProjects(prev => prev.filter(p => p.id !== projectToDelete.id));
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Error deleting project schedule:', err);
      setDeleteError(err instanceof Error ? err.message : 'Erro ao excluir cronograma');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setProjectToDelete(null);
    setDeleteError(null);
  };

  const filteredProjects = projects.filter(project => 
    searchTerm === '' || 
    project.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Carregando projetos...</p>
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

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Crie projetos na página de Administração (EPS) para visualizá-los aqui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary to-primary-dark">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Selecione um Projeto
              </h2>
              <p className="text-sm text-white/80">
                {projects.length} projeto(s) - Duplo clique para abrir o cronograma
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
            
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Novo Cronograma
              </button>
            )}
            
            {onImportP6 && (
              <button
                onClick={onImportP6}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Importar P6
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-800 text-sm">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                Nome do Projeto
              </th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-32">
                Código
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-32">
                Tipo
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-48">
                Ação
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => (
              <tr 
                key={project.id}
                className="border-b border-gray-300 dark:border-gray-600 cursor-pointer bg-amber-100 hover:bg-amber-200 transition-colors"
                onDoubleClick={() => handleDoubleClick(project)}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-amber-700" />
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {project.nome}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 font-mono text-sm font-medium text-gray-700 dark:text-gray-300">
                  {project.codigo}
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full font-bold shadow-sm">
                    PROJETO
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-amber-700 font-medium">
                      Duplo clique para abrir
                    </span>
                    <button
                      onClick={(e) => handleDeleteClick(e, project)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Excluir cronograma"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        projectName={projectToDelete?.nome || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDeleting={isDeleting}
        error={deleteError}
      />
      
      {filteredProjects.length === 0 && searchTerm !== '' && (
        <div className="p-8 text-center text-gray-500">
          Nenhum projeto encontrado para "{searchTerm}"
        </div>
      )}
      
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <FileSpreadsheet className="w-4 h-4 text-yellow-600" />
          <span>Dê duplo clique em um projeto para abrir o cronograma com a estrutura WBS</span>
        </div>
      </div>
    </div>
  );
};
