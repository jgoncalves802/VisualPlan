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
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface MenuItem {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  roles: string[];
  group?: string;
}

interface MenuGroup {
  id: string;
  label: string;
  items: MenuItem[];
}

interface LayoutShellProps {
  children: React.ReactNode;
  menuItems: MenuItem[];
  menuGroups?: MenuGroup[];
  title: string;
  subtitle?: string;
  logoLetter: string;
  logoColor?: string;
  noPadding?: boolean;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({
  children,
  menuItems,
  menuGroups,
  title,
  subtitle,
  logoLetter,
  logoColor,
  noPadding = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['planejamento', 'gestao', 'analise']));
  const { usuario, logout } = useAuthStore();
  const { tema } = useTemaStore();
  const { adminMode, toggleAdminMode } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const isAdmin = usuario?.perfilAcesso === PerfilAcesso.ADMIN;
  const isDarkMode = tema.background === '#1a1a2e' || tema.background === '#0f172a';

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

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const bgColor = logoColor || tema.primary;
  const sidebarExpanded = isHovered;

  const sidebarBg = isDarkMode ? 'bg-gray-900' : 'bg-white';
  const sidebarBorder = isDarkMode ? 'border-gray-800' : 'border-gray-200';
  const textColor = isDarkMode ? 'text-gray-300' : 'text-gray-600';
  const textHoverColor = isDarkMode ? 'hover:text-white' : 'hover:text-gray-900';
  const activeTextColor = isDarkMode ? 'text-white' : 'text-gray-900';
  const hoverBg = isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-100';
  const activeBg = isDarkMode ? 'bg-gray-800' : 'bg-gray-100';
  const groupLabelColor = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || 
      (item.path !== '/' && location.pathname.startsWith(item.path));
    
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          className={`
            flex items-center h-9 px-2 rounded-md
            transition-colors duration-150
            ${isActive 
              ? `${activeBg} ${activeTextColor}` 
              : `${hoverBg} ${textColor} ${textHoverColor}`
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
    );
  };

  const renderMenuGroup = (group: MenuGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const filteredItems = group.items.filter(item => 
      usuario && item.roles.includes(usuario.perfilAcesso)
    );

    if (filteredItems.length === 0) return null;

    return (
      <div key={group.id} className="mb-2">
        {sidebarExpanded ? (
          <>
            <button
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium uppercase tracking-wider ${groupLabelColor} ${hoverBg} rounded`}
            >
              <span>{group.label}</span>
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {isExpanded && (
              <ul className="mt-1 space-y-0.5">
                {filteredItems.map(renderMenuItem)}
              </ul>
            )}
          </>
        ) : (
          <ul className="space-y-0.5">
            {filteredItems.map(renderMenuItem)}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ backgroundColor: tema.background }}>
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50
          transition-all duration-200 ease-in-out
          ${sidebarBg} border-r ${sidebarBorder}
          flex flex-col
          ${sidebarExpanded ? 'w-56' : 'w-14'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`flex items-center h-14 px-3 border-b ${sidebarBorder}`}>
          <div 
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-white font-bold text-sm">{logoLetter}</span>
          </div>
          {sidebarExpanded && (
            <div className="ml-3 overflow-hidden">
              <span className={`font-semibold text-sm whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{title}</span>
              {subtitle && (
                <span className={`block text-xs whitespace-nowrap ${groupLabelColor}`}>{subtitle}</span>
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="px-2">
            {menuGroups ? (
              menuGroups.map(renderMenuGroup)
            ) : (
              <ul className="space-y-0.5">
                {filteredMenuItems.map(renderMenuItem)}
              </ul>
            )}
          </div>
        </nav>

        <div className={`border-t ${sidebarBorder} p-2`}>
          <div className={`flex items-center h-10 px-2 rounded-md ${hoverBg} transition-colors`}>
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              {usuario?.nome?.charAt(0) || 'U'}
            </div>
            {sidebarExpanded && (
              <div className="ml-3 flex-1 overflow-hidden">
                <p className={`text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{usuario?.nome}</p>
                <p className={`text-xs truncate ${groupLabelColor}`}>{usuario?.perfilAcesso?.replace('_', ' ')}</p>
              </div>
            )}
            {sidebarExpanded && (
              <button
                onClick={logout}
                className={`p-1.5 rounded ${hoverBg} ${textColor} ${textHoverColor}`}
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-200 ${sidebarExpanded ? 'ml-56' : 'ml-14'}`}>
        <header className="h-14 border-b px-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: tema.surface, borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
          <div className="flex items-center">
            {isAdmin && (
              <button
                onClick={handleToggleAdminMode}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  adminMode 
                    ? 'bg-indigo-600 text-white' 
                    : isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <button className={`relative p-2 rounded-md ${hoverBg} ${textColor}`}>
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button className={`p-2 rounded-md ${hoverBg} ${textColor}`}>
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
