import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTemaStore } from '../../stores/temaStore';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Calendar, 
  AlertTriangle, 
  Box,
  FileText,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Network
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { usuario, logout } = useAuthStore();
  const { tema } = useTemaStore();
  const location = useLocation();

  const menuItems = [
    { 
      icon: LayoutDashboard, 
      label: 'Dashboard', 
      path: '/dashboard',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Network, 
      label: 'WBS - Todos Projetos', 
      path: '/wbs',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Calendar, 
      label: 'Gantt / Cronograma', 
      path: '/cronograma/proj-1',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: KanbanSquare, 
      label: 'Kanban de Execução', 
      path: '/kanban',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'COLABORADOR', 'ENCARREGADO', 'MESTRE_OBRAS', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: FileText, 
      label: 'LPS', 
      path: '/lps',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: AlertTriangle, 
      label: 'Restrições', 
      path: '/restricoes',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
    { 
      icon: Box, 
      label: 'BIM / 4D', 
      path: '/bim',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA']
    },
    { 
      icon: FileText, 
      label: 'Relatórios', 
      path: '/relatorios',
      roles: ['ADMIN', 'DIRETOR', 'GERENTE_PROJETO', 'ENGENHEIRO_PLANEJAMENTO', 'COORDENADOR_OBRA', 'FISCALIZACAO_LEAD']
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    usuario && item.roles.includes(usuario.perfilAcesso)
  );

  return (
    <div className="min-h-screen flex theme-bg-background">
      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarOpen ? 'w-64' : 'lg:w-20'}
          theme-surface border-r theme-border-primary
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b theme-border-primary">
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <div 
                  className="w-10 h-10 rounded-lg theme-bg-primary flex items-center justify-center"
                  style={{ backgroundColor: tema.primary }}
                >
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <span className="font-bold text-xl theme-text">VisionPlan</span>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {filteredMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path === '/admin' && location.pathname.startsWith('/admin'));
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center space-x-3 px-4 py-3 rounded-lg
                        transition-all duration-200
                        ${isActive 
                          ? 'theme-bg-primary text-white' 
                          : 'hover:bg-gray-100 theme-text'
                        }
                      `}
                      style={isActive ? { backgroundColor: tema.primary } : {}}
                    >
                      <Icon size={20} />
                      {sidebarOpen && <span className="font-medium">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t theme-border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full theme-bg-primary flex items-center justify-center text-white">
                <User size={20} />
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="font-medium theme-text text-sm">{usuario?.nome}</p>
                  <p className="text-xs theme-text-secondary">{usuario?.perfilAcesso.replace('_', ' ')}</p>
                </div>
              )}
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-gray-100 theme-text-secondary"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="theme-surface border-b theme-border-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
            
            <div className="flex items-center space-x-4 ml-auto">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 theme-bg-danger rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 h-[calc(100vh-73px)] overflow-y-auto">
          {children || <Outlet />}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
