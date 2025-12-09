import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useTemaStore } from '../../stores/temaStore';
import { useUIStore } from '../../stores/uiStore';
import { PerfilAcesso } from '../../types';
import { 
  LogOut,
  Bell,
  User,
  Settings,
  Eye
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface MenuItem {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  path: string;
  roles: string[];
  separator?: boolean;
}

interface LayoutShellProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  title: string;
  subtitle?: string;
  logoLetter: string;
  logoColor?: string;
  noPadding?: boolean;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  children,
  menuItems,
  title,
  subtitle,
  logoLetter,
  logoColor,
  noPadding = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { usuario, logout } = useAuthStore();
  const { tema } = useTemaStore();
  const { adminMode, toggleAdminMode } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdmin = usuario?.perfilAcesso === PerfilAcesso.ADMIN;

  const filteredMenuItems = menuItems.filter(item => 
    usuario && item.roles.includes(usuario.perfilAcesso)
  );

  const handleToggleAdminMode = () => {
    toggleAdminMode();
    if (!adminMode) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const bgColor = logoColor || tema.primary;
  const sidebarExpanded = isHovered;

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50
          transition-all duration-200 ease-in-out
          bg-gray-900 text-gray-300
          flex flex-col
          ${sidebarExpanded ? 'w-56' : 'w-14'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center h-14 px-3 border-b border-gray-800">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-white font-bold text-sm">{logoLetter}</span>
          </div>
          {sidebarExpanded && (
            <div className="ml-3 overflow-hidden">
              <span className="font-semibold text-white text-sm whitespace-nowrap">{title}</span>
              {subtitle && (
                <span className="block text-xs text-gray-400 whitespace-nowrap">{subtitle}</span>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2">
            {filteredMenuItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <React.Fragment key={item.path}>
                  {item.separator && index > 0 && (
                    <li className="my-2 border-t border-gray-800" />
                  )}
                  <li>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center h-9 px-2 rounded-md
                        transition-colors duration-150
                        ${isActive 
                          ? 'bg-gray-800 text-white' 
                          : 'hover:bg-gray-800/50 text-gray-400 hover:text-white'
                        }
                      `}
                      title={!sidebarExpanded ? item.label : undefined}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {sidebarExpanded && (
                        <span className="ml-3 text-sm whitespace-nowrap overflow-hidden">{item.label}</span>
                      )}
                    </Link>
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-gray-800 p-2">
          <div className="flex items-center h-10 px-2 rounded-md hover:bg-gray-800/50 transition-colors">
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              {usuario?.nome?.charAt(0) || 'U'}
            </div>
            {sidebarExpanded && (
              <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm text-white truncate">{usuario?.nome}</p>
                <p className="text-xs text-gray-500 truncate">{usuario?.perfilAcesso?.replace('_', ' ')}</p>
              </div>
            )}
            {sidebarExpanded && (
              <button
                onClick={logout}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${sidebarExpanded ? 'ml-56' : 'ml-14'}`}>
        <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center">
            {isAdmin && (
              <button
                onClick={handleToggleAdminMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  adminMode 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {adminMode ? (
                  <>
                    <Eye size={16} />
                    <span>Visualizar App</span>
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    <span>Gestão</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 rounded-md hover:bg-gray-100 text-gray-600">
              <User size={18} />
            </button>
          </div>
        </header>

        <div className={`flex-1 overflow-auto ${noPadding ? '' : 'p-6'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};
