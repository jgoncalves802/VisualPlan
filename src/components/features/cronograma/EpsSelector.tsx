import React, { useEffect, useState } from 'react';
import { epsService, EpsNode } from '../../../services/epsService';
import { useAuthStore } from '../../../stores/authStore';
import { 
  Loader2,
  Search,
  Building2,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';

interface EpsSelectorProps {
  onSelectProject: (projectId: string, projectName: string) => void;
}

export const EpsSelector: React.FC<EpsSelectorProps> = ({ onSelectProject }) => {
  const { usuario } = useAuthStore();
  const [projects, setProjects] = useState<EpsNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
                className="border-b border-gray-200 dark:border-gray-700 cursor-pointer bg-yellow-50 hover:bg-yellow-100 transition-colors"
                onDoubleClick={() => handleDoubleClick(project)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {project.nome}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-sm text-gray-600">
                  {project.codigo}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full font-medium">
                    PROJETO
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs text-gray-500 italic">
                    Duplo clique para abrir
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
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
