import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  Calendar,
  ListTodo,
  AlertTriangle,
  CheckSquare,
  Box,
  TrendingUp,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Palette,
} from 'lucide-react';
import classNames from 'classnames';
import { useUIStore, useAuthStore } from '../../store';
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
    id: 'projetos',
    label: 'Projetos',
    icon: <Folder className="w-5 h-5" />,
    path: '/projetos',
  },
  {
    id: 'planejamento',
    label: 'Planejamento',
    icon: <Calendar className="w-5 h-5" />,
    path: '/planejamento',
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
    id: 'kanban',
    label: 'Minhas Tarefas',
    icon: <CheckSquare className="w-5 h-5" />,
    path: '/kanban',
  },
  {
    id: 'bim',
    label: 'BIM 4D',
    icon: <Box className="w-5 h-5" />,
    path: '/bim',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    path: '/analytics',
  },
  {
    id: 'usuarios',
    label: 'Gestão de Usuários',
    icon: <Users className="w-5 h-5" />,
    path: '/admin/usuarios',
    minPerfil: [PerfilAcesso.ADMIN, PerfilAcesso.DIRETOR],
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <Settings className="w-5 h-5" />,
    path: '/configuracoes',
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar, presentationMode } = useUIStore();
  const { usuario } = useAuthStore();

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
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                VisionPlan
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
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
                  {usuario.perfilAcesso.replace('_', ' ')}
                </p>
              </div>
            </div>
          )}
          {!sidebarOpen && usuario && (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                {usuario.nome.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
