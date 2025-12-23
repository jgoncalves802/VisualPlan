import React, { useEffect, useState, useMemo } from 'react';
import { epsService, EpsNode } from '../../../services/epsService';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../services/supabaseClient';
import { format, differenceInDays, addMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Loader2,
  Building2,
  ChevronRight,
  ChevronDown,
  Folder,
  FileSpreadsheet,
  Calendar
} from 'lucide-react';

interface ProjectSummary {
  projeto_id: string;
  data_inicio: Date | null;
  data_fim: Date | null;
  progresso: number;
  total_atividades: number;
  atividades_concluidas: number;
}

interface ProjectWithDates extends EpsNode {
  data_inicio?: Date;
  data_fim?: Date;
  progresso?: number;
  status?: 'em_dia' | 'atrasado' | 'concluido' | 'planejado';
}

interface MasterGanttViewProps {
  onSelectProject: (projectId: string, projectName: string) => void;
}

type ZoomLevel = 'month' | 'quarter' | 'year';

export const MasterGanttView: React.FC<MasterGanttViewProps> = ({ onSelectProject }) => {
  const { usuario } = useAuthStore();
  const [epsTree, setEpsTree] = useState<EpsNode[]>([]);
  const [projects, setProjects] = useState<ProjectWithDates[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');

  useEffect(() => {
    const loadData = async () => {
      if (!usuario?.empresaId) {
        setError('Empresa não encontrada');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        const [tree, projectList] = await Promise.all([
          epsService.getTree(usuario.empresaId),
          epsService.getEpsOnlyTree(usuario.empresaId)
        ]);
        
        setEpsTree(tree);
        
        const projectIds = projectList.map(p => p.id);
        
        const projectSummaries: Record<string, ProjectSummary> = {};
        
        if (projectIds.length > 0) {
          const { data: atividadesData, error: atividadesError } = await supabase
            .from('atividades_cronograma')
            .select('projeto_id, data_inicio, data_fim, percentual_concluido, status')
            .in('projeto_id', projectIds);
        
          if (atividadesError) {
            console.warn('Erro ao buscar atividades do cronograma:', atividadesError.message);
          }
          
          if (atividadesData && !atividadesError) {
            atividadesData.forEach(atividade => {
              const projetoId = atividade.projeto_id;
              if (!projetoId) return;
              
              if (!projectSummaries[projetoId]) {
                projectSummaries[projetoId] = {
                  projeto_id: projetoId,
                  data_inicio: null,
                  data_fim: null,
                  progresso: 0,
                  total_atividades: 0,
                  atividades_concluidas: 0
                };
              }
              
              const summary = projectSummaries[projetoId];
              summary.total_atividades++;
              
              if (atividade.status === 'CONCLUIDA' || atividade.percentual_concluido === 100) {
                summary.atividades_concluidas++;
              }
              
              if (atividade.data_inicio) {
                const dataInicio = new Date(atividade.data_inicio);
                if (!summary.data_inicio || dataInicio < summary.data_inicio) {
                  summary.data_inicio = dataInicio;
                }
              }
              
              if (atividade.data_fim) {
                const dataFim = new Date(atividade.data_fim);
                if (!summary.data_fim || dataFim > summary.data_fim) {
                  summary.data_fim = dataFim;
                }
              }
            });
            
            Object.values(projectSummaries).forEach(summary => {
              if (summary.total_atividades > 0) {
                summary.progresso = Math.round((summary.atividades_concluidas / summary.total_atividades) * 100);
              }
            });
          }
        }
        
        const hoje = new Date();
        const projectsWithDates: ProjectWithDates[] = projectList.map(project => {
          const summary = projectSummaries[project.id];
          
          const dataInicio = summary?.data_inicio || null;
          const dataFim = summary?.data_fim || null;
          const progresso = summary?.progresso || 0;
          
          let status: ProjectWithDates['status'] = 'planejado';
          if (dataInicio && dataFim) {
            if (progresso === 100) status = 'concluido';
            else if (dataFim < hoje) status = 'atrasado';
            else if (dataInicio <= hoje) status = 'em_dia';
          }
          
          return {
            ...project,
            data_inicio: dataInicio || undefined,
            data_fim: dataFim || undefined,
            progresso,
            status
          };
        });
        
        setProjects(projectsWithDates);
        
        const allNodeIds = new Set<string>();
        const collectIds = (nodes: EpsNode[]) => {
          nodes.forEach(node => {
            allNodeIds.add(node.id);
            if (node.children) collectIds(node.children);
          });
        };
        collectIds(tree);
        setExpandedNodes(allNodeIds);
        
      } catch (err) {
        console.error('Error loading EPS data:', err);
        setError('Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [usuario?.empresaId]);

  const { timelineStart, timelineEnd, months } = useMemo(() => {
    if (projects.length === 0) {
      const hoje = new Date();
      return {
        timelineStart: startOfMonth(addMonths(hoje, -1)),
        timelineEnd: endOfMonth(addMonths(hoje, 11)),
        months: eachMonthOfInterval({
          start: startOfMonth(addMonths(hoje, -1)),
          end: endOfMonth(addMonths(hoje, 11))
        })
      };
    }

    let minDate = projects[0].data_inicio || new Date();
    let maxDate = projects[0].data_fim || new Date();
    
    projects.forEach(p => {
      if (p.data_inicio && p.data_inicio < minDate) minDate = p.data_inicio;
      if (p.data_fim && p.data_fim > maxDate) maxDate = p.data_fim;
    });

    const start = startOfMonth(addMonths(minDate, -1));
    const end = endOfMonth(addMonths(maxDate, 1));
    
    return {
      timelineStart: start,
      timelineEnd: end,
      months: eachMonthOfInterval({ start, end })
    };
  }, [projects]);

  const totalDays = differenceInDays(timelineEnd, timelineStart);
  const dayWidth = zoomLevel === 'month' ? 3 : zoomLevel === 'quarter' ? 1.5 : 0.8;
  const timelineWidth = totalDays * dayWidth;

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getBarStyle = (project: ProjectWithDates) => {
    if (!project.data_inicio || !project.data_fim) return { left: 0, width: 0 };
    
    const startOffset = differenceInDays(project.data_inicio, timelineStart);
    const duration = differenceInDays(project.data_fim, project.data_inicio);
    
    return {
      left: startOffset * dayWidth,
      width: Math.max(duration * dayWidth, 20)
    };
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-500';
      case 'atrasado': return 'bg-red-500';
      case 'em_dia': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusBorderColor = (status?: string) => {
    switch (status) {
      case 'concluido': return 'border-green-600';
      case 'atrasado': return 'border-red-600';
      case 'em_dia': return 'border-blue-600';
      default: return 'border-gray-500';
    }
  };

  const renderEpsNode = (node: EpsNode, level: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const projectData = projects.find(p => p.id === node.id);
    const isProject = !!projectData;

    return (
      <React.Fragment key={node.id}>
        <div 
          className={`flex items-stretch border-b border-gray-200 hover:bg-gray-50 ${isProject ? 'bg-amber-50' : ''}`}
          style={{ minHeight: '40px' }}
        >
          <div 
            className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 bg-white sticky left-0 z-10"
            style={{ width: '300px', minWidth: '300px', paddingLeft: `${level * 16 + 12}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-0.5 hover:bg-gray-200 rounded"
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
              <FileSpreadsheet className="w-4 h-4 text-amber-600 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            
            <span 
              className={`text-sm truncate ${isProject ? 'font-semibold text-amber-800 cursor-pointer hover:underline' : 'text-gray-700'}`}
              onClick={() => isProject && onSelectProject(node.id, node.nome)}
              title={node.nome}
            >
              {node.nome}
            </span>
            
            {isProject && projectData?.progresso !== undefined && (
              <span className="ml-auto text-xs text-gray-500 font-medium">
                {projectData.progresso}%
              </span>
            )}
          </div>

          <div 
            className="relative flex-1 bg-gray-50"
            style={{ minWidth: `${timelineWidth}px` }}
          >
            {isProject && projectData && (
              <div 
                className={`absolute top-1/2 -translate-y-1/2 h-6 rounded ${getStatusColor(projectData.status)} ${getStatusBorderColor(projectData.status)} border cursor-pointer hover:opacity-90 transition-opacity shadow-sm`}
                style={getBarStyle(projectData)}
                onClick={() => onSelectProject(node.id, node.nome)}
                title={`${node.nome}\n${format(projectData.data_inicio!, 'dd/MM/yyyy')} - ${format(projectData.data_fim!, 'dd/MM/yyyy')}\nProgresso: ${projectData.progresso}%`}
              >
                {projectData.progresso !== undefined && projectData.progresso > 0 && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-white/30 rounded-l"
                    style={{ width: `${projectData.progresso}%` }}
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                  {node.codigo}
                </span>
              </div>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && node.children!.map(child => renderEpsNode(child, level + 1))}
      </React.Fragment>
    );
  };

  const todayOffset = differenceInDays(new Date(), timelineStart) * dayWidth;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando cronograma master...</p>
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
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Nenhum projeto encontrado
          </h3>
          <p className="text-gray-600">
            Crie projetos na página de Administração (EPS) para visualizá-los no cronograma master.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Cronograma Master
              </h2>
              <p className="text-sm text-white/80">
                {projects.length} projeto(s) - Visão consolidada por EPS
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel('year')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                zoomLevel === 'year' ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setZoomLevel('quarter')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                zoomLevel === 'quarter' ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setZoomLevel('month')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                zoomLevel === 'month' ? 'bg-white text-blue-700' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-gray-600">Concluído</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">Em dia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span className="text-gray-600">Atrasado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-gray-600">Planejado</span>
        </div>
        <div className="ml-auto text-gray-500">
          Clique no projeto para abrir o cronograma detalhado
        </div>
      </div>

      <div className="overflow-auto max-h-[600px]">
        <div className="flex" style={{ minWidth: `${300 + timelineWidth}px` }}>
          <div 
            className="sticky left-0 z-20 bg-gray-100 border-r border-b border-gray-300 font-semibold text-sm text-gray-700 flex items-center px-3"
            style={{ width: '300px', minWidth: '300px', height: '40px' }}
          >
            Estrutura EPS / Projetos
          </div>
          
          <div 
            className="flex-1 border-b border-gray-300 relative"
            style={{ minWidth: `${timelineWidth}px` }}
          >
            <div className="flex h-10">
              {months.map((month, index) => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const daysInMonth = differenceInDays(monthEnd, monthStart) + 1;
                const width = daysInMonth * dayWidth;
                
                return (
                  <div 
                    key={index}
                    className="flex-shrink-0 border-r border-gray-300 bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-700"
                    style={{ width: `${width}px` }}
                  >
                    {format(month, zoomLevel === 'year' ? 'MMM' : 'MMM yyyy', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
            
            {todayOffset > 0 && todayOffset < timelineWidth && (
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30"
                style={{ left: `${todayOffset}px` }}
              >
                <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-b font-bold">
                  Hoje
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          {todayOffset > 0 && todayOffset < timelineWidth && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-red-500/30 z-10"
              style={{ left: `${300 + todayOffset}px` }}
            />
          )}
          
          {epsTree.map(node => renderEpsNode(node, 0))}
        </div>
      </div>
    </div>
  );
};
