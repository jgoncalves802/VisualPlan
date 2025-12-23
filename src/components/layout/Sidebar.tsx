import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderTree,
  Calendar,
  Kanban,
  ListTodo,
  AlertTriangle,
  Box,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Target,
  ClipboardList,
  FileCheck,
  GitBranch,
  Fish,
  Users,
  Briefcase,
  Package,
} from 'lucide-react';
import classNames from 'classnames';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { useEmpresaStore } from '../../stores/empresaStore';
import { PerfilAcesso } from '../../types';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  minPerfil?: PerfilAcesso[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/dashboard',
  },
  {
    id: 'indicadores',
    label: 'Indicadores',
    icon: <Target className="w-5 h-5" />,
    path: '/indicadores',
  },
  {
    id: 'acoes',
    label: 'Plano de Ação 5W2H',
    icon: <ClipboardList className="w-5 h-5" />,
    path: '/acoes',
  },
  {
    id: 'auditorias',
    label: 'Auditorias',
    icon: <FileCheck className="w-5 h-5" />,
    path: '/auditorias',
  },
  {
    id: 'mudancas',
    label: 'Gestão da Mudança',
    icon: <GitBranch className="w-5 h-5" />,
    path: '/mudancas',
  },
  {
    id: 'ishikawa',
    label: 'Análise Ishikawa',
    icon: <Fish className="w-5 h-5" />,
    path: '/analise-ishikawa',
  },
  {
    id: 'reunioes',
    label: 'Reuniões',
    icon: <Users className="w-5 h-5" />,
    path: '/reunioes',
  },
  {
    id: 'portfolio',
    label: 'Portfólio',
    icon: <Briefcase className="w-5 h-5" />,
    path: '/portfolio',
  },
  {
    id: 'wbs',
    label: 'WBS - Todos Projetos',
    icon: <FolderTree className="w-5 h-5" />,
    path: '/wbs',
  },
  {
    id: 'cronograma',
    label: 'Gantt / Cronograma',
    icon: <Calendar className="w-5 h-5" />,
    path: '/cronograma',
  },
  {
    id: 'takeoff',
    label: 'Take-off / Quantidades',
    icon: <Package className="w-5 h-5" />,
    path: '/takeoff',
  },
  {
    id: 'kanban',
    label: 'Kanban de Execução',
    icon: <Kanban className="w-5 h-5" />,
    path: '/kanban',
  },
  {
    id: 'lps',
    label: 'LPS',
    icon: <ListTodo className="w-5 h-5" />,
    path: '/lps',
  },
  {
    id: 'restricoes',
    label: 'Restrições',
    icon: <AlertTriangle className="w-5 h-5" />,
    path: '/restricoes',
  },
  {
    id: 'bim',
    label: 'BIM / 4D',
    icon: <Box className="w-5 h-5" />,
    path: '/bim',
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/relatorios',
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, presentationMode } = useUIStore();
  const { usuario, logout } = useAuthStore();
  const { empresa, loadEmpresa } = useEmpresaStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario?.empresaId) {
      loadEmpresa(usuario.empresaId);
    }
  }, [usuario?.empresaId, loadEmpresa]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filtrar menu items baseado no perfil do usuário
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.minPerfil) return true;
    return usuario && item.minPerfil.includes(usuario.perfilAcesso);
  });

  if (presentationMode) return null;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={classNames(
          'fixed left-0 top-0 h-full transition-theme sidebar-transition z-40',
          {
            'w-64': sidebarOpen,
            'w-20': !sidebarOpen,
          }
        )}
        style={{
          backgroundColor: 'var(--color-bg-main)',
          borderRight: '1px solid var(--color-secondary-200)',
        }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b"
             style={{ borderColor: 'var(--color-secondary-200)' }}>
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              {empresa?.logoUrl ? (
                <img 
                  src={empresa.logoUrl} 
                  alt={empresa.nome} 
                  className="w-8 h-8 rounded object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {empresa?.nome || 'VisionPlan'}
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              {empresa?.logoUrl ? (
                <img 
                  src={empresa.logoUrl} 
                  alt={empresa.nome} 
                  className="w-8 h-8 rounded object-contain"
                />
              ) : (
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                  <Box className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                      {
                        'bg-primary text-white': isActive,
                        'hover:bg-secondary-100': !isActive,
                        'justify-center': !sidebarOpen,
                      }
                    )
                  }
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="badge badge-danger text-xs">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 bg-primary text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
        >
          {sidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* User Section */}
        <div className="border-t p-4"
             style={{ borderColor: 'var(--color-secondary-200)' }}>
          {sidebarOpen && usuario && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {usuario.nome}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {usuario.perfilAcesso.replace(/_/g, ' ')}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Sair"
              >
                <LogOut className="w-5 h-5 text-red-500" />
              </button>
            </div>
          )}
          {!sidebarOpen && usuario && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
